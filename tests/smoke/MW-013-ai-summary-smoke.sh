#!/usr/bin/env bash
# MW-2026-013 smoke test — AI email summary
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

echo "=== Smoke: MW-2026-013 AI email summary ==="

# AI summary API endpoint
check "AI summary API" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/ai/summary" "200"

# Check for AI-related strings in page
ai_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'summary\|résumé\|AI\|intelligence\|LLM\|hermes' | sort -u | head -5)
echo "AI-related strings found: ${ai_check:-none}"

# Check for side panel / drawer UI
panel_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'drawer\|panel\|sidebar\|slide' | sort -u | head -3)
echo "Panel/slide UI found: ${panel_check:-none}"

# Check for loading indicator (async AI)
loading_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'loading\|spinner\|generating\|attend' | head -3)
if [[ -n "$loading_check" ]]; then
  echo "PASS: async/loading indicator found"
  PASS=$((PASS+1))
else
  echo "INFO: no async indicator found"
fi

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
