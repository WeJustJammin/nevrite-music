import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it, vi } from 'vitest';

import {
  publishAc265HostedArtifactSourceManifest,
  resolveAc265HostedArtifactSourceSelectors,
} from '../infra/workflows/publish-ac265-hosted-artifact-source-manifest.ts';
import {
  AUTHORIZATION_REF,
  CANDIDATE_IDENTITY_SHA256,
  DEPLOYMENT_ID,
  MANIFEST_EXPIRES_AT,
  MANIFEST_ISSUED_AT,
  RUN_ID,
  RUNNER_CONTRACT_SHA256,
  SOURCE_REVISION,
  authorityTrustedKey,
  expectedBindings,
  signedManifest,
  trustedKey,
} from './ac265-hosted-artifact-source-manifest.fixtures.ts';

const CANDIDATE_REF =
  'ac265-candidate://staging/80000000-0000-4000-8000-000000000008';
const envBase = () => ({
  GITHUB_REPOSITORY: 'WeJustJammin/nevrite-music',
  GITHUB_REF: 'refs/heads/main',
  GITHUB_SHA: SOURCE_REVISION,
  GITHUB_EVENT_NAME: 'workflow_dispatch',
  GITHUB_WORKFLOW: 'AC265 protected source-manifest publication',
  GITHUB_RUN_ID: '333333333333',
  GITHUB_RUN_ATTEMPT: '1',
  GITHUB_TOKEN: 'step-scoped-token',
  AC265_AUTHORIZATION_REF: AUTHORIZATION_REF,
  AC265_CANDIDATE_REF: CANDIDATE_REF,
});

const validContextBundle = (): string =>
  Buffer.from(
    JSON.stringify({
      schemaVersion: 'ac265-hosted-artifact-source-manifest-context-v1',
      repository: 'WeJustJammin/nevrite-music',
      branch: 'main',
      sourceRevision: SOURCE_REVISION,
      authorizationRef: AUTHORIZATION_REF,
      candidateRef: CANDIDATE_REF,
      authorization: {
        authorizedAt: MANIFEST_ISSUED_AT,
        expiresAt: MANIFEST_EXPIRES_AT,
      },
      candidate: {
        candidateId: CANDIDATE_REF.split('/').at(-1),
        runId: RUN_ID,
        identitySha256: CANDIDATE_IDENTITY_SHA256,
        deploymentId: DEPLOYMENT_ID,
        runnerContractSha256: RUNNER_CONTRACT_SHA256,
      },
      authority: {
        manifestBytesBase64: Buffer.from(
          signedManifest().manifestBytes,
        ).toString('base64'),
        expected: expectedBindings,
        trustedAuthorityKeys: [authorityTrustedKey],
        artifactTrustedKeys: [trustedKey],
        trustedCutoffAt: '2026-09-21T10:30:00.000Z',
      },
      provenance: {
        ci: {
          runId: '111111111111',
          runAttempt: '1',
          artifactId: 12345,
          artifactDigest: `sha256:${'1'.repeat(64)}`,
        },
        staging: {
          runId: '222222222222',
          runAttempt: '1',
          artifactId: 67890,
          artifactDigest: `sha256:${'2'.repeat(64)}`,
        },
      },
      archives: [
        {
          selector: 'ci',
          expectedBytes: 64,
          expectedSha256: `sha256:${'1'.repeat(64)}`,
          allowedMembers: ['source.bin', 'source.attestation'],
          requiredMembers: ['source.bin', 'source.attestation'],
          sources: [],
        },
        {
          selector: 'staging',
          expectedBytes: 64,
          expectedSha256: `sha256:${'2'.repeat(64)}`,
          allowedMembers: ['source.bin', 'source.attestation'],
          requiredMembers: ['source.bin', 'source.attestation'],
          sources: [],
        },
      ],
    }),
    'utf8',
  ).toString('base64');

