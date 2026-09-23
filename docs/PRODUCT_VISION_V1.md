# Product Vision V1 — misfits.ai Mail

## Vision
Secure, privacy-first email platform with AI-powered productivity features.

## Core Principles
- Zero-access encryption ready
- Post-quantum cryptography support
- AI features (summary, triage, suggested replies)
- Multi-account aggregation (Gmail, IMAP)
- PWA offline support
- GDPR compliant (data deletion, export)

## Stack
- Frontend: Next.js (misfits-web)
- Backend: Rust/Actix-web + MongoDB (reimagined-guide)
- DKIM: studious-octo-rotary-phone

## Status
- 43 integration test scenarios tracked in MATRIX_STATUS.csv
- 9 PASS, 28 FAIL, 5 OPEN, 1 OTHER (as of 2026-09-23T05:30Z)
- 1 FIXED (MW-2026-073 backend 502 regression, PR #831)
- Priority: P0 security fixes > P1 core features > P2 AI features
- New: MW-2026-079 newsletter tracking pixel consent (GDPR/ePrivacy compliant, issue #823)
- Market watch: Fastmail policy-based privacy (no E2EE), Proton Scribe backlash, Tuta blocks third-party clients, Hey abandons IMAP — misfits.ai differentiators confirmed
- P0 security: Auth bypass (MW-2026-029), CORS reflection (MW-2026-030/031) remain FAIL — routing to dev-web+dev-back
- All 28 FAIL rows have corresponding GitHub issues — no untracked gaps
- PO_TICKET sent: MW-2026-063 bulk email selection FAB → scrum-master (ux-designer)
- Cycle 2026-09-23T05:30Z: 9 FAIL rows verified (all have GH issues), 5 OPEN rows in progress, 9 PASS confirmed. No new UX proposals or tickets to route.
