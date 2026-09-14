# Vision Produit — Arbitrages 2026-09-10

## Contexte
misfits.ai Mail = client mail Next.js PWA + backend Rust Actix-web + DKIM service.
Positionnement: alternative auto-hébergeable à Proton/Fastmail pour utilisateurs techniques.

## Arbitrage 1: E2E PGP seamless (P1)
- **Décision**: Confirmer P1 pour Q4 2026.
- **Rationale**: Proton en fait sa baseline. Notre cible tech attend du chiffrement.
- **Issue**: à créer (feature, security, priority-P1).
- **Preuve**: comparaissance précédente (Tuta, Proton offrent E2E natif).

## Arbitrage 2: DMARC Reporting dashboard (P1)
- **Décision**: Intégrer dans DKIM service scope.
- **Rationale**: ForwardEmail l'ajoute en 2026 = attendu par le marché pro.
- **Différenciant**: seul service à notre connaissance à le faire en auto-hébergé.
- **Preuve**: forwardemail.net blog.

## Arbitrage 3: Multi-alias + signature (en cours)
- **Décision**: Valider via issue-423 (PR #489).
- **Statut**: PR draft ouverte, CI à vérifier.
- **Prochain**: attendre CI puis ROOT_GO pour prêt→non-draft.

## Arbitrage 4: Newsletter CTA mobile (P1)
- **Décision**: Maintien priorité (issue #300 assignée dev-back).
- **Statut**: en cours via fleet GitOps.

## Résumé roadmap arbitrée
| priorité | feature | statut |
|----------|---------|--------|
| P0 | DKIM service (étude, timeout) | en cours |
| P1 | E2E PGP seamless | à créer issue |
| P1 | DMARC reporting | à planifier |
| P1 | Multi-alias signature | PR #489 draft |
| P1 | Newsletter CTA mobile | issue #300 assignée |
