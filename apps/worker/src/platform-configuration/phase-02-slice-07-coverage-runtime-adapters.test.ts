import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp, type WorkerContext } from '../index';
import type { AuthenticationResult } from '../authentication/types';
import {
  cloneableConfigurationError,
  configurationFingerprint,
  configurationReplayKey,
  configurationResponseVersion,
  unavailableConfiguration,
} from './runtime-helpers';
import {
  action,
  actionRequest,
  actionResponse,
  effectiveRequest,
  effectiveResponse,
  expectError,
  makeHarness,
  proposal,
  proposalResponse,
  proposalRequest,
  request,
  sessionFor,
} from './phase-02-slice-07.test-support';
import type { ConfigurationPort } from './types';
import { emitPlatformConfigurationTelemetry } from './telemetry';

describe('Phase 2 Slice 07 runtime adapter behavior', () => {
  it('[P2-S07-runtime-helpers] returns only valid response versions and preserves cloneable errors', async () => {
    expect(configurationResponseVersion(null)).toBeNull();
    expect(configurationResponseVersion('1')).toBeNull();
    expect(
      configurationResponseVersion({
        version: '0',
        definitionVersion: 'not-a-version',
        resultingVersion: '1e3',
        evaluatorVersion: '0002',
      }),
    ).toBeNull();
    expect(configurationResponseVersion({ definitionVersion: '12' })).toBe(
      '12',
    );

    const original = new Response(JSON.stringify({ code: 'INVALID_REQUEST' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
    const clone = cloneableConfigurationError(original);
    expect(clone).not.toBe(original);
    await expect(clone.json()).resolves.toEqual({ code: 'INVALID_REQUEST' });
    await expect(original.json()).resolves.toEqual({ code: 'INVALID_REQUEST' });
  });

  it('[P2-S07-runtime-helpers] exposes the typed unavailable configuration outcome', () => {
    expect(unavailableConfiguration()).toEqual({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      message: 'Configuration persistence is temporarily unavailable.',
      details: { dependencyClass: 'configuration', retryable: true },
      retryAfterSeconds: 5,
    });
  });

  it('[P2-S07-runtime-helpers] fingerprints optional port fields and selects the verified replay identity', () => {
    const input = {
      operationId: 'CFG-05A-01' as const,
      request: request('/api/v1/internal/config/definitions'),
      idempotencyKey: 'runtime-helper-key',
    };

    expect(configurationFingerprint(input)).toContain('"body":{}');
    expect(configurationReplayKey(input)).toBe(
      'CFG-05A-01|anonymous|runtime-helper-key',
    );
    expect(
      configurationReplayKey({
        ...input,
        servicePrincipalId: 'release.service',
      }),
    ).toBe('CFG-05A-01|release.service|runtime-helper-key');
    expect(
      configurationReplayKey({ ...input, session: sessionFor(701) }),
    ).toContain(`CFG-05A-01|${sessionFor(701).authUserId}|runtime-helper-key`);
    expect(
      configurationReplayKey({
        operationId: input.operationId,
        request: input.request,
      }),
    ).toBe('CFG-05A-01|anonymous|');
  });

  it('[P2-S07-runtime-port] fails closed when the configuration port is absent', async () => {
    const session = sessionFor(700);
    const app = createWorkerApp({
      auth: {
        resolveSession: vi.fn(async () => ({
          ok: true as const,
          value: session,
        })),
        rateLimit: vi.fn(async () => ({
          ok: true as const,
          value: {
            allowed: true,
            limit: 300,
            remaining: 299,
            resetAt: Math.floor(Date.now() / 1000) + 60,
          },
        })),
      } as never,
      captureException: vi.fn(),
      createLogger: () =>
        createLogger({
          environment: 'test',
          release: 'slice-07-runtime-adapters',
          service: 'worker',
        }),
      now: () => Date.now(),
    });

    const response = await app.request(effectiveRequest());

    await expectError(
      response,
      503,
      'DEPENDENCY_UNAVAILABLE',
      'Configuration persistence is temporarily unavailable.',
      { dependencyClass: 'configuration', retryable: true },
    );
  });

  it('[P2-S07-runtime-port] completes a valid call when the host timer returns no handle', async () => {
    const timer = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementationOnce(() => undefined as never);
    try {
      const harness = makeHarness({
        port: vi.fn<ConfigurationPort>(async () => ({
          ok: true,
          value: effectiveResponse,
        })),
      });

      const response = await harness.app.request(effectiveRequest());

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual(effectiveResponse);
    } finally {
      timer.mockRestore();
    }
  });

  it('[P2-S07-runtime-port] coalesces an identical in-flight mutation without a second port call', async () => {
    let resolvePort:
      ((result: AuthenticationResult<unknown>) => void) | undefined;
    const port = vi.fn<ConfigurationPort>(
      () =>
        new Promise<AuthenticationResult<unknown>>((resolve) => {
          resolvePort = resolve;
        }),
    );
    const harness = makeHarness({ port });
    const headers = { 'idempotency-key': 'slice07-in-flight-replay' };

    const first = harness.app.request(proposalRequest(proposal, headers));
    await vi.waitFor(() => expect(port).toHaveBeenCalledOnce());
    const replay = harness.app.request(proposalRequest(proposal, headers));
    const conflict = harness.app.request(
      proposalRequest({ ...proposal, typedValue: false }, headers),
    );
    await vi.waitFor(() =>
      expect(harness.auth.rateLimit).toHaveBeenCalledTimes(3),
    );
    await Promise.resolve();

    resolvePort?.({ ok: true, value: proposalResponse });
    const [firstResponse, replayResponse, conflictResponse] = await Promise.all(
      [first, replay, conflict],
    );

    expect(firstResponse.status).toBe(201);
    expect(replayResponse.status).toBe(201);
    await expectError(
      conflictResponse,
      409,
      'IDEMPOTENCY_CONFLICT',
      'The idempotency key was used for another request.',
    );
    expect(port).toHaveBeenCalledOnce();
  });

  it('[P2-S07-telemetry] redacts an empty release principal hash while retaining the typed response', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const harness = makeHarness();
      let capturedContext: WorkerContext | undefined;
      harness.app.get('/__test-telemetry-context', (context) => {
        capturedContext = context;
        return context.text('ok');
      });
      await harness.app.request(request('/__test-telemetry-context'));
      expect(capturedContext).toBeDefined();

      await emitPlatformConfigurationTelemetry(
        capturedContext as WorkerContext,
        { now: () => 0 },
        {
          operationId: 'CFG-05A-01',
          request: request('/__test-telemetry-context'),
          body: {},
        },
        { ok: true, value: null, status: 201 },
        0,
      );

      const event = info.mock.calls
        .map(([line]) => JSON.parse(String(line)) as Record<string, unknown>)
        .find((entry) => entry.eventName === 'cfg.definition.registered');
      expect(event).toEqual(
        expect.objectContaining({
          attributes: expect.objectContaining({
            releasePrincipalHash: null,
            risk: null,
          }),
        }),
      );
    } finally {
      info.mockRestore();
    }
  });

  it('[P2-S07-telemetry] marks scheduled transitions pending and logs them as retryable', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const harness = makeHarness({
        port: vi.fn<ConfigurationPort>(async () => ({
          ok: true,
          value: { ...actionResponse, resultingState: 'scheduled' },
        })),
      });

      const response = await harness.app.request(actionRequest(action));

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ...actionResponse,
        resultingState: 'scheduled',
      });
      const event = info.mock.calls
        .map(([line]) => JSON.parse(String(line)) as Record<string, unknown>)
        .find((entry) => entry.eventName === 'cfg.change.transitioned');
      expect(event).toEqual(
        expect.objectContaining({
          outcome: 'retry',
          metrics: expect.objectContaining({ pendingCount: 1 }),
        }),
      );
    } finally {
      info.mockRestore();
    }
  });

  it('[P2-S07-telemetry] marks contract-fallback values as retryable telemetry', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    try {
      const harness = makeHarness({
        port: vi.fn<ConfigurationPort>(async () => ({
          ok: true,
          value: { ...effectiveResponse, compatibility: 'contract_fallback' },
        })),
      });

      const response = await harness.app.request(effectiveRequest());

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        ...effectiveResponse,
        compatibility: 'contract_fallback',
      });
      const event = info.mock.calls
        .map(([line]) => JSON.parse(String(line)) as Record<string, unknown>)
        .find((entry) => entry.eventName === 'cfg.value.resolved');
      expect(event).toEqual(
        expect.objectContaining({
          outcome: 'retry',
          metrics: expect.objectContaining({ fallbackCount: 1 }),
        }),
      );
    } finally {
      info.mockRestore();
    }
  });
});
