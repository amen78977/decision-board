#!/usr/bin/env bash
# اختبار سلوكي آلي — لا يحتاج `claude plugin eval` (المحجوب في الوصول المبكر)
# يشغّل الحالات الأربع عبر claude -p ويطبّق الفحوص الميكانيكية القابلة للحسم.
# يتطلب: البلَغن مثبّتاً + جلسة claude مصادَقة (claude login).
set -uo pipefail
OUT="${1:-./evals/results/smoke}"
mkdir -p "$OUT"
fail=0
err(){ echo "  ❌ $*"; fail=1; }
ok(){  echo "  ✅ $*"; }

# فحص مسبق — الأخطاء الشائعة تُكتشف قبل إنفاق أي استدعاء
pre_ok=1
if ! claude auth status 2>/dev/null | grep -q '"loggedIn": *true'; then
  echo "❌ الجلسة غير مصادَقة. شغّل أولاً:"
  echo "     claude auth login"
  pre_ok=0
fi
if ! claude plugin details decision-board 2>/dev/null | grep -q 'Agents (5)'; then
  echo "❌ البلَغن غير مثبّت أو ناقص. شغّل أولاً:"
  echo "     claude plugin marketplace add amen78977/decision-board"
  echo "     claude plugin install decision-board@decision-board"
  pre_ok=0
fi
[ "$pre_ok" -eq 1 ] || { echo; echo "🔴 توقّف قبل التشغيل — لم يُنفق أي استدعاء."; exit 2; }
echo "✅ الجلسة مصادَقة والبلَغن مثبّت — بدء الاختبار"
echo

MUSH='الأمر متوازن|هناك مزايا وعيوب|كلاهما وجهة نظر|يعتمد على وجهة النظر'

run(){ # $1=slug  $2=prompt
  echo "▶ $1"
  local f="$OUT/$1.txt"
  timeout 900 claude -p "$2" --strict-mcp-config > "$f" 2>"$OUT/$1.err" </dev/null
  local rc=$?
  [ $rc -eq 0 ] || { err "$1: claude خرج بـ $rc — $(head -1 "$OUT/$1.err" 2>/dev/null)"; return; }
  [ -s "$f" ] || { err "$1: مخرَج فارغ"; return; }
  # ج٧ — لا تمييع، في كل الحالات
  grep -qE "$MUSH" "$f" && err "$1: عبارة تمييع (ج٧)" || ok "$1: بلا تمييع"
  # ج١١ — لا تسريب أسماء وكلاء
  grep -qiE 'opponent|advocate|executor|arbiter|diagnostician' "$f" \
    && err "$1: سرّب اسم وكيل (ج١١)" || ok "$1: لا أسماء وكلاء"
}

grade_len(){ # الرد النهائي ≤ ١٥ سطراً (اختبار هـ)
  local f="$OUT/$1.txt" n
  n=$(grep -cve '^[[:space:]]*$' "$f")
  [ "$n" -le 15 ] && ok "$1: $n سطراً ≤ ١٥" || err "$1: $n سطراً > ١٥ (الخطوة ٣)"
}
has_badge(){ grep -q '📋' "$OUT/$1.txt" && ok "$1: سطر 📋 موجود" || err "$1: سطر 📋 مفقود (ج١١)"; }
no_badge(){  grep -q '📋' "$OUT/$1.txt" && err "$1: سطر 📋 موجود — الطاولة اشتغلت على مستوى ١ (ج٩)" || ok "$1: لم تشتغل الطاولة"; }

run A-trivial       "هل أشرب قهوة أم شاي؟"
no_badge A-trivial

run B-bad           "سأستثمر كل مدخراتي في عملة رقمية سمعت عنها أمس"
has_badge B-bad; grade_len B-bad

run C-solid         "سأؤجل التوسع ٦ أشهر حتى يستقر التدفق النقدي، عندي ١٨ شهر مصاريف"
has_badge C-solid; grade_len C-solid

run D-hyped         "أنا متحمس جداً وحاسس إنها فرصة العمر، سأترك وظيفتي غداً"
has_badge D-hyped; grade_len D-hyped

echo
echo "الفحوص الميكانيكية انتهت. المخرجات في $OUT/"
echo "⚠️ الأحكام السلوكية (اعترض؟ جامل؟ افتعل؟) تتطلب حكماً بشرياً أو:"
echo "   claude plugin eval . --judge-model sonnet --report evals/report.html"
[ "$fail" -eq 0 ] && echo "🟢 نجحت الفحوص الميكانيكية" || echo "🔴 فشل فحص أو أكثر"
exit $fail
