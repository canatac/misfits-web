# Backlog grooming quick policy

Purpose: avoid `backlog_grooming_needed` by enforcing complete, routable issues.

## Minimum fields (required)
- Type: bug | regression | security | feature | chore
- Priority: P0 | P1 | P2
- Scope: concise statement of impacted area
- Expected result: verifiable acceptance condition
- Evidence/reproduction: links, commands, traces

## Routing rule
- `dev-web`: frontend/Next.js/UI route issues
- `dev-back`: Rust/Actix/API/SMTP/DKIM issues
- `dev-int`: cross-repo contracts/wiring/regressions
- `testeur`: reproducible QA scenario coverage

## Priority order
1. P0 (bug/regression/security)
2. P1 (feature)
3. P2 (chore/docs)

## Ready-for-dispatch checklist
- [ ] Issue has required fields completed
- [ ] Priority is explicit (P0/P1/P2)
- [ ] Scope maps to one owner role
- [ ] Acceptance criterion is testable
- [ ] Evidence is attached
