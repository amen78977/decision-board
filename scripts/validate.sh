#!/usr/bin/env bash
# فحص المستودع — يعمل محلياً وفي CI بنفس الشيفرة
set -uo pipefail
fail=0
err() { echo "❌ $*"; fail=1; }
ok()  { echo "✅ $*"; }

echo "── ١. البنية ──"
for d in .claude-plugin agents skills/decision-board commands standalone evals scripts .github/workflows; do
  [ -d "$d" ] && ok "مجلد $d" || err "مجلد مفقود: $d"
done
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json \
         skills/decision-board/SKILL.md commands/decide.md \
         standalone/CHAT.md standalone/AGENT.md PROTOCOL.md; do
  [ -f "$f" ] && ok "ملف $f" || err "ملف مفقود: $f"
done

echo "── ٢. JSON صالح ──"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null \
    && ok "JSON صالح: $f" || err "JSON تالف أو مفقود: $f"
done

echo "── ٣. الوكلاء الخمسة ──"
expected="advocate arbiter diagnostician executor opponent"
for a in $expected; do
  f="agents/$a.md"
  [ -f "$f" ] || { err "وكيل مفقود: $f"; continue; }
  head -1 "$f" | grep -q '^---$' || err "$f: لا frontmatter"
  grep -q '^description:' "$f"   || err "$f: حقل description مفقود"
  n=$(grep -m1 '^name:' "$f" | sed 's/^name:[[:space:]]*//')
  [ "$n" = "$a" ] && ok "$f → name=$n" || err "$f: name=\"$n\" لا يطابق اسم الملف"
