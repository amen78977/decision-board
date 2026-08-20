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
oldname=$(grep -rl 'حزمة_المعارض' --include='*.md' . 2>/dev/null | grep -v '^./PROTOCOL.md$')
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

echo "── ١٠. الدفتر يعبر المشاريع ──"
if grep -rq 'decision-board/MEMORY\.md' --include='*.md' . 2>/dev/null; then
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
  if node hooks/detector.test.js >/dev/null 2>&1; then
    ok "اختبار الوحدة: $(node hooks/detector.test.js 2>/dev/null | tail -1)"
  else
    err "اختبار الوحدة فشل:"; node hooks/detector.test.js 2>&1 | head -8
  fi
else
  err "hooks/ ناقص — البلَغن يعتمد على تعديل CLAUDE.md الشخصي"
fi

echo
[ "$fail" -eq 0 ] && echo "🟢 نجح الفحص" || echo "🔴 فشل الفحص"
exit $fail
