# Matrice de Tests — Frontend UX 2026-09-10 (5)

## Expanded search bar with inline filter chips (UX-20260910-013, Issue #415)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Typing "jo" in search | OperatorHintsPanel dropdown appears below input | P0 |
| Select "from:" operator | Chip "from:" inserted into query | P0 |
| Delete chip via X button | Chip removed, query updated | P1 |
| Multiple chips render | Horizontal row below input | P1 |
| "Clear all" button visible when chips exist | Clicking resets query to empty | P1 |
| Chips styled correctly | Brand color (#C49B66) for key, muted for value | P2 |

## Persist last-selected filter tab (UX-20260910-014, Issue #416)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Click "Non lus" tab | filterType="unread" saved to localStorage | P0 |
| Reload page | "Non lus" tab restored | P0 |
| First visit (no saved value) | Default to "Focus" tab | P1 |
| Click "Focus" tab | Saved preference cleared | P1 |
| Persisted tab indicator | Small dot shown on remembered tab | P2 |

## Persist thread expansion state (UX-20260910-015, Issue #417)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Expand thread, navigate away, return | Thread stays expanded | P0 |
| Thread state across page reload | Persisted via localStorage | P0 |
| Switch folder | State scoped separately (inbox/sent) | P1 |
| Thread older than 7 days | Auto-pruned from persistence | P2 |
| Collapse thread | Removed from persisted set | P2 |

## Récapitulatif FINAL issues UX 2026-09-10

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

**Total** : 15 issues UX, 8 S + 7 M, couverture complète.
