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
if [[ ! "${CI_RUN_ID:-}" =~ ^[0-9]+$ ]]; then
  echo "::error::CI_RUN_ID must identify one completed CI run"
  exit 1
fi
require_https_origin PRODUCTION_WEB_ORIGIN "$PRODUCTION_WEB_ORIGIN"
printf 'WEB_CUSTOM_DOMAIN=%s\n' "${PRODUCTION_WEB_ORIGIN#https://}" >> "$GITHUB_ENV"
test "$(git rev-parse HEAD)" = "$DEPLOY_SHA"
test -f .promotion/artifacts/apps/web/dist/server/entry.mjs || {
  echo "::error::Promoted web server entry is missing"
  exit 1
}
test -f .promotion/artifacts/apps/web/dist/server/wrangler.production.json || {
  echo "::error::Promoted production web configuration is missing"
  exit 1
}
test -d .promotion/artifacts/apps/web/dist/client || {
  echo "::error::Promoted web client directory is missing"
  exit 1
}
test -n "$(find .promotion/artifacts/apps/web/dist/client -type f -print -quit)" || {
  echo "::error::Promoted web client directory is empty"
  exit 1
}
test -f .promotion/artifacts/apps/worker/dist/index.js || {
  echo "::error::Promoted API Worker entry is missing"
  exit 1
}
actual_digest="$(
  sha256sum .promotion/deployment-manifest.sha256 \
    | cut -d ' ' -f 1
)"
(
  cd .promotion/artifacts
  sha256sum --check ../deployment-manifest.sha256
)
migration_version="$(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' \
    -printf '%f\n' \
    | sed -n 's/^\([0-9]\{14,20\}\)_.*/\1/p' \
    | sort \
    | tail -n 1
)"
if [[ -z "$migration_version" ]]; then
  echo "::error::A checked-out migration version is required"
  exit 1
fi
printf '{"artifactDigest":"%s","sourceRevision":"%s","buildId":"ci-%s","migrationVersion":"%s"}\n' \
  "$actual_digest" \
  "$DEPLOY_SHA" \
  "$CI_RUN_ID" \
  "$migration_version" \
  > .promotion/staging-artifact-identity.json
node --experimental-strip-types infra/workflows/verify-performance-evidence.ts \
  .promotion/artifacts/performance-evidence/bundle-budget.json \
  .promotion/api-p95-smoke.json \
  "$DEPLOY_SHA"
