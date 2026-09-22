# Matrice de Tests — Frontend UX 2026-09-10 (9)

## Composer templates (UX-20260910-031, Issue #441)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Click "Save as template" | Modal opens, saves subject+body | P0 |
| Templates dropdown | Lists saved templates | P0 |
| Click template | Populates composer fields | P1 |
| Templates persist | Survive page reload | P1 |
| Manage panel | Rename/delete templates | P2 |

## Reading time (UX-20260910-032, Issue #442)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Email >20 words | Reading time shown | P0 |
| 200 wpm standard | ~2 min for 400 words | P1 |
| HTML email | Tags stripped before count | P1 |
| <20 words | No indicator | P2 |
| >2000 words | "Long read" label | P2 |

## External recipient warning (UX-20260910-033, Issue #443)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Send to external | Modal dialog appears | P0 |
| Dialog content | Lists external addresses | P0 |
| "Don't ask again" | Suppresses for session | P1 |
| Internal only | No dialog, sends directly | P1 |
| Cancel | Returns to composer | P2 |

## Récapitulatif FINAL — Issues UX 2026-09-10

| Issue | Title | Effort |
|-------|-------|--------|
| #398 | Auto-mark-as-read | M |
| #399 | Focus mode | M |
| #400 | Sidebar keyboard nav | S |
| #402 | Search empty state | S |
| #403 | Shortcut help overlay | S |
| #404 | Email detail skeleton | S |
| #406 | Onboarding checklist | M |
| #407 | Swipe-to-action | M |
| #408 | Inline quick-reply | M |
| #412 | Skip-to-content | S |
| #413 | Dashboard skeletons | S |
| #414 | Notification prefs | M |
| #415 | Expanded search bar | M |
| #416 | Persist filter tab | S |
| #417 | Persist thread state | S |
| #418 | AI prompt suggestions | M |
| #419 | ARIA live regions | S |
| #420 | Prefetch on hover | S |
| #423 | Mark all as read | S |
| #424 | Search autocomplete | M |
| #425 | Label quick-filter | M |
| #427 | PWA offline banner | M |
| #428 | Contact hover card | M |
| #429 | Bulk label assignment | M |
| #433 | Search history | S |
| #434 | Settings tabs | M |
| #435 | Focus visible WCAG | S |
| #437 | Undo destructive | M |
| #438 | Thread expand/collapse | S |
| #439 | Error boundary | S |
| #441 | Composer templates | M |
| #442 | Reading time | S |
| #443 | External recipient warning | S |

**TOTAL** : 33 issues UX, 19 S + 14 M
