#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';

const fail = (message) => {
  throw new Error(`staging migration evidence ${message}`);
};

export const verifyStagingMigrationEvidence = ({
  evidence,
  expectedCiRunId,
  expectedProjectRef,
  expectedSourceRevision,
  localVersions,
}) => {
  if (
    typeof evidence !== 'object' ||
    evidence === null ||
    Array.isArray(evidence)
  ) {
    fail('must be an object');
  }
  const expectedKeys = [
    'appliedVersions',
    'ciRunId',
    'destructiveRollbackAttempted',
    'environment',
    'forwardFixOnly',
    'migrationVersion',
    'projectRef',
    'remoteHistorySha256',
    'sourceRevision',
    'state',
    'verifiedAt',
  ];
  if (
    JSON.stringify(Object.keys(evidence).sort()) !==
    JSON.stringify(expectedKeys)
  ) {
    fail('has an invalid shape');
  }
  const migrationVersion = localVersions.at(-1);
  const historyDigest = createHash('sha256')
    .update(JSON.stringify(localVersions))
    .digest('hex');
  if (
    evidence.environment !== 'staging' ||
    evidence.sourceRevision !== expectedSourceRevision ||
    evidence.ciRunId !== expectedCiRunId ||
    !/^[a-z0-9][a-z0-9-]{5,62}$/u.test(evidence.projectRef) ||
    (expectedProjectRef !== undefined &&
      evidence.projectRef !== expectedProjectRef) ||
    evidence.migrationVersion !== migrationVersion ||
    JSON.stringify(evidence.appliedVersions) !==
      JSON.stringify(localVersions) ||
    evidence.remoteHistorySha256 !== historyDigest ||
    evidence.state !== 'expanded' ||
    evidence.forwardFixOnly !== true ||
    evidence.destructiveRollbackAttempted !== false ||
    typeof evidence.verifiedAt !== 'string' ||
    new Date(evidence.verifiedAt).toISOString() !== evidence.verifiedAt
  ) {
    fail('is incomplete or does not match the release');
  }
  return evidence;
};

const [
  evidencePath,
  expectedSourceRevision,
  expectedCiRunId,
  expectedProjectRef,
] = process.argv.slice(2);
if (!evidencePath || !/^[0-9a-f]{40}$/u.test(expectedSourceRevision ?? '')) {
  fail('requires an exact source revision');
}
if (!/^[0-9]+$/u.test(expectedCiRunId ?? '')) {
  fail('requires an exact CI run ID');
}
const localVersions = readdirSync('supabase/migrations')
  .map((name) => name.match(/^([0-9]{14,20})_.*[.]sql$/u)?.[1])
  .filter(Boolean)
  .sort();
if (localVersions.length === 0) fail('requires local migrations');
verifyStagingMigrationEvidence({
  evidence: JSON.parse(readFileSync(evidencePath, 'utf8')),
  expectedCiRunId,
  expectedProjectRef,
  expectedSourceRevision,
  localVersions,
});
