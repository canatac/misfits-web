#!/usr/bin/env bash
# MW-2026-063 smoke test — Bulk email selection with floating action bar (testeur role)
# Tests API-level bulk action endpoint (unauthenticated = auth gate)
set -euo pipefail
BASE="https://mail.misfits.ai"
PASS=0; FAIL=0

check() {
  local desc="$1" cmd="$2" expect="$3"
  result=$(eval "$cmd" 2>&1) && rc=0 || rc=$?
  if [[ "$result" == *"$expect"* ]]; then
    echo "PASS: $desc"
    PASS=$((PASS+1))
  else
    echo "FAIL: $desc (expected '$expect' in '$result')"
    FAIL=$((FAIL+1))
  fi
}

echo "=== Smoke: MW-2026-063 Bulk Email Selection $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# Bulk action endpoint requires auth (should not be callable anonymously)
check "POST /api/emails/bulk-action (unauth) returns 401/405/404" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/emails/bulk-action -H 'Content-Type: application/json' -d '{\"action\":\"archive\",\"ids\":[\"test\"]}'" \
  "4"

# Verify site is still up after tests
check "Site still responds 200" \
  "curl -s -o /dev/null -w '%{http_code}' $BASE/" \
  "200"

# Login page accessible (auth gate intact)
check "Login page 200" \
  "curl -s -o /dev/null -w '%{http_code}' $BASE/login" \
  "200"

# Compose redirect (auth gate)
check "Compose redirects to login (307)" \
  "curl -s -o /dev/null -w '%{http_code}' $BASE/mail/compose" \
  "307"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
echo "NOTE: Full bulk selection UI tests require authenticated session (qa.admin@misfits.fr)"
echo "  Feature not yet implemented — issue #801 is OPEN, awaiting dev implementation"
echo "  Gherkin feature file: tests/integration/gherkin/features/MW-2026-063-bulk-email-selection.feature"

[ $FAIL -eq 0 ] && exit 0 || exit 1
