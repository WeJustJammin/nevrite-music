import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { materializeAc266ManualAccessibilityIntake } from '../infra/workflows/materialize-ac266-manual-accessibility-intake.ts';
import { createManualAccessibilityReport } from './contracts/phase-02-slice-09-manual-accessibility-report-fixture.ts';

type ManualAccessibilityPlatform =
  'mac_safari_voiceover' | 'windows_firefox_nvda';

const REPORT_PATHS = [
  'manual/voiceover-safari.json',
  'manual/nvda-firefox.json',
] as const;
const APPROVED_WORKFLOW_PATH =
  '.github/workflows/intake-ac266-manual-accessibility-reports.yml';
const RUN_ID = '1234567890';
const RUN_ATTEMPT = '2';

const reportFor = (platform: ManualAccessibilityPlatform) =>
  createManualAccessibilityReport(platform);

const encode = (value: unknown): string =>
  Buffer.from(JSON.stringify(value), 'utf8').toString('base64');

const activeTempRoots: string[] = [];

const createInput = async (
  voiceoverReport = reportFor('mac_safari_voiceover'),
  nvdaReport = reportFor('windows_firefox_nvda'),
) => {
  const root = await mkdtemp(join(tmpdir(), 'ac266-manual-intake-'));
  activeTempRoots.push(root);
  const runnerTemp = join(root, 'runner-temp');
  const workspaceRoot = join(root, 'workspace');
  await mkdir(runnerTemp);
  await mkdir(workspaceRoot);
  const voiceoverReportBase64 = encode(voiceoverReport);
  const nvdaReportBase64 = encode(nvdaReport);

  return {
    repository: 'WeJustJammin/nevrite-music',
    runId: RUN_ID,
    runAttempt: RUN_ATTEMPT,
    headSha: 'b'.repeat(40),
    runnerTemp,
    privateEvidenceDir: join(
      runnerTemp,
      `ac266-private-evidence-${RUN_ID}-${RUN_ATTEMPT}`,
    ),
    workspaceRoot,
    voiceoverReportBase64,
    nvdaReportBase64,
    expectedVoiceoverReportSha256: createHash('sha256')
      .update(Buffer.from(voiceoverReportBase64, 'base64'))
      .digest('hex'),
    expectedNvdaReportSha256: createHash('sha256')
      .update(Buffer.from(nvdaReportBase64, 'base64'))
      .digest('hex'),
  };
};

