#!/usr/bin/env bash
# اختبار شامل للإضافة من جذر المستودع.
# الاستخدام: ./scripts/full-plugin-test.sh [--require-live] [output_dir]
set -uo pipefail

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
REQUIRE_LIVE=0
OUT="$ROOT/evals/results/full-plugin"

if [ "${1:-}" = "--require-live" ]; then
  REQUIRE_LIVE=1
  shift
fi
[ -n "${1:-}" ] && OUT="$1"
mkdir -p "$OUT"
cd "$ROOT"
fail=0
live_skipped=0
ok() { printf '✅ %s\n' "$*"; }
err() { printf '❌ %s\n' "$*"; fail=1; }
warn() { printf '⚠️  %s\n' "$*"; }
run_check() {
  local label="$1"; shift
  if "$@" >"$OUT/${label}.log" 2>&1; then
    ok "$label"
  else
    err "$label — راجع $OUT/${label}.log"
  fi
}

printf '%s\n' 'Decision Board full plugin test / الاختبار الشامل'
printf '%s\n' "المستودع: $ROOT"
printf '%s\n' "المخرجات: $OUT"

run_check syntax-bash bash -n scripts/validate.sh scripts/smoke.sh scripts/doctor.sh scripts/full-plugin-test.sh
run_check syntax-js node --check hooks/decision-detector.js
run_check syntax-js-integration node --check hooks/detector.integration.test.js
run_check syntax-js-links node --check scripts/check-links.js
run_check syntax-js-universal node --check scripts/universal-contract.test.js
run_check syntax-core-runtime node --check core/src/runtime.js
run_check syntax-core-clarification node --check core/src/clarification.js
run_check syntax-core-validation node --check core/src/validation.js
run_check unit-core node core/test/core.test.js
run_check unit-providers node core/test/providers.test.js
run_check benchmark-core node core/benchmark/runner.js
run_check unit-universal node scripts/universal-contract.test.js
run_check unit-detector node hooks/detector.test.js
run_check integration-hook node hooks/detector.integration.test.js
run_check markdown-links node scripts/check-links.js
run_check structural-validator bash scripts/validate.sh
run_check doctor ./scripts/doctor.sh

# محاكاة حزمة موزعة: لا نعتمد على أن المسار المحلي يعمل بالصدفة.
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
cp -a . "$stage/decision-board"
rm -rf "$stage/decision-board/.git" "$stage/decision-board/evals/results"
if [ -f "$stage/decision-board/.claude-plugin/plugin.json" ] && \
   [ -f "$stage/decision-board/hooks/hooks.json" ] && \
   [ -f "$stage/decision-board/commands/review.md" ]; then
  ok 'staged-package: manifests والـhook والأمر موجودة بعد النسخ'
else
  err 'staged-package: الحزمة المنسوخة ناقصة'
fi
if printf '%s' '{"prompt":"Can you help me decide whether to take this offer?"}' | \
   CLAUDE_PLUGIN_ROOT="$stage/decision-board" node "$stage/decision-board/hooks/decision-detector.js" | \
   grep -q '<decision-board-trigger>'; then
  ok 'staged-hook: يعمل من CLAUDE_PLUGIN_ROOT بعد محاكاة التثبيت'
else
  err 'staged-hook: فشل التشغيل من الحزمة المنسوخة'
fi

# نتحقق من inventory حتى قبل smoke؛ هذا يلتقط تثبيتًا ناقصًا أو manifest غير متوافق.
details=''
claude_available=0
if command -v claude >/dev/null 2>&1; then
  claude_available=1
  details=$(claude plugin details decision-board 2>/dev/null || true)
  if grep -q 'Agents (6)' <<<"$details" && \
     grep -q 'Skills (3)' <<<"$details" && \
     grep -q 'Hooks (1)' <<<"$details"; then
    ok 'installed-inventory: Agents (6), Skills (3), Hooks (1)'
  elif printf '%s' "$details" | grep -qiE 'not found|غير مثبت|No plugin'; then
    warn 'installed-inventory: البلَغن غير مثبت في HOME الحالي؛ تم التحقق من الحزمة المحلية فقط'
  elif [ -n "$details" ]; then
    err 'installed-inventory: inventory لا يطابق Agents (6), Skills (3), Hooks (1)'
  else
    warn 'installed-inventory: البلَغن غير مثبت في HOME الحالي؛ تم التحقق من الحزمة المحلية فقط'
  fi
else
  warn 'installed-inventory: Claude Code غير متاح؛ تم التحقق من الحزمة المحلية فقط'
fi

# الاختبار الحي يستهلك استدعاءات نموذج، لذلك لا يُشغّل إلا إذا كانت البيئة جاهزة.
if [ "$claude_available" -eq 1 ] && \
   claude auth status 2>/dev/null | grep -q '"loggedIn": *true' && \
   grep -q 'Agents (6)' <<<"$details" && \
   grep -q 'Skills (3)' <<<"$details" && \
   grep -q 'Hooks (1)' <<<"$details"; then
  if bash scripts/smoke.sh "$OUT/live" >"$OUT/live.log" 2>&1; then
    ok 'live-smoke: نجح الاختبار السلوكي الحي'
  else
    err "live-smoke: فشل — راجع $OUT/live.log"
  fi
else
  live_skipped=1
  if [ "$claude_available" -eq 1 ] && [ -n "$details" ]; then
    bash scripts/smoke.sh "$OUT/preflight" >"$OUT/preflight.log" 2>&1
    preflight_rc=$?
    if [ "$preflight_rc" -eq 2 ]; then
      ok 'smoke-preflight: توقف قبل استدعاء النموذج عند عدم الجاهزية'
    else
      err "smoke-preflight: رمز الخروج $preflight_rc بدل 2 — راجع $OUT/preflight.log"
    fi
  fi
  if [ "$REQUIRE_LIVE" -eq 1 ]; then
    err 'live-smoke: مطلوب لكن Claude Code أو المصادقة أو inventory الإضافة غير جاهزة'
  else
    warn 'live-smoke: تم تخطيه؛ استخدم --require-live لإجبار تشغيله في بيئة Claude Code مصادقة'
  fi
fi

printf '\n'
if [ "$fail" -eq 0 ] && [ "$live_skipped" -eq 0 ]; then
  printf '%s\n' '🟢 الاختبار الشامل نجح، بما في ذلك smoke الحي.'
elif [ "$fail" -eq 0 ]; then
  printf '%s\n' '🟡 الفحوص المحلية ومحاكاة الحزمة نجحت؛ smoke الحي تخطي تحذيريًا.'
else
  printf '%s\n' '🔴 الاختبار الشامل فشل.'
fi
exit "$fail"
