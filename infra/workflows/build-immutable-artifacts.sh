#!/usr/bin/env bash

set -euo pipefail

unset CLOUDFLARE_ENV
pnpm build

task_staging_config="$RUNNER_TEMP/wejammin-web-staging-$GITHUB_SHA.json"
CLOUDFLARE_ENV=staging pnpm --filter @wejammin/web build
cp apps/web/dist/server/wrangler.json "$task_staging_config"
unset CLOUDFLARE_ENV
pnpm --filter @wejammin/web build
cp apps/web/dist/server/wrangler.json \
  apps/web/dist/server/wrangler.production.json
cp "$task_staging_config" \
  apps/web/dist/server/wrangler.staging.json

test -f apps/web/dist/server/entry.mjs
test -d apps/web/dist/client
test -f apps/web/dist/server/wrangler.production.json
test -f apps/web/dist/server/wrangler.staging.json
