# Matrice de Tests — Frontend UX 2026-09-10 (4)

## Skip-to-content link (UX-20260910-012, Issue #412)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| First Tab on mail page | "Skip to main content" link visible (brand bg) | P0 |
| First Tab on dashboard | "Skip to main content" link visible | P0 |
| Press Enter on skip link | Focus moves to main content area | P0 |
| Skip link hidden after blur | Link returns to sr-only state | P1 |
| Focus visible on skip link | 2px outline or brand bg (#C49B66) | P1 |
| Sidebar has aria-label | id="sidebar-nav" aria-label="Main navigation" | P2 |
| Skip link is first element in <body> | Precedes sidebar/header | P2 |

## Dashboard card skeletons (UX-20260910-011, Issue #413)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Initial load of /dashboard | 5 card skeletons rendered immediately | P0 |
| BriefingCard loading | Shimmer bar for date + 4 line placeholders | P0 |
| InboxScoresCard loading | 2x2 grid of rounded shimmer rectangles | P0 |
| VeilleCard loading | 4 rows of (circle + 2 line placeholders) | P0 |
| TasksCard loading | 4 rows of (checkbox + line + text) | P0 |
| AlertsCard loading | 3 rows of (colored dot + line + text) | P0 |
| Layout stable during load | No CLS (grid skeleton matches final layout) | P1 |
| Data resolves progressively | Cards render as their queries complete | P1 |
| Fast connection (<300ms) | Skeleton visible minimum 300ms | P2 |
| Real content replaces skeleton | 200ms fade-in transition | P2 |

## Notification preferences (UX-20260910-010, Issue #414)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Enable notifications toggle | Triggers browser Notification.requestPermission() | P0 |
| Quiet hours 22:00-07:00 active | Notifications suppressed during this window | P0 |
| VIP-only mode ON | Only starred emails trigger notification | P0 |
| Inbox folder toggle OFF | No notifications for inbox emails | P1 |
| Bell icon in header | Reflects current state (active/muted) | P1 |
| Sound toggle + preview | Audio plays on change | P2 |
| Preview card | Shows how notification will look | P2 |
| Settings persist | localStorage + user preferences API | P2 |

## Récapitulatif complet issues UX 2026-09-10

| Issue | Title | Effort | Status |
|-------|-------|--------|--------|
| #398 | Auto-mark-as-read | M | tests matrice 1 |
| #399 | Focus mode | M | tests matrice 1 |
| #400 | Sidebar keyboard nav | S | tests matrice 1 |
| #402 | Search empty state | S | tests matrice 2 |
| #403 | Shortcut help overlay | S | tests matrice 2 |
| #404 | Email detail skeleton | S | tests matrice 2 |
| #406 | Onboarding checklist | M | tests matrice 3 |
| #407 | Swipe-to-action | M | tests matrice 3 |
| #408 | Inline quick-reply | M | tests matrice 3 |
| #412 | Skip-to-content | S | tests matrice 4 |
| #413 | Dashboard skeletons | S | tests matrice 4 |
| #414 | Notification prefs | M | tests matrice 4 |

**Total** : 12 issues UX, 7 S + 5 M, couverture complète de toutes les matrices de tests.
