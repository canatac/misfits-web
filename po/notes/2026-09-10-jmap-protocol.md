# Veille Marché — Cycle 2026-09-10 (tick 4)
> Focus: JMAP (JSON Meta Application Protocol) — le successeur d'IMAP

## Contexte
JMAP (RFC 8620/8621) est un protocole moderne développé par Fastmail depuis 2014, standardisé par l'IETF en 2019. En 2026, l'accélération est visible : Nextcloud intègre JMAP dans Mail (Spring 2026), et de nouveaux clients (bulwarkmail, Sterna Mail) le supportent nativement.

## Pourquoi JMAP remplace IMAP

| Critère | IMAP (RFC 3501) | JMAP (RFC 8621) |
|---------|-----------------|-----------------|
| Protocole | Texte, verbeux | JSON structuré, concis |
| Sync | Polling (inefficient) | Push natif (WebSocket) |
| Bandeau passante | Élevée (commandes répétitives) | Faible (requêtes batch) |
| Développement | Complexe (parser RFC 3501) | Simple (JSON HTTP) |
| Multi-device | Problématic (condstore) | Natif (state changes) |

## Adoption 2026

| Acteur | Statut JMAP |
|--------|-------------|
| Fastmail | Créateur, support natif complet |
| Stalwa…rt | Serveur JMAP open-source |
| Nextcloud | Client JMAP intégré (Spring 2026) |
| bulwarkmail | Client webmail JMAP |
| Sterna Mail | Client Android FOSS JMAP |
| Cyrus IMAP | Serveur avec plugin JMAP |

## Pertinence misfits.ai Mail

Notre backend Rust (Actix-web) est parfaitement positionné pour implémenter un serveur JMAP :
1. **Performance** : JMAP + Rust = combo gagnant
2. **Ecosystème** : les clients JMAP peuvent se connecter nativement
3. **Futur-proof** : IMAP reste pour compatibilité, JMAP pour le moderne
4. **DKIM service** : déjà dans notre scope, JMAP facilite l'intégration

## Différenciation
- Proton Mail : pas JMAP (bridge IMAP propriétaire)
- Fastmail : créateur JMAP mais SaaS uniquement
- **Notre angle** : "Premier serveur JMAP auto-hébergeable avec DKIM intégré"

## Recommandation PO
Créer issue technique pour évaluer l'implémentation d'un serveur JMAP en Rust. Scope : MVP avec sync email basique, extension vers Calendrier (RFC 8620/8621 étendu).
