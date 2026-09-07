# A3 — Validation croisée A1+A2 (misfits-web + reimagined-guide)

Objectif:
- Vérifier sans régression les axes A1+A2 via preuves fraîches, sans hors-scope.

Périmètre strict:
- misfits-web
- reimagined-guide

## Commande unique de validation

Depuis `misfits-web`:

```bash
bash scripts/a3-cross-repo-validation.sh
```

## Ce que la validation couvre

1) misfits-web — non-régression fonctionnelle ciblée
- `search-store-live-corpus.test.ts`
- `email-store-read-persistence.test.ts`
- `build-meta route.test.ts`

2) misfits-web — garde-fou structurel
- interdit `mockEmails` dans `src/stores/search-store.ts`
- exige fallback live corpus: `useEmailStore.getState().emails`

3) reimagined-guide — garde-fous d’intégration
- CI: présence de la clause `repository_dispatch` dans `.github/workflows/cicd.yml`
- Transport pièces jointes DKIM: présence des champs `contentType` et `dataBase64`
- robustesse runtime ciblée: pas de `unwrap/expect` dans `src/bin/email_api_dir/dkim_service.rs`

## Interprétation
- Script en succès => garde-fous A3 valides.
- Script en échec => régression explicite avec point de rupture dans la sortie.
