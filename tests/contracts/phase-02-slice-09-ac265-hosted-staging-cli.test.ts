import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  parseAc265HostedStagingEnvironment,
  verifyAc265HostedStagingEvidenceCli,
} from '../../infra/workflows/verify-ac265-hosted-staging-evidence.ts';
import { resolveAc265HostedStagingSelector } from '../../infra/workflows/verify-ac265-hosted-staging-evidence.ts';
import {
  REPOSITORY,
  SOURCE_SHA,
  STAGING_RUN_ATTEMPT,
  STAGING_RUN_ID,
  TOKEN,
  WEB_ORIGIN,
  createMockGitHubApi,
} from '../ac265-candidate-provenance.test-support.ts';
import { createStagingScopeFixture } from './ac265-staging-scope-verifier-test-support.ts';

const roots = new Set<string>();

afterEach(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
  roots.clear();
});

const reportArtifact = () => ({
  id: 4242,
  name: 'ac265-hosted-e2e-report-v3',
  size_in_bytes: 4096,
  url: 'https://api.github.com/repos/' + REPOSITORY + '/actions/artifacts/4242',
  archive_download_url:
    'https://api.github.com/repos/' +
    REPOSITORY +
    '/actions/artifacts/4242/zip',
  expired: false,
  created_at: '2026-09-08T13:25:00.000Z',
  digest: 'sha256:' + 'd'.repeat(64),
  workflow_run: {
    id: Number(STAGING_RUN_ID),
    repository_id: 2001,
    head_repository_id: 2001,
    head_branch: 'main',
    head_sha: SOURCE_SHA,
  },
});

const envFor = (archiveDirectory: string) => ({
  AC265_STAGING_RUN_ID: STAGING_RUN_ID,
  AC265_STAGING_RUN_ATTEMPT: STAGING_RUN_ATTEMPT,
  AC265_HOSTED_REPORT_ARCHIVE_DIR: archiveDirectory,
  STAGING_WEB_ORIGIN: WEB_ORIGIN,
  GITHUB_REPOSITORY: REPOSITORY,
  GITHUB_TOKEN: TOKEN,
});

describe('AC265 hosted staging evidence CLI', () => {
  it('resolves the exact report artifact selector for the run', async () => {
    const api = createMockGitHubApi({ stagingArtifacts: [reportArtifact()] });
    const selector = await resolveAc265HostedStagingSelector({
      env: envFor('/nonexistent'),
      fetchImpl: api.fetchImpl,
    });
    expect(selector.artifactId).toBe(4242);
    expect(selector.sourceRevision).toBe(SOURCE_SHA);
    expect(selector.archiveSha256).toBe('d'.repeat(64));
  });

  it('fails closed when the archive directory is not a directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'ac265-cli-'));
    roots.add(root);
    const directory = join(root, 'report-archive');
    writeFileSync(directory, 'not-a-directory');
    expect(() =>
      parseAc265HostedStagingEnvironment(envFor(directory)),
    ).toThrow();
  });

  it('fails closed when the archive directory holds more than one file', () => {
    const root = mkdtempSync(join(tmpdir(), 'ac265-cli-'));
    roots.add(root);
    const directory = join(root, 'report-archive');
    mkdirSync(directory);
    writeFileSync(join(directory, 'one.zip'), 'a');
    writeFileSync(join(directory, 'two.zip'), 'b');
    expect(() =>
      parseAc265HostedStagingEnvironment(envFor(directory)),
    ).toThrow();
  });

  it('fails closed when the run id or attempt is malformed', () => {
    expect(() =>
      parseAc265HostedStagingEnvironment({
        ...envFor('/tmp'),
        AC265_STAGING_RUN_ID: '0',
      }),
    ).toThrow();
    expect(() =>
      parseAc265HostedStagingEnvironment({
        ...envFor('/tmp'),
        AC265_STAGING_RUN_ATTEMPT: 'abc',
      }),
    ).toThrow();
  });

  it('fails closed when the protected bundle secret is absent', async () => {
    const fixture = createStagingScopeFixture();
    const api = createMockGitHubApi({
      stagingArtifacts: [
        reportArtifact({
          size_in_bytes: fixture.reportArchiveBytes,
          digest: 'sha256:' + fixture.reportArchiveSha256,
        }),
      ],
    });
    const root = mkdtempSync(join(tmpdir(), 'ac265-cli-'));
    roots.add(root);
    const directory = join(root, 'report-archive');
    mkdirSync(directory);
    writeFileSync(
      join(directory, 'report.zip'),
      readFileSync(fixture.reportArchivePath),
    );
    await expect(
      verifyAc265HostedStagingEvidenceCli({
        env: envFor(directory),
        workspaceRoot: root,
        fetchImpl: api.fetchImpl,
      }),
    ).rejects.toThrow();
  });
});
