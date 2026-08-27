import {
  assessClarification,
  mergeClarifications,
  normalizeClarifications
} from './clarification.js';
import { assertNeutralPacket, validateNeutralPacket, validateRoleOutput } from './validation.js';

const ANALYSIS_ROLES = ['advocate', 'opponent', 'verifier'];

function asRoleOutput(role, value) {
  if (value && typeof value === 'object' && value.role && value.status) return value;
  return { role, status: 'ok', output: value ?? null };
}

function roleFailure(role, error) {
  return {
    role,
    status: 'failed',
    error: error instanceof Error ? error.message : String(error || 'role failed')
  };
}

function roleInput(packet) {
  // JSON serialization gives adapters a stable, byte-for-byte representation.
  return JSON.stringify(packet);
}

function hasContamination(output) {
  return output.status === 'contaminated' || output.contaminated_input === true;
}

function missingAnswers(questions, answers) {
  return questions.filter(question => question.required && !answerIsUsable(answers?.[question.id]));
}

function answerIsUsable(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && value !== null) {
    if (value.status === 'declined' || value.status === 'unavailable') return false;
    if ('value' in value) return answerIsUsable(value.value);
  }
  const text = String(value).trim().toLowerCase();
  return text.length > 0 && !['unavailable', 'غير_متاح', 'لا أعرف', 'لا اعرف'].includes(text);
}

function statusFor(clarification) {
  return clarification?.clarification_status || (clarification?.needs_clarification ? 'partial' : 'complete');
}

function resultWithClarification(fields, clarification) {
  return {
    ...fields,
    clarification,
    clarification_status: statusFor(clarification)
  };
}

/**
 * Provider-neutral Decision Board orchestration.
 *
 * Required host functions:
 *   diagnose({ request, clarifications }) -> { depth, neutral_packet }
 *   runRole({ role, input, depth }) -> role output
 * Optional host functions:
 *   askUser(questions, round) -> { [questionId]: answer } | { status, answers }
 *   renderFinal({ packet, roles, depth, language }) -> string
 *   persistJournal(entry) -> Promise<void>
 */
export async function runDecisionBoard({
  request,
  diagnose,
  runRole,
  askUser,
  renderFinal,
  persistJournal,
  options = {}
}) {
  if (typeof request !== 'string' || !request.trim()) throw new TypeError('request must be a non-empty string');
  if (typeof diagnose !== 'function') throw new TypeError('diagnose must be a function');
  if (typeof runRole !== 'function') throw new TypeError('runRole must be a function');

  const maxClarificationRounds = Number.isInteger(options.maxClarificationRounds)
    ? Math.max(0, Math.min(2, options.maxClarificationRounds))
    : 2;
  let clarifications = {};
  let diagnosis = await diagnose({ request, clarifications });
  let packet = diagnosis?.neutral_packet;
  let depth = diagnosis?.depth;
  let clarification = assessClarification({
    prompt: request,
    depth,
    facts: packet?.facts,
    options: packet?.options,
    constraints: packet?.constraints,
    resources: packet?.resources_and_capabilities,
    clarifications,
    round: 0
  });

  for (let round = 0; round < maxClarificationRounds && clarification.needs_clarification; round += 1) {
    if (typeof askUser !== 'function') {
      return resultWithClarification({
        status: 'needs_clarification',
        depth,
        questions: clarification.questions,
        missing: clarification.missing
      }, clarification);
    }

    const questions = clarification.questions.slice(0, clarification.max_questions);
    const response = await askUser(questions, round + 1);
    const answerMap = response && typeof response === 'object' && 'answers' in response
      ? response.answers
      : response;
    const normalizedAnswers = normalizeClarifications(answerMap);
    const unanswered = missingAnswers(questions, normalizedAnswers);

    // A declined or unknown answer is explicit data, not a reason to invent a value.
    for (const question of unanswered) normalizedAnswers[question.id] = 'unavailable';
    clarifications = { ...clarifications, ...normalizedAnswers };

    diagnosis = await diagnose({
      request,
      clarifications: { ...clarifications }
    });
    packet = mergeClarifications(diagnosis?.neutral_packet || packet, normalizedAnswers);
    depth = diagnosis?.depth ?? depth;
    clarification = assessClarification({
      prompt: request,
      depth,
      facts: packet?.facts,
      options: packet?.options,
      constraints: packet?.constraints,
      resources: packet?.resources_and_capabilities,
      clarifications,
      round: round + 1
    });
  }

  if (depth === 1) {
    const direct = typeof renderFinal === 'function'
      ? await renderFinal({ packet: packet || null, roles: [], depth, language: packet?.language })
      : diagnosis?.direct_response || '';
    return resultWithClarification({
      status: 'direct',
      depth,
      final: direct,
      diagnosis
    }, clarification);
  }

  const packetValidation = validateNeutralPacket(packet);
  if (!packetValidation.valid) {
    return resultWithClarification({
      status: 'needs_clarification',
      depth,
      packet: packet || null,
      missing: clarification.missing,
      error: `neutral packet unavailable after clarification: ${packetValidation.errors.join('; ')}`
    }, clarification);
  }

  assertNeutralPacket(packet);
  const input = roleInput(packet);
  const rolesToRun = depth === 3 ? [...ANALYSIS_ROLES, 'executor'] : ANALYSIS_ROLES;
  const roleResults = await Promise.all(rolesToRun.map(async role => {
    try {
      const raw = await runRole({ role, input, depth });
      const output = asRoleOutput(role, raw);
      const validation = validateRoleOutput(output);
      return validation.valid ? output : roleFailure(role, validation.errors.join('; '));
    } catch (error) {
      return roleFailure(role, error);
    }
  }));

  const contaminated = roleResults.filter(hasContamination);
  if (contaminated.length > 0) {
    return resultWithClarification({
      status: 'contaminated',
      depth,
      packet,
      roles: roleResults,
      retry: 're-diagnose and issue a clean packet; do not ask roles to ignore the leak'
    }, clarification);
  }

  if (roleResults.some(result => result.role === 'opponent' && result.status !== 'ok')) {
    return resultWithClarification({
      status: 'failed',
      depth,
      packet,
      roles: roleResults,
      error: 'opponent is required; do not rank a decision without an opposing view'
    }, clarification);
  }

  let arbiter = null;
  if (depth === 3) {
    try {
      const raw = await runRole({
        role: 'arbiter',
        input: JSON.stringify({ packet, roles: roleResults }),
        depth
      });
      arbiter = asRoleOutput('arbiter', raw);
      const validation = validateRoleOutput(arbiter);
      if (!validation.valid) arbiter = roleFailure('arbiter', validation.errors.join('; '));
    } catch (error) {
      arbiter = roleFailure('arbiter', error);
    }
  }

  const allRoles = arbiter ? [...roleResults, arbiter] : roleResults;
  const final = typeof renderFinal === 'function'
    ? await renderFinal({ packet, roles: allRoles, depth, language: packet.language })
    : null;

  const result = resultWithClarification({
    status: 'ok',
    depth,
    packet,
    roles: allRoles,
    final
  }, clarification);

  if (typeof persistJournal === 'function' && options.decisionConfirmed === true) {
    await persistJournal({
      packet,
      prediction: options.prediction || null,
      confidence_at_decision: options.confidence_at_decision ?? null,
      review_due: options.review_due || null
    });
  }

  return result;
}
