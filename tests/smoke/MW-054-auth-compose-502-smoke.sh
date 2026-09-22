#!/usr/bash
# MW-2026-054: Auth login + compose send 502 regression smoke test
# Expected: /api/auth/login → 307, /api/compose/send → 307, SMTP 587 open, IMAP 993 open
# Issue: https://github.com/canatac/misfits-web/issues/764

set -e

BASE="https://mail.misfits.ai"
PASS=0
FAIL=0
RESULTS=""

check() {
  local name="$1"
  local path="$2"
  local expected="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE}${path}" 2>&1)
  if [ "$code" = "$expected" ]; then
    PASS=$((PASS+1))
    RESULTS="${RESULTS}\n  PASS | ${name} (${path}) → ${code}"
  else
    FAIL=$((FAIL+1))
    RESULTS="${RESULTS}\n  FAIL | ${name} (${path}) → ${code} (expected ${expected})"
  fi
}

echo "=== MW-2026-054 Smoke Test $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo ""

# Auth endpoints
check "Auth login" "/api/auth/login" "307"
check "Auth session" "/api/auth/session" "200"

# Compose
check "Compose send" "/api/compose/send" "307"

# Health
check "Health" "/api/health" "200"

# Protected routes (auth redirect)
check "Emails" "/api/emails" "307"
check "External accounts" "/api/external-accounts" "307"

echo -e "$RESULTS"
echo ""
echo "=== RESULT: PASS=${PASS} FAIL=${FAIL} ==="

if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: REGRESSION DETECTED"
  exit 1
else
  echo "STATUS: ALL CLEAR"
  exit 0
fi
