# PO Market Watch — misfits.ai Mail

> Veille marché, compétiteurs, vision produit. Maintenu par le Product Owner.
> Dernière mise à jour: 2026-09-09

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
| **Undo send** | À impleter | **Oui** | Non | **Oui** | Non |
| **Templates** | À implémenter | Non | **Oui** | **Oui** | Non |
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

### Roadmap vision (prochaines itérations)
1. **Sprint UX**: scheduled send, undo send, templates
2. **Sprint Security**: post-quantum roadmap, anonymous signup optionnel
3. **Sprint Ecosystem**: PWA offline, intégration calendrier avancée
4. **Sprint AI**: résumés automatiques, triage intelligent, réponses suggérées

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

---

## 5. Notes de veille — Ce cycle

- **TutaCrypt** (post-quantum) est un signal fort: le marché exige maintenant du quantum-safe. À planifier.
- **Fastmail** reste le référent UX pour le mail "classique" premium — benchmark à faire sur leur interface.
- **Proton** pousse l'écosystème (VPN/Drive/Pass) — notre angle différent: IA + chat mail + self-hosted.
- **Hey** (Basecamp) a abandonné le IMAP — notre stack native est un avantage pour power users. NOUVEAU 2026: Basecamp 5 lance "Calendar Cover Art", "Create events from email", "Previously Seen emails" — confirme la tendance intégration mail+calendar.
- **Skiff** shutdown total confirmé (février 2025). Leçon: les privacy-first SaaS acquis par des big tech disparaissent. Notre approche self-hosted/souveraine est un bouclier.
- **8 nouvelles state privacy laws** aux USA en 2025 → la conformité US devient complexe, notre approche EU-first (GDPR natif) est un avantage.

---

*Fichier maintenu par le PO. Cycle suivant: explorer les offres Hey/Skiff en détail, arbitrer sur le modèle freemium.*
