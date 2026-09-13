import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { TextDecoder } from 'node:util';

import {
  AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION,
  AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS,
  type Ac266ManualAccessibilityIntakeManifest,
} from './materialize-ac266-manual-accessibility-intake.ts';
import {
  ContentSchemaRegistryManualAccessibilityReportSchema,
  type ContentSchemaRegistryManualAccessibilityReport,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import {
  ReleaseArtifactIdentitySchema,
  type ReleaseArtifactIdentity,
} from '../../packages/contracts/src/release-artifact.ts';
import { parseStrictJson } from './parse-strict-json.ts';

const MAX_CANDIDATE_BYTES = 16 * 1024;
const MAX_MANIFEST_BYTES = 16 * 1024;
const MAX_REPORT_BYTES = 32 * 1024;
export const AC266_STAGING_RUN_IDENTITY_SCHEMA_VERSION =
  'ac266-staging-run-identity-v1' as const;
export const AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH =
  '.github/workflows/deploy-staging.yml' as const;
const REPORT_PATHS = [
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.voiceover,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.nvda,
] as const;

export interface Ac266ManualAccessibilityLocalEvidence {
  readonly candidate: ReleaseArtifactIdentity;
  readonly stagingRunIdentity: Ac266StagingRunIdentity;
  readonly intakeManifest: Ac266ManualAccessibilityIntakeManifest;
  readonly reports: readonly [
    {
      readonly path: (typeof REPORT_PATHS)[0];
      readonly sha256: string;
      readonly report: ContentSchemaRegistryManualAccessibilityReport;
    },
    {
      readonly path: (typeof REPORT_PATHS)[1];
      readonly sha256: string;
      readonly report: ContentSchemaRegistryManualAccessibilityReport;
    },
  ];
}

export interface Ac266StagingRunIdentity {
  readonly schemaVersion: typeof AC266_STAGING_RUN_IDENTITY_SCHEMA_VERSION;
  readonly repository: string;
  readonly workflowPath: typeof AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH;
  readonly runId: string;
  readonly runAttempt: string;
  readonly headSha: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const exactKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));

const assertDirectory = async (path: string): Promise<void> => {
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error();
};

const assertFixedParents = async (
  root: string,
  segments: readonly string[],
): Promise<string> => {
  await assertDirectory(root);
  let directory = root;
  for (const segment of segments) {
    directory = join(directory, segment);
    await assertDirectory(directory);
  }
  return directory;
};

const readRegularFile = async (
  path: string,
  maxBytes: number,
): Promise<Buffer> => {
  const fileHandle = await open(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const info = await fileHandle.stat();
    if (!info.isFile() || info.size < 1 || info.size > maxBytes)
      throw new Error();
    const bytes = await fileHandle.readFile();
    if (bytes.length !== info.size || bytes.length > maxBytes)
      throw new Error();
    return bytes;
  } finally {
    await fileHandle.close();
  }
};

const parseBytes = (bytes: Buffer): unknown => {
  const text = new TextDecoder('utf-8', {
    fatal: true,
    ignoreBOM: true,
  }).decode(bytes);
  return parseStrictJson(text);
};

const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');

const parseManifest = (
  value: unknown,
): Ac266ManualAccessibilityIntakeManifest => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      'schemaVersion',
      'repository',
      'runId',
      'runAttempt',
      'headSha',
      'workflowPath',
      'reports',
    ]) ||
    value.schemaVersion !== AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION ||
    value.workflowPath !== AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH ||
    typeof value.repository !== 'string' ||
    typeof value.runId !== 'string' ||
    typeof value.runAttempt !== 'string' ||
    !/^[1-9][0-9]{0,5}$/u.test(value.runAttempt) ||
    typeof value.headSha !== 'string' ||
    !/^[a-f0-9]{40}$/u.test(value.headSha) ||
    !Array.isArray(value.reports) ||
    value.reports.length !== REPORT_PATHS.length
  )
    throw new Error();

  const reports = value.reports.map((entry, index) => {
    if (
      !isRecord(entry) ||
      !exactKeys(entry, ['path', 'sha256']) ||
      entry.path !== REPORT_PATHS[index] ||
      typeof entry.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/u.test(entry.sha256)
    )
      throw new Error();
    return { path: entry.path, sha256: entry.sha256 };
  });

  return {
    schemaVersion: value.schemaVersion,
    repository: value.repository,
    runId: value.runId,
    runAttempt: value.runAttempt,
    headSha: value.headSha,
    workflowPath: value.workflowPath,
    reports: reports as Ac266ManualAccessibilityIntakeManifest['reports'],
  };
};

