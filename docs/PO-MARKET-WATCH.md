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
| **CRA** (Cyber Resilience Act, 2026) | Produits numériques EU | Reporting vulnérabilités, 24h escalation |

### Focus NIS2 / DORA 2026 (nouveau)
- **NIS2** est maintenant pleinement appliqué (oct 2024 → oct 2026 pour la conformité). Les entreprises d'infrastructure digitale (dont les providers email) sont concernées. Obligations: incident reporting sous 24h, audits supply chain, responsabilité du management.
- **DORA** (financial services): les pénalités vont jusqu'à 2% du CA annuel mondial. Même si misfits.ai n'est pas une entité financière, nos clients B2B (banques, fintech) peuvent exiger la conformité DORA comme critère de choix.
- **CRA** (Cyber Resilience Act, sep 2026): nouveau reporting de vulnérabilités, coordination avec NIS2. Impacte directement le dev (gestion des CVEs, patch management).
- **Notre avantage**: Scaleway (hébergement) est déjà conforme NIS2/DORA. Notre stack DKIM native + privacy-by-design est un différenciateur.

### SMTP/Deliverability
- **SPF + DKIM + DMARC** = minimum vital en 2026 (66.2% des senders les utilisent)
- **53.8%** ont un DMARC policy, mais beaucoup en `p=none` (non-enforcing)
- **25% des senders** ne savent pas s'ils sont authentifiés → risque de spam folder
- Tendance: les inbox providers (Google, Yahoo) durcissent les règles d'authentification

### Implication misfits.ai
> Notre stack native DKIM/SPF/DMARC est un **avantage compétitif majeur** face aux solutions SaaS qui dépendent de relais tiers. La conformité privacy-by-design (pas de data mining, pas de tracking pixels) répond aux exigences 2026. L'hébergement Scaleway (conforme NIS2/DORA) renforce notre posture B2B.

---

## 2. Analyse Compétiteurs (2026)

### Évolution du marché 2026
- **Proton Scribe** (IA locale, Mistral 7B) = confirmation que l'IA privacy-first est un différenciateur
- **Superhuman** (racheté par Grammarly, juin 2025) = IA cloud pour le triage, mais données envoyées au cloud
- **Notion Mail** = IA cloud (intégration Notion), uniquement Gmail, pas de privacy
- **Tuta** = refuse l'IA cloud catégoriquement
- **misfits.ai** = **IA locale exclusivement (Hermes AI)**, triage, résumé, chat, drafting — "The AI that reads your inbox, but never leaks it"

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
| **Undo send** | À implémenter | **Oui** | Non | **Oui** | Non |
| **Templates** | À implémenter | Non | **Oui** | **Oui** | Non |
| **Offline search** | À implémenter | **Oui (Rust engine 2026)** | Non | Non | Non |
| **Gmail integration** | À implémenter | **Oui (send/receive)** | Non | Non | Non |
| **Conversation view** | À implémenter | Non | **Oui (2026)** | **Oui** | **Oui** |
| **Mobile Rust engine** | N/A | **Oui (2026)** | Non | Non | Non |
| **Énergie** | À définir | Standard | **100% renouvelable** | Standard | Standard |
| **Prix entrée** | Freemium (à définir) | €3/mo (15GB) | €3/mo (20GB) | $3/mo | $99/an |

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

5. **Modèle freemium**
   - Choix: **Freemium classique (storage limité + features payants), pub UNIQUEMENT comme option opt-in "supporter" (jamais par défaut)**
   - Rationale: la marque misfits = anti-pub intrusive. Un modèle donation-only ne scale pas pour un mail provider (coûts infra). Le freemium classique respecte la vision (pas de tracking, pas de data mining) tout en finançant l'infra.
   - Détail proposé:
     - Free: 5GB storage, aliases limités (10), pas de custom domain
     - Pro ($5/mo): 50GB storage, custom domain, aliases illimités, scheduled send, templates, BIMI
     - Business ($10/mo): tout Pro + shared calendars, SSO, audit logs, SLA
   - Risque: le free tier peut attirer des spam. Mitigation: KYC light (phone verify) + rate limiting.

