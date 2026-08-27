const QUESTION_LIBRARY = [
  {
    id: 'decision_outcome',
    question: 'ما النتيجة التي تريد تحقيقها من هذا القرار، وكيف ستعرف بعد فترة أن القرار نجح؟',
    why_it_matters: 'من دون نتيجة قابلة للملاحظة لا يمكن ترتيب الخيارات أو تحديد ما يبطله.',
    answer_type: 'text',
    required: true,
    sensitivity: 'normal',
    keywords: ['قرار', 'أفعل', 'اختار', 'should', 'choose', 'decide', 'option']
  },
  {
    id: 'options',
    question: 'ما الخيارات الواقعية الموجودة الآن؟ اذكر خيار عدم الفعل أو التأجيل إن كان ممكنًا.',
    why_it_matters: 'التحليل لا يستطيع مقارنة مسار واحد أو خيارات صاغها الوكيل من عنده.',
    answer_type: 'text',
    required: true,
    sensitivity: 'normal',
    keywords: ['بين', 'خيار', 'بديل', 'which', 'between', 'alternative']
  },
  {
    id: 'deadline',
    question: 'متى يجب اتخاذ القرار، وما الذي يحدث إن لم تتخذ قرارًا قبل ذلك الموعد؟',
    why_it_matters: 'المهلة وتكلفة التأجيل قد تغيران مستوى العمق وترتيب الخيارات.',
    answer_type: 'date',
    required: true,
    sensitivity: 'normal',
    keywords: ['متى', 'موعد', 'مهلة', 'اليوم', 'غدًا', 'deadline', 'when', 'soon']
  },
  {
    id: 'reversibility',
    question: 'إذا اخترت هذا المسار، ما الذي يصعب التراجع عنه أو لا يمكن استعادته؟',
    why_it_matters: 'قابلية التراجع هي البوابة التي تحدد هل نحتاج تحليلًا خفيفًا أم الطاولة كاملة.',
    answer_type: 'text',
    required: true,
    sensitivity: 'normal',
    keywords: ['لا يمكن', 'نهائي', 'التراجع', 'irreversible', 'cannot undo', 'locked']
  },
  {
    id: 'constraints',
    question: 'ما القيود الصلبة التي لا يمكن تجاوزها، مثل المال أو الوقت أو الالتزامات أو القواعد؟',
    why_it_matters: 'خيار يبدو جيدًا نظريًا قد يكون غير ممكن تحت القيود الفعلية.',
    answer_type: 'text',
    required: true,
    sensitivity: 'sensitive',
    keywords: ['ميزانية', 'مال', 'وقت', 'التزام', 'قيد', 'budget', 'time', 'constraint', 'obligation']
  },
  {
    id: 'resources',
    question: 'ما الموارد المتاحة فعليًا: مال، وقت، مهارات، سلطة، بيانات، أو أشخاص يمكنهم المساعدة؟',
    why_it_matters: 'التنفيذ يحتاج موارد ملموسة، لا افتراضات عامة عن القدرة.',
    answer_type: 'text',
    required: true,
    sensitivity: 'normal',
    keywords: ['موارد', 'قدرات', 'مدخرات', 'فريق', 'خبرة', 'resources', 'skills', 'team']
  },
  {
    id: 'stakeholders',
    question: 'من سيتأثر بالقرار، ومن يملك القدرة على تعطيله أو تغييره دون أن يعلن ذلك؟',
    why_it_matters: 'الأثر البشري والسياسي قد يقلب الترتيب حتى عندما تبدو الحسابات الاقتصادية سليمة.',
    answer_type: 'text',
    required: false,
    sensitivity: 'sensitive',
    keywords: ['فريق', 'شريك', 'عميل', 'عائلة', 'موظف', 'team', 'partner', 'customer', 'family']
  },
  {
    id: 'evidence',
    question: 'ما أهم واقعة أو رقم يبني عليه قرارك، وما مصدره أو طريقة التحقق منه؟',
    why_it_matters: 'واقعة حرجة غير متحققة يجب أن تظهر قبل أي توصية، لا أن تتحول إلى إجماع زائف.',
    answer_type: 'text',
    required: true,
    sensitivity: 'normal',
    keywords: ['رقم', 'دليل', 'مصدر', 'بيانات', 'نمو', 'معدل', 'number', 'evidence', 'source', 'rate']
  },
  {
    id: 'risk_tolerance',
    question: 'ما مقدار الخسارة أو عدم اليقين الذي تقبله مقابل الفائدة المحتملة؟',
    why_it_matters: 'ترتيب الخيارات يعتمد على عتبة الخطر التي يوافق عليها صاحب القرار، لا على متوسط افتراضي.',
    answer_type: 'text',
    required: false,
    sensitivity: 'normal',
    keywords: ['خطر', 'مخاطرة', 'عدم يقين', 'risk', 'uncertainty']
  },
  {
    id: 'non_negotiables',
    question: 'ما الشيء الذي لا يمكن التضحية به حتى لو زادت فائدة الخيار الآخر؟',
    why_it_matters: 'يكشف القيود غير القابلة للمقايضة التي قد تستبعد خياراً يبدو أفضل حسابياً.',
    answer_type: 'text',
    required: false,
    sensitivity: 'normal',
    keywords: ['لا يمكن التضحية', 'غير قابل للتفاوض', 'non-negotiable']
  },
  {
    id: 'alternatives_status',
    question: 'ما الذي جُرّب أو رُفض من البدائل، ولماذا؟',
    why_it_matters: 'يمنع إعادة اقتراح بديل غير واقعي ويكشف معلومات سابقة لا تظهر في الخيارين الحاليين.',
    answer_type: 'text',
    required: false,
    sensitivity: 'normal',
    keywords: ['جربت', 'رُفض', 'بدائل', 'tried', 'rejected', 'alternatives']
  },
  {
    id: 'review_trigger',
    question: 'ما الإشارة المبكرة التي ستجعلك تعيد النظر في القرار، ومتى ستراجع النتيجة؟',
    why_it_matters: 'يحوّل القرار إلى تجربة قابلة للمراجعة بدلاً من التزام أعمى.',
    answer_type: 'text',
    required: false,
    sensitivity: 'normal',
    keywords: ['مراجعة', 'إشارة', 'يعيد النظر', 'review', 'trigger']
  }
];

