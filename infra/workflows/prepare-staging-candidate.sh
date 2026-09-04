#!/usr/bin/env bash

set -euo pipefail

: "${DEPLOY_SHA:?DEPLOY_SHA is required}"
: "${CI_RUN_ID:?CI_RUN_ID is required}"
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$CI_RUN_ID" =~ ^[1-9][0-9]*$ ]]

test ! -e promotion-candidate
mkdir -p promotion-candidate/artifacts
cp -R .artifacts/. promotion-candidate/artifacts/
cp deployment-manifest.sha256 promotion-candidate/deployment-manifest.sha256

artifact_digest="$(
  sha256sum promotion-candidate/deployment-manifest.sha256 \
    | cut -d ' ' -f 1
)"
migration_version="$(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' \
    -printf '%f\n' \
    | sed -n 's/^\([0-9]\{14,20\}\)_.*/\1/p' \
    | sort \
    | tail -n 1
)"
test "$artifact_digest" != ""
test "$migration_version" != ""
printf '{"artifactDigest":"%s","sourceRevision":"%s","buildId":"ci-%s","migrationVersion":"%s"}\n' \
  "$artifact_digest" \
  "$DEPLOY_SHA" \
  "$CI_RUN_ID" \
  "$migration_version" \
  > promotion-candidate/staging-artifact-identity.json
