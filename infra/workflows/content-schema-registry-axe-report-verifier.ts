import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  ContentSchemaRegistryAutomatedAxeReportSchema,
  type ContentSchemaRegistryAutomatedAxeReport,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import type { ContentSchemaRegistryOperationalReleaseEvidence } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { assertSafeAutomatedAxeEvidencePath } from './content-schema-registry-axe-report-files.ts';

export const CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_REPORT_PATH =
  'accessibility/axe.json';
export const CONTENT_SCHEMA_REGISTRY_AUTOMATED_AXE_DIGEST_PATH =
  'accessibility/axe.sha256';

export type ContentSchemaRegistryAutomatedAxeExpectedIdentity = Readonly<{
  sourceRevision: string;
  hostedEnvironment: 'staging' | 'production';
  hostedDeploymentId: string;
  hostedDeployedAt?: string;
  trustedCutoffAt?: string;
  webOrigin: string;
}>;

type AccessibilityExpectation = Pick<
  ContentSchemaRegistryOperationalReleaseEvidence['accessibility'],
  'environment' | 'deploymentId' | 'webOrigin' | 'axeSerious' | 'axeCritical'
>;

const sha256Bytes = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const SHA256_DIGEST_PATTERN = /^[0-9a-f]{64}$/;

export const parseContentSchemaRegistryAutomatedAxeDigestSidecar = (
  contents: string,
): string => {
  const match = /^([0-9a-f]{64}) {2}accessibility\/axe\.json(?:\r?\n)?$/u.exec(
    contents,
  );
  if (match === null)
    throw new Error(
      'Automated axe digest sidecar must be sha256sum output for accessibility/axe.json.',
    );
  return match[1];
};

const parseExpectedTimestamp = (
  name: 'hostedDeployedAt' | 'trustedCutoffAt',
  value: string | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed))
    throw new Error(`Automated axe expected ${name} timestamp is invalid.`);
  return parsed;
};

const expectedDigestFromInput = (
  reportPath: string,
  explicitDigest: string | undefined,
): string => {
  const sidecarPath = join(dirname(reportPath), 'axe.sha256');
  const source =
    explicitDigest === undefined ? sidecarPath : 'explicit CLI input';
  const supplied =
    explicitDigest ??
    (existsSync(sidecarPath)
      ? parseContentSchemaRegistryAutomatedAxeDigestSidecar(
          readFileSync(sidecarPath, 'utf8'),
        )
      : undefined);
  if (supplied === undefined)
    throw new Error(
      'An independently supplied expected SHA-256 digest is required (pass <expected-sha256> or provide accessibility/axe.sha256 beside the report).',
    );
  const digest = supplied.trim();
  if (!SHA256_DIGEST_PATTERN.test(digest))
    throw new Error(`Expected SHA-256 digest is invalid: ${source}.`);
  return digest;
};

const assertRegularFile = (path: string, label: string): void => {
  const stat = lstatSync(path);
  if (!stat.isFile())
    throw new Error(`Automated axe ${label} must be a regular file.`);
};

