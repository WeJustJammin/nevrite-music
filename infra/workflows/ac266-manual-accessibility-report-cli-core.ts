import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';

import { SafeReleaseIdSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
  ContentSchemaRegistryManualAccessibilityReportSchema,
  type ContentSchemaRegistryManualAccessibilityReport,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import { ReleaseEvidenceHostedOriginSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { parseStrictJson } from './parse-strict-json.ts';
import {
  AC266_REPORT_MAX_BYTES,
  Ac266ManualReportCliError,
  assertAc266PrivateHostPlatform,
  createAc266PrivateOutputDirectory,
  readAc266PrivateReport,
  writeAc266PrivateOutputs,
} from './ac266-manual-accessibility-report-cli-files.ts';

const MAX_REPORT_BYTES = AC266_REPORT_MAX_BYTES;
const MAX_BASE64_BYTES = 48 * 1024;
const VOICEOVER_DRAFT_NAME = 'voiceover-safari.json';
const NVDA_DRAFT_NAME = 'nvda-firefox.json';
const VOICEOVER_SECRET_NAME = 'AC266_VOICEOVER_REPORT_BASE64';
const NVDA_SECRET_NAME = 'AC266_NVDA_REPORT_BASE64';

type ManualAccessibilityPlatform =
  ContentSchemaRegistryManualAccessibilityReport['platform'];
type CommandName = 'template' | 'prepare';
type CliOptions = ReadonlyMap<string, string>;

interface ParsedCommand {
  readonly name: CommandName;
  readonly options: CliOptions;
}

interface CandidateIdentity {
  readonly sourceRevision: string;
  readonly deploymentId: string;
  readonly webOrigin: string;
}

export interface Ac266ManualAccessibilityCliResult {
  readonly exitCode: 0 | 1;
  readonly stdout: string;
  readonly stderr: string;
}

const fail = (message: string): never => {
  throw new Ac266ManualReportCliError(message);
};

const parseCommand = (arguments_: readonly string[]): ParsedCommand => {
  const normalized = arguments_[0] === '--' ? arguments_.slice(1) : arguments_;
  const name = normalized[0];
  if (name !== 'template' && name !== 'prepare')
    fail('Usage: AC266 report command must be template or prepare.');

  const allowed = new Set([
    '--output-dir',
    '--source-revision',
    '--deployment-id',
    '--web-origin',
    ...(name === 'prepare' ? ['--voiceover-report', '--nvda-report'] : []),
  ]);
  const options = new Map<string, string>();
  for (let index = 1; index < normalized.length; index += 1) {
    const option = normalized[index];
    if (option === undefined || !allowed.has(option))
      fail('AC266 report CLI options are invalid.');
    if (options.has(option)) fail('AC266 report CLI options are invalid.');
    const value = normalized[index + 1];
    if (value === undefined || value.startsWith('--'))
      fail('AC266 report CLI options are invalid.');
    options.set(option, value);
    index += 1;
  }

  const required = [
    '--output-dir',
    '--source-revision',
    '--deployment-id',
    '--web-origin',
    ...(name === 'prepare' ? ['--voiceover-report', '--nvda-report'] : []),
  ];
  if (required.some((option) => !options.has(option)))
    fail('AC266 report CLI options are incomplete.');
  return { name, options };
};

const requiredValue = (options: CliOptions, name: string): string => {
  const value = options.get(name);
  if (value === undefined) fail('AC266 report CLI options are incomplete.');
  return value;
};

const readCandidateIdentity = (options: CliOptions): CandidateIdentity => {
  const sourceRevision = requiredValue(options, '--source-revision');
  const deploymentId = requiredValue(options, '--deployment-id');
  const webOrigin = requiredValue(options, '--web-origin');
  if (
    !/^[a-f0-9]{40}$/u.test(sourceRevision) ||
    !SafeReleaseIdSchema.safeParse(deploymentId).success ||
    !ReleaseEvidenceHostedOriginSchema.safeParse(webOrigin).success
  )
    fail('AC266 candidate identity is invalid.');
  return { sourceRevision, deploymentId, webOrigin };
};

const createDraft = (
  platform: ManualAccessibilityPlatform,
  identity: CandidateIdentity,
): Buffer => {
  const draft = {
    criterion: 'P2-S09-AC-266',
    schemaVersion:
      CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_SCHEMA_VERSION,
    platform,
    sourceRevision: identity.sourceRevision,
    environment: 'staging',
    deploymentId: identity.deploymentId,
    webOrigin: identity.webOrigin,
    testedPath: CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
    workbenchState: {
      authentication: 'not_recorded',
      authorization: 'not_recorded',
      surface: 'not_recorded',
      signInPageObserved: null,
      accessDeniedPageObserved: null,
    },
    operatorId: '',
    osVersion: '',
    browserVersion: '',
    screenReaderVersion: '',
    startedAt: '',
    completedAt: '',
    outcome: 'not_recorded',
    redacted: false,
    screenReaderSmoke: 'not_recorded',
    checks: CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_REPORT_CHECKS.map(
      (check) => ({ check, outcome: 'not_recorded', observation: {} }),
    ),
  };
  return Buffer.from(`${JSON.stringify(draft, null, 2)}\n`, 'utf8');
};

const parseReport = (
  bytes: Buffer,
): ContentSchemaRegistryManualAccessibilityReport => {
  let source: string;
  let candidate: unknown;
  try {
    source = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
    candidate = parseStrictJson(source);
  } catch {
    fail('AC266 report must be strict UTF-8 JSON without duplicate keys.');
  }
  const parsed =
    ContentSchemaRegistryManualAccessibilityReportSchema.safeParse(candidate);
  if (!parsed.success) fail('AC266 report fails strict schema validation.');
  return parsed.data;
};

const encodeReport = (bytes: Buffer): Buffer => {
  if (bytes.length > MAX_REPORT_BYTES)
    fail('AC266 report exceeds the 32 KiB size limit.');
  const encoded = bytes.toString('base64');
  const output = Buffer.from(encoded, 'ascii');
  if (output.length > MAX_BASE64_BYTES)
    fail('AC266 base64 output exceeds the 48 KiB size limit.');
  return output;
};

const digest = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');

const assertCandidateMatch = (
  report: ContentSchemaRegistryManualAccessibilityReport,
  identity: CandidateIdentity,
): void => {
  if (
    report.sourceRevision !== identity.sourceRevision ||
    report.deploymentId !== identity.deploymentId ||
    report.webOrigin !== identity.webOrigin ||
    report.environment !== 'staging'
  )
    fail('AC266 reports do not match the explicit staging candidate identity.');
};

const template = async (
  options: CliOptions,
): Promise<Ac266ManualAccessibilityCliResult> => {
  const identity = readCandidateIdentity(options);
  const directory = await createAc266PrivateOutputDirectory(
    requiredValue(options, '--output-dir'),
  );
  await writeAc266PrivateOutputs(directory, [
    {
      name: VOICEOVER_DRAFT_NAME,
      content: createDraft('mac_safari_voiceover', identity),
    },
    {
      name: NVDA_DRAFT_NAME,
      content: createDraft('windows_firefox_nvda', identity),
    },
  ]);
  return {
    exitCode: 0,
    stdout:
      'Created incomplete AC266 drafts for mac_safari_voiceover and windows_firefox_nvda.',
    stderr: '',
  };
};

const prepare = async (
  options: CliOptions,
): Promise<Ac266ManualAccessibilityCliResult> => {
  const identity = readCandidateIdentity(options);
  const voiceoverBytes = await readAc266PrivateReport(
    requiredValue(options, '--voiceover-report'),
    MAX_REPORT_BYTES,
  );
  const nvdaBytes = await readAc266PrivateReport(
    requiredValue(options, '--nvda-report'),
    MAX_REPORT_BYTES,
  );
  const voiceover = parseReport(voiceoverBytes);
  const nvda = parseReport(nvdaBytes);
  if (
    voiceover.platform !== 'mac_safari_voiceover' ||
    nvda.platform !== 'windows_firefox_nvda'
  )
    fail(
      'AC266 report platform pair must match VoiceOver/Safari and NVDA/Firefox.',
    );
  assertCandidateMatch(voiceover, identity);
  assertCandidateMatch(nvda, identity);

  const voiceoverBase64 = encodeReport(voiceoverBytes);
  const nvdaBase64 = encodeReport(nvdaBytes);
  const directory = await createAc266PrivateOutputDirectory(
    requiredValue(options, '--output-dir'),
  );
  await writeAc266PrivateOutputs(directory, [
    { name: VOICEOVER_SECRET_NAME, content: voiceoverBase64 },
    { name: NVDA_SECRET_NAME, content: nvdaBase64 },
  ]);
  const candidateLabel = `${identity.sourceRevision} ${identity.deploymentId} ${new URL(identity.webOrigin).host}`;
  return {
    exitCode: 0,
    stdout: [
      `Prepared mac_safari_voiceover candidate ${candidateLabel}: ${voiceoverBytes.length} bytes sha256=${digest(voiceoverBytes)} file=${VOICEOVER_SECRET_NAME}`,
      `Prepared windows_firefox_nvda candidate ${candidateLabel}: ${nvdaBytes.length} bytes sha256=${digest(nvdaBytes)} file=${NVDA_SECRET_NAME}`,
    ].join('\n'),
    stderr: '',
  };
};

export const runAc266ManualAccessibilityReportCli = async (
  arguments_: readonly string[],
): Promise<Ac266ManualAccessibilityCliResult> => {
  try {
    assertAc266PrivateHostPlatform();
    const command = parseCommand(arguments_);
    return command.name === 'template'
      ? await template(command.options)
      : await prepare(command.options);
  } catch (error) {
    return {
      exitCode: 1,
      stdout: '',
      stderr:
        error instanceof Ac266ManualReportCliError
          ? error.message
          : 'AC266 report command failed safely.',
    };
  }
};
