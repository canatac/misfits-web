#!/usr/bin/env bash
# MW-2026-029 smoke test — Auth bypass P0 (issue #722)
# Verifies that unauthenticated access to sensitive endpoints is rejected
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

echo "=== Smoke: MW-2026-029 Auth Bypass (P0) ==="

# /api/mail/inbox must require auth (401)
check "Inbox requires auth (401)" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/mail/inbox" "401"

# /api/admin/users must require auth (401)
check "Admin/users requires auth (401)" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/admin/users" "401"

# /api/admin/stats must require auth (401)
check "Admin/stats requires auth (401)" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/admin/stats" "401"

# Attachment endpoint must NOT serve files without auth
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/emails/07547fb5-cec4-af4a-277d-3b22cdf83d73@misfits.ai/attachments/att-0" 2>/dev/null)
echo "INFO: attachment endpoint HTTP $code (expected 401)"
if [[ "$code" == "401" ]]; then
  echo "PASS: Attachment endpoint requires auth (401)"
  PASS=$((PASS+1))
else
  echo "FAIL: Attachment endpoint serves content without auth (HTTP $code) — CONFIRMED VULNERABILITY"
  FAIL=$((FAIL+1))
fi

# Verify attachment endpoint does not return PDF content
content_type=$(curl -sI "$BASE/api/emails/07547fb5-cec4-af4a-277d-3b22cdf83d73@misfits.ai/attachments/att-0" 2>/dev/null | grep -i "content-type" | head -1)
echo "INFO: Content-Type: $content_type"
if [[ "$content_type" != *"application/pdf"* ]]; then
  echo "PASS: Attachment endpoint does not serve PDF without auth"
  PASS=$((PASS+1))
else
  echo "FAIL: Attachment endpoint serves PDF without auth — DATA EXPOSURE"
  FAIL=$((FAIL+1))
fi

# Verify inbox response body contains AUTH_REQUIRED
check "Inbox response has AUTH_REQUIRED" "curl -s $BASE/api/mail/inbox" "AUTH_REQUIRED"

# Verify admin/users response body contains AUTH_REQUIRED
check "Admin/users response has AUTH_REQUIRED" "curl -s $BASE/api/admin/users" "AUTH_REQUIRED"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
if [[ "$FAIL" -gt 0 ]]; then
  echo "STATUS: FAIL — authentication bypass confirmed (issue #722)"
  exit 1
else
  echo "STATUS: PASS — all endpoints properly protected"
  exit 0
fi
