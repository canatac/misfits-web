# Analyse Compétiteurs — Cycle 2026-09-10 (tick 5)
> Focus: Proton Mail — écosystème complet email + calendrier + drive

## Proton Mail — Résumé

### Positionnement
- Basé en Suisse, leader de l'email privacy
- Zero-access encryption, code open-source audité
- Suite complète : Mail + Calendar + Drive + VPN + Pass

### Forces
- **E2E natif** : le standard de l'industrie depuis 2014
- **Zero-access** : même Proton ne peut pas lire vos mails
- **Suite intégrée** : tout-en-un pratique
- **Réputation** : pionnier, base d'utilisateurs massive
- **Calendrier chiffré** : Proton Calendar avec E2E

### Faiblesses
- **IMAP/SMTP natif** : pas disponible gratuitement (bridge payant)
- **Bridge** : requis pour utiliser des clients externes
- **Auto-hébergement** : pas possible (SaaS uniquement)
- **Dépendance** : point de défaillance unique (serveurs Proton)

### Différenciation misfits.ai Mail

| axe | Proton | misfits |
|-----|--------|---------|
| E2E | Natif | ❌ à prévoir (#490) |
| Protocoles | Bridge uniquement | ✅ SMTP/IMAP natif |
| Calendrier | Proton Calendar intégré | ❌ externe (CalDAV) |
| Auto-hébergement | ❌ SaaS uniquement | ✅ Scaleway |
| Open source | ✅ tous les clients | partiel |

## Leçon pour notre roadmap

### Ne PAS faire
- Ne pas essayer de battre Proton sur la suite intégrée (ils ont 10 ans d'avance)
- Ne pas essayer de battre Tuta sur le calendrier chiffré

### Plutôt faire
1. **Se concentrer sur l'email** : faire le meilleur client email auto-hébergeable
2. **Intégrer via standards** : CalDAV pour le calendrier (intégration, pas remplacement)
3. **Exploiter l'auto-hébergement** : c'est notre avantage unique
4. **API ouverte** : permettre l'intégration avec n'importe quel service calendrier

## Recommandation PO
Créer issue pour "Calendar Integration Hub" — intégrer des calendriers externes (CalDAV) plutôt que de construire le nôtre. Focus sur l'email, laisser le calendrier aux spécialistes.