6. **Open source — nouveau arbitrage**
   - Choix: **3 repos publics (frontend, backend DKIM, infra as code), documentation ouverte, mais pas de self-hosted "gratuit"**
   - Rationale: la transparence est un avantage compétitif (vs Hey/Basecamp qui sont 100% closed), mais l'auto-hébergement gratuit ne génère pas de revenu. Le modèle "open core" (code visible, hosted payant) est le bon équilibre.

7. **Énergie / green**
   - Choix: **Hébergement 100% renouvelable (Scaleway avec compensation carbone), badge "green email" dans l'UI**
   - Rationale: Tuta le fait (100% renouvelable), c'est un différenciateur pour la Gen Z / entreprises ESG.

10. **IA email locale**
    - Choix: **IA locale exclusivement (Hermes AI on-device), pas de cloud AI pour les données email**
    - Rationale: Proton Scribe (lancé 2024, basé sur Mistral 7B) fait le même choix — exécution locale, zero-knowledge. Tuta refuse catégoriquement l'AI cloud. La tendance 2026 est à l'IA privacy-first. Notre avantage: Hermes AI est déjà intégré (chat mail, triage, résumés). Pas de données qui quittent le device pour l'IA.
    - Positionnement vs concurrence:
      - Proton Scribe: IA locale, mais uniquement pour la composition (pas de triage/résumé)
      - Superhuman: IA cloud (Gmail/Outlook data envoyée au cloud) — mauvais pour la privacy
      - Notion Mail: IA cloud (Notion data) — mauvais pour la privacy
      - Tuta: pas d'IA du tout — manque d'innovation
    - Notre angle: **"The AI that reads your inbox, but never leaks it"** — IA locale, triage, résumé, chat, drafting, tout en restant sur le device de l'utilisateur.

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
| MW-2026-008 | User ouvre un thread d'emails | Emails groupés par conversation, possibilité de supprimer/archiver en bloc | ❌ (feature à implémenter) |
| MW-2026-009 | User consulte la conversation view | Affichage groupé par thread, tri chronologique, indicateur "X messages" | ❌ (standard marché 2026, implémentation prioritaire) |
| MW-2026-010 | User génère un masked email alias | Alias créé (format: xxxxx@misfits.ai), emails forwardés vers inbox principale, possibilité de désactiver | ❌ (feature à implémenter — différence avec Fastmail qui a ~1000 aliases) |
| MW-2026-011 | User recherche dans sa boîte | Résultats instantanés (<200ms), recherche possible pendant l'indexation, labels imbriqués | ❌ (feature à implémenter — Tuta/Proton le font déjà) |
| MW-2026-012 | User ouvre la PWA mobile hors-ligne | Emails récents disponibles, indicateur hors-ligne, actions en attente synchronisées au retour | ❌ (PWA à implémenter — Proton le fait en natif, nous en PWA) |
| MW-2026-013 | User demande l'accès à ses données personnelles | Export complet (emails, contacts, calendrier) en format standard (mbox, vCard, iCal) sous 72h | ❌ (conformité RGPD/NIS2, à implémenter) |
| MW-2026-014 | User crée un événement depuis un email | Événement créé avec pré-remplissage depuis le contenu de l'email, lien bidirectionnel, sync CalDAV | ❌ (intégration calendrier avancée, issue #526) |

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
- `#521` — Instant search (sub-200ms with indexing, standard marché 2026)
- `#522` — Post-quantum cryptography Kyber+Dilithium (vs TutaCrypt)
- `#523` — BIMI brand logo display (Google/Yahoo 2025 reqs)

**Proton 2026 (détail)** : réécriture mobile Rust complète — iOS et Android partagent 80% du code (SwiftUI + Jetpack Compose avec core Rust). Offline search, indexation locale, Category View auto-grouping, intégration Gmail native (envoi/réception depuis un seul inbox). L'acquisition SimpleLogin est totalement intégrée — alias gérés nativement. Leur "Engineering Transformation" est un projet de 12+ mois. Enseignement: le Rust n'est pas seulement pour le backend — c'est un choix cross-platform stratégique. Notre stack backend Rust (Actif-web) est un atout, mais on n'a pas de mobile natif. Considération: PWA vs natif mobile en 2026.

