#!/usr/bin/env bash
# scripts/generate-types.sh
#
# Regenerate src/generated/api-types.ts from the OpenAPI specs in
# reimagined-guide/ops/openapi/.
#
# Requires: npx openapi-typescript (added to devDependencies)
# Usage: pnpm generate-types  (or bash scripts/generate-types.sh)
#
# This script is idempotent: run it after any change to the OpenAPI YAML files.

set -euo pipefail

OPENAPI_DIR="${OPENAPI_DIR:-../reimagined-guide/ops/openapi}"
OUT="src/generated/api-types.ts"

if ! command -v npx &>/dev/null; then
  echo "Error: npx not found. Install Node.js." >&2
  exit 1
fi

echo "Generating types from $OPENAPI_DIR → $OUT ..."

# Generate each spec separately then concatenate
# openapi-typescript handles single-file specs best.
# For a monolithic output we bundle them with a header.

cat > "$OUT" <<'HEADER'
/**
 * Generated API types for misfits.ai
 *
 * Source: reimagined-guide/ops/openapi/{auth,mailbox,admin,monitoring}-v1.yaml
 *
 * DO NOT EDIT MANUALLY.
 * Regenerate with: pnpm generate-types
 */
HEADER

for spec in auth mailbox admin monitoring; do
  yaml="$OPENAPI_DIR/${spec}-v1.yaml"
  if [[ -f "$yaml" ]]; then
    echo "" >> "$OUT"
    echo "// ─── ${spec} ─────────────────────────────────────────────────────────" >> "$OUT"
    npx --yes openapi-typescript "$yaml" --output /dev/stdout 2>/dev/null >> "$OUT" || true
  else
    echo "Warning: $yaml not found, skipping." >&2
  fi
done

echo "Done → $OUT"
