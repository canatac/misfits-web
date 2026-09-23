#!/bin/bash
echo "=== SMOKE TEST TESTEUR $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
echo "=== OPEN features from MATRIX_STATUS ==="

echo "--- MW-2026-044 Composer focus mode ---"
curl -s -o /dev/null -w "  GET /compose: %{http_code}\n" https://mail.misfits.ai/compose
curl -s -o /dev/null -w "  GET /api/compose/focus-mode: %{http_code}\n" https://mail.misfits.ai/api/compose/focus-mode

echo "--- MW-2026-075/076 Disposable aliases ---"
curl -s -o /dev/null -w "  GET /api/aliases: %{http_code}\n" https://mail.misfits.ai/api/aliases
curl -s -o /dev/null -w "  POST /api/aliases/create: %{http_code}\n" -X POST https://mail.misfits.ai/api/aliases/create
curl -s -o /dev/null -w "  GET /settings/aliases: %{http_code}\n" https://mail.misfits.ai/settings/aliases

echo "--- MW-2026-077 Pro plan subscription ---"
curl -s -o /dev/null -w "  GET /pricing: %{http_code}\n" https://mail.misfits.ai/pricing
curl -s -o /dev/null -w "  GET /api/subscription/plan: %{http_code}\n" https://mail.misfits.ai/api/subscription/plan
curl -s -o /dev/null -w "  POST /api/subscription/upgrade: %{http_code}\n" -X POST https://mail.misfits.ai/api/subscription/upgrade
curl -s -o /dev/null -w "  GET /api/billing/invoices: %{http_code}\n" https://mail.misfits.ai/api/billing/invoices

echo "--- MW-2026-081 Undo send ---"
curl -s -o /dev/null -w "  GET /api/compose/undo: %{http_code}\n" https://mail.misfits.ai/api/compose/undo

echo "--- MW-2026-082 Keyboard shortcuts ---"
curl -s -o /dev/null -w "  GET /api/shortcuts: %{http_code}\n" https://mail.misfits.ai/api/shortcuts

echo "--- MW-2026-083 Email snooze ---"
curl -s -o /dev/null -w "  GET /api/snooze: %{http_code}\n" https://mail.misfits.ai/api/snooze
curl -s -o /dev/null -w "  POST /api/snooze: %{http_code}\n" -X POST https://mail.misfits.ai/api/snooze

echo "--- MW-2026-084 Email pin/star ---"
curl -s -o /dev/null -w "  POST /api/pin: %{http_code}\n" -X POST https://mail.misfits.ai/api/pin
curl -s -o /dev/null -w "  POST /api/star: %{http_code}\n" -X POST https://mail.misfits.ai/api/star
curl -s -o /dev/null -w "  GET /mail/starred: %{http_code}\n" https://mail.misfits.ai/mail/starred

echo "--- Security baseline ---"
curl -s -o /dev/null -w "  GET /api/admin/users (anon): %{http_code}\n" https://mail.misfits.ai/api/admin/users
curl -s -o /dev/null -w "  GET /api/mail/inbox (anon): %{http_code}\n" https://mail.misfits.ai/api/mail/inbox
curl -sI https://mail.misfits.ai/ 2>/dev/null | grep -iE 'strict-transport|x-frame|x-content|x-xss' | sed 's/^/  /'

echo "--- Site health ---"
curl -s -o /dev/null -w "  GET / (root): %{http_code}\n" https://mail.misfits.ai/
echo "---END---"
