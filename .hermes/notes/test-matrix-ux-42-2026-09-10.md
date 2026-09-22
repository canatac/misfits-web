# Matrice de Tests — Frontend UX 2026-09-10 (10)

## Newsletter unsubscribe (UX-20260910-049, Issue #462)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Open newsletter email | Unsubscribe banner shown | P0 |
| Click "Unsubscribe" | RFC 2366 request sent | P0 |
| Toast confirms | "Unsubscribed from [sender]" | P1 |
| Banner hidden | After successful unsubscribe | P1 |
| HTTP + mailto | Both methods supported | P2 |

## Digest mode (UX-20260910-050, Issue #463)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Toggle Digest | Emails grouped by sender | P0 |
| Group actions | Mark read/archive per sender | P0 |
| 'd' shortcut | Toggles digest mode | P1 |
| Collapsed group | Shows unread count | P1 |
| No unread | Empty state message | P2 |

## Snooze presets (UX-20260910-051, Issue #464)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Select email | Snooze button appears | P0 |
| Click preset | One-click snooze | P0 |
| 's' shortcut | Opens snooze menu | P1 |
| Number keys | Select preset 1-4 | P1 |
| Snoozed email | Removed from inbox | P2 |

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
| #444 | Cmd+K email search | M |
| #445 | Quick account switch | S |
| #446 | Email export PDF | S |
| #448 | Onboarding email | M |
| #449 | Skip-to-search (/) | S |
| #450 | Screen reader announcements | S |
| #451 | Attachment lightbox | M |
| #452 | Thread depth indicators | S |
| #453 | Reply/forward icons | S |
| #455 | List density setting | S |
| #456 | Compose from search | M |
| #457 | Send later queue | M |
| #459 | Email pinning | S |
| #460 | Bulk email import | L |
| #461 | Custom keyboard shortcuts | M |
| #462 | Newsletter unsubscribe | M |
| #463 | Digest mode | M |
| #464 | Snooze presets | S |

**TOTAL** : 42 issues UX, 22 S + 18 M + 2 L
