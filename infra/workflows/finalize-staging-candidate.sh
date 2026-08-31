#!/usr/bin/env bash

set -euo pipefail

artifact_digest="$(
  sha256sum promotion-candidate/deployment-manifest.sha256 \
    | cut -d ' ' -f 1
)"
migration_version="$(
  find supabase/migrations -maxdepth 1 -type f -name '*.sql' \
    -printf '%f\n' \
    | sed -n 's/^\([0-9]\{14\}\)_.*/\1/p' \
    | sort \
    | tail -n 1
)"
test "$artifact_digest" != ""
test "$migration_version" != ""
test -f promotion-candidate/staging-verification.passed
gate_set="$(
  node --input-type=module - "$DEPLOY_SHA" <<'NODE'
import { readFileSync } from 'node:fs';

const expectedRevision = process.argv[2];
const evidence = JSON.parse(
  readFileSync('promotion-candidate/artifacts/ci-gate-evidence.json', 'utf8'),
);
const names = [
  'contracts', 'tests', 'security', 'accessibility', 'build',
  'migrationCompatibility', 'registry', 'sloRunbook', 'infrastructure',
  'artifactIdentity',
];
if (
  evidence.sourceRevision !== expectedRevision ||
  evidence.qualityResult !== 'success' ||
  evidence.databaseResult !== 'success' ||
  Object.keys(evidence.gates ?? {}).sort().join(',') !== names.sort().join(',') ||
  names.some(
    (name) =>
      evidence.gates[name] !== (name === 'infrastructure' ? false : true),
  )
) {
  throw new Error('CI gate evidence is incomplete or does not match the release');
}
evidence.gates.infrastructure = true;
process.stdout.write(JSON.stringify(evidence.gates));
NODE
)"
performance_evidence="$(
  node --experimental-strip-types - "$DEPLOY_SHA" <<'NODE'
import { readFileSync } from 'node:fs';
import { verifyPerformanceEvidence } from './infra/workflows/verify-performance-evidence.ts';

const expectedRevision = process.argv[2];
const performance = verifyPerformanceEvidence(
  {
    bundleBudget: JSON.parse(
      readFileSync(
        'promotion-candidate/artifacts/performance-evidence/bundle-budget.json',
        'utf8',
      ),
    ),
    apiP95: JSON.parse(
      readFileSync('promotion-candidate/api-p95-smoke.json', 'utf8'),
    ),
  },
  expectedRevision,
);
process.stdout.write(JSON.stringify(performance));
NODE
)"
verified_at="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
printf '{"artifact":{"artifactDigest":"%s","sourceRevision":"%s","buildId":"ci-%s","migrationVersion":"%s"},"environment":"production","gates":%s,"performance":%s,"migration":{"state":"not_started","forwardFixOnly":true,"destructiveRollbackAttempted":false},"verifiedAt":"%s"}\n' \
  "$artifact_digest" \
  "$DEPLOY_SHA" \
  "$CI_RUN_ID" \
  "$migration_version" \
  "$gate_set" \
  "$performance_evidence" \
  "$verified_at" \
  > promotion-candidate/promotion-metadata.json
