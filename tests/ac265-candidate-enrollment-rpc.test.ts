import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildAc265CandidateEnrollment } from '../infra/workflows/ac265-candidate-enrollment.ts';
import {
  AC265_CANDIDATE_ENROLLMENT_HTTP_MAX_RESPONSE_BYTES,
  AC265_CANDIDATE_ENROLLMENT_HTTP_TIMEOUT_MS,
  registerAc265CandidateEnrollment,
} from '../infra/workflows/ac265-candidate-enrollment-rpc.ts';
import { verifyAc265CandidateProvenance } from '../infra/workflows/ac265-candidate-provenance.ts';
import { AC265_STAGING_API_ORIGIN } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-control-plane.ts';
import { createCandidateFixture } from './ac265-candidate-artifact-fixture.ts';
import {
  createInputs,
  createMockGitHubApi,
  SUPABASE_PROJECT_REF,
  WEB_ORIGIN,
} from './ac265-candidate-provenance.test-support.ts';

const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = 'sb_secret_ac265-service-role-fixture';
const CANDIDATE_REF =
  'ac265-candidate://staging/550e8400-e29b-41d4-a716-446655440000';

let fixture: ReturnType<typeof createCandidateFixture>;
let scratch: string;

beforeEach(() => {
  fixture = createCandidateFixture();
  scratch = mkdtempSync(join(tmpdir(), 'ac265-enrollment-rpc-test-'));
});

afterEach(() => {
  fixture.close();
  rmSync(scratch, { recursive: true, force: true });
  vi.useRealTimers();
});

const makeRequest = async () => {
  const api = createMockGitHubApi();
  const provenance = await verifyAc265CandidateProvenance(
    createInputs(fixture, { stagingApiOrigin: AC265_STAGING_API_ORIGIN }),
    api.fetchImpl,
  );
  return buildAc265CandidateEnrollment(provenance, {
    hostingAccountId: 'f'.repeat(32),
    stagingWebOrigin: WEB_ORIGIN,
    stagingApiOrigin: AC265_STAGING_API_ORIGIN,
    supabaseProjectRef: SUPABASE_PROJECT_REF,
    supabaseOrigin: SUPABASE_URL,
  });
};

const enrollmentResult = (identitySha256: string) => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-candidate-enrollment-v1',
  candidateRef: CANDIDATE_REF,
  identitySha256,
  status: 'enrolled',
  redacted: true,
});

const clientOptions = (fetchImpl: typeof fetch) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey: SERVICE_ROLE_KEY,
  fetchImpl,
});

