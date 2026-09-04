#!/usr/bin/env bash

set -euo pipefail

: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF is required}"
: "${SUPABASE_DB_PASSWORD:?SUPABASE_DB_PASSWORD is required}"
: "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"

# The Supabase CLI reads db.password from SUPABASE_DB_PASSWORD. Keep the
# password in the child process environment instead of exposing it in argv.
export SUPABASE_DB_PASSWORD

staging_evidence_path="${STAGING_MIGRATION_EVIDENCE_PATH:-}"
promotion_metadata_path="${PROMOTION_METADATA_PATH:-}"
if [[ -n "$staging_evidence_path" && -n "$promotion_metadata_path" ]]; then
  printf '%s\n' 'Choose either staging evidence or promotion metadata, not both.' >&2
  exit 1
fi
if [[ -z "$staging_evidence_path" ]]; then
  promotion_metadata_path="${promotion_metadata_path:-.promotion/promotion-metadata.json}"
  test -f "$promotion_metadata_path"
else
  [[ "${DEPLOY_SHA:-}" =~ ^[0-9a-f]{40}$ ]]
  [[ "${CI_RUN_ID:-}" =~ ^[0-9]+$ ]]
fi

local_versions="$(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' -printf '%f\n' \
    | sed -n 's/^\([0-9]\{14,20\}\)_.*/\1/p' \
    | sort
)"
local_version="$(printf '%s\n' "$local_versions" | tail -n 1)"
expected_version="$local_version"
if [[ -z "$staging_evidence_path" ]]; then
  expected_version="$(
    node --input-type=module - "$promotion_metadata_path" <<'NODE'
import { readFileSync } from 'node:fs';

const metadata = JSON.parse(readFileSync(process.argv[2], 'utf8'));
process.stdout.write(String(metadata?.artifact?.migrationVersion ?? ''));
NODE
  )"
fi
test -n "$expected_version"
test "$local_version" = "$expected_version"

pnpm exec supabase db push --project-ref "$SUPABASE_PROJECT_REF" --yes --skip-vault
remote_migrations="$(
  pnpm exec supabase migration list --project-ref "$SUPABASE_PROJECT_REF"
)"
remote_history_sha256="$(
  LOCAL_MIGRATION_VERSIONS="$local_versions" \
  REMOTE_MIGRATION_LIST="$remote_migrations" \
  node --input-type=module <<'NODE'
import { createHash } from 'node:crypto';

const versionPattern = /^[0-9]{14,20}$/u;
const localVersions = (process.env.LOCAL_MIGRATION_VERSIONS ?? '')
  .split('\n')
  .filter(Boolean);
const rawMigrationList = process.env.REMOTE_MIGRATION_LIST ?? '';
let reportedRows;
try {
  const parsed = JSON.parse(rawMigrationList);
  if (!Array.isArray(parsed?.migrations)) {
    throw new Error('hosted migration JSON is invalid');
  }
  reportedRows = parsed.migrations.map((migration) => [
    String(migration?.local ?? ''),
    String(migration?.remote ?? ''),
  ]);
} catch (error) {
  if (rawMigrationList.trimStart().startsWith('{')) throw error;
  reportedRows = rawMigrationList.split('\n').flatMap((line) => {
    const cells = line
      .replaceAll('`', '')
      .replaceAll('│', '|')
      .replaceAll('┃', '|')
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length < 2) return [];
    if (!cells.slice(0, 2).some((cell) => versionPattern.test(cell))) return [];
    return [[cells[0] ?? '', cells[1] ?? '']];
  });
}
const localReported = [];
const remoteReported = [];
for (const [local, remote] of reportedRows) {
  if (
    !versionPattern.test(local) ||
    !versionPattern.test(remote) ||
    local !== remote
  ) {
    throw new Error('hosted migration parity mismatch');
  }
  localReported.push(local);
  remoteReported.push(remote);
}
if (
  JSON.stringify(localVersions) !== JSON.stringify(localReported) ||
  JSON.stringify(localVersions) !== JSON.stringify(remoteReported)
) {
  throw new Error('hosted migration history is incomplete');
}
process.stdout.write(
  createHash('sha256').update(JSON.stringify(remoteReported)).digest('hex'),
);
NODE
 )"
[[ "$remote_history_sha256" =~ ^[0-9a-f]{64}$ ]]

mode=production
evidence_path="$promotion_metadata_path"
if [[ -n "$staging_evidence_path" ]]; then
  mode=staging
  evidence_path="$staging_evidence_path"
fi
LOCAL_MIGRATION_VERSIONS="$local_versions" \
REMOTE_HISTORY_SHA256="$remote_history_sha256" \
node --input-type=module - "$mode" "$evidence_path" "$expected_version" <<'NODE'
import {
  existsSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';

const [mode, evidencePath, expectedVersion] = process.argv.slice(2);
const appliedVersions = (process.env.LOCAL_MIGRATION_VERSIONS ?? '')
  .split('\n')
  .filter(Boolean);
let updated;
if (mode === 'staging') {
  if (existsSync(evidencePath)) {
    throw new Error('staging migration evidence already exists');
  }
  updated = {
    environment: 'staging',
    projectRef: process.env.SUPABASE_PROJECT_REF,
    sourceRevision: process.env.DEPLOY_SHA,
    ciRunId: process.env.CI_RUN_ID,
    migrationVersion: expectedVersion,
    appliedVersions,
    remoteHistorySha256: process.env.REMOTE_HISTORY_SHA256,
    state: 'expanded',
    forwardFixOnly: true,
    destructiveRollbackAttempted: false,
    verifiedAt: new Date().toISOString(),
  };
} else {
  const metadata = JSON.parse(readFileSync(evidencePath, 'utf8'));
  if (metadata?.artifact?.migrationVersion !== expectedVersion) {
    throw new Error('migration evidence version mismatch');
  }
  if (metadata?.migration?.state !== 'not_started') {
    throw new Error('hosted migration evidence must start at not_started');
  }
  updated = {
    ...metadata,
    migration: {
      state: 'expanded',
      forwardFixOnly: true,
      destructiveRollbackAttempted: false,
    },
    verifiedAt: new Date().toISOString(),
  };
}
const temporaryPath = `${evidencePath}.tmp`;
try {
  writeFileSync(temporaryPath, `${JSON.stringify(updated)}\n`, {
    flag: 'wx',
    mode: 0o600,
  });
  renameSync(temporaryPath, evidencePath);
} finally {
  if (existsSync(temporaryPath)) unlinkSync(temporaryPath);
}
NODE
