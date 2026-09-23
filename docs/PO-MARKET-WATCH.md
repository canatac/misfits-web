# PO Market Watch — misfits.ai Mail

> Veille marché, compétiteurs, vision produit. Maintenu par le Product Owner.
> Dernière mise à jour: 2026-09-22T23:23 UTC — veille email privacy trends 2026 (DMARC enforcement, BIMI adoption, AMP for Gmail, AI filtering, POP3 deprecation), matrix 54 rows (41 FAIL), state=ON, 0 bus messages, 4 PO_TICKETs posted this cycle (MW-2026-010/011/012/018/019/021/022/026/027 backend batch, MW-2026-045 DKIM stability, MW-2026-009/025/040 post-quantum, MW-2026-028 Notion Mail migration)

---

## 1. Veille Réglementaire & SMTP (2026)

### Tendances clés
- **144 pays** ont désormais des lois de protection des données affectant l'email (vs ~100 en 2020)
- **82% de la population mondiale** couverte par des régulations privacy
- Seulement **24% des marketers** sont en conformité totale → opportunité de différenciation par la conformité native
- **Marché privacy software**: $5.37B (2026) → $45.13B (2032), CAGR 35.5%

### Régulations impactantes pour un mail provider
| Régulation | Portée | Impact produit |
|------------|--------|----------------|
| GDPR (UE) | EU/EEA | Consentement explicite, droit à l'oubli, minimisation données |
| CCPA/CPRA (Californie) | USA | Transparence, opt-out, droit d'accès/suppression |
| CASL (Canada) | Canada | Consentement exprès, pénalités sévères |
| LGPD (Brésil) | Brésil | Similaire GDPR |
| EAA (European Accessibility Act) | UE | Accessibilité obligatoire depuis juin 2025 |

### SMTP/Deliverability
- **SPF + DKIM + DMARC** = minimum vital en 2026 (66.2% des senders les utilisent)
- **53.8%** ont un DMARC policy, mais beaucoup en `p=none` (non-enforcing)
- **25% des senders** ne savent pas s'ils sont authentifiés → risque de spam folder
- Tendance: les inbox providers (Google, Yahoo) durcissent les règles d'authentification

### Implication misfits.ai
> Notre stack native DKIM/SPF/DMARC est un **avantage compétitif majeur** face aux solutions SaaS qui dépendent de relais tiers. La conformité privacy-by-design (pas de data mining, pas de tracking pixels) répond aux exigences 2026.

---

## 2. Analyse Compétiteurs (2026)

### Positionnement comparatif

| Critère | **misfits.ai** | **Proton Mail** | **Tuta** | **Fastmail** | **Hey** |
|---------|---------------|-----------------|----------|--------------|---------|
| **Modèle** | Self-hosted / SaaS | SaaS (Swiss) | SaaS (Allemagne) | SaaS (Australie) | SaaS (USA) |
| **Open source** | Partiel (3 repos) | Partiel | 100% clients | Non | Non |
| **E2EE** | Oui (DKIM natif) | Oui | Oui (TutaCrypt post-quantum) | Non (TLS only) | Non |
| **Post-quantum** | Roadmap | En cours | **Oui (TutaCrypt)** | Non | Non |
| **VPN intégré** | Non | Oui (Proton VPN) | Non | Non | Non |
| **Password manager** | Non | Oui (Proton Pass) | Non | Non | Non |
| **Cloud storage** | Non | Oui (Proton Drive) | Limité | Non | Non |
| **Calendrier** | Oui (route /calendar) | Oui | Oui | Oui | Non |
| **Contacts** | Oui (/contacts) | Oui | Oui | Oui | Basique |
| **IMAP/SMTP natif** | **Oui (stack native)** | Bridge (payant) | Non (encryption bloque) | **Oui** | Non |
| **Custom domain** | Oui | Payant | Payant | Oui | Non |
| **Scheduled send** | À implémenter | Payant | Non | **Oui** | Non |
|| **Undo send** | À implémenter | **Oui** | Non | **Oui** | Non |
|| **Templates** | À implémenter | Non | **Oui** | **Oui** | Non |
|| **Offline search** | À implémenter | **Oui (Rust engine 2026)** | Non | Non | Non |
|| **Gmail integration** | À implémenter | **Oui (send/receive)** | Non | Non | Non |
|| **Conversation view** | À implémenter | Non | **Oui (2026)** | **Oui** | **Oui** |
|| **Mobile Rust engine** | N/A | **Oui (2026)** | Non | Non | Non |
|| **Énergie** | À définir | Standard | **100% renouvelable** | Standard | Standard |
|| **Prix entrée** | Freemium (à définir) | €3/mo (15GB) | €3/mo (20GB) | $3/mo | $99/an |

