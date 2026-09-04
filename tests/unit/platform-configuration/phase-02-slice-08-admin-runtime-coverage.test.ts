import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkerDependencies } from '../../../apps/worker/src/index';
import type { AuthenticationResult } from '../../../apps/worker/src/authentication/types';
import { createAdminWorkspacePortRunner } from '../../../apps/worker/src/platform-configuration/admin-runtime-port';
import type {
  AdminOperationId,
  AdminWorkspaceDependencies,
  AdminWorkspacePort,
  AdminWorkspacePortInput,
} from '../../../apps/worker/src/platform-configuration/types';
import {
  capabilityActionRequest,
  capabilityActionResponse,
  capabilityRequest,
  contextFor,
  expectApiError,
  inboxResponse,
  makeHarness,
  request,
  sessionFor,
  bindings,
} from '../../../apps/worker/src/platform-configuration/phase-02-slice-08-worker.test-support';
import { makeContext } from '../../../apps/worker/src/platform-configuration/phase-02-slice-07-route-runtime-coverage.test-support';

const success = (value: unknown): AuthenticationResult<unknown> => ({
  ok: true,
  value,
});

const adminDependencies = (
  ports: Partial<AdminWorkspaceDependencies>,
  platformConfiguration?: unknown,
): WorkerDependencies =>
  ({
    now: () => Date.now(),
    ...(Object.keys(ports).length > 0
      ? {
          adminWorkspace: {
            readInbox: ports.readInbox ?? ports.capabilityAction!,
            capabilityAction: ports.capabilityAction ?? ports.readInbox!,
            auditDiagnostic: ports.auditDiagnostic ?? ports.readInbox!,
          },
        }
      : {}),
    ...(platformConfiguration === undefined ? {} : { platformConfiguration }),
  }) as unknown as WorkerDependencies;

const inputFor = (
  operationId: AdminOperationId,
  overrides: Partial<AdminWorkspacePortInput> = {},
): AdminWorkspacePortInput =>
  ({
    operationId,
    request: request('/api/v1/admin/inbox'),
    session: sessionFor(),
    requestContext: contextFor(),
    ...overrides,
  }) as AdminWorkspacePortInput;

