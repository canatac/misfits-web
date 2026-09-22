#!/usr/bin/env bash
# MW-2026-014 smoke test — AI smart triage
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

echo "=== Smoke: MW-2026-014 AI smart triage ==="

# Triage API endpoint
check "Triage API exists" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/ai/triage" "200"

# Check for priority/triage UI strings
priority_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'priority\|triage\|important\|badge' | sort -u | head -5)
echo "Priority-related strings found: ${priority_check:-none}"

# Check for action suggestion UI
suggestion_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'suggest\|action\|reply.*archive' | head -3)
echo "Suggestion UI found: ${suggestion_check:-none}"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
