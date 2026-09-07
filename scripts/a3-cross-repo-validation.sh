#!/usr/bin/env bash
set -euo pipefail

MW_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RG_ROOT="${RG_ROOT:-/root/reimagined-guide}"

if [[ ! -d "$RG_ROOT" ]]; then
  echo "ERREUR: reimagined-guide introuvable: $RG_ROOT" >&2
  exit 1
fi

echo "[A3] misfits-web: tests non-régression ciblés"
pnpm -s run test -- \
  src/stores/__tests__/search-store-live-corpus.test.ts \
  src/stores/__tests__/email-store-read-persistence.test.ts \
  src/app/build-meta/__tests__/route.test.ts

echo "[A3] misfits-web: garde-fou live corpus (pas de mockEmails dans search-store)"
if rg -n "mockEmails" "$MW_ROOT/src/stores/search-store.ts"; then
  echo "ECHEC: régression détectée (mockEmails trouvé dans search-store.ts)" >&2
  exit 1
fi
rg -n "useEmailStore.getState\(\)\.emails" "$MW_ROOT/src/stores/search-store.ts"

echo "[A3] reimagined-guide: garde-fou CI repository_dispatch"
rg -n "repository_dispatch" "$RG_ROOT/.github/workflows/cicd.yml"
rg -n "github.event_name == 'repository_dispatch'" "$RG_ROOT/.github/workflows/cicd.yml"

echo "[A3] reimagined-guide: garde-fou transport PJ vers DKIM"
rg -n '"contentType"|"dataBase64"' "$RG_ROOT/src/bin/email_api_dir/dkim_service.rs"

if rg -n "unwrap\(|expect\(" "$RG_ROOT/src/bin/email_api_dir/dkim_service.rs"; then
  echo "ECHEC: unwrap/expect détecté dans dkim_service.rs" >&2
  exit 1
fi

echo "[A3] OK - validations croisées passées"
