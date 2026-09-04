import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  verifyProductionPromotionInputs,
  writeCiRunOutput,
  type ProductionPromotionGuardOptions,
} from '../infra/workflows/verify-production-promotion.ts';

const sourceSha = 'a'.repeat(40);
const stagingRunId = '33425837272';
const ciRunId = '33453707003';

const ciWorkflow = {
  id: 346315227,
  name: 'CI',
  path: '.github/workflows/ci.yml',
  state: 'active',
};

const stagingRun = {
  id: Number(stagingRunId),
  name: 'Deploy staging',
  path: '.github/workflows/deploy-staging.yml',
  workflow_id: 346315228,
  event: 'workflow_run',
  status: 'completed',
  conclusion: 'success',
  head_branch: 'main',
  head_sha: sourceSha,
  created_at: '2026-09-03T12:00:00.000Z',
};

const ciRun = {
  id: Number(ciRunId),
  workflow_id: ciWorkflow.id,
  name: 'CI',
  event: 'push',
  status: 'completed',
  conclusion: 'success',
  head_branch: 'main',
  head_sha: sourceSha,
  created_at: '2026-09-03T10:00:00.000Z',
  completed_at: '2026-09-03T11:00:00.000Z',
};

const canonicalProductionReviewer = {
  type: 'User',
  reviewer: {
    login: 'NEVRITERob',
    id: 214191222,
  },
};

const canonicalProductionReviewRule = {
  id: 64231612,
  type: 'required_reviewers',
  reviewers: [canonicalProductionReviewer],
  prevent_self_review: true,
};

const protectedEnvironment = {
  name: 'production',
  can_admins_bypass: false,
  protection_rules: [canonicalProductionReviewRule],
  deployment_branch_policy: {
    protected_branches: true,
    custom_branch_policies: false,
  },
};

const exactMainBranchPolicies = {
  total_count: 1,
  branch_policies: [{ id: 1, name: 'main', type: 'branch' }],
};

const options = (): ProductionPromotionGuardOptions => ({
  apiUrl: 'https://api.github.com',
  confirmProduction: true,
  ref: 'refs/heads/main',
  repository: 'WeJustJammin/nevrite-music',
  sourceSha,
  stagingRunId,
  token: 'test-token',
});

type FakeGitHubResponses = Readonly<{
  branchPolicies?: object;
  ciRuns?: object[];
  ciWorkflow?: object;
  environment?: object;
  requests?: string[];
  run?: object;
}>;

const fakeFetch =
  ({
    branchPolicies = exactMainBranchPolicies,
    ciRuns = [ciRun],
    ciWorkflow: workflow = ciWorkflow,
    environment = protectedEnvironment,
    requests = [],
    run = stagingRun,
  }: FakeGitHubResponses = {}): typeof fetch =>
  async (input) => {
    const url = String(input);
    requests.push(url);
    const body = url.endsWith('/actions/workflows/ci.yml')
      ? workflow
      : url.includes('/actions/workflows/346315227/runs')
        ? { total_count: ciRuns.length, workflow_runs: ciRuns }
        : url.includes(`/actions/runs/${stagingRunId}`)
          ? run
          : url.endsWith('/deployment-branch-policies')
            ? branchPolicies
            : environment;
    return new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  };

