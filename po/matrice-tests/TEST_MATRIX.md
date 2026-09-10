# Matrice de Tests — misfits.ai Mail (PO-maintenue)

> Dernière mise à jour: 2026-09-10
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

---

## 2. Gestion des Comptes Email (multi-alias)

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-ACC-01 | FT/BK | Créer un compte secondaire | Compte ajouté, visible dans liste | [ ] | |
| T-ACC-02 | FT/BK | Supprimer un compte | Compte retiré, mails archivés conservés | [ ] | |
| T-ACC-03 | FT | Basculer entre comptes (switcher) | From: change, signature change | [ ] | |
| T-ACC-04 | FT | Signature personnalisée par compte | Signature persistée et appliquée | [ ] | #423 |

---

## 3. Composer & Envoi

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-SEND-01 | FT/BK | Envoi mail texte simple | 202 + message dans Sent | [ ] | |
| T-SEND-02 | FT/BK | Envoi avec pièce jointe > 25Mo | 413 (limite dépassée) | [ ] | |
| T-SEND-03 | FT | Envoi avec PGP activé (destinataire connu) | Corps chiffré, contenu illisible sur serveur | [ ] | |
| T-SEND-04 | FT | Sauvegarde brouillon auto | Brouillon persisté en DB, récupérable | [ ] | #391 |
| T-SEND-05 | FT | Planification envoi (send later) | Mail envoyé à l'heure planifiée | [ ] | #391 |
| T-SEND-06 | FT | Annulation envoi planifié avant échéance | Mail non envoyé, déplacé en brouillons | [ ] | |

---

## 4. Réception & Synchronisation

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-RECV-01 | FT/BK | Réception mail via IMAP sync | Notification + apparition inbox < 5s | [ ] | |
| T-RECV-02 | FT | Marquage lu/non-lu | État persisté, sync bidirectionnelle | [ ] | |
| T-RECV-03 | FT | Déplacement dans dossier/label | Organisation conservée | [ ] | |
| T-RECV-04 | FT/BK | Réception mail avec headers DKIM/DMARC | Badge validité affiché | [ ] | |

---

## 5. DKIM / SPF / DMARC (DKIM service)

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-DKIM-01 | DK | Vérification signature DKIM valide | DKIM=pass | [ ] | |
| T-DKIM-02 | DK | Vérification signature DKIM invalide | DKIM=fail + raison | [ ] | |
| T-DKIM-03 | DK | Timeout vérification > 5s | Retour timely, pas de blocage | [ ] | #301 |
| T-DKIM-04 | DK | Publication clé DNS | TXT record correct généré | [ ] | |
| T-DKIM-05 | DK | Rotation clé DKIM | Ancienne clé dépréciée, nouvelle active | [ ] | |

---

## 6. Sécurité & Confidentialité

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-SEC-01 | FT/BK | Requête API sans token | 401 | [ ] | |
| T-SEC-02 | FT/BK | Requête API avec token expiré | 401 | [ ] | |
| T-SEC-03 | FT | CORS — origine non autorisée | Requête bloquée | [ ] | |
| T-SEC-04 | FT/BK | Injection XSS dans body mail | Content-Security-Policy, échappement | [ ] | |
| T-SEC-05 | FT/BK | CSRF — formulaire sans token | 403 | [ ] | |

---

## 7. Performance & UX

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-PERF-01 | FT | Chargement inbox < 100 mails | LCP < 2s | [ ] | |
| T-PERF-02 | FT | Scroll infini inbox | Smooth, pas de freeze > 16ms | [ ] | |
| T-PERF-03 | FT | Upload pièce jointe 10Mo | Progress visible, non-bloquant | [ ] | |
| T-PERF-04 | FT | Recherche full-text | Résultats < 500ms | [ ] | |

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
| T-NL-03 | FT/BK | Désinscription | Prise en compte < 24h | [ ] | |

---

## 10. Protocole & Infrastructure

| ID | Scope | Input | Expected Result | Status | Issue/PR |
|----|-------|-------|-----------------|--------|----------|
| T-INFRA-01 | BK | Connexion SMTP 587 STARTTLS | Handshake OK, TLS 1.2+ | [ ] | |
| T-INFRA-02 | BK | Authentification SMTP PLAIN | LOGIN réussi | [ ] | |
| T-INFRA-03 | BK | Retry sur échec SMTP temporaire | 3 retries avec backoff | [ ] | |
| T-INFRA-04 | BK | Connexion IMAP SSL | Handshake OK | [ ] | |
| T-INFRA-05 | DK | Health check /health | 200 OK + version | [ ] | |

---

## Couverture cible
- Domain ≥ 90%
- Ligne de code ≤ 200 LOC, CCN ≤ 8
- Chaque issue GitOps a ≥ 1 test dans cette matrice