const parseStagingRunIdentity = (value: unknown): Ac266StagingRunIdentity => {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      'schemaVersion',
      'repository',
      'workflowPath',
      'runId',
      'runAttempt',
      'headSha',
    ]) ||
    value.schemaVersion !== AC266_STAGING_RUN_IDENTITY_SCHEMA_VERSION ||
    value.workflowPath !== AC266_STAGING_RUN_IDENTITY_WORKFLOW_PATH ||
    typeof value.repository !== 'string' ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(value.repository) ||
    typeof value.runId !== 'string' ||
    !/^[1-9][0-9]{0,18}$/u.test(value.runId) ||
    !Number.isSafeInteger(Number(value.runId)) ||
    typeof value.runAttempt !== 'string' ||
    !/^[1-9][0-9]{0,5}$/u.test(value.runAttempt) ||
    Number(value.runAttempt) > 100000 ||
    typeof value.headSha !== 'string' ||
    !/^[a-f0-9]{40}$/u.test(value.headSha)
  )
    throw new Error();
  return value as unknown as Ac266StagingRunIdentity;
};

export const readAc266ManualAccessibilityIntakeManifest = async (
  workspaceRoot: string,
): Promise<Ac266ManualAccessibilityIntakeManifest> => {
  const manifestParent = await assertFixedParents(workspaceRoot, [
    'manual-intake',
  ]);
  const bytes = await readRegularFile(
    join(manifestParent, 'intake-manifest.json'),
    MAX_MANIFEST_BYTES,
  );
  return parseManifest(parseBytes(bytes));
};

const parseReport = (
  value: unknown,
): ContentSchemaRegistryManualAccessibilityReport => {
  const parsed =
    ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(value);
  if (!parsed.success) throw new Error();
  return parsed.data;
};

export const readAc266ManualAccessibilityLocalEvidence = async (
  workspaceRoot: string,
  reportDirectory: string,
): Promise<Ac266ManualAccessibilityLocalEvidence> => {
  const candidateParent = await assertFixedParents(workspaceRoot, [
    'candidate',
  ]);
  const candidateBytes = await readRegularFile(
    join(candidateParent, 'staging-artifact-identity.json'),
    MAX_CANDIDATE_BYTES,
  );
  const candidateResult = ReleaseArtifactIdentitySchema.safeParse(
    parseBytes(candidateBytes),
  );
  if (!candidateResult.success) throw new Error();
  const stagingRunBytes = await readRegularFile(
    join(candidateParent, 'staging-run-identity.json'),
    MAX_CANDIDATE_BYTES,
  );
  const stagingRunIdentity = parseStagingRunIdentity(
    parseBytes(stagingRunBytes),
  );

  const intakeManifest =
    await readAc266ManualAccessibilityIntakeManifest(workspaceRoot);

  await assertDirectory(reportDirectory);
  const rootEntries = await readdir(reportDirectory);
  if (rootEntries.length !== 1 || rootEntries[0] !== 'manual')
    throw new Error();
  const reportsDirectory = await assertFixedParents(reportDirectory, [
    'manual',
  ]);
  const reportEntries = (await readdir(reportsDirectory)).sort();
  const expectedEntries = REPORT_PATHS.map((path) =>
    path.slice('manual/'.length),
  ).sort();
  if (
    reportEntries.length !== expectedEntries.length ||
    reportEntries.some((entry, index) => entry !== expectedEntries[index])
  )
    throw new Error();

  const parsedReports = [] as {
    path: (typeof REPORT_PATHS)[number];
    sha256: string;
    report: ContentSchemaRegistryManualAccessibilityReport;
  }[];
  for (const [index, path] of REPORT_PATHS.entries()) {
    const bytes = await readRegularFile(
      join(reportsDirectory, path.slice('manual/'.length)),
      MAX_REPORT_BYTES,
    );
    const reportDigest = sha256(bytes);
    if (reportDigest !== intakeManifest.reports[index]?.sha256)
      throw new Error();
    const report = parseReport(parseBytes(bytes));
    const expectedPlatform =
      index === 0 ? 'mac_safari_voiceover' : 'windows_firefox_nvda';
    if (report.platform !== expectedPlatform) throw new Error();
    parsedReports.push({ path, sha256: reportDigest, report });
  }

  return {
    candidate: candidateResult.data,
    stagingRunIdentity,
    intakeManifest,
    reports:
      parsedReports as unknown as Ac266ManualAccessibilityLocalEvidence['reports'],
  };
};
