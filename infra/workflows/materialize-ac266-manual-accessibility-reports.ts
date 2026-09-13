import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import {
  ContentSchemaRegistryManualAccessibilityReportSchema,
  type ContentSchemaRegistryManualAccessibilityReport,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import { parseStrictJson } from './parse-strict-json.ts';

export const AC266_MANUAL_ACCESSIBILITY_INTAKE_SCHEMA_VERSION =
  'ac266-manual-intake-v1' as const;
export const AC266_MANUAL_ACCESSIBILITY_INTAKE_WORKFLOW_PATH =
  '.github/workflows/intake-ac266-manual-accessibility-reports.yml' as const;
export const AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS = Object.freeze({
  voiceover: 'manual/voiceover-safari.json',
  nvda: 'manual/nvda-firefox.json',
});

const MAX_ENCODED_REPORT_CHARACTERS = 48 * 1024 - 4;
const MAX_DECODED_REPORT_BYTES = 32 * 1024;
const CANONICAL_BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const REPORT_PATHS = [
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.voiceover,
  AC266_MANUAL_ACCESSIBILITY_REPORT_PATHS.nvda,
] as const;

export interface MaterializeAc266ManualAccessibilityReportsOptions {
  readonly voiceoverReportBase64: string;
  readonly nvdaReportBase64: string;
  readonly expectedVoiceoverReportSha256: string;
  readonly expectedNvdaReportSha256: string;
  readonly runnerTemp: string;
  readonly privateEvidenceDir: string;
  readonly runId: string;
  readonly runAttempt: string;
}

export interface MaterializedAc266ManualAccessibilityReports {
  readonly releaseIdentity: Pick<
    ContentSchemaRegistryManualAccessibilityReport,
    | 'criterion'
    | 'schemaVersion'
    | 'sourceRevision'
    | 'environment'
    | 'deploymentId'
    | 'webOrigin'
  >;
  readonly reports: readonly [
    { readonly path: (typeof REPORT_PATHS)[0]; readonly sha256: string },
    { readonly path: (typeof REPORT_PATHS)[1]; readonly sha256: string },
  ];
  readonly privateEvidenceDir: string;
  readonly privateReportPaths: readonly [string, string];
}

const invalidBase64 = (): Error =>
  new Error('AC266 manual accessibility report secret is not canonical base64');

const decodeCanonicalBase64 = (value: string): Buffer => {
  if (typeof value !== 'string' || value.length === 0) throw invalidBase64();
  if (value.length > MAX_ENCODED_REPORT_CHARACTERS)
    throw new Error(
      'AC266 manual accessibility report exceeds the encoded size limit',
    );
  if (!CANONICAL_BASE64_PATTERN.test(value)) throw invalidBase64();

  const decoded = Buffer.from(value, 'base64');
  if (
    decoded.length === 0 ||
    decoded.length > MAX_DECODED_REPORT_BYTES ||
    decoded.toString('base64') !== value
  ) {
    if (decoded.length > MAX_DECODED_REPORT_BYTES)
      throw new Error(
        'AC266 manual accessibility report exceeds the decoded size limit',
      );
    throw invalidBase64();
  }

  return decoded;
};

const parseStrictReport = (
  raw: Buffer,
): ContentSchemaRegistryManualAccessibilityReport => {
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(raw);
  } catch {
    throw new Error(
      'AC266 manual accessibility report must be valid UTF-8 JSON',
    );
  }

  let candidate: unknown;
  try {
    candidate = parseStrictJson(source);
  } catch {
    throw new Error(
      'AC266 manual accessibility report must be valid UTF-8 JSON',
    );
  }

  const parsed =
    ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(candidate);
  if (!parsed.success)
    throw new Error(
      'AC266 manual accessibility report failed strict schema validation',
    );

  return parsed.data;
};

const assertRunMetadata = (runId: string, runAttempt: string): void => {
  if (!/^\d+$/u.test(runId) || !/^\d+$/u.test(runAttempt))
    throw new Error(
      'AC266 manual accessibility intake run metadata is invalid',
    );
};

const resolvePrivateEvidenceDirectory = (
  runnerTemp: string,
  privateEvidenceDir: string,
  runId: string,
  runAttempt: string,
): { readonly runnerTemp: string; readonly privateEvidenceDir: string } => {
  assertRunMetadata(runId, runAttempt);
  if (
    typeof runnerTemp !== 'string' ||
    runnerTemp.length === 0 ||
    !isAbsolute(runnerTemp) ||
    typeof privateEvidenceDir !== 'string' ||
    privateEvidenceDir.length === 0 ||
    !isAbsolute(privateEvidenceDir)
  )
    throw new Error(
      'AC266 private evidence directory must be a non-empty absolute path',
    );

  const runnerTempPath = resolve(runnerTemp);
  const privateEvidencePath = resolve(privateEvidenceDir);
  const expectedPath = join(
    runnerTempPath,
    `ac266-private-evidence-${runId}-${runAttempt}`,
  );
  if (
    dirname(privateEvidencePath) !== runnerTempPath ||
    privateEvidencePath !== expectedPath
  )
    throw new Error(
      'AC266 private evidence directory must be the exact run-scoped child of RUNNER_TEMP',
    );

  return {
    runnerTemp: runnerTempPath,
    privateEvidenceDir: privateEvidencePath,
  };
};

