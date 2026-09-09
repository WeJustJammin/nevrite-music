#!/usr/bin/env bash

set -euo pipefail

workflow_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
workspace_root="${GITHUB_WORKSPACE:-$(cd -- "$workflow_dir/../.." && pwd)}"
report_root="$workspace_root/promotion-candidate"
report_path="$report_root/accessibility/axe.json"
digest_path="$report_root/accessibility/axe.sha256"

: "${DEPLOY_SHA:?DEPLOY_SHA is required}"
: "${STAGING_WEB_ORIGIN:?STAGING_WEB_ORIGIN is required}"
: "${AC266_AXE_DIGEST:?AC266_AXE_DIGEST is required}"
: "${AC266_AXE_HOSTED_DEPLOYMENT_ID:?AC266_AXE_HOSTED_DEPLOYMENT_ID is required}"
: "${AC266_AXE_HOSTED_DEPLOYED_AT:?AC266_AXE_HOSTED_DEPLOYED_AT is required}"
: "${AC266_AXE_TRUSTED_CUTOFF_AT:?AC266_AXE_TRUSTED_CUTOFF_AT is required}"
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]
[[ "$AC266_AXE_DIGEST" =~ ^[0-9a-f]{64}$ ]]
[[ "$AC266_AXE_HOSTED_DEPLOYMENT_ID" =~ ^[0-9]+$ ]]
test -f "$report_path"
test -f "$digest_path"
test ! -L "$report_path"
test ! -L "$digest_path"

expected_sidecar="${AC266_AXE_DIGEST}  accessibility/axe.json"
if ! cmp -s "$digest_path" <(printf '%s\n' "$expected_sidecar"); then
  echo 'AC266 automated axe digest sidecar does not match the collected binding.' >&2
  exit 1
fi

node --experimental-strip-types \
  "$workflow_dir/content-schema-registry-axe-report-verifier.ts" \
  "$report_path" \
  "$DEPLOY_SHA" \
  "$AC266_AXE_HOSTED_DEPLOYMENT_ID" \
  "$STAGING_WEB_ORIGIN" \
  "$AC266_AXE_DIGEST" \
  "$AC266_AXE_HOSTED_DEPLOYED_AT" \
  "$AC266_AXE_TRUSTED_CUTOFF_AT"