export const validateContentSchemaRegistryAutomatedAxeReport = (
  report: unknown,
  accessibility: AccessibilityExpectation | undefined,
  expectedIdentity: ContentSchemaRegistryAutomatedAxeExpectedIdentity,
): ContentSchemaRegistryAutomatedAxeReport => {
  const parsed =
    ContentSchemaRegistryAutomatedAxeReportSchema.safeParse(report);
  if (!parsed.success) throw new Error('Automated axe report body is invalid.');
  const value = parsed.data;
  if (value.sourceRevision !== expectedIdentity.sourceRevision)
    throw new Error(
      'Automated axe report does not match the expected source SHA.',
    );
  if (
    value.environment !== expectedIdentity.hostedEnvironment ||
    (accessibility !== undefined &&
      value.environment !== accessibility.environment)
  )
    throw new Error(
      'Automated axe report does not match the expected environment.',
    );
  if (
    value.deploymentId !== expectedIdentity.hostedDeploymentId ||
    (accessibility !== undefined &&
      value.deploymentId !== accessibility.deploymentId)
  )
    throw new Error(
      'Automated axe report does not match the expected deployment.',
    );
  if (
    value.webOrigin !== expectedIdentity.webOrigin ||
    (accessibility !== undefined && value.webOrigin !== accessibility.webOrigin)
  )
    throw new Error(
      'Automated axe report does not match the expected web origin.',
    );
  if (
    expectedIdentity.hostedDeployedAt !== undefined ||
    expectedIdentity.trustedCutoffAt !== undefined
  ) {
    const hostedDeployedAt = parseExpectedTimestamp(
      'hostedDeployedAt',
      expectedIdentity.hostedDeployedAt,
    );
    const trustedCutoffAt = parseExpectedTimestamp(
      'trustedCutoffAt',
      expectedIdentity.trustedCutoffAt,
    );
    if (hostedDeployedAt === undefined || trustedCutoffAt === undefined)
      throw new Error(
        'Automated axe expected identity must include hosted deployment and trusted cutoff timestamps together.',
      );
    if (hostedDeployedAt > trustedCutoffAt)
      throw new Error(
        'Automated axe expected identity time bounds are invalid.',
      );
    const startedAt = Date.parse(value.startedAt);
    const completedAt = Date.parse(value.completedAt);
    if (startedAt < hostedDeployedAt)
      throw new Error(
        'Automated axe report predates the expected hosted deployment.',
      );
    if (completedAt > trustedCutoffAt)
      throw new Error('Automated axe report exceeds the trusted cutoff.');
  }
  if (accessibility !== undefined) {
    if (value.axeSerious !== accessibility.axeSerious)
      throw new Error(
        'Automated axe serious total does not match the sidecar.',
      );
    if (value.axeCritical !== accessibility.axeCritical)
      throw new Error(
        'Automated axe critical total does not match the sidecar.',
      );
  }
  if (
    value.outcome !== 'passed' ||
    value.axeSerious !== 0 ||
    value.axeCritical !== 0
  )
    throw new Error('Automated axe report contains Serious/Critical findings.');
  return value;
};

export const validateContentSchemaRegistryAutomatedAxeReportBytes = (
  reportBytes: Uint8Array,
  expectedDigest: string,
  accessibility: AccessibilityExpectation | undefined,
  expectedIdentity: ContentSchemaRegistryAutomatedAxeExpectedIdentity,
): ContentSchemaRegistryAutomatedAxeReport => {
  if (sha256Bytes(reportBytes) !== expectedDigest)
    throw new Error(
      'Retained report digest does not match: automated accessibility.',
    );
  let report: unknown;
  try {
    report = JSON.parse(Buffer.from(reportBytes).toString('utf8'));
  } catch (error: unknown) {
    throw new Error('Automated axe retained report is not valid JSON.', {
      cause: error,
    });
  }
  return validateContentSchemaRegistryAutomatedAxeReport(
    report,
    accessibility,
    expectedIdentity,
  );
};

const run = (
  reportPath: string | undefined,
  sourceRevision: string | undefined,
  deploymentId: string | undefined,
  webOrigin: string | undefined,
  expectedDigest: string | undefined,
  hostedDeployedAt: string | undefined,
  trustedCutoffAt: string | undefined,
): void => {
  if (!reportPath || !sourceRevision || !deploymentId || !webOrigin)
    throw new Error(
      'Usage: content-schema-registry-axe-report-verifier.ts <report-json> <source-sha> <deployment-id> <web-origin> [expected-sha256] [hosted-deployed-at] [trusted-cutoff-at]',
    );
  const workspaceRoot = process.env.GITHUB_WORKSPACE;
  if (workspaceRoot === undefined || workspaceRoot.length === 0)
    throw new Error(
      'GITHUB_WORKSPACE is required to verify automated axe evidence paths.',
    );
  const safeReportPath = assertSafeAutomatedAxeEvidencePath(
    reportPath,
    workspaceRoot,
  );
  const safeDigestPath = assertSafeAutomatedAxeEvidencePath(
    join(dirname(safeReportPath), 'axe.sha256'),
    workspaceRoot,
  );
  assertRegularFile(safeReportPath, 'report');
  if (existsSync(safeDigestPath)) assertRegularFile(safeDigestPath, 'digest');
  const bytes = readFileSync(safeReportPath);
  const digest = expectedDigestFromInput(safeReportPath, expectedDigest);
  validateContentSchemaRegistryAutomatedAxeReportBytes(
    bytes,
    digest,
    undefined,
    {
      sourceRevision,
      hostedEnvironment: 'staging',
      hostedDeploymentId: deploymentId,
      hostedDeployedAt,
      trustedCutoffAt,
      webOrigin,
    },
  );
  process.stdout.write(
    `content_schema_registry_automated_axe_report=passed\nsha256=${sha256Bytes(bytes)}\n`,
  );
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
)
  run(
    process.argv[2],
    process.argv[3],
    process.argv[4],
    process.argv[5],
    process.argv[6],
    process.argv[7],
    process.argv[8],
  );
