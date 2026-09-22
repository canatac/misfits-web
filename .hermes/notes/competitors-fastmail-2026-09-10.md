# Compétiteurs — 2026-09-10 (4)

## Fastmail — Features Clés & Positionnement

**Positionnement** :
Email hosting "classique" premium, orienté sécurité et fiabilité. Pas de E2E zero-knowledge, mais infrastructure robustes, support IMAP/SMTP natif, excellente délivrabilité. Cible les utilisateurs techniques, professionnels, allergiques à la publicité Google.

**Features 2026** :
- Two-Factor Authentication (2FA) obligatoire ou fortement recommandé (TOTP, U2F/Yubikey, SMS)
- App Passwords pour les clients tiers (Outlook, Apple Mail) — remplace les anciens "alternative logins" (migration terminée août 2026)
- Interface "Password & Security" centralisée : gestion des clés de récupération, appareils connectés, historique de connexion
- Migration progressive depuis l'interface "classic" vers l'interface moderne
- Spam filtering performant (basé sur apprentissage statistique)
- Support natif IMAP/SMTP/POP3 — contrairement à Hey
- Journaux de connexions détaillés
- Options de récupération multi-canal (email secondaire, SMS, clé de sécurité)

**Forces** :
- Infrastructure extrêmement fiable (uptime 99.99%)
- Support technique réactif
- Pas de publicité, pas de tracking
- Compatible avec tous les clients email standards
- Bonne gestion des gros volumes de mails
- Recherche rapide sur l'historique complet

**Faiblesses** :
- Pas de chiffrement E2E natif (contrairement à Proton/Tuta)
- Interface moins moderne que Superhuman/Hey
- Moins d'outils de productivité intégrés
- Stockage de base limité (2 Go pour le plan léger)
- Pas de mode "Screener" anti-interruption (contrairement à Hey)

**Différenciation vs misfits.ai** :
Fastmail joue la carte de la fiabilité technique et de la compatibilité, pas celle de l'innovation UX. L'opportunité misfits :
- Combiner la fiabilité IMAP/SMTP de Fastmail + l'UX moderne de Superhuman + la privacy de Proton
- Ajouter le mode Screener (Hey) + le Focus mode (UX-20260910-002) + la recherche intelligente (UX-20260910-004)
- Proposer un chiffrement E2E optionnel (contrairement à Fastmail) et un déchiffrement côté client (zero-knowledge, contrairement à Fastmail)

**Source** : fastmail.com/blog (2026-09-10)
