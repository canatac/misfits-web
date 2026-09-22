# Sécurité — 2026-09-10 (2)

## Vulnérabilités critiques identifiées

| Issue | Sévérité | Statut |
|-------|----------|--------|
| #421 : Attachment download without auth + CORS | CRITIQUE | Ouvert, aucune PR |
| #411 : /api/hermes/runs + /api/admin/ai-activity sans auth | HAUTE | Ouvert, aucune PR |
| #401 : CORS arbitrary origin on /api/emails | HAUTE | PR #410 ouverte, approuvée |
| #395 : ComposerFooter tests fail (bloque CI) | MOYENNE | PR #405 + #394 ouvertes |

## Preuves

### #421 : Exfiltration de pièces jointes
```
$ curl -s https://mail.misfits.ai/api/emails/07547fb5-...@misfits.ai/attachments/att-0
[PDF binary content]
HTTP: 200
```
Aucune authentification requise → téléchargement arbitraire de pièces jointes.

### #411 : Données sensibles exposées
```
$ curl -s https://mail.misfits.ai/api/hermes/runs
{"data":[{"id":"llm-0a32bb8e-...","status":"completed","model":"hermes-agent",
"usage":{"prompt_tokens":123141,...},"user_id":"admin",...}]}
```
Données opérationnelles + usage tokens exposées sans auth.

## Actions requises

1. **Merge URGENT PR #410** (CORS) — approuvée, tous checks verts
2. **Merge PR #405** (tests) — approuvée, tous checks verts
3. **Correction #421** — auth obligatoire sur attachments endpoint
4. **Correction #411** — auth obligatoire sur /api/hermes/runs et /api/admin/ai-activity

## Recommandation

**ESCALADE ROOT** — 3 vulnérabilités critiques non corrigées, impact production immédiat.

**Source** : issues #401, #411, #421 sur canatac/misfits-web (2026-09-10)
