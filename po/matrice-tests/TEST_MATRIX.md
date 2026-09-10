# Matrice de Tests — misfits.ai Mail (PO-maintenue)

> Dernière mise à jour: 2026-09-10 (tick 12)
> Maintien: product-owner (PO)
> Méthode: issue-first, CI-only, preuve obligatoire

---

## Légende
- [ ] = à exécuter
- [x] = passé vert
- [ ]🔴 = failed (régression)
- Priorité: P0=bloquant, P1=important, P2=nice-to-have
- Scope: FT=frontend, BK=backend, DK=DKIM

---

## 1. Authentification & Comptes

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-AUTH-01 | FT/BK | POST /api/auth/login {email, pwd valides} | 200 + JWT + refresh token | [ ] | |
| T-AUTH-02 | FT/BK | POST /api/auth/login {pwd invalide} | 401 + message générique | [ ] | |
| T-AUTH-03 | FT/BK | POST /api/auth/login {email inexistant} | 401 + même message (pas de leak) | [ ] | |
| T-AUTH-04 | FT | Session expirée → refresh automatique | Nouveau token, pas de déconnexion visible | [ ] | |
| T-AUTH-05 | FT/BK | POST /api/auth/logout | 204, token invalidé côté serveur | [ ] | |
| T-AUTH-06 | BK | Rate limiting login > 5 tentatives/min | 429 + Retry-After | [ ] | |
| T-AUTH-07 | FT/BK | 2FA TOTP requis si activé | Étape 2FA affichée (FT) + validée (BK) | [ ] | |

---

## 2. Gestion des Comptes Email (multi-alias)

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-ACC-01 | FT/BK | Créer un compte secondaire | Compte ajouté, visible dans liste | [ ] | |
| T-ACC-02 | FT/BK | Supprimer un compte | Compte retiré, mails archivés conservés | [ ] | |
| T-ACC-03 | FT | Basculer entre comptes (switcher) | From: change, signature change | [ ] | |
| T-ACC-04 | FT | Signature personnalisée par compte | Signature persistée et appliquée | [ ] | #423 |
| T-ACC-05 | FT/BK | Création d'alias (SimpleLogin-style) | Alias créé, mail forwarding actif | [ ] | |
| T-ACC-06 | FT | Désactivation rapide d'alias compromis | Alias disable → mail rejeté avec 550 | [ ] | |

---

## 3. Composer & Envoi

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-SEND-01 | FT/BK | Envoi mail texte simple | 202 + message dans Sent | [ ] | |
| T-SEND-02 | FT/BK | Envoi avec pièce jointe > 25Mo | 413 (limite dépassée) | [ ] | |
| T-SEND-03 | FT | Envoi avec PGP activé (destinataire connu) | Corps chiffré, contenu illisible sur serveur | [ ] | #490 |
| T-SEND-04 | FT | Sauvegarde brouillon auto | Brouillon persisté en DB, récupérable | [ ] | #391 |
| T-SEND-05 | FT | Planification envoi (send later) | Mail envoyé à l'heure planifiée | [ ] | #391 |
| T-SEND-06 | FT | Annulation envoi planifié avant échéance | Mail non envoyé, déplacé en brouillons | [ ] | |
| T-SEND-07 | BK | Rebond SMTP 4xx → file d'attente + retry | Statut "queued" visible (FT) + retry BK | [ ] | |

---

## 4. Réception & Synchronisation

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-RECV-01 | FT/BK | Réception mail via IMAP sync | Notification + apparition inbox < 5s | [ ] | |
| T-RECV-02 | FT | Marquage lu/non-lu | État persisté, sync bidirectionnelle | [ ] | |
| T-RECV-03 | FT | Déplacement dans dossier/label | Organisation conservée | [ ] | |
| T-RECV-04 | FT/BK | Réception mail avec headers DKIM/DMARC | Badge validité affiché | [ ] | |
| T-RECV-05 | FT | Vue feed newsletters (Hey-style) | Mails groupés, trackers bloqués | [ ] | |

---

