# Veille Marché — Cycle 2026-09-10 (tick 2)
> Focus: email deliverability & Gmail/Yahoo sender requirements

## Tendances clés

### 1. Gmail & Yahoo = règles strictes 2026
- **Bulk senders** (> 5 000 mails/jour) : SPF + DKIM + DMARC + one-click unsubscribe obligatoires
- **Spam complaint rate** : < 0.10% (recommandé), < 0.30% (tolérance maxi)
- **Reverse DNS** : obligatoire (PTR records)
- **TLS** : chiffrement obligatoire
- **DMARC** : alignment From: header avec SPF ou DKIM

### 2. Passage au hard enforcement
- Depuis novembre 2025 : Gmail rejette en 5xx permanents les non-conformes
- Avant : soft 4xx deferrals
- **Impact** : 40% d'une liste peut ne jamais recevoir une campagne si non-conforme

### 4. Sender Provider Requirements détaillés

| Provider | Exigences 2026 |
|----------|----------------|
| **Gmail** | SPF + DKIM + DMARC, PTR, TLS, spam < 0.1%, one-click unsubscribe (bulk) |
| **Yahoo** | SPF ou DKIM, PTR, spam < 0.3%, forward + reverse DNS, RFC 5321/5322 |
| **Microsoft (Outlook)** | spam < 0.3%, unkown sender rewards program |
| **Apple (iCloud)** | ARC headers sur forwarded, pas de postmaster tools, pas de feedback loop |

### 5. BIMI & certificats
- **VMC** (Verified Mark Certificate) : marque déposée requise, ~$1 500/an, Gmail/Yahoo/Apple
- **CMC** (Common Mark Certificate) : sans marque déposée, Gmail seulement
- Taux d'ouverture +39% avec BIMI

### 6. Réputation sender
- Mesurée via :
  - Google Postmaster Tools
  - Microsoft SNDS
  - Yahoo CFL (Complaint Feedback Loop)
- Métriques : spam rate, IP reputation, domain reputation, authentication rates

## Implication misfits.ai Mail
1. **Fonctionnalité** : vérifier la conformité de notre domaine + domaines de nos utilisateurs
2. **Outil interne** : dashboard "Deliverability Checker" qui valide SPF, DKIM, DMARC, PTR, TLS
3. **Notification** : alerte si spam rate > 0.1% ou si configuration invalide
4. **Onboarding** : proposer la configuration assistée (réDNS, enregistrements DNS, clés DKIM)

## Différenciation
- Proton Mail : E2E focus, pas de deliverability (serveurs propres)
- Fastmail : bonne réputation mais pas de dashboard misfits
- **Notre angle** : "Deliverability as a service" pour les auto-hébergeurs
- Un outil qui certifie votre domaine prêt pour Gmail/Yahoo 2026

## Recommandation PO
Créer issue feature pour le "Deliverability Checker" qui teste et rapporte la conformité SPF/DKIM/DMARC/PTR/TLS d'un domaine.
