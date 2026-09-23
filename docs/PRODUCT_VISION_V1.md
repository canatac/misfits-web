> Dernière mise à jour: 2026-09-23T15:00 UTC — PO cycle: 57 matrix rows (42 FAIL, 8 PASS, 2 PARTIAL), state=ON, 0 bus messages, 0 new GH issues, 0 PO_TICKET posted this cycle (veille réglementaire email privacy 2026 + CNIL tracking pixels + matrix MW-2026-070)
>
> Dernière mise à jour: 2026-09-23T13:15 UTC — PO cycle: 55 matrix rows (43 FAIL, 9 PASS, 2 PARTIAL), state=ON, 0 bus messages, 6 new PO_TICKETs posted to scrum-master (MW-2026-019,021,022,026,027,039 from issue #827)
>
> Dernière mise à jour: 2026-09-23T13:00 UTC — PO cycle: 55 matrix rows (41 FAIL, 9 PASS, 2 PARTIAL), state=ON, 0 bus messages, 0 new GH issues, 1 PO_TICKET posted to scrum-master (dark mode toggle UX proposal)

> Dernière mise à jour: 2026-09-23T12:30 UTC — PO cycle: 54 matrix rows (39 FAIL, 8 PASS, 2 PARTIAL), state=ON, 0 bus messages, 4 GH issues created (#824-827), 1 PO_TICKET posted to scrum-master (16 FAIL rows linked)

> Dernière mise à jour: 2026-09-23T12:15 UTC — PO cycle: 54 matrix rows (39 FAIL, 8 PASS, 2 PARTIAL), state=ON, 0 bus messages, 1 PO_TICKET posted to scrum-master (MW-2026-065 email read receipts #820)

> Dernière mise à jour: 2026-09-23T12:00 UTC — PO cycle: 53 matrix rows (42 FAIL, 8 PASS, 2 PASS-FIXED), state=ON, 0 bus messages, 38 TICKET_ASSIGN posted to scrum-master (13 with GH issues + 25 without)

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
- [x] Auth bypass fix (PR #741, regression PASS 2026-09-22)
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
