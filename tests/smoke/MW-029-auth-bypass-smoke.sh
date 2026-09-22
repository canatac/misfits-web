#!/usr/bin/env bash
# MW-2026-029 smoke test — Auth bypass P0 (issue #722, #723)
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

# /api/emails must require auth (401) — CRITICAL: currently returns full inbox
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/emails" 2>/dev/null)
echo "INFO: /api/emails HTTP $code"
if [[ "$code" == "401" ]]; then
  echo "PASS: /api/emails requires auth (401)"
  PASS=$((PASS+1))
else
  echo "FAIL: /api/emails returns HTTP $code without auth — FULL INBOX EXPOSED"
  FAIL=$((FAIL+1))
fi

# /api/emails must not leak email data without auth
body=$(curl -s "$BASE/api/emails" 2>/dev/null)
if echo "$body" | grep -q '"emails"'; then
  count=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('emails',[])))" 2>/dev/null || echo "?")
  echo "FAIL: /api/emails leaks $count emails without auth — DATA EXPOSURE"
  FAIL=$((FAIL+1))
else
  echo "PASS: /api/emails does not leak email data without auth"
  PASS=$((PASS+1))
fi

# /api/hermes/runs must require auth (401)
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/hermes/runs" 2>/dev/null)
echo "INFO: /api/hermes/runs HTTP $code"
if [[ "$code" == "401" ]]; then
  echo "PASS: /api/hermes/runs requires auth (401)"
  PASS=$((PASS+1))
else
  echo "FAIL: /api/hermes/runs returns HTTP $code without auth"
  FAIL=$((FAIL+1))
fi

# /api/admin/ai-activity must require auth (401)
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/ai-activity" 2>/dev/null)
echo "INFO: /api/admin/ai-activity HTTP $code"
if [[ "$code" == "401" ]]; then
  echo "PASS: /api/admin/ai-activity requires auth (401)"
  PASS=$((PASS+1))
else
  echo "FAIL: /api/admin/ai-activity returns HTTP $code without auth"
  FAIL=$((FAIL+1))
fi

# /api/admin/users must require auth (401)
check "Admin/users requires auth (401)" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/admin/users" "401"

# Attachment endpoint must NOT serve files without auth
att_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/emails/PAYP264MB43672D073D43B1A68272FBFBE3BA2@PAYP264MB4367.FRAP264.PROD.OUTLOOK.COM/attachments/att-0" 2>/dev/null)
echo "INFO: attachment endpoint HTTP $att_code"
if [[ "$att_code" == "401" ]]; then
  echo "PASS: Attachment endpoint requires auth (401)"
  PASS=$((PASS+1))
else
  echo "FAIL: Attachment endpoint serves content without auth (HTTP $att_code) — CONFIRMED VULNERABILITY"
  FAIL=$((FAIL+1))
fi

# Verify attachment endpoint does not return PDF content without auth
content_type=$(curl -sI "$BASE/api/emails/PAYP264MB43672D073D43B1A68272FBFBE3BA2@PAYP264MB4367.FRAP264.PROD.OUTLOOK.COM/attachments/att-0" 2>/dev/null | grep -i "content-type" | head -1)
echo "INFO: Content-Type: $content_type"
if [[ "$content_type" == *"application/pdf"* ]]; then
  echo "FAIL: Attachment endpoint serves PDF without auth — DATA EXPOSURE"
  FAIL=$((FAIL+1))
else
  echo "PASS: Attachment endpoint does not serve PDF without auth"
  PASS=$((PASS+1))
fi

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
if [[ "$FAIL" -gt 0 ]]; then
  echo "STATUS: FAIL — authentication bypass confirmed (issues #722, #723)"
  exit 1
else
  echo "STATUS: PASS — all endpoints properly protected"
  exit 0
fi"
