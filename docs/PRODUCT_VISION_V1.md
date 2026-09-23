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
- 46 integration test scenarios tracked in MATRIX_STATUS.csv
- 10 PASS, 14 FAIL, 10 OPEN, 1 OTHER (as of 2026-09-23T06:05Z)
- 1 FIXED (MW-2026-073 backend 502 regression, PR #831)
- Priority: P0 security fixes > P1 core features > P2 AI features
- New: MW-2026-079 newsletter tracking pixel consent (GDPR/ePrivacy compliant, issue #823)
- Market watch: Fastmail policy-based privacy (no E2EE), Proton Scribe backlash, Tuta blocks third-party clients, Hey abandons IMAP — misfits.ai differentiators confirmed
- P0 security: Auth bypass (MW-2026-029), CORS reflection (MW-2026-030/031) remain FAIL — routing to dev-web+dev-back
- All 33 FAIL rows have corresponding GitHub issues — no untracked gaps
- PO_TICKET sent: MW-2026-063 bulk email selection FAB → scrum-master (ux-designer)
- Cycle 2026-09-23T05:42Z: 8 failing PRs detected across misfits-web + reimagined-guide. Created 6 new issues (#846-849, #639-640). Routed 8 TICKET_FIX_PR to scrum-master. Bus empty, no ROOT controls. Files OK.
- Cycle 2026-09-23T05:50Z: Bus empty (0 pending). 6 new regression issues detected (#846-849 misfits-web, #639-640 reimagined-guide). Routed 6 TICKET_FIX_PR to scrum-master. No ROOT controls. State=ON.
- Cycle 2026-09-23T06:00Z: Bus empty. 1 new issue detected (#852 Email templates CRUD). Gherkin feature created. Row MW-2026-085 added to MATRIX_STATUS.csv. PO_TICKET routed to scrum-master. State=ON.
- Cycle 2026-09-23T06:05Z: Bus empty (fleetbus MCP unavailable). 14 FAIL rows tracked, all have corresponding GH issues. Market watch: GDPR/NIS2/DORA regulatory update — Digital Omnibus delayed to late 2026/mid 2027, 96h breach notification proposed (still 72h). New MATRIX row MW-2026-086 added. State=ON.
- Cycle 2026-09-23T06:15Z: No new issues or PRs. All failing PRs tracked (#846-849, #639-640). PR #638 CodeQL failure already tracked as issue #640. No ROOT controls. State=ON.
- Cycle 2026-09-23T06:25Z: Bus empty. 2 new failing PRs detected: #504 (reimagined-guide, CodeQL, issue-491 import wizard) + #688 (misfits-web, lint/test, issue-459 email pinning). Both labeled audit-blocked-ci, no dedicated issues. MATRIX row MW-2026-087 added. PO_TICKET routed to scrum-master (SEND_OK pos=469). No ROOT controls. State=ON.
- Cycle 2026-09-23T07:00Z: Bus empty (0 pending). 1 new failing PR detected: #638 (reimagined-guide, CodeQL Analysis, feat/issue-539-instant-search). Issue #641 created. TICKET_FIX_PR routed to scrum-master. MATRIX row MW-2026-088 added. No ROOT controls. State=ON.
- Cycle 2026-09-23T07:10Z: Bus empty (0 pending). 3 new failing PRs detected: #688 (misfits-web, lint/test, email pinning), #670 (misfits-web, lint/test, email digest), #504 (reimagined-guide, CodeQL, import wizard). Issues #854, #855, #642 created. MATRIX rows MW-2026-089/090/091 added. 3 PO_TICKETs routed to scrum-master (SEND_OK pos=477-479). No ROOT controls. State=ON.
- Cycle 2026-09-23T07:30Z: Bus empty (0 pending). No new failing PRs or issues. All 5 failing PRs tracked (#688→#854, #670→#855, #638→#641, #637→#639, #553→#640, #504→#642). 1 UX proposal posted: MW-2026-092 bulk email actions toolbar (SEND_OK pos=481). No ROOT controls. State=ON.
- Cycle 2026-09-23T07:45Z: Bus empty (5 unacked messages ACKed: 3 TICKET_REQUEST + 2 PO_TICKET/STATUS_UPDATE). No new failing PRs or issues. All 5 failing PRs tracked. MATRIX row MW-2026-092 added (bulk email actions toolbar). No ROOT controls. State=ON.
- Cycle 2026-09-23T08:00Z: Bus empty (0 pending). 1 new failing PR detected: #643 (reimagined-guide, CodeQL+Compile, MTA-STS+DANE rebased). Issue #644 created. MATRIX rows MW-2026-011/012 updated with FAIL-ISSUE-644-PR643. PO_TICKET routed to scrum-master. No ROOT controls. State=ON.
- Cycle 2026-09-23T08:10Z: Bus empty (0 pending, 2 unacked outbound). No new failing PRs or issues. All 5 failing PRs tracked (#688→#854, #670→#855, #638→#641, #637→#639, #553→#640, #504→#642, #643→#644). 1 UX proposal posted: MW-2026-083 email snooze presets (SEND_OK). No ROOT controls. State=ON.
