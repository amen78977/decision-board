#!/usr/bin/env bash
# تشخيص محلي سريع — لا يرسل بيانات ولا يحتاج جلسة نموذج.
set -uo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"
fail=0
warn=0
ok() { printf '✅ %s\n' "$*"; }
err() { printf '❌ %s\n' "$*"; fail=1; }
notice() { printf '⚠️  %s\n' "$*"; warn=1; }

printf '%s\n' 'Decision Board doctor / تشخيص طاولة القرار'
printf '%s\n' "المسار: $ROOT"

if command -v node >/dev/null 2>&1; then
  node_version=$(node --version)
  ok "Node متاح: $node_version"
else
  err 'Node.js مفقود — مطلوب لتشغيل hook واختبار الكاشف.'
fi

for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json hooks/hooks.json \
         hooks/decision-detector.js scripts/validate.sh scripts/smoke.sh scripts/doctor.sh scripts/check-links.js; do
  [ -r "$f" ] && ok "ملف موجود: $f" || err "ملف مفقود أو غير قابل للقراءة: $f"
done

if command -v node >/dev/null 2>&1; then
  for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json hooks/hooks.json; do
    node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" >/dev/null 2>&1 \
      && ok "JSON صالح: $f" || err "JSON غير صالح: $f"
  done
  node hooks/detector.test.js >/dev/null 2>&1 \
    && ok 'اختبار الكاشف نجح' || err 'اختبار الكاشف فشل — شغّل node hooks/detector.test.js لرؤية التفاصيل.'
  node hooks/detector.integration.test.js >/dev/null 2>&1 \
    && ok 'اختبار hook التكاملي نجح' || err 'اختبار hook التكاملي فشل — شغّل node hooks/detector.integration.test.js لرؤية التفاصيل.'
  node scripts/check-links.js >/dev/null 2>&1 \
    && ok 'الروابط المحلية سليمة' || err 'يوجد رابط Markdown محلي مكسور.'
  bash -n scripts/validate.sh scripts/smoke.sh scripts/doctor.sh \
    && ok 'صياغة السكربتات سليمة' || err 'يوجد خطأ صياغة في أحد السكربتات.'
fi

if command -v claude >/dev/null 2>&1; then
  ok "Claude Code متاح: $(claude --version 2>/dev/null | head -1 || true)"
  if claude auth status 2>/dev/null | grep -q '"loggedIn": *true'; then
    ok 'جلسة Claude مصادقة'
  else
    notice 'Claude Code موجود لكن الجلسة غير مصادقة؛ يلزم ذلك فقط لـ scripts/smoke.sh.'
  fi
else
  notice 'Claude Code غير موجود؛ الفحوص المحلية تعمل، أما smoke الحي فيتطلب تثبيته.'
fi

printf '\n'
if [ "$fail" -eq 0 ]; then
  if [ "$warn" -eq 0 ]; then
    printf '%s\n' '🟢 التشخيص ناجح بلا تحذيرات.'
  else
    printf '%s\n' '🟡 الملفات والاختبارات المحلية سليمة، راجع التحذيرات قبل smoke الحي.'
  fi
else
  printf '%s\n' '🔴 التشخيص فشل؛ أصلح الأخطاء ثم أعد التشغيل.'
fi
exit "$fail"
