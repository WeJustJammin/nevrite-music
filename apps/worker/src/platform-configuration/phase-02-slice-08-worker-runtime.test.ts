import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticationResult } from '../authentication/types';
import {
  CORRELATION_ID,
  GRANT_ID,
  REQUEST_ID,
  auditRequest,
  bindings,
  capabilityActionRequest,
  capabilityRequest,
  expectApiError,
  inboxRequest,
  makeHarness,
  telemetryEvents,
} from './phase-02-slice-08-worker.test-support';

const fetch = (
  harness: ReturnType<typeof makeHarness>,
  request: Request,
): Promise<Response> => Promise.resolve(harness.app.fetch(request, bindings));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Phase 2 Slice 08 Worker RED runtime policies', () => {
  it('[P2-S08-AC-015] requires Idempotency-Key for the CFG-05B-04 mutation', async () => {
    const harness = makeHarness();
    const request = capabilityRequest();
    const headers = new Headers(request.headers);
    headers.delete('idempotency-key');

    await expectApiError(
      await fetch(harness, new Request(request, { headers })),
      400,
      'INVALID_REQUEST',
    );
    expect(harness.ports.capabilityAction).not.toHaveBeenCalled();
  });

  it('[P2-S08-AC-015] replays identical CFG-05B-04 mutations without duplicate effects', async () => {
    const harness = makeHarness();
    const first = await fetch(harness, capabilityRequest());
    const second = await fetch(harness, capabilityRequest());

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    await expect(second.json()).resolves.toEqual(await first.json());
    expect(harness.ports.capabilityAction).toHaveBeenCalledOnce();
  });

  it('[P2-S08-AC-015, P2-S08-AC-045] rejects an idempotency fingerprint mismatch as a conflict', async () => {
    const harness = makeHarness();
    expect((await fetch(harness, capabilityRequest())).status).toBe(201);
    const changed = capabilityRequest({
      ...capabilityActionRequest,
      reason: 'The same key must not mutate a different grant.',
    });

    await expectApiError(
      await fetch(harness, changed),
      409,
      'IDEMPOTENCY_CONFLICT',
    );
    expect(harness.ports.capabilityAction).toHaveBeenCalledOnce();
  });

  it.each([
    ['inbox', 'CFG-05B-01', () => inboxRequest(), 'inbox', 120],
    [
      'capability',
      'CFG-05B-04',
      () => capabilityRequest(),
      'capabilityAction',
      20,
    ],
    ['audit read', 'CFG-05B-05', () => auditRequest(), 'auditDiagnostic', 120],
  ] as const)(
    '[P2-S08-AC-009, P2-S08-AC-015, P2-S08-AC-021] enforces the verified-user rate policy for %s',
    async (_name, operationId, requestFactory, port, limit) => {
      const harness = makeHarness({
        rateLimit: {
          ok: true,
          value: {
            allowed: false,
            limit,
            remaining: 0,
            resetAt: Math.floor(Date.now() / 1000) + 60,
          },
        },
      });
      const response = await fetch(harness, requestFactory());

      await expectApiError(response, 429, 'RATE_LIMITED');
      expect(response.headers.get('ratelimit-limit')).toBe(String(limit));
      expect(response.headers.get('ratelimit-remaining')).toBe('0');
      expect(response.headers.get('retry-after')).toEqual(expect.any(String));
      expect(harness.auth.rateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ operationId, limit }),
        bindings,
        expect.any(AbortSignal),
      );
      expect(harness.ports[port]).not.toHaveBeenCalled();
    },
  );

  it('[P2-S08-AC-009, P2-S08-AC-015, P2-S08-AC-021, P2-S08-AC-042] fails closed when the rate dependency throws', async () => {
    const harness = makeHarness({ rateLimitThrows: true });
    await expectApiError(
      await fetch(harness, inboxRequest()),
      503,
      'DEPENDENCY_UNAVAILABLE',
    );
    expect(harness.ports.inbox).not.toHaveBeenCalled();
  });

  it.each([
    ['inbox', () => inboxRequest(), 'inbox', 8_000],
    [
      'capability action',
      () => capabilityRequest(),
      'capabilityAction',
      15_000,
    ],
    ['audit read', () => auditRequest(), 'auditDiagnostic', 8_000],
  ] as const)(
    '[P2-S08-AC-010, P2-S08-AC-016, P2-S08-AC-022, P2-S08-AC-035] maps the %s deadline to UPSTREAM_TIMEOUT',
    async (_name, requestFactory, port, deadlineMs) => {
      vi.useFakeTimers();
      const harness = makeHarness();
      harness.ports[port].mockImplementation(
        () => new Promise<AuthenticationResult<unknown>>(() => undefined),
      );
      const pending = fetch(harness, requestFactory());
      await vi.advanceTimersByTimeAsync(deadlineMs + 1);
      await expectApiError(await pending, 504, 'UPSTREAM_TIMEOUT');
      expect(harness.ports[port]).toHaveBeenCalledOnce();
    },
  );

  it('[P2-S08-AC-023, P2-S08-AC-036, P2-S08-AC-039, P2-S08-AC-040] emits redacted active telemetry and no diagnostic-change event for read_audit', async () => {
    const harness = makeHarness();
    await fetch(harness, inboxRequest());
    await fetch(harness, capabilityRequest());
    await fetch(harness, auditRequest());

    const events = telemetryEvents(harness.lines);
    expect(events.map((event) => event.eventName).sort()).toEqual([
      'admin.capability.changed',
      'admin.inbox.read',
    ]);
    for (const event of events) {
      expect(event).toEqual(
        expect.objectContaining({
          requestId: REQUEST_ID,
          correlationId: CORRELATION_ID,
          metrics: expect.any(Object),
          traceSteps: expect.any(Array),
        }),
      );
    }
    const inbox = events.find(
      (event) => event.eventName === 'admin.inbox.read',
    );
    expect(inbox?.attributes).toEqual(
      expect.objectContaining({
        taskCountState: expect.any(String),
        partialSourceCount: expect.any(Number),
        freshness: expect.any(String),
      }),
    );
    const grant = events.find(
      (event) => event.eventName === 'admin.capability.changed',
    );
    expect(grant?.attributes).toEqual(
      expect.objectContaining({
        grantId: GRANT_ID,
        subjectHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        capabilityKeyHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        resourceType: 'admin_task',
        state: 'active',
      }),
    );
    expect(JSON.stringify(events)).not.toContain(
      'Grant a bounded inbox capability',
    );
    expect(JSON.stringify(events)).not.toContain('fresh-step-up-token');
    expect(JSON.stringify(events)).not.toContain('quality.diagnostic.changed');
  });
});
