import { describe, expect, it } from 'vitest';

import { admitMigrationInput } from './migration-worker-admission';
import type {
  SchemaMigrationJobPayload,
  SchemaMigrationQueueEnvelope,
} from './migration-worker';
import { SCHEMA_MIGRATION_RPC } from './migration-worker-constants';
import {
  createMigrationWorkerRuntime,
  scopeMigrationWorkerRuntime,
} from './migration-worker-runtime';
import { runVerificationStage } from './migration-worker-verification';
import {
  basePlan,
  event,
  job,
  makePort,
  NOW,
} from './migration-worker-test-support';

const signal = new AbortController().signal;
type Handler = (
  request: unknown,
  signal: AbortSignal,
) => unknown | Promise<unknown>;
const runtimeFor = (
  handlers: Partial<Record<keyof typeof SCHEMA_MIGRATION_RPC, Handler>> = {},
) => {
  const rpcHandlers = Object.fromEntries(
    Object.entries(handlers).map(([name, handler]) => [
      SCHEMA_MIGRATION_RPC[name as keyof typeof SCHEMA_MIGRATION_RPC],
      handler,
    ]),
  ) as NonNullable<Parameters<typeof makePort>[0]>;
  if (rpcHandlers[SCHEMA_MIGRATION_RPC.releaseEvent] === undefined)
    rpcHandlers[SCHEMA_MIGRATION_RPC.releaseEvent] = () => ({ released: true });
  return scopeMigrationWorkerRuntime(
    createMigrationWorkerRuntime({
      port: makePort(rpcHandlers),
      workerId: 'admission-verification-worker',
      now: () => NOW,
    }),
    event,
    '83000000-0000-4000-8000-000000000003',
  );
};
const admission = (
  handlers: Partial<Record<keyof typeof SCHEMA_MIGRATION_RPC, Handler>>,
  input: {
    event: SchemaMigrationQueueEnvelope | null;
    job: SchemaMigrationJobPayload | null;
  } = {
    event,
    job,
  },
) => admitMigrationInput(runtimeFor(handlers), input, signal, 0, false);
const verificationInput = (
  runtime: ReturnType<typeof runtimeFor>,
  plan = basePlan({ state: 'verifying' }),
  eventValue: typeof event | null = event,
) => ({
  runtime,
  plan,
  event: eventValue,
  job,
  leaseToken: 'lease-token',
  signal,
  attempt: 0,
});
const completionHandlers = (
  activate: Handler,
  reconcile: Handler = () => ({ activated: false }),
) => ({
  verify: () => ({ valid: true }),
  complete: () => ({ plan: basePlan({ state: 'completed', progress: 1 }) }),
  activate,
  reconcileActivation: reconcile,
  rollback: () => ({}),
  acknowledgeEvent: () => ({ accepted: true }),
});

