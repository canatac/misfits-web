# PO Market Watch — misfits.ai Mail

> Veille marché, compétiteurs, vision produit. Maintenu par le Product Owner.
|Dernière mise à jour: 2026-09-10|

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
| **NIS2** (UE 2024, appliqué 2026) | UE | Incident reporting 24h, supply chain risk audit, management body responsable |
| **DORA** (UE, applicable 2025) | Secteur financier EU | Résilience ICT, TLPT triennal, pénalités jusqu'à 2% CA mondial |
| **CRA** (Cyber Resilience Act, sep 2026) | Produits numériques EU | Reporting vulnérabilités 24h/72h (ENISA), full compliance déc 2027 |

### Focus NIS2 / DORA / CRA 2026
- **NIS2** pleinement appliqué (oct 2026) — incident reporting 24h, audits supply chain, responsabilité du management.
- **DORA** (financial services) — pénalités jusqu'à 2% du CA annuel mondial. Même si misfits.ai n'est pas une entité financière, nos clients B2B peuvent exiger la conformité DORA.
- **CRA** reporting obligatoire dès le **11 septembre 2026** : vulnérabilités exploitées (24h early warning, 72h notification détaillée). Full CRA (conformité technique, marquage CE, évaluation de conformité) → 11 décembre 2027. Notre stack (3 repos, Next.js, Rust, infra as code) est concerné. La transparence (repos publics) facilite la conformité (SBOM, documentation technique).

### SMTP/Deliverability
- **SPF + DKIM + DMARC** = minimum vital en 2026
- **BIMI** devient un standard (Google/Yahoo requis depuis 2025)

### Implication misfits.ai
> Notre stack native DKIM/SPF/DMARC est un **avantage compétitif majeur**. L'hébergement Scaleway (conforme NIS2/DORA) renforce notre posture B2B. La transparence (open core) facilite la conformité CRA.

---

## 2. Analyse Compétiteurs (2026)

### Évolution du marché 2026
- **Proton Scribe** (IA locale, Mistral 7B) = confirmation que l'IA privacy-first est un différenciateur
- **Superhuman** (racheté par Grammarly, juin 2025) = IA cloud pour le triage, mais données envoyées au cloud
- **Notion Mail** = IA cloud (intégration Notion), uniquement Gmail, pas de privacy
- **Tuta** = refuse l'IA cloud catégoriquement
- **misfits.ai** = **IA locale exclusivement (Hermes AI)**, triage, résumé, chat, drafting — "The AI that reads your inbox, but never leaks it"

### Positionnement comparatif

| Critère | **misfits.ai** | **Proton Mail** | **Tuta** | **Fastmail** | **Hey** |
|---------|---------------|-----------------|----------|--------------|---------|
| **Modèle** | Self-hosted / SaaS | SaaS (Swiss) | SaaS (Allemagne) | SaaS (Australie) | SaaS (USA) |
| **Open source** | Partiel (3 repos) | Partiel | 100% clients | Non | Non |
| **E2EE** | Oui (DKIM natif) | Oui | Oui (TutaCrypt post-quantum) | Non (TLS only) | Non |
| **IA locale** | **Oui (Hermes AI)** | Oui (Proton Scribe) | Non | Non | Non |
| **Post-quantum** | Roadmap | En cours | **Oui (TutaCrypt)** | Non | Non |
| **VPN intégré** | Non | Oui (Proton VPN) | Non | Non | Non |
| **Calendrier** | Oui (route /calendar) | Oui | Oui | Oui | Non |
| **IMAP/SMTP natif** | **Oui (stack native)** | Bridge (payant) | Non (encryption bloque) | **Oui** | Non |
| **Custom domain** | Oui | Payant | Payant | Oui | Non |
| **Scheduled send** | À implémenter | Payant | Non | **Oui** | Non |
| **Undo send** | À implémenter | **Oui** | Non | **Oui** | Non |
| **Templates** | À implémenter | Non | **Oui** | **Oui** | Non |
| **Conversation view** | À implémenter | Non | **Oui (2026)** | **Oui** | **Oui** |
| **Mobile Rust engine** | N/A | **Oui (2026)** | Non | Non | Non |
| **Énergie** | **100% renouvelable** | Standard | **100% renouvelable** | Standard | Standard |
| **Prix entrée** | Freemium (à définir) | €3/mo (15GB) | €3/mo (20GB) | $3/mo | $99/an |

