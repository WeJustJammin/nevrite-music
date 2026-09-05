import { describe, expect, it, vi } from 'vitest';

import { runContentSchemaRegistryOperationalAlerts } from './operational-alert-runtime';

const breachedSnapshot = {
  activationBlockedMs: 900_001,
  migrationRetryCount: 4,
  nonceRejectionRate: 0.2,
  nonceRejectionBaseline: 0.1,
  dlqDepth: 1,
  outboxAgeMs: 120_001,
  conflictRate: 0.051,
  conflictWindowMs: 300_000,
  unknownEventVersions: 1,
  commandP95Ms: 1_200,
  protectedRpcP95Ms: 300,
  acceptanceP99Ms: 1_000,
  queueFirstAttemptP95Ms: 60_000,
  dailyDlqRate: 0.001,
} as const;

describe('content schema registry production alert runtime', () => {
  it('delivers every claimed locked condition with redacted bounded content', async () => {
    const claim = vi.fn(async (alert: { code: string }) => ({
      claimed: true as const,
      claimId: `claim-${alert.code}`,
      claimToken: `token-${alert.code}`,
    }));
    const deliver = vi.fn(async () => ({ receiptId: 'provider-message-1' }));
    const complete = vi.fn(async () => undefined);

    await expect(
      runContentSchemaRegistryOperationalAlerts(
        {
          environment: 'production',
          release: 'a'.repeat(40),
          scheduledAt: '2026-09-05T07:30:00.000Z',
        },
        {
          loadSnapshot: async () => breachedSnapshot,
          claim,
          deliver,
          complete,
        },
      ),
    ).resolves.toEqual({ evaluated: 12, claimed: 12, delivered: 12 });

    expect(claim).toHaveBeenCalledTimes(12);
    expect(deliver).toHaveBeenCalledTimes(12);
    expect(complete).toHaveBeenCalledTimes(12);
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({
        alert: expect.objectContaining({
          route: 'platform.on_call',
          runbook: 'content-schema-registry',
        }),
        environment: 'production',
        release: 'a'.repeat(40),
        redacted: true,
      }),
    );
    expect(JSON.stringify(deliver.mock.calls)).not.toMatch(
      /authorization|cookie|email|requestBody|token-/iu,
    );
  });

  it('skips unclaimed conditions and emits nothing for a healthy snapshot', async () => {
    const deliver = vi.fn(async () => ({ receiptId: 'unused' }));
    const complete = vi.fn(async () => undefined);
    const claim = vi.fn(async () => ({ claimed: false as const }));
    const dependencies = { claim, complete, deliver };

    await expect(
      runContentSchemaRegistryOperationalAlerts(
        {
          environment: 'production',
          release: 'b'.repeat(40),
          scheduledAt: '2026-09-05T07:31:00.000Z',
        },
        { ...dependencies, loadSnapshot: async () => breachedSnapshot },
      ),
    ).resolves.toEqual({ evaluated: 12, claimed: 0, delivered: 0 });
    expect(deliver).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();

    await expect(
      runContentSchemaRegistryOperationalAlerts(
        {
          environment: 'production',
          release: 'b'.repeat(40),
          scheduledAt: '2026-09-05T07:32:00.000Z',
        },
        {
          ...dependencies,
          loadSnapshot: async () => ({
            activationBlockedMs: 0,
            migrationRetryCount: 0,
            nonceRejectionRate: 0,
            nonceRejectionBaseline: 0,
            dlqDepth: 0,
            outboxAgeMs: 0,
            conflictRate: 0,
            conflictWindowMs: 300_000,
            unknownEventVersions: 0,
            commandP95Ms: 0,
            protectedRpcP95Ms: 0,
            acceptanceP99Ms: 0,
            queueFirstAttemptP95Ms: 0,
            dailyDlqRate: 0,
          }),
        },
      ),
    ).resolves.toEqual({ evaluated: 0, claimed: 0, delivered: 0 });
  });

  it('does not record a receipt when Cloudflare delivery fails', async () => {
    const complete = vi.fn(async () => undefined);
    await expect(
      runContentSchemaRegistryOperationalAlerts(
        {
          environment: 'production',
          release: 'c'.repeat(40),
          scheduledAt: '2026-09-05T07:33:00.000Z',
        },
        {
          loadSnapshot: async () => ({ dlqDepth: 1 }),
          claim: async () => ({
            claimed: true,
            claimId: 'claim-dlq',
            claimToken: 'claim-secret',
          }),
          deliver: async () => {
            throw new Error('provider unavailable');
          },
          complete,
        },
      ),
    ).rejects.toThrow('provider unavailable');
    expect(complete).not.toHaveBeenCalled();
  });
});
