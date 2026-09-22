# Matrice de Tests — Frontend UX 2026-09-10 (3)

## Onboarding checklist (UX-20260910-007, Issue #406)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| First login (no misfits_onboarding_done flag) | Sheet panel appears with "Getting started" + 4 items | P0 |
| localStorage flag set = "done" | Panel does NOT appear | P0 |
| Click "Compose" CTA | Composer opens, checklist item 1 marks complete | P1 |
| Click "Add label" CTA | LabelManager opens, item 2 marks complete | P1 |
| Progress indicator | Shows "X/4" updating in real-time | P1 |
| Click "Skip all" | Panel closes, flag set to done | P1 |
| Press Escape | Panel closes | P2 |
| Click backdrop | Panel closes | P2 |
| Help menu > "Show onboarding" | Panel re-opens even if flag done | P2 |

## Swipe-to-action mobile (UX-20260910-008, Issue #407)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Swipe right >100px on email row (touch) | Archive action revealed, release archives email | P0 |
| Swipe left >100px on email row (touch) | Delete + Snooze actions revealed | P0 |
| Swipe <50px release | No action, row returns to original position | P1 |
| Desktop viewport (pointer: fine) | Swipe does NOT work | P1 |
| Selection mode active | Swipe disabled | P1 |
| Rubber-band damping at extreme scroll | Smooth resistance animation | P2 |

## Inline quick-reply (UX-20260910-009, Issue #408)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Click "Reply to [sender]..." in thread | Inline composer expands | P0 |
| Type + click Send | Reply posted, composer collapses, message appears | P0 |
| Click "Open full composer" | Modal composer opens with recipient pre-filled | P1 |
| Threading OFF | Inline composer NOT visible | P1 |
| After send | 200ms collapse animation, new message in thread (optimistic) | P1 |
| Composer stays in view | Scroll maintains composer visible | P2 |

## Récapitulatif toutes issues UX 2026-09-10

| Issue | Title | Effort | Tests |
|-------|-------|--------|-------|
| #398 | Auto-mark-as-read | M | ✅ matrice 1 |
| #399 | Focus mode | M | ✅ matrice 1 |
| #400 | Sidebar keyboard nav | S | ✅ matrice 1 |
| #402 | Search empty state | S | ✅ matrice 2 |
| #403 | Shortcut help overlay | S | ✅ matrice 2 |
| #404 | Email detail skeleton | S | ✅ matrice 2 |
| #406 | Onboarding checklist | M | ✅ matrice 3 |
| #407 | Swipe-to-action | M | ✅ matrice 3 |
| #408 | Inline quick-reply | M | ✅ matrice 3 |

**Total** : 9 issues, 6 S + 3 M, toutes avec critères d'acceptance testables.