### Points différenciants misfits.ai vs concurrence

1. **Stack mail native** — IMAP/SMTP natif sans bridge (vs Proton)
2. **IA locale** — Hermes AI on-device, "The AI that reads your inbox, but never leaks it"
3. **Multi-surface** — mail + calendar + contacts + newsletters + translation + docs
4. **Fleet AI** — maintenance continue par agents autonomes

### Menaces & gaps à combler

| Gap | Priorité | Effort | Référence |
|-----|----------|--------|-----------|
| Scheduled send | **P1** | Moyen | Fastmail, Proton (payant) |
| Undo send | **P1** | Faible | Proton, Fastmail |
| Email templates | **P2** | Moyen | Tuta, Fastmail |
| Post-quantum crypto | **P1** | Élevé | TutaCrypt (Tuta) |
| PWA / offline | **P2** | Élevé | Proton (mobile) |

---

## 3. Vision Produit — Arbitrages

### Positionnement cible
> **"La boîte mail qui vous appartient vraiment"** — pas un SaaS privacy-washing, mais une infrastructure mail que vous contrôlez, avec une UX moderne et une conformité native.

### Arbitrages en cours

1. **Privacy vs Convenience** — Privacy-by-design avec UX fluide
2. **Feature parity vs Innovation** — Parité must-have, innovation IA/chat mail
3. **Open source vs Proprietary** — Open source sélectif (3 repos)
4. **Monétisation** — Freemium avec custom domain en payant
5. **Modèle freemium** — Freemium classique, pub UNIQUEMENT opt-in "supporter"
   - Free: 5GB, 10 aliases, pas de custom domain
   - Pro ($5/mo): 50GB, custom domain, aliases illimités, scheduled send, templates
   - Business ($10/mo): tout Pro + shared calendars, SSO, audit logs
6. **Open source** — 3 repos publics, documentation ouverte, pas de self-hosted gratuit
7. **Énergie / green** — Hébergement 100% renouvelable, badge "green email"
8. **IA email locale** — IA locale exclusivement (Hermes AI on-device), pas de cloud AI
   - Positionnement vs concurrence:
     - Proton Scribe: IA locale, uniquement composition
     - Superhuman: IA cloud (données envoyées)
     - Notion Mail: IA cloud (Notion)
     - Tuta: pas d'IA
   - Notre angle: **"The AI that reads your inbox, but never leaks it"**
9. **One inbox / multi-comptes** — Multi-comptes natif (agrégation IMAP/SMTP externe), gratuit jusqu'à 3 comptes externes
   - Free: 1 compte misfits
   - Pro: + 3 comptes externes
   - Business: comptes illimités + shared inboxes

### Roadmap vision (prochaines itérations)
1. **Sprint UX**: scheduled send, undo send, templates, conversation view
2. **Sprint Security**: post-quantum roadmap, anonymous signup
3. **Sprint Ecosystem**: PWA offline, intégration calendrier avancée
4. **Sprint AI**: résumés automatiques, triage intelligent, réponses suggérées
5. **Sprint Monétisation**: arbitrage modèle freemium (fait — freemium classique)

---

## 4. Matrice de Tests

