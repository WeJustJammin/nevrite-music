import { describe, expect, it, vi } from 'vitest';

import {
  finalizeAc265HostedArtifactSourceManifest,
  readAc265HostedArtifactSourceManifest,
  registerAc265HostedArtifactSourceManifest,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest-rpc.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'sb_secret_ac265-source-manifest-fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const IDEMPOTENCY_REF =
  'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004';
const MANIFEST_ID = '60000000-0000-4000-8000-000000000006';
const MANIFEST_REF = `ac265-artifact-manifest://staging/${MANIFEST_ID}`;
const FINALIZATION_REF =
  'ac265-finalization://staging/70000000-0000-4000-8000-000000000007';
const SCHEMA_VERSION = 'ac265-hosted-artifact-source-manifest-v1' as const;

const source = (kind: 'server_receipt' | 'execution_evidence', id: string) => ({
  kind,
  artifactRef:
    kind === 'server_receipt'
      ? `ac265-receipt://server/${id}`
      : `ac265-evidence://blob/${id}`,
  artifactSha256: 'a'.repeat(64),
  attestationSha256: 'b'.repeat(64),
  attestationKeyId: 'release-key-2026-09',
  subjectSha256: 'c'.repeat(64),
  issuedAt: '2026-09-21T10:00:30.000Z',
  expiresAt: '2026-09-21T10:02:30.000Z',
});
const sources = [
  source('execution_evidence', '10000000-0000-4000-8000-000000000010'),
  source('server_receipt', '10000000-0000-4000-8000-000000000011'),
] as const;
const registerRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  idempotencyRef: IDEMPOTENCY_REF,
  sources,
};
const resultBase = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: SCHEMA_VERSION,
  manifestId: MANIFEST_ID,
  manifestRef: MANIFEST_REF,
  authorizationRef: AUTHORIZATION_REF,
  authorization: {
    authorizedAt: '2026-09-21T10:00:00.000Z',
    expiresAt: '2026-09-21T10:05:00.000Z',
  },
  idempotencyRef: IDEMPOTENCY_REF,
  candidateId: '80000000-0000-4000-8000-000000000008',
  runId: '90000000-0000-4000-8000-000000000009',
  identitySha256: 'd'.repeat(64),
  environment: 'staging' as const,
  sourceRevision: 'e'.repeat(40),
  deploymentId: 'staging-deployment-1',
  hostingProjectId: 'wejammin-staging' as const,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  sourceCount: sources.length,
  sourceSetComplete: true as const,
  kindComplete: true as const,
  registeredAt: '2026-09-21T10:00:30.000Z',
  sources: sources.map((value, ordinal) => ({
    ...value,
    ordinal: ordinal + 1,
  })),
  redacted: true as const,
};
const registeredResult = {
  ...resultBase,
  lifecycle: 'registered' as const,
  manifestSha256: null,
  finalizationRef: null,
  finalizedAt: null,
};
const finalizedResult = {
  ...resultBase,
  lifecycle: 'finalized' as const,
  manifestSha256: 'f'.repeat(64),
  finalizationRef: FINALIZATION_REF,
  finalizedAt: '2026-09-21T10:01:00.000Z',
};
const finalizeRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  manifestId: MANIFEST_ID,
  finalizationRef: FINALIZATION_REF,
  manifestSha256: finalizedResult.manifestSha256,
};
const readRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  manifestId: MANIFEST_ID,
};
const clientOptions = (fetchImpl: typeof fetch) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey: SERVICE_ROLE_KEY,
  fetchImpl,
});
const responseFor = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('AC265 hosted artifact-source manifest RPC lifecycle bindings', () => {
  it('registers through the exact platform_api RPC with opaque-key headers and strict body', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(registeredResult),
    );
    const result = await registerAc265HostedArtifactSourceManifest(
      clientOptions(fetchImpl),
      registerRequest,
    );
    const [input, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_hosted_artifact_manifest_register`,
    );
    expect(init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
    });
    const headers = new Headers(init?.headers);
    expect(headers.get('Accept-Profile')).toBe('platform_api');
    expect(headers.get('Content-Profile')).toBe('platform_api');
    expect(headers.get('apikey')).toBe(SERVICE_ROLE_KEY);
    expect(headers.get('authorization')).toBeNull();
    expect(String(init?.body)).toBe(
      JSON.stringify({ p_request: registerRequest }),
    );
    expect(result).toEqual(registeredResult);
  });

  it('allows register to return a finalized projection', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(finalizedResult),
    );
    await expect(
      registerAc265HostedArtifactSourceManifest(
        clientOptions(fetchImpl),
        registerRequest,
      ),
    ).resolves.toEqual(finalizedResult);
  });

  it('finalizes with exact manifest, digest, authorization, and finalization bindings', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(finalizedResult),
    );
    const result = await finalizeAc265HostedArtifactSourceManifest(
      clientOptions(fetchImpl),
      finalizeRequest,
    );
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_hosted_artifact_manifest_finalize`,
    );
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).toBe(
      JSON.stringify({ p_request: finalizeRequest }),
    );
    expect(result).toEqual(finalizedResult);
  });

  it('reads only a finalized projection and rejects registered-only results', async () => {
    const finalizedFetch = vi.fn<typeof fetch>(async () =>
      responseFor(finalizedResult),
    );
    await expect(
      readAc265HostedArtifactSourceManifest(
        clientOptions(finalizedFetch),
        readRequest,
      ),
    ).resolves.toEqual(finalizedResult);
    const registeredFetch = vi.fn<typeof fetch>(async () =>
      responseFor(registeredResult),
    );
    await expect(
      readAc265HostedArtifactSourceManifest(
        clientOptions(registeredFetch),
        readRequest,
      ),
    ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
  });

  it('rejects conflicts and every returned binding mismatch without accepting a registered finalize result', async () => {
    const mismatches = [
      { status: 'conflict' },
      {
        ...finalizedResult,
        authorizationRef: AUTHORIZATION_REF.replace('002', '003'),
      },
      {
        ...finalizedResult,
        manifestId: '70000000-0000-4000-8000-000000000007',
      },
      {
        ...finalizedResult,
        manifestRef:
          'ac265-artifact-manifest://staging/70000000-0000-4000-8000-000000000007',
      },
      { ...finalizedResult, supabaseProjectRef: 'zyxwvutsrqponmlkjihg' },
      { ...finalizedResult, environment: 'production' },
      { ...finalizedResult, lifecycle: 'registered' },
      { ...finalizedResult, manifestSha256: 'a'.repeat(64) },
      {
        ...finalizedResult,
        finalizationRef: FINALIZATION_REF.replace('007', '008'),
      },
    ];
    for (const payload of mismatches) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        finalizeAc265HostedArtifactSourceManifest(
          clientOptions(fetchImpl),
          finalizeRequest,
        ),
      ).rejects.toThrow(
        'AC265 hosted artifact-source manifest finalize failed',
      );
    }
  });
});
