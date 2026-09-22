#!/usr/bin/env bash
# MW-2026-032 smoke test — Reading mode
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

echo "=== Smoke: MW-2026-032 Reading mode ==="

# Check homepage loads
home_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/" 2>/dev/null || echo "000")
echo "INFO: / HTTP $home_code"

# Check for reading mode related strings in the app bundle
rm_check=$(curl -s "$BASE/" 2>/dev/null | grep -oi 'reading.mode\|reading-mode\|readmode\|focus.mode\|focus-mode\|reader' | sort -u | head -5)
echo "Reading-mode strings found: ${rm_check:-none}"

# Check for sanitizer/DOMPurify (used for HTML sanitization in reading mode)
sanitize_check=$(curl -s "$BASE/" 2>/dev/null | grep -oi 'dompurify\|sanitize\|sanitizer' | sort -u | head -3)
echo "Sanitization library refs: ${sanitize_check:-none}"

# Check mail route (where reading mode would be triggered)
mail_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/mail" 2>/dev/null || echo "000")
echo "INFO: /mail HTTP $mail_code (307 expected without auth)"

# Check for toolbar UI elements
toolbar_check=$(curl -s "$BASE/" 2>/dev/null | grep -oi 'toolbar\|email.header\|email-toolbar' | sort -u | head -3)
echo "Toolbar UI refs: ${toolbar_check:-none}"

# Verify reading mode is NOT yet implemented (expecting FAIL per MATRIX)
if [[ -z "$rm_check" ]]; then
  echo "FAIL: No reading mode UI found in frontend bundle (feature not yet implemented)"
  FAIL=$((FAIL+1))
else
  echo "INFO: Reading mode strings detected in bundle"
  PASS=$((PASS+1))
fi

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
