#!/usr/bin/env bash

set -euo pipefail

: "${QUALITY_RESULT:?QUALITY_RESULT is required}"
: "${DATABASE_RESULT:?DATABASE_RESULT is required}"
: "${SOURCE_REVISION:?SOURCE_REVISION is required}"

if [[ ! "$SOURCE_REVISION" =~ ^[0-9a-f]{40}$ ]]; then
  echo "::error::SOURCE_REVISION must be a full lowercase commit SHA"
  exit 1
fi

result_gate() {
  if [[ "$1" == "success" ]]; then
    printf 'true'
  else
    printf 'false'
  fi
}

quality_gate="$(result_gate "$QUALITY_RESULT")"
database_gate="$(result_gate "$DATABASE_RESULT")"
contracts_gate="$(result_gate "$(cat .ci-release-gates/contracts.passed)")"
registry_gate="$(result_gate "$(cat .ci-release-gates/registry.passed)")"
slo_runbook_gate="$(result_gate "$(cat .ci-release-gates/slo-runbook.passed)")"
build_gate=false
artifact_gate=false
infrastructure_gate=false

test -f apps/worker/dist/index.js
test -f apps/web/dist/server/entry.mjs
test -d apps/web/dist/client
build_gate=true
artifact_gate=true

printf '{"sourceRevision":"%s","qualityResult":"%s","databaseResult":"%s","gates":{"contracts":%s,"tests":%s,"security":%s,"accessibility":%s,"build":%s,"migrationCompatibility":%s,"registry":%s,"sloRunbook":%s,"infrastructure":%s,"artifactIdentity":%s}}\n' \
  "$SOURCE_REVISION" \
  "$QUALITY_RESULT" \
  "$DATABASE_RESULT" \
  "$contracts_gate" \
  "$quality_gate" \
  "$quality_gate" \
  "$quality_gate" \
  "$build_gate" \
  "$database_gate" \
  "$registry_gate" \
  "$slo_runbook_gate" \
  "$infrastructure_gate" \
  "$artifact_gate" \
  > ci-gate-evidence.json

test "$quality_gate" = true
test "$database_gate" = true
test "$contracts_gate" = true
test "$registry_gate" = true
test "$slo_runbook_gate" = true
test "$build_gate" = true
test "$artifact_gate" = true