done
count=$(ls agents/*.md 2>/dev/null | wc -l)
[ "$count" -eq 5 ] || err "عدد الوكلاء $count — المتوقع ٥"
dupes=$(grep -h '^name:' agents/*.md 2>/dev/null | sort | uniq -d)
[ -z "$dupes" ] && ok "لا أسماء مكررة" || err "أسماء مكررة: $dupes"

echo "── ٤. المهارة ──"
grep -q '^name: decision-board' skills/decision-board/SKILL.md && ok "name صحيح" || err "SKILL.md: name خاطئ أو مفقود"
grep -q '^description:' skills/decision-board/SKILL.md && ok "description موجود" || err "SKILL.md: description مفقود"

echo "── ٥. لا عناصر نائبة غير مستبدَلة ──"
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
  grep -q 'YOUR_NAME\|YOUR_USERNAME' "$f" && err "$f: عنصر نائب لم يُستبدل" || ok "$f بلا عناصر نائبة"
done

echo "── ٦. اتساق القواعد مع PROTOCOL ──"
before6=$fail
# كل قاعدة ← بصمة نصية يجب أن تظهر في المشتقات المذكورة
check() { # $1=وصف  $2=نمط  ثم الملفات
  local d="$1" pat="$2"; shift 2
  for f in "$@"; do
    grep -q "$pat" "$f" 2>/dev/null || err "$d: مفقودة من $f"
  done
}
S=skills/decision-board/SKILL.md; A=standalone/AGENT.md; C=standalone/CHAT.md
check "ج١ لا مصادقة"      'تُصادق'                     "$S" "$A" "$C"
check "ج٢ فصل الأنواع"     'تفسير'                      "$S" "$A" "$C"
check "ج٣ لا افتعال"       'تفتعل الاعتراض'             "$S" "$A" "$C"
check "ج٥ حقول لا نثر"     'نثر'                        "$S" "$A" "$C"
check "ج٦ النقل الحرفي"    'حرفياً'                     "$S" "$A" "$C"
check "ج٧ منع التمييع"     'متوازن'                     "$S" "$A" "$C"
check "ج٨ قابلية الإبطال"  'ما_يُبطله'                  "$S" "$A" "$C"
check "ج٩ اختر الأدنى"     'الأدنى'                     "$S" "$A" "$C"
check "ج١٠ القرار للمستخدم" 'لا تقرر\|لا تقرر بدل'       "$S" "$A" "$C"
check "ج١١ سطر 📋"          '📋'                         "$S" "$A" "$C"
check "ج١٢ قرار لا نتيجة"   'حظ'                         "$S" "$A" "$C"
check "ج٤ حزمة المعارض"     'حزمة_المعارض'               "$S" "$A" agents/diagnostician.md agents/opponent.md
check "ج٤ رفض التلوث"       'مدخل_ملوث'                  "$S" "$A" agents/opponent.md
[ "$fail" -eq "$before6" ] && ok "كل القواعد الـ١٢ منشورة على المشتقات"

echo "── ٧. لا معارض بلا مؤيد ──"
for f in "$S" "$A"; do
  l2=$(grep -m1 'أثر كبير' "$f")
  case "$l2" in
    *advocate*) ok "$f: المستوى ٢ فيه مؤيد" ;;
    "")         err "$f: صف المستوى ٢ مفقود" ;;
    *)          err "$f: المستوى ٢ يستدعي المعارض وحده — ميل بنيوي للاعتراض" ;;
  esac
done
l2=$(grep -m1 'أثر كبير' "$C")
case "$l2" in
  *'١ و٢ و٣'*) ok "$C: المستوى ٢ يمر بالمرحلة ٢ (المؤيد)" ;;
  *)           err "$C: المستوى ٢ يتخطى المؤيد" ;;
esac

echo "── ٨. حالات التقييم ──"
for c in 01-trivial 02-bad-decision 03-solid-decision 04-hyped-framing 05-journal-real-decision 06-journal-refuses-intent; do
  { [ -s "evals/$c/prompt.md" ] && [ -s "evals/$c/graders/criteria.md" ]; } && ok "حالة $c" || err "حالة ناقصة: evals/$c"
done

echo "── ٩. ج١١ بلا تسريب أسماء الوكلاء ──"
for f in "$S" "$A" "$C" README.md docs/ARCHITECTURE.md examples/walkthrough.md; do
  [ -f "$f" ] || continue
  grep '📋' "$f" | grep -qiE 'opponent|advocate|executor|arbiter|diagnostician|استُشير: *المؤيد|استُشير: *المعارض' \
    && err "$f: سطر 📋 يسمّي أدواراً — نقض ج١١" || ok "$f: سطر 📋 نظيف"
done

echo "── ١٠. جداول النماذج تطابق frontmatter ──"
for a in diagnostician advocate opponent executor arbiter; do
  m=$(grep -m1 '^model:' "agents/$a.md" | sed 's/^model:[[:space:]]*//')
  [ -n "$m" ] || { err "agents/$a.md: حقل model مفقود"; continue; }
  bad=0
  for doc in PROTOCOL.md docs/ARCHITECTURE.md; do
    grep -qE "\`$a\`.*\`$m\`" "$doc" || { err "$doc: $a مذكور بنموذج غير \`$m\`"; bad=1; }
  done
  [ "$bad" -eq 0 ] && ok "$a → $m (متطابق في PROTOCOL وARCHITECTURE)"
done
echo "── ١١. محفّزات الاستدعاء تغطي الإعلان لا السؤال فقط ──"
for f in "$S" "$A" "$C"; do
  hits=0
  for w in 'سأترك' 'سأستثمر' 'قررت' 'إعلان نية'; do
    grep -q "$w" "$f" && hits=$((hits+1))
  done
  [ "$hits" -ge 2 ] && ok "$f: يغطي الصياغة الخبرية" \
    || err "$f: محفّزات استفهامية فقط — لن تُستدعى عند «سأترك وظيفتي»"
done

echo "── ١٢. كاشف القرارات (hook) ──"
if [ -f hooks/hooks.json ] && [ -f hooks/decision-detector.js ]; then
  node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json','utf8'))" 2>/dev/null && ok "hooks.json صالح" || err "hooks.json تالف"
  grep -q 'UserPromptSubmit' hooks/hooks.json && ok "UserPromptSubmit مُعلَن" || err "hooks.json: UserPromptSubmit مفقود"
  grep -q 'CLAUDE_PLUGIN_ROOT' hooks/hooks.json && ok "المسار محمول (CLAUDE_PLUGIN_ROOT)" || err "hooks.json: مسار مطلق غير محمول"
  if node hooks/detector.test.js >/dev/null 2>&1; then ok "اختبار الوحدة: $(node hooks/detector.test.js 2>/dev/null | tail -1)"; else
    err "اختبار الوحدة فشل:"; node hooks/detector.test.js 2>&1 | head -5; fi
else
  err "hooks/ ناقص — البلَغن يعتمد على تعديل CLAUDE.md الشخصي"
fi

echo
[ "$fail" -eq 0 ] && echo "🟢 نجح الفحص" || echo "🔴 فشل الفحص"
exit $fail