**Tuta 2026 (détail)** : Fast Sync (10x faster) déployé — tous les clients sont 10x plus rapides grâce à l'optimisation du protocole. Nested labels, compteurs sur les labels, boîtes partagées rétractables. Search amélioré (résultats plus rapides, recherche pendant l'indexation). Tuta Drive en bêta ouverte. Inbox rules: bouton "réappliquer". Schedule send et undo send déployés. Le Fast Sync est l'avantage technique le plus impressionnant — notre stack DKIM native n'a pas ce problème de performance car on n'a pas de chiffrement E2EE lourd côté serveur. Leçon: la UX vitesse > E2EE pour le marché mainstream.

**Basecamp 2026 (détail)** : Basecamp 5 (2026) — calendrier full-screen global + par projet, abonnement calendrier externe, événements répétitifs, to-dos sur calendrier. Menu unifié avec recherche rapide (SHIFT+J). Intégration email : chaque projet a une adresse email unique, forwarding = création de message. Leçon : l'intégration email-projet confirme la tendance "email as task source" — notre route /calendar suit cette direction.

**Fastmail 2026 (détail)** : 3 plans (Basic $3/mo 6GB sans custom domain, Standard $5/mo 60GB avec custom domain, Pro $9/mo 150GB). ~1000 masked email aliases sur tous les plans payants, JMAP natif, Squire 2.0 editor, offline mode, calendar sync Google/iCloud. Point clé: le masked email est leur killer feature anti-spam — notre implération doit atteindre au minimum 100 aliases gratuits pour être compétitifs. Enseignement: la privacy E2EE n'est PAS requise pour être competitive en 2026, mais la privacy-by-design + aliasing + UX le sont.

**Skiff**: shutdown total confirmé (février 2025). Leçon: les privacy-first SaaS acquis par des big tech disparaissent. Notre approche self-hosted/souveraine est un bouclier.

**Privacy 2026**: GDPR enforcement ↑ (€5.88B cumul depuis 2018), CAN-SPAM fines $51.7K/email, tracking pixels sous consentement explicite (Italie), Vietnam PDP law 2026, 8+ US state laws. Notre conformité native DKIM/SPF/DMARC + privacy-by-design est un avantage compétitif vérifié.

**8 nouvelles state privacy laws** aux USA en 2025 → la conformité US devient complexe, notre approche EU-first (GDPR natif) est un avantage différenciant.

**One inbox 2026 (tendance)** : la tendance "one inbox to rule them all" est confirmée en 2026. Proton intègre Gmail nativement, Mailbird agrège Gmail/Outlook/Yahoo, Superhuman cible les executives avec AI-assisted drafting, Notion Mail superpose une UI moderne à Gmail, Missive ajoute du team chat. Notre stack native IMAP/SMTP est un avantage vs Proton (bridge payant). Arbitrage : multi-comptes natif (gratuit jusqu'à 3 comptes externes, payant au-delà).

**IA email 2026** : Proton Scribe (Mistral 7B, local) confirme la tendance IA privacy-first. Superhuman (Grammarly) = IA cloud (données envoyées). Notion Mail = IA cloud (Notion). Tuta = pas d'IA. Notre positionnement : IA locale exclusivement (Hermes AI), triage, résumé, chat, drafting — "The AI that reads your inbox, but never leaks it".

---

### Cycle 2026-09-09

- **Proton 2026**: réécriture mobile Rust (offline search, indexation locale), intégration Gmail (send/receive depuis un seul inbox), Category View auto-grouping. Confirme la tendance "one inbox to rule them all".

*Fichier maintenu par le PO. Cycle suivant: arbitrer sur le modèle freemium (gratuit avec pub ? freemium classique ? donation ?), explorer les offres Fastmail en détail.*
