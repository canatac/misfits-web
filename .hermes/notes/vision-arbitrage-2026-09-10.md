# Vision Produit — 2026-09-10

## Arbitrage : File vs Feature

### Contexte
Multiples PR en attente sur `reimagined-guide` (Send Later, Import Wizard, MongoDB pooling, E2E). Besoin de clarifier la priorité stratégique.

### Décision : Privacy-by-Design comme pilier

**Raison** :
- Le marché email est saturé de clients "productivité" (Superhuman, Spark, Edison)
- Le différentiateur durable = **confiance** (zero-knowledge, E2E, pas de tracking)
- Conformité réglementaire (GDPR, CAN-SPAM, CASL) = ticket d'entrée, pas un avantage

### Implications backlog

| Feature | Justification | Priorité |
|---------|--------------|----------|
| Send Later | Rétention utilisateur (ne pas perdre de brouillons) | P1 |
| Import Wizard | Acquisition (migrer depuis Gmail/Outlook) | P1 |
| E2E Zero-Knowledge | Différenciation majeure | P0 |
| MongoDB Pooling | Scalabilité (perf de base) | P1 |
| DKIM Rotation | Conformité + délivrabilité | P1 |
| BIMI | Brand trust (logo dans l'inbox) | P2 |

### Anti-décisions (ce qu'on ne fait PAS)
- Pas de "smart replies" IA générative (positionnement anti-AI-hype)
- Pas de calendrier intégré (laisser à Fastmail/Proton, on se concentre sur le mail)
- Pas de réseau social / contacts sociaux (pas de "People You May Know")

### Prochain arbitrage
Faut-il un mode "Screener" type Hey (permission explicite par expéditeur) ?
Avantages : anti-spam radical, positionnement unique
Inconvénients : friction à l'inscription, courbe d'apprentissage

**Source** : analyse concurrentielle Hey/Proton/Tuta (2026-09-10)
