# Product Vision V1 — misfits.ai Mail

> Derniere mise a jour: 2026-09-22T23:55:00Z — PO cycle: 51 matrix rows (22 FAIL plain, 17 FAIL with issue, 6 PASS, 2 PARTIAL), state=ON, 0 bus messages, 18 PO_TICKETs posted to scrum-master (MW-2026-009/010/011/012/017/018/025/028/032/033/036/037/039/040/041/042/045/048/054-DEPLOY)

---

## 1. Mission

**La boite mail qui vous appartient vraiment.**

misfits.ai Mail est un service de messagerie email natif (SMTP/IMAP) avec une UX moderne, une conformite privacy-by-design, et une stack d'authentification email complete (DKIM/SPF/DMARC). Pas un SaaS privacy-washing — une infrastructure mail que vous controlez.

---

## 2. Positionnement

| Critere | misfits.ai | Proton Mail | Tuta | Fastmail | Hey |
|---------|------------|-------------|------|----------|-----|
| Modele | Self-hosted / SaaS | SaaS (Swiss) | SaaS (DE) | SaaS (AU) | SaaS (US) |
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
- Conformite native GDPR/CCPA/CASL/LGPD
- DKIM/SPF/DMARC natif (pas de relais tiers)

### 3.2 UX Moderne
- Interface conversationnelle (chat mail)
- Multi-surface: mail + calendar + contacts + files + translation
- PWA avec mode hors ligne

### 3.3 Securite
- E2EE natif
- Roadmap post-quantum (TutaCrypt-inspired)
- Anonymous signup optionnel

### 3.4 IA
- Resumes automatiques
- Triage intelligent
- Reponses suggerees

---

## 4. Roadmap

### Sprint 1 — Foundation (actuel)
- [x] Stack SMTP/IMAP native
- [x] DKIM/SPF/DMARC
- [x] Multi-surface (mail, calendar, contacts)
- [x] Auth bypass fix (PR #741, regression PASS 2026-09-22)
- [ ] Scheduled send (ISSUE-705)
- [ ] DKIM service stability (MW-2026-045, ticket poste)
- [ ] Email forward button (MW-2026-048, ticket poste)
- [ ] Bulk email selection (MW-2026-063, ISSUE-803)
- [ ] Email snooze presets (UX-779, ISSUE-809)
- [ ] BIMI brand indicator (MW-2026-060, ISSUE-808)
- [ ] Deploy failure — PR #805 Caddyfile validation (ISSUE-810, ticket MW-2026-054-DEPLOY poste)

### Sprint 2 — UX & IA
- [ ] AI email summary (ISSUE-714)
- [ ] AI smart triage (ISSUE-715)
- [ ] AI suggested replies (ISSUE-716)
- [ ] Conversation view (ISSUE-713)
- [ ] PWA offline (ISSUE-711)
- [ ] Unified search bar (MW-2026-037, ticket poste)
- [ ] Reading mode (MW-2026-056, ISSUE-794)
- [ ] Email attachment preview (MW-2026-050, ISSUE-782)
- [ ] Email export .eml batch (MW-2026-017+058, ISSUE-785)

### Sprint 3 — Backend & Security
- [ ] Multi-account aggregation (MW-2026-019)
- [ ] External account connection (MW-2026-022)
- [ ] JMAP server (MW-2026-026)
- [ ] Zero-access encryption (MW-2026-027)
- [ ] Pro plan subscription (MW-2026-021)
- [ ] MTA-STS + DANE (MW-2026-042, ticket poste)
- [ ] Post-quantum crypto (MW-2026-040, ticket poste)
- [ ] Anonymous signup via Tor (MW-2026-041, ticket poste)
