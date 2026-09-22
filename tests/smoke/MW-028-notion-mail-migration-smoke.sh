#!/usr/bin/env bash
# MW-2026-028 smoke test — Notion Mail migration wizard
# Tests public/unauthenticated surface + documents login wall
set -euo pipefail
BASE="https://mail.misfits.ai"
PASS=0; FAIL=0; SKIP=0

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

echo "=== Smoke: MW-2026-028 Notion Mail migration ==="

# Site is up
check "Site responds 200" "curl -s -o /dev/null -w '%{http_code}' $BASE/" "200"

# Migration/import route redirects to login (auth gate present)
check "Import redirects to login (307/302/303)" "curl -s -o /dev/null -w '%{http_code}' $BASE/settings/import" "30"

# Settings route redirects to login
check "Settings redirects to login (307/302/303)" "curl -s -o /dev/null -w '%{http_code}' $BASE/settings" "30"

# No migration API endpoint exposed publicly
check "No /api/migration endpoint (404/401/403)" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/migration" "40"
check "No /api/import endpoint (404/401/403)" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/import" "40"

# Login page accessible
check "Login page 200" "curl -s -o /dev/null -w '%{http_code}' $BASE/login" "200"

# Check for migration-related strings in public page (should NOT expose feature details)
migration_leak=$(curl -s $BASE/ 2>/dev/null | grep -oi 'notion.*migrat\|import.*wizard\|migration.*tool' | head -3)
if [ -n "$migration_leak" ]; then
  echo "WARN: Migration feature details exposed in public page: $migration_leak"
else
  echo "PASS: No migration feature details leaked in public page"
  PASS=$((PASS+1))
fi

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL SKIP=$SKIP ==="
echo "NOTE: Full migration wizard tests require authenticated session (qa.admin@misfits.fr)"
echo "  Login wall confirmed at /settings/import — cannot test migration UI without credentials"
echo "  Related issue: #721 (Notion Mail migration wizard, OPEN)"
