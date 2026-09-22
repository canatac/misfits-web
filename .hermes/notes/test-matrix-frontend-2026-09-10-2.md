# Matrice de Tests — Frontend UX 2026-09-10 (2)

## Auto-mark-as-read on viewport intersection (UX-20260910-001, Issue #398)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Unread email scrolled >80% into viewport for >600ms | email.isRead=true in store, dot indicator fades out | P0 |
| Unread email scrolled <80% into viewport | No mark-read triggered | P1 |
| Mark-read triggers undo toast | Toast "Marked read — Ctrl+Z to undo" visible 5s | P1 |
| Threaded mode visible | All messages in visible thread marked read | P1 |
| Rapid scroll past email (<600ms dwell) | No mark-read | P2 |

## Focus / Reading mode (UX-20260910-002, Issue #399)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Press 'f' in inbox (no input focused) | Focus mode toggles on | P0 |
| Press 'f' again | Focus mode toggles off | P0 |
| Press 'f' while typing in input | No toggle | P1 |
| Click Maximize2 button in detail header | List pane collapses, detail expands full width | P1 |
| Click Minimize2 floating button | List pane restores, split view returns | P1 |
| Toggle focus then select different email | Focus mode persists | P1 |
| Collapse list then expand | Scroll position preserved | P2 |

## Sidebar folder keyboard navigation (UX-20260910-003, Issue #400)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Press ↓ in sidebar | Focus moves to next folder button | P0 |
| Press ↑ in sidebar | Focus moves to previous folder button | P0 |
| Press Enter/Space on focused folder | Folder activates (same as click) | P1 |
| Press Home | Jump to first folder | P1 |
| Press End | Jump to last folder | P1 |
| Focus wraps from last → first | Circular navigation | P2 |
| AccountSelector/Labels reached via arrow keys | No (separate Tab stops) | P2 |

## Search empty state (UX-20260910-004, Issue #402)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Zero results for query | Shows "No results for [query]" + operator chips | P0 |
| Operator chip clicked (from:) | Appends "from:" to search input | P0 |
| "Did you mean" appears only when Levenshtein <3 | Conditional display | P1 |
| Clear search button (X) clicked | Query resets, focus returns to input | P1 |
| Browse recent searches trigger | Popover shows recent searches | P2 |

## Keyboard shortcut help overlay (UX-20260910-005, Issue #403)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Press '?' (no modifier, no input focused) | Shortcut modal opens | P0 |
| Press Escape | Modal closes | P0 |
| Click backdrop | Modal closes | P1 |
| Modal lists all current shortcuts | j/k, e, #, /, c, f, s, m, r, Cmd+Enter, Esc | P1 |
| Focus trapped in modal | Tab cycles within modal only | P2 |
| Press '?' while typing in input/textarea | No modal | P2 |

## Email detail loading skeleton (UX-20260910-006, Issue #404)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Open email with slow connection | Skeleton placeholder shown (avatar shimmer, text lines) | P0 |
| Skeleton matches EmailView layout | No layout shift (CLS) | P0 |
| Real content loads | <200ms fade-in transition | P1 |
| Fast connection (<300ms load) | Skeleton visible minimum 300ms | P1 |
| Open different email while loading | New skeleton shown for new email | P2 |

## Existing tests (from previous matrice)

### POST /api/v1/drafts/schedule
| Input | Expected Result | Priority |
|-------|----------------|----------|
| Valid draft_id + future timestamp | 201 Created, returns schedule_id | P1 |
| Valid draft_id + past timestamp | 400 Bad Request | P1 |
| Scheduled send executes at timestamp | Email sent within 60s | P0 |

### POST /api/v1/import/configure
| Input | Expected Result | Priority |
|-------|----------------|----------|
| Gmail OAuth2 success | 200 OK, connected account | P1 |
| Invalid provider | 400 Bad Request | P1 |
