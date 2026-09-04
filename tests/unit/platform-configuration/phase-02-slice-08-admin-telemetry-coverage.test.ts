import { describe, expect, it } from 'vitest';

import type { WorkerContext } from '../../../apps/worker/src/index';
import { authError } from '../../../apps/worker/src/authentication/boundary';
import { emitAdminWorkspaceTelemetry } from '../../../apps/worker/src/platform-configuration/admin-telemetry';
import { emitPlatformConfigurationTelemetry } from '../../../apps/worker/src/platform-configuration/telemetry';
import type {
  AdminWorkspacePortInput,
  ConfigurationPortInput,
} from '../../../apps/worker/src/platform-configuration/types';
import {
  capabilityRequest,
  contextFor,
  inboxRequest,
  makeHarness as makeAdminHarness,
  request as adminRequest,
  sessionFor,
  telemetryEvents,
} from '../../../apps/worker/src/platform-configuration/phase-02-slice-08-worker.test-support';
import { request as configurationRequest } from '../../../apps/worker/src/platform-configuration/phase-02-slice-07.test-support';

const captureContext = async (
  harness: ReturnType<typeof makeAdminHarness>,
): Promise<WorkerContext> => {
  let captured: WorkerContext | undefined;
  harness.app.get('/__telemetry-coverage-context', (context) => {
    captured = context;
    return context.text('ok');
  });
  await harness.app.request(adminRequest('/__telemetry-coverage-context'));
  expect(captured).toBeDefined();
  return captured as WorkerContext;
};

const adminInput = (
  operationId: AdminWorkspacePortInput['operationId'],
  request: Request,
  body?: Readonly<Record<string, unknown>>,
): AdminWorkspacePortInput => ({
  operationId,
  request,
  body,
  session: sessionFor(),
  requestContext: contextFor(),
});

const configurationInput = (
  operationId: ConfigurationPortInput['operationId'],
  request: Request,
): ConfigurationPortInput => ({
  operationId,
  request,
  body: {},
});

describe('Phase 2 Slice 08 telemetry defensive branch coverage', () => {
  it('covers empty, malformed, and failed admin inbox telemetry values', async () => {
    const harness = makeAdminHarness();
    const context = await captureContext(harness);
    const input = adminInput('CFG-05B-01', inboxRequest());

    await emitAdminWorkspaceTelemetry(
      context,
      input,
      {
        ok: true,
        value: { items: [], partialSources: 'not-an-array' },
        status: 200,
      },
      20,
      () => 100,
    );
    await emitAdminWorkspaceTelemetry(
      context,
      input,
      authError(502, 'INTERNAL_ERROR', 'Inbox dependency failed.'),
      120,
      () => 100,
    );

    const events = telemetryEvents(harness.lines).filter(
      (event) => event.eventName === 'admin.inbox.read',
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(
      expect.objectContaining({
        outcome: 'success',
        attributes: expect.objectContaining({
          taskCountState: 'empty',
          partialSourceCount: 0,
          freshness: 'unknown',
        }),
      }),
    );
    expect(events[1]).toEqual(
      expect.objectContaining({
        outcome: 'failure',
        attributes: expect.objectContaining({
          taskCountState: 'unknown',
          partialSourceCount: 0,
          freshness: 'unknown',
        }),
      }),
    );
  });

  it('covers admin capability body fallbacks and empty identity hashes', async () => {
    const harness = makeAdminHarness();
    const context = await captureContext(harness);
    const input = adminInput('CFG-05B-04', capabilityRequest());

    await emitAdminWorkspaceTelemetry(
      context,
      {
        ...input,
        body: {
          grantId: 'body-grant',
          subjectPersonId: 'body-subject',
          capabilityKey: 'body-capability',
          resourceType: 'body-resource',
          startsAt: 'body-start',
          endsAt: 'body-end',
        },
      },
      authError(422, 'GRANT_INVALID', 'Grant is invalid.'),
      120,
      () => 100,
    );
    await emitAdminWorkspaceTelemetry(
      context,
      { ...input, body: {} },
      authError(500, 'INTERNAL_ERROR', 'Grant dependency failed.'),
      120,
      () => 100,
    );

    const events = telemetryEvents(harness.lines).filter(
      (event) => event.eventName === 'admin.capability.changed',
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual(
      expect.objectContaining({
        outcome: 'rejected',
        attributes: expect.objectContaining({
          grantId: 'body-grant',
          resourceType: 'body-resource',
          startsAt: 'body-start',
          endsAt: 'body-end',
        }),
        metrics: expect.objectContaining({ grantMutationCount: 0 }),
      }),
    );
    expect(events[1]).toEqual(
      expect.objectContaining({
        outcome: 'failure',
        attributes: expect.objectContaining({
          grantId: null,
          subjectHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
          capabilityKeyHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
          resourceType: null,
          startsAt: null,
          endsAt: null,
          state: null,
        }),
      }),
    );
  });

  it('covers unknown value resolution, proposal rejection, and invalid operation containment', async () => {
    const adminHarness = makeAdminHarness();
    const context = await captureContext(adminHarness);

    await emitPlatformConfigurationTelemetry(
      context,
      { now: () => 100 },
      configurationInput(
        'CFG-05A-02',
        configurationRequest('/__telemetry-value-unavailable'),
      ),
      authError(503, 'VALUE_UNAVAILABLE', 'Value is unavailable.'),
      20,
    );
    await emitPlatformConfigurationTelemetry(
      context,
      { now: () => 100 },
      configurationInput(
        'CFG-05A-03',
        configurationRequest('/__telemetry-proposal-invalid'),
      ),
      authError(400, 'INVALID_REQUEST', 'Proposal is invalid.'),
      20,
    );

    await expect(
      emitPlatformConfigurationTelemetry(
        context,
        { now: () => 100 },
        configurationInput(
          'CFG-05B-01',
          configurationRequest('/__telemetry-invalid-operation'),
        ),
        authError(500, 'INTERNAL_ERROR', 'Unexpected operation.'),
        20,
      ),
    ).resolves.toBeUndefined();

    const events = adminHarness.lines
      .map((line) => JSON.parse(line) as Record<string, unknown>)
      .filter((event) => String(event.eventName).startsWith('cfg.'));
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'cfg.value.resolved',
          outcome: 'unknown',
          metrics: expect.objectContaining({ unknownCount: 1 }),
        }),
        expect.objectContaining({
          eventName: 'cfg.change.proposed',
          outcome: 'rejected',
          metrics: expect.objectContaining({ schemaRejectionCount: 1 }),
        }),
      ]),
    );
    expect(events.some((event) => event.operation === 'CFG-05B-01')).toBe(
      false,
    );
  });
});
