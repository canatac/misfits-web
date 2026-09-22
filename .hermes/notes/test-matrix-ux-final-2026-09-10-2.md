# Matrice de Tests — Frontend UX 2026-09-10 (7)

## PWA offline banner (UX-20260910-022, Issue #427)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Connection lost | Amber banner appears <500ms with offline message | P0 |
| Connection restored | Toast "Back online — syncing changes" | P0 |
| Composer offline | Draft saved, send queued | P1 |
| Banner dismissible | Reappears after 30s if still offline | P1 |
| Queued actions | Send/archive show spinner + "Queued" state | P2 |

## Contact hover card (UX-20260910-023, Issue #428)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Hover sender name (300ms) | Contact popover appears | P0 |
| Card content | Avatar, name, email, last interaction | P0 |
| "Compose to" click | Composer opens pre-filled | P1 |
| Mobile tap | Card triggers (not hover) | P1 |
| Escape key | Card dismisses | P2 |

## Bulk label assignment (UX-20260910-024, Issue #429)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Select emails → Tag icon | Dropdown lists all labels with colors | P0 |
| Check labels + Apply | Labels assigned to all selected | P0 |
| Success toast | "Labels applied to N emails" + undo | P1 |
| Keyboard 'l' | Opens label picker | P1 |
| Existing labels shown | Pre-checked in dropdown | P2 |

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

**TOTAL** : 24 issues UX, 13 S + 11 M
