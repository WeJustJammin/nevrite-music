import { describe, expect, it, vi } from 'vitest';

import { verifyStagingRun } from '../infra/workflows/verify-staging-run.mjs';

const sourceRevision = 'a'.repeat(40);
const environment = {
  CI_RUN_ID: '20',
  CI_WORKFLOW_ID: '7',
  DEPLOY_SHA: sourceRevision,
  GITHUB_API_URL: 'https://api.github.test',
  GITHUB_REPOSITORY: 'owner/repo',
  GITHUB_TOKEN: 'synthetic-token',
};

const currentRun = (overrides: Record<string, unknown> = {}) => ({
  id: 20,
  workflow_id: 7,
  head_sha: sourceRevision,
  head_branch: 'main',
  status: 'completed',
  conclusion: 'success',
  ...overrides,
});

const fetchFor = (current: Record<string, unknown>, runs: unknown[]) =>
  vi.fn(
    async (url: string) =>
      new Response(
        JSON.stringify(
          url.includes('/actions/runs/20') ? current : { workflow_runs: runs },
        ),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
  );

describe('staging CI run freshness guard', () => {
  it('accepts the newest successful main-branch CI run', async () => {
    const fetchImpl = fetchFor(currentRun(), [currentRun()]);

    await expect(verifyStagingRun({ environment, fetchImpl })).resolves.toEqual(
      { ciRunId: '20', sourceRevision },
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('rejects a successful run superseded by a newer successful run', async () => {
    const fetchImpl = fetchFor(currentRun(), [
      currentRun(),
      currentRun({ id: 21, head_sha: 'b'.repeat(40) }),
    ]);

    await expect(verifyStagingRun({ environment, fetchImpl })).rejects.toThrow(
      'superseded by a newer success',
    );
  });

  it('rejects an older run while a newer main-branch CI run is active', async () => {
    const fetchImpl = fetchFor(currentRun(), [
      currentRun(),
      currentRun({ id: 21, status: 'in_progress', conclusion: null }),
    ]);

    await expect(verifyStagingRun({ environment, fetchImpl })).rejects.toThrow(
      'newer CI workflow run is still active',
    );
  });

  it('rejects a workflow event whose API identity does not match the artifact', async () => {
    const fetchImpl = fetchFor(currentRun({ head_sha: 'b'.repeat(40) }), [
      currentRun(),
    ]);

    await expect(verifyStagingRun({ environment, fetchImpl })).rejects.toThrow(
      'identity or conclusion is not promotable',
    );
  });
});
