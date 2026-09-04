import { describe, expect, it, vi } from 'vitest';

import type { WorkerBindings } from '../index';
import { createWorkerApp } from '../index';
import { createProductionProfileOwnershipDependencies } from './production';
import {
  CLAIM_ID,
  CHALLENGE_ID,
  PARTY_ID,
  PERSON_ID,
  REQUEST_ID,
  bindings,
  commandRequest,
  createProfileApp,
  responses,
  session,
} from './phase-02-slice-05.test-support';

const CORRELATION_ID = '21212121-2121-4212-8212-212121212121';
const REQUEST_TOKEN = 'rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCdEfGhIjKlMn';

const request = new Request('https://api.example.test/profile', {
  headers: {
    'x-request-id': REQUEST_ID,
    'x-correlation-id': CORRELATION_ID,
  },
});

const json = (value: unknown, status = 200, headers?: HeadersInit): Response =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const environment: WorkerBindings = {
  ...bindings,
  APP_RELEASE: 'phase-02-slice-05-production',
};

const rpcName = (input: string | URL | Request): string =>
  new URL(String(input)).pathname.split('/').at(-1) ?? '';

describe('profile ownership production adapter', () => {
  it('[P2-S05-AC-091..098] maps every active port to its server-side RPC contract', async () => {
    const fetchImpl = vi.fn(
      async (input: string | URL | Request, _init?: RequestInit) => {
        void _init;
        const result: Readonly<Record<string, unknown>> = {
          rpc_match_shadow: responses.matchShadowParty,
          rpc_dispatch_invitation: responses.dispatchInvitation,
          rpc_submit_remedy: responses.submitRemedy,
          rpc_start_claim: responses.startClaim,
          rpc_read_claim: responses.readClaim,
          rpc_issue_claim_challenge: responses.issueClaimChallenge,
          rpc_submit_claim_proof: responses.completeClaimProof,
          rpc_convert_claim: responses.convertClaim,
        };
        return json(result[rpcName(input)] ?? null);
      },
    );
    const dependencies = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const signal = new AbortController().signal;
    const command = {
      request,
      session,
      idempotencyKey: 'profile-adapter-test',
      ifMatch: '"7"',
    } as const;

    const matchCommand = {
      request,
      session,
      idempotencyKey: command.idempotencyKey,
      operationId: 'PRF-API-01' as const,
      body: {
        partyId: PARTY_ID,
        sourceDomain: 'projects',
        sourceEntityId: 'work-812',
        sourceVersion: '3',
        roleCode: 'performer',
      },
    };
    await dependencies.matchShadowParty(matchCommand, environment, signal);
    await dependencies.dispatchInvitation(
      {
        ...command,
        operationId: 'PRF-API-02',
        path: { shadowId: PARTY_ID },
        body: { contactRouteId: CHALLENGE_ID, trigger: 'initial' },
      },
      environment,
      signal,
    );
    await dependencies.submitRemedy(
      {
        request,
        operationId: 'PRF-API-03',
        idempotencyKey: 'profile-remedy-test',
        body: {
          pointerToken: REQUEST_TOKEN,
          action: 'suppress',
          scope: 'both',
          proof: { kind: 'route_code', code: '482901' },
        },
      },
      environment,
      signal,
    );
    await dependencies.startClaim(
      {
        ...command,
        operationId: 'PRF-API-04',
        body: { targetPartyId: PARTY_ID, claimKind: 'self' },
      },
      environment,
      signal,
    );
    await dependencies.readClaim(
      {
        request,
        session,
        operationId: 'PRF-API-05',
        path: { claimId: CLAIM_ID },
      },
      environment,
      signal,
    );
    await dependencies.issueClaimChallenge(
      {
        ...command,
        operationId: 'PRF-API-06',
        path: { claimId: CLAIM_ID },
        body: { method: 'attester_route', attesterPersonId: PERSON_ID },
      },
      environment,
      signal,
    );
    await dependencies.completeClaimProof(
      {
        ...command,
        operationId: 'PRF-API-07',
        path: { claimId: CLAIM_ID },
        body: {
          kind: 'challenge_code',
          challengeId: CHALLENGE_ID,
          code: '482901',
          reasonCode: 'claim_proof',
        },
      },
      environment,
      signal,
    );
    await dependencies.convertClaim(
      {
        ...command,
        operationId: 'PRF-API-08',
        path: { claimId: CLAIM_ID },
        body: { reasonCode: 'claim_conversion' },
      },
      environment,
      signal,
    );

    expect(fetchImpl.mock.calls.map(([input]) => rpcName(input))).toEqual([
      'rpc_match_shadow',
      'rpc_dispatch_invitation',
      'rpc_submit_remedy',
      'rpc_start_claim',
      'rpc_read_claim',
      'rpc_issue_claim_challenge',
      'rpc_submit_claim_proof',
      'rpc_convert_claim',
    ]);
    const firstInit = fetchImpl.mock.calls[0]?.[1];
    expect(firstInit?.method).toBe('POST');
    expect(firstInit?.headers).toMatchObject({
      Accept: 'application/json',
      'Accept-Profile': 'platform_api',
      apikey: environment.SUPABASE_SECRET_KEY,
      authorization: `Bearer ${environment.SUPABASE_SECRET_KEY}`,
      'Content-Profile': 'platform_api',
      'Content-Type': 'application/json',
      'X-Operation-Id': 'PRF-API-01',
      'X-Request-Id': REQUEST_ID,
      'X-Correlation-Id': CORRELATION_ID,
      'X-Idempotency-Key': command.idempotencyKey,
    });
    expect(JSON.parse(String(firstInit?.body))).toMatchObject({
      p_request: {
        partyId: PARTY_ID,
        sourceDomain: 'projects',
        sourceEntityId: 'work-812',
        sourceVersion: '3',
        idempotencyKey: 'profile-adapter-test',
        context: {
          actorPersonId: session.personId,
          actingPartyId: session.actingPartyId,
          authUserId: session.authUserId,
          sessionId: session.sessionId,
          requestId: REQUEST_ID,
          correlationId: CORRELATION_ID,
        },
      },
    });
    const remedyBody = JSON.parse(
      String(fetchImpl.mock.calls[2]?.[1]?.body),
    ) as Record<string, unknown>;
    expect(remedyBody).toMatchObject({
      p_request: {
        pointerToken: REQUEST_TOKEN,
        proof: { kind: 'route_code', code: '482901' },
      },
    });
    expect(remedyBody.p_request).not.toHaveProperty('context.actorPersonId');
  });

  it('[P2-S05-AC-044,091..098] maps RPC failures, aborts, and malformed responses to typed safe results', async () => {
    const failureFetch = vi.fn(async () =>
      json(
        { error: { code: 'VERSION_MISMATCH', detail: 'private state' } },
        409,
      ),
    );
    const dependencies = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: failureFetch as typeof fetch,
    });
    const result = await dependencies.startClaim(
      {
        request,
        operationId: 'PRF-API-04',
        session,
        idempotencyKey: 'profile-failure-test',
        ifMatch: '"4"',
        body: { targetPartyId: PARTY_ID, claimKind: 'self' },
      },
      environment,
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      ok: false,
      status: 409,
      code: 'VERSION_MISMATCH',
    });
    expect(JSON.stringify(result)).not.toContain('private state');

    const malformed = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: vi.fn(async () => json({ unexpected: true })) as typeof fetch,
    });
    await expect(
      malformed.readClaim(
        {
          request,
          operationId: 'PRF-API-05',
          session,
          path: { claimId: CLAIM_ID },
        },
        environment,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_BAD_GATEWAY',
    });

    const aborted = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: vi.fn(async () => {
        throw new DOMException('aborted', 'AbortError');
      }) as typeof fetch,
    });
    await expect(
      aborted.readClaim(
        {
          request,
          operationId: 'PRF-API-05',
          session,
          path: { claimId: CLAIM_ID },
        },
        environment,
        new AbortController().signal,
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('[P2-S05-AC-091,093] routes an account-free HTTP remedy through the production RPC adapter', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) =>
      rpcName(input) === 'rpc_submit_remedy'
        ? json(responses.submitRemedy)
        : json({ unexpected: true }, 404),
    );
    const profile = createProductionProfileOwnershipDependencies({
      environment,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const harness = createProfileApp();
    const app = createWorkerApp({
      ...harness.dependencies,
      profileOwnership: profile,
    });
    const response = await app.fetch(
      commandRequest(
        '/api/v1/shadow-remedies',
        {
          pointerToken: REQUEST_TOKEN,
          action: 'suppress',
          scope: 'both',
          proof: { kind: 'route_code', code: '482901' },
        },
        { authenticated: false, key: 'profile-http-remedy' },
      ),
      bindings,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(responses.submitRemedy);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
      '/rest/v1/rpc/rpc_submit_remedy',
    );
  });
});
