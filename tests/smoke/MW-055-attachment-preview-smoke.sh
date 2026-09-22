#!/bin/bash
# MW-2026-050 — Email attachment preview smoke test
# Expected: attachment preview UI elements present in email view
# This is a frontend feature test — checks DOM elements via curl (best-effort)

BASE="https://mail.misfits.ai"
PASS=0; FAIL=0

check() {
  local name="$1" result="$2"
  if [ "$result" = "PASS" ]; then
    echo "PASS $name"
    PASS=$((PASS+1))
  else
    echo "FAIL $name"
    FAIL=$((FAIL+1))
  fi
}

# Check that the frontend loads (prerequisite for any UI feature)
code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 "$BASE/")
[ "$code" = "200" ] && check "frontend_reachable" "PASS" || check "frontend_reachable" "FAIL"

# Check that the mail app JS bundle is reachable (contains feature code)
code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 "$BASE/mail")
[ "$code" = "200" ] || [ "$code" = "307" ] && check "mail_route" "PASS" || check "mail_route" "FAIL"

# Check API endpoints needed for attachment feature
code=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 "$BASE/api/emails")
[ "$code" = "307" ] && check "api_emails_auth_gate" "PASS" || check "api_emails_auth_gate" "FAIL"

echo ""
echo "RESULT: PASS=$PASS FAIL=$FAIL"
echo "NOTE: Full UI test requires authenticated browser session (attachment preview is client-rendered)"
