# Matrice de Tests — Frontend UX 2026-09-10 (6)

## AI prompt suggestions (UX-20260910-016, Issue #418)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Open AI panel while viewing email | Contextual chips shown (Répondre positivement, etc.) | P0 |
| Click "Répondre positivement" chip | Textarea populated + generation triggered | P0 |
| Open AI panel in compose mode (no email) | Generic chips shown (Écrire un email, etc.) | P1 |
| Chips horizontally scrollable | Visible on narrow panel widths | P1 |
| Suggestions respect tone/length | Prefilled prompt matches current settings | P2 |

## ARIA live regions for toasts (UX-20260910-017, Issue #419)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Archive email success | Toast "Email X announced via aria-live=polite" | P0 |
| Error (send failure) | Toast announced via aria-live=assertive | P0 |
| Email subject in message | "Email 'Meeting notes' archived" not just "Email archived" | P0 |
| NVDA/VoiceOver | All toast messages announced | P1 |
| Toast container | aria-label="Notifications" for navigation | P1 |

## Prefetch on hover (UX-20260910-018, Issue #420)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Hover email >150ms | Body fetched into cache | P0 |
| Click prefetched email | Content renders instantly (no loading) | P0 |
| Hover <150ms | No prefetch | P1 |
| Fast scrolling | Prefetch disabled | P1 |
| LRU cache full | Oldest entry evicted at 11th prefetch | P2 |
| Cached row indicator | Subtle dot shown | P2 |

## Récapitulatif FINAL — Toutes issues UX créées (2026-09-10)

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

**TOTAL** : 18 issues UX, 10 S + 8 M, couverture complète (accessibilité, performance, navigation, composition, recherche).
