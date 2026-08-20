#!/usr/bin/env bash
# فحص المستودع — يعمل محلياً وفي CI بنفس الشيفرة
set -uo pipefail
fail=0
err() { echo "❌ $*"; fail=1; }
ok()  { echo "✅ $*"; }

S=skills/decision-board/SKILL.md; A=standalone/AGENT.md; C=standalone/CHAT.md
AGENTS="advocate arbiter diagnostician executor opponent verifier"

echo "── ١. البنية ──"
for d in .claude-plugin agents skills/decision-board commands standalone evals scripts hooks .github/workflows; do
  [ -d "$d" ] && ok "مجلد $d" || err "مجلد مفقود: $d"
done
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json \
         "$S" commands/decide.md "$C" "$A" PROTOCOL.md; do
  [ -f "$f" ] && ok "ملف $f" || err "ملف مفقود: $f"
done

echo "── ٢. JSON صالح ──"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json hooks/hooks.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null \
    && ok "JSON صالح: $f" || err "JSON تالف أو مفقود: $f"
done

echo "── ٣. الوكلاء الستة ──"
for a in $AGENTS; do
  f="agents/$a.md"
  [ -f "$f" ] || { err "وكيل مفقود: $f"; continue; }
  head -1 "$f" | grep -q '^---$' || err "$f: لا frontmatter"
  grep -q '^description:' "$f"   || err "$f: حقل description مفقود"
  n=$(grep -m1 '^name:' "$f" | sed 's/^name:[[:space:]]*//')
  [ "$n" = "$a" ] && ok "$f → name=$n" || err "$f: name=\"$n\" لا يطابق اسم الملف"