const responseFor = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('AC265 candidate enrollment PostgREST client', () => {
  it('POSTs the strict verifier-produced request to the exact staging RPC with bounded no-redirect transport', async () => {
    const request = await makeRequest();
    let call: { input: RequestInfo | URL; init?: RequestInit } | undefined;
    const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
      call = { input, init };
      return responseFor(enrollmentResult(request.identitySha256));
    });

    const result = await registerAc265CandidateEnrollment(
      clientOptions(fetchImpl),
      request,
    );

    expect(String(call?.input)).toBe(
      `${SUPABASE_URL}/rest/v1/rpc/ac265_enroll_verified_candidate`,
    );
    expect(call?.init).toMatchObject({
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
    });
    expect(call?.init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(call?.init?.headers);
    expect(headers.get('accept')).toBe('application/json');
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('apikey')).toBe(SERVICE_ROLE_KEY);
    expect(headers.get('authorization')).toBe(`Bearer ${SERVICE_ROLE_KEY}`);
    expect(String(call?.init?.body)).toBe(
      JSON.stringify({ p_request: request }),
    );
    expect(String(call?.init?.body)).not.toContain(SERVICE_ROLE_KEY);
    expect(result).toEqual(enrollmentResult(request.identitySha256));
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('rejects caller-chosen or noncanonical Supabase origins before network access', async () => {
    const request = await makeRequest();
    const fetchImpl = vi.fn<typeof fetch>();
    for (const supabaseUrl of [
      `https://other.supabase.co`,
      `https://${SUPABASE_PROJECT_REF}.supabase.co/`,
      `https://${SUPABASE_PROJECT_REF}.supabase.co?redirect=1`,
      `http://${SUPABASE_PROJECT_REF}.supabase.co`,
      `https://user@${SUPABASE_PROJECT_REF}.supabase.co`,
    ]) {
      await expect(
        registerAc265CandidateEnrollment(
          { ...clientOptions(fetchImpl), supabaseUrl },
          request,
        ),
      ).rejects.toThrow('AC265 candidate enrollment failed');
    }
    await expect(
      registerAc265CandidateEnrollment(
        {
          ...clientOptions(fetchImpl),
          supabaseProjectRef: 'zyxwvutsrqponmlkjihg',
        },
        request,
      ),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects malformed requests and invalid service keys without network access', async () => {
    const request = await makeRequest();
    const fetchImpl = vi.fn<typeof fetch>();
    const invalidKeys = ['', ' padded ', 'key\nvalue', 'x'.repeat(8_193)];
    for (const serviceRoleKey of invalidKeys)
      await expect(
        registerAc265CandidateEnrollment(
          { ...clientOptions(fetchImpl), serviceRoleKey },
          request,
        ),
      ).rejects.toThrow('AC265 candidate enrollment failed');

    await expect(
      registerAc265CandidateEnrollment(clientOptions(fetchImpl), {
        ...request,
        callerSuppliedRef: CANDIDATE_REF,
      }),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rechecks the identity digest and target origin after reading the request', async () => {
    const request = await makeRequest();
    const fetchImpl = vi.fn<typeof fetch>();
    const changedIdentity = {
      ...request.identity,
      hostingAccountId: 'e'.repeat(32),
    };
    const staleDigestRequest = { ...request, identity: changedIdentity };
    await expect(
      registerAc265CandidateEnrollment(
        clientOptions(fetchImpl),
        staleDigestRequest,
      ),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(fetchImpl).not.toHaveBeenCalled();

    const changedOriginIdentity = {
      ...request.identity,
      supabaseOrigin: 'https://other.supabase.co',
    };
    const changedOriginRequest = {
      ...request,
      identity: changedOriginIdentity,
    };
    await expect(
      registerAc265CandidateEnrollment(
        clientOptions(fetchImpl),
        changedOriginRequest,
      ),
    ).rejects.toThrow('AC265 candidate enrollment failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('accepts only a strict result bound to the submitted identity digest', async () => {
    const request = await makeRequest();
    for (const payload of [
      { status: 'conflict' },
      {
        ...enrollmentResult(request.identitySha256),
        identitySha256: '0'.repeat(64),
      },
      {
        ...enrollmentResult(request.identitySha256),
        leaked: 'provider detail',
      },
      {
        ...enrollmentResult(request.identitySha256),
        candidateRef: 'https://other.example',
      },
    ]) {
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(payload));
      await expect(
        registerAc265CandidateEnrollment(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 candidate enrollment failed');
    }
  });

  it('rejects failed, redirected, duplicate-key, invalid UTF-8, and oversized responses generically', async () => {
    const request = await makeRequest();
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
      new Response(new Uint8Array([0xff, 0xfe]), { status: 200 }),
      new Response(
        'x'.repeat(AC265_CANDIDATE_ENROLLMENT_HTTP_MAX_RESPONSE_BYTES + 1),
        {
          status: 200,
        },
      ),
      new Response('{}', {
        status: 200,
        headers: {
          'content-length': String(
            AC265_CANDIDATE_ENROLLMENT_HTTP_MAX_RESPONSE_BYTES + 1,
          ),
        },
      }),
    ];
    for (const response of responses) {
      const fetchImpl = vi.fn<typeof fetch>(async () => response);
      await expect(
        registerAc265CandidateEnrollment(clientOptions(fetchImpl), request),
      ).rejects.toThrow('AC265 candidate enrollment failed');
    }
  });

  it('aborts a stalled RPC within the fixed request deadline', async () => {
    vi.useFakeTimers();
    const request = await makeRequest();
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

    const pending = registerAc265CandidateEnrollment(
      clientOptions(fetchImpl),
      request,
    );
    const rejected = expect(pending).rejects.toThrow(
      'AC265 candidate enrollment failed',
    );
    await signalCaptured;
    await vi.advanceTimersByTimeAsync(
      AC265_CANDIDATE_ENROLLMENT_HTTP_TIMEOUT_MS,
    );
    await rejected;
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('returns the same server candidate reference for an identical retry request', async () => {
    const request = await makeRequest();
    const bodies: string[] = [];
    const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
      bodies.push(String(init?.body));
      return responseFor(enrollmentResult(request.identitySha256));
    });

    const first = await registerAc265CandidateEnrollment(
      clientOptions(fetchImpl),
      request,
    );
    const retried = await registerAc265CandidateEnrollment(
      clientOptions(fetchImpl),
      request,
    );

    expect(first.candidateRef).toBe(CANDIDATE_REF);
    expect(retried.candidateRef).toBe(first.candidateRef);
    expect(bodies).toEqual([
      JSON.stringify({ p_request: request }),
      JSON.stringify({ p_request: request }),
    ]);
  });
});