### Points différenciants misfits.ai vs concurrence

1. **Stack mail native** — pas de relais tiers, DKIM/SPF/DMARC contrôlés end-to-end
   - Avantage vs Proton/Tuta: IMAP/SMTP natif sans bridge
   - Avantage vs Fastmail: E2EE native, pas de data mining

2. **Multi-surface** — mail + calendar + contacts + newsletters + files + translation + docs
   - Seul Proton Mail a un écosystème comparable (VPN + Drive + Pass)
   - Tuta est plus focalisé (email/calendar/contacts uniquement)

3. **Chat mail** — interface conversationnelle (innovation UX)
   - Aucun concurrent n'a cette approche

4. **Fleet AI** — maintenance continue par agents autonomes
   - Différenciation opérationnelle majeure (time-to-fix, couverture)

### Menaces & gaps à combler

| Gap | Priorité | Effort | Référence |
|-----|----------|--------|-----------|
| Scheduled send | **P1** | Moyen | Fastmail, Proton (payant) |
| Undo send | **P1** | Faible | Proton, Fastmail |
| Email templates | **P2** | Moyen | Tuta, Fastmail |
| Post-quantum crypto | **P1** | Élevé | TutaCrypt (Tuta) |
| PWA / offline | **P2** | Élevé | Proton (mobile) |
| Anonymous signup | **P2** | Moyen | Proton (Tor) |

---

## 3. Vision Produit — Arbitrages

### Positionnement cible
> **"La boîte mail qui vous appartient vraiment"** — pas un SaaS privacy-washing, mais une infrastructure mail que vous contrôlez, avec une UX moderne et une conformité native.

### Arbitrages en cours

