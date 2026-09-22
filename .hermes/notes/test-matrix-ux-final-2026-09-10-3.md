# Matrice de Tests — Frontend UX 2026-09-10 (7)

## Search history (UX-20260910-025, Issue #433)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Open search results panel | "Recent searches" section at top | P0 |
| Click history entry | Query re-runs | P0 |
| History persists | Survives page reload | P1 |
| Duplicate query | Updates timestamp, not adds | P1 |
| "Clear history" | Removes all entries | P2 |
| Max entries | FIFO eviction at 11th | P2 |

## Settings tabbed navigation (UX-20260910-026, Issue #434)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Navigate to /settings | Redirect to /settings/general | P0 |
| Click "Notifications" | Loads notification settings | P0 |
| URL reflects section | /settings/notifications | P1 |
| Mobile view | Sidebar collapses (hamburger) | P1 |
| All sections present | General, Notifications, Accounts, Filters, Stats, AI | P2 |

## Focus visible WCAG 2.4.7 (UX-20260910-027, Issue #435)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Tab to button | 2px brand focus ring visible | P0 |
| Tab to list item | Focus ring visible | P0 |
| Focus ring contrast | ≥3:1 ratio against bg | P1 |
| outline-none suppressed | Replaced with focus-visible | P1 |
| Tab order | Logical (left→right, top→bottom) | P2 |

## Récapitulatif FINAL — Toutes issues UX (2026-09-10)

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

**TOTAL** : 27 issues UX, 15 S + 12 M
