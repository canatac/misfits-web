#!/usr/bin/env bash
# MW-2026-016 smoke test — Newsletter subscription
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

echo "=== Smoke: MW-2026-016 Newsletter subscription ==="

# Subscription API endpoint
check "Subscription API" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/subscriptions" "200"

# Newsletter folder endpoint
check "Newsletter folder API" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/folders/newsletters" "200"

# Check for newsletter UI strings
newsletter_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'newsletter\|subscription\|subscribe\|abonnement' | sort -u | head -5)
echo "Newsletter strings found: ${newsletter_check:-none}"

# Check for folder management UI
folder_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'folder\|dossier\|Newsletters' | sort -u | head -3)
echo "Folder management found: ${folder_check:-none}"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