## 5. DKIM / SPF / DMARC (DKIM service)

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-DKIM-01 | DK | Vérification signature DKIM valide | DKIM=pass | [ ] | |
| T-DKIM-02 | DK | Vérification signature DKIM invalide | DKIM=fail + raison | [ ] | |
| T-DKIM-03 | DK | Timeout vérification > 5s | Retour timely, pas de blocage | [ ] | #301 |
| T-DKIM-04 | DK | Publication clé DNS | TXT record correct généré | [ ] | |
| T-DKIM-05 | DK | Rotation clé DKIM | Ancienne clé dépréciée, nouvelle active | [ ] | |
| T-DKIM-06 | DK | Rapport DMARC agrégé hebdo | JSON/XML téléchargeable | [ ] | #491 |

---

## 6. Sécurité & Confidentialité

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-SEC-01 | FT/BK | Requête API sans token | 401 | [ ] | |
| T-SEC-02 | FT/BK | Requête API avec token expiré | 401 | [ ] | |
| T-SEC-03 | FT | CORS — origine non autorisée | Requête bloquée | [ ] | |
| T-SEC-04 | FT/BK | Injection XSS dans body mail | Content-Security-Policy, échappement | [ ] | |
| T-SEC-05 | FT/BK | CSRF — formulaire sans token | 403 | [ ] | |
| T-SEC-06 | FT/BK | Strict-Transport-Security header | max-age ≥ 31536000, preload | [ ] | |

---

## 7. Performance & UX

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-PERF-01 | FT | Chargement inbox < 100 mails | LCP < 2s | [ ] | |
| T-PERF-02 | FT | Scroll infini inbox | Smooth, pas de freeze > 16ms | [ ] | |
| T-PERF-03 | FT | Upload pièce jointe 10Mo | Progress visible, non-bloquant | [ ] | |
| T-PERF-04 | FT | Recherche full-text | Résultats < 500ms | [ ] | |
| T-PERF-05 | FT | PWA offline mode | Cache hit, UI shell affichée | [ ] | #493 |

---

## 8. Accessibilité

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-A11Y-01 | FT | Navigation clavier complète | Tous les contrôles accessibles | [ ] | |
| T-A11Y-02 | FT | Lecteur d'écran (VoiceOver/NVDA) | Labels corrects, focus visible | [ ] | |
| T-A11Y-03 | FT | Mode haute contraste | Interface lisible | [ ] | |

---

## 9. Newsletter & CTA

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-NL-01 | FT/BK | Inscription newsletter via formulaire | Confirmation double opt-in envoyée | [ ] | |
| T-NL-02 | FT | CTA newsletter mobile | Visible, cliquable, non chevauché | [ ] | #300 |
| T-NL-03 | FT/BK | Désinscription | Prise en compte < 24h | [ ] | #492 |

---

## 10. Protocole & Infrastructure

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-INFRA-01 | BK | Connexion SMTP 587 STARTTLS | Handshake OK, TLS 1.2+ | [ ] | |
| T-INFRA-02 | BK | Authentification SMTP PLAIN | LOGIN réussi | [ ] | |
| T-INFRA-03 | BK | Retry sur échec SMTP temporaire | 3 retries avec backoff | [ ] | |
| T-INFRA-04 | BK | Connexion IMAP SSL | Handshake OK | [ ] | |
| T-INFRA-05 | DK | Health check /health | 200 OK + version | [ ] | |
| T-INFRA-06 | DK | Métriques Prometheus | /metrics exposé (récursivité fleet) | [ ] | |
| T-INFRA-07 | BK | Vérification politique MTA-STS destinataire | Lookup DNS + cache, enforce mode respecté | [ ] | #494 |

---

## 11. E2E Encryption (PGP)

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-E2E-01 | FT | Génération clés à onboarding | Paire Ed25519+Curve25519 générée | [ ] | #490 |
| T-E2E-02 | FT | Import clé .asc existante | Clé importée, utilisable pour chiffrer | [ ] | #490 |
| T-E2E-03 | FT/BK | Envoi à destinataire avec clé WKD | Mail chiffré, corps illisible serveur | [ ] | #490 |
| T-E2E-04 | FT | Réception mail chiffré | Déchiffrement transparent | [ ] | #490 |
| T-E2E-05 | FT | Indicateur cadenas dans composer | Vert si chiffré, gris sinon | [ ] | #490 |
| T-E2E-06 | FT | Envoi à destinataire sans clé | Avertissement + fallback non chiffré | [ ] | #490 |

---