describe('AC265 publication fail-closed boundary', () => {
  it('loads the protected context from a bounded step-scoped bundle for resolve', async () => {
    const writeOutput = vi.fn<(value: string) => void>();
    const result = await resolveAc265HostedArtifactSourceSelectors({
      env: {
        ...envBase(),
        AC265_PUBLICATION_CONTEXT_BUNDLE_B64: validContextBundle(),
      },
      writeOutput,
    });
    expect(result).toEqual({
      ciRunId: '111111111111',
      ciArtifactId: 12345,
      stagingRunId: '222222222222',
      stagingArtifactId: 67890,
    });
    expect(writeOutput).toHaveBeenCalledOnce();
    expect(writeOutput.mock.calls[0]?.[0]).toMatch(
      /^context_bundle_sha256=[a-f0-9]{64}\n/u,
    );
  });

  it('rejects duplicate-key context bundles and does not retain raw secret content', async () => {
    const duplicate = Buffer.from(
      '{"schemaVersion":"ac265-hosted-artifact-source-manifest-context-v1","schemaVersion":"forged"}',
      'utf8',
    ).toString('base64');
    await expect(
      resolveAc265HostedArtifactSourceSelectors({
        env: { ...envBase(), AC265_PUBLICATION_CONTEXT_BUNDLE_B64: duplicate },
      }),
    ).rejects.toThrow(
      'AC265 hosted artifact-source manifest publication failed',
    );
  });

  it('rejects unknown bundle members and malformed public PEM values', async () => {
    const decoded = JSON.parse(
      Buffer.from(validContextBundle(), 'base64').toString('utf8'),
    ) as Record<string, unknown> & {
      authority: { trustedAuthorityKeys: Array<{ publicKeyPem: string }> };
    };
    decoded.unexpected = true;
    const unknown = Buffer.from(JSON.stringify(decoded), 'utf8').toString(
      'base64',
    );
    await expect(
      resolveAc265HostedArtifactSourceSelectors({
        env: { ...envBase(), AC265_PUBLICATION_CONTEXT_BUNDLE_B64: unknown },
      }),
    ).rejects.toThrow(
      'AC265 hosted artifact-source manifest publication failed',
    );
    delete decoded.unexpected;
    decoded.authority.trustedAuthorityKeys[0].publicKeyPem = 'not-pem';
    const malformedPem = Buffer.from(JSON.stringify(decoded), 'utf8').toString(
      'base64',
    );
    await expect(
      resolveAc265HostedArtifactSourceSelectors({
        env: {
          ...envBase(),
          AC265_PUBLICATION_CONTEXT_BUNDLE_B64: malformedPem,
        },
      }),
    ).rejects.toThrow(
      'AC265 hosted artifact-source manifest publication failed',
    );
  });

  it('loads the core through native ESM without an import-time export failure', () => {
    const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
    const result = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '-e',
        "await import('./infra/workflows/publish-ac265-hosted-artifact-source-manifest-core.ts')",
      ],
      { cwd: repositoryRoot, encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it('rejects caller-supplied selectors and never invokes the authority loader', async () => {
    const loadProtectedContext = vi.fn();
    await expect(
      resolveAc265HostedArtifactSourceSelectors({
        env: {
          ...envBase(),
          AC265_CI_RUN_ID: '999',
          AC265_CI_ARTIFACT_ID: '999',
        },
        loadProtectedContext,
      }),
    ).rejects.toThrow(
      'AC265 hosted artifact-source manifest publication failed',
    );
    expect(loadProtectedContext).not.toHaveBeenCalled();
  });

  it('rejects a protected context whose repository, branch, SHA, or authorization differs from the fixed workflow', async () => {
    for (const patch of [
      { repository: 'evil/repo' },
      { branch: 'feature' },
      { sourceRevision: 'a'.repeat(40) },
      { authorizationRef: AUTHORIZATION_REF.replace('002', '003') },
    ]) {
      const loadProtectedContext = vi.fn(async () => ({
        repository: 'WeJustJammin/nevrite-music',
        branch: 'main',
        sourceRevision: SOURCE_REVISION,
        authorizationRef: AUTHORIZATION_REF,
        candidateRef: CANDIDATE_REF,
        ...patch,
      }));
      await expect(
        resolveAc265HostedArtifactSourceSelectors({
          env: envBase(),
          loadProtectedContext,
        }),
      ).rejects.toThrow(
        'AC265 hosted artifact-source manifest publication failed',
      );
    }
  });

  it('rejects output paths that are not a fresh private directory before registration', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ac265-publication-security-'));
    const output = join(root, 'output');
    writeFileSync(output, 'occupied', { mode: 0o600 });
    const register = vi.fn();
    await expect(
      publishAc265HostedArtifactSourceManifest({
        env: {
          ...envBase(),
          GITHUB_RUN_ID: '333333333333',
          GITHUB_RUN_ATTEMPT: '1',
          AC265_SOURCE_MANIFEST_SOURCE_DIR: root,
          AC265_SOURCE_MANIFEST_OUTPUT_DIR: output,
          AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM: 'not-a-key',
          AC265_SOURCE_MANIFEST_SIGNING_KEY_ID: 'ac265-source-manifest-v1',
          SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
          SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
          SUPABASE_SECRET_KEY: 'sb_secret_test-only',
        },
        loadProtectedContext: async () => ({}) as never,
        rpc: { register, finalize: vi.fn(), read: vi.fn() },
      }),
    ).rejects.toThrow(
      'AC265 hosted artifact-source manifest publication failed',
    );
    expect(register).not.toHaveBeenCalled();
  });

  it('does not leak secrets, source bytes, or provider locators through the generic failure', async () => {
    const secret = 'sb_secret_private-key';
    const sourceBytes = 'raw-source-byte-fixture';
    const sourceDir = mkdtempSync(join(tmpdir(), 'ac265-publication-error-'));
    chmodSync(sourceDir, 0o700);
    writeFileSync(join(sourceDir, 'unexpected.txt'), sourceBytes, {
      mode: 0o600,
    });
    await expect(
      publishAc265HostedArtifactSourceManifest({
        env: {
          ...envBase(),
          GITHUB_RUN_ID: '333333333333',
          GITHUB_RUN_ATTEMPT: '1',
          AC265_SOURCE_MANIFEST_SOURCE_DIR: sourceDir,
          AC265_SOURCE_MANIFEST_OUTPUT_DIR: join(sourceDir, 'output'),
          AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM: secret,
          AC265_SOURCE_MANIFEST_SIGNING_KEY_ID: 'ac265-source-manifest-v1',
          SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
          SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
          SUPABASE_SECRET_KEY: secret,
        },
        loadProtectedContext: async () => {
          throw new Error(
            `upstream ${secret} ${sourceBytes} https://private.example`,
          );
        },
        rpc: { register: vi.fn(), finalize: vi.fn(), read: vi.fn() },
      }),
    ).rejects.toThrow(
      'AC265 hosted artifact-source manifest publication failed',
    );
  });
});