const contextForInput = (input: AdminWorkspacePortInput) =>
  makeContext(input.request).context;

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Slice 08 admin runtime coverage', () => {
  it('rejects capability mutation when the verified session has no fresh step-up', async () => {
    const harness = makeHarness({
      session: { ...sessionFor(), stepUpAt: null },
    });

    await expectApiError(
      await harness.app.fetch(
        capabilityRequest(capabilityActionRequest),
        bindings,
      ),
      401,
      'STEP_UP_REQUIRED',
    );
    expect(harness.ports.capabilityAction).not.toHaveBeenCalled();
  });

  it('passes an optional If-Match version through capability mutations', async () => {
    const harness = makeHarness();

    const response = await harness.app.fetch(
      capabilityRequest(capabilityActionRequest, { 'if-match': '"4"' }),
      bindings,
    );

    expect(response.status).toBe(201);
    expect(harness.ports.capabilityAction).toHaveBeenCalledWith(
      expect.objectContaining({ ifMatch: '4' }),
      bindings,
      expect.any(AbortSignal),
    );
  });

  it('fails closed when the admin workspace port is absent', async () => {
    const input = inputFor('CFG-05B-01');
    const runner = createAdminWorkspacePortRunner(adminDependencies({}));

    const outcome = await runner.run(
      contextForInput(input),
      input,
      'readInbox',
      new AbortController().signal,
    );

    expect(outcome).toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      details: { dependencyClass: 'admin_workspace', retryable: true },
    });
  });

  it('uses the complete legacy platform configuration fallback and fingerprints an inbox without a body', async () => {
    const port = vi.fn<AdminWorkspacePort>(async () => success(inboxResponse));
    const platformConfiguration = {
      readInbox: port,
      capabilityAction: port,
      auditDiagnostic: port,
    };
    const input = inputFor('CFG-05B-01', { idempotencyKey: 'inbox-key' });
    const runner = createAdminWorkspacePortRunner(
      adminDependencies({}, platformConfiguration),
    );

    const outcome = await runner.run(
      contextForInput(input),
      input,
      'readInbox',
    );

    expect(outcome).toEqual(success(inboxResponse));
    expect(port).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: 'CFG-05B-01',
        idempotencyKey: 'inbox-key',
      }),
      {},
      expect.any(AbortSignal),
    );
  });

  it('converts a throwing dependency into retryable unavailability', async () => {
    const port = vi.fn<AdminWorkspacePort>(async () => {
      throw new Error('admin workspace unavailable');
    });
    const input = inputFor('CFG-05B-01');
    const runner = createAdminWorkspacePortRunner(
      adminDependencies({ readInbox: port }),
    );

    const outcome = await runner.run(
      contextForInput(input),
      input,
      'readInbox',
    );

    expect(outcome).toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
  });

  it('returns a timeout when a direct port call exceeds its operation deadline', async () => {
    vi.useFakeTimers();
    const port = vi.fn<AdminWorkspacePort>(
      async () => await new Promise<AuthenticationResult<unknown>>(() => {}),
    );
    const input = inputFor('CFG-05B-01');
    const runner = createAdminWorkspacePortRunner(
      adminDependencies({ readInbox: port }),
    );
    const operation = runner.run(contextForInput(input), input, 'readInbox');

    await vi.advanceTimersByTimeAsync(8_000);
    await expect(operation).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
    });
  });

  it('completes when the host timer API returns no timer handle', async () => {
    vi.spyOn(globalThis, 'setTimeout').mockReturnValue(undefined as never);
    const port = vi.fn<AdminWorkspacePort>(async () => success(inboxResponse));
    const input = inputFor('CFG-05B-01');
    const runner = createAdminWorkspacePortRunner(
      adminDependencies({ readInbox: port }),
    );

    await expect(
      runner.run(contextForInput(input), input, 'readInbox'),
    ).resolves.toEqual(success(inboxResponse));
  });

  it('maps a schema-invalid successful dependency response to an upstream failure', async () => {
    const port = vi.fn<AdminWorkspacePort>(async () => success(null));
    const input = inputFor('CFG-05B-01');
    const runner = createAdminWorkspacePortRunner(
      adminDependencies({ readInbox: port }),
    );

    const outcome = await runner.run(
      contextForInput(input),
      input,
      'readInbox',
      new AbortController().signal,
    );

    expect(outcome).toMatchObject({
      ok: false,
      status: 502,
      code: 'UPSTREAM_FAILURE',
    });
  });

  it('coalesces an identical in-flight mutation and conflicts on a different fingerprint', async () => {
    let resolvePort!: (result: AuthenticationResult<unknown>) => void;
    const pending = new Promise<AuthenticationResult<unknown>>((resolve) => {
      resolvePort = resolve;
    });
    const port = vi.fn<AdminWorkspacePort>(async () => pending);
    const session = { ...sessionFor(), actingPartyId: null };
    const input = inputFor('CFG-05B-04', {
      body: capabilityActionRequest,
      idempotencyKey: 'pending-key',
      session,
    });
    const changedInput = inputFor('CFG-05B-04', {
      body: { ...capabilityActionRequest, reason: 'different request' },
      idempotencyKey: 'pending-key',
      session,
    });
    const runner = createAdminWorkspacePortRunner(
      adminDependencies({ capabilityAction: port }),
    );
    const first = runner.run(
      contextForInput(input),
      input,
      'capabilityAction',
      new AbortController().signal,
    );

    expect(port).toHaveBeenCalledOnce();
    const replay = runner.run(
      contextForInput(input),
      input,
      'capabilityAction',
      new AbortController().signal,
    );
    const conflict = runner.run(
      contextForInput(changedInput),
      changedInput,
      'capabilityAction',
      new AbortController().signal,
    );

    await expect(conflict).resolves.toMatchObject({
      ok: false,
      status: 409,
      code: 'IDEMPOTENCY_CONFLICT',
    });
    resolvePort(success(capabilityActionResponse));
    await expect(first).resolves.toEqual(success(capabilityActionResponse));
    await expect(replay).resolves.toEqual(success(capabilityActionResponse));
  });
});
