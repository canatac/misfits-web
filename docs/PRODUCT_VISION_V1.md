# Product Vision V1 — misfits.ai Mail

> Dernière mise à jour: 2026-09-24T15:09 UTC — PO cycle: 73 matrix rows (31 pure FAIL, 13 FAIL-ISSUE, 6 PASS, 1 PARTIAL, 2 FAIL-FIX-PR, 1 FAIL-UNHEALTHY, 12 FAIL-GHERKIN-ISSUE), state=ON, 0 incoming bus messages, 1 PO_TICKET sent (MW-2026-123 context menu #969 routed to scrum-master), all pure FAIL rows have existing GH issues, bus Redis NOAUTH, scrum-master queue=98

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

### Arbitrage 2026-09-23: AI email assistant strategy
- **Choix**: AI on-device (local processing, no cloud AI, privacy-first)
- **Rejeté**: Cloud AI (Proton Scribe/Lumo backlash — privacy community rejection), No AI at all (Tuta stance — limits productivity features)
- **Rationale**: Proton Lumo (2026) shows market demand for AI drafting/summarization but privacy backlash is severe. On-device AI (MW-2026-095, MW-2026-020) aligns with privacy-by-design pillar while capturing AI productivity gains. NIS2/DORA/GDPR convergence (2026) reinforces data minimization — on-device processing reduces compliance surface.

### Arbitrage 2026-09-23: Regulatory convergence (NIS2/DORA/GDPR)
- **Choix**: Unified compliance framework — single control set mapped to GDPR Art.32, NIS2 security measures, DORA ICT risk management
- **Rejeté**: Separate compliance programs per regulation (cost duplication, inconsistent reporting), Minimal compliance (GDPR only — misses NIS2/DORA enforcement)
- **Rationale**: DORA fully applicable since 2025-01-17, NIS2 transposition ongoing. Email authentication (SPF/DKIM/DMARC/MTA-STS) satisfies all three frameworks simultaneously. Unified approach reduces audit burden and aligns with MW-2026-092 (TLS-RPT), MW-2026-011+042 (MTA-STS+DANE).

---

## 7. Notes de veille — 2026-09-23

### 7.1 Proton Lumo AI (2026)
- Proton a lancé Lumo, assistant AI privacy-first (local/on-premise), mascotte chat
- Backlash communauté privacy après Proton Scribe (cloud AI) — Lumo est la réponse
- Tuta maintient sa position: pas d'AI cloud dans les emails chiffrés
- **Implication misfits.ai**: on-device AI (MW-2026-095, MW-2026-020) est la bonne voie — évite le cloud AI backlash tout en offrant les features productivité

### 7.2 NIS2/DORA/GDPR convergence
- DORA applicable depuis 2025-01-17, NIS2 transposition en cours
- Email authentication (SPF/DKIM/DMARC/MTA-STS/DANE) satisfait les 3 frameworks
- Reporting unifié: un seul set de contrôles → moins de charge d'audit
- **Implication misfits.ai**: MW-2026-092 (TLS-RPT), MW-2026-011+042 (MTA-STS+DANE) couvrent NIS2+DORA simultanément

### 7.3 Dev sessions status
- mw-int, rg-back, testeur: sessions down (conductor-ops confirmed 2026-09-23)
- Scrum a des tickets en file mais personne pour les recevoir
- PR#906 (Caddyfile fix) CI green mais non merged — bloqué par session down

---

*Fichier maintenu par le Product Owner.*
