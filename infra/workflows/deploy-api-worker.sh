#!/usr/bin/env bash

set -euo pipefail

task_environment="${1:-}"
task_artifact="${2:-}"

case "$task_environment" in
  staging | production) ;;
  *)
    echo "::error::Worker environment must be staging or production"
    exit 1
    ;;
esac

if [[ "$task_artifact" != /* || ! -f "$task_artifact" ]]; then
  echo "::error::Worker artifact must be an existing absolute file"
  exit 1
fi
if [[ ! "${DEPLOY_SHA:-}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::DEPLOY_SHA must be a full lowercase commit SHA"
  exit 1
fi
if ! node --input-type=module - "${SUPABASE_URL:-}" <<'NODE'
const candidate = process.argv[2];

try {
  const parsed = new URL(candidate);
  const hasForbiddenWhitespace =
    candidate.trim() !== candidate ||
    /[\u0000-\u0020\u007f-\u009f]/u.test(candidate);
  const isHttpsOrigin =
    !hasForbiddenWhitespace &&
    parsed.protocol === 'https:' &&
    parsed.username === '' &&
    parsed.password === '' &&
    parsed.pathname === '/' &&
    parsed.search === '' &&
    parsed.hash === '';

  if (!isHttpsOrigin) {
    process.exit(1);
  }
} catch {
  process.exit(1);
}
NODE
then
  echo "::error::SUPABASE_URL must be an HTTPS origin without embedded credentials"
  exit 1
fi
if [[ -z "${SUPABASE_SECRET_KEY:-}" || "$SUPABASE_SECRET_KEY" =~ [[:space:]] ]]; then
  echo "::error::SUPABASE_SECRET_KEY is required"
  exit 1
fi
if [[ ! "${CLOUDFLARE_ACCOUNT_ID:-}" =~ ^[0-9a-f]{32}$ ]]; then
  echo "::error::CLOUDFLARE_ACCOUNT_ID must be a 32-character lowercase account ID"
  exit 1
fi
if [[ "$task_environment" == "production" ]] &&
  [[ -z "${CLOUDFLARE_OBSERVABILITY_API_TOKEN:-}" || "$CLOUDFLARE_OBSERVABILITY_API_TOKEN" =~ [[:space:]] ]]; then
  echo "::error::CLOUDFLARE_OBSERVABILITY_API_TOKEN is required for production alerts"
  exit 1
fi
if [[
  "${RUNNER_TEMP:-}" != /* ||
  "$RUNNER_TEMP" == "/" ||
  ! -d "$RUNNER_TEMP"
]]; then
  echo "::error::RUNNER_TEMP must be a bounded absolute directory"
  exit 1
fi

task_environment_args=()
if [[ "$task_environment" == "staging" ]]; then
  task_environment_args=(--env staging)
fi

umask 077
task_secrets_file="$(
  mktemp "$RUNNER_TEMP/wejammin-api-$task_environment-secrets.XXXXXX.env"
)"
trap 'rm -f "$task_secrets_file"' EXIT
printf 'SUPABASE_SECRET_KEY=%s\n' "$SUPABASE_SECRET_KEY" > "$task_secrets_file"
unset SUPABASE_SECRET_KEY
if [[ "$task_environment" == "production" ]]; then
  printf 'CLOUDFLARE_OBSERVABILITY_API_TOKEN=%s\n' \
    "$CLOUDFLARE_OBSERVABILITY_API_TOKEN" >> "$task_secrets_file"
  unset CLOUDFLARE_OBSERVABILITY_API_TOKEN
fi

pnpm --filter @wejammin/worker exec wrangler deploy \
  "$task_artifact" \
  --config wrangler.jsonc \
  "${task_environment_args[@]}" \
  --secrets-file "$task_secrets_file" \
  --var APP_ENVIRONMENT:"$task_environment" \
  --var APP_RELEASE:"$DEPLOY_SHA" \
  --var CLOUDFLARE_ACCOUNT_ID:"$CLOUDFLARE_ACCOUNT_ID" \
  --var SUPABASE_URL:"$SUPABASE_URL"