const QUESTION_BY_ID = new Map(QUESTION_LIBRARY.map(question => [question.id, question]));
const UNAVAILABLE = 'unavailable';
const MAX_ANSWER_LENGTH = 1200;

function normalized(text) {
  return String(text || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u064B-\u065F\u0670ـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasSignal(text, keywords) {
  const value = normalized(text);
  return keywords.some(keyword => value.includes(normalized(keyword)));
}

function countMeaningfulFacts(prompt) {
  const value = normalized(prompt);
  const numericFacts = (value.match(/\b\d+(?:[.,]\d+)?\b/g) || []).length;
  const sentenceParts = value.split(/[.!?؟\n]+/).map(part => part.trim()).filter(Boolean);
  return Math.min(8, numericFacts + sentenceParts.length);
}

function answerWasProvided(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && value !== null) {
    if (value.status === 'declined' || value.status === UNAVAILABLE) return false;
    if ('value' in value) return answerWasProvided(value.value);
  }
  return String(value).trim().length > 0 && normalized(value) !== UNAVAILABLE;
}

function unavailableAnswer(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object' && value !== null) {
    return value.status === 'declined' || value.status === UNAVAILABLE || ('value' in value && !answerWasProvided(value.value));
  }
  return normalized(value) === UNAVAILABLE || normalized(value) === 'لا اعرف' || normalized(value) === 'لا أستطيع الإجابة';
}

function sanitizeAnswer(value) {
  const candidate = typeof value === 'object' && value !== null && 'value' in value ? value.value : value;
  const text = String(candidate ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ANSWER_LENGTH);
  return text;
}

function safeAnswer(value) {
  if (unavailableAnswer(value) || !sanitizeAnswer(value)) return UNAVAILABLE;
  return sanitizeAnswer(value);
}

function questionFor(id) {
  return QUESTION_BY_ID.get(id);
}

function defaultQuestions(prompt, depth, missing, answeredIds = new Set()) {
  const targeted = new Set(missing);
  if (missing.includes('facts')) {
    targeted.add('decision_outcome');
    targeted.add('evidence');
  }
  if (missing.includes('constraints')) {
    targeted.add('deadline');
    targeted.add('reversibility');
  }

  const targetedCandidates = QUESTION_LIBRARY
    .filter(item => !answeredIds.has(item.id) && targeted.has(item.id))
    .map((item, index) => ({ ...item, priority: 200 - index * 4 }));
  const supplementalCandidates = QUESTION_LIBRARY
    .filter(item => !answeredIds.has(item.id) && !targeted.has(item.id))
    .filter(item => missing.length > 0 || hasSignal(prompt, item.keywords))
    .map((item, index) => ({ ...item, priority: 100 - index * 4 }));

  const limit = depth === 3 ? 6 : 5;
  const minimum = missing.length > 0 ? 3 : 0;
  return [...targetedCandidates, ...supplementalCandidates]
    .sort((left, right) => right.priority - left.priority)
    .slice(0, Math.max(minimum, limit))
    .slice(0, limit)
    .map(({ priority, keywords, ...question }) => question);
}

