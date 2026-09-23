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
- 4 PASS, 30 FAIL, 5 OPEN, 1 FIXED (as of 2026-09-23T04:55Z)
- 1 FIXED (MW-2026-073 backend 502 regression, PR #831)
- Priority: P0 security fixes > P1 core features > P2 AI features
- New: MW-2026-079 newsletter tracking pixel consent (GDPR/ePrivacy compliant, issue #823)
- Market watch: Fastmail policy-based privacy (no E2EE), Proton Scribe backlash, Tuta blocks third-party clients, Hey abandons IMAP — misfits.ai differentiators confirmed
