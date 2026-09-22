import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { runProductionEnvironmentVerification } from '../infra/workflows/verify-production-environment.ts';

const sourceSha = 'a'.repeat(40);
const environment = {
  CONFIRM_VERIFICATION: 'true',
  GITHUB_API_URL: 'https://api.github.com',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_REPOSITORY: 'WeJustJammin/wejammin',
  GITHUB_TOKEN: 'test-token',
  SOURCE_SHA: sourceSha,
} as const;

const protectedEnvironment = {
  name: 'production',
  can_admins_bypass: false,
  protection_rules: [
    {
      id: 64231612,
      type: 'required_reviewers',
      reviewers: [
        {
          type: 'User',
          reviewer: { id: 305953066, login: 'WeJustJammin' },
        },
      ],
      prevent_self_review: false,
    },
  ],
  deployment_branch_policy: {
    protected_branches: true,
    custom_branch_policies: false,
  },
} as const;

describe('production environment preflight entrypoint', () => {
  it('verifies the live production protection without staging or provider access', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(protectedEnvironment), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      }),
    );

    await expect(
      runProductionEnvironmentVerification(environment, fetchImpl),
    ).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      'https://api.github.com/repos/WeJustJammin/wejammin/environments/production',
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toEqual({
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer test-token',
      'X-GitHub-Api-Version': '2022-11-28',
    });
  });

  it('rejects a missing explicit confirmation before calling GitHub', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      runProductionEnvironmentVerification(
        { ...environment, CONFIRM_VERIFICATION: 'false' },
        fetchImpl,
      ),
    ).rejects.toThrow('explicit production confirmation');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ['branch', { GITHUB_REF: 'refs/heads/release' }],
    ['source SHA', { SOURCE_SHA: 'not-a-commit' }],
    ['repository', { GITHUB_REPOSITORY: 'missing-owner' }],
    ['API URL', { GITHUB_API_URL: 'http://api.github.test' }],
    ['token', { GITHUB_TOKEN: '' }],
  ])(
    'rejects an invalid %s mapping before network access',
    async (_, patch) => {
      const fetchImpl = vi.fn<typeof fetch>();

      await expect(
        runProductionEnvironmentVerification(
          { ...environment, ...patch },
          fetchImpl,
        ),
      ).rejects.toBeInstanceOf(Error);
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('executes through a symlink and fails closed before network access', () => {
    const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-production-env-'));
    try {
      const verifierPath = join(
        process.cwd(),
        'infra/workflows/verify-production-environment.ts',
      );
      const symlinkedVerifierPath = join(
        sandbox,
        'verify-production-environment.ts',
      );
      symlinkSync(verifierPath, symlinkedVerifierPath);
      const result = spawnSync(
        process.execPath,
        ['--experimental-strip-types', symlinkedVerifierPath],
        {
          encoding: 'utf8',
          env: { ...process.env, CONFIRM_VERIFICATION: 'false' },
        },
      );

      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('explicit production confirmation');
      expect(result.stderr).not.toContain('test-token');
    } finally {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });
});
