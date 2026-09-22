#!/usr/bin/env bash
# MW-2026-054: Auth gate non-regression smoke test (updated post PR-763)
# Post PR-763 behavior: auth middleware returns 401 JSON for API routes (not 307 redirect)
# Expected: /api/emails → 401 JSON, /api/admin/whoami → 401 JSON, /api/external-accounts → 307
# No PII leak, no CORS reflection
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

# Auth gate: API routes return 401 JSON (auth middleware intercepts before proxy)
check "Emails (auth gate)" "/api/emails" "401"
check "Admin whoami (auth gate)" "/api/admin/whoami" "401"

# Auth gate: redirect routes return 307 (Caddy-level redirect)
check "External accounts (redirect)" "/api/external-accounts" "307"
check "Hermes runs (redirect)" "/api/hermes/runs" "307"
check "Admin ai-activity (redirect)" "/api/admin/ai-activity" "307"
check "Admin users (redirect)" "/api/admin/users" "307"

# No PII leak verification
BODY=$(curl -s --max-time 5 "${BASE}/api/emails" 2>&1)
if echo "$BODY" | grep -q "AUTH_REQUIRED"; then
  PASS=$((PASS+1))
  RESULTS="${RESULTS}\n  PASS | No PII leak (/api/emails returns auth error)"
else
  FAIL=$((FAIL+1))
  RESULTS="${RESULTS}\n  FAIL | PII leak detected in /api/emails"
fi

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
