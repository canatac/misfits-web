#!/bin/bash
# MW-2026-032 Reading mode — production smoke test
# Tests whether reading mode UI is available in the deployed app

BASE_URL="https://mail.misfits.ai"
PASS=0
FAIL=0

echo "=== MW-2026-032 Reading Mode Smoke Test ==="
echo "Target: $BASE_URL"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Test 1: Homepage reachable
echo "[TEST 1] Homepage reachable"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  PASS: HTTP $HTTP_CODE"
    PASS=$((PASS+1))
else
    echo "  FAIL: HTTP $HTTP_CODE (expected 200)"
    FAIL=$((FAIL+1))
fi

# Test 2: Login page reachable
echo "[TEST 2] Login page reachable"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/login")
if [ "$HTTP_CODE" = "200" ]; then
    echo "  PASS: HTTP $HTTP_CODE"
    PASS=$((PASS+1))
else
    echo "  FAIL: HTTP $HTTP_CODE (expected 200)"
    FAIL=$((FAIL+1))
fi

# Test 3: Check for reading mode in deployed page
echo "[TEST 3] Reading mode references in deployed page"
PAGE_CONTENT=$(curl -s --max-time 10 "$BASE_URL" 2>/dev/null)
if echo "$PAGE_CONTENT" | grep -qi "reading\|immersive\|lecture"; then
    echo "  PASS: reading mode references found in page"
    PASS=$((PASS+1))
else
    echo "  FAIL: no reading mode references in deployed page"
    FAIL=$((FAIL+1))
fi

# Test 4: Auth gate still functional
echo "[TEST 4] Auth bypass regression check /api/emails"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$BASE_URL/api/emails")
if [ "$HTTP_CODE" != "200" ]; then
    echo "  PASS: /api/emails returns HTTP $HTTP_CODE (auth gate OK)"
    PASS=$((PASS+1))
else
    echo "  FAIL: /api/emails returns 200 (AUTH BYPASS!)"
    FAIL=$((FAIL+1))
fi

echo ""
echo "=== RESULTS: PASS=$PASS FAIL=$FAIL ==="
if [ "$FAIL" -gt 0 ]; then
    echo "OVERALL: FAIL"
    exit 1
else
    echo "OVERALL: PASS"
    exit 0
fi
