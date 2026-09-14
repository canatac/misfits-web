# Analyse Compétiteurs — Cycle 2026-09-10 (tick 6)
> Focus: HEY (Basecamp) — email opinionné, workflow > features

## HEY — Résumé

### Positionnement
- Créé par Basecamp (37signals) en 2020
- « Email redesigned from scratch by people who hate how email works »
- 4 piliers : Screener → Imbox → Feed → Paper Trail
- Pas d'IA, pas de publicité, $99/an

### Modèle d'organisation
| Section | Rôle |
|---------|------|
| **The Screener** | Filtre les nouveaux expéditeurs — vous décidez qui entre |
| **Imbox** | Mails de personnes autorisées (18-25/jour) |
| **The Feed** | Newsletters et marketing — consulter à loisir |
| **Paper Trail** | Reçus, confirmations, factures |

### Forces
- **Screener** : seul provider à filtrer les premiers envois (anti-spam humain)
- **Zéro AI** : positionnement assumé, pas de génération de texte
- **Privacy** : bloque les trackers par défaut
- **Opinionated** : workflow structuré, pas juste une feature list
- **Family plan** : $179/an pour 5 comptes

### Faiblesses
- **Migration complexe** : pas d'import IMAP natif (forward uniquement)
- **Pas d'IA** : en 2026, c'est un gap vs Superhuman/Notion Mail
- **Prix** : $99/an vs Proton Mail $4.99/mois
- **Workflow rigide** : tout mail doit être routé (pas de « plus tard » vague)
- **Pas de labels/dossiers** : remplaçés par les 3 silos fixes

### Différenciation misfits.ai Mail

| axe | HEY | misfits |
|-----|-----|---------|
| Screener | ✅ Unique | ❌ à prévoir |
| Workflow | Opinionné (3 silos) | Flexible (labels + dossiers) |
| AI | ❌ Zéro | ✅ Hermes AI intégré |
| Prix | $99/an | Coût infra Scaleway |
| Migration | Forward uniquement | ✅ Import mbox/EMP natif |

## Leçon pour notre roadmap

### À intégrer : le Screener (premier envoi filtré)
- En 2026, le spam évolue — les filtres automatiques ne suffisent pas
- Le Screener est un filtre humain — très efficace contre le cold-email
- Opportunité : créer un « anti-spam humain » où l'utilisateur valide les nouveaux expéditeurs

### À ne pas copier : les 3 silos fixes
- Trop rigide pour notre cible technique
- Notre IA de triage (#495) est plus flexible

## Recommandation PO
Créer issue feature pour « First-Time Sender Screening » — un mode optionnel où les nouveaux expéditeurs sont mis en attente de validation.
