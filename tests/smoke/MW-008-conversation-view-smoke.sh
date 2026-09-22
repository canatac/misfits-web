#!/usr/bin/env bash
# MW-2026-008 smoke test — Conversation view
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

echo "=== Smoke: MW-2026-008 Conversation view ==="

# Thread/conversation API
check "Thread view API" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/emails/threads" "200"

# Check for thread/conversation UI strings
thread_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'thread\|conversation\|Discussion' | sort -u | head -5)
echo "Thread-related strings found: ${thread_check:-none}"

# Check for bulk archive/delete actions
bulk_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'archive\|bulk\|Supprimer.*tout\|Archiver' | head -5)
echo "Bulk action strings found: ${bulk_check:-none}"

# Message count display (conversation-style)
count_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'messageCount\|message-count\|unreadCount' | head -3)
if [[ -n "$count_check" ]]; then
  echo "PASS: conversation-style count display found"
  PASS=$((PASS+1))
else
  echo "INFO: no conversation-style count display"
fi

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