describe('migration worker admission and verification coverage', () => {
  it('handles event claim outcomes and no-migration events', async () => {
    await expect(
      admission({
        claimEvent: () => {
          throw { code: 'CLAIM_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({ outcome: 'retry', reasonCode: 'CLAIM_FAILURE' });
    await expect(admission({ claimEvent: () => ({}) })).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });
    for (const status of ['duplicate', 'in_progress', 'stale']) {
      await expect(
        admission({ claimEvent: () => ({ status }) }),
      ).resolves.toMatchObject({
        outcome:
          status === 'stale'
            ? 'stale'
            : status === 'in_progress'
              ? 'retry'
              : 'duplicate',
      });
    }
    const eventWithoutPlan = {
      ...event,
      payload: { ...event.payload, migrationPlanId: null },
    };
    await expect(
      admission(
        {
          claimEvent: () => ({ status: 'new' }),
          acknowledgeEvent: () => ({ accepted: true }),
        },
        { event: eventWithoutPlan, job: null },
      ),
    ).resolves.toMatchObject({
      outcome: 'completed',
      reasonCode: null,
    });
  });

  it('retries an in-progress claim so a reserved event is not transport-acknowledged', async () => {
    await expect(
      admission({ claimEvent: () => ({ status: 'in_progress' }) }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'EVENT_IN_PROGRESS',
    });
  });

  it('handles plan reads, stale state, terminal state, and admission success', async () => {
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => {
          throw { code: 'READ_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({ outcome: 'retry', reasonCode: 'READ_FAILURE' });
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({ plan: {} }),
        deadLetter: () => ({ accepted: true }),
      }),
    ).resolves.toMatchObject({ outcome: 'dead_letter' });
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({
          plan: basePlan({ toVersionId: basePlan().contentTypeId }),
        }),
        acknowledgeEvent: () => ({ accepted: true }),
      }),
    ).resolves.toMatchObject({
      outcome: 'stale',
      reasonCode: 'PLAN_TARGET_MISMATCH',
    });
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({ plan: basePlan({ version: '8' }) }),
        acknowledgeEvent: () => ({ accepted: true }),
      }),
    ).resolves.toMatchObject({
      outcome: 'stale',
      reasonCode: 'PLAN_VERSION_MISMATCH',
    });
    for (const state of ['completed', 'failed_terminal', 'blocked'] as const) {
      await expect(
        admission({
          claimEvent: () => ({ status: 'new' }),
          readPlan: () => ({
            plan: basePlan({ state, progress: state === 'completed' ? 1 : 0 }),
          }),
          acknowledgeEvent: () => ({ accepted: true }),
        }),
      ).resolves.toMatchObject({
        outcome: state === 'completed' ? 'completed' : state,
        state,
      });
    }
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({ plan: basePlan({ state: 'draft' }) }),
      }),
    ).resolves.toMatchObject({ plan: { state: 'draft' }, job });
  });

  it('covers verification, completion, activation reconciliation, and rollback', async () => {
    await expect(
      runVerificationStage(
        verificationInput(runtimeFor(), basePlan({ state: 'ready' })),
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'UNEXPECTED_MIGRATION_STATE',
    });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            verify: () => {
              throw { code: 'VERIFY_FAILURE', retryable: true } as const;
            },
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'VERIFY_FAILURE',
    });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            verify: () => ({ nope: true }),
            acknowledgeEvent: () => ({ accepted: true }),
          }),
        ),
      ),
    ).resolves.toMatchObject({ reasonCode: 'DEPENDENCY_INVALID_RESPONSE' });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            verify: () => ({ valid: false, reasonCode: 'BAD_ROWS' }),
            acknowledgeEvent: () => ({ accepted: true }),
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'BAD_ROWS',
    });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            verify: () => ({ valid: false, reasonCode: 'bad token' }),
            acknowledgeEvent: () => ({ accepted: true }),
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'VERIFICATION_FAILED',
    });

    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            ...completionHandlers(() => ({ accepted: true })),
            complete: () => {
              throw { code: 'COMPLETE_FAILURE', retryable: true } as const;
            },
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'COMPLETE_FAILURE',
    });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            ...completionHandlers(() => ({ accepted: true })),
            complete: () => ({ bad: true }),
          }),
        ),
      ),
    ).resolves.toMatchObject({ reasonCode: 'DEPENDENCY_INVALID_RESPONSE' });

    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor(
            completionHandlers(
              () => {
                throw { code: 'ACTIVATE_FAILURE', retryable: true } as const;
              },
              () => ({ activated: true }),
            ),
          ),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: true,
    });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor(
            completionHandlers(() => {
              throw { code: 'ACTIVATE_FAILURE', retryable: true } as const;
            }),
          ),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_retryable',
      reasonCode: 'ACTIVATE_FAILURE',
    });
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor(completionHandlers(() => ({ activated: false }))),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'failed_terminal',
      reasonCode: 'ACTIVATION_NOT_COMMITTED',
    });
    for (const status of ['already_active', 'duplicate']) {
      await expect(
        runVerificationStage(
          verificationInput(
            runtimeFor(
              completionHandlers(() => ({ status, activated: false })),
            ),
          ),
        ),
      ).resolves.toMatchObject({
        outcome: 'completed',
        activationSwitched: false,
      });
    }
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor(completionHandlers(() => ({ activated: true }))),
          basePlan({ state: 'verifying' }),
          null,
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: true,
    });
  });

  it('retries instead of completing when an ignored-event acknowledgement fails', async () => {
    await expect(
      admission(
        {
          claimEvent: () => ({ status: 'new' }),
          acknowledgeEvent: () => {
            throw { code: 'ACK_FAILURE', retryable: true } as const;
          },
        },
        {
          event: {
            ...event,
            payload: { ...event.payload, migrationPlanId: null },
          },
          job: null,
        },
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'ACK_FAILURE',
    });
  });

  it('dead-letters an ignored event when acknowledgement is not retryable', async () => {
    await expect(
      admission(
        {
          claimEvent: () => ({ status: 'new' }),
          acknowledgeEvent: () => {
            throw { code: 'ACK_REJECTED', retryable: false } as const;
          },
          deadLetter: () => ({ accepted: true }),
        },
        {
          event: {
            ...event,
            payload: { ...event.payload, migrationPlanId: null },
          },
          job: null,
        },
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'ACK_REJECTED',
    });
  });

  it('fails closed when an acknowledgement response is not accepted', async () => {
    await expect(
      admission(
        {
          claimEvent: () => ({ status: 'new' }),
          acknowledgeEvent: () => ({ accepted: false }),
          deadLetter: () => ({ accepted: true }),
        },
        {
          event: {
            ...event,
            payload: { ...event.payload, migrationPlanId: null },
          },
          job: null,
        },
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('does not return a terminal result when terminal-event acknowledgement fails', async () => {
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({ plan: basePlan({ state: 'failed_terminal' }) }),
        acknowledgeEvent: () => {
          throw { code: 'TERMINAL_ACK_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'TERMINAL_ACK_FAILURE',
    });
  });

  it('does not return completed when a completed-plan acknowledgement fails', async () => {
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({
          plan: basePlan({ state: 'completed', progress: 1 }),
        }),
        acknowledgeEvent: () => {
          throw { code: 'COMPLETED_ACK_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'COMPLETED_ACK_FAILURE',
    });
  });

  it('does not return stale while a newly claimed event remains reserved', async () => {
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({
          plan: basePlan({ toVersionId: basePlan().contentTypeId }),
        }),
        acknowledgeEvent: () => {
          throw { code: 'STALE_ACK_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'STALE_ACK_FAILURE',
    });
  });

  it('does not return version-stale while a newly claimed event remains reserved', async () => {
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({ plan: basePlan({ version: '8' }) }),
        acknowledgeEvent: () => {
          throw { code: 'VERSION_STALE_ACK_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'VERSION_STALE_ACK_FAILURE',
    });
  });

  it('does not return blocked while a newly claimed event remains reserved', async () => {
    await expect(
      admission({
        claimEvent: () => ({ status: 'new' }),
        readPlan: () => ({ plan: basePlan({ state: 'blocked' }) }),
        releaseEvent: () => {
          throw { code: 'BLOCKED_RELEASE_FAILURE', retryable: true } as const;
        },
      }),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'BLOCKED_RELEASE_FAILURE',
    });
  });

  it('retries instead of completing when verification acknowledgement fails', async () => {
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            ...completionHandlers(() => ({ activated: true })),
            acknowledgeEvent: () => {
              throw { code: 'VERIFY_ACK_FAILURE', retryable: true } as const;
            },
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'VERIFY_ACK_FAILURE',
    });
  });

  it('dead-letters when verification acknowledgement is not accepted', async () => {
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            ...completionHandlers(() => ({ activated: true })),
            acknowledgeEvent: () => ({ accepted: false }),
            deadLetter: () => ({ accepted: true }),
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'DEPENDENCY_INVALID_RESPONSE',
    });
  });

  it('dead-letters after activation reconciliation when acknowledgement is not retryable', async () => {
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor({
            ...completionHandlers(
              () => {
                throw { code: 'ACTIVATE_FAILURE', retryable: true } as const;
              },
              () => ({ activated: true }),
            ),
            acknowledgeEvent: () => {
              throw {
                code: 'RECONCILE_ACK_REJECTED',
                retryable: false,
              } as const;
            },
            deadLetter: () => ({ accepted: true }),
          }),
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'dead_letter',
      reasonCode: 'RECONCILE_ACK_REJECTED',
    });
  });

  it('handles activation reconciliation without an event envelope', async () => {
    await expect(
      runVerificationStage(
        verificationInput(
          runtimeFor(
            completionHandlers(
              () => {
                throw { code: 'ACTIVATE_FAILURE', retryable: true } as const;
              },
              () => ({ activated: true }),
            ),
          ),
          basePlan({ state: 'verifying' }),
          null,
        ),
      ),
    ).resolves.toMatchObject({
      outcome: 'completed',
      activationSwitched: true,
      eventId: null,
    });
  });

  it('returns an event-free retry for an unexpected migration state', async () => {
    await expect(
      runVerificationStage(
        verificationInput(runtimeFor(), basePlan({ state: 'ready' }), null),
      ),
    ).resolves.toMatchObject({
      outcome: 'retry',
      reasonCode: 'UNEXPECTED_MIGRATION_STATE',
      eventId: null,
    });
  });
});
