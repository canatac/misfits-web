# Sécurité — État des lieux 2026-09-10 (3)

## Vulnérabilités et correctifs

| Issue | Sévérité | PR | Statut |
|-------|----------|----|--------|
| #421 : Attachment download sans auth | CRITIQUE | Aucune | Non corrigé |
| #411 : /hermes/runs + /admin/ai-activity sans auth | HAUTE | #422 | Typecheck FAIL |
| #401 : CORS arbitrary origin | HAUTE | #410 | ✅ Approuvé, prêt à merger |
| #395 : ComposerFooter tests (bloque CI) | MOYENNE | #405 | ✅ Approuvé, prêt à merger |

## Détail PR #422 (auth bypass)

**Objectif** : Ajouter `requireAuth()` à toutes les routes proxy API

**Problème** : Typecheck failure — PR #422 a retiré des fonctions de `api-auth.ts` mais d'autres modules les importent encore :
```
src/app/login/page.tsx(21,10): error TS2305: Module '"@/lib/api-auth"' has no exported member 'initiateGithubLogin'.
src/stores/auth-store.ts(10,3): ...
```

**Action requise** : Corriger les imports dans `login/page.tsx` et `auth-store.ts` pour utiliser les nouvelles fonctions.

## Recommandation

1. **Merge URGENT PR #410** (CORS) et **PR #405** (tests) — tous les deux approuvés et prêts
2. **Corriger PR #422** — typecheck failure bloque la correction des issues #401 et #411
3. **Créer PR pour #421** — attachment download toujours exposé

**ESCALADE ROOT** — 3 vulnérabilités critiques non corrigées en production.

**Source** : issues #401, #411, #421, #426 sur canatac/misfits-web (2026-09-10)
