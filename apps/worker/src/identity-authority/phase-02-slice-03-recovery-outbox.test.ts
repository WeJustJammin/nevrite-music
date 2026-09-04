import { describe, expect, it, vi } from 'vitest';

import { createLogger } from '@wejammin/observability/logging';

import { createWorkerApp, type WorkerDependencies } from '../index';
import {
  CSRF,
  ORIGIN,
  REQUEST_ID,
} from '../authentication/phase-02-slice-02.test-fixtures';
import { createApp } from '../authentication/phase-02-slice-02.test-support';
import type { IdentityCommitResult } from './types';

const ALIAS_ID = '66666666-6666-4666-8666-666666666666';
const OFFER_ID = '77777777-7777-4777-8777-777777777777';
const PARTY_ID = '88888888-8888-4888-8888-888888888888';
const CONTEXT_ID = '99999999-9999-4999-8999-999999999999';
const AUDIT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OUTBOX_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

type RecoveryCase = Readonly<{
  criterion: string;
  operationId: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: Readonly<Record<string, unknown>>;
  mutation: boolean;
  ifMatch: boolean;
  public: boolean;
}>;

const cases: readonly RecoveryCase[] = [
  {
    criterion: 'P2-S03-AC-008 BE01b-01',
    operationId: 'BE01b-01',
    method: 'POST',
    path: '/api/v1/me/identity',
    body: {},
    mutation: true,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-014 BE01b-02',
    operationId: 'BE01b-02',
    method: 'GET',
    path: '/api/v1/me/identity',
    mutation: false,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-020 BE01b-03',
    operationId: 'BE01b-03',
    method: 'POST',
    path: '/api/v1/me/facets',
    body: { facetCode: 'performer', source: 'self_asserted' },
    mutation: true,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-026 BE01b-04',
    operationId: 'BE01b-04',
    method: 'DELETE',
    path: '/api/v1/me/facets/performer',
    body: {},
    mutation: true,
    ifMatch: true,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-032 BE01b-05',
    operationId: 'BE01b-05',
    method: 'POST',
    path: '/api/v1/aliases',
    body: {
      displayName: 'Neon Harbor',
      handle: 'neon.harbor',
      publicLinkState: 'private',
    },
    mutation: true,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-038 BE01b-06',
    operationId: 'BE01b-06',
    method: 'PATCH',
    path: `/api/v1/aliases/${ALIAS_ID}`,
    body: { displayName: 'Neon Harbor Live' },
    mutation: true,
    ifMatch: true,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-044 BE01b-07',
    operationId: 'BE01b-07',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/handle-changes`,
    body: { handle: 'neon-harbor' },
    mutation: true,
    ifMatch: true,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-050 BE01b-08',
    operationId: 'BE01b-08',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/retire`,
    body: {},
    mutation: true,
    ifMatch: true,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-056 BE01b-09',
    operationId: 'BE01b-09',
    method: 'POST',
    path: `/api/v1/aliases/${ALIAS_ID}/transfer-offers`,
    body: { recipientPersonId: PARTY_ID },
    mutation: true,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-062 BE01b-10',
    operationId: 'BE01b-10',
    method: 'POST',
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/accept`,
    body: {},
    mutation: true,
    ifMatch: true,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-068 BE01b-11',
    operationId: 'BE01b-11',
    method: 'POST',
    path: `/api/v1/alias-transfer-offers/${OFFER_ID}/decline`,
    body: {},
    mutation: true,
    ifMatch: true,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-074 BE01b-12',
    operationId: 'BE01b-12',
    method: 'GET',
    path: '/api/v1/me/acting-contexts',
    mutation: false,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-080 BE01b-13',
    operationId: 'BE01b-13',
    method: 'POST',
    path: '/api/v1/me/acting-context-bindings',
    body: {
      contextId: CONTEXT_ID,
      deliberateConfirmation: true,
      clientBindingId: 'tab-a',
    },
    mutation: true,
    ifMatch: false,
    public: false,
  },
  {
    criterion: 'P2-S03-AC-086 BE01b-18',
    operationId: 'BE01b-18',
    method: 'GET',
    path: `/api/v1/identity/parties/${PARTY_ID}/projection`,
    mutation: false,
    ifMatch: false,
    public: true,
  },
];

type IdentityRecoveryDependencies = {
  commit: ReturnType<typeof vi.fn>;
  read: ReturnType<typeof vi.fn>;
  reconcile: ReturnType<typeof vi.fn>;
  telemetry: ReturnType<typeof vi.fn>;
};

type IdentityWorkerDependencies = WorkerDependencies & {
  identityAuthority: IdentityRecoveryDependencies;
};

const success = (testCase: RecoveryCase): IdentityCommitResult => ({
  kind: 'committed',
  status: testCase.public || testCase.operationId.endsWith('-02') ? 200 : 201,
  body: { operationId: testCase.operationId, version: '2' },
  auditId: AUDIT_ID,
  outboxIds: [OUTBOX_ID],
});

const requestFor = (testCase: RecoveryCase, key = 'slice03-recovery-key') => {
  const headers = new Headers({
    accept: 'application/json',
    origin: ORIGIN,
    'x-request-id': REQUEST_ID,
  });
  if (!testCase.public) {
    headers.set(
      'cookie',
      `wj_session_ref=slice02-session-ref; wj_csrf=${CSRF}`,
    );
  }
  if (testCase.mutation) {
    headers.set('content-type', 'application/json');
    headers.set('idempotency-key', key);
    headers.set('x-csrf-token', CSRF);
    if (testCase.ifMatch) headers.set('if-match', '"1"');
  }
  return new Request(`${ORIGIN}${testCase.path}`, {
    method: testCase.method,
    headers,
    ...(testCase.body === undefined
      ? {}
      : { body: JSON.stringify(testCase.body) }),
  });
};

const make = (
  testCase: RecoveryCase,
  mode:
    | 'success'
    | 'audit_failure'
    | 'outbox_failure'
    | 'lost_response' = 'success',
) => {
  const state = { canonical: false, audit: 0, outbox: 0, effects: 0 };
  let committed = false;
  const commit = vi.fn(
    async (input: Record<string, unknown>): Promise<IdentityCommitResult> => {
      expect(input).toEqual(
        expect.objectContaining({
          operationId: testCase.operationId,
          atomicWrites: ['canonical_state', 'audit', 'outbox', 'idempotency'],
        }),
      );
      if (mode === 'audit_failure') throw new Error('audit store unavailable');
      if (mode === 'outbox_failure')
        throw new Error('outbox store unavailable');
      state.canonical = true;
      state.audit += 1;
      state.outbox += 1;
      state.effects += 1;
      committed = true;
      if (mode === 'lost_response')
        throw new DOMException('deadline', 'AbortError');
      return success(testCase);
    },
  );
  const read = vi.fn(async () => success(testCase));
  const reconcile = vi.fn(async () => (committed ? success(testCase) : null));
  const telemetry = vi.fn(async (event: Record<string, unknown>) => {
    expect(event).toEqual(
      expect.objectContaining({
        operationId: testCase.operationId,
        requestId: REQUEST_ID,
      }),
    );
    expect(JSON.stringify(event)).not.toContain('slice02-session-ref');
    expect(JSON.stringify(event)).not.toContain('Neon Harbor');
    expect(JSON.stringify(event)).not.toContain('neon.harbor');
  });
  const identityAuthority = { commit, read, reconcile, telemetry };
  const { auth } = createApp();
  const dependencies = {
    auth,
    captureException: vi.fn(),
    createLogger: () =>
      createLogger({
        environment: 'staging',
        release: 'phase-02-slice-03-recovery-test',
        service: 'wejammin-api',
      }),
    identityAuthority,
    now: () => Date.parse('2026-09-01T05:00:00Z'),
  } as IdentityWorkerDependencies;
  return { app: createWorkerApp(dependencies), state, ...identityAuthority };
};

const payload = async (response: Response) =>
  (await response.json()) as Record<string, unknown>;

describe('Phase 2 Slice 03 endpoint recovery and transactional outbox', () => {
  it.each(cases)(
    '$criterion commits canonical state, audit, and outbox together',
    async (testCase) => {
      const harness = make(testCase);
      const response = await harness.app.request(requestFor(testCase));

      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(300);
      expect(harness.telemetry).toHaveBeenCalledWith(
        expect.objectContaining({ operationId: testCase.operationId }),
      );
      if (testCase.mutation) {
        expect(harness.commit).toHaveBeenCalledOnce();
        expect(harness.state).toEqual({
          canonical: true,
          audit: 1,
          outbox: 1,
          effects: 1,
        });
      } else {
        expect(harness.commit).not.toHaveBeenCalled();
        expect(harness.read).toHaveBeenCalledOnce();
      }
    },
  );

  it.each(cases.filter(({ mutation }) => mutation))(
    '$criterion rolls back canonical state when audit or outbox persistence fails',
    async (testCase) => {
      for (const mode of ['audit_failure', 'outbox_failure'] as const) {
        const harness = make(testCase, mode);
        const response = await harness.app.request(requestFor(testCase));

        expect(response.status).toBe(503);
        await expect(payload(response)).resolves.toMatchObject({
          code: 'DEPENDENCY_UNAVAILABLE',
          requestId: REQUEST_ID,
        });
        expect(harness.state).toEqual({
          canonical: false,
          audit: 0,
          outbox: 0,
          effects: 0,
        });
        expect(harness.commit).toHaveBeenCalledOnce();
        expect(harness.telemetry).toHaveBeenCalledWith(
          expect.objectContaining({
            operationId: testCase.operationId,
            outcome: 'failure',
          }),
        );
      }
    },
  );

  it.each(cases.filter(({ mutation }) => mutation))(
    '$criterion reconciles a lost response without duplicate effects',
    async (testCase) => {
      const harness = make(testCase, 'lost_response');
      const key = `slice03-lost-${testCase.operationId}`;
      const first = await harness.app.request(requestFor(testCase, key));
      const second = await harness.app.request(requestFor(testCase, key));

      expect(first.status).toBe(503);
      expect(second.status).toBeGreaterThanOrEqual(200);
      expect(second.status).toBeLessThan(300);
      expect(harness.commit).toHaveBeenCalledOnce();
      expect(harness.reconcile).toHaveBeenCalledOnce();
      expect(harness.state).toEqual({
        canonical: true,
        audit: 1,
        outbox: 1,
        effects: 1,
      });
    },
  );

  it.each(cases.filter(({ mutation }) => mutation))(
    '$criterion exposes only safe refetch/retry guidance for a conflict',
    async (testCase) => {
      const harness = make(testCase);
      harness.commit.mockResolvedValueOnce({
        kind: 'conflict',
        status: 409,
        code: 'VERSION_MISMATCH',
        details: { recoveryAction: 'refetch_and_retry' },
      });
      const response = await harness.app.request(requestFor(testCase));

      expect(response.status).toBe(409);
      await expect(payload(response)).resolves.toMatchObject({
        code: 'VERSION_MISMATCH',
        details: { recoveryAction: 'refetch_and_retry' },
        requestId: REQUEST_ID,
      });
      expect(harness.commit).toHaveBeenCalledOnce();
      expect(harness.reconcile).not.toHaveBeenCalled();
      expect(harness.state).toEqual({
        canonical: false,
        audit: 0,
        outbox: 0,
        effects: 0,
      });
    },
  );
});
