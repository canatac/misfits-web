#!/usr/bin/env bash
# MW-2026-032 smoke test — Reading mode (HTML sanitize)
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

echo "=== Smoke: MW-2026-032 Reading mode ==="

# Site is up
check "Site responds 200" "curl -s -o /dev/null -w '%{http_code}' $BASE/" "200"

# Check for reading mode related strings in public page
reading_strings=$(curl -s "$BASE/" 2>/dev/null | grep -oi 'reading.mode\|mode.lecture\|sanitize\|distraction.free' | head -3)
echo "Reading mode strings on homepage: ${reading_strings:-none}"

# Check /reading route
reading_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/reading" 2>/dev/null || echo "000")
echo "INFO: /reading HTTP $reading_code"

# Check email detail route (should redirect to login)
email_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/mail/email/test-id" 2>/dev/null || echo "000")
echo "INFO: /mail/email/test-id HTTP $email_code"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
echo "NOTE: Full reading mode tests require authenticated session (qa.admin@misfits.fr)"
echo "  Related issue: #724 (Reading mode, OPEN — UX feature)"
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
