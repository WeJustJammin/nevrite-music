#!/usr/bin/env bash

set -euo pipefail

require_https_origin() {
  local name="$1"
  local value="$2"
  if [[ ! "$value" =~ ^https://[A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,63}$ ]]; then
    echo "::error::$name must be an HTTPS DNS origin without a path"
    exit 1
  fi
}

if [[ ! "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::DEPLOY_SHA must be a full lowercase commit SHA"
  exit 1
fi
require_https_origin PRODUCTION_WEB_ORIGIN "$PRODUCTION_WEB_ORIGIN"
printf 'WEB_CUSTOM_DOMAIN=%s\n' "${PRODUCTION_WEB_ORIGIN#https://}" >> "$GITHUB_ENV"
test "$(git rev-parse HEAD)" = "$DEPLOY_SHA"
test -f .promotion/artifacts/web/dist/server/entry.mjs
test -f .promotion/artifacts/web/dist/server/wrangler.production.json
test -d .promotion/artifacts/web/dist/client
test -n "$(find .promotion/artifacts/web/dist/client -type f -print -quit)"
test -f .promotion/artifacts/worker/dist/index.js
expected_digest="$(
  sed -n 's/.*"artifactDigest":"\([0-9a-f]\{64\}\)".*/\1/p' \
    .promotion/promotion-metadata.json
)"
actual_digest="$(
  sha256sum .promotion/deployment-manifest.sha256 \
    | cut -d ' ' -f 1
)"
test "$actual_digest" = "$expected_digest"
(
  cd .promotion/artifacts
  sha256sum --check ../deployment-manifest.sha256
)
