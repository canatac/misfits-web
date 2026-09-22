#!/usr/bin/env bash
# MW-2026-007 smoke test — Create event from email
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

echo "=== Smoke: MW-2026-007 Create event from email ==="

# Calendar/event API endpoint
check "Calendar event API exists" "curl -s -o /dev/null -w '%{http_code}' $BASE/api/calendar/events" "200"

# Check for calendar-related code in main bundle
cal_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'calendar\|ical\|event\|CalDAV' | sort -u | head -5)
echo "Calendar-related strings found: ${cal_check:-none}"

# Check for calendar route/page
route_check=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/calendar" 2>/dev/null)
echo "INFO: /calendar route HTTP $route_check"

# Email toolbar should have event creation
toolbar_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'createEvent\|create-event\|Calendrier\| Créer.*événement' | head -3)
if [[ -n "$toolbar_check" ]]; then
  echo "PASS: event creation UI string found"
  PASS=$((PASS+1))
else
  echo "FAIL: no event creation UI string found"
  FAIL=$((FAIL+1))
fi

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
