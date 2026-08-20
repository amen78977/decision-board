#!/usr/bin/env node
// اختبار وحدة لكاشف القرارات — يعمل بلا شبكة وبلا استدعاء نموذج
'use strict';
const { detect, render } = require('./decision-detector.js');

const CASES = [
  // ═══ يجب أن تُفعّل — إعلان نية (أخطر شكل، ولا يحمل علامة استفهام)
  ['سأستثمر كل مدخراتي في عملة رقمية سمعت عنها أمس', 'إعلان نية'],
  ['سأؤجل التوسع ٦ أشهر حتى يستقر التدفق النقدي', 'إعلان نية'],
  ['أنا متحمس جداً وحاسس إنها فرصة العمر، سأترك وظيفتي غداً', 'إعلان نية'],
  ['قررت أفتح فرع ثاني', 'إعلان نية'],
  ['حسمتها: أجّلت التوسع', 'إعلان نية'],
  ['ناوي أبيع السيارة', 'إعلان نية'],
  ['نويت أسافر للدراسة', 'إعلان نية'],
  ['سأرفض العرض', 'إعلان نية'],
  ['I am going to quit my job tomorrow', 'إعلان نية'],
  ["I've decided to sell", 'إعلان نية'],
  ["I'm planning to leave the company", 'إعلان نية'],
  ['My mind is made up about the move', 'إعلان نية'],

  // ═══ يجب أن تُفعّل — سؤال عن قرار
  ['هل أشرب قهوة أم شاي؟', 'سؤال عن قرار'],
  ['أيهما أفضل، أ أم ب؟', 'سؤال عن قرار'],
  ['أيهما تنصح: التوظيف أم التعاقد؟', 'سؤال عن قرار'],
  ['محتار بين خيارين', 'سؤال عن قرار'],
  ['ماذا لو رفضت العرض', 'سؤال عن قرار'],
  ['Should I take the offer?', 'سؤال عن قرار'],
  ['Is it worth moving to a new city for this role', 'سؤال عن قرار'],
  ["I'm torn between two offers", 'سؤال عن قرار'],
  ["can't decide which path to take", 'سؤال عن قرار'],

  // ═══ يجب ألا تُفعّل — استعلام معرفي
  ['أي مكتبة أستخدم للتواريخ؟', null],
  ['اشرح لي كيف يعمل useEffect', null],
  ['ما الفرق بين map و forEach', null],
  ['how do i write a test for this', null],
  ['ما معنى الفئة المرجعية', null],

  // ═══ يجب ألا تُفعّل — أمر عمل تقني
  ['شغّل الاختبارات وارفع النتيجة', null],
  ['أصلح هذا الخطأ في الدالة', null],
  ['أنشئ ملف جديد للوكيل', null],
  ['حسّن أداء هذه الدالة', null],
  ['أكمل ما بدأته', null],
  ['generate the migration', null],
  ['continue from where you left off', null],

  // ═══ إيجابيات كاذبة رُصدت ميدانياً — أسماء ملفات تحوي «decision»/«قرار»
  ['أصلح الخطأ في hooks/decision-detector.js', null],
  ['راجع evals/03-solid-decision/prompt.md', null],
  ['fix the decision detector', null],
  ['شغّل scripts/validate.sh', null],
  ['أضف خيار جديد للدالة', null],

  // ═══ إيجابية كاذبة رُصدت في جلسة 0.5.0 — طلب موجَّه إلى المساعد
  // «هل أفعل س؟» قرارُ المستخدم · «هل تفعل س؟» طلبٌ منك. الأول وحده للطاولة.
  ['هل يمكنك أن تحسّن البلَغن وتصلح نقاط الضعف؟', null],
  ['هل تستطيع مقارنة هذا بالمنافسين؟', null],
  ['هل بإمكانك رفع الملف على GitHub؟', null],
  ['هل من الممكن أن تكتب اختباراً لهذا؟', null],
  ['Can you fix the detector please', null],
  ['Could you compare these two approaches for me', null],
  ['Would you review this file?', null],

  // ═══ إيجابية كاذبة رُصدت في جلسة 0.5.2 — تفويض وتوجيه عمل
  // الكلمة وحدها موضوع؛ التملّك هو ما يجعلها قراراً.
  ['سوف اعطيك جميع القرارات والصلاحيات قم بالانتهاء من كل شيء ثم اخبرني', null],
  ['أعطيك صلاحية اتخاذ القرار في التنفيذ', null],
  ['قم بمراجعة قرارات المعمارية في الملف', null],
  ['لك القرار في اختيار الأسلوب، أكمل العمل', null],
  ['I am giving you full authority on this decision', null],
  ['go ahead and make the call on the tradeoff', null],

  // ═══ ويجب أن تبقى تُفعّل — قرار يملكه المستخدم أو يقف أمامه
  ['أمامي قرار صعب هذا الأسبوع', 'مفردات قرار'],
  ['عندي خياران ولا أعرف أيهما', 'مفردات قرار'],
  ['قراري في هذا الموضوع لم ينضج بعد', 'مفردات قرار'],
  ['أنا بين خيارين ولا أستطيع الحسم', 'مفردات قرار'],
  ['المقايضة هنا بين السرعة والجودة', 'مفردات قرار'],
  ['this is a big decision for me', 'مفردات قرار'],

  // ═══ حالات حدّية
  ['', null],
  [null, null],
  ['x'.repeat(5000), null],
];

let pass = 0, fail = 0;
for (const [prompt, expected] of CASES) {
  const got = detect(prompt);
  if (got === expected) { pass++; continue; }
  fail++;
  console.error(`❌ «${String(prompt).slice(0, 60)}» → ${got || 'لا تفعيل'} (المتوقع: ${expected || 'لا تفعيل'})`);
}

// ═══ فحص بنية التذكير المحقون
const sample = render('سؤال عن قرار');
const STRUCTURE = [
  ['يفتح بالوسم', sample.indexOf('<decision-board-trigger>') === 0],
  ['يغلق بالوسم', sample.trim().endsWith('</decision-board-trigger>')],
  ['يذكر اسم المهارة', sample.indexOf('decision-board') !== -1],
  ['يصرّح بأنه آلي', sample.indexOf('آلي') !== -1],
  ['يمنح مخرجاً عند الخطأ', sample.indexOf('فتجاهل هذا التذكير') !== -1],
  ['لا يذكر اسم وكيل (ج١١)', !/opponent|advocate|arbiter|verifier|executor|diagnostician/.test(sample)],
];
for (const [label, ok] of STRUCTURE) {
  if (ok) { pass++; continue; }
  fail++;
  console.error(`❌ بنية التذكير: ${label}`);
}

const total = CASES.length + STRUCTURE.length;
console.log(`كاشف القرارات: ${pass}/${total} نجحت`);
process.exit(fail ? 1 : 0);
