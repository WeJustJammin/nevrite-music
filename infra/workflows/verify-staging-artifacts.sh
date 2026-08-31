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
if [[ ! "$CI_RUN_ID" =~ ^[0-9]+$ ]]; then
  echo "::error::CI_RUN_ID must identify one completed CI run"
  exit 1
fi
require_https_origin STAGING_WEB_ORIGIN "$STAGING_WEB_ORIGIN"
require_https_origin STAGING_API_ORIGIN "$STAGING_API_ORIGIN"
printf 'WEB_CUSTOM_DOMAIN=%s\n' "${STAGING_WEB_ORIGIN#https://}" >> "$GITHUB_ENV"
test "$(git rev-parse HEAD)" = "$DEPLOY_SHA"
test -f .artifacts/apps/web/dist/server/entry.mjs || {
  echo "::error::Immutable web server entry is missing"
  exit 1
}
test -f .artifacts/apps/web/dist/server/wrangler.staging.json || {
  echo "::error::Immutable staging web configuration is missing"
  exit 1
}
test -d .artifacts/apps/web/dist/client || {
  echo "::error::Immutable web client directory is missing"
  exit 1
}
test -n "$(find .artifacts/apps/web/dist/client -type f -print -quit)" || {
  echo "::error::Immutable web client directory is empty"
  exit 1
}
test -f .artifacts/apps/worker/dist/index.js || {
  echo "::error::Immutable API Worker entry is missing"
  exit 1
}
test -f .artifacts/ci-gate-evidence.json || {
  echo "::error::Immutable CI gate evidence is missing"
  exit 1
}
node --experimental-strip-types infra/workflows/verify-performance-evidence.ts \
  .artifacts/performance-evidence/bundle-budget.json \
  .artifacts/performance-evidence/api-p95-smoke.json \
  "$DEPLOY_SHA"
