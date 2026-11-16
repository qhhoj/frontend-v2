#!/usr/bin/env bash
# Copy of backend-v2 deploy/ci/resolve-ref.sh; keep in sync (DEPLOY_BRANCH is this copy's only addition).
# resolve-ref.sh <ref>: prints sha=<commit> and tag=<image/release tag> for $GITHUB_OUTPUT.
# Empty ref = the highest v* tag. A ref that is exactly a vX.Y.Z tag keeps its name; anything else becomes sha-<12>.
# Only a commit on origin/$DEPLOY_BRANCH (main or staging; default main) deploys: a branch, a SHA or a tag off it is refused.
set -euo pipefail
ref="${1:-}" branch="${DEPLOY_BRANCH:-main}"
[[ $branch =~ ^(main|staging)$ ]] || { echo "DEPLOY_BRANCH must be main or staging, not $branch" >&2; exit 1; }
if [ -z "$ref" ]; then
  ref="$(git tag --list 'v*' --sort=-v:refname | head -1)"
  [ -n "$ref" ] || { echo "no v* tag" >&2; exit 1; }
fi
sha="$(git rev-parse --verify --quiet "$ref^{commit}")" || { echo "unknown ref: $ref" >&2; exit 1; }
git merge-base --is-ancestor "$sha" "origin/$branch" || { echo "not on origin/$branch: $ref ($sha)" >&2; exit 1; }
if [[ $ref =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then tag="$ref"; else tag="sha-${sha:0:12}"; fi
echo "sha=$sha"
echo "tag=$tag"
