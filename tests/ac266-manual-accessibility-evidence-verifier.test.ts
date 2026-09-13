import * as fs from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH,
  CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION,
} from '../packages/contracts/src/content-schema-registry/operational-release-evidence-manual-accessibility-report.ts';
import {
  DEPLOYED_AT,
  INTAKE_RUN,
  INTAKE_RUN_STARTED_AT,
  INTAKE_SHA,
  NEWER_DEPLOYMENT,
  ORIGIN,
  OTHER_SHA,
  OTHER_STAGING_RUN,
  PATHS,
  RAW_OPERATOR_ID,
  RAW_REPORT_VERSION_VALUES,
  REPORT_COMPLETED_AT,
  REPO,
  SOURCE,
  STAGING_RUN,
  TOKEN,
  base64Reports,
  candidate,
  deploymentStatus,
  deployment,
  digest,
  invoke,
  invokeCli,
  makeFixture,
  report,
  run,
  stagingRunIdentity,
  statuses,
  type Api,
} from './ac266-manual-accessibility-evidence-verifier-support.ts';

let fixture: ReturnType<typeof makeFixture>;
beforeEach(() => {
  fixture = makeFixture();
  fixture.writeCandidate(candidate());
  fixture.writeStagingRunIdentity(stagingRunIdentity());
  fixture.writeReports();
});
afterEach(() => fs.rmSync(fixture.root, { recursive: true, force: true }));

