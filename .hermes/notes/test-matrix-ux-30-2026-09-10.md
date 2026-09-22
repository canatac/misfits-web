# Matrice de Tests — Frontend UX 2026-09-10 (8)

## Undo destructive actions (UX-20260910-028, Issue #437)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Archive email | Undo toast appears 5s, click restores | P0 |
| Delete email | Danger-tone undo toast, click restores from trash | P0 |
| Bulk mark all read | Single undo reverts entire batch | P1 |
| Navigate then undo | Undo persists across folder changes | P1 |
| LRU overflow | Oldest undo evicted at 11th entry | P2 |

## Thread expand/collapse all (UX-20260910-029, Issue #438)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Click "Expand all" | Every thread message expanded | P0 |
| Click "Collapse all" | Only last message shown | P0 |
| Badge shows count | "Expand all (3)" for 3 collapsed | P1 |
| Press 'e' | Toggles expand/collapse all | P1 |
| Switch thread | State resets to default | P2 |

## Error boundary fallback (UX-20260910-030, Issue #439)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Component crash | Fallback card shown, not blank screen | P0 |
| Click "Retry" | Component re-mounts | P0 |
| Click "Reload page" | Full page reload | P1 |
| Expand error details | Component name + error shown | P1 |
| All major views wrapped | Mail, dashboard, compose, thread | P2 |

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

**TOTAL** : 30 issues UX, 17 S + 13 M
