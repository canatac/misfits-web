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
**NIS2 2026 (pleine application)** : la directive NIS2 (UE 2022/2555) est pleinement appliquée depuis octobre 2026. Points clés :
- Article 23 : timeline incident reporting 24h/72h/30j
- Article 20 : responsabilité personnelle du management
- Amendes : jusqu'à 10M€ ou 2% du CA mondial
- L'annexe d'un Implementing Act mentionne explicitement la sécurité email (DMARC/DKIM/SPF)
- 7 États membres renvoyés devant la CJUE pour non-transposition
- Coordination CRA-NIS2 pour éviter les doublons de reporting
- Opprobre sur les email providers : obligation de moyens renforcée

**Privacy compliance 2026 (synthèse)** :
- GDPR : +20% de hausses de amendes en 2024, email marketing violations = top 3 des causes d'amendes. Amendes jusqu'à 20M€ ou 4% CA.
- CAN-SPAM : amendes jusqu'à $51,744/email. FTC + state attorneys general.
- CPRA (Californie) : privacy risk assessments, cybersecurity audits, Delete Act (mécanisme centralisé de suppression).
- US state laws : multiplication des lois state-level privacy (8+ states en 2025).
- Trend : AI explicitly embedded in regulatory framework (GDPR Omnibus proposals nov 2025).
- **Pour misfits.ai** : notre conformité native (DKIM/SPF/DMARC, privacy-by-design, data minimization) est un avantage compétitif face à ces exigences croissantes.

