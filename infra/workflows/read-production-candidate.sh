#!/usr/bin/env bash

set -euo pipefail

if [[ ! "$STAGING_RUN_ID" =~ ^[0-9]+$ ]]; then
  echo "::error::STAGING_RUN_ID must identify one completed staging run"
  exit 1
fi
if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::DEPLOY_SHA must be a full lowercase commit SHA"
  exit 1
fi
test -f .promotion/promotion-metadata.json
test -f .promotion/deployment-manifest.sha256
metadata_sha="$(
  sed -n 's/.*"sourceRevision":"\([0-9a-f]\{40\}\)".*/\1/p' \
    .promotion/promotion-metadata.json
)"
test "$metadata_sha" = "$DEPLOY_SHA"
printf 'deploy_sha=%s\n' "$DEPLOY_SHA" >> "$GITHUB_OUTPUT"
