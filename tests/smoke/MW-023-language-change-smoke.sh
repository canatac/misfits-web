#!/usr/bin/env bash
# MW-2026-023 smoke test — Interface language change
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

echo "=== Smoke: MW-2026-023 Interface language change ==="

# Check for i18n / locale files
i18n_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'i18n\|locale\|lang\|intl\|translation\|messages' | sort -u | head -5)
echo "i18n-related strings found: ${i18n_check:-none}"

# Check for language JSON files
lang_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'en\.json\|fr\.json\|locales\|\.json.*lang' | sort -u | head -3)
echo "Language resource files found: ${lang_check:-none}"

# Settings route (where language selector would live)
settings_code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/settings" 2>/dev/null || echo "000")
echo "INFO: /settings HTTP $settings_code"

# Check for selector/dropdown UI
select_check=$(curl -s $BASE/ 2>/dev/null | grep -o 'select.*lang\|language.*select\|dropdown' | head -3)
echo "Selector UI found: ${select_check:-none}"

# The page is rendered in French (default)
check "Default language is French" "curl -s $BASE/ 2>/dev/null | grep -o 'lang=\"fr\"\|lang=\\\"fr\\\"\|html.*fr\|fr-FR'" "fr"

echo ""
echo "=== Summary: PASS=$PASS FAIL=$FAIL ==="
