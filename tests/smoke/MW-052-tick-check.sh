#!/bin/bash
# MW-2026-052 — API 502 regression live check (testeur tick)
# Tests all /api routes against production for HTTP 502

BASE="https://mail.misfits.ai"
PASS=0
FAIL=0
RESULTS=""

check() {
  local ep=$1
  local code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}${ep}" --max-time 10 2>&1)
  if [ "$code" = "502" ]; then
    FAIL=$((FAIL+1))
    RESULTS="${RESULTS}${ep} -> ${code} FAIL\n"
  else
    PASS=$((PASS+1))
    RESULTS="${RESULTS}${ep} -> ${code} OK\n"
  fi
}

# Frontend
code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/" --max-time 10 2>&1)
if [ "$code" = "200" ]; then
  PASS=$((PASS+1))
  RESULTS="${RESULTS}/ -> ${code} OK (frontend up)\n"
else
  FAIL=$((FAIL+1))
  RESULTS="${RESULTS}/ -> ${code} FAIL (frontend down)\n"
fi

# API endpoints
check "/api/health"
check "/api/auth/login"
check "/api/ai/summary"
check "/api/ai/triage"
check "/api/ai/replies"
check "/api/newsletters/subscriptions"
check "/api/threads"
check "/api/emails"

echo -e "${RESULTS}"
echo "SUMMARY: PASS=${PASS} FAIL=${FAIL}"
if [ "$FAIL" -gt 0 ]; then
  echo "STATUS: REGRESSION — ${FAIL} endpoint(s) returning 502"
  exit 1
else
  echo "STATUS: ALL CLEAR"
  exit 0
fi
