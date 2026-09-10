# Analyse Compétiteurs — Cycle 2026-09-10 (tick 4)
> Focus: Tuta (Tutanota) — email encrypté + calendrier + post-quantum

## Tuta — Résumé

### Positionnement
- Basé en Allemagne, anciennement Tutanota
- E2E encryption natif (sujet, corps, attachments)
- Open source (clients)
- RGPD-friendly, hors Five Eyes

### Roadmap 2026
| Feature | Statut |
|---------|--------|
| E2E encrypted email | ✅ Live |
| Encrypted calendar | ✅ Live (standalone app) |
| Encrypted contacts | ✅ Live |
| Post-quantum cryptography (TutaCrypt) | ✅ Comptes créés après mars 2024 |
| Tuta Drive (encrypted cloud storage) | 🔄 Closed beta (avril 2026) |
| Offline write access | 🗺️ Upcoming |
| Shared email accounts | 🗺️ Upcoming |
| Unlimited email addresses (custom domains) | ✅ Payant |

### Forces
- **Post-quantum** : TutaCrypt remplace RSA-2048 et AES-256 pour futurs comptes
- **Encrypted calendar** : même le serveur ne connaît pas les rendez-vous
- **Chiffrement des notifications** : détail unique sur le marché
- **Grant EU** : 1.5M€ du gouvernement allemand + 600K€ université
- **German court ruling** : ne peut livrer que les mails non chiffrés entrants/sortants futurs

### Faiblesses
- Pas d'IMAP/SMTP natif (protocole propriétaire)
- Recherche full-text limitée sur les mails chiffrés
- Suite moins complète que Proton Mail (pas de VPN, etc.)

### Différenciation misfits.ai Mail

| axe | Tuta | misfits |
|-----|------|---------|
| E2E | Natif | ❌ à prévoir (#490) |
| Protocoles | Propriétaire | ✅ SMTP/IMAP natif |
| Calendrier | E2E intégré | ❌ externe |
| Post-quantum | ✅ TutaCrypt | ❌ à prévoir |
| Auto-hébergement | ❌ SaaS uniquement | ✅ Scaleway |
| Open source | ✅ clients | partiel |

### Leçon pour notre roadmap
1. **Post-quantum** est attendu en 2026 → à intégrer dans l'implémentation E2E
2. **Calendrier chiffré** est un différenciant → à prévoir dans la roadmap
3. **Chiffrement des notifications** → si on fait un calendrier, inclure ce détail

## Recommandation PO
Ne pas dupliquer Tuta (ils sont trop avancés sur le calendrier chiffré). Plutôt se positionner sur :
- SMTP/IMAP natif (là où Tuta échoue)
- JMAP (le futur)
- DKIM service intégré (pas chez Tuta)
- Auto-hébergement (pas possible chez Tuta)
