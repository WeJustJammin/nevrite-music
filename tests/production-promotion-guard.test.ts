import { describe, expect, it } from 'vitest';

import {
  verifyProductionPromotionInputs,
  type ProductionPromotionGuardOptions,
} from '../infra/workflows/verify-production-promotion.ts';

const sourceSha = 'a'.repeat(40);
const stagingRunId = '33425837272';

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
};

const protectedEnvironment = {
  name: 'production',
  can_admins_bypass: false,
  protection_rules: [
    { type: 'required_reviewers', reviewers: [{ type: 'User', id: 1 }] },
  ],
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
  environment?: object;
  requests?: string[];
  run?: object;
}>;

const fakeFetch =
  ({
    branchPolicies = exactMainBranchPolicies,
    environment = protectedEnvironment,
    requests = [],
    run = stagingRun,
  }: FakeGitHubResponses = {}): typeof fetch =>
  async (input) => {
    const url = String(input);
    requests.push(url);
    const body = url.includes('/actions/runs/')
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
    ).resolves.toBeUndefined();
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
    ).resolves.toBeUndefined();
    expect(requests).toHaveLength(3);
    expect(requests[2]).toMatch(/deployment-branch-policies$/u);
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
