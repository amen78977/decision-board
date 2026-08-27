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
  node_major=$(node -p "process.versions.node.split('.')[0]")
  if [ "$node_major" -ge 18 ]; then
    ok "Node متاح ومدعوم: $node_version"
  else
    err "Node قديم: $node_version — الحد الأدنى المطلوب 18."
  fi
else
  err 'Node.js مفقود — مطلوب لتشغيل hook واختبار الكاشف.'
fi

for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json hooks/hooks.json \
         hooks/decision-detector.js scripts/validate.sh scripts/smoke.sh scripts/doctor.sh scripts/check-links.js \
         scripts/full-plugin-test.sh scripts/universal-contract.test.js \
         standalone/UNIVERSAL.md standalone/UNIVERSAL.ar.md docs/ADAPTERS.md docs/RUNTIME.md \
         core/package.json core/README.md core/LICENSE core/src/runtime.js core/src/clarification.js core/src/validation.js core/src/providers.js \
         core/test/core.test.js core/test/providers.test.js core/benchmark/runner.js \
         core/schemas/neutral-packet.schema.json core/schemas/role-output.schema.json \
         core/schemas/clarification.schema.json core/schemas/clarification-batch.schema.json; do
  [ -r "$f" ] && ok "ملف موجود: $f" || err "ملف مفقود أو غير قابل للقراءة: $f"
done

if command -v node >/dev/null 2>&1; then
  for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json hooks/hooks.json core/package.json core/schemas/*.json; do
    node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" >/dev/null 2>&1 \
      && ok "JSON صالح: $f" || err "JSON غير صالح: $f"
  done
  node hooks/detector.test.js >/dev/null 2>&1 \
    && ok 'اختبار الكاشف نجح' || err 'اختبار الكاشف فشل — شغّل node hooks/detector.test.js لرؤية التفاصيل.'
  node hooks/detector.integration.test.js >/dev/null 2>&1 \
    && ok 'اختبار hook التكاملي نجح' || err 'اختبار hook التكاملي فشل — شغّل node hooks/detector.integration.test.js لرؤية التفاصيل.'
  node scripts/check-links.js >/dev/null 2>&1 \
    && ok 'الروابط المحلية سليمة' || err 'يوجد رابط Markdown محلي مكسور.'
  node scripts/universal-contract.test.js >/dev/null 2>&1 \
    && ok 'عقد المحول العالمي سليم' || err 'اختبار عقد المحول العالمي فشل.'
  node core/test/core.test.js >/dev/null 2>&1 \
    && ok 'اختبار core سليم' || err 'اختبار core فشل.'
  node core/test/providers.test.js >/dev/null 2>&1 \
    && ok 'اختبار adapters سليم' || err 'اختبار adapters فشل.'
  node core/benchmark/runner.js >/dev/null 2>&1 \
    && ok 'benchmark سليم' || err 'benchmark فشل.'
  bash -n scripts/validate.sh scripts/smoke.sh scripts/doctor.sh scripts/full-plugin-test.sh \
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
