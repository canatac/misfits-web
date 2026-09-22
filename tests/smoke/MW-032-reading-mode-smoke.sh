#!/bin/bash
# MW-032 Reading Mode — Smoke Test
# Tests that reading mode is NOT yet integrated (expected FAIL)
# When fix is applied, this should detect the reading mode button in the UI

set -uo pipefail

PROD_URL="https://mail.misfits.ai"
ARTIFACT_DIR="/root/misfits-web/tests/integration/gherkin/artifacts"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
ARTIFACT="${ARTIFACT_DIR}/testeur_tick_${TIMESTAMP}_reading_mode_MW032.txt"

echo "=== Testeur Smoke — MW-032 Reading Mode (${TIMESTAMP}) ===" | tee "$ARTIFACT"

# Test 1: Production reachability
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL" 2>&1)
echo "PROD_REACHABILITY: $PROD_URL -> HTTP $HTTP_CODE" | tee -a "$ARTIFACT"
if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Production unreachable" | tee -a "$ARTIFACT"
  exit 1
fi

# Test 2: Check if reading mode strings exist in production JS bundle
# The immersive-reading component uses "Mode lecture immersive" as label
READING_MODE_STRINGS=$(curl -s "$PROD_URL" 2>/dev/null | grep -o "Mode lecture immersive\|immersive-reading\|readingMode" | head -5)
echo "READING_MODE_IN_BUNDLE: ${READING_MODE_STRINGS:-NOT_FOUND}" | tee -a "$ARTIFACT"

# Test 3: Check for BookOpen icon usage (reading mode icon) in bundle
BOOK_OPEN_USAGE=$(curl -s "$PROD_URL" 2>/dev/null | grep -c "BookOpen\|book-open" || true)
echo "BOOKOPEN_IN_BUNDLE: $BOOK_OPEN_USAGE" | tee -a "$ARTIFACT"

# Test 4: Auth bypass non-regression check
API_EMAILS=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/api/emails" 2>&1)
echo "AUTH_BYPASS_API_EMAILS: /api/emails -> HTTP $API_EMAILS (expect 307/401)" | tee -a "$ARTIFACT"

API_EXT=$(curl -s -o /dev/null -w "%{http_code}" "${PROD_URL}/api/external-accounts" 2>&1)
echo "AUTH_BYPASS_API_EXT: /api/external-accounts -> HTTP $API_EXT (expect 307/401)" | tee -a "$ARTIFACT"

# Test 5: Code-level check — immersive-reading.tsx exists but is it wired?
echo "" | tee -a "$ARTIFACT"
echo "=== Code Analysis ===" | tee -a "$ARTIFACT"
cd /root/misfits-web

if [ -f "src/components/mail/immersive-reading.tsx" ]; then
  echo "immersive-reading.tsx: EXISTS" | tee -a "$ARTIFACT"
else
  echo "immersive-reading.tsx: MISSING" | tee -a "$ARTIFACT"
fi

# Check if email-view.tsx imports ImmersiveReading
if grep -q "ImmersiveReading\|immersive-reading" src/components/mail/email-view.tsx 2>/dev/null; then
  IMPORTS=1
else
  IMPORTS=0
fi
echo "email-view.tsx imports reading mode: $IMPORTS" | tee -a "$ARTIFACT"

# Check if EmailToolbar includes reading mode button
if grep -q "ImmersiveReading\|reading.*mode\|BookOpen" src/components/mail/email-view/email-toolbar.tsx 2>/dev/null; then
  TOOLBAR_IMPORTS=1
else
  TOOLBAR_IMPORTS=0
fi
echo "email-toolbar.tsx includes reading mode: $TOOLBAR_IMPORTS" | tee -a "$ARTIFACT"

# Verdict
echo "" | tee -a "$ARTIFACT"
if [ "$IMPORTS" = "0" ]; then
  echo "VERDICT: FAIL — Reading mode component exists but NOT wired into email-view.tsx" | tee -a "$ARTIFACT"
  echo "ISSUE: #745 (test(MW-032): reading mode component exists but not integrated in email-view)" | tee -a "$ARTIFACT"
  exit 1
else
  echo "VERDICT: PASS — Reading mode is integrated in email-view" | tee -a "$ARTIFACT"
  exit 0
fi