const sameReleaseIdentity = (
  first: ContentSchemaRegistryManualAccessibilityReport,
  second: ContentSchemaRegistryManualAccessibilityReport,
): boolean =>
  first.criterion === second.criterion &&
  first.schemaVersion === second.schemaVersion &&
  first.sourceRevision === second.sourceRevision &&
  first.environment === second.environment &&
  first.deploymentId === second.deploymentId &&
  first.webOrigin === second.webOrigin;

const sha256 = (value: Buffer): string =>
  createHash('sha256').update(value).digest('hex');

const assertExpectedDigest = (value: string): void => {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/u.test(value))
    throw new Error(
      'AC266 expected report digests must be lowercase SHA-256 values',
    );
};

export const materializeAc266ManualAccessibilityReports = async (
  options: MaterializeAc266ManualAccessibilityReportsOptions,
): Promise<MaterializedAc266ManualAccessibilityReports> => {
  const { privateEvidenceDir } = resolvePrivateEvidenceDirectory(
    options.runnerTemp,
    options.privateEvidenceDir,
    options.runId,
    options.runAttempt,
  );
  assertExpectedDigest(options.expectedVoiceoverReportSha256);
  assertExpectedDigest(options.expectedNvdaReportSha256);
  const voiceoverBytes = decodeCanonicalBase64(options.voiceoverReportBase64);
  const nvdaBytes = decodeCanonicalBase64(options.nvdaReportBase64);
  const voiceoverSha256 = sha256(voiceoverBytes);
  const nvdaSha256 = sha256(nvdaBytes);
  if (
    voiceoverSha256 !== options.expectedVoiceoverReportSha256 ||
    nvdaSha256 !== options.expectedNvdaReportSha256
  )
    throw new Error(
      'AC266 manual accessibility report digest mismatch for the requested bytes',
    );

  const voiceover = parseStrictReport(voiceoverBytes);
  const nvda = parseStrictReport(nvdaBytes);

  if (
    voiceover.platform !== 'mac_safari_voiceover' ||
    nvda.platform !== 'windows_firefox_nvda'
  )
    throw new Error(
      'AC266 manual accessibility reports must match the fixed VoiceOver then NVDA platform tuple',
    );
  if (voiceover.environment !== 'staging' || nvda.environment !== 'staging')
    throw new Error('AC266 manual accessibility reports must identify staging');
  if (!sameReleaseIdentity(voiceover, nvda))
    throw new Error(
      'AC266 manual accessibility reports must share the same release identity',
    );

  const privateReportPaths = [
    join(privateEvidenceDir, ...REPORT_PATHS[0].split('/')),
    join(privateEvidenceDir, ...REPORT_PATHS[1].split('/')),
  ] as const;
  const privateReportDirectory = dirname(privateReportPaths[0]);

  let createdPrivateDirectory = false;
  try {
    await mkdir(privateEvidenceDir, { mode: 0o700 });
    createdPrivateDirectory = true;
    await mkdir(privateReportDirectory, { mode: 0o700 });
    await Promise.all([
      writeFile(privateReportPaths[0], voiceoverBytes, {
        flag: 'wx',
        mode: 0o600,
      }),
      writeFile(privateReportPaths[1], nvdaBytes, {
        flag: 'wx',
        mode: 0o600,
      }),
    ]);
  } catch {
    if (createdPrivateDirectory)
      await rm(privateEvidenceDir, { recursive: true, force: true });
    throw new Error(
      'AC266 manual accessibility reports could not be materialized safely',
    );
  }

  return {
    releaseIdentity: {
      criterion: voiceover.criterion,
      schemaVersion: voiceover.schemaVersion,
      sourceRevision: voiceover.sourceRevision,
      environment: voiceover.environment,
      deploymentId: voiceover.deploymentId,
      webOrigin: voiceover.webOrigin,
    },
    reports: [
      { path: REPORT_PATHS[0], sha256: voiceoverSha256 },
      { path: REPORT_PATHS[1], sha256: nvdaSha256 },
    ],
    privateEvidenceDir,
    privateReportPaths,
  };
};
