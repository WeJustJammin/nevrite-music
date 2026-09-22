import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_MAX_RESPONSE_BYTES,
  AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_TIMEOUT_MS,
  readAc265HostedArtifactSourceManifest,
} from '../infra/workflows/ac265-hosted-artifact-source-manifest-rpc.ts';

const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const OPAQUE_SERVICE_ROLE_KEY = 'sb_secret_ac265-source-manifest-fixture';
const LEGACY_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiJ9.legacy-service-role';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const MANIFEST_ID = '60000000-0000-4000-8000-000000000006';
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
const finalizedResult = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: SCHEMA_VERSION,
  manifestId: MANIFEST_ID,
  manifestRef: `ac265-artifact-manifest://staging/${MANIFEST_ID}`,
  authorizationRef: AUTHORIZATION_REF,
  authorization: {
    authorizedAt: '2026-09-21T10:00:00.000Z',
    expiresAt: '2026-09-21T10:05:00.000Z',
  },
  idempotencyRef:
    'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004',
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
  lifecycle: 'finalized' as const,
  manifestSha256: 'f'.repeat(64),
  finalizationRef: FINALIZATION_REF,
  finalizedAt: '2026-09-21T10:01:00.000Z',
};
const readRequest = {
  criterion: 'P2-S09-AC-265' as const,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  manifestId: MANIFEST_ID,
};
const clientOptions = (
  fetchImpl: typeof fetch,
  serviceRoleKey = OPAQUE_SERVICE_ROLE_KEY,
) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey,
  fetchImpl,
});
const responseFor = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

afterEach(() => {
  vi.useRealTimers();
});

describe('AC265 hosted artifact-source manifest RPC transport boundary', () => {
  it('uses the legacy Bearer form only for non-opaque service-role credentials', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(finalizedResult),
    );
    await readAc265HostedArtifactSourceManifest(
      clientOptions(fetchImpl, LEGACY_SERVICE_ROLE_KEY),
      readRequest,
    );
    const headers = new Headers(fetchImpl.mock.calls[0]?.[1]?.headers);
    expect(headers.get('apikey')).toBe(LEGACY_SERVICE_ROLE_KEY);
    expect(headers.get('authorization')).toBe(
      `Bearer ${LEGACY_SERVICE_ROLE_KEY}`,
    );
    expect(headers.get('Accept-Profile')).toBe('platform_api');
    expect(headers.get('Content-Profile')).toBe('platform_api');
  });

  it('rejects noncanonical origins, project references, malformed requests, and invalid keys before network access', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const supabaseUrl of [
      'https://other.supabase.co',
      `${SUPABASE_URL}/`,
      `${SUPABASE_URL}?redirect=1`,
      `http://${SUPABASE_PROJECT_REF}.supabase.co`,
      `https://user@${SUPABASE_PROJECT_REF}.supabase.co`,
    ])
      await expect(
        readAc265HostedArtifactSourceManifest(
          { ...clientOptions(fetchImpl), supabaseUrl },
          readRequest,
        ),
      ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
    for (const supabaseProjectRef of [
      'abcdefghijklmnopqrs',
      'ABCDEFGHIJKLMNOPQRST',
      'abcdefghijklmnopqrstu',
    ])
      await expect(
        readAc265HostedArtifactSourceManifest(
          { ...clientOptions(fetchImpl), supabaseProjectRef },
          readRequest,
        ),
      ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
    for (const serviceRoleKey of [
      '',
      ' padded ',
      'key\nvalue',
      'x'.repeat(8_193),
    ])
      await expect(
        readAc265HostedArtifactSourceManifest(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          readRequest,
        ),
      ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
    for (const request of [
      { ...readRequest, unknown: true },
      { ...readRequest, manifestId: 'not-a-uuid' },
    ])
      await expect(
        readAc265HostedArtifactSourceManifest(
          clientOptions(fetchImpl),
          request,
        ),
      ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects redirects, failed responses, duplicate JSON members, malformed lengths, invalid UTF-8, and oversized bodies', async () => {
    const responses = [
      new Response('private upstream body', { status: 503 }),
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example' },
      }),
      new Response(
        `{"criterion":"P2-S09-AC-265","criterion":"P2-S09-AC-265"}`,
        { status: 200 },
      ),
      new Response('{}', {
        status: 200,
        headers: { 'content-length': 'not-a-length' },
      }),
      new Response(new Uint8Array([0xff, 0xfe]), { status: 200 }),
      new Response('{}', {
        status: 200,
        headers: {
          'content-length': String(
            AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        readAc265HostedArtifactSourceManifest(
          clientOptions(fetchImpl),
          readRequest,
        ),
      ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
    }
  });

  it('aborts a stalled request at the fixed ten-second deadline', async () => {
    vi.useFakeTimers();
    let capturedSignal: AbortSignal | undefined;
    let resolveSignalCaptured!: () => void;
    const signalCaptured = new Promise<void>((resolve) => {
      resolveSignalCaptured = resolve;
    });
    const fetchImpl = vi.fn<typeof fetch>(
      async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal as AbortSignal | undefined;
          resolveSignalCaptured();
          capturedSignal?.addEventListener(
            'abort',
            () => reject(new Error('transport abort detail')),
            { once: true },
          );
        }),
    );
    const pending = readAc265HostedArtifactSourceManifest(
      clientOptions(fetchImpl),
      readRequest,
    );
    const rejected = expect(pending).rejects.toThrow(
      'AC265 hosted artifact-source manifest read failed',
    );
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(
      AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_TIMEOUT_MS,
    );
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('cancels oversized responses and never exposes upstream or secret details', async () => {
    let cancellationFinished = false;
    const cancel = vi.fn(async () => {
      await Promise.resolve();
      cancellationFinished = true;
    });
    const response = new Response(new ReadableStream<Uint8Array>({ cancel }), {
      status: 200,
      headers: {
        'content-length': String(
          AC265_HOSTED_ARTIFACT_SOURCE_MANIFEST_HTTP_MAX_RESPONSE_BYTES + 1,
        ),
      },
    });
    const fetchImpl = vi.fn<typeof fetch>(async () => response);
    await expect(
      readAc265HostedArtifactSourceManifest(
        clientOptions(fetchImpl),
        readRequest,
      ),
    ).rejects.toThrow('AC265 hosted artifact-source manifest read failed');
    expect(cancel).toHaveBeenCalledOnce();
    expect(cancellationFinished).toBe(true);

    const secret = 'sb_secret_sensitive-source-manifest-key';
    const failingFetch = vi.fn<typeof fetch>(async () => {
      throw new Error(`private upstream body ${secret}`);
    });
    const thrown = await readAc265HostedArtifactSourceManifest(
      { ...clientOptions(failingFetch), serviceRoleKey: secret },
      readRequest,
    ).catch((error: unknown) => error);
    expect((thrown as Error).message).toBe(
      'AC265 hosted artifact-source manifest read failed',
    );
    expect((thrown as Error).message).not.toContain(secret);
  });
});
