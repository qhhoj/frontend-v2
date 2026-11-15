#!/usr/bin/env bash
# Run before every push: the mechanical checks CI would fail on, fixed in place where a tool can fix them.
# Prettier and ESLint --fix on the files changed since origin/main, the raw-element baselines lowered to the real
# counts, then the repo lint rules. Commit what it changed.
set -euo pipefail
cd "$(dirname "$0")/.."
base="$(git merge-base HEAD origin/main 2>/dev/null || true)"
bash scripts/lint-changed.sh "$base" --fix
node scripts/raw-elements.mjs --shrink
bash scripts/lint-rules.sh
if [ -n "$(git status --porcelain)" ]; then echo "prepush: files changed or uncommitted; review and commit them"; fi
