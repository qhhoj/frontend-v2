#!/usr/bin/env bash
# lint-changed.sh <base sha> [--fix]: ESLint and Prettier on the files changed since <base> (the PR and merge queue
# check). Both tools judge one file at a time, so this equals a full run for the changed files. A change to a tool's
# config, the lockfile, the lint scripts or an unknown base lints everything. --fix writes Prettier and ESLint fixes
# (used by `npm run prepush`).
# LINT_SHARD=<i>/<n> (CI): this process lints every n-th ESLint file (round robin) and, on shard 1 only, runs Prettier
# for all files, so n parallel runners together cover exactly what one process would. Unset: everything in one process.
set -euo pipefail
cd "$(dirname "$0")/.."
base="${1:-}"
fix="${2:-}"
shard="${LINT_SHARD:-1/1}"
shard_index="${shard%/*}"
shard_total="${shard#*/}"
# Prints the lines of stdin that belong to this shard.
pick_shard() { awk -v i="$shard_index" -v n="$shard_total" '(NR - 1) % n == i - 1'; }
full='^(eslint[.]config[.]|[.]prettier|package(-lock)?[.]json$|tsconfig|vite[.]config|vitest|env[.]d[.]ts$|scripts/)'

if [ -z "$base" ] || [[ $base =~ ^0+$ ]] || ! git cat-file -e "$base^{commit}" 2>/dev/null; then
  changed_all=full
else
  mapfile -t files < <( { git diff --name-only --diff-filter=ACMR "$base" HEAD; git diff --name-only --diff-filter=ACMR HEAD; } | sort -u)
  changed_all=""
  if printf '%s\n' "${files[@]}" | grep -qE "$full"; then changed_all=full; fi
fi

if [ "$changed_all" = full ]; then
  echo "linting everything (shard $shard)"
  if [ "$fix" = --fix ]; then npx eslint . --fix && npx prettier --write .; exit 0; fi
  mapfile -t all_code < <(git ls-files -- '*.js' '*.mjs' '*.cjs' '*.ts' '*.vue' | pick_shard)
  status=0
  [ "$shard_index" = 1 ] && { npx prettier --check . || status=1; }
  [ "${#all_code[@]}" -gt 0 ] && { npx eslint --no-warn-ignored "${all_code[@]}" || status=1; }
  exit "$status"
fi

mapfile -t existing < <(for file in "${files[@]}"; do [ -f "$file" ] && echo "$file"; done)
mapfile -t code < <(printf '%s\n' "${existing[@]}" | grep -E '[.](js|mjs|cjs|ts|vue)$' | pick_shard || true)
echo "changed: ${#existing[@]} files, ${#code[@]} for ESLint"
status=0
if [ "$fix" = --fix ]; then
  [ "${#existing[@]}" -gt 0 ] && npx prettier --write --ignore-unknown --no-error-on-unmatched-pattern "${existing[@]}"
  [ "${#code[@]}" -gt 0 ] && { npx eslint --fix --no-warn-ignored "${code[@]}" || status=1; }
else
  [ "$shard_index" = 1 ] && [ "${#existing[@]}" -gt 0 ] && { npx prettier --check --ignore-unknown --no-error-on-unmatched-pattern "${existing[@]}" || status=1; }
  [ "${#code[@]}" -gt 0 ] && { npx eslint --no-warn-ignored "${code[@]}" || status=1; }
fi
exit "$status"
