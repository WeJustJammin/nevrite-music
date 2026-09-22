import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  AC265_GITHUB_OIDC_AUDIENCE,
  AC265_GITHUB_OIDC_ISSUER,
  AC265_GITHUB_OIDC_REPOSITORY,
  AC265_GITHUB_OIDC_REPOSITORY_ID,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  AC265_GITHUB_OIDC_SUBJECT,
  AC265_GITHUB_OIDC_WORKFLOW_REF,
} from '@wejammin/contracts';

import {
  Ac265GithubOidcError,
  createAc265GithubOidcVerifier,
} from './github-oidc';

const now = Date.parse('2026-09-14T02:00:00.000Z');
const sourceRevision = 'a'.repeat(40);
const jti = '20000000-0000-4000-8000-000000000002';
const currentRepository = 'WeJustJammin/wejammin';
const immutableSubject =
  'repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging';
const legacySubject = 'repo:WeJustJammin/nevrite-music:environment:staging';
const currentWorkflowRef =
  'WeJustJammin/wejammin/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main';
const legacyWorkflowRef =
  'WeJustJammin/nevrite-music/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main';

let privateKey: CryptoKey;
let publicKey: CryptoKey;
let otherPrivateKey: CryptoKey;
let keySet: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const pair = await generateKeyPair('RS256');
  const otherPair = await generateKeyPair('RS256');
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
  otherPrivateKey = otherPair.privateKey;
  keySet = createLocalJWKSet({
    keys: [
      {
        ...(await exportJWK(pair.publicKey)),
        alg: 'RS256',
        kid: 'github-test-key',
        use: 'sig',
      },
    ],
  });
});

const claims = () => ({
  repository: AC265_GITHUB_OIDC_REPOSITORY,
  repository_id: AC265_GITHUB_OIDC_REPOSITORY_ID,
  repository_owner: AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  repository_owner_id: AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  repository_visibility: 'public',
  ref: 'refs/heads/main',
  ref_type: 'branch',
  ref_protected: 'true',
  sha: sourceRevision,
  event_name: 'workflow_dispatch',
  environment: 'staging',
  runner_environment: 'github-hosted',
  workflow_ref: AC265_GITHUB_OIDC_WORKFLOW_REF,
  workflow_sha: sourceRevision,
  run_id: '34796668543',
  run_attempt: '1',
});

const token = async (
  overrides: Readonly<Record<string, unknown>> = {},
  signingKey = privateKey,
  kid = 'github-test-key',
): Promise<string> =>
  new SignJWT({
    ...claims(),
    iss: AC265_GITHUB_OIDC_ISSUER,
    aud: AC265_GITHUB_OIDC_AUDIENCE,
    sub: AC265_GITHUB_OIDC_SUBJECT,
    jti,
    iat: now / 1_000 - 5,
    nbf: now / 1_000 - 10,
    exp: now / 1_000 + 295,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'RS256', kid, typ: 'JWT' })
    .sign(signingKey);

