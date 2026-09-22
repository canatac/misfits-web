# Product Vision V1 — misfits.ai Mail

> Dernière mise à jour: 2026-09-22T10:30 UTC — PO cycle: 30 tickets posted (Sprint 1 FAIL triage + Notion Mail migration + UX swipe gesture + Pro plan subscription + External account connection + 3 P0 security: #722 auth bypass + #558 CORS reflection + #556 CORS misconfig + UX auto-save draft + mobile swipe gesture + reading mode HTML sanitize + keyboard shortcuts + P0 production unreachable #727 + P0 regression #729 auth bypass + P0 #730 auth bypass still exposed + 30 FAIL rows scanned, 19 distinct issues, 30 TICKET_ASSIGN posted, 1 new issue #566 DKIM crash loop added to matrix)

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
- [ ] P0: Auth bypass #722 (misfits-web) — inbox + attachments exposed
- [ ] P0: CORS reflection + auth bypass #558 (reimagined-guide)
- [ ] P0: CORS misconfig + admin bypass #556 (reimagined-guide)

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

### Arbitrage 2026-09-22: Notion Mail shutdown — migration opportunity
- **Choix**: Migration wizard (import from Gmail/Notion Mail) + web-first (no native client yet)
- **Rejeté**: Native client first (delays web launch), Migration only (no differentiation)
- **Rationale**: Notion Mail shuts down 2026-09-22. Users need a quick migration path. Web-first with import wizard captures them immediately. Native client can follow in Sprint 3. Issue #721 created.

### Arbitrage 2026-09-22: Reading mode — HTML sanitize vs plain text
- **Choix**: Reading mode with HTML sanitization (strip scripts/styles/trackers, keep text + lazy-loaded images)
- **Rejeté**: Plain text only (loses formatting and images), Full HTML render (security risk, tracking pixels)
- **Rationale**: HTML emails are the norm in 2026. A sanitized reading mode balances readability with privacy/security. Distinct from #399 (list pane collapse) — this targets email content itself. Issue #724 created.

---

*Fichier maintenu par le Product Owner.*
