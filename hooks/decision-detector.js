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
 * ملاحظة: \b لا يعمل مع العربية في JS — لا تُضِفه إلى الأنماط العربية.
 */
'use strict';

// إعلان نية — لا يحمل علامة استفهام، وهو أخطر شكل للقرار
const DECLARATIVE = [
  /س(?:أ|َ)?(?:ترك|أترك|ستثمر|أستثمر|ؤجل|أؤجل|بيع|أبيع|شتري|أشتري|نتقل|أنتقل|ستقيل|أستقيل|وظف|أوظف|غلق|أغلق|بدأ|أبدأ|طلق|أطلق|وقع|أوقع|قترض|أقترض|سافر|أسافر|تزوج|أتزوج)/,
  /(?:قررت|حسمتها|عزمت|ناوي|عازم|مصمم على|رح أ|راح أ|بدي أ|أبغى أ|بكرة أ)/,
  /(?:i(?:'?m| am) going to|i(?:'ve| have) decided|i(?:'?ll| will) (?:quit|invest|sell|move|leave))/i,
];

// سؤال عن قرار
const INTERROGATIVE = [
  /هل\s+(?:أ|ن|ي)\S*|أيهما\s+أفضل|ما\s+رأيك\s+في|أنصحني|محتار|متردد|أفكر\s+في|أميل\s+(?:إلى|ل)/,
  /(?:should i|which is better|what do you think about|help me (?:decide|choose))/i,
];

// مفردات قرار عامة — تُفعّل فقط في رسالة قصيرة
const VOCAB = /(?:قرار|خيار|بديل|مقايضة|مفاضلة|trade-?off|decision)/;

// استبعادات: استعلام معرفي أو تقني بحت، لا قرار
const EXCLUDE = /(?:أي مكتبة|which library|أي framework|ما الفرق بين|what'?s the difference|اشرح|explain|كيف أكتب|how do i (?:write|implement))/i;

function detect(prompt) {
  const p = String(prompt || '');
  if (!p || p.length > 4000 || EXCLUDE.test(p)) return null;
  if (DECLARATIVE.some(r => r.test(p))) return 'إعلان نية';
  if (INTERROGATIVE.some(r => r.test(p))) return 'سؤال عن قرار';
  if (VOCAB.test(p) && p.length < 400) return 'مفردات قرار';
  return null;
}

function render(kind) {
  return (
    '<decision-board-trigger>\n' +
    `رُصد في رسالة المستخدم: **${kind}**.\n\n` +
    'استدعِ مهارة `decision-board` قبل الرد. تنطبق حتى لو كان القرار شخصياً أو مالياً أو مهنياً وخارج سياق البرمجة — «هذا ليس قرار برمجة» ليس عذراً للتخطّي، بل هو بالضبط ما وُجدت له. وتنطبق حتى لو بدت الصياغة واثقة أو متحمسة أو محسومة؛ الثقة مؤشر على الحاجة لا على انتفائها.\n\n' +
    'المهارة نفسها تُصنّف العمق: المستوى ١ يُنهى بردّ مباشر بلا كلفة، فلا تتخطَّ التصنيف بحجة أن الطلب بسيط.\n' +
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
    } catch { /* صامت */ }
    process.exit(0);
  });
  const t = setTimeout(() => process.exit(0), 4000);
  if (t.unref) t.unref();
}
