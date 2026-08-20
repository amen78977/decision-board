#!/usr/bin/env node
// اختبار وحدة لكاشف القرارات — يعمل بلا شبكة وبلا استدعاء نموذج
'use strict';
const { detect } = require('./decision-detector.js');

const CASES = [
  // يجب أن تُفعّل — إعلان نية (أخطر شكل، ولا يحمل علامة استفهام)
  ['سأستثمر كل مدخراتي في عملة رقمية سمعت عنها أمس', 'إعلان نية'],
  ['سأؤجل التوسع ٦ أشهر حتى يستقر التدفق النقدي', 'إعلان نية'],
  ['أنا متحمس جداً وحاسس إنها فرصة العمر، سأترك وظيفتي غداً', 'إعلان نية'],
  ['قررت أفتح فرع ثاني', 'إعلان نية'],
  ['حسمتها: أجّلت التوسع', 'إعلان نية'],
  ['ناوي أبيع السيارة', 'إعلان نية'],
  ['I am going to quit my job tomorrow', 'إعلان نية'],
  ["I've decided to sell", 'إعلان نية'],
  // يجب أن تُفعّل — سؤال
  ['هل أشرب قهوة أم شاي؟', 'سؤال عن قرار'],
  ['أيهما أفضل، أ أم ب؟', 'سؤال عن قرار'],
  ['محتار بين خيارين', 'سؤال عن قرار'],
  ['Should I take the offer?', 'سؤال عن قرار'],
  // يجب ألا تُفعّل — استعلام معرفي أو عمل تقني
  ['أي مكتبة أستخدم للتواريخ؟', null],
  ['اشرح لي كيف يعمل useEffect', null],
  ['ما الفرق بين map و forEach', null],
  ['شغّل الاختبارات وارفع النتيجة', null],
  ['أصلح هذا الخطأ في الدالة', null],
  ['how do i write a test for this', null],
  // إيجابيات كاذبة رُصدت ميدانياً — اسم ملف يحوي decision، وأوامر عمل تقنية
  ['أصلح الخطأ في hooks/decision-detector.js', null],
  ['راجع evals/03-solid-decision/prompt.md', null],
  ['fix the decision detector', null],
  ['شغّل scripts/validate.sh', null],
  ['أضف خيار جديد للدالة', null],
  ['', null],
];

let pass = 0, fail = 0;
for (const [prompt, expected] of CASES) {
  const got = detect(prompt);
  if (got === expected) { pass++; continue; }
  fail++;
  console.error(`❌ «${prompt}» → ${got || 'لا تفعيل'} (المتوقع: ${expected || 'لا تفعيل'})`);
}
console.log(`كاشف القرارات: ${pass}/${CASES.length} نجحت`);
process.exit(fail ? 1 : 0);