## 12. Post-Quantum Cryptography

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-PQ-01 | FT | Génération clés Kyber-768 + Dilithium-3 | Paire PQ générée, fonctionnelle | [ ] | #502 |
| T-PQ-02 | FT | Chiffrement mail avec clé PQ | Mail chiffré, résistant quantique | [ ] | #502 |
| T-PQ-03 | FT | Coexistence ECC + PQ dans même compte | Les deux formats supportés | [ ] | #502 |
| T-PQ-04 | FT | Performance impact vs ECC | Mesure, acceptable (< 2x) | [ ] | #502 |

---

## 13. PWA Offline

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-PWA-01 | FT | Installation PWA | Service worker actif, offline capable | [ ] | #493 |
| T-PWA-02 | FT | Consultation offline mails cache | Mails récents affichés sans réseau | [ ] | #493 |
| T-PWA-03 | FT | Creation brouillon offline | Sauvegarde locale + sync au retour | [ ] | #493 |
| T-PWA-04 | FT | Marquage lu offline | File d'attente + sync | [ ] | #493 |
| T-PWA-05 | FT | Indicateur offline dans toolbar | Bannière "Mode offline" visible | [ ] | #493 |

---

## 13. AI / Smart Features

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-AI-01 | FT/BK | Règle NL créée (label + déplacement) | Règle parsée, stockée, activable | [ ] | #495 |
| T-AI-02 | FT/BK | Mail entrant matchant une règle | Action exécutée automatiquement | [ ] | #495 |
| T-AI-03 | FT/BK | Dashboard actions avec undo | Annulation possible, action réversible | [ ] | #495 |
| T-AI-04 | FT | Suggestions basées historique | Propositions pertinentes | [ ] | #495 |
| T-AI-05 | FT | Split Inbox classification correcte | Mails dans bonne section (Important/Autres) | [ ] | #496 |
| T-AI-06 | FT | Déplacement manuel entre sections | Mail reclassé, IA apprend | [ ] | #496 |
| T-AI-07 | FT | Désactivation split inbox | Inbox unique affichée | [ ] | #496 |
| T-AI-08 | FT | Brouillon généré dans la voix user | Style cohérent avec historique | [ ] | #497 |
| T-AI-09 | FT | Indicateur confiance brouillon | Score affiché, seuil configurable | [ ] | #497 |
| T-AI-10 | FT | Feedback implicif après envoi | Modèle mis à jour | [ ] | #497 |

---

## 14. BIMI (Brand Indicators)

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-BIMI-01 | FT | Réception mail avec BIMI valide | Logo expéditeur affiché | [ ] | #498 |
| T-BIMI-02 | FT | Réception mail sans BIMI | Fallback avatar générique | [ ] | #498 |
| T-BIMI-03 | FT | BIMI invalide (VMC expiré) | Pas de logo, pas de crash | [ ] | #498 |
| T-BIMI-04 | FT | Configuration BIMI domaine | DNS record généré, logo uploadé | [ ] | #498 |
| T-BIMI-05 | FT | Indicateur confiance BIMI | Badge « Expéditeur vérifié » | [ ] | #498 |

---

## 15. Deliverability

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-DEL-01 | BK | Lookup DNS SPF valide | Record trouvé, version correcte | [ ] | #499 |
| T-DEL-02 | BK | Lookup DNS DKIM valide | Clé publiée, format correct | [ ] | #499 |
| T-DEL-03 | BK | Lookup DNS DMARC valide | p=reject ou p=quarantine | [ ] | #499 |
| T-DEL-04 | BK | Lookup PTR valide | IP → domaine résout | [ ] | #499 |
| T-DEL-05 | BK | Test TLS STARTTLS | Handshake OK, certificat valide | [ ] | #499 |
| T-DEL-06 | BK | Score de conformité | Score 0-100 calculé | [ ] | #499 |
| T-DEL-07 | FT | Recommandations affichées | Action par problème | [ ] | #499 |
| T-DEL-08 | FT | Export PDF du rapport | Fichier téléchargeable | [ ] | #499 |
| T-DEL-09 | FT | Historique des checks | Liste avec dates et scores | [ ] | #499 |
| T-DEL-10 | BK | Alerte score sous seuil | Notification envoyée | [ ] | #499 |

---

