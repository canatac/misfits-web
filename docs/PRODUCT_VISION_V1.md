# Product Vision V1 — misfits.ai Mail

> Dernière mise à jour: 2026-09-22T12:30 UTC — PO cycle: 17 tickets posted (Sprint 1 FAIL triage, 32 FAIL rows scanned, 1 new GH issue #744 for MW-2026-038 swipe gestures, 1 new UX proposal: dark mode toggle MW-2026-040)

---

## 1. Mission

**La boîte mail qui vous appartient vraiment.**

misfits.ai Mail est un service de messagerie email natif (SMTP/IMAP) avec une UX moderne, une conformité privacy-by-design, et une stack d'authentification email complète (DKIM/SPF/DMARC). Pas un SaaS privacy-washing — une infrastructure mail que vous contrôlez.

---

## 2. Positionnement

| Critère | misfits.ai | Proton Mail | Tuta | Fastmail | Hey |
|---------|------------|-------------|------|----------|-----|
| Modèle | Self-hosted / SaaS | SaaS (Swiss) | SaaS (DE) | SaaS (AU) | SaaS (US) |
| Open source | Partiel (3 repos) | Partiel | 100% clients | Non | Non |
| E2EE | Oui (DKIM natif) | Oui | Oui (TutaCrypt) | Non | Non |
| IMAP/SMTP natif | **Oui** | Bridge (payant) | Non | **Oui** | Non |
| Multi-surface | Mail+Cal+Contacts+Files | Mail+VPN+Drive+Pass | Mail+Cal+Contacts | Mail+Cal+Contacts | Mail only |
| Chat mail | **Oui (innovation)** | Non | Non | Non | Non |
| Fleet AI | **Oui (maintenance autonome)** | Non | Non | Non | Non |

---

## 3. Piliers produit

### 3.1 Privacy by Design
- Pas de data mining, pas de tracking pixels
- Conformité native GDPR/CCPA/CASL/LGPD
- DKIM/SPF/DMARC natif (pas de relais tiers)

### 3.2 UX Moderne
- Interface conversationnelle (chat mail)
- Multi-surface: mail + calendar + contacts + files + translation
- PWA avec mode hors ligne

### 3.3 Sécurité
- E2EE natif
- Roadmap post-quantum (TutaCrypt-inspired)
- Anonymous signup optionnel

### 3.4 IA
- Résumés automatiques
- Triage intelligent
- Réponses suggérées

---

## 4. Roadmap

### Sprint 1 — Foundation (actuel)
- [x] Stack SMTP/IMAP native
- [x] DKIM/SPF/DMARC
- [x] Multi-surface (mail, calendar, contacts)
- [ ] Scheduled send
- [ ] Undo send
- [ ] Email templates

### Sprint 2 — Security
- [ ] Post-quantum crypto roadmap
- [ ] Anonymous signup
- [ ] MTA-STS / DANE

### Sprint 3 — Ecosystem
- [ ] PWA offline
- [ ] Intégration calendrier avancée
- [ ] Mobile apps

### Sprint 4 — AI
- [ ] Résumés automatiques
- [ ] Triage intelligent
- [ ] Réponses suggérées

### Sprint 5 — Monétisation
- [ ] Modèle freemium
- [ ] Custom domain payant
- [ ] Plans Pro/Admin

---

## 5. Métriques clés

| Métrique | Cible | Actuel |
|----------|-------|--------|
| Taux de délivrabilité | >99.5% | À mesurer |
| Temps de réponse API | <200ms p95 | À mesurer |
| Couverture tests | >90% Domain | À mesurer |
| Uptime | 99.9% | À mesurer |
| NPS utilisateur | >50 | À mesurer |

---

## 6. Arbitrages documentés

### Arbitrage 2026-09-22: Modèle freemium
- **Choix**: Freemium classique (gratuit 15GB, payant custom domain + features avancées)
- **Rejeté**: Gratuit avec pub (contredit privacy-by-design), Donation (non scalable), 100% payant (barrière à l'entrée)
- **Rationale**: Aligné avec le marché (Proton/Tuta/Fastmail), respecte le pilier privacy

### Arbitrage 2026-09-22: Feature parity vs Innovation
- **Choix**: Parité sur les must-have (scheduled send, undo send, templates), innovation sur l'IA et le chat mail
- **Rejeté**: Innovation pure (les users ne quittent pas Gmail pour un produit incomplet), Parité pure (pas de différenciation)
- **Rationale**: Les users exigent les deux en 2026

---

*Fichier maintenu par le Product Owner.*