describe('production promotion input guard', () => {
  it('accepts only a successful main Deploy staging run and protected environment', async () => {
    await expect(
      verifyProductionPromotionInputs(options(), fakeFetch()),
    ).resolves.toEqual({ ciRunId });
  });

  it('resolves exactly one successful CI run for the selected source SHA', async () => {
    const requests: string[] = [];
    await expect(
      verifyProductionPromotionInputs(options(), fakeFetch({ requests })),
    ).resolves.toEqual({ ciRunId });
    expect(requests).toHaveLength(4);
    expect(requests[1]).toMatch(/actions\/workflows\/ci\.yml$/u);
    expect(requests[2]).toContain('branch=main');
    expect(requests[2]).toContain('status=success');
    expect(requests[2]).toContain(`head_sha=${sourceSha}`);
  });

  it('writes only a validated CI run ID to the GitHub output file', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-production-output-'));
    const outputPath = join(sandbox, 'github-output');
    try {
      writeCiRunOutput(ciRunId, outputPath);
      expect(readFileSync(outputPath, 'utf8')).toBe(`ci_run_id=${ciRunId}\n`);
      expect(() => writeCiRunOutput('123\nmalicious', outputPath)).toThrow(
        'CI run ID must be numeric',
      );
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('rejects zero or multiple successful CI runs for the source SHA', async () => {
    for (const ciRuns of [[], [ciRun, { ...ciRun, id: Number(ciRunId) + 1 }]]) {
      await expect(
        verifyProductionPromotionInputs(options(), fakeFetch({ ciRuns })),
      ).rejects.toThrow('exactly one successful CI run');
    }
  });

  it('rejects CI identity drift and completion after the staging run', async () => {
    const invalidRuns = [
      { ...ciRun, name: 'Deploy staging' },
      { ...ciRun, event: 'schedule' },
      { ...ciRun, status: 'in_progress' },
      { ...ciRun, conclusion: 'failure' },
      { ...ciRun, head_branch: 'release' },
      { ...ciRun, head_sha: 'b'.repeat(40) },
      {
        ...ciRun,
        completed_at: '2026-09-03T13:00:00.000Z',
      },
    ];
    for (const run of invalidRuns) {
      await expect(
        verifyProductionPromotionInputs(
          options(),
          fakeFetch({ ciRuns: [run] }),
        ),
      ).rejects.toThrow(/CI|staging/u);
    }
  });

  it('rejects a differently named or located CI workflow', async () => {
    for (const ciWorkflowResponse of [
      { ...ciWorkflow, name: 'Deploy staging' },
      { ...ciWorkflow, path: '.github/workflows/deploy-staging.yml' },
    ]) {
      await expect(
        verifyProductionPromotionInputs(
          options(),
          fakeFetch({ ciWorkflow: ciWorkflowResponse }),
        ),
      ).rejects.toThrow('CI workflow identity');
    }
  });

  it('rejects missing explicit confirmation before contacting GitHub', async () => {
    const requests: string[] = [];
    await expect(
      verifyProductionPromotionInputs(
        { ...options(), confirmProduction: false },
        fakeFetch({ requests }),
      ),
    ).rejects.toThrow('explicit production confirmation');
    expect(requests).toHaveLength(0);
  });

  it('rejects a staging run whose immutable SHA does not match the selected source', async () => {
    await expect(
      verifyProductionPromotionInputs(
        options(),
        fakeFetch({ run: { ...stagingRun, head_sha: 'b'.repeat(40) } }),
      ),
    ).rejects.toThrow('source SHA');
  });

  it('accepts an exact custom main branch policy', async () => {
    const requests: string[] = [];
    await expect(
      verifyProductionPromotionInputs(
        options(),
        fakeFetch({
          environment: {
            ...protectedEnvironment,
            deployment_branch_policy: {
              protected_branches: false,
              custom_branch_policies: true,
            },
          },
          requests,
        }),
      ),
    ).resolves.toEqual({ ciRunId });
    expect(requests).toHaveLength(5);
    expect(requests[4]).toMatch(/deployment-branch-policies$/u);
  });

  it('rejects a staging run with the wrong workflow ID or path', async () => {
    await expect(
      verifyProductionPromotionInputs(
        options(),
        fakeFetch({ run: { ...stagingRun, workflow_id: 1 } }),
      ),
    ).rejects.toThrow('workflow identity');

    await expect(
      verifyProductionPromotionInputs(
        options(),
        fakeFetch({ run: { ...stagingRun, path: '.github/workflows/ci.yml' } }),
      ),
    ).rejects.toThrow('workflow identity');
  });

  it('rejects an environment without reviewers or protected branch policy', async () => {
    await expect(
      verifyProductionPromotionInputs(
        options(),
        fakeFetch({
          environment: {
            ...protectedEnvironment,
            protection_rules: [],
          },
        }),
      ),
    ).rejects.toThrow('production reviewers');

    for (const deploymentBranchPolicy of [
      { protected_branches: false, custom_branch_policies: false },
      { protected_branches: true, custom_branch_policies: true },
    ]) {
      await expect(
        verifyProductionPromotionInputs(
          options(),
          fakeFetch({
            environment: {
              ...protectedEnvironment,
              deployment_branch_policy: deploymentBranchPolicy,
            },
          }),
        ),
      ).rejects.toThrow('protected branch policy');
    }
  });

  it('rejects administrator bypass even when reviewers are configured', async () => {
    await expect(
      verifyProductionPromotionInputs(
        options(),
        fakeFetch({
          environment: { ...protectedEnvironment, can_admins_bypass: true },
        }),
      ),
    ).rejects.toThrow('administrator bypass');
  });

  it('rejects required reviewers when self-review is not prevented', async () => {
    for (const preventSelfReview of [false, undefined]) {
      await expect(
        verifyProductionPromotionInputs(
          options(),
          fakeFetch({
            environment: {
              ...protectedEnvironment,
              protection_rules: [
                {
                  ...canonicalProductionReviewRule,
                  ...(preventSelfReview === undefined
                    ? { prevent_self_review: undefined }
                    : { prevent_self_review: preventSelfReview }),
                },
              ],
            },
          }),
        ),
      ).rejects.toThrow('self-review');
    }
  });

  it('requires exactly one canonical production reviewer rule and reviewer', async () => {
    const invalidEnvironments = [
      {
        ...protectedEnvironment,
        protection_rules: [{ ...canonicalProductionReviewRule, id: 99999999 }],
      },
      {
        ...protectedEnvironment,
        protection_rules: [
          {
            ...canonicalProductionReviewRule,
            reviewers: [
              { type: 'User', reviewer: { login: 'attacker', id: 1 } },
            ],
          },
        ],
      },
      {
        ...protectedEnvironment,
        protection_rules: [
          {
            ...canonicalProductionReviewRule,
            reviewers: [
              canonicalProductionReviewer,
              { type: 'User', reviewer: { login: 'attacker', id: 2 } },
            ],
          },
        ],
      },
      {
        ...protectedEnvironment,
        protection_rules: [
          canonicalProductionReviewRule,
          { ...canonicalProductionReviewRule, id: 64231613 },
        ],
      },
      {
        ...protectedEnvironment,
        protection_rules: [
          {
            ...canonicalProductionReviewRule,
            reviewers: [
              {
                type: 'Team',
                reviewer: { login: 'NEVRITERob', id: 214191222 },
              },
            ],
          },
        ],
      },
      {
        ...protectedEnvironment,
        protection_rules: [
          {
            ...canonicalProductionReviewRule,
            reviewers: [{ type: 'User', id: 214191222 }],
          },
        ],
      },
    ];

    for (const environment of invalidEnvironments) {
      await expect(
        verifyProductionPromotionInputs(options(), fakeFetch({ environment })),
      ).rejects.toThrow('exact configured production reviewer');
    }
  });

  it('executes the production preflight when invoked through a symlink', () => {
    const sandbox = mkdtempSync(
      join(tmpdir(), 'wejammin-production-promotion-'),
    );
    try {
      const verifierPath = join(
        process.cwd(),
        'infra/workflows/verify-production-promotion.ts',
      );
      const symlinkedVerifierPath = join(
        sandbox,
        'verify-production-promotion.ts',
      );
      symlinkSync(verifierPath, symlinkedVerifierPath);
      const result = spawnSync(
        process.execPath,
        ['--experimental-strip-types', symlinkedVerifierPath],
        {
          encoding: 'utf8',
          env: { ...process.env, CONFIRM_PRODUCTION: 'false' },
        },
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('explicit production confirmation');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  it('rejects tag, wildcard, and extra custom deployment policies', async () => {
    const invalidPolicySets = [
      [{ id: 1, name: 'main', type: 'tag' }],
      [{ id: 1, name: 'release/*', type: 'branch' }],
      [
        { id: 1, name: 'main', type: 'branch' },
        { id: 2, name: 'release/*', type: 'branch' },
      ],
    ];

    for (const branchPolicies of invalidPolicySets) {
      await expect(
        verifyProductionPromotionInputs(
          options(),
          fakeFetch({
            branchPolicies: {
              total_count: branchPolicies.length,
              branch_policies: branchPolicies,
            },
            environment: {
              ...protectedEnvironment,
              deployment_branch_policy: {
                protected_branches: false,
                custom_branch_policies: true,
              },
            },
          }),
        ),
      ).rejects.toThrow('exact main branch policy');
    }
  });
});
