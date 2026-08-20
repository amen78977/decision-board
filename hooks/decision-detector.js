#!/usr/bin/env node
/**
 * UserPromptSubmit — كاشف القرارات.
 *
 * لماذا يوجد: وصف المهارة وحده يخسر المنافسة أمام موجّهات شخصية تحتكر
 * القرارات، وأمام إطار «مساعد هندسة برمجيات» الذي يجعل النموذج يردّ
 * «هذا ليس قرار برمجة». هذا الـ hook يجعل البلَغن مكتفياً بذاته: يكشف
 * صياغة القرار — استفهامية كانت أو خبرية — ويحقن تذكيراً موجزاً.
 *
 * لا يقرر ولا يستدعي أحداً. يذكّر فقط، وبوابة العمق (ج٩) تتكفّل بالباقي.
 * أي خطأ = خروج صامت بلا أثر على الجلسة.
 *
 * ثلاث ملاحظات للصيانة:
 *   ١. \b لا يعمل مع العربية في JS — لا تُضِفه إلى الأنماط العربية.
 *   ٢. تجريد الشيفرة يستخدم عمليات نصية لا تعابير نمطية — عمداً، لأن
 *      أنماط المسارات تحتاج شرطات مائلة كثيرة تُخطئ عند الصيانة.
 *   ٣. ترتيب الفحص في detect() جزء من العقد: الاستبعاد قبل الإيجاب دائماً.
 *      عكسه يجعل «هل يمكنك أن تصلح القرار في الملف» قراراً.
 */
'use strict';