| ID | Input | Expected result | Status |
|----|-------|-----------------|--------|
| MW-2026-001 | User envoie email via SMTP 587 | DKIM signature présente, DMARC pass | ✅ (infra existante) |
| MW-2026-002 | User clique "Scheduled send" + date future | Email envoyé à l'heure prévue, badge "programmé" | ❌ (issue #517) |
| MW-2026-003 | User clique "Undo send" dans les 5s | Email retiré de la file, visible brouillons | ❌ (issue #518) |
| MW-2026-004 | User crée template "Réponse standard" | Template sauvegardé, disponible composer | ❌ (issue #519) |
| MW-2026-005 | User accède /mail hors ligne (PWA) | Emails récents depuis cache, indicateur | ❌ (issue #520) |
| MW-2026-006 | User avec custom domain @entreprise.com | Domaine vérifié (SPF/DKIM/DMARC) | ✅ (route /admin/users) |
| MW-2026-008 | User ouvre un thread d'emails | Emails groupés, suppression/archivage bloc | ❌ (feature à implémenter) |
| MW-2026-009 | User consulte la conversation view | Affichage groupé, tri chrono, "X messages" | ❌ (issue #515) |
| MW-2026-010 | User génère un masked email alias | Alias créé, forward inbox, désactivation | ❌ (issue #516) |
| MW-2026-011 | User recherche dans sa boîte | Résultats <200ms, recherche pendant indexation | ❌ (issue #521) |
| MW-2026-012 | User ouvre la PWA mobile hors-ligne | Emails récents, indicateur, sync au retour | ❌ (PWA à implémenter) |
| MW-2026-013 | User demande l'accès à ses données | Export complet mbox/vCard/iCal sous 72h | ❌ (issue #514) |
| MW-2026-014 | User crée un événement depuis un email | Événement créé, pré-remplissage, sync CalDAV | ❌ (issue #526) |

---

## 5. Notes de veille — Ce cycle

### Cycle 2026-09-10

**Issues créées ce cycle :**
- `#513` — NIS2/DORA compliance audit & reporting framework
- `#514` — Personal data export (RGPD/NIS2 compliance)
- `#515` — Conversation view (thread grouping, standard marché 2026)
- `#516` — Masked email aliases (anti-spam, vs Fastmail ~1000 aliases)
- `#517` — Scheduled send (envoi programmé, must-have 2026)
- `#518` — Undo send (5-second recall window, must-have 2026)
- `#519` — Email templates (save and reuse, must-have 2026)
- `#520` — PWA offline mode with service worker (must-have 2026)
- `#521` — Instant search (sub-200ms with indexing)
- `#522` — Post-quantum cryptography Kyber+Dilithium
- `#523` — BIMI brand logo display
- `#526` — Create event from email (calendar integration)
- `#527` — Multi-account email aggregation (one inbox)
- `#530` — Email authentication monitoring (DKIM/SPF/DMARC)
- `#532` — Thread actions (bulk delete, archive, mark read)
- `#533` — Search filters (date, sender, attachments)
- `#534` — Email templates with variables (dynamic content)
- `#537` — SMTP security hardening (STARTTLS, DANE, MTA-STS) (reimagined-guide)
- `#538` — Post-quantum cryptography Kyber+Dilithium (reimagined-guide)
- `#539` — Instant search backend (full-text, <200ms) (reimagined-guide)
- `#540` — Event creation from email (CalDAV integration) (reimagined-guide)
- `#541` — Multi-account email aggregation backend (IMAP/SMTP external) (reimagined-guide)
- `#542` — Undo send backend (5-second recall window) (reimagined-guide)
- `#543` — Scheduled send backend (envoi programmé) (reimagined-guide)
- `#544` — Conversation view backend (thread grouping) (reimagined-guide)
- `#545` — Search filters backend (date, sender, attachments) (reimagined-guide)
- `#540` — Spam rate monitoring (Gmail/Yahoo compliance <0.3%) (misfits-web)
- `#541` — One-click unsubscribe (List-Unsubscribe header) (misfits-web)
- `#52` — Automated DKIM key rotation (NIS2/CRA compliance) (studious-octo-rotary-phone)
- `#53` — BIMI record validation and VMC certificate verification (studious-octo-rotary-phone)
- `#54` — Masked email alias management API (studious-octo-rotary-phone)

**CRA 2026 (Cyber Resilience Act)** : les obligations de reporting entrent en vigueur le 11 septembre 2026. Les fabricants de produits numériques doivent :
- Rapporter les vulnérabilités activement exploitées : early warning sous 24h, notification détaillée sous 72h
- Suivi via la plateforme ENISA
- Full CRA (conformité technique, marquage CE, évaluation de conformité) → 11 décembre 2027
- Notre stack (3 repos, Next.js, Rust, infra as code) est concerné
- Notre avantage : transparence (repos publics) facilite la conformité (SBOM, documentation technique, gestion des CVEs)

**BIMI 2026 (adoption stats)** :
- **25%** des marques commerciales ont un enregistrement BIMI publié (2026)
- **12%** ont un certificat VMC (blue checkmark dans Gmail)
- **5-10%** d'open rate lift après déploiement BIMI
- **340%** d'augmentation YoY des nouveaux enregistrements BIMI (2024 → 2026)
- **35%** des Fortune 500 ont un DMARC p=reject
- **30%** des senders sont encore partiellement non-conformes (Gmail/Yahoo)
- Non-conformité = spam folder de 5-10% (baseline) à 22-34%
- **Notre avantage** : stack DKIM native + BIMI validation (issue #53) = conformité intégrée

**Email Deliverability 2026** :
- SPF valide : 94% des senders commerciaux
- DKIM valide : 91% des senders commerciaux
- DMARC publié : 75%+ des Fortune 500
- DMARC p=reject : 35% des Fortune 500
- Taux de spam < 0.3% requis (Google)
- One-click unsubscribe requis (List-Unsubscribe header)
- Notre stack native répond déjà à ces exigences

**Proton 2026 (détail)** : réécriture mobile Rust complète — iOS et Android partagent 80% du code (SwiftUI + Jetpack Compose + core Rust). Offline search, Category View auto-grouping, Gmail native, SimpleLogin intégrée. Enseignement: le Rust n'est pas seulement pour le backend — c'est un choix cross-platform.

**Tuta 2026 (détail)** : Fast Sync 10x, nested labels, search amélioré, Tuta Drive open beta, inbox rules, schedule send et undo send déployés. Leçon: la UX vitesse > E2EE pour le marché mainstream.

**Basecamp 2026 (détail)** : Basecamp 5 — calendrier full-screen global + par projet, événements répétitifs, to-dos sur calendrier, menu unifié (SHIFT+J). Intégration email : projet = adresse email unique. Leçon: "email as task source" — notre route /calendar suit cette direction.

**Fastmail 2026 (détail)** : 3 plans (Basic $3/mo 6GB, Standard $5/mo 60GB, Pro $9/mo 150GB). ~1000 masked email aliases, JMAP natif, Squire 2.0, offline, calendar sync. Leur killer feature = masked emails anti-spam.

**Skiff**: shutdown total confirmé (février 2025). Leçon: les privacy-first SaaS acquis par des big tech disparaissent. Notre approche self-hosted/souveraine est un bouclier.

**Privacy 2026**: GDPR enforcement ↑ (€5.88B cumul), CAN-SPAM fines $51.7K/email, tracking pixels sous consentement (Italie), Vietnam PDP law 2026, 8+ US state laws.

**IA email 2026** : Proton Scribe (Mistral 7B, local) confirme la tendance IA privacy-first. Superhuman (Grammarly) = IA cloud. Notion Mail = IA cloud. Tuta = pas d'IA. Notre positionnement : IA locale exclusivement (Hermes AI), triage, résumé, chat, drafting — "The AI that reads your inbox, but never leaks it".

**Notion Mail shutdown** : fermeture le 22 septembre 2026. Gmail-only, workspace intégré. Leçon : un mail client intégré à un workspace n'est pas un mail provider souverain. Notre approche (provider souverain + intégrations) est validée.

**Superhuman 2026** : $30/mo (Starter), $40/mo (Business). IA cloud (données envoyées), keyboard shortcuts extrêmes, Auto Drafts, Auto Labels, CRM integrations. Avantage = vitesse (latence quasi-nulle). Inconvénient = IA cloud (privacy), Gmail/Outlook uniquement, prix élevé. Leçon : la vitesse d'interface est un vrai différenciateur — notre stack Rust/Next.js doit viser la même réactivité.

**One inbox 2026** : tendance confirmée (Proton, Mailbird, Superhuman, Missive). Notion Mail disparaît. Notre avantage = stack native IMAP/SMTP vs Proton bridge payant. Arbitrage : multi-comptes natif.

**Email client performance 2026** :
- **Rust vs Go** : Rust Axum ~307k req/s vs Go ~180k req/s (benchmark 2026)
- **Rust WASM vs JS** : 15x faster for email rendering (1.1ms vs 18ms) — confirme notre choix Rust/Next.js pour la performance
- **WebAssembly** : proche du natif (1.59x native avec WAMR)
- **Proton mobile Rust** : confirme que Rust est le choix performance pour l'email
- **Notre stack** : Rust (backend) + Next.js (frontend) = positionné pour la vitesse

**Shortwave 2026 (détail)** : client AI-native pour Gmail uniquement. $18/mo (Pro), $30/mo (Business), $45/mo (Premier), $120/mo (Max). AI search sémantique (décrire plutôt que mots-clés), bundling, thread summarization. Avantage = AI native + vitesse. Inconvénient = Gmail uniquement, cloud AI, pas de free plan permanent. Leçon: la recherche sémantique est un différenciateur — notre recherche instantanée (MW-011) doit viser la même expérience.

**Spike 2026 (détail)** : email en style chat (bulles de message). $5/mo (Pro), $35/mo (AI agents). Unified inbox, team collaboration, video calls, AI writing. Avantage = UX moderne, chat naturel. Inconvénient = gimmicky UI (pour certains), pas d'IA autonome, prix élevé pour équipes. Leçon : l'email conversationnel est une tendance UX — notre "chat mail" (misfits.ai) est pionnière sur ce positionnement.

**Missive 2026 (détail)** : team inbox + shared inboxes + internal chat + AI drafting. $14/mo (Starter), $24/mo (Productive, AI features), $36/mo (Business). AI via Missive credits (BYOK support). Free plan for teams up to 3. Avantage = collaboration + AI intégrés. Inconvénient = AI credits en sus, reporting limité. Leçon : l'email team avec AI intégrée est un positionnement fort — notre "chat mail" + IA locale peut viser le même marché mais avec la privacy en plus.

**Drag 2026** : alternative à Missive. $12/$18 (AI inclus)/$24. Shared inbox avec Kanban board. AI included (pas de crédits en sus). Positionnement similaire à Missive mais moins cher.

**SaneBox 2026** : inbox filtering sans changer de client email. Alternative légère.

**Spark 2026** : email client moderne, AI drafting, natural language search. $8.25/mo (Plus), $16.58/mo (Pro). Alternative légère à Missive.

**Front 2026** : support inbox + AI automations. $29/seat/mo. Alternative orientée support client.

**Mailbird 2026** : client email multi-comptes, unified inbox, cross-account search. Free (1 compte), Premium $4/mo (annuel) ou $99.75 one-time. Windows + Mac (depuis oct 2024). Avantage = multi-comptes illimités, rapide, local storage. Inconvénient = pas de mobile, pas d'IA avancée. Leçon : le multi-compte natif est un besoin marché — notre arbitrage "one inbox" (multi-comptes natif) est validé.

---

### Cycle 2026-09-09

- **Proton 2026**: réécriture mobile Rust, Gmail integration, Category View, SimpleLogin intégrée.

*Fichier maintenu par le PO. Prochain cycle : explorer les offres Fastmail en détail, arbitrer sur le modèle freemium.*
