# Vision Produit — Arbitrages 2026-09-10 (tick 2)
> Mise à jour: AI assistants & Inbox Zero automation

## Contexte
En 2026, l'email client ne suffit plus — l'utilisateur attend de l'IA embarquée. Deux modèles dominants : AI-native client (Zero, Superhuman) et AI agent overlay (Inbox Zero, alfred). Notre positionnement auto-hébergeable + Hermes AI intégré est unique mais nécessite des arbitrages.

## Arbitrage 1: Hermes AI comme agent de triage (P1)
- **Décision**: Confirmer P1 Q4 2026.
- **Rationale**: Inbox Zero et alfred automatisent le triage — notre Hermes AI peut le faire en natif.
- **Approche**: Règles en langage naturel, triage auto, réponse draftée "dans la voix du user".
- **Scope**: Phase 1 = règles simples, Phase 2 = apprentissage sent history.
- **Issue**: à créer (feature, ai, priority-P1).

## Arbitrage 2: "Chat with email" (P2)
- **Décision**: Différer en P2 (Q1 2027).
- **Rationale**: Zero (0.email) le fait bien mais nécessite une refonte UI. Pas critique pour Q4.
- **Scope**: conversation avec ses mails via Hermes AI intégré.
- **Issue**: à créer (feature, ux, priority-P2).

## Arbitrage 3: Split Inbox (Superhuman-style) (P1)
- **Décision**: Confirmer P1 Q4 2026.
- **Rationale**: Superhuman en fait son cœur de produit. Attendu par les power users.
- **Scope**: pré-tri Important vs Other, filtrage intelligent.
- **Issue**: à créer (feature, ux, priority-P1).

## Arbitrage 4: Draft "dans votre voix" (P1)
- **Décision**: Confirmer P1 Q4 2026.
- **Rationale**: Inbox Zero le fait via apprentissage sent history. Attendu pour l'AI drafting.
- **Scope**: génération de brouillon basé sur l'historique d'envoi du user.
- **Issue**: à créer (feature, ai, priority-P1).

## Arbitrage 5: E2E PGP seamless (confirmé précédemment)
- P1 Q4 2026, issue #490 créée.

## Résumé roadmap arbitrée (mise à jour)
| priorité | feature | statut |
|----------|---------|--------|
| P0 | DKIM service (étude, timeout) | en cours |
| P1 | E2E PGP seamless | #490 créée |
| P1 | DMARC reporting | #491 créée |
| P1 | Multi-alias signature | PR #489 draft |
| P1 | Newsletter CTA mobile | #300 assignée |
| P1 | Hermes AI agent de triage | à créer |
| P1 | Split Inbox | à créer |
| P1 | Draft "dans votre voix" | à créer |
| P1 | Newsletter unsubscribe one-click | #492 créée |
| P1 | PWA offline mode | #493 créée |
| P1 | MTA-STS transport security | #494 créée |
| P2 | Chat avec ses mails | à créer Q1 2027 |

## Différenciation misfits.ai
"Le Zero auto-hébergeable avec Hermes AI intégré"
- Auto-hébergement vs SaaS
- AI native vs AI ajoutée
- Protocoles standards vs fermé
- Open roadmap vs black box

## Prochains steps
1. Créer 3 issues AI (triage, split inbox, draft voice).
2. Matrice de tests étendue au domaine "AI / Smart Features".
3. PR #489 : attendre ROOT_GO pour ready.
