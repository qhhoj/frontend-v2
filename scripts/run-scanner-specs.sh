#!/usr/bin/env bash
# Runs every scanner spec: a spec that reads the source tree with import.meta.glob instead of importing it,
# so `vitest --changed` never selects it when an unrelated file breaks its rule.
set -euo pipefail
cd "$(dirname "$0")/.."
mapfile -t specs < <(grep -rl 'import\.meta\.glob' src --include='*.spec.ts')
npx vitest run --project node --project dom "${specs[@]}"
