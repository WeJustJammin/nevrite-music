#!/usr/bin/env bash

set -euo pipefail

: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"

# The Supabase CLI reads db.password from SUPABASE_DB_PASSWORD. Keep the
# password in the child process environment instead of exposing it in argv.
export SUPABASE_DB_PASSWORD

metadata_path="${PROMOTION_METADATA_PATH:-.promotion/promotion-metadata.json}"
test -f "$metadata_path"

expected_version="$(
  sed -n 's/.*"migrationVersion":"\([0-9]\{14,20\}\)".*/\1/p' \
    "$metadata_path"
)"
local_version="$(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' \
    | sed -n 's/^\([0-9]\{14,20\}\)_.*/\1/p' \
    | sort \
    | tail -n 1
)"
test -n "$expected_version"
test "$local_version" = "$expected_version"

pnpm exec supabase db push --project-ref "$SUPABASE_PROJECT_REF" --yes --skip-vault
remote_migrations="$(
  pnpm exec supabase migration list --project-ref "$SUPABASE_PROJECT_REF"
)"
printf '%s\n' "$remote_migrations" \
  | tr -d '\140' \
  | grep -Eq "^[[:space:]]*$expected_version[[:space:]]*\\|[[:space:]]*$expected_version[[:space:]]*\\|"

node --input-type=module - "$metadata_path" "$expected_version" <<'NODE'
import { readFileSync, renameSync, writeFileSync } from 'node:fs';

const [metadataPath, expectedVersion] = process.argv.slice(2);
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
if (metadata?.artifact?.migrationVersion !== expectedVersion) {
  throw new Error('migration evidence version mismatch');
}
if (metadata?.migration?.state !== 'not_started') {
  throw new Error('production migration evidence must start at not_started');
}
const updated = {
  ...metadata,
  migration: {
    state: 'expanded',
    forwardFixOnly: true,
    destructiveRollbackAttempted: false,
  },
  verifiedAt: new Date().toISOString(),
};
const temporaryPath = `${metadataPath}.tmp`;
writeFileSync(temporaryPath, `${JSON.stringify(updated)}\n`, { mode: 0o600 });
renameSync(temporaryPath, metadataPath);
NODE