## 16. Data Portability

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-PORT-01 | FT/BK | Export mbox complet | Fichier mbox téléchargeable | [ ] | #500 |
| T-PORT-02 | FT/BK | Export EML individuel | Fichier .eml téléchargeable | [ ] | #500 |
| T-PORT-03 | FT/BK | Export vCard contacts | Fichier .vcf téléchargeable | [ ] | #500 |
| T-PORT-04 | FT | Import mbox avec déduplication | Mails ajoutés, doublons ignorés | [ ] | #500 |
| T-PORT-05 | FT | Import EML avec preview | Prévisualisation avant import | [ ] | #500 |
| T-PORT-06 | FT | Migration wizard Gmail/Proton | Sync incrémentale, progression | [ ] | #500 |
| T-PORT-07 | BK | Export chiffré PGP | Fichier chiffré avec clé user | [ ] | #500 |
| T-PORT-08 | BK | API REST export | Endpoint fonctionnel | [ ] | #500 |
| T-PORT-09 | FT | Job asynchrone progression | Notification fin + lien 24h | [ ] | #500 |

---

## 17. JMAP Protocol

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-JMAP-01 | BK | POST /jmap session | Session créée, capabilities exposées | [ ] | #501 |
| T-JMAP-02 | BK | Email/query | Résultat JSON structuré | [ ] | #501 |
| T-JMAP-03 | BK | Email/get | Email récupéré en JSON | [ ] | #501 |
| T-JMAP-04 | BK | Email/set (create/update/delete) | Opérations CRUD fonctionnelles | [ ] | #501 |
| T-JMAP-05 | BK | Mailbox/get | Liste des dossiers | [ ] | #501 |
| T-JMAP-06 | BK | WebSocket push | Notifications en temps réel | [ ] | #501 |
| T-JMAP-07 | BK | Coexistence IMAP | Mêmes données via les deux protocoles | [ ] | #501 |

---

## 18. Calendar Integration Hub

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-CAL-01 | BK | Connexion CalDAV multi-comptes | Comptes ajoutés, sync OK | [ ] | #503 |
| T-CAL-02 | BK | Lecture événements CalDAV | Événements affichés | [ ] | #503 |
| T-CAL-03 | BK | Création/modification événements | Write OK, sync bidirectionnelle | [ ] | #503 |
| T-CAL-04 | FT | Vue calendrier mensuelle/hebdo/jour | Navigation fonctionnelle | [ ] | #503 |
| T-CAL-05 | FT | Création événement depuis email | Pré-remplissage auto | [ ] | #503 |
| T-CAL-06 | FT | Notifications unifiées | Emails + events ensemble | [ ] | #503 |
| T-CAL-07 | BK | Sync incrémentale | Sync token CalDAV respecté | [ ] | #503 |

---

## 19. First-Time Sender Screening

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-SCREEN-01 | FT/BK | Activation screening par compte | Mode actif/inactif fonctionnel | [ ] | #504 |
| T-SCREEN-02 | FT | Nouveau expéditeur → file attente | Mail mis en attente, badge compteur | [ ] | #504 |
| T-SCREEN-03 | FT | Autorisation expéditeur | Prochains mails dans inbox | [ ] | #504 |
| T-SCREEN-04 | FT | Blocage expéditeur | Mails rejetés silencieusement | [ ] | #504 |
| T-SCREEN-05 | FT | Import carnet adresses | Contacts auto-autorisés | [ ] | #504 |

---

## 20. Anti-Phishing AI

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-PHISH-01 | FT/BK | Analyse mail entrant avec Hermes AI | Score de risque calculé (0-100) | [ ] | #505 |
| T-PHISH-02 | FT | Indicateur vert (mail sûr) | Icône verte affichée | [ ] | #505 |
| T-PHISH-03 | FT | Indicateur rouge (mail suspect) | Icône rouge affichée | [ ] | #505 |
| T-PHISH-04 | FT | Explication détaillée du score | Raison affichée (URLs, urgence, etc.) | [ ] | #505 |
| T-PHISH-05 | FT | Signalement faux positif/négatif | Feedback enregistré, IA apprend | [ ] | #505 |

---

## Couverture cible
- Domain ≥ 90%
- Ligne de code ≤ 200 LOC, CCN ≤ 8
- Chaque issue GitOps a ≥ 1 test dans cette matrice
