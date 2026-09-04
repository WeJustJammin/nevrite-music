import { describe, expect, it } from 'vitest';

import {
  createSchemaMigrationWorker,
  SCHEMA_MIGRATION_RPC,
} from './migration-worker';
import {
  basePlan,
  event,
  makePort,
  NOW,
  PLAN_ID,
  TARGET_VERSION_ID,
} from './migration-worker-test-support';

const CLAIM_TOKEN_1 = '81000000-0000-4000-8000-000000000001';
const CLAIM_TOKEN_2 = '82000000-0000-4000-8000-000000000002';

const asRecord = (value: unknown): Record<string, unknown> =>
  value as Record<string, unknown>;

describe('S09 migration event claim lease', () => {
  it('releases a progress claim so the next invocation can resume with a fresh token', async () => {
    let owner: string | null = null;
    const claimedTokens: string[] = [];
    const releasedTokens: string[] = [];
    const port = makePort({
      [SCHEMA_MIGRATION_RPC.claimEvent]: (request) => {
        const token = asRecord(request).claimToken as string;
        if (owner !== null) return { status: 'in_progress' };
        owner = token;
        claimedTokens.push(token);
        return { status: 'new' };
      },
      [SCHEMA_MIGRATION_RPC.readPlan]: () => basePlan(),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: true,
        leaseToken: 'plan-lease',
        plan: basePlan({ state: 'running', version: '8' }),
      }),
      [SCHEMA_MIGRATION_RPC.heartbeatLease]: () => ({ renewed: true }),
      [SCHEMA_MIGRATION_RPC.processBatch]: () => ({
        done: false,
        cursor: '50',
        sourceCount: '100',
        targetCount: '50',
        migratedCount: '50',
        failedCount: '0',
        rowErrorCount: '0',
        progress: 0.5,
      }),
      [SCHEMA_MIGRATION_RPC.releaseEvent]: (request) => {
        const token = asRecord(request).claimToken as string;
        if (token !== owner)
          return {
            released: false,
            code: 'EVENT_CLAIM_LOST',
            retryable: true,
          };
        releasedTokens.push(token);
        owner = null;
        return { released: true };
      },
    });
    const tokens = [CLAIM_TOKEN_1, CLAIM_TOKEN_2];
    const worker = createSchemaMigrationWorker({
      port,
      workerId: 'worker-event-claim',
      now: () => NOW,
      eventClaimTokenFactory: () => tokens.shift()!,
    });

    await expect(worker.process(event)).resolves.toMatchObject({
      outcome: 'progress',
      progress: 0.5,
    });
    await expect(worker.process(event)).resolves.toMatchObject({
      outcome: 'progress',
      progress: 0.5,
    });

    expect(claimedTokens).toEqual([CLAIM_TOKEN_1, CLAIM_TOKEN_2]);
    expect(releasedTokens).toEqual([CLAIM_TOKEN_1, CLAIM_TOKEN_2]);
    const claimRequest = asRecord(
      port.calls.find(({ rpc }) => rpc === SCHEMA_MIGRATION_RPC.claimEvent)!
        .request,
    );
    expect(claimRequest).toMatchObject({
      claimToken: CLAIM_TOKEN_1,
      eventId: event.eventId,
      eventType: event.eventType,
      schemaVersion: event.schemaVersion,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      aggregateVersion: event.aggregateVersion,
      migrationPlanId: event.payload.migrationPlanId,
    });
  });

  it('fences acknowledgement with the acquired token and complete event identity', async () => {
    const noMigration = {
      ...event,
      payload: { ...event.payload, migrationPlanId: null },
    };
    const port = makePort({
      [SCHEMA_MIGRATION_RPC.claimEvent]: () => ({ status: 'new' }),
      [SCHEMA_MIGRATION_RPC.acknowledgeEvent]: () => ({ accepted: true }),
    });
    const worker = createSchemaMigrationWorker({
      port,
      workerId: 'worker-event-ack',
      now: () => NOW,
      eventClaimTokenFactory: () => CLAIM_TOKEN_1,
    });

    await expect(worker.process(noMigration)).resolves.toMatchObject({
      outcome: 'completed',
    });
    const acknowledgement = asRecord(
      port.calls.find(
        ({ rpc }) => rpc === SCHEMA_MIGRATION_RPC.acknowledgeEvent,
      )!.request,
    );
    expect(acknowledgement).toMatchObject({
      claimToken: CLAIM_TOKEN_1,
      eventId: noMigration.eventId,
      eventType: noMigration.eventType,
      schemaVersion: noMigration.schemaVersion,
      aggregateType: noMigration.aggregateType,
      aggregateId: noMigration.aggregateId,
      aggregateVersion: noMigration.aggregateVersion,
      migrationPlanId: null,
      outcome: 'ignored',
    });
  });

  it('turns a lost ACK or release claim into a typed retry', async () => {
    const lost = {
      accepted: false,
      code: 'EVENT_CLAIM_LOST',
      retryable: true,
    } as const;
    const noMigrationPort = makePort({
      [SCHEMA_MIGRATION_RPC.claimEvent]: () => ({ status: 'new' }),
      [SCHEMA_MIGRATION_RPC.acknowledgeEvent]: () => lost,
    });
    const noMigrationWorker = createSchemaMigrationWorker({
      port: noMigrationPort,
      workerId: 'worker-lost-ack',
      now: () => NOW,
      eventClaimTokenFactory: () => CLAIM_TOKEN_1,
    });
    const noMigration = {
      ...event,
      payload: { ...event.payload, migrationPlanId: null },
    };
    await expect(noMigrationWorker.process(noMigration)).resolves.toMatchObject(
      {
        outcome: 'retry',
        reasonCode: 'EVENT_CLAIM_LOST',
      },
    );

    const releasePort = makePort({
      [SCHEMA_MIGRATION_RPC.claimEvent]: () => ({ status: 'new' }),
      [SCHEMA_MIGRATION_RPC.readPlan]: () =>
        basePlan({ id: PLAN_ID, toVersionId: TARGET_VERSION_ID }),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: false,
        reasonCode: 'LEASE_HELD',
      }),
      [SCHEMA_MIGRATION_RPC.releaseEvent]: () => ({
        released: false,
        code: 'EVENT_CLAIM_LOST',
        retryable: true,
      }),
    });
    const releaseWorker = createSchemaMigrationWorker({
      port: releasePort,
      workerId: 'worker-lost-release',
      now: () => NOW,
      eventClaimTokenFactory: () => CLAIM_TOKEN_2,
    });
    await expect(releaseWorker.process(event)).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'EVENT_CLAIM_LOST',
    });
  });

  it('fails closed on transport and malformed release responses', async () => {
    const handlers = {
      [SCHEMA_MIGRATION_RPC.claimEvent]: () => ({ status: 'new' }),
      [SCHEMA_MIGRATION_RPC.readPlan]: () =>
        basePlan({ id: PLAN_ID, toVersionId: TARGET_VERSION_ID }),
      [SCHEMA_MIGRATION_RPC.claimLease]: () => ({
        acquired: false,
        reasonCode: 'LEASE_HELD',
      }),
    };
    const unavailablePort = makePort({
      ...handlers,
      [SCHEMA_MIGRATION_RPC.releaseEvent]: () => {
        throw { code: 'RELEASE_UNAVAILABLE', retryable: true } as const;
      },
    });
    const unavailableWorker = createSchemaMigrationWorker({
      port: unavailablePort,
      workerId: 'worker-release-unavailable',
      now: () => NOW,
      eventClaimTokenFactory: () => CLAIM_TOKEN_1,
    });
    await expect(unavailableWorker.process(event)).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'RELEASE_UNAVAILABLE',
    });

    const malformedPort = makePort({
      ...handlers,
      [SCHEMA_MIGRATION_RPC.releaseEvent]: () => ({ released: false }),
    });
    const malformedWorker = createSchemaMigrationWorker({
      port: malformedPort,
      workerId: 'worker-release-malformed',
      now: () => NOW,
      eventClaimTokenFactory: () => CLAIM_TOKEN_2,
    });
    await expect(malformedWorker.process(event)).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('rejects an unsafe token factory before contacting persistence', async () => {
    const port = makePort();
    const worker = createSchemaMigrationWorker({
      port,
      workerId: 'worker-invalid-event-token',
      eventClaimTokenFactory: () => 'not-a-uuid',
    });

    await expect(worker.process(event)).rejects.toThrow(
      'event claim token factory returned an invalid token',
    );
    expect(port.calls).toHaveLength(0);
  });
});
