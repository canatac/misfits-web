#!/usr/bin/env bash
# MW-2026-052 smoke test — API routes must not return HTTP 502 (issue #755)
set -euo pipefail
BASE="https://mail.misfits.ai"
PASS=0; FAIL=0; RESULTS=""

check() {
  local desc="$1" path="$2"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE$path" 2>/dev/null || echo "000")
  if [[ "$code" == "502" ]]; then
    echo "FAIL: $desc → HTTP $code (backend unreachable)"
    FAIL=$((FAIL+1))
    RESULTS="$RESULTS|$path:FAIL($code)"
  elif [[ "$code" == "200" ]] || [[ "$code" == "401" ]] || [[ "$code" == "403" ]] || [[ "$code" == "404" ]]; then
    echo "PASS: $desc → HTTP $code (reachable)"
    PASS=$((PASS+1))
    RESULTS="$results|$path:PASS($code)"
  elif [[ "$code" == "000" ]]; then
    echo "FAIL: $desc → CONNECTION_REFUSED/TIMEOUT"
    FAIL=$((FAIL+1))
    RESULTS="$RESULTS|$path:FAIL(TIMEOUT)"
  else
    echo "WARN: $desc → HTTP $code (reachable but unexpected)"
    PASS=$((PASS+1))
    RESULTS="$RESULTS|$path:WARN($code)"
  fi
}

echo "=== Smoke: MW-2026-052 API 502 Regression (issue #755) ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Verify frontend is up
frontend_code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$BASE/" 2>/dev/null || echo "000")
echo "Frontend / → HTTP $frontend_code"
if [[ "$frontend_code" != "200" ]]; then
  echo "CRITICAL: Frontend is down (HTTP $frontend_code)"
  exit 1
fi

echo ""
echo "--- API endpoint reachability ---"
check "Health endpoint" "/api/health"
check "Auth login" "/api/auth/login"
check "AI summary" "/api/ai/summary"
check "AI triage" "/api/ai/triage"
check "AI replies" "/api/ai/replies"
check "Newsletters" "/api/newsletters/subscriptions"
check "Threads" "/api/threads"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
echo "RESULTS:$RESULTS"

if [[ $FAIL -gt 0 ]]; then
  echo "REGRESSION DETECTED: $FAIL endpoint(s) returning 502"
  exit 1
fi
echo "ALL API ENDPOINTS REACHABLE"
