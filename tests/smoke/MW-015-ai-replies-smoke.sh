#!/usr/bin/env bash
# MW-2026-015 smoke test — AI suggested replies
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

echo "=== Smoke: MW-2026-015 AI suggested replies ==="

# Suggested replies API
check "AI replies API" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/ai/replies" "200"

# Check for suggestion UI
reply_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'suggest.*reply\|reply.*suggest\|quick.*response\|Réponses suggérées' | sort -u | head -5)
echo "Reply suggestion UI found: ${reply_check:-none}"

# Check for compose integration
compose_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'composer\|compose\|reply.*composer' | sort -u | head -3)
echo "Compose integration found: ${compose_check:-none}"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
