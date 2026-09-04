import { afterEach, describe, expect, it, vi } from 'vitest';

import { authError } from '../authentication/boundary';
import {
  actionRequest,
  actionResponse,
  definitionRequest,
  definitionResponse,
  effectiveRequest,
  effectiveResponse,
  makeHarness,
  proposalRequest,
  proposalResponse,
  releaseRequest,
  type ConfigurationPort,
} from './phase-02-slice-07.test-support';

const captured: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  captured.length = 0;
});

const captureLogs = (): void => {
  vi.spyOn(console, 'info').mockImplementation((line) => {
    captured.push(String(line));
  });
};

const telemetry = (): readonly Record<string, unknown>[] =>
  captured
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((event) => String(event.eventName).startsWith('cfg.'));

describe('Phase 2 Slice 07 production route telemetry', () => {
  it('[P2-S07-AC-044..P2-S07-AC-047] emits typed success events with metrics and trace steps', async () => {
    captureLogs();
    const port = vi.fn<ConfigurationPort>(async (input) => ({
      ok: true,
      value:
        input.operationId === 'CFG-05A-01'
          ? definitionResponse
          : input.operationId === 'CFG-05A-02'
            ? effectiveResponse
            : input.operationId === 'CFG-05A-03'
              ? proposalResponse
              : actionResponse,
    }));
    const harness = makeHarness({ port });

    const responses = await Promise.all([
      harness.app.request(releaseRequest(definitionRequest)),
      harness.app.request(effectiveRequest()),
      harness.app.request(proposalRequest()),
      harness.app.request(actionRequest()),
    ]);
    expect(responses.map((response) => response.status)).toEqual([
      201, 200, 201, 200,
    ]);

    const events = telemetry();
    expect(events.map((event) => event.eventName).sort()).toEqual([
      'cfg.change.proposed',
      'cfg.change.transitioned',
      'cfg.definition.registered',
      'cfg.value.resolved',
    ]);
    for (const event of events) {
      expect(event).toEqual(
        expect.objectContaining({
          outcome: 'success',
          requestId: '11111111-1111-4111-8111-111111111111',
          correlationId: '22222222-2222-4222-8222-222222222222',
          metrics: expect.any(Object),
          traceSteps: expect.any(Array),
        }),
      );
    }

    const registered = events.find(
      (event) => event.eventName === 'cfg.definition.registered',
    );
    expect(registered?.attributes).toEqual(
      expect.objectContaining({
        definitionId: definitionResponse.definitionId,
        version: definitionResponse.version,
        keyHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        releasePrincipalHash: expect.stringMatching(/^[0-9a-f]{64}$/u),
        risk: 'high',
      }),
    );
    expect(JSON.stringify(registered)).not.toContain('profile.visibility');
    expect(JSON.stringify(registered)).not.toContain('verified.release');

    const resolved = events.find(
      (event) => event.eventName === 'cfg.value.resolved',
    );
    expect(resolved?.attributes).not.toHaveProperty('typedValue');
    expect(resolved?.attributes).not.toHaveProperty('sourceSubjectId');

    const proposed = events.find(
      (event) => event.eventName === 'cfg.change.proposed',
    );
    expect(proposed?.attributes).not.toHaveProperty('value');
    expect(proposed?.attributes).not.toHaveProperty('manifest');

    const transitioned = events.find(
      (event) => event.eventName === 'cfg.change.transitioned',
    );
    expect(transitioned?.attributes).not.toHaveProperty('candidateValue');
    expect(transitioned?.attributes).not.toHaveProperty('rollbackValue');
  });

  it('[P2-S07-AC-044,P2-S07-AC-046,P2-S07-AC-047] emits rejection/conflict counters without logging request payloads', async () => {
    captureLogs();
    const protectedPort = vi.fn<ConfigurationPort>(async () =>
      authError(422, 'PROTECTED_SETTING', 'The setting is protected.'),
    );
    const conflictPort = vi.fn<ConfigurationPort>(async () =>
      authError(
        409,
        'VERSION_CONFLICT',
        'The configuration changed; reload and try again.',
      ),
    );

    const rejected = makeHarness({ port: protectedPort });
    const conflicted = makeHarness({ port: conflictPort });
    expect(
      (await rejected.app.request(releaseRequest(definitionRequest))).status,
    ).toBe(422);
    expect((await conflicted.app.request(actionRequest())).status).toBe(409);

    const events = telemetry();
    const registration = events.find(
      (event) => event.eventName === 'cfg.definition.registered',
    );
    expect(registration).toEqual(
      expect.objectContaining({
        outcome: 'rejected',
        metrics: expect.objectContaining({ rejectedProtectedDefinitions: 1 }),
      }),
    );
    const transition = events.find(
      (event) => event.eventName === 'cfg.change.transitioned',
    );
    expect(transition).toEqual(
      expect.objectContaining({
        outcome: 'failure',
        metrics: expect.objectContaining({ conflictCount: 1 }),
      }),
    );
    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain('defaultValue');
    expect(serialized).not.toContain('rollbackValue');
    expect(serialized).not.toContain('approvalReason');
  });
});