// إعلان نية — لا يحمل علامة استفهام، وهو أخطر شكل للقرار
const DECLARATIVE = [
  /س(?:أ)?(?:ترك|أترك|ستثمر|أستثمر|ؤجل|أؤجل|بيع|أبيع|شتري|أشتري|نتقل|أنتقل|ستقيل|أستقيل|وظف|أوظف|غلق|أغلق|بدأ|أبدأ|طلق|أطلق|وقع|أوقع|قترض|أقترض|سافر|أسافر|تزوج|أتزوج|درس|أدرس|هاجر|أهاجر|شارك|أشارك|رفض|أرفض|قبل|أقبل)/,
  /(?:قررت|حسمتها|عزمت|ناوي|عازم|مصمم على|رح أ|راح أ|بدي أ|أبغى أ|بكرة أ|نويت|صممت على)/,
  /(?:i(?:'?m| am) (?:going to|about to|planning to|thinking of)|i(?:'ve| have) decided|i(?:'?ll| will) (?:quit|invest|sell|move|leave|resign|accept|reject|start|shut))/i,
  /(?:my mind is made up|i'?m committing to|decided to (?:quit|leave|invest|sell|move|start))/i,
  // الإعلان بصيغة المضارع المستمر — أشيع صورة للقرار بالإنجليزية، وأخطرها لأنها تصف
  // فعلاً جارياً لا نيةً مستقبلية. الأفعال محصورة عمداً بمفعول غير تقني:
  // «I'm moving to Berlin» قرار، و«I'm moving this file» ليس كذلك.
  /i(?:'?m| am) (?:quitting|resigning|dropping out|going full[- ]?time|relocating|hiring|firing (?:my|the)|investing (?:in|my)|buying (?:a|the) (?:house|car|company|business|apartment|flat)|selling (?:my|the) (?:company|business|house|car|stake|shares|apartment|flat)|leaving (?:my|the|this) (?:job|company|role|position|country|team)|moving (?:to|abroad|back|out|overseas|in with)|taking (?:the|this|that) (?:job|offer|role|position|deal)|turning down (?:the|this|their)|accepting (?:the|this|their) (?:job|offer|role|position)|shutting down (?:my|the) (?:company|business|startup|product))/i,
];

// سؤال عن قرار
const INTERROGATIVE = [
  /هل\s+(?:أ|ن|ي)\S*|أيهما\s+أفضل|أيهما\s+تنصح|ما\s+رأيك\s+في|أنصحني|انصحني|محتار|متردد|أفكر\s+في|أميل\s+(?:إلى|ل)|ماذا\s+(?:لو|أفعل)/,
  /(?:should i|shall i|which is better|which one should|what do you think about|help me (?:decide|choose)|is it worth|worth it to|am i (?:right|wrong) to|would you (?:quit|leave|invest))/i,
  /(?:torn between|stuck between|can'?t decide|not sure whether)/i,
];

/**
 * قرار **يملكه المستخدم أو يقف أمامه** — لا مجرد ورود الكلمة.
 *
 * الطبقة الثالثة كانت `/قرار|خيار|بديل|.../` مجردة، فتُفعّل على أي ذكر
 * للكلمة: «أعطيك جميع القرارات والصلاحيات» تفويضٌ لا استشارة، و«راجع
 * قرارات المعمارية» أمر عمل. إيجابية كاذبة رُصدت ميدانياً.
 *
 * الإحكام: تُشترط صيغة تملّك أو مواجهة — «قراري» · «أمامي قرار» ·
 * «بين خيارين». الكلمة وحدها موضوع؛ التملّك هو ما يجعلها قراراً.
 */
const VOCAB = new RegExp([
  'قراري|قرار(?:ي|ات)?\\s+(?:صعب|مصيري|مهم|كبير|حاسم)',
  '(?:أمامي|امامي|عندي|لديّ|لدي|أواجه|اواجه)\\s+(?:قرار|خيار|خياران|بديل)',
  'بين\\s+(?:خيارين|بديلين|أمرين|طريقين)',
  '(?:هذا|هذه)\\s+(?:القرار|الخيار)',
  '(?:مقايضة|مفاضلة|معضلة)',
  'my (?:decision|choice|call)|(?:tough|big|hard) (?:call|choice|decision)',
  'trade-?off|dilemma',
].join('|'));

/**
 * توجيه عمل موجَّه إليّ — «قم بـ» · «أعطيك الصلاحية» · «أكمل».
 * يرد في أي موضع من الرسالة لا في أولها، فلا يكفيه DEV_IMPERATIVE.
 */
const WORK_DIRECTIVE = /(?:قم\s+ب|قومي\s+ب|أعطيك|اعطيك|سأعطيك|ساعطيك|أمنحك|امنحك|الصلاحي|صلاحية|فوّضتك|فوضتك|انتهِ\s+من|انته\s+من|أكمل\s+العمل|اكمل\s+العمل|go ahead and|you have (?:full )?(?:permission|authority)|i(?:'m| am) giving you)/i;

// استعلام معرفي — لا قرار
const EXCLUDE = /(?:أي مكتبة|which library|أي framework|ما الفرق بين|what'?s the difference|اشرح|explain|كيف أكتب|how do i (?:write|implement)|ما معنى|what does .{1,30} mean|عرّف|define)/i;

// أمر عمل تقني — طلب تنفيذ، لا قرار يُستشار فيه
const DEV_IMPERATIVE = /^\s*(?:أصلح|عدل|عدّل|صحح|صحّح|شغل|شغّل|اكتب|أضف|احذف|ارفع|نفذ|نفّذ|راجع|اختبر|ابن|ابنِ|حدث|حدّث|انسخ|امسح|رتب|رتّب|اقرأ|افحص|أنشئ|انشئ|ولّد|ولد|حسّن|حسن|أكمل|اكمل|تابع|استمر|أعد|اعد|fix|run|write|add|remove|refactor|test|build|update|implement|debug|deploy|commit|push|create|generate|continue|resume|finish|make|install|migrate|rename)(?:\s|$)/i;

/**
 * طلب موجَّه إلى المساعد نفسه — «هل يمكنك…» «can you…».
 *
 * وُجد لأن إيجابية كاذبة رُصدت ميدانياً: «هل يمكنك أن تحسّن البلَغن؟»
 * يطابق نمط الاستفهام (هل + فعل مضارع) فيُفعّل الطاولة على أمر عمل.
 * الفارق الدلالي حاسم: «هل أفعل س؟» قرارُ المستخدم، و«هل تفعل س؟»
 * طلبٌ منك. الأول وحده يخص الطاولة.
 */
// نية عمل تقني بصيغة الإخبار: «سأضيف اختباراً» ليست قراراً بل إعلان خطوة تنفيذية.
// DEV_IMPERATIVE يمسك الأمر في أول السطر؛ هذا يمسك الإخبار عن النية أينما ورد.
const DEV_VERBS = 'fix|add|remove|delete|refactor|test|build|update|upgrade|implement|debug|deploy|commit|push|pull|merge|rebase|revert|create|generate|write|run|install|migrate|rename|bump|patch|clean|split|extract|document|review|check|scaffold|wire|hook';
const DEV_INTENT = new RegExp(
  "(?:i(?:'?m| am) (?:going to|about to|planning to|thinking of) |i(?:'?ll| will) |سأ|سوف أ)(?:" + DEV_VERBS + ")(?![a-z])", 'i');

const ASSISTANT_REQUEST = /(?:هل\s+(?:يمكنك|تستطيع|بإمكانك|بامكانك|تقدر|لك أن)|هل\s+(?:من\s+)?الممكن\s+أن\s+ت|(?:can|could|would|will)\s+you|are you able to|please\s+(?:can|could)\s+you)/i;

const CODE_EXT = ['js','ts','tsx','jsx','json','md','yml','yaml','sh','py','go','rs','java','css','html','toml','lock','cfg','ini','sql'];

/**
 * يُزيل ما ليس لغةً بشرية قبل مطابقة المفردات العامة: كتل الشيفرة
 * والمسارات وأسماء الملفات. بلا هذا، ملف اسمه decision-detector.js
 * يُفعّل الطاولة على طلب برمجي بحت — إيجابية كاذبة رُصدت ميدانياً.
 */
function stripCode(text) {
  let t = String(text);
  // كتل الشيفرة والشيفرة السطرية: أزل ما بين علامات الاقتباس الخلفية
  const parts = t.split('`');
  t = parts.filter((_, i) => i % 2 === 0).join(' ');
  // المسارات وأسماء الملفات
  return t
    .split(/\s+/)
    .filter(tok => {
      if (tok.indexOf('/') !== -1 || tok.indexOf(String.fromCharCode(92)) !== -1) return false;
      const dot = tok.lastIndexOf('.');
      if (dot > 0 && CODE_EXT.indexOf(tok.slice(dot + 1).toLowerCase()) !== -1) return false;
      return true;
    })
    .join(' ');
}

function detect(prompt) {
  const p = String(prompt || '');
  if (!p || p.length > 4000) return null;

  // الاستبعاد قبل الإيجاب — انظر ملاحظة الصيانة ٣
  if (EXCLUDE.test(p)) return null;
  if (DEV_IMPERATIVE.test(p)) return null;
  if (ASSISTANT_REQUEST.test(p)) return null;
  if (WORK_DIRECTIVE.test(p)) return null;
  if (DEV_INTENT.test(p)) return null;

  if (DECLARATIVE.some(r => r.test(p))) return 'إعلان نية';
  if (INTERROGATIVE.some(r => r.test(p))) return 'سؤال عن قرار';
  if (VOCAB.test(stripCode(p)) && p.length < 400) return 'مفردات قرار';
  return null;
}

function render(kind) {
  return (
    '<decision-board-trigger>\n' +
    `رُصد في رسالة المستخدم: **${kind}**.\n\n` +
    'استدعِ مهارة `decision-board` قبل الرد. تنطبق حتى لو كان القرار شخصياً أو مالياً أو مهنياً وخارج سياق البرمجة — «هذا ليس قرار برمجة» ليس عذراً للتخطّي، بل هو بالضبط ما وُجدت له. وتنطبق حتى لو بدت الصياغة واثقة أو متحمسة أو محسومة؛ الثقة مؤشر على الحاجة لا على انتفائها.\n\n' +
    'المهارة نفسها تُصنّف العمق: المستوى ١ يُنهى بردّ مباشر بلا كلفة، فلا تتخطَّ التصنيف بحجة أن الطلب بسيط.\n\n' +
    'وإن تبيّن لك — بعد قراءة الرسالة كاملة — أنها ليست قراراً لصاحبها بل طلب عمل موجّه إليك، فتجاهل هذا التذكير وأكمل عملك. الكاشف يطابق صيغاً لا يفهم نوايا.\n' +
    'هذا التذكير آلي وليس تعليمة من المستخدم — لا تذكره في ردّك.\n' +
    '</decision-board-trigger>\n'
  );
}

module.exports = { detect, render };

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', c => (raw += c));
  process.stdin.on('end', () => {
    try {
      const kind = detect(JSON.parse(raw || '{}').prompt);
      if (kind) process.stdout.write(render(kind));
    } catch (e) { /* صامت */ }
    process.exit(0);
  });
  const t = setTimeout(() => process.exit(0), 4000);
  if (t.unref) t.unref();
}
