#!/usr/bin/env bash

set -euo pipefail

: "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
: "${DEPLOY_SHA:?DEPLOY_SHA is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"

node --experimental-strip-types \
  "$GITHUB_WORKSPACE/infra/workflows/cloudflare-provider-release-evidence.ts"