afterEach(async () => {
  await Promise.all(
    activeTempRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('AC266 manual accessibility intake materializer', () => {
  it('emits only the minimized intake manifest and removes private raw reports', async () => {
    const input = await createInput();
    const voiceoverRaw = Buffer.from(input.voiceoverReportBase64, 'base64');
    const nvdaRaw = Buffer.from(input.nvdaReportBase64, 'base64');

    const manifest = await materializeAc266ManualAccessibilityIntake(input);

    expect(manifest).toEqual({
      schemaVersion: 'ac266-manual-intake-v1',
      repository: 'WeJustJammin/nevrite-music',
      runId: RUN_ID,
      runAttempt: RUN_ATTEMPT,
      headSha: 'b'.repeat(40),
      workflowPath: APPROVED_WORKFLOW_PATH,
      reports: [
        {
          path: REPORT_PATHS[0],
          sha256: createHash('sha256').update(voiceoverRaw).digest('hex'),
        },
        {
          path: REPORT_PATHS[1],
          sha256: createHash('sha256').update(nvdaRaw).digest('hex'),
        },
      ],
    });

    const manifestPath = join(
      input.workspaceRoot,
      'manual/intake-manifest.json',
    );
    const serializedManifest = await readFile(manifestPath, 'utf8');
    expect(JSON.parse(serializedManifest)).toEqual(manifest);
    expect(await readdir(join(input.workspaceRoot, 'manual'))).toEqual([
      'intake-manifest.json',
    ]);
    await expect(stat(input.privateEvidenceDir)).rejects.toThrow();
    for (const sensitiveValue of [
      'op_0123456789abcdef0123456789abcdef',
      'op_abcdef0123456789abcdef0123456789',
      'macos-15.6',
      'windows-11.24h2',
      'safari-18.6',
      'firefox-142.0',
      'minimumNormalTextContrastRatio',
    ])
      expect(serializedManifest).not.toContain(sensitiveValue);
  });

  it('rejects duplicate JSON object keys and cleans the exact private directory', async () => {
    const input = await createInput();
    await mkdir(input.privateEvidenceDir);
    const source = Buffer.from(input.voiceoverReportBase64, 'base64').toString(
      'utf8',
    );
    const duplicated = source.replace(
      '"criterion":"P2-S09-AC-266",',
      '"criterion":"P2-S09-AC-266","criterion":"P2-S09-AC-266",',
    );
    expect(duplicated).not.toBe(source);
    const bytes = Buffer.from(duplicated, 'utf8');

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        voiceoverReportBase64: bytes.toString('base64'),
        expectedVoiceoverReportSha256: createHash('sha256')
          .update(bytes)
          .digest('hex'),
      }),
    ).rejects.toThrow(/valid UTF-8 JSON/u);
    await expect(stat(input.privateEvidenceDir)).rejects.toThrow();
  });

  it('rejects non-canonical, malformed, missing, and oversized secret encodings', async () => {
    const validInput = await createInput();
    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...validInput,
        voiceoverReportBase64: `${validInput.voiceoverReportBase64}\n`,
      }),
    ).rejects.toThrow(/base64/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...validInput,
        voiceoverReportBase64: 'not-base64!',
      }),
    ).rejects.toThrow(/base64/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...validInput,
        nvdaReportBase64: '',
      }),
    ).rejects.toThrow(/base64/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...validInput,
        nvdaReportBase64: Buffer.alloc(48 * 1024).toString('base64'),
      }),
    ).rejects.toThrow(/size/u);
  });

  it('requires exact lowercase SHA-256 inputs and binds both reports before writing', async () => {
    const input = await createInput();

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        expectedVoiceoverReportSha256: 'A'.repeat(64),
      }),
    ).rejects.toThrow(/lowercase SHA-256/u);
    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        expectedNvdaReportSha256: 'A'.repeat(64),
      }),
    ).rejects.toThrow(/lowercase SHA-256/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        expectedVoiceoverReportSha256: '0'.repeat(64),
      }),
    ).rejects.toThrow(/digest mismatch/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        expectedNvdaReportSha256: '0'.repeat(64),
      }),
    ).rejects.toThrow(/digest mismatch/u);
    await expect(stat(input.privateEvidenceDir)).rejects.toThrow();
    await expect(
      stat(join(input.workspaceRoot, 'manual/intake-manifest.json')),
    ).rejects.toThrow();

    const manifest = await materializeAc266ManualAccessibilityIntake(input);
    expect(manifest.runAttempt).toBe(RUN_ATTEMPT);
  });

  it('requires each strict report schema, exact platform pair, and shared staging release identity', async () => {
    const wrongPlatform = await createInput(
      reportFor('windows_firefox_nvda'),
      reportFor('mac_safari_voiceover'),
    );
    await expect(
      materializeAc266ManualAccessibilityIntake(wrongPlatform),
    ).rejects.toThrow(/platform/u);

    const mismatchedShaReport = {
      ...reportFor('windows_firefox_nvda'),
      sourceRevision: 'c'.repeat(40),
    };
    const mismatchedIdentity = await createInput(
      reportFor('mac_safari_voiceover'),
      mismatchedShaReport,
    );
    await expect(
      materializeAc266ManualAccessibilityIntake(mismatchedIdentity),
    ).rejects.toThrow(/same release identity/u);

    const productionReport = {
      ...reportFor('windows_firefox_nvda'),
      environment: 'production',
    };
    const wrongEnvironment = await createInput(
      reportFor('mac_safari_voiceover'),
      productionReport,
    );
    await expect(
      materializeAc266ManualAccessibilityIntake(wrongEnvironment),
    ).rejects.toThrow(/staging/u);

    const unknownFieldReport = {
      ...reportFor('mac_safari_voiceover'),
      privateNotes: 'must be rejected',
    };
    const unknownField = await createInput(
      unknownFieldReport,
      reportFor('windows_firefox_nvda'),
    );
    await expect(
      materializeAc266ManualAccessibilityIntake(unknownField),
    ).rejects.toThrow(/schema/u);
  });

  it('rejects unsafe platform versions, offset timestamps, and incomplete target coverage at intake', async () => {
    const mac = reportFor('mac_safari_voiceover');
    const windows = reportFor('windows_firefox_nvda');
    const wrongVersion = await createInput(
      { ...mac, browserVersion: 'firefox-142.0' },
      windows,
    );
    await expect(
      materializeAc266ManualAccessibilityIntake(wrongVersion),
    ).rejects.toThrow(/schema/u);

    const nonUtc = await createInput(
      { ...mac, startedAt: '2026-09-13T07:00:00-04:00' },
      windows,
    );
    await expect(
      materializeAc266ManualAccessibilityIntake(nonUtc),
    ).rejects.toThrow(/schema/u);

    const incompleteCoverage = {
      ...mac,
      checks: mac.checks.map((check) =>
        check.check === 'target_size'
          ? {
              ...check,
              observation: {
                ...check.observation,
                eligibleTargetCount: check.observation.eligibleTargetCount + 1,
              },
            }
          : check,
      ),
    } as typeof mac;
    const incomplete = await createInput(incompleteCoverage, windows);
    await expect(
      materializeAc266ManualAccessibilityIntake(incomplete),
    ).rejects.toThrow(/schema/u);
  });

  it('rejects untrusted run metadata and a private path outside the exact runner-temp child', async () => {
    const input = await createInput();
    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        privateEvidenceDir: join(input.runnerTemp, 'other-directory'),
      }),
    ).rejects.toThrow(/private evidence directory/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        runAttempt: '2/../3',
      }),
    ).rejects.toThrow(/run metadata/u);

    await expect(
      materializeAc266ManualAccessibilityIntake({
        ...input,
        headSha: 'not-a-commit',
      }),
    ).rejects.toThrow(/run metadata/u);
  });
});
