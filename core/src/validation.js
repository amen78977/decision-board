const ROLE_NAMES = new Set(['diagnostician', 'verifier', 'advocate', 'opponent', 'executor', 'arbiter']);
const STATUSES = new Set(['ok', 'contaminated', 'failed', 'unavailable']);
const CLARIFICATION_STATUSES = new Set(['complete', 'partial', 'unavailable']);
const ANSWER_TYPES = new Set(['text', 'number', 'boolean', 'choice', 'date']);
const SENSITIVITIES = new Set(['normal', 'sensitive']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateNeutralPacket(packet) {
  const errors = [];
  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    return { valid: false, errors: ['packet must be an object'] };
  }
  for (const key of ['decision', 'facts', 'constraints', 'resources_and_capabilities', 'options', 'depth', 'language']) {
    if (!(key in packet)) errors.push(`missing ${key}`);
  }
  if (!isNonEmptyString(packet.decision)) errors.push('decision must be a non-empty string');
  if (!Array.isArray(packet.options) || packet.options.length < 2 || packet.options.length > 8) {
    errors.push('options must contain 2 to 8 items');
  } else {
    const ids = new Set();
    packet.options.forEach((option, index) => {
      if (!option || typeof option !== 'object') errors.push(`options[${index}] must be an object`);
      else {
        if (!isNonEmptyString(option.id)) errors.push(`options[${index}].id must be a non-empty string`);
        if (!isNonEmptyString(option.text)) errors.push(`options[${index}].text must be a non-empty string`);
        if (ids.has(option.id)) errors.push(`duplicate option id: ${option.id}`);
        ids.add(option.id);
      }
    });
  }
  for (const key of ['facts', 'constraints', 'resources_and_capabilities']) {
    if (!Array.isArray(packet[key]) || packet[key].some(item => !isNonEmptyString(item))) {
      errors.push(`${key} must be an array of strings`);
    }
  }
  if (![2, 3].includes(packet.depth)) errors.push('depth must be 2 or 3');
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(String(packet.language || ''))) {
    errors.push('language must be a BCP-47-like language code');
  }
  return { valid: errors.length === 0, errors };
}

export function validateClarificationQuestion(question) {
  const errors = [];
  if (!question || typeof question !== 'object' || Array.isArray(question)) {
    return { valid: false, errors: ['question must be an object'] };
  }
  if (!/^[a-z][a-z0-9_]{2,48}$/.test(String(question.id || ''))) errors.push('question id is invalid');
  if (!isNonEmptyString(question.question) || question.question.length < 8) errors.push('question text is too short');
  if (!isNonEmptyString(question.why_it_matters) || question.why_it_matters.length < 8) errors.push('why_it_matters is too short');
  if (!ANSWER_TYPES.has(question.answer_type)) errors.push('answer_type is invalid');
  if (typeof question.required !== 'boolean') errors.push('required must be boolean');
  if (question.sensitivity !== undefined && !SENSITIVITIES.has(question.sensitivity)) errors.push('sensitivity is invalid');
  if (question.choices !== undefined && (!Array.isArray(question.choices) || question.choices.length > 8 || question.choices.some(item => !isNonEmptyString(item)))) {
    errors.push('choices must be up to 8 non-empty strings');
  }
  return { valid: errors.length === 0, errors };
}

export function validateClarificationBatch(batch) {
  const errors = [];
  if (!batch || typeof batch !== 'object' || Array.isArray(batch)) {
    return { valid: false, errors: ['clarification batch must be an object'] };
  }
  if (!CLARIFICATION_STATUSES.has(batch.clarification_status)) errors.push('clarification_status is invalid');
  if (typeof batch.needs_clarification !== 'boolean') errors.push('needs_clarification must be boolean');
  if (!Array.isArray(batch.questions)) errors.push('questions must be an array');
  if (!Array.isArray(batch.missing)) errors.push('missing must be an array');
  if (!Number.isInteger(batch.max_questions) || batch.max_questions < 0 || batch.max_questions > 6) errors.push('max_questions must be an integer from 0 to 6');
  if (!Number.isInteger(batch.round) || batch.round < 0 || batch.round > 2) errors.push('round must be an integer from 0 to 2');

  const questions = Array.isArray(batch.questions) ? batch.questions : [];
  const ids = new Set();
  questions.forEach((question, index) => {
    const result = validateClarificationQuestion(question);
    result.errors.forEach(error => errors.push(`questions[${index}]: ${error}`));
    if (question?.id && ids.has(question.id)) errors.push(`duplicate question id: ${question.id}`);
    if (question?.id) ids.add(question.id);
  });
  if (batch.needs_clarification === true && (questions.length < 3 || questions.length > 6)) {
    errors.push('clarification batch must contain 3 to 6 questions when clarification is needed');
  }
  if (batch.needs_clarification === false && questions.length !== 0) errors.push('questions must be empty when clarification is not needed');
  if (batch.max_questions < questions.length) errors.push('max_questions cannot be below question count');
  return { valid: errors.length === 0, errors };
}

export function validateRoleOutput(output) {
  const errors = [];
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    return { valid: false, errors: ['role output must be an object'] };
  }
  if (!ROLE_NAMES.has(output.role)) errors.push('role is unknown');
  if (!STATUSES.has(output.status)) errors.push('status is invalid');
  if (output.status === 'contaminated' && output.contaminated_input !== true) {
    errors.push('contaminated output must set contaminated_input=true');
  }
  if (['failed', 'unavailable'].includes(output.status) && !isNonEmptyString(output.error)) {
    errors.push('failed or unavailable output needs an error');
  }
  return { valid: errors.length === 0, errors };
}

export function assertNeutralPacket(packet) {
  const result = validateNeutralPacket(packet);
  if (!result.valid) throw new Error(`Invalid neutral packet: ${result.errors.join('; ')}`);
  return packet;
}

export function assertRoleOutput(output) {
  const result = validateRoleOutput(output);
  if (!result.valid) throw new Error(`Invalid role output: ${result.errors.join('; ')}`);
  return output;
}

export function assertClarificationBatch(batch) {
  const result = validateClarificationBatch(batch);
  if (!result.valid) throw new Error(`Invalid clarification batch: ${result.errors.join('; ')}`);
  return batch;
}