// prettier-ignore
describe('AC266 manual accessibility evidence verifier', () => {
  it('verifies trusted identity and emits only hashes/statuses', async () => {
    const intake = fixture.writeReports();
    const { fetchImpl, result } = invoke(fixture);
    const manifest = await result as Record<string, unknown>;
    expect(manifest).toMatchObject({
      criterion: 'P2-S09-AC-266', status: 'verified', repository: REPO,
      sourceRevision: SOURCE, artifactDigest: 'd'.repeat(64), buildId: 'ci-1200',
      migrationVersion: '20260912010000', environment: 'staging', deploymentId: '2201',
      webOrigin: 'https://staging.example.com', stagingRunId: STAGING_RUN,
      stagingRunAttempt: '1', stagingDeployedAt: DEPLOYED_AT,
      manualReportRunId: INTAKE_RUN, manualReportRunAttempt: '1', manualReportRunHeadSha: INTAKE_SHA,
      trustedCutoffAt: INTAKE_RUN_STARTED_AT,
    });
    expect((manifest.reports as Array<Record<string, unknown>>)).toEqual(
      intake.reports.map(({ path, sha256 }) => ({ path, sha256, status: 'passed' })),
    );
    for (const raw of [TOKEN, RAW_OPERATOR_ID, ...RAW_REPORT_VERSION_VALUES,
      'staging-display-title-sentinel', 'intake-display-title-sentinel',
      'minimumNormalTextContrastRatio', 'workbenchState', CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_TESTED_PATH])
      expect(JSON.stringify(manifest)).not.toContain(raw);
    expect(manifest).not.toHaveProperty('observations');
    expect(manifest).not.toHaveProperty('checks');
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it('writes only the fixed sanitized CLI output and removes reports on success', async () => {
    const output = join(fixture.root, 'ac266-manual-evidence', 'verification-manifest.json');
    const untrusted = join(fixture.root, 'attacker-output.json'); const intake = fixture.writeReports();
    fs.rmSync(fixture.reportDirectory, { recursive: true });
    const manifest = await invokeCli(fixture, {}, {
      AC266_MANUAL_VERIFICATION_OUTPUT_PATH: untrusted, ...base64Reports(),
    });
    expect(manifest.reports).toEqual(intake.reports.map(({ path, sha256 }) => ({ path, sha256, status: 'passed' })));
    expect(fs.existsSync(output)).toBe(true);
    expect(fs.existsSync(untrusted)).toBe(false);
    expect(JSON.parse(fs.readFileSync(output, 'utf8'))).toEqual(manifest);
    expect(fs.existsSync(fixture.reportDirectory)).toBe(false);
  });

  it('removes materialized reports in a finally path when verification fails', async () => {
    fixture.writeReports();
    fs.rmSync(fixture.reportDirectory, { recursive: true });
    await expect(invokeCli(fixture, { failure: { endpoint: 'statuses', status: 500 } }, base64Reports()))
      .rejects.toThrow('AC266 manual accessibility evidence verification failed');
    expect(fs.existsSync(fixture.reportDirectory)).toBe(false);
  });

  it('strictly parses required environment and candidate identity', async () => {
    const baseline = { ...fixture.env };
    for (const key of Object.keys(baseline)) {
      Object.assign(fixture.env, baseline); fixture.env[key] = undefined;
      const { fetchImpl, result } = invoke(fixture);
      await expect(result).rejects.toThrow(); expect(fetchImpl).not.toHaveBeenCalled();
    }
    for (const [key, value] of [
      ['GITHUB_REPOSITORY', 'https://github.com/owner/repo'], ['GITHUB_REPOSITORY', '../repo'], ['GITHUB_TOKEN', '  '],
      ['DEPLOY_SHA', 'A'.repeat(40)], ['STAGING_RUN_ID', '1.2'],
      ['STAGING_WEB_ORIGIN', 'https://staging.example.com/path'],
      ['AC266_MANUAL_CANDIDATE_PATH', '../candidate/staging-artifact-identity.json'],
    ] as const) {
      Object.assign(fixture.env, baseline); fixture.env[key] = value;
      const { fetchImpl, result } = invoke(fixture);
      await expect(result).rejects.toThrow(); expect(fetchImpl).not.toHaveBeenCalled();
    }
    for (const patch of [
      { sourceRevision: OTHER_SHA }, { artifactDigest: 'bad' }, { buildId: '../build' },
      { migrationVersion: 'latest' }, { sourceRevision: undefined }, { unexpected: true },
    ]) {
      fixture.writeCandidate({ ...candidate(), ...patch });
      await expect(invoke(fixture).result).rejects.toThrow();
    }
    fixture.writeCandidate(JSON.parse(JSON.stringify(candidate())));
    fixture.writeCandidateBytes(JSON.stringify(candidate()).replace(
      `"artifactDigest":"${'d'.repeat(64)}"`,
      `"artifactDigest":"${'d'.repeat(64)}","artifactDigest":"${'d'.repeat(64)}"`));
    await expect(invoke(fixture).result).rejects.toThrow();
  });

  it('binds the candidate sidecar to the exact staging run and retry attempt', async () => {
    for (const patch of [
      { repository: 'fork/repo' }, { workflowPath: '.github/workflows/lookalike.yml' },
      { runId: OTHER_STAGING_RUN }, { runAttempt: '2' }, { headSha: OTHER_SHA }, { unexpected: true },
    ]) {
      fixture.writeStagingRunIdentity(stagingRunIdentity(patch));
      await expect(invoke(fixture).result).rejects.toThrow();
    }
    fixture.writeStagingRunIdentity(stagingRunIdentity());
    fixture.removeStagingRunIdentity();
    await expect(invoke(fixture).result).rejects.toThrow();
    fixture.writeStagingRunIdentity(stagingRunIdentity());
    await expect(invoke(fixture, { stagingRun: run('staging', { run_attempt: 2 }) }).result).rejects.toThrow();
    fixture.writeStagingRunIdentity(stagingRunIdentity({ runId: OTHER_STAGING_RUN }));
    await expect(invoke(fixture, { stagingRun: run('staging', { id: Number(OTHER_STAGING_RUN) }) }).result).rejects.toThrow();
    const sidecarPath = join(fixture.root, 'candidate', 'staging-run-identity.json');
    fixture.removeStagingRunIdentity();
    fs.symlinkSync('staging-artifact-identity.json', sidecarPath);
    await expect(invoke(fixture).result).rejects.toThrow();
  });

  it('requires exact run/deployment provenance; display_title is not authority', async () => {
    const invalid: Api[] = [
      ...[
        { repository: { full_name: 'other/repo' } }, { head_repository: { full_name: 'fork/repo' } },
        { id: 99 }, { path: '.github/workflows/lookalike.yml' }, { event: 'workflow_dispatch' },
        { status: 'in_progress' }, { conclusion: 'failure' }, { head_sha: OTHER_SHA },
        { head_branch: 'feature' }, { run_attempt: 0 },
        { run_started_at: '2026-09-13T09:20:00.000Z' },
        { updated_at: '2026-09-13T13:00:00.001Z' },
      ].map((patch) => ({ stagingRun: run('staging', patch) })),
      ...[
        { repository: { full_name: 'other/repo' } }, { head_repository: { full_name: 'fork/repo' } },
        { id: 99 }, { path: '.github/workflows/lookalike.yml' }, { event: 'push' },
        { status: 'in_progress' }, { conclusion: 'failure' }, { head_branch: 'feature' },
        { run_attempt: 2 }, { run_started_at: null },
      ].map((patch) => ({ intakeRun: run('intake', patch) })),
      { deployments: [deployment({ id: 99 })] },
      { deployments: [deployment({ environment: 'production' })] },
      { deployments: [deployment({ sha: OTHER_SHA })] },
      {
        deployments: [deployment({ created_at: '2026-09-13T09:29:59.999Z' })],
      },
      {
        deployments: [deployment({ created_at: '2026-09-13T10:16:00.000Z' })],
        statuses: statuses({ created_at: '2026-09-13T10:16:00.000Z' }),
      },
      { statuses: statuses({ state: 'failure' }) }, { statuses: statuses({ state: 'inactive' }) },
      { statuses: statuses({ state: 'deployed' }) },
      { statuses: statuses({ environment: 'production' }) },
      { statuses: statuses({ environment_url: 'https://other.example.com' }) },
      { statuses: statuses({ environment_url: null }) },
      { statuses: statuses({ created_at: 'not-a-time' }) },
    ];
    for (const api of invalid) await expect(invoke(fixture, api).result).rejects.toThrow();
    await expect(invoke(fixture, { stagingRun: run('staging', {
      path: '.github/workflows/lookalike.yml', display_title: '.github/workflows/deploy-staging.yml',
    }) }).result).rejects.toThrow();
  });

  it('rejects a newer successful deployment at report start or through completion', async () => {
    for (const [createdAt, completedAt] of [
      ['2026-09-13T10:30:00.000Z', '2026-09-13T10:45:00.000Z'],
      ['2026-09-13T11:15:00.000Z', '2026-09-13T11:30:00.000Z'],
      ['2026-09-13T11:40:00.000Z', REPORT_COMPLETED_AT],
    ]) {
      const newer = deployment({ id: Number(NEWER_DEPLOYMENT), sha: OTHER_SHA, created_at: createdAt });
      const api = {
        deployments: [deployment(), newer],
        statusesByDeployment: { [NEWER_DEPLOYMENT]: statuses({ created_at: completedAt }) },
      };
      await expect(invoke(fixture, api).result).rejects.toThrow();
    }
    const later = deployment({ id: Number(NEWER_DEPLOYMENT), sha: OTHER_SHA, created_at: '2026-09-13T11:50:00.000Z' });
    await expect(invoke(fixture, {
      deployments: [deployment(), later],
      statusesByDeployment: { [NEWER_DEPLOYMENT]: statuses({ created_at: '2026-09-13T11:55:00.000Z' }) },
    }).result).resolves.toMatchObject({ status: 'verified' });
    const pendingAtReportEnd = deployment({
      id: Number(NEWER_DEPLOYMENT),
      sha: OTHER_SHA,
      created_at: '2026-09-13T11:40:00.000Z',
    });
    await expect(invoke(fixture, {
      deployments: [deployment(), pendingAtReportEnd],
      statusesByDeployment: {
        [NEWER_DEPLOYMENT]: statuses({
          created_at: '2026-09-13T11:55:00.000Z',
          environment_url: 'https://future-staging.example.com',
        }),
      },
    }).result).resolves.toMatchObject({ status: 'verified' });
  });

  it('checks the latest staging deployment through each report completion', async () => {
    fixture.writeReports({
      [PATHS[1]]: report(PATHS[1], {
        startedAt: '2026-09-13T11:10:00.000Z',
        completedAt: '2026-09-13T11:50:00.000Z',
      }),
    });
    const newer = deployment({
      id: Number(NEWER_DEPLOYMENT),
      sha: OTHER_SHA,
      created_at: '2026-09-13T11:46:00.000Z',
    });
    await expect(
      invoke(fixture, {
        deployments: [deployment(), newer],
        statusesByDeployment: {
          [NEWER_DEPLOYMENT]: statuses({
            created_at: '2026-09-13T11:47:00.000Z',
          }),
        },
      }).result,
    ).rejects.toThrow();
  });

  it('accepts normal selected lifecycle states but requires success at report time', async () => {
    const selectedHistory = [
      deploymentStatus(4, 'success', DEPLOYED_AT, ORIGIN),
      deploymentStatus(3, 'in_progress', '2026-09-13T09:43:00.000Z'),
      deploymentStatus(2, 'queued', '2026-09-13T09:42:00.000Z'),
      deploymentStatus(1, 'waiting', '2026-09-13T09:41:00.000Z'),
    ];
    await expect(
      invoke(fixture, { statuses: selectedHistory }).result,
    ).resolves.toMatchObject({
      status: 'verified',
      stagingDeployedAt: DEPLOYED_AT,
    });

    const stillInProgress = [
      deploymentStatus(5, 'in_progress', '2026-09-13T10:30:00.000Z'),
      ...selectedHistory,
    ];
    await expect(
      invoke(fixture, { statuses: stillInProgress }).result,
    ).rejects.toThrow();
  });

  it('rejects newer active or failed deployments before report completion', async () => {
    const newer = deployment({
      id: Number(NEWER_DEPLOYMENT),
      sha: OTHER_SHA,
      created_at: '2026-09-13T10:30:00.000Z',
    });
    for (const [state, createdAt] of [
      ['in_progress', '2026-09-13T11:15:00.000Z'],
      ['failure', '2026-09-13T11:30:00.000Z'],
      ['error', '2026-09-13T11:30:00.000Z'],
      ['inactive', '2026-09-13T11:30:00.000Z'],
      ['success', '2026-09-13T11:30:00.000Z'],
      ['pending', '2026-09-13T11:30:00.000Z'],
    ]) {
      await expect(
        invoke(fixture, {
          deployments: [deployment(), newer],
          statusesByDeployment: {
            [NEWER_DEPLOYMENT]: [
              deploymentStatus(
                10,
                state,
                createdAt,
                state === 'success' ? ORIGIN : '',
              ),
            ],
          },
        }).result,
      ).rejects.toThrow();
    }

    await expect(
      invoke(fixture, {
        deployments: [deployment(), newer],
        statusesByDeployment: {
          [NEWER_DEPLOYMENT]: [
            deploymentStatus(12, 'failure', '2026-09-13T12:00:00.000Z'),
            deploymentStatus(11, 'in_progress', '2026-09-13T11:30:00.000Z'),
            deploymentStatus(10, 'queued', '2026-09-13T10:45:00.000Z'),
            deploymentStatus(9, 'waiting', '2026-09-13T10:40:00.000Z'),
          ],
        },
      }).result,
    ).rejects.toThrow();

    await expect(
      invoke(fixture, {
        deployments: [deployment(), newer],
        statusesByDeployment: {
          [NEWER_DEPLOYMENT]: [
            deploymentStatus(10, 'queued', '2026-09-13T10:45:00.000Z'),
            deploymentStatus(9, 'waiting', '2026-09-13T10:40:00.000Z'),
          ],
        },
      }).result,
    ).resolves.toMatchObject({ status: 'verified' });
  });

  it('binds intake manifest to its run and permits only fixed report paths/files', async () => {
    const manifest = fixture.writeReports();
    for (const patch of [{ schemaVersion: 'unknown' }, { workflowPath: '.github/workflows/lookalike.yml' },
      { repository: 'attacker/repo' }, { runId: '9999' }, { runAttempt: '2' }, { headSha: OTHER_SHA }, { unexpected: true }]) {
      fixture.writeManifest({ ...manifest, ...patch });
      await expect(invoke(fixture).result).rejects.toThrow();
    }
    fixture.writeManifestBytes(JSON.stringify(manifest).replace(`"repository":"${REPO}"`,
      `"repository":"${REPO}","repository":"${REPO}"`));
    await expect(invoke(fixture).result).rejects.toThrow();
    for (const reports of [
      [{ ...manifest.reports[0], path: '../candidate/staging-artifact-identity.json' }, manifest.reports[1]],
      [...manifest.reports, { path: 'manual/extra.json', sha256: 'e'.repeat(64) }],
    ]) {
      fixture.writeManifest({ ...manifest, reports });
      await expect(invoke(fixture).result).rejects.toThrow();
    }
    fixture.writeManifest(manifest);
    const duplicateReport = JSON.stringify(report(PATHS[0])).replace(`"sourceRevision":"${SOURCE}"`,
      `"sourceRevision":"${SOURCE}","sourceRevision":"${SOURCE}"`) + '\n';
    fixture.writeReport(PATHS[0], duplicateReport);
    fixture.writeManifest({ ...manifest, reports: [
      { path: PATHS[0], sha256: digest(duplicateReport) }, manifest.reports[1],
    ] });
    await expect(invoke(fixture).result).rejects.toThrow();
    fixture.writeManifest(manifest);
    fs.writeFileSync(join(fixture.manualDirectory, 'extra.json'), '{}\n');
    await expect(invoke(fixture).result).rejects.toThrow();
  });

  it('strictly parses reports and cross-checks workbench, identity, chronology, and trusted intake time', async () => {
    for (const patch of [
      { testedPath: '/app/sign-in' },
      { workbenchState: { ...CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION, authentication: 'unauthenticated' } },
      { workbenchState: { ...CONTENT_SCHEMA_REGISTRY_MANUAL_ACCESSIBILITY_WORKBENCH_STATE_ATTESTATION, authorization: 'denied' } },
      { display_title: 'untrusted' }, { sourceRevision: OTHER_SHA }, { environment: 'production' },
      { deploymentId: '9999' }, { webOrigin: 'https://other.example.com' },
      { platform: 'windows_firefox_nvda' }, { startedAt: '2026-09-13T09:59:59.000Z' },
      { startedAt: '2026-09-13T07:00:00.000Z', completedAt: '2026-09-13T07:30:00.000Z' },
      { completedAt: '2026-09-13T12:00:01.000Z' },
      { startedAt: '2026-09-13T10:00:00.000Z', completedAt: '2026-09-13T09:00:00.000Z' },
    ]) {
      fixture.writeReports({ [PATHS[0]]: report(PATHS[0], patch) });
      await expect(invoke(fixture).result).rejects.toThrow();
    }
    const manifest = fixture.writeReports(); const malformed = '{malformed json}\n';
    fixture.writeReport(PATHS[0], malformed);
    fixture.writeManifest({ ...manifest, reports: [
      { path: PATHS[0], sha256: digest(malformed) }, manifest.reports[1],
    ] });
    await expect(invoke(fixture).result).rejects.toThrow();
    fixture.writeReports();
    fixture.writeManifest({ ...manifest, reports: [
      { ...manifest.reports[0], sha256: '0'.repeat(64) }, manifest.reports[1],
    ] });
    await expect(invoke(fixture).result).rejects.toThrow();
  });

  it('fails closed on GitHub permission, 404, rate-limit, and server errors', async () => {
    for (const endpoint of ['stagingRun', 'deploymentList', 'statuses', 'intakeRun'] as const)
      for (const failure of [
        { status: 403, headers: { 'x-ratelimit-remaining': '0' } }, { status: 404 },
        { status: 429, headers: { 'retry-after': '60' } }, { status: 500 },
      ])
        await expect(invoke(fixture, { failure: { endpoint, ...failure } }).result).rejects.toThrow();
  });
});