export function assessClarification({
  prompt,
  depth,
  facts = [],
  options = [],
  constraints = [],
  resources = [],
  clarifications = {},
  round = 0
}) {
  const source = String(prompt || '');
  const factCount = facts.filter(Boolean).length + countMeaningfulFacts(source);
  const optionCount = options.filter(Boolean).length;
  const missing = [];
  if (optionCount < 2) missing.push('options');
  if (factCount < 3) missing.push('facts');
  if (constraints.length === 0) missing.push('constraints');
  if (resources.length === 0) missing.push('resources');

  const unavailableIds = new Set(Object.entries(clarifications || {})
    .filter(([, value]) => unavailableAnswer(value))
    .map(([id]) => id));
  const answeredIds = new Set(Object.entries(clarifications || {})
    .filter(([, value]) => answerWasProvided(value))
    .map(([id]) => id));

  // An explicit refusal remains a missing field even when related answers populated the same array.
  for (const field of ['options', 'constraints', 'resources']) {
    if (unavailableIds.has(field) && !missing.includes(field)) missing.push(field);
  }

  // Level 1 is intentionally non-interrogative. It may still expose a diagnostic status.
  if (depth === 1) {
    return {
      needs_clarification: false,
      clarification_status: missing.length === 0 ? 'complete' : 'partial',
      missing,
      questions: [],
      max_questions: 0,
      round,
      reason: missing.length ? 'level_1_no_interrogation' : 'complete'
    };
  }

  const questions = defaultQuestions(source, depth, missing, new Set([...answeredIds, ...unavailableIds]))
    .filter(question => {
      if (question.id === 'options' && optionCount >= 2) return false;
      if (question.id === 'constraints' && constraints.length > 0) return false;
      if (question.id === 'resources' && resources.length > 0) return false;
      return true;
    });

  const allMissingUnavailable = missing.length > 0 && missing.every(field => {
    const related = field === 'facts' ? ['decision_outcome', 'evidence'] : [field];
    return related.some(id => unavailableIds.has(id));
  });
  const needsClarification = missing.length > 0 && !allMissingUnavailable && questions.length > 0;

  return {
    needs_clarification: needsClarification,
    clarification_status: missing.length === 0 ? 'complete' : allMissingUnavailable ? 'unavailable' : 'partial',
    missing,
    questions,
    max_questions: depth === 3 ? 6 : 5,
    round,
    reason: missing.length ? 'critical_fields_missing' : 'complete'
  };
}

function pushUnique(list, value) {
  if (!value || value === UNAVAILABLE) return;
  if (!list.some(item => item === value)) list.push(value);
}

function nextOptionId(options) {
  const used = new Set(options.map(option => option?.id));
  for (let index = 0; index < 26; index += 1) {
    const id = String.fromCharCode(65 + index);
    if (!used.has(id)) return id;
  }
  return `O${options.length + 1}`;
}

function parseOptions(answer, existing) {
  const parts = sanitizeAnswer(answer)
    .split(/\n|;|،|,/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  const options = [...existing];
  for (const text of parts) {
    if (options.length >= 8) break;
    if (!options.some(option => option.text === text)) options.push({ id: nextOptionId(options), text });
  }
  return options;
}

function safeAnswerMap(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return {};
  const result = {};
  for (const question of QUESTION_LIBRARY) {
    if (Object.prototype.hasOwnProperty.call(answers, question.id)) {
      result[question.id] = safeAnswer(answers[question.id]);
    }
  }
  return result;
}

export function mergeClarifications(base = {}, answers = {}) {
  const source = base && typeof base === 'object' && !Array.isArray(base) ? base : {};
  const safeAnswers = safeAnswerMap(answers);
  const facts = Array.isArray(source.facts) ? [...source.facts] : [];
  const constraints = Array.isArray(source.constraints) ? [...source.constraints] : [];
  const resources = Array.isArray(source.resources_and_capabilities) ? [...source.resources_and_capabilities] : [];
  const options = Array.isArray(source.options) ? source.options.map(option => ({ ...option })) : [];

  if (safeAnswers.decision_outcome && safeAnswers.decision_outcome !== UNAVAILABLE) pushUnique(facts, `user_reported_success_outcome: ${safeAnswers.decision_outcome}`);
  if (safeAnswers.deadline && safeAnswers.deadline !== UNAVAILABLE) pushUnique(constraints, `user_reported_decision_deadline: ${safeAnswers.deadline}`);
  if (safeAnswers.reversibility && safeAnswers.reversibility !== UNAVAILABLE) pushUnique(constraints, `user_reported_reversibility: ${safeAnswers.reversibility}`);
  if (safeAnswers.constraints && safeAnswers.constraints !== UNAVAILABLE) pushUnique(constraints, `user_reported_hard_constraints: ${safeAnswers.constraints}`);
  if (safeAnswers.resources && safeAnswers.resources !== UNAVAILABLE) pushUnique(resources, `user_reported_available_resources: ${safeAnswers.resources}`);
  if (safeAnswers.stakeholders && safeAnswers.stakeholders !== UNAVAILABLE) pushUnique(constraints, `user_reported_stakeholders_and_blockers: ${safeAnswers.stakeholders}`);
  if (safeAnswers.evidence && safeAnswers.evidence !== UNAVAILABLE) pushUnique(facts, `user_reported_evidence_and_source: ${safeAnswers.evidence}`);
  if (safeAnswers.options && safeAnswers.options !== UNAVAILABLE) {
    const parsed = parseOptions(safeAnswers.options, options);
    options.splice(0, options.length, ...parsed);
  }

  return { ...source, facts, constraints, resources_and_capabilities: resources, options };
}

export {
  QUESTION_LIBRARY,
  UNAVAILABLE,
  sanitizeAnswer,
  safeAnswerMap as normalizeClarifications
};
