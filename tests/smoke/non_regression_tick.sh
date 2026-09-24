#!/usr/bin/env bash
# testeur non-regression suite — production
set -uo pipefail
BASE="https://mail.misfits.ai"
PASS=0; FAIL=0

check() {
  local desc="$1" cmd="$2" expect="$3"
  result=$(eval "$cmd" 2>/dev/null)
  if [[ "$result" == *"$expect"* ]]; then
    echo "PASS: $desc"
    PASS=$((PASS+1))
  else
    echo "FAIL: $desc (expected '$expect' in '$result')"
    FAIL=$((FAIL+1))
  fi
}

echo "=== testeur non-regression — $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="

# 1. Production reachability
check "HTTPS 200" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/" "200"

# 2. Auth bypass regression
check "/api/emails → 307 (auth gate)" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/api/emails" "307"
check "/api/external-accounts → 307" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/api/external-accounts" "307"
check "/api/hermes/runs → 307" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/api/hermes/runs" "307"

# 3. CORS regression
cors_result=$(curl -s -D - -o /dev/null --max-time 10 -X OPTIONS "$BASE/api/emails" -H "Origin: https://evil.com" 2>/dev/null | grep -i "access-control-allow-origin")
if [[ "$cors_result" != *"https://evil.com"* ]]; then
  echo "PASS: CORS not reflected (evil.com rejected)"
  PASS=$((PASS+1))
else
  echo "FAIL: CORS reflected evil.com → $cors_result"
  FAIL=$((FAIL+1))
fi

# 4. Security headers
check "HSTS" "curl -sI --max-time 10 $BASE/ | grep -i strict-transport" "max-age"
check "X-Frame-Options DENY" "curl -sI --max-time 10 $BASE/ | grep -i x-frame-options" "DENY"
check "X-Content-Type-Options" "curl -sI --max-time 10 $BASE/ | grep -i x-content-type" "nosniff"
check "CSP present" "curl -sI --max-time 10 $BASE/ | grep -i content-security-policy" "default-src"

# 5. Attachment auth gate (#421 closed)
check "Attachment → 307 (auth gate)" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/api/emails/test-id/attachments/att-0" "307"

# 6. Compose/send validation
check "POST /api/compose/send → 400" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X POST $BASE/api/compose/send -H 'Content-Type: application/json' -d '{}'" "400"

# 7. Auth/login validation
check "POST /api/auth/login → 400" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{}'" "400"

# 8. Mongo health
health=$(curl -s --max-time 10 "$BASE/api/health" 2>/dev/null)
echo "INFO: Health = $(echo "$health" | head -c 200)"

# 9. Login page
check "Login page 200" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/login" "200"

# 10. Compose redirects to login
check "Compose → 307" "curl -s -o /dev/null -w '%{http_code}' --max-time 10 $BASE/mail/compose" "307"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
