#!/usr/bin/env bash
# MW-2026-005 smoke test — PWA offline access
# Tests for manifest.json, service worker, offline indicators
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

echo "=== Smoke: MW-2026-005 PWA offline ==="

# Manifest is required for PWA
check "manifest.json served (PWA installable)" "curl -s -o /dev/null -w '%{http_code}' $BASE/manifest.json" "200"

# Service worker required for offline
sw_code=$(curl -s -o /dev/null -w '%{http_code}' $BASE/sw.js 2>/dev/null)
echo "INFO: sw.js HTTP $sw_code"

# Should register service worker (check for SW registration script)
sw_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'serviceWorker\|navigator\.service\.worker' | head -1)
if [[ -n "$sw_check" ]]; then
  echo "PASS: service worker registration found in page"
  PASS=$((PASS+1))
else
  echo "FAIL: no service worker registration in page"
  FAIL=$((FAIL+1))
fi

# Check offline-related keywords in JS bundles
offline_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'offline\|cache\|indexedDB\|localStorage' | head -5)
echo "Offline-related strings found: $offline_check"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
