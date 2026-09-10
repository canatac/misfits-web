# Analyse Compétiteurs — Cycle 2026-09-10 (tick 3)
> Focus: Skiff Mail — cas d'école d'un email privacy acquis puis arrêté

## Skiff Mail — Résumé

### Positionnement
- Email E2E encrypté, décentralisé (IPFS), open source
- 10 GB gratuit, domaines personnalisés
- Suite complète : Mail + Docs + Calendar + Storage
- Cible : privacy-first teams et individus

### Histoire récente
- **Acquis par Notion** (2025/2026)
- **Arrêt du service** après acquisition
- Migration massive vers ProtonMail et Tuta
- Leçon : un excellent produit technique peut échouer pour des raisons business

### Forces
- E2E encryption native
- Décentralisé (IPFS) — pas de point de défaillance unique
- Open source (vérifiable)
- Suite intégrée (mail + docs + calendar + storage)

### Faiblesses fatales
- **Pas d'export de données** — Privacy Guides a critiqué ce manque
- Pas de filtrage/labeling (organisation manuelle)
- Pas de partage de calendriers
- Modèle économique non viable (acqui puis tué)

### Leçons pour misfits.ai Mail

| Risque Skiff | Notre réponse |
|--------------|---------------|
| Pas d'export | **Export mbox/EML obligatoire** (issue #456 déjà créée) |
| Acquéreur tueur | Modèle auto-hébergeable = pas de risque acquisition |
| Pas de filtrage | Split Inbox + IA triage (#495, #496) |
| Pas de suite intégrée | On ne fait que le mail — focus et excellence |

### Différenciation post-Skiff
Le marché privacy email cherche une alternative à Skiff :
- Proton Mail : leader mais fermé (pas d'auto-hébergement)
- Tuta : email-only, pas de suite
- **misfits.ai** : auto-hébergeable, export garanti, protocoles standards

## Recommandation PO
Créer issue pour "Data Portability Hub" — centraliser export/import comme feature différenciante.