describe('AC265 GitHub OIDC verifier', () => {
  it('verifies the signature and every immutable runner claim', async () => {
    const verify = createAc265GithubOidcVerifier({ keySet, now: () => now });

    await expect(
      verify(
        await token({
          sub: immutableSubject,
          repository: currentRepository,
          workflow_ref: currentWorkflowRef,
        }),
      ),
    ).resolves.toMatchObject({
      issuer: AC265_GITHUB_OIDC_ISSUER,
      audience: AC265_GITHUB_OIDC_AUDIENCE,
      subject: immutableSubject,
      repository: currentRepository,
      repositoryId: AC265_GITHUB_OIDC_REPOSITORY_ID,
      repositoryOwnerId: AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
      refProtected: true,
      runnerEnvironment: 'github-hosted',
      workflowRef: currentWorkflowRef,
      workflowSha: sourceRevision,
      sha: sourceRevision,
      githubRunId: '34796668543',
      githubRunAttempt: 1,
      jtiSha256:
        '951c747b3afcabb3d518a5da732894760c9ce2da6faa6cdc13c7e3ca5ae5bebd',
      tokenIssuedAt: '2026-09-14T01:59:55.000Z',
      tokenNotBefore: '2026-09-14T01:59:50.000Z',
      tokenExpiresAt: '2026-09-14T02:04:55.000Z',
    });
  });

  it('rejects compact tokens outside the bounded JWT format before key lookup', async () => {
    const verify = createAc265GithubOidcVerifier();

    await expect(verify('too-short')).rejects.toMatchObject({
      code: 'OIDC_IDENTITY_REJECTED',
    });
    await expect(verify('a'.repeat(16_385))).rejects.toMatchObject({
      code: 'OIDC_IDENTITY_REJECTED',
    });
  });

  it.each([0, Number.NaN, 1.5])(
    'rejects a verifier clock that is not a positive safe integer (%s)',
    async (currentTime) => {
      const verify = createAc265GithubOidcVerifier({
        keySet,
        now: () => currentTime,
      });

      await expect(verify(await token())).rejects.toMatchObject({
        code: 'OIDC_IDENTITY_REJECTED',
      });
    },
  );

  it('rejects unsafe key identifiers after signature verification', async () => {
    const verify = createAc265GithubOidcVerifier({
      keySet: async () => publicKey,
      now: () => now,
    });

    await expect(
      verify(await token({}, privateKey, 'unsafe key id')),
    ).rejects.toMatchObject({ code: 'OIDC_IDENTITY_REJECTED' });
  });

  it.each([
    ['repository ID', { repository_id: '1297208153' }],
    ['owner ID', { repository_owner_id: '305953067' }],
    ['legacy subject', { sub: legacySubject }],
    ['legacy repository', { repository: 'WeJustJammin/nevrite-music' }],
    ['legacy workflow ref', { workflow_ref: legacyWorkflowRef }],
    ['unprotected ref', { ref_protected: 'false' }],
    ['self-hosted runner', { runner_environment: 'self-hosted' }],
    [
      'workflow ref',
      {
        workflow_ref:
          'WeJustJammin/wejammin/.github/workflows/preflight-ac265-hosted-e2e.yml@refs/heads/main',
      },
    ],
  ])('rejects %s drift', async (_label, overrides) => {
    const verify = createAc265GithubOidcVerifier({ keySet, now: () => now });
    await expect(verify(await token(overrides))).rejects.toBeInstanceOf(
      Ac265GithubOidcError,
    );
  });

  it('requires the protected workflow and event revisions to match', async () => {
    const verify = createAc265GithubOidcVerifier({ keySet, now: () => now });
    await expect(
      verify(await token({ sha: 'b'.repeat(40) })),
    ).rejects.toMatchObject({ code: 'OIDC_IDENTITY_REJECTED' });
    await expect(
      verify(await token({ workflow_sha: 'b'.repeat(40) })),
    ).rejects.toMatchObject({ code: 'OIDC_IDENTITY_REJECTED' });
  });

  it('rejects an untrusted signature', async () => {
    const verify = createAc265GithubOidcVerifier({ keySet, now: () => now });
    await expect(
      verify(await token({}, otherPrivateKey)),
    ).rejects.toMatchObject({ code: 'OIDC_IDENTITY_REJECTED' });
  });

  it('rejects expired and excessive-lifetime tokens without echoing claims', async () => {
    const verify = createAc265GithubOidcVerifier({ keySet, now: () => now });
    const expired = await token({ exp: now / 1_000 - 6 });
    const excessive = await token({ exp: now / 1_000 + 301 });

    for (const candidate of [expired, excessive]) {
      let captured: unknown;
      try {
        await verify(candidate);
      } catch (error: unknown) {
        captured = error;
      }
      expect(captured).toMatchObject({ code: 'OIDC_IDENTITY_REJECTED' });
      expect(String(captured)).not.toContain(jti);
      expect(String(captured)).not.toContain(sourceRevision);
      expect(String(captured)).not.toContain(candidate);
    }
  });

  it('classifies a signing-key provider outage separately without exposing provider detail', async () => {
    const privateDetail = 'private-jwks-provider-detail';
    const verify = createAc265GithubOidcVerifier({
      keySet: async () => {
        throw new Error(privateDetail);
      },
      now: () => now,
    });

    let captured: unknown;
    try {
      await verify(await token());
    } catch (error: unknown) {
      captured = error;
    }
    expect(captured).toMatchObject({ code: 'OIDC_DEPENDENCY_UNAVAILABLE' });
    expect(String(captured)).not.toContain(privateDetail);
    expect(JSON.stringify(captured)).not.toContain(privateDetail);
  });

  it.each([
    ['a primitive', 'private primitive provider detail'],
    ['null', null],
  ])(
    'classifies a key-provider rejection with %s as unavailable',
    async (_label, reason) => {
      const verify = createAc265GithubOidcVerifier({
        keySet: async () => {
          throw reason;
        },
        now: () => now,
      });

      await expect(verify(await token())).rejects.toMatchObject({
        code: 'OIDC_DEPENDENCY_UNAVAILABLE',
      });
    },
  );

  it('treats a missing signing key as identity rejection, not provider outage', async () => {
    const missingKeyError = Object.assign(new Error('private key detail'), {
      code: 'ERR_JWKS_NO_MATCHING_KEY',
    });
    const verify = createAc265GithubOidcVerifier({
      keySet: async () => {
        throw missingKeyError;
      },
      now: () => now,
    });

    await expect(verify(await token())).rejects.toMatchObject({
      code: 'OIDC_IDENTITY_REJECTED',
    });
  });

  it('redacts provider errors whose code property traps during inspection', async () => {
    const privateProviderError = new Proxy(
      {},
      {
        has: () => {
          throw new Error('private provider detail');
        },
      },
    );
    const verify = createAc265GithubOidcVerifier({
      keySet: async () => {
        throw privateProviderError;
      },
      now: () => now,
    });

    await expect(verify(await token())).rejects.toMatchObject({
      code: 'OIDC_DEPENDENCY_UNAVAILABLE',
    });
  });
});