done
count=$(ls agents/*.md 2>/dev/null | wc -l)
[ "$count" -eq 6 ] || err "عدد الوكلاء $count — المتوقع ٦"
dupes=$(grep -h '^name:' agents/*.md 2>/dev/null | sort | uniq -d)
[ -z "$dupes" ] && ok "لا أسماء مكررة" || err "أسماء مكررة: $dupes"

echo "── ٤. المهارة ──"
grep -q '^name: decision-board' "$S" && ok "name صحيح" || err "SKILL.md: name خاطئ أو مفقود"
grep -q '^description:' "$S" && ok "description موجود" || err "SKILL.md: description مفقود"

echo "── ٥. لا عناصر نائبة غير مستبدَلة ──"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
  grep -q 'YOUR_NAME\|YOUR_USERNAME' "$f" && err "$f: عنصر نائب لم يُستبدل" || ok "$f بلا عناصر نائبة"
done

echo "── ٦. طبقة الإجراء (ج١–ج١٢) منشورة على المشتقات ──"
before6=$fail
check() { # $1=وصف  $2=نمط  ثم الملفات
  local d="$1" pat="$2"; shift 2
  for f in "$@"; do
    grep -q "$pat" "$f" 2>/dev/null || err "$d: مفقودة من $f"
  done
}
check "ج١ لا مصادقة"        'تُصادق'              "$S" "$A" "$C"
check "ج٢ فصل الأنواع"       'تفسير'               "$S" "$A" "$C"
check "ج٣ لا افتعال"         'تفتعل'               "$S" "$A" "$C"
check "ج٥ حقول لا نثر"       'نثر'                 "$S" "$A" "$C"
check "ج٦ النقل الحرفي"      'حرفياً'              "$S" "$A" "$C"
check "ج٧ منع التمييع"       'متوازن'              "$S" "$A" "$C"
check "ج٨ قابلية الإبطال"    'ما_يُبطله'           "$S" "$A" "$C"
check "ج٨ إبطال مرصود"       'ملاحظته'             "$S" "$A" "$C"
check "ج٩ اختر الأدنى"       'الأدنى'              "$S" "$A" "$C"
check "ج١٠ القرار للمستخدم"   'لا تقرر'             "$S" "$A" "$C"
check "ج١١ سطر 📋"            '📋'                  "$S" "$A" "$C"
check "ج١٢ قرار لا نتيجة"     'حظ'                  "$S" "$A" "$C"
[ "$fail" -eq "$before6" ] && ok "ج١–ج١٢ كاملة في المشتقات الثلاثة"

echo "── ٧. طبقة الإثبات (ج١٣–ج١٥) ──"
before7=$fail
check "ج١٣ الفئة المرجعية"    'الفئة_المرجعية'      "$S" "$A" "$C" agents/advocate.md agents/opponent.md
check "ج١٣ حظر رقم بلا مصدر"  'غير_متاح'            "$S" "$A" "$C" agents/advocate.md agents/opponent.md
check "ج١٤ وسم الوقائع"       'مشكوك'               "$S" "$A" "$C" agents/verifier.md
check "ج١٤ سطر 🔍"            '🔍'                  "$S" "$A" "$C"
check "ج١٥ الثقة رقم"         '0\.70\|0\.75\|0\.80' "$S" "$A" "$C" agents/advocate.md agents/opponent.md agents/executor.md agents/arbiter.md
[ "$fail" -eq "$before7" ] && ok "ج١٣–ج١٥ كاملة في المشتقات والوكلاء"

# ج١٥ — لا يبقى وصف نصي للثقة في مخرجات الوكلاء
for a in advocate opponent executor arbiter; do
  grep -qE '^الثقة: \[(عالٍ|متوسط|منخفض)' "agents/$a.md" \
    && err "agents/$a.md: الثقة ما تزال وصفاً لا رقماً — نقض ج١٥" \
    || ok "agents/$a.md: الثقة رقمية"
done

echo "── ٨. ج٤ العزل وتناظر التسليح ──"
# الاسم القديم يجب أن يكون قد اختفى تماماً (حارس انحدار)
# PROTOCOL وCHANGELOG سجلّان تاريخيان — تسمية الاسم القديم فيهما واجبة لا عيب
oldname=$(grep -rl 'حزمة_المعارض' --include='*.md' . 2>/dev/null | grep -vE '^\./(PROTOCOL|CHANGELOG)\.md$')
[ -z "$oldname" ] && ok "الاسم القديم «حزمة_المعارض» أُزيل بالكامل" \
  || err "الاسم القديم باقٍ في: $oldname"
check "ج٤ الحزمة المحايدة" 'الحزمة_المحايدة' "$S" "$A" \
  agents/diagnostician.md agents/advocate.md agents/opponent.md agents/executor.md agents/verifier.md
check "ج٤ رفض التلوث" 'مدخل_ملوث' "$S" "$A" \
  agents/advocate.md agents/opponent.md agents/executor.md agents/verifier.md
# تناظر التسليح: ممنوع منح المؤيد سياقاً إضافياً
if grep -qE 'advocate.*(سياق المستخدم الكامل|\+ السياق الكامل)' "$S" "$A"; then
  err "تناظر التسليح مكسور: المؤيد يستقبل سياقاً لا يملكه المعارض (ج٤/مشتقة ٣)"
else
  ok "تناظر التسليح سليم: لا سياق إضافي للمؤيد"
fi
check "تناظر مُعلَن صراحةً" 'تناظر' "$S" "$A" PROTOCOL.md

echo "── ٩. المعارض: تشريح الفشل والعدسات الثلاث ──"
check "تشريح الفشل المسبق" 'تشريح_الفشل' agents/opponent.md "$S" "$A" "$C"
for lens in 'العدسة_الاقتصادية' 'العدسة_البشرية_السياسية' 'العدسة_الزمنية'; do
  grep -q "$lens" agents/opponent.md && ok "عدسة $lens" || err "agents/opponent.md: $lens مفقودة"
done

# المُتحقِّق: الغياب ليس واقعة · و«حرجة» ليست وسماً تشريفياً (رُصد بالاختبار الميداني)
grep -q 'فراغات_معلنة' agents/verifier.md   && ok "المُتحقِّق يفصل الغيابات عن الوقائع"   || err "agents/verifier.md: الغيابات تُوسَم كوقائع فيضيع الادعاء الخطر"
grep -q 'ليست وسماً تشريفياً' agents/verifier.md   && ok "المُتحقِّق مقيَّد في عدد الوقائع الحرجة"   || err "agents/verifier.md: بلا سقف لـ«حرجة» — الحقل يُلغي نفسه"

echo "── ١٠. الدفتر يعبر المشاريع ──"
if grep -rl 'decision-board/MEMORY\.md' --include='*.md' . 2>/dev/null | grep -qvE '^\./(PROTOCOL|CHANGELOG)\.md$'; then
  err "الدفتر ما يزال محلياً (MEMORY.md في المشروع) — يتشظّى ولا يتراكم"
else
  ok "لا أثر للدفتر المحلي القديم"
fi
check "دفتر عام" 'decision-board/JOURNAL\.md' agents/arbiter.md "$S" "$A"
check "سجل المعايرة" 'المعايرة' agents/arbiter.md "$A" "$C"

echo "── ١١. لا معارض بلا مؤيد · ولا تحليل بلا فحص وقائع ──"
for f in "$S" "$A"; do
  l2=$(grep -m1 'أثر كبير' "$f")
  case "$l2" in
    "")         err "$f: صف المستوى ٢ مفقود" ;;
    *advocate*) case "$l2" in
                  *verifier*) ok "$f: المستوى ٢ فيه مؤيد ومُتحقِّق" ;;
                  *)          err "$f: المستوى ٢ بلا فحص وقائع (ج١٤)" ;;
                esac ;;
    *)          err "$f: المستوى ٢ يستدعي المعارض وحده — ميل بنيوي للاعتراض" ;;
  esac
done
l2=$(grep -m1 'أثر كبير' "$C")
case "$l2" in
  *'١ و٢ و٣ و٤'*) ok "$C: المستوى ٢ يمر بفحص الوقائع والمؤيد" ;;
  *)              err "$C: المستوى ٢ يتخطى مرحلة" ;;
esac

echo "── ١٢. حالات التقييم ──"
for c in 01-trivial 02-bad-decision 03-solid-decision 04-hyped-framing \
         05-journal-real-decision 06-journal-refuses-intent \
         07-unverified-fact 08-fabricated-baserate; do
  { [ -s "evals/$c/prompt.md" ] && [ -s "evals/$c/graders/criteria.md" ]; } && ok "حالة $c" || err "حالة ناقصة: evals/$c"
done

echo "── ١٣. ج١١ بلا تسريب أسماء الوكلاء ──"
for f in "$S" "$A" "$C" README.md docs/ARCHITECTURE.md examples/walkthrough.md; do
  [ -f "$f" ] || continue
  grep '📋 خضع' "$f" | grep -qiE 'opponent|advocate|executor|arbiter|diagnostician|verifier|استُشير: *المؤيد|استُشير: *المعارض' \
    && err "$f: سطر 📋 يسمّي أدواراً — نقض ج١١" || ok "$f: سطر 📋 نظيف"
done

echo "── ١٤. جداول النماذج تطابق frontmatter ──"
for a in $AGENTS; do
  m=$(grep -m1 '^model:' "agents/$a.md" | sed 's/^model:[[:space:]]*//')
  [ -n "$m" ] || { err "agents/$a.md: حقل model مفقود"; continue; }
  bad=0
  for doc in PROTOCOL.md docs/ARCHITECTURE.md; do
    grep -qE "\`$a\`.*\`$m\`" "$doc" || { err "$doc: $a مذكور بنموذج غير \`$m\`"; bad=1; }
  done
  [ "$bad" -eq 0 ] && ok "$a → $m (متطابق في PROTOCOL وARCHITECTURE)"
done

echo "── ١٥. محفّزات الاستدعاء تغطي الإعلان لا السؤال فقط ──"
for f in "$S" "$A" "$C"; do
  hits=0
  for w in 'سأترك' 'سأستثمر' 'قررت' 'إعلان نية'; do
    grep -q "$w" "$f" && hits=$((hits+1))
  done
  [ "$hits" -ge 2 ] && ok "$f: يغطي الصياغة الخبرية" \
    || err "$f: محفّزات استفهامية فقط — لن تُستدعى عند «سأترك وظيفتي»"
done

echo "── ١٦. كاشف القرارات (hook) ──"
if [ -f hooks/hooks.json ] && [ -f hooks/decision-detector.js ]; then
  grep -q 'UserPromptSubmit' hooks/hooks.json && ok "UserPromptSubmit مُعلَن" || err "hooks.json: UserPromptSubmit مفقود"
  grep -q 'CLAUDE_PLUGIN_ROOT' hooks/hooks.json && ok "المسار محمول (CLAUDE_PLUGIN_ROOT)" || err "hooks.json: مسار مطلق غير محمول"
  grep -q 'ASSISTANT_REQUEST' hooks/decision-detector.js \
    && ok "يستبعد الطلب الموجَّه للمساعد («هل يمكنك…»)" \
    || err "الكاشف بلا استبعاد «هل يمكنك…» — إيجابية كاذبة مرصودة"
  grep -q 'WORK_DIRECTIVE' hooks/decision-detector.js \
    && ok "يستبعد التفويض وتوجيه العمل («أعطيك الصلاحية»)" \
    || err "الكاشف بلا استبعاد التفويض — إيجابية كاذبة مرصودة"
  grep -q 'أمامي|امامي|عندي' hooks/decision-detector.js \
    && ok "طبقة المفردات تشترط تملّك القرار لا وروده" \
    || err "الكاشف: طبقة المفردات فضفاضة — تُفعّل على أي ذكر لكلمة «قرار»"
  if node hooks/detector.test.js >/dev/null 2>&1; then
    ok "اختبار الوحدة: $(node hooks/detector.test.js 2>/dev/null | tail -1)"
  else
    err "اختبار الوحدة فشل:"; node hooks/detector.test.js 2>&1 | head -8
  fi
else
  err "hooks/ ناقص — البلَغن يعتمد على تعديل CLAUDE.md الشخصي"
fi

echo "── ١٧. الاختبار السلوكي (smoke.sh) ──"
if [ -f scripts/smoke.sh ]; then
  bash -n scripts/smoke.sh 2>/dev/null && ok "صياغة smoke.sh سليمة" || err "smoke.sh: خطأ صياغة"
  n=$(grep -c '^run [A-Z]-' scripts/smoke.sh)
  [ "$n" -ge 6 ] && ok "يغطي $n حالات سلوكية" || err "smoke.sh يغطي $n فقط — طبقة الإثبات بلا اختبار سلوكي"
  grep -q 'Agents (6)' scripts/smoke.sh && ok "الفحص المسبق يتوقع ٦ وكلاء" || err "smoke.sh: الفحص المسبق ما يزال يتوقع ٥"
  for fn in numeric_conf flags_unverified no_fabricated_stat; do
    grep -q "^$fn()" scripts/smoke.sh && ok "مُصحِّح $fn" || err "smoke.sh: مُصحِّح $fn مفقود"
  done
else
  err "scripts/smoke.sh مفقود"
fi

echo "── ١٧ب. حراس الكاشف الميدانية ──"
grep -q 'quitting' hooks/decision-detector.js && ok "يمسك الإعلان بالمضارع المستمر" || err "الكاشف: صيغة «I am quitting» تفلت — أشيع صورة للقرار بالإنجليزية"
grep -q 'DEV_INTENT' hooks/decision-detector.js && ok "يستبعد نية العمل التقني" || err "الكاشف: «سأضيف اختباراً» ستُفعّل الطاولة"
grep -q 'DEV_INTENT.test' hooks/decision-detector.js && ok "DEV_INTENT موصول بسلسلة الاستبعاد" || err "DEV_INTENT معرَّف وغير مستدعى — حارس ميت"
n=$(grep -c "إعلان نية'\]" hooks/detector.test.js)
[ "$n" -ge 20 ] && ok "$n حالة إعلان نية مغطاة" || err "تغطية إعلان النية $n فقط"

echo "── ١٨. طبقة التسليم (ج١٦) ──"
grep -q 'طبقة التسليم' PROTOCOL.md && ok "PROTOCOL: طبقة التسليم معلنة" || err "PROTOCOL: طبقة التسليم مفقودة"
grep -q 'ج١٦' PROTOCOL.md && ok "PROTOCOL: ج١٦ موجودة" || err "PROTOCOL: ج١٦ مفقودة"
for a in $AGENTS; do
  grep -q 'ج١٦' "agents/$a.md" && ok "$a: ج١٦ منشورة" || err "agents/$a.md: ج١٦ لم تُنشر — قاعدة تسقط بصمت"
done
grep -q 'أنت من يحسم اللغة' agents/diagnostician.md && ok "المشخِّص يحسم اللغة" || err "diagnostician: لا يحسم اللغة — الحزمة قد تصل بلغة غير لغة المستخدم"
grep -q 'ج١٦' "$S" && ok "SKILL: ج١٦ منشورة" || err "SKILL.md: ج١٦ لم تُنشر"
grep -q 'لغة المخرَج تتبع صاحب القرار' "$A" && ok "AGENT: قاعدة اللغة منشورة" || err "standalone/AGENT.md: قاعدة اللغة مفقودة"
grep -q 'لغتي هي لغة ردّك' "$C" && ok "CHAT: قاعدة اللغة منشورة" || err "standalone/CHAT.md: قاعدة اللغة مفقودة"
en_forks=$(ls agents/*.en.md 2>/dev/null | wc -l)
[ "$en_forks" -eq 0 ] && ok "لا تفرّع لغوي للوكلاء" || err "وُجد $en_forks من agents/*.en.md — ج١٦/مشتقة تمنع النسخة الموازية"

echo "── ١٩. الواجهة ثنائية اللغة ──"
[ -f README.ar.md ] && ok "README.ar.md موجود" || err "README.ar.md مفقود"
grep -q "Your AI agrees with you" README.md && ok "README الجذر إنجليزي بخُطّافه" || err "README.md: الجذر ليس إنجليزياً — السقف اللغوي عاد"
grep -q 'README.ar.md' README.md && ok "الجذر يحيل إلى العربية" || err "README.md: لا إحالة إلى README.ar.md"
grep -q '(README.md)' README.ar.md && ok "العربية تحيل إلى الجذر" || err "README.ar.md: لا إحالة إلى الجذر"
! grep -rl 'docs/README.en.md' --include='*.md' . 2>/dev/null | grep -qv 'CHANGELOG.md' && ok "لا إحالات حيّة لملف إنجليزي محذوف" || err "ما زالت هناك إحالة حيّة إلى docs/README.en.md المحذوف (CHANGELOG سجلّ تاريخي ومستثنى)"
[ -f docs/DEMO.md ] && ok "docs/DEMO.md موجود" || err "docs/DEMO.md مفقود — لا دليل تشغيل منشور"
grep -q '📋 خضع' docs/DEMO.md && ok "DEMO يعرض سطر 📋 حقيقياً" || err "docs/DEMO.md: لا يعرض سطر 📋"
grep -q 'DEMO.md' README.md && grep -q 'DEMO.md' README.ar.md && ok "الواجهتان تحيلان إلى الجلسة الحقيقية" || err "README: إحالة DEMO.md مفقودة في إحدى اللغتين"
[ -f .github/ISSUE_TEMPLATE/field-report.yml ] && ok "قالب تقرير الميدان موجود" || err "قالب تقرير الميدان مفقود — لا قناة للعيوب الميدانية"

echo
[ "$fail" -eq 0 ] && echo "🟢 نجح الفحص" || echo "🔴 فشل الفحص"
exit $fail