**Email trends 2026** :
- AI-driven personalization, hyper-segmentation, privacy-first data strategies
- Stricter authentication requirements (SPF/DKIM/DMARC/BIMI)
- Interactive email design, omnichannel integration (SMS, WhatsApp, push)
- Post-Apple Mail Privacy Protection : open rates unreliable → focus on click-through, revenue attribution
- Zero-party data (preferences explicitly shared) + transparent consent = better deliverability
- **Pour misfits.ai** : notre approche privacy-first + DKIM native + multi-surface (mail/calendar/contacts/newsletters) est alignée sur ces tendances.
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
5. **Sprint Monétisation**: arbitrage modèle freemium (fait — freemium classique, pas de pub par défaut, Free/Pro/Business)
6. **Sprint Croissance**: arbitrage stratégie d'acquisition (fait — "La boîte mail qui vous appartient vraiment" + différenciation DKIM native + IA locale)
7. **Partenariats / intégrations**: arbitrage sur les intégrations prioritaires (CalDAV, CRM, Slack) — oui mais pas de plateforme de communication propriétaire (rappel: "Nous n'utiliserons pas les plateformes de communication")
   - Rationale: les utilisateurs veulent des intégrations, mais pas de lock-in. Les APIs ouvertes > les plateformes fermées. Notre force = IMAP/SMTP natif, pas de bridge.
   - Intégrations prioritaires: CalDAV (fait, #540), Google Calendar (en cours), Zapier (webhook), pas de Slack/Matrix/Teams (politique user)

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
| MW-2026-015 | User lance l'import wizard Gmail/Outlook | Import réussi, dossiers préservés, métadonnées intactes | ❌ (#549) |
| MW-2026-016 | User génère un masked email via l'API | Alias créé (xxxxx@misfits.ai), forward activé, compteur d'activité | ❌ (#54) |
| MW-2026-017 | User reçoit un email phishing AI-generated | Détection SPF/DKIM/DMARC + avertissement phishing affiché | ❌ (#530) |
| MW-2026-018 | User envoie email vers Gmail/Yahoo (bulk) | SPF/DKIM/DMARC validés, spam rate <0.3%, unsubscribe header | ❌ (#540) |
| MW-2026-019 | User envoie email E2EE à un destinataire PGP | Email chiffré, clé PGP vérifiée, déchiffrement côté destinataire | ❌ (#522) |
| MW-2026-020 | IA locale (Hermes) traite un email sans cloud | Résumé/draft généré on-device, aucune donnée ne quitte l'appareil | ❌ (Hermes AI à implémenter) |

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
- `#540` — Event creation from email (CalDAV integration) (reimagined-guide) → remplacé par #550
- `#550` — Event creation backend (CalDAV integration) (reimagined-guide) — version finale
- `#541` — Multi-account email aggregation backend (IMAP/SMTP external) (reimagined-guide)
- `#542` — Undo send backend (5-second recall window) (reimagined-guide)
- `#543` — Scheduled send backend (envoi programmé) (reimagined-guide)
- `#544` — Conversation view backend (thread grouping) (reimagined-guide)
- `#545` — Search filters backend (date, sender, attachments) (reimagined-guide)
- `#547` — Email templates API (save, reuse, variables) (reimagined-guide)
- `#548` — Newsletter one-click unsubscribe backend (List-Unsubscribe header) (reimagined-guide)
- `#549` — Email import wizard backend (Gmail/Outlook/Yahoo/IMAP) (reimagined-guide)
- `#540` — Spam rate monitoring (Gmail/Yahoo compliance <0.3%) (misfits-web)
- `#541` — One-click unsubscribe (List-Unsubscribe header) (misfits-web)
- `#550` — PWA mobile offline (service worker, cache, sync) (misfits-web)
- `#52` — Automated DKIM key rotation (NIS2/CRA compliance) (studious-octo-rotary-phone)
- `#53` — BIMI record validation and VMC certificate verification (studious-octo-rotary-phone)
- `#54` — Masked email alias management API (studious-octo-rotary-phone)
- `#55` — DMARC aggregate report analysis (RUA/RUF) (studious-octo-rotary-phone)

**CRA 2026 (Cyber Resilience Act)** : les obligations de reporting entrent en vigueur le 11 septembre 2026. Les fabricants de produits numériques doivent :
- Rapporter les vulnérabilités activement exploitées : early warning sous 24h, notification détaillée sous 72h
- Suivi via la plateforme ENISA
- Full CRA (conformité technique, marquage CE, évaluation de conformité) → 11 décembre 2027
- Notre stack (3 repos, Next.js, Rust, infra as code) est concerné
- Notre avantage : transparence (repos publics) facilite la conformité (SBOM, documentation technique, gestion des CVEs)

**BIMI 2026 (adoption stats — DMARCguard Feb 2026)** :
- **30.4%** DMARC adoption (1,670,975 domains out of 5.5M scanned)
- **22.7%** DKIM adoption
- **33,924** unique valid BIMI records observed through mid-2024, ~3,450 with VMC
- **89.1%** inbox placement for fully authenticated domains (SPF+DKIM+DMARC) vs **44.2%** without
- **45pp** deliverability gap between authenticated and unauthenticated senders
- **83.1%** average inbox placement rate globally
- **16.9%** emails never reach inbox (spam, bounced, blocked)
- **Notre avantage** : stack DKIM native + BIMI validation (issue #53) = conformité intégrée + meilleure deliverabilité

**Email Deliverability 2026** :
- SPF valide : 94% des senders commerciaux
- DKIM valide : 91% des senders commerciaux
- DMARC publié : 75%+ des Fortune 500
- DMARC p=reject : 35% des Fortune 500
- Taux de spam < 0.3% requis (Google)
- One-click unsubscribe requis (List-Unsubscribe header)
- Notre stack native répond déjà à ces exigences

**Proton Scribe 2026 (mise à jour)** : l'assistant IA de Proton Mail est désormais inclus dans les plans Family et Duo (pas seulement Business). Disponible en 9 langues (anglais, français, allemand, espagnol, italien, portugais, russe, chinois, japonais). Fonctionne on-device ou sur les serveurs privés de Proton. Basé sur Mistral 7B, open source GPL-3.0. Fonctionnalités : Write for me, Proofread, Expand, Shorten. Coût : +$2.99/mois pour les business users. Notre différence : Hermes AI est intégré nativement (pas de supplément), fonctionne exclusivement on-device, et couvre plus de fonctionnalités (triage, résumés, chat, drafting).

**Proton 2026 (roadmap printemps/été)** :
- **Mail** : Category overview (auto-grouping emails), send/receive from other providers (Gmail) directly, extensive mobile search
- **Calendar** : Complete rewrite, offline mode, appointment booking pages, default calendar on Android
- **VPN** : New WireGuard codebase (faster, more reliable, censorship-resistant), Stealth protocol on Linux, personalized connection preferences on Windows
- **Pass** : autofill improvements (iFrame, URL matching), folder organization, SSH key support
- **Drive** : 5GB free (up from 2GB)
- **Lumo AI** : new AI assistant product

**Tuta 2026 (détail)** : Fast Sync 10x, nested labels, search amélioré, Tuta Drive open beta, inbox rules, schedule send et undo send déployés. **Nouveau 2026** : Tuta Mail et Calendar disponibles comme add-ons Thunderbird. Spam filters améliorés. Auto-save drafts. Badge counter iOS. Drag & drop nested folders. Leçon: la UX vitesse > E2EE pour le marché mainstream. L'expansion Thunderbird cible les users privacy-conscious.

**Basecamp 2026 (détail)** : Basecamp 5 — calendrier full-screen global + par projet, événements répétitifs, to-dos sur calendrier, menu unifié (SHIFT+J). Intégration email : projet = adresse email unique. Leçon: "email as task source" — notre route /calendar suit cette direction.

**Hey.com 2026** : email par Basecamp/37signals. 3 plans : HEY for You ($99/an), HEY for Work ($12/user/mois), HEY for Families ($179/an, 5 personnes). 30 jours d'essai gratuit. Features : screener (filtrage sender), privacy-first, no AI. Leçon : modèle "no free plan" + prix transparent. Notre différence : freemium + IA locale (Hermes). Hey cible les users anti-Gmail, prêts à payer pour la simplicité.

**eM Client 2026** : client desktop sérieux (macOS, Windows, iOS, Android). Free tier + payant. Local storage, chiffrement, email/calendar/tasks unifié. HIPAA compliant. Leçon : les clients desktop locaux restent pertinents pour les users privacy-conscious qui ne veulent pas de cloud. Notre différence : web PWA + IA locale (Hermes) = moderne vs desktop traditionnel.

**Email Security 2026 (synthèse)** :
- **AI phishing** : 80% des attaques social engineering utilisent l'IA (ENISA 2025). Taux de clic 54% (AI) vs 12% (humain). Coût moyen $4.8M/incident (IBM).
- **Deepfake** : +15% d'impersonations deepfake en 2026. Ciblent finance et HR.
- **Multi-channel** : 40% des campagnes phishing dépassent l'email (Slack, Teams, SMS, QR codes).
- **BEC** : FBI IC3 2025 — cyber-fraud = 85% des pertes ($17.7B, +29% YoY).
- **AI-generated campaigns** : 14x surge depuis décembre 2025. 56% des phishing détectés en décembre 2025 (vs 4% novembre).
- **Défense** : phishing-resistant auth (FIDO2), continuous human risk management, multi-channel simulation training.

**Post-Quantum Cryptography 2026** :
- **NIST FIPS 203/204/205** (août 2024) : ML-KEM (key encapsulation), ML-DSA (signatures), SLH-DSA. Déployables maintenant.
- **FN-DSA (Falcon)** : en cours de standardisation (signatures compactes).
- **HQC** : sélectionné mars 2025 comme backup code-based de ML-KEM.
- **CNSA 2.0** : migration commencé 2025. Classical algorithms interdits d'ici 2035.
- **Menace** : "harvest now, decrypt later" — messages capturés aujourd'hui seront déchiffrés par ordinateur quantique (~15 ans).
- **Pour misfits.ai** : issue #522 (Kyber+Dilithium) validée. Notre E2E encryption doit être quantum-resistant d'ici 2030.

**GDPR Enforcement 2026** :
- **2,500+ fines** totales depuis 2018, >7B€ cumulés. ~1.2B€ en 2025 seul.
- **Top fines 2026** : Free Mobile €42M (sécurité insuffisante), Reddit £14.5M (données enfants), IQVIA €5M (données santé).
- **Google** : €325M (CNIL) — ads dans Gmail sans consentement + consentement invalide.
- **ePrivacy** : tracking pixels dans emails = consentement requis (Italie).
- **Tendance** : enforcement ↑, average fine ~€2.4M. Email marketing violations = top 3 causes.
- **Pour misfits.ai** : notre approche privacy-first (pas de tracking, pas de pub) = risque minimal. Issue #514 (export RGPD) critique.

**Mimestream 2026** : client macOS natif Gmail. Alternatives : Spark Mail (cross-platform, free tier, smart inbox), Superhuman (premium, Outlook support), Shortwave (Gmail + AI search/summaries), Apple Mail (native, gratuit). Leçon : les clients Gmail natifs sont en déclin (Notion Mail shutdown, Google tue les clients tiers via API restrictions). Notre approche (web PWA souveraine) est à l'abri de ces changements d'API.

**Gmail/Yahoo Sender Requirements 2026** :
- **Bulk sender threshold** : 5,000+ emails/jour vers Gmail/Yahoo
- **Authentication** : SPF + DKIM + DMARC obligatoires. DMARC policy minimum `p=none`, alignment requis.
- **Spam rate** : <0.10% (ne doit jamais atteindre 0.30%)
- **Unsubscribe** : one-click unsubscribe (RFC 8058) obligatoire pour marketing
- **Infrastructure** : PTR records valides, TLS encryption, RFC 5322 compliance
- **Apple** : devrait formaliser les exigences 2026-2027
- **Pour misfits.ai** : notre stack email (SPF/DKIM/DMARC natif) est déjà conforme. Issue #540 (spam rate monitoring) critique pour maintenir <0.3%.

**Email Marketing Trends 2026** :
- **Privacy-proofing** : shift from open rates to privacy-proof metrics (Apple MPP, AI pre-filtering).
- **AI inboxes** : Gmail/Outlook AI categorization evaluates emails against privacy/trust signals. Failed checks = no human reach.
- **Zero-party data** : transparent data collection, double-opt-in, EU server locations.
- **New KPIs** : engagement > open rates. Click-through, reply time, conversion.
- **Tracking pixels** = cookies under GDPR/ePrivacy. Require prior consent (CNIL €90K fine example).
- **Pour misfits.ai** : notre approche (pas de tracking, pas de pub, privacy-first) est alignée. Newsletter features (#507) doivent inclure double-opt-in et consentement explicite.

**EU Digital Identity Wallet (EUDI Wallet) 2026** :
- **eIDAS 2.0** : règlement (UE) 2024/1183 en vigueur. Deadline décembre 2026 pour tous les États membres.
- **Fonctionnalités** : preuve d'identité, partage de documents officiels, signatures électroniques, accès services publics/privés.
- **Privacy** : zero-knowledge proofs (prouver >18 ans sans révéler date de naissance), authentification biométrique, chiffrement.
- **Interopérable** : fonctionne dans les 27 pays UE. Offline-capable pour certaines fonctions.
- **Pour misfits.ai** : opportunité d'intégration pour l'authentification des utilisateurs européens. Pourrait remplir/compléter le login email traditionnel.

**StartMail 2026** : email privacy-first, Pays-Bas. $2.50-4.99/mois. Unlimited aliases, PGP encryption, zero-access storage, no tracking, anonymous crypto payments. 20GB storage. 7-day free trial. Leçon : les providers privacy-first avec aliases illimités sont la norme 2026. Notre différence : freemium + IA locale (Hermes) + stack email souveraine.

**Mailfence 2026** : email privacy-first, Belgique (UE). €3.50/user/mois. E2EE, zero-access architecture, open-source, independently audited. 5-50GB/user. GDPR compliant. Leçon : les providers européens (Belgique, Pays-Bas, Suisse) dominent le segment privacy-first. Notre différence : IA locale (Hermes) + intégration email/calendar/tasks unifiée.

**Shortwave 2026** : client Gmail-first avec IA native. $18-120/user/mois. AI search, bundles, Ghostwriter, semantic search, summarization. Gmail-only (pas Outlook). Leçon : l'IA native dans les clients email est la tendance 2026. Notre différence : IA locale (Hermes) + web PWA souveraine (pas dépendance Gmail API).

**MTA-STS/TLS-RPT 2026** :
- **MTA-STS** (RFC 8461) : force le chiffrement TLS pour le transit email. Adoption significative en 2026.
- **TLS-RPT** : rapports de livraison TLS. Permet d'identifier les échecs de chiffrement.
- **US adoption** : 98.3% des domaines US exposés (pas de MTA-STS). Vulnérabilité aux downgrade attacks.
- **CISA Binding Operational Directives** : DMARC mandatory pour US federal agencies. MTA-STS recommandé.
- **Bonnes pratiques 2026** : SPF `~all` (pas `-all`) pour éviter les faux positifs. MTA-STS policy + TLS-RPT reporting.
- **Pour misfits.ai** : notre stack email doit inclure MTA-STS et TLS-RPT pour la conformité et la sécurité.

**Posteo 2026** : email privacy-first, Allemagne. €1/mois flat rate. 2GB storage (extensible). PGP encryption, zero tracking, anonymous payment, green energy. GDPR compliant. Leçon : le modèle "flat rate €1" est disruptif. Notre différence : freemium + IA locale (Hermes) + stack email souveraine.

**Mailbird 2026** : client desktop email (Windows, Mac). $4.03/user/mois. ChatGPT-based email authoring, unified inbox, multi-account, templates, pixel-tracker blocking. Leçon : les clients desktop intègrent l'IA (ChatGPT, etc.). Notre différence : IA locale (Hermes) + web PWA (pas desktop-only).

**Fyxer 2026** : IA email pour Gmail/Outlook. $22.50-50/user/mois. Inbox triage, tone-matched drafts, meeting notes. Leçon : l'IA autonome pour l'email est la tendance 2026. Notre différence : IA locale (Hermes) + web PWA souveraine.

**Transactional Email APIs 2026** :
- **Resend** : best developer experience. Free 3,000/mo, paid from $20/mo.
- **Postmark** : best transactional deliverability. From $15/mo. Separate message streams.
- **Amazon SES** : cheapest at volume. ~$0.10 per 1,000 emails.
- **Mailgun** : established, high volume. Foundation from $35/mo for 50,000.
- **Brevo** : marketing + transactional combined. Free 300/day.
- **Deliverability ranking** : Postmark 83.3% inbox, Mailtrap 78.8%, Amazon SES 77.1%, Mailgun 71.4%, SendGrid 61.0%.
- **Pour misfits.ai** : notre stack email souveraine (Rust/Actix-web) est l'alternative self-hosted à ces APIs cloud. Avantage = contrôle total des données.

**Email Workflow Automation 2026** :
- **Agentic AI workflows** : AI agents plan, trigger, and complete workflow steps with minimal manual input.
- **Hyperautomation** : AI + RPA + workflow automation + analytics combined.
- **Email as programmable surface** : agents create identities, exchange messages, preserve context, trigger downstream work.
- **State machine model** : routing deterministic, handoffs observable, duplicate sends blocked, audits possible.
- **Pour misfits.ai** : notre stack email souveraine + IA locale (Hermes) = position unique pour l'automation email privacy-first.

**Email Alias Services 2026** :
- **SimpleLogin** : acquis par Proton. 10 aliases gratuites, $35/an premium. Intégration Proton Mail. Open source.
- **Addy.io (AnonAddy)** : indépendant. Illimité gratuit, $12/an premium. Self-hostable. Open source.
- **Firefox Relay** : 5 aliases gratuites, $0.99/mois premium. Intégration Firefox.
- **DuckDuckGo Email** : illimité gratuit. Pas de domaine custom.
- **Fonctionnement** : alias → forwarding → inbox réelle. Reverse aliases pour répondre sans exposer l'adresse réelle.
- **Pour misfits.ai** : notre gestionnaire d'aliases (issue #516) doit inclure reverse aliases, custom domains, et intégration avec notre stack email souveraine.

**Green Email Hosting 2026** :
- **Infomaniak** (Suisse) : data centers renouvelables propres. Héberge Proton Mail.
- **Google Cloud** : 100% énergie renouvelable depuis 2017. Objectif 24/7 carbone-free d'ici 2030.
- **GreenGeeks** : 300% renouvelable via RECs. Vérifié Green Web Foundation.
- **Krystal** (UK) : 100% renouvelable. Vérifié Green Web Foundation.
- **DreamHost** : carbone neutre via offsets.
- **Pour misfits.ai** : notre hébergement sur Scaleway (FR) = avantage carbone. Le "green badge" 100% renouvelable est un différenciateur marque fort.

**AI Email Features 2026 (summarization, smart reply)** :
- **Superhuman** : Write with AI, Instant Reply, Auto Summarize, Auto Drafts, Ask AI.
- **Gemini in Gmail** : "Help me write", summary suggestions, smart reply, scheduling. Inclus dans Workspace.
- **Shortwave** : Ghostwriter (drafts in your voice), Smart Bundles, AI search.
- **Mailbutler** : Smart Assistant (GPT-4o). Summaries on demand, task extraction, tone adjustment.
- **MCP integrations** : permettent à l'IA de tirer données du CRM, billing, project docs pour des réponses contextuelles.
- **Pour misfits.ai** : notre IA locale (Hermes) doit inclure summarization, smart reply, et intégration MCP pour données contextuelles.

**Secure Messaging Integration 2026** :
- **Signal** : E2EE par défaut, métadonnées minimales, open source (client + server). Protocole Signal.
- **WhatsApp** : E2EE par défaut (Protocole Signal), mais métadonnées étendues (Meta). Meta AI non E2EE.
- **Telegram** : E2EE uniquement en "Secret Chats". Métadonnées étendues.
- **Tendances** : intégration messaging + email (Basecamp, Notion Mail). Les frontières email/messaging s'estompent.
- **Pour misfits.ai** : opportunité d'intégration messaging sécurisé (Signal/WhatsApp) pour la communication client.

**Calendar Integration 2026** :
- **Calendly** : booking links, Outlook/Google sync, Teams/Zoom, round-robin, Salesforce/HubSpot.
- **Microsoft Bookings** : inclus Microsoft 365. Booking pages, Teams, Outlook sync.
- **Nylas Calendar API** : universal calendar (Google/Microsoft/Apple). AI Agent Accounts pour scheduling autonome.
- **Trend** : email + calendar + scheduling = workflow unifié. Les frontières s'estompent.
- **Pour misfits.ai** : notre route /calendar (issue #526) doit intégrer booking links, sync CalDAV, et scheduling autonome via Hermes AI.

**GDPR Data Residency 2026** :
- **Données personnelles email** : adresses, noms, IP, cookies, device IDs, behavioral tracking, open/click data.
- **Droits individuels** : accès, rectification, effacement (right to erasure), portabilité, restriction, objection. Délai 30 jours.
- **Data residency EU** : Twilio SendGrid propose EU data residency. Données stockées/traitées dans l'UE.
- **MCP + GDPR** : data minimization, zero-retention infrastructure, contrôle explicite des données vues par l'IA.
- **Pour misfits.ai** : notre stack email souveraine (Scaleway FR) = avantage data residency EU natif. Issue #514 (export RGPD) critique.

**BIMI/VMC 2026** :
- **BIMI** : logo visible dans l'email. Nécessite SPF + DKIM + DMARC (p=quarantine/reject, pct=100) + certificat VMC/CMC.
- **VMC** : certificat marque vérifiée. Requiert une marque déposée. Gmail blue checkmark + Apple Mail.
- **CMC** : certificat marque commune. Pas de marque requise, mais 12 mois d'utilisation du logo. Gmail uniquement.
- **Taux d'affichage BIMI** : 53.6% des BIMI publiés (2025). Red Sift Radar accélère la résolution des problèmes 10x.
- **Pour misfits.ai** : issue #523 (BIMI brand logo) validée. Notre stack DKIM native = avantage pour BIMI.

**Reclaim.ai 2026** : AI scheduling + calendar. $10-22/seat/mois. Focus Time, Smart Meetings, scheduling links, habits, task integrations. Leçon : l'IA pour la productivité calendar/scheduling est un segment distinct. Notre différence : IA locale (Hermes) + web PWA souveraine.

**AI Email Writing Assistants 2026** :
- **Agentys** : batch drafting automatique. Apprend votre voix par contact (90 jours d'historique). Rédaction automatique des réponses routine. $16.99/mois.
- **Superhuman** : Write with AI, Instant Reply, Auto Summarize. $300/an. Keyboard-first, sub-100ms.
- **Spark** : AI Assistant (emails, attachments, calendar, meeting notes). $99-199/an.
- **MailMaestro** : AI drafting pour Outlook/entreprise. $12/seat/mois.
- **Serif** : triage, draft generation, semantic search, sentiment analysis.
- **Pour misfits.ai** : notre IA locale (Hermes) doit inclure drafting intelligent, triage, et apprentissage de la voix utilisateur.

**Email Privacy Laws 2026 (synthèse réglementaire)** :
- **GDPR** : opt-in explicite, base légale, droits accès/suppression/portabilité. Amendes jusqu'à 4% CA.
- **ePrivacy** : consentement pour tracking (pixels, cookies). Italie = pixels = cookies.
- **CAN-SPAM** : opt-out, adresse physique, header valide. Amendes $51,744/email.
- **CCPA/CPRA** : opt-out, droit de suppression, transparence.
- **CASL** (Canada) : consentement explicite, pénalités jusqu'à $10M.
- **LGPD** (Brésil) : similaire GDPR.
- **8 nouvelles lois US** (2025) : state privacy laws avec exigences email spécifiques.
- **Pour misfits.ai** : notre approche privacy-first (pas de tracking, pas de pub) = conforme par design.

**AI Email Agents 2026 (autonomous inbox)** :
- **AgentMail** : inbox as primitive. API provisioning, auto-threading, WebSockets, multi-tenancy via Pods.
- **OpenClaw** : self-hosted, privacy-first. Inbox zero via Telegram/WhatsApp/Slack. Natural language commands.
- **Fyxer/Serif/Carly/Lindy** : autonomous triage, draft, route, meeting notes.
- **Gmelius/DragApp/Missive/Front** : team inboxes with AI drafting.
- **Superhuman/Shortwave/Spark/Mimestream** : faster client experience + AI.
- **Pour misfits.ai** : notre IA locale (Hermes) = position unique. Self-hosted + privacy-first + autonomous agent.

**FiloMail 2026** : AI email + to-do. Gmail/Outlook/IMAP. Free tier generous (AI summaries, to-do extraction, smart labels, AI drafts, natural language search). Gmail-only limitation. Leçon : les clients email + task management intégrés sont une tendance 2026. Notre différence : IA locale (Hermes) + web PWA souveraine.

**On-Device AI 2026 (local LLM, privacy)** :
- **Canary Mail** : AI on-device (résumé, priorisation). Données ne quittent pas l'appareil. PGP + HIPAA/GDPR.
- **Proton Mail + Scribe** : zero-access E2EE, Swiss jurisdiction. Local AI optionnelle.
- **Apple Intelligence** : traitement local pour requêtes simples, Private Cloud Compute pour complexes.
- **alfred_** : AES-256, OAuth 2.0, ne entraîne pas sur vos données. Row-level security.
- **Tendances** : local inference 18x moins cher que cloud. Privacy regulations (GDPR, LGPD, Law 25) = enforcement réel.
- **Pour misfits.ai** : notre IA locale (Hermes) = position unique. "The AI that reads your inbox, but never leaks it."

**Open Source Email Clients 2026** :
- **Thunderbird** : most established open source client. Free, Windows/Mac/Linux. Multiple accounts, filters, calendar, encryption. "Supernova" redesign (v115) improved UI. Monthly feature releases + annual ESR.
- **Evolution** : full groupware (email/calendar/contacts/tasks). Exchange/ActiveSync support. Best for Microsoft 365 on Linux.
- **KMail** : KDE Plasma integrated.
- **Claws Mail** : lightweight, fast on old hardware.
- **Betterbird** : Thunderbird fork for power users.
- **Leçon** : les clients open source restent pertinents pour les users privacy-conscious. Notre différence : web PWA + IA locale (Hermes) + stack email souveraine.

**Missive 2026** : team email collaboration. $14-36/user/mois. Shared inbox, internal chat-in-thread, SMS/social accounts, tasks, integrations. Leçon : la collaboration email en équipe est un segment distinct. Notre différence : web PWA souveraine + IA locale (Hermes).

**Front 2026** : customer operations platform. $19-59/seat/mois. Shared inbox, email/chat/SMS/voice, workflow automation, 100+ integrations, AI capabilities. Leçon : les plateformes customer ops (email + chat + SMS) sont en croissance. Notre différence : web PWA souveraine + IA locale (Hermes).

**Hiver 2026** : shared inbox inside Gmail. Free plan available. Paid $25-95/user/mois. Email assignment, automation, AI Copilot, SLA tracking, multi-channel. Leçon : les outils de shared inbox dans Gmail sont populaires pour les équipes support. Notre différence : web PWA souveraine + IA locale (Hermes).

**Email Accessibility 2026 (WCAG)** :
- **WCAG 2.2** : standard actuel. 3 niveaux : A (minimum), AA (recommandé), AAA (haut).
- **US/ADA, EU/EEA, CA/ACA** : conformité légale requise.
- **Critères clés** : contraste couleur ≥4.5:1, texte alternatif images, structure logique (headings), liens descriptifs, pas de texte dans images, contenu zoomable 400%.
- **Pour misfits.ai** : notre web PWA doit être conforme WCAG 2.2 AA. Critique pour l'accessibilité et la conformité légale.

**Email Design Trends 2026** :
- **Dark mode** : standard 2026, pas optionnel. Optimisation mobile-first obligatoire.
- **Mobile-first** : 60-70% des emails ouverts sur mobile. Layouts single-column.
- **Accessibilité** : contraste, alt text, structure logique, boutons tactiles (44x44px min).
- **Minimalisme** : structures simplifiées, un CTA principal, typographie bold.
- **Motion** : animations légères pour guider l'attention, pas pour le spectacle.
- **Pour misfits.ai** : notre web PWA doit intégrer dark mode, mobile-first, et accessibilité dès le design.

**Zero Trust Architecture (ZTA) 2026** :
- **Principe** : "never trust, always verify". Chaque requête d'accès est vérifiée (identité, device, location, comportement).
- **Avantages** : détection menaces ↓50%, surface attaque ↓50-80%, accès non autorisés ↓75-95%.
- **Pour email** : vérification continue des identités, permissions limitées par défaut, détection anomalies de session.
- **Pour misfits.ai** : notre stack email souveraine + IA locale (Hermes) = position unique pour implémenter ZTA.

**NIS2/DORA 2026** :
- **NIS2** (Directive UE 2022/2555) : cybersécurité horizontale, 18 secteurs. Transposition nationale terminée (sauf quelques États). Premiers audits juin 2026.
- **DORA** (Règlement UE 2022/2554) : résilience opérationnelle numérique, secteur financier uniquement.
- **Exigences email** : NIS2 Art.21 = chiffrement + authentification state-of-the-art. DORA RTS = spécifications techniques détaillées.
- **Incident reporting** : 24h (alerte précoce), 72h (rapport détaillé), 30h (rapport final).
- **Sanctions** : €10M ou 2% CA (NIS2), 2% CA + €1M amendes personnelles (DORA).
- **Pour misfits.ai** : issue #513 (NIS2/DORA compliance) critique. Notre stack email souveraine = avantage pour la conformité.

**AI Agents for Email 2026** :
- **AgentMail** : email API for AI agents. Inbox as identity, real-time webhooks, auto-threading, MCP support.
- **Fyxer/Serif/Carly/Lindy** : autonomous email agents (triage, draft, route, meeting notes).
- **Superhuman/Missive/Shortwave** : native AI in email clients (draft, summarize, search).
- **SaneBox** : server-level filtering before inbox.
- **Microsoft Copilot/Google Gemini** : AI baked into email provider.
- **Pour misfits.ai** : notre IA locale (Hermes) = position unique. Avantage = privacy (on-device) vs cloud AI.

**MCP (Model Context Protocol) 2026** :
- **Standard** : protocole ouvert (Anthropic) pour connecter IA → outils externes (email, calendar, CRM).
- **Fonctionnalités** : ressources, prompts, tools (serveur) + sampling, roots, elicitation (client).
- **Transports** : stdio + Streamable HTTP. HTTP+SSE déprécié.
- **Adoption** : eM Client 11 ajoute MCP. Missive supporte MCP (Notion, Linear, Attio, Stripe).
- **Pour misfits.ai** : opportunité d'intégrer MCP pour connecter Hermes AI à d'autres outils.

**SaneBox 2026** : AI email filtering. $7-36/mois. Header-based processing (pas de lecture du corps). SaneLater, SaneBlackHole, SaneReminders, custom folders. Leçon : le filtrage AI passif est un segment distinct. Notre différence : IA locale (Hermes) + web PWA souveraine.

**Clean Email 2026** : bulk inbox cleanup. $9.99/mois. Unsubscriber, Auto Clean rules, bulk actions, categorization. Leçon : le nettoyage d'email en masse est un segment distinct. Notre différence : IA locale (Hermes) + web PWA souveraine.

**Kolab Now 2026** : email privacy-first, Suisse. CHF 4.41-9.90/mois. 2-5GB storage. Email/calendar/contacts/tasks/notes/files/video. Open source (Kolab Groupware). Swiss jurisdiction. Leçon : les providers suisses (comme Proton) dominent le segment privacy-first. Notre différence : IA locale (Hermes) + web PWA souveraine.

**Email Market Trends 2026 (synthèse)** :
- **AI-driven marketing** : +13% click-through rates, +41% revenue vs non-AI campaigns.
- **Privacy-first** : GDPR evolution, CCPA/CPRA maturation, new regional laws. Privacy software market: $5.37B (2026) → $45.13B (2032), 35.5% CAGR.
- **Open rates unreliable** : Apple Mail Privacy Protection, image pre-loading. Shift to click-through, conversion, revenue metrics.
- **Zero-party data** : 77% consumers share email for personalized experiences. 73% satisfaction from AI personalization.
- **Omnichannel** : email + SMS + WhatsApp + push outperforms single-channel.
- **Authentication** : stricter requirements (SPF/DKIM/DMARC/MTA-STS) critical for deliverability.
- **Pour misfits.ai** : notre approche privacy-first + IA locale = aligné avec les tendances 2026.

**Email Encryption 2026 (E2EE/PGP)** :
- **E2EE standards** : PGP (open source, universel) vs S/MIME (entreprises). Tuta utilise chiffrement propriétaire (AES 256/RSA 2048).
- **Proton Mail** : PGP + zero-access + Swiss jurisdiction. Lancement post-quantique en 2026.
- **Tuta** : chiffrement propriétaire, sujets chiffrés, open source, Allemagne.
- **Mailfence** : PGP + S/MIME, Belgique.
- **Métadonnées** : E2EE ne protège pas les métadonnées (sender, recipient, timestamp, sujet PGP). Combiner avec Tor + aliases.
- **Pour misfits.ai** : notre E2E encryption (issue #522) doit intégrer PGP pour l'interopérabilité + post-quantique d'ici 2030.

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

**SMTP security 2026 (MTA-STS/DANE/TLS-RPT)** :
- DMARCguard Feb 2026 scan (5.5M domains) : MTA-STS 0.3% (15,997), DANE 0.0% (30) — MTA-STS leads by 533x
- US adoption (PowerDMARC 2026) : MTA-STS 1.7%, DNSSEC 18.0%, DMARC 95.8%, p=reject 49.0%
- Microsoft 365 now supports both MTA-STS and DANE per connector
- Best practice: deploy MTA-STS first for compatibility, then add DANE where DNSSEC is available
- TLS-RPT (RFC 8460) is the feedback mechanism for both — JSON reports on TLS failures
- Phased deployment recommended: testing mode first, then enforce
- **Pour misfits.ai** : issue #537 (SMTP security hardening) covers STARTTLS, DANE, MTA-STS. Low adoption globally but NIS2/CRA may accelerate it.

**Fastmail 2026 (vérification)** : stabilité des prix (Basic $3/mo, Standard $5/mo, Pro $9/mo). ~1000 masked aliases, JMAP natif, calendar sync. Pas de nouveautés majeures. Leur positionnement "privacy sans E2EE" vs notre "E2EE + IA locale".

**HEY 2026 (mise à jour)** : le service de Basecamp reste à $99/an (personal) et $12/user/mo (custom domain). Le screener (filtrage des nouveaux expéditeurs) et le blocage des tracking pixels sont toujours leurs différenciateurs. Basecamp 5 (2026) confirme l'intégration calendrier-email. Leçon : l'email "opinionated" est un marché de niche — notre approche est moins radicale (compatible IMAP/SMTP).

**Email migration tools 2026** : Google Data Migration Service permet l'import depuis IMAP, Gmail, Outlook. Besoin d'un wizard d'import pour les utilisateurs qui migrent vers misfits.ai (issue #549).

**IA email 2026 (tendance agentic)** :
- Le marché passe du "chatbot IA" à l'"agent autonome" qui agit sans intervention humaine
- **OpenClaw** : agent open-source qui agit via WhatsApp/Slack, gère emails et commandes système. Workflows entièrement autonomes.
- **SaneBox** ($7/mois) : filtrage IA sans changer de client. SaneBlackHole, digest summaries.
- **Shortwave** (free, puis $7/mois) : recherche IA native, summaries, grouped inbox. Gmail uniquement.
- **Superhuman** ($30/mois) : triage IA, auto-drafting, instant replies.
- Tendance clé : **Agentic AI > Chatbot UI**, **Proactif > Réactif**
- **Pour misfits.ai** : notre approche (IA locale Hermes AI + intégration email/calendar/contacts/newsletters) est alignée sur cette tendance. L'avantage privacy (IA on-device) est un différenciateur fort face aux solutions cloud.

**Shortwave 2026 (détail)** : client AI-native pour Gmail uniquement. $18/mo (Pro), $30/mo (Business), $45/mo (Premier), $120/mo (Max). AI search sémantique (décrire plutôt que mots-clés), bundling, thread summarization. Avantage = AI native + vitesse. Inconvénient = Gmail uniquement, cloud AI, pas de free plan permanent. Leçon: la recherche sémantique est un différenciateur — notre recherche instantanée (MW-011) doit viser la même expérience.

**Gmail 2026 (Gemini era)** : Google intègre massivement l'IA Gemini dans Gmail. "AI Overviews" résument les threads d'emails et répondent en langage naturel. "AI Inbox" priorise les messages importants. Gmail Live (IA conversationnelle, commande vocale) lancé à Google I/O 2026. Aide à la rédaction (Help Me Write, Suggested Replies, Proofread). Impact majeur : Gmail devient un "gatekeeper" IA qui interprète les messages avant l'utilisateur. Conséquence pour les senders : nouvelle couche de filtrage sémantique au-delà du spam traditionnel. Notre angle (privacy, pas de lecture IA centralisée) est un différenciateur fort face à Gmail.

**Spike 2026 (détail)** : email en style chat (bulles de message). $5/mo (Pro), $35/mo (AI agents). Unified inbox, team collaboration, video calls, AI writing. Avantage = UX moderne, chat naturel. Inconvénient = gimmicky UI (pour certains), pas d'IA autonome, prix élevé pour équipes. Leçon : l'email conversationnel est une tendance UX — notre "chat mail" (misfits.ai) est pionnière sur ce positionnement.

**Canary Mail 2026** : client email privacy-first avec E2EE, AI locale (pas de cloud). $3/mo (Pro). Features : encryption, AI drafting/summarization, read receipts, unified inbox. Avantage = privacy + sécurité. Inconvénient = prix, moins de features collaboratives. Alternative à Spark pour les users privacy-conscious.

**JMAP 2026** : protocole moderne développé par Fastmail. Adoption third-party encore thin (la plupart des clients utilisent IMAP). Fastmail uses JMAP end-to-end. JMAP push webhooks disponibles pour clients tiers. eM Client a JMAP sur sa roadmap 2026 (desktop/Android). Nouveau client Swift natif "Plume" implémente push iOS via JMAP. Avantage = vitesse, synchronisation temps réel. Inconvénient = adoption limitée hors Fastmail. **Pour misfits.ai** : issue #501 (JMAP server support) — pertinente pour l'interopérabilité future.

**Missive 2026 (détail)** : team inbox + shared inboxes + internal chat + AI drafting. $14/mo (Starter), $24/mo (Productive, AI features), $36/mo (Business). AI via Missive credits (BYOK support). Free plan for teams up to 3. Avantage = collaboration + AI intégrés. Inconvénient = AI credits en sus, reporting limité. Leçon : l'email team avec AI intégrée est un positionnement fort — notre "chat mail" + IA locale peut viser le même marché mais avec la privacy en plus.

**Drag 2026** : alternative à Missive. $12/$18 (AI inclus)/$24. Shared inbox avec Kanban board. AI included (pas de crédits en sus). Positionnement similaire à Missive mais moins cher.

**SaneBox 2026** : inbox filtering sans changer de client email. Alternative légère.

**Spark 2026 (mise à jour)** : client email moderne, AI drafting, Smart Inbox. Free plan disponible (1 compte, AI limitée). Plus $8.25/mois (annuel), Pro $16.58/mois (annuel). AI features : Compose, Rephrase, Translate, AI Assistant, meeting notes. Server-side processing (pas privacy-focused). Bon pour les équipes, moins puissant que Superhuman/Shortwave en IA. Positionnement "collaboration" plutôt que "IA power".

**Front 2026** : support inbox + AI automations. $29/seat/mo. Alternative orientée support client.

**Mailbird 2026** : client email multi-comptes, unified inbox, cross-account search. Free (1 compte), Premium $4/mo (annuel) ou $99.75 one-time. Windows + Mac (depuis oct 2024). Avantage = multi-comptes illimités, rapide, local storage. Inconvénient = pas de mobile, pas d'IA avancée. Leçon : le multi-compte natif est un besoin marché — notre arbitrage "one inbox" (multi-comptes natif) est validé.

**Superhuman 2026 (mise à jour)** :
- **Mail uniquement** : Starter $25/mois (annuel), Business $33/mois (annuel) — baisse de prix vs précédent ($30→$25, $40→$33)
- **Suite** (Mail + Grammarly + Docs + Go) : Free, Pro $30/mois, Business $40/mois
- IA email incluse dès le nouveau tier (Write with AI, Instant Reply, Auto Summarize, Auto Labels, Ask AI, Auto Drafts)
- **Nouveau** : Superhuman MCP (Model Context Protocol), Voice and Tone Match, Knowledge Base, Custom Auto Labels with AI
- 100+ keyboard shortcuts, Split Inbox, speed = latence quasi-nulle
- Nonprofit/education pricing dispo ($10-15/mois, sur demande)
- Avantage = vitesse + productivité. Inconvénient = cloud IA (données envoyées), Gmail/Outlook uniquement, prix élevé.
- Leçon : la vitesse et le keyboard-first sont des différenciateurs — notre stack Rust/Next.js doit viser la même réactivité.

**Mimestream 2026** : Gmail natif macOS, $4.99/mo. Alternative rapide à Superhuman.

**Fyxer AI 2026** : drafts automatiques, meeting notes, scheduling. Agent IA autonome pour l'email.

---

### Cycle 2026-09-09

- **Proton 2026**: réécriture mobile Rust, Gmail integration, Category View, SimpleLogin intégrée.

*Fichier maintenu par le PO. Prochain cycle : explorer les offres Fastmail en détail, arbitrer sur le modèle freemium.*
