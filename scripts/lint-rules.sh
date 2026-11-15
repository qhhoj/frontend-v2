#!/usr/bin/env bash
# The repo's own lint rules (everything in `npm run lint` except ESLint and Prettier), run in parallel.
# Output of each stays together; the exit code is non-zero when any fails.
set -uo pipefail
cd "$(dirname "$0")/.."
rules=(lint:tokens lint:palette lint:copy lint:dates lint:plan-codes)
logs=$(mktemp -d)
for rule in "${rules[@]}"; do npm run --silent "$rule" >"$logs/$rule.log" 2>&1 & pids+=($!); done
status=0
for index in "${!rules[@]}"; do
  if wait "${pids[$index]}"; then echo "ok   ${rules[$index]}"; else echo "FAIL ${rules[$index]}"; status=1; fi
  cat "$logs/${rules[$index]}.log"
done
rm -rf "$logs"
exit "$status"
