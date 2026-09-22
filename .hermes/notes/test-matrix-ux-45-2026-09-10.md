# Matrice de Tests — Frontend UX 2026-09-10 (11)

## Search highlighting (UX-20260910-052, Issue #465)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Search "boss" | Matched terms highlighted | P0 |
| Multi-term | Each term highlighted separately | P1 |
| Brand color | bg-[#C49B66]/30 | P1 |
| Case-insensitive | "Boss" matches "boss" | P2 |

## Prefetch on nav (UX-20260910-053, Issue #466)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Press j/k | Next email prefetched | P0 |
| Enter | Content shows instantly | P0 |
| <200ms nav | Prefetch cancelled | P1 |
| LRU max 5 | Oldest evicted | P2 |

## Sidebar animation (UX-20260910-054, Issue #467)

| Input | Expected Result | Priority |
|-------|----------------|----------|
| Toggle sidebar | 200ms ease-out animation | P0 |
| prefers-reduced-motion | Instant (0ms) | P1 |
| GPU-accelerated | transform/opacity | P1 |
| No layout shift | Smooth transition | P2 |

## Récapitulatif FINAL — Issues UX 2026-09-10

**TOTAL** : 45 issues UX, 24 S + 19 M + 2 L

| Sprint | Issues | Effort |
|--------|--------|--------|
| 1 (Quick Wins) | 24 S | ~2 semaines |
| 2 (Features) | 19 M | ~4 semaines |
| 3 (Infrastructure) | 2 L | ~2 semaines |
