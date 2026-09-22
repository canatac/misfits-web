# Arbitrage Backlog UX — 2026-09-10

## Tri effectué sur 20 issues UX ouvertes

### GARDER (aligned with privacy-by-design + power user focus)

| Issue | Raison |
|-------|--------|
| #400 Sidebar keyboard nav (S) | WCAG + power user |
| #399 Focus mode (M) | Reading comfort |
| #398 Auto-mark-read (M) | Inbox-zero core |
| #395 ComposerFooter tests (bug) | Bloquant CI |
| #390 Bulk actions (M) | Power user |
| #376 Cmd+K palette (M) | Power user |
| #373 Bulk confirm modal (S) | Safety |
| #371 Toast with undo (S) | UX polish |
| #369 Auto-archiving (M) | Inbox-zero |
| #361 AI categorization (M) | Différenciation |

### REGROUPER (chevauchement fonctionnel)

| Groupe | Issues | Action |
|--------|--------|--------|
| AI features | #361 AI categorization + #348 AI summary + #345 widgets | Fusionner en 1 épic |
| Display options | #357 Compact mode + #356 Tab navigation + #352 Presentation mode | Fusionner en "Layout preferences" |
| Search | #353 Attachment search + #346 Contact detail | Garder séparé si dispo |

### FERMER / PAUSER (low ROI now)

| Issue | Raison |
|-------|--------|
| #349 Reading time indicator | Vanité, pas impactant |
| #340 Stats dashboard | Déjà fait en PR #350 |
| #318 Session cookie | Déjà en PR #388 |
| #347 Holiday persistence | Déjà en PR #381 |

## Recommandation
- 1er lot : #395 (bug fix) + #400 (S, quick win) + #398 (M, core feature)
- 2ème lot : #399 + #376 (power user)
- À voir plus tard : #348 AI summary (conflit avec anti-AI-hype)

## Prochain arbitrage
Mode Screener (Hey) — je recommande de le créer comme issue séparée avec le tag `investigation`.
