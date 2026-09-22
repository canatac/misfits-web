# Sécurité — 2026-09-10

## Issues identifiées

### Issue #401 : CORS misconfiguration
- Endpoint `/api/emails` reflects arbitrary Origin with credentials
- Vol de credentials cross-origin possible
- Statut : PR #410 corrige (✅ 5/5 checks green), PR #409 doublon fermé

### Issue #411 : Sensitive data without auth
- Endpoints `/api/hermes/runs` et `/api/admin/ai-activity` sans authentification
- Données opérationnelles exposées (usage tokens, status, etc.)
- Statut : ouvert, en attente de correction

## Actions prises

1. Vérification doublon CORS → PR #409 fermée, PR #410 gardée
2. PO review PR #405 (tests ComposerFooter) → approuvé merge
3. Escalade #411 à Root (sécurité critique, correction backend requise)

**Source** : issues #401, #411 sur canatac/misfits-web (2026-09-10)
