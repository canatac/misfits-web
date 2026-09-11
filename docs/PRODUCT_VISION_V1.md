# PRODUCT VISION V1 — mail.misfits.ai

Date: 2026-09-08
Owner: product-owner

## Objectif
Maximiser la valeur produit et la qualité UX de mail.misfits.ai avec exécution orientée preuves et non-régression continue.

## Principes
- Source de vérité serveur, éviter la logique client fragile.
- Fiabilité email de bout en bout (envoi, réception, traçabilité).
- UX claire, rapide, vérifiable par tests reproductibles.
- Gouvernance stricte: décision root, exécution traçable par tickets/preuves.

## Priorités V1
1. Parcours critiques admin/utilisateur sans régression.
2. Observabilité des livraisons email et threading.
3. Réduction des risques UX (états incohérents, erreurs silencieuses).
4. Discipline GitOps: issue -> PR -> checks -> deploy avec preuves.

## KPI de pilotage
- Couverture des scénarios critiques en Gherkin + tests exécutables.
- Taux de succès des runs de non-régression.
- Délai de détection/résolution des régressions critiques.
- Conformité preuves (URL, commande, résultat) par ticket.

Last PO Autoresume Check: 2026-09-08T08:38:54Z
