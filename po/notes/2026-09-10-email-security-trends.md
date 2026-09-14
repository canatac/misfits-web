# Veille Marché — Cycle 2026-09-10 (tick 6)
> Focus: sécurité email & menaces AI-driven

## Tendances sécurité 2026

### 1. AI-powered phishing = escalade permanente
- Generative AI + Phishing-as-a-Service → attaques personnalisées à grande échelle
- **PDF attachments** = 70% des payloads phishing Q1 2026
- **QR codes dans le corps du mail** = +336% en mars 2026 (quishing)
- Les filtres signature-based (SEGs) sont morts → remplacés par AI comportementale

### 2. Secure Email Gateways → ICES
- Les périmètres réseau ne suffisent plus
- API-native Integrated Cloud Email Security = nouveau paradigme
- Détection : NLP + behavioral anomaly + sandboxing

### 3. ARC-Seal (Authenticated Received Chain)
- Résout les échecs DMARC causés par le forwarding
- 3 headers : ARC-Authentication-Results, ARC-Message-Signature, ARC-Seal (cv=)
- Chaîne de confiance inaltérable de l'expéditeur au destinataire

## Implication misfits.ai Mail

| menace | réponse produit |
|--------|----------------|
| Phishing AI | Hermes AI comme anti-phishing (#495) |
| QR code dans body | Scan URLs embarqué dans le client |
| Usurpation expéditeur | Indicateur de confiance BIMI (#498) + ARC-Seal |
| Forward compromis | Validation chaîne ARC |

## Différenciation
- Proton Mail : filtre anti-phishing basique
- Fastmail : DMARC/DKIM, pas d'IA embarquée
- **Notre angle** : Hermes AI = anti-phishing agent natif qui analyse le contenu, le comportement et le contexte

## Recommandation PO
Créer issue pour "Anti-Phishing AI Indicator" — utiliser Hermes AI pour analyser les mails suspects et afficher un indicateur de risque (vert/jaune/rouge) dans l'interface.
