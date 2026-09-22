#!/bin/bash
# MW-2026-034 — Production reachability smoke test
# Tests HTTPS, SMTP 587, IMAP 993 reachability for mail.misfits.ai

set -euo pipefail

HOST="mail.misfits.ai"
PASS=0
FAIL=0
RESULTS=""

check() {
    local name="$1"
    local result="$2"
    if [ "$result" = "OK" ]; then
        PASS=$((PASS + 1))
        RESULTS="${RESULTS}PASS: $name\n"
        echo "  ✓ $name"
    else
        FAIL=$((FAIL + 1))
        RESULTS="${RESULTS}FAIL: $name ($result)\n"
        echo "  ✗ $name — $result"
    fi
}

echo "=== MW-2026-034 Production Reachability ==="
echo "Target: $HOST"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# 1. HTTPS reachability
echo "[1/3] HTTPS (port 443)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "https://${HOST}" 2>&1 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    check "HTTPS 200 OK" "OK"
else
    check "HTTPS 200 OK" "got HTTP $HTTP_CODE"
fi

# 2. SMTP 587
echo "[2/3] SMTP (port 587)"
SMTP_OK=$(nc -zv ${HOST} 587 -w 5 2>&1 && echo "OK" || echo "FAIL")
if [ "$SMTP_OK" = "OK" ]; then
    check "SMTP 587 reachable" "OK"
else
    check "SMTP 587 reachable" "timeout/refused"
fi

# 3. IMAP 993
echo "[3/3] IMAP (port 993)"
IMAP_OK=$(nc -zv ${HOST} 993 -w 5 2>&1 && echo "OK" || echo "FAIL")
if [ "$IMAP_OK" = "OK" ]; then
    check "IMAP 993 reachable" "OK"
else
    check "IMAP 993 reachable" "refused"
fi

echo ""
echo "=== Results: ${PASS} pass / ${FAIL} fail ==="
echo -e "$RESULTS"

if [ $FAIL -gt 0 ]; then
    exit 1
fi
exit 0
