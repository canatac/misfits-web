# PO Market Watch — misfits.ai Mail

> Veille marché, compétiteurs, vision produit. Maintenu par le Product Owner.
> Dernière mise à jour: 2026-09-23 (cycle 2 — veille GDPR/privacy)

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

---

## 5. Notes de veille — Ce cycle

- **Proton 2026**: réécriture mobile Rust (offline search, indexation locale), intégration Gmail (send/receive depuis un seul inbox), Category View auto-grouping. Confirme la tendance "one inbox to rule them all".
- **Tuta 2026**: Fast Sync (10x faster), conversation view, email import/export single-click, TutaCrypt rollout accéléré. Le "conversation view" devient un standard du marché.
- **Hey** (Basecamp) a abandonné le IMAP — notre stack native est un avantage pour power users. NOUVEAU 2026: Basecamp 5 lance "Calendar Cover Art", "Create events from email", "Previously Seen emails" — confirme la tendance intégration mail+calendar.
- **Skiff** shutdown total confirmé (février 2025). Leçon: les privacy-first SaaS acquis par des big tech disparaissent. Notre approche self-hosted/souveraine est un bouclier.
- **Fastmail 2026**: 3 plans (Basic $3/mo, Standard $5/mo, Professional $9/mo), custom domain dès Standard, JMAP, Squire 2.0 editor, send later, spam filtering, masked emails. Positionnement "premium classique" sans E2EE — notre angle: E2EE + IA + self-hosted.
- **Privacy 2026**: GDPR enforcement ↑ (€5.88B cumul depuis 2018), CAN-SPAM fines $51.7K/email, tracking pixels sous consentement explicite (Italie), Vietnam PDP law 2026, 8+ US state laws. Notre conformité native DKIM/SPF/DMARC + privacy-by-design est un avantage.
- **8 nouvelles state privacy laws** aux USA en 2025 → la conformité US devient complexe, notre approche EU-first (GDPR natif) est un avantage.

---

### Veille marché 2026-09-23 — AI email clients & privacy

- **AI email client market mature in 2026**: Canary Mail ($36/yr), Thunderbird (free + AI add-ons), Spark, SaneBox all offer AI triage, smart replies, summarization. AI features are now baseline expectations, not premium differentiators.
- **Privacy tension**: Mailbird 2026 analysis confirms AI-driven features (smart replies, threat detection) require content access — conflicts with privacy-first positioning. misfits.ai's on-device AI (MW-2020) is a key differentiator.
- **Apple MPP impact**: 55-60% of email opens are privacy-impacted (Apple Mail Privacy Protection). Shift from open-rate tracking to click-through metrics. Relevant for misfits.ai newsletter feature (MW-2026-016).
- **Litmus 2026**: Apple Mail + Gmail = ~90% market share. Cross-platform consistency remains critical for PWA (MW-2026-005).

*Fichier maintenu par le PO. Cycle suivant: arbitrer sur le modèle freemium (gratuit avec pub ? freemium classique ? donation ?), explorer les offres Fastmail en détail.*

### Veille marché 2026-09-23 — GDPR enforcement & privacy compliance

- **GDPR fines exceed €7.1B cumulative** (2,800+ fines through mid-2025, 60%+ increase trajectory). Enforcement has shifted from sporadic penalties to sustained high-volume machine.
- **19 US states** now have comprehensive consumer privacy laws (IAPP, Jan 2026). Indiana, Kentucky, Rhode Island joined Jan 1, 2026. California, Colorado, Connecticut, Oregon, Utah amended existing laws in 2025-2026.
- **Global Privacy Control (GPC) signal recognition** now mandated by 8 US states. Kentucky, Rhode Island, Indiana require GPC recognition starting Jan 1, 2026.
- **EU AI Act full enforcement** begins August 2, 2026 — AI governance documentation becomes mandatory.
- **Italy Garante**: tracking pixels in emails now require free and specific consent (May 2026).
- **India DPDP rollout** continues — coordinated GDPR transparency scrutiny expanding.
- **Oregon (Jan 2026)**: prohibits data sale when consumer is under 16; prohibits precise geolocation sale within 1,750-foot radius.

**Implication misfits.ai**: Our privacy-by-design architecture (no data mining, no tracking pixels, DKIM/SPF/DMARC native) is increasingly aligned with enforcement trends. GPC signal support and granular consent management should be prioritized for newsletter feature (MW-2026-016). EU AI Act compliance documentation needed for AI features (MW-2026-014, MW-2026-015, MW-2026-020).