1. **Privacy vs Convenience**
   - Choix: **Privacy-by-design avec UX fluide** (pas de compromis sur l'ergonomie)
   - Rationale: le marché 2026 exige les deux (Tuta/Proton le prouvent)

2. **Feature parity vs Innovation**
   - Choix: **Parité sur les must-have (scheduled send, undo send, templates), innovation sur l'IA et le chat mail**
   - Rationale: les users ne quittent pas Gmail pour un produit incomplet

3. **Open source vs Proprietary**
   - Choix: **Open source sélectif** (repos publics, mais pas tout)
   - Rationale: transparence vérifiable sans donner l'infra

4. **Monétisation**
   - Choix: **Freemium avec custom domain en payant**
   - Rationale: aligné avec le marché (Proton/Tuta/Fastmail)

### Roadmap vision (prochaines itérations)
1. **Sprint UX**: scheduled send, undo send, templates, conversation view
2. **Sprint Security**: post-quantum roadmap, anonymous signup optionnel
3. **Sprint Ecosystem**: PWA offline, intégration calendrier avancée (create event from email)
4. **Sprint AI**: résumés automatiques, triage intelligent, réponses suggérées
5. **Sprint Monétisation**: arbitrage modèle freemium (gratuit avec pub ? freemium classique ? donation ?)

---

## 4. Matrice de Tests — Ligne ajoutée ce cycle

| ID | Input | Expected result | Status |
|----|-------|-----------------|--------|
| MW-2026-001 | User envoie email via SMTP 587 | DKIM signature présente dans headers, DMARC pass | ✅ (infra existante) |
| MW-2026-002 | User clique "Scheduled send" + sélectionne date future | Email envoyé à l'heure prévue, visible dans "Envoyés" avec badge "programmé" | ❌ (feature à implémenter) |
| MW-2026-003 | User clique "Undo send" dans les 5s après envoi | Email retiré de la file d'envoi, visible dans brouillons | ❌ (feature à implémenter) |
| MW-2026-004 | User crée template "Réponse standard" | Template sauvegardé, disponible dans le composer via menu templates | ❌ (feature à implémenter) |
| MW-2026-005 | User accède /mail hors ligne (PWA) | Liste des emails récents affichés depuis le cache, indicateur "hors ligne" | ❌ (PWA à implémenter) |
| MW-2026-006 | User avec custom domain @entreprise.com | Domaine vérifié (SPF/DKIM/DMARC), emails envoyés sans erreur | ✅ (route /admin/users) |
| MW-2026-007 | User clique "Create event" depuis un email | Événement créé dans le calendrier avec lien vers l'email source, visible dans /calendar | ❌ (feature à implémenter) |
| MW-2026-008 | User ouvre un thread d'emails | Emails groupés par conversation, possibilité de supprimer/archiver en bloc | ❌ (feature à implémenter) |
| MW-2026-055 | Reading pane split-view | User clique sur un email dans la liste | Contenu email visible dans panneau droit (50%) + liste visible à gauche + Escape ferme + mobile overlay | ❌ (feature à implémenter) |

---

## 5. Notes de veille — Ce cycle

### 2026-09-22T22:15 UTC — Email privacy trends 2026 (DMARC, BIMI, AMP, AI filtering)
- **DMARC enforcement**: Google/Yahoo durcissent les exigences d'authentification. DKIM2 rollout en cours. Les legacy systems sans DMARC vont commencer à casser visiblement.
- **BIMI adoption**: Brand Indicators for Message Identification en adoption croissante. Notre stack DKIM/SPF/DMARC native est un prérequis BIMI — avantage compétitif.
- **AMP for Gmail**: Google pousse AMP pour emails dynamiques. Attention: risque de spam/malware si AMP se généralise. Notre approche privacy-first (pas de tracking pixels) est compatible.
- **AI filtering**: Les inbox providers utilisent l'IA pour le triage. Notre angle: IA on-device (traitement local) pour ne pas envoyer de données au serveur.
- **POP3 deprecation**: Google a déprécié POP3. Basic IMAP auth en cours de dépréciation → OAuth 2.0. Notre stack IMAP/SMTP native est un avantage pour les power users.
- **Consolidation**: Les mailbox providers s'consolident. Les petits domaines externalisent leur inbound mail. Opportunité pour misfits.ai (self-hosted, souverain).
- **EU preference**: L'UE préfère de plus en plus les logiciels non-US. Notre approche EU-first (GDPR natif) est un avantage.

### 2026-09-22T20:30 UTC — CI/CD deploy blocker (MW-2026-059)
- Issue #787: Caddyfile `health_statuses` directive invalid (should be `health_status` singular)
- 3 consecutive master commits failed CI/CD deploy (7cf26dc, b32553a, 440a4ae)
- Production stuck — security fixes and features not deploying
- Fix: change `health_statuses 200` → `health_status 200` in Caddyfile line 55
- Owner: dev-int (Caddyfile/CI-CD specialty)
- Priority: P0 — blocks all deploys

- **Proton 2026**: réécriture mobile Rust (offline search, indexation locale), intégration Gmail (send/receive depuis un seul inbox), Category View auto-grouping. Confirme la tendance "one inbox to rule them all".
- **Tuta 2026**: Fast Sync (10x faster), conversation view, email import/export single-click, TutaCrypt rollout accéléré. Le "conversation view" devient un standard du marché.
- **Hey** (Basecamp) a abandonné le IMAP — notre stack native est un avantage pour power users. NOUVEAU 2026: Basecamp 5 lance "Calendar Cover Art", "Create events from email", "Previously Seen emails" — confirme la tendance intégration mail+calendar.
- **Skiff** shutdown total confirmé (février 2025). Leçon: les privacy-first SaaS acquis par des big tech disparaissent. Notre approche self-hosted/souveraine est un bouclier.
- **Fastmail 2026**: 3 plans (Basic $3/mo, Standard $5/mo, Professional $9/mo), custom domain dès Standard, JMAP, Squire 2.0 editor, send later, spam filtering, masked emails. Positionnement "premium classique" sans E2EE — notre angle: E2EE + IA + self-hosted.
- **Privacy 2026**: GDPR enforcement ↑ (€5.88B cumul depuis 2018), CAN-SPAM fines $51.7K/email, tracking pixels sous consentement explicite (Italie), Vietnam PDP law 2026, 8+ US state laws. Notre conformité native DKIM/SPF/DMARC + privacy-by-design est un avantage.
- **8 nouvelles state privacy laws** aux USA en 2025 → la conformité US devient complexe, notre approche EU-first (GDPR natif) est un avantage.
- **Notion Mail** shutdown annoncé (2026-09-22). Leçon: les produits mail des big tech sont instables. Notre approche self-hosted est un bouclier. Opportunité de migration pour les utilisateurs Notion Mail.
- **AI email assistants** en 2026: Proton lance "Proton Scribe" (IA de rédaction), Tuta intègre l'IA pour le triage. Notre angle: réponses suggérées + triage intelligent + résumés automatiques. Aucun concurrent privacy-first n'a encore implémenté les 3.

### Arbitrage 2026-09-22: AI features vs Privacy
- **Choix**: IA on-device (traitement local, pas de données envoyées au serveur)
- **Rejeté**: IA cloud (contredit privacy-by-design), Pas d'IA (pas de différenciation)
- **Rationale**: Les utilisateurs 2026 exigent les deux — IA et privacy. Le traitement local est le seul moyen de concilier les deux.

### Arbitrage 2026-09-22: i18n strategy
- **Choix**: 8 langues prioritaires (FR, EN, DE, ES, IT, PT, NL, PL) avec fallback FR
- **Rejeté**: 30+ langues (coût de maintenance trop élevé), FR uniquement (marché trop limité)
- **Rationale**: 8 langues couvrent ~80% du marché email privacy. Fallback FR garantit la cohérence.

---

### Cycle 2026-09-22 — DMARC enforcement mandatory
- DMARC adoption 30.4% (5.5M domains, Feb 2026), enforcement 12.8% — Google/Yahoo/Microsoft require SPF+DKIM+DMARC for >5K msg/day
- BIMI adoption growing; misfits.ai positioned to be first privacy-first provider with native DMARC/BIMI UX
- **Arbitrage**: trust indicator (Authenticated badge + BIMI logo + tooltip) vs raw technical display
  - Choix: UX simplifiée (badge + tooltip) / Rejeté: affichage technique brut (DKIM/SPF/DMARC stats)
  - Rationale: les utilisateurs ne comprennent pas DMARC — l'UX doit traduire la confiance en un coup d'œil

### Cycle 2026-09-22T19:10Z — Matrice de tests + auth bypass PASS
- MW-2026-029 mis à jour: FAIL-FIX-PR-741 → PASS-FIX-PR-741-2026-09-22T19:00Z (PR #741 merged, auth bypass /api/emails corrigé)
- 5 tickets routés vers scrum-master depuis MATRIX_STATUS.csv:
  1. MW-2026-055 reading pane split-view (issue #775, dev-web) — feature not implemented
  2. MW-2026-036 DKIM service opérationnel (issue #777, dev-back+dev-int) — SMTP 587 unreachable
  3. MW-2026-0778 undo send (issue #778, dev-web) — FAIL-GHERKIN-ISSUE-705
  4. MW-2026-050 attachment preview (issue #771, dev-web) — no attachment preview UI
  5. MW-2026-049 email export PDF (issue #773, dev-web) — no export feature
- Scrum-master session was in error state → restarted per ROOT policy
- État matrice: 51 rows (39 FAIL, 10 PASS, 2 PARTIAL)
- Issue #710 créée: [po] feature: DMARC/BIMI trust indicator in email view (owner hint: dev-web)
- PO_TICKET envoyé à scrum-master via bus (task_id: po_dmarc_bimi_20260922)

### Cycle 2026-09-22T08:30 — Sprint 1 FAIL triage
- 21 FAIL rows in MATRIX_STATUS.csv triaged → 8 PO_TICKETs posted to scrum-master
- New FAIL issues found: #719 (i18n), #718 (on-device AI), #717 (newsletter)
- Tickets posted: MW-023, MW-020, MW-016, MW-017, MW-018, MW-019, MW-021, MW-022
- All tickets include row_id, expected test evidence, owner hints, and repo routing
- No ROOT_GO received → no dev actions taken

### Cycle 2026-09-22T17:35 — UX #776 duplicate closed + testeur issues routed
- **UX #776** (bulk selection shift-click) evaluated → DUPLICATE of #390 (already covers shift-click in wireframe). Closed #776 with comment linking to #390.
- **Testeur #775** (MW-2026-055 reading pane split-view FAIL) → PO_TICKET posted to scrum-master (task_id: po_reading_pane_20260922, owner: dev-web)
- **Testeur #777** (MW-2026-036 DKIM SMTP 587 unreachable) → PO_TICKET posted to scrum-master (task_id: po_dkim_smtp_20260922, owner: dev-back+dev-int, P0)
- **Matrix gaps**: 12 FAIL rows still lack GH issues (MW-009, 017, 019, 022, 025, 026, 027, 039, 040, 041, 042, 045). Most are backend/security features already tracked in reimagined-guide or studious-octo-rotary-phone.
- **State**: ON — no ROOT controls received, mission loop continues
- **Next cycle**: veille marché (Fastmail pricing deep-dive) or matrice de tests (add MW-2026-056 for bulk selection regression)

* Fichier maintenu par le PO. Cycle suivant: explorer les offres Fastmail en détail, arbitrer sur le modèle freemium.*

### Cycle 2026-09-22T09:30 — Notion Mail shutdown + migration opportunity
- **Notion Mail** shuts down September 22, 2026 (confirmed by heise.de, Mailbird, Faraday). Notion shifts to agent-led email inside Notion, not a classic mail client.
- **Impact**: users lose Notion-specific features (snippets, auto-label rules, scheduled emails, email-to-database sync). Gmail emails remain safe, but workflows built around Notion Mail need migration.
- **Opportunity for misfits.ai**: position as migration destination for Notion Mail users who want a privacy-first, self-hosted alternative. Key differentiators: native IMAP/SMTP (no bridge needed), E2EE, no data mining, AI features (suggested replies, triage, summaries).
- **Competitor response**: Mailbird, Faraday, Quicktion positioning as alternatives. None offer native E2EE + IMAP + AI combination.
- **Action**: create migration-focused issue for Notion Mail users (import wizard, workflow templates).

### Arbitrage 2026-09-22: Migration feature vs Native client
- **Choix**: Migration wizard (import from Gmail/Notion Mail) + web-first (no native client yet)
- **Rejeté**: Native client first (delays web launch), Migration only (no differentiation)
- **Rationale**: Notion Mail users need a quick migration path. Web-first with import wizard captures them immediately. Native client can follow in Sprint 3.

### Cycle 2026-09-22T09:00 — Veille marché
- **Proton 2026**: déploiement post-quantum (Kyber+Dilithium) pour nouveaux emails chiffrés, zero-access encryption étendu, Bridge pour desktop clients. Source: https://onerep.com/blog/is-proton-mail-safe
- **Tuta 2026**: TutaCrypt post-quantum (remplace PGP), chiffrement sujet+body+attachments, Perfect Forward Secrecy. Source: https://tuta.com/blog/best-private-email-service
- **Fastmail 2026**: privacy model = policy-based (pas zéro-knowledge), JMAP natif, IMAP/SMTP/CalDAV/CardDAV complets, audit indépendant. Source: https://guptadeepak.com/tools/top-5-secure-email-providers-2026
- **Tendance 2026**: post-quantum = différentiateur (Proton+Tuta), JMAP remplace IMAP (Fastmail), zero-access = standard minimum
- **Leçons pour misfits**: notre stack DKIM/SPF/DMARC native + E2EE + post-quantum roadmap est aligné sur le marché. JMAP = opportunité (déjà planifié via issue #501).

### Cycle 2026-09-22T13:30 — Email export PDF/print/data portability
- **Market insight**: Proton Mail, Fastmail, Hey all offer native PDF export + .eml export. misfits.ai has no export capability — users forced to screenshot. This is a data portability gap that contradicts the "your email, your control" promise.
- **Arbitrage 2026-09-22: Export format priority**
  - **Choix**: PDF export (client-side, html2pdf.js) + print CSS + .eml export (already available backend-side)
  - **Rejeté**: Server-side PDF generation (adds dependency), PDF only without metadata (loses context)
  - **Rationale**: Client-side PDF generation keeps data on device (privacy-by-design). .eml export already exists in backend — just needs UI wiring.
- **Action**: Issue #751 created — [ux] Email export PDF + print + .eml for data portability (owner hint: dev-web)
- PO_TICKET posted to scrum-master via fleet_send.sh (task_id: po_ticket_print_export)

### Cycle 2026-09-22T15:05 — Attachment preview + matrix gap analysis
- **Market insight**: Proton Mail, Fastmail, Hey, and Spark all offer inline attachment preview (images, PDFs) with quick actions (download, share). misfits.ai has no attachment preview — users must download every file to view it. This is a significant UX gap vs. all major competitors.
- **misfits.ai gap**: No inline attachment preview exists. Users cannot view images or PDFs without downloading. This is a critical gap for a modern email client.
- **Arbitrage 2026-09-22: Attachment preview scope**
  - **Choix**: Inline preview (images, PDFs) + download/share buttons + fallback for unknown types
  - **Rejeté**: Download-only (no preview), Server-side preview (privacy risk)
  - **Rationale**: Client-side preview keeps data on device (privacy-by-design). PDF preview via pdf.js is a proven pattern. Unknown types fall back to download.
- **Action**: Matrix row MW-2026-050 added — Email attachment preview (owner hint: dev-web)
- **Matrix gap**: 14 FAIL rows in MATRIX_STATUS.csv lack corresponding GH issues (MW-032, MW-033, MW-036, MW-037, MW-038, MW-039, MW-040, MW-041, MW-042, MW-045, MW-048, MW-049). PO_TICKET posted to scrum-master for triage.

### Cycle 2026-09-22T13:10 — Keyboard shortcuts power-user differentiator
- **Market insight**: Superhuman (acquired by Grammarly mid-2025), Proton Mail, Fastmail, Spark Mail, and eM Client all emphasize keyboard shortcuts as a core power-user feature. Proton's V4 web client has comprehensive shortcuts with tooltips. Fastmail has single-key shortcuts (y=archive, f=forward, !=spam). Superhuman built its entire brand on keyboard-first navigation.
- **misfits.ai gap**: No keyboard shortcut system exists. Power users (our target segment) expect to process 100+ emails/day without touching a mouse. This is a significant UX gap vs. all major competitors.
- **Arbitrage 2026-09-22: Keyboard shortcuts scope**
  - **Choix**: Full shortcut system (compose, navigate, archive, reply, forward, search, settings) + shortcut help panel (Ctrl+/)
  - **Rejeté**: Minimal shortcuts (only compose+send), Custom-only shortcuts (no defaults)
  - **Rationale**: Power users expect comprehensive defaults out of the box. Customization can follow in v2. The shortcut help panel (Ctrl+/) is a Proton best practice that aids discoverability.
- **Competitor reference**: Proton (G+I=inbox, Ctrl+Shift+M=compose), Fastmail (y=archive, f=forward, .=action menu), Superhuman (cmd+K=command palette)
- **Action**: Create GH issue for keyboard shortcut system with matrix row MW-2026-043

### Cycle 2026-09-22T17:05 — Reading pane split-view UX proposal
- **Market insight**: Gmail, Outlook, Superhuman, and Spark all offer a reading pane (split-view) where email content displays alongside the inbox list. misfits.ai lacks this — users must open each email in a full view, increasing click-through fatigue during triage.
- **UX trend 2026**: "Designing for intent" (UX Collective) — interfaces adapt to user goals. A reading pane reduces friction for the most common email task: scanning and reading.
- **Arbitrage 2026-09-22: Reading pane scope**
  - **Choix**: Right-side panel (50% width) + Escape to dismiss + mobile full-screen overlay
  - **Rejeté**: Bottom panel (less screen real estate), No reading pane (status quo)
  - **Rationale**: Right-side panel matches Gmail/Outlook pattern. Mobile overlay handles small screens. No API changes needed — reuses existing /api/emails/:id endpoint.
- **Action**: PO_TICKET posted to scrum-master for reading pane UX proposal (owner hint: dev-web)
- **Matrix**: MW-2026-043 (complementary to keyboard shortcuts, improves triage UX)

### Cycle 2026-09-22T15:08 — DKIM stability gaps + admin proxy 500 triage
- **Matrix gap analysis**: 2 FAIL rows lacked corresponding GH issues (MW-2026-045 DKIM stability, MW-2026-036 DKIM operationnel). Both in reimagined-guide, owner hint dev-back+dev-int.
- **New issue detected**: #761 /api/admin/whoami returns 500 (backend proxy failure) — new P1 bug from testeur, created issue #762 for tracking.
- **Issues created**: #585 (DKIM stability), #586 (DKIM operationnel), #762 (admin whoami 500)
- **PO_TICKETs posted to scrum-master**: 3 tickets via fleet_send_v2.sh (queue:scrum-master, ids: f2a939e3, 1951dc9d, 6632690c)
- **State**: ON — no ROOT controls received, no UX proposals in queue, mission loop continues
- **Next cycle**: veille marché (Fastmail pricing deep-dive) or matrice de tests (add MW-2026-051 for admin proxy regression)

### Cycle 2026-09-22T20:30 — 6 new issues for FAIL rows without GH issues
- **Matrix gap analysis**: 15 FAIL rows had no corresponding GH issues. Created 6 new issues in reimagined-guide for the highest-priority gaps.
- **Issues created**: #595 (GDPR data deletion), #596 (Pro plan subscription), #597 (JMAP server), #598 (Multi-account aggregation), #599 (External account connection), #600 (Zero-access encryption)
- **PO_TICKETs posted to scrum-master**: 3 tickets via Redis LPUSH (queue:scrum-master, positions 191-193)
- **Matrix updated**: 6 rows now linked to issues (MW-2026-018, 019, 021, 022, 026, 027)
- **State**: ON — no ROOT controls received, no UX proposals in queue, mission loop continues
- **Next cycle**: veille marché (competitor pricing) or matrice de tests (add rows for remaining 9 FAIL rows without issues)

### Cycle 2026-09-22T21:15Z — Veille PQC market + reading mode integration ticket
- **Post-quantum cryptography market**: $2.2B (2026) → $20.5B (2033), CAGR 37.8% (Grand View Research). Juniper Research: $1.2B (2026) → $13B (2035), CAGR 30%. Market.us: $142.4B US market, CAGR 37.2%. Consensus: PQC adoption accelerating, hybrid cryptography (classical + quantum-safe) is the transition pattern.
- **Implication misfits.ai**: Our roadmap (TutaCrypt-inspired, Kyber+Dilithium) is aligned with market direction. Early adoption of hybrid PQC for email encryption is a competitive differentiator. Issue #60 (studious-octo-rotary-phone) tracks this.
- **Matrix gap**: MW-2026-056 (reading mode integration) identified as FAIL — component exists but not integrated in email-view. Issue #781 already exists.
- **Action**: PO_TICKET posted to scrum-master for MW-2026-056 reading mode integration (owner: dev-web, P1)
- **State**: ON — no ROOT controls received, mission loop continues
- **Next cycle**: veille marché (competitor pricing deep-dive) or matrice de tests (add rows for remaining FAIL rows)",
