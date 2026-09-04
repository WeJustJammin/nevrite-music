import { safeIdentifierDigest } from '../authentication/boundary';
import type { WorkerContext } from '../index';
import type { AdminWorkspacePortInput } from './types';
import type { AuthenticationResult } from '../authentication/types';

type RecordValue = Readonly<Record<string, unknown>>;
type Scalar = string | number | boolean | null;

const recordOf = (value: unknown): RecordValue =>
  typeof value === 'object' && value !== null ? (value as RecordValue) : {};

const stringValue = (record: RecordValue, key: string): string | null =>
  typeof record[key] === 'string' ? record[key] : null;

const arrayValue = (record: RecordValue, key: string): readonly unknown[] =>
  Array.isArray(record[key]) ? record[key] : [];

const outcomeFor = (
  outcome: AuthenticationResult<unknown>,
): 'success' | 'rejected' | 'failure' => {
  if (outcome.ok) return 'success';
  return [
    'FORBIDDEN',
    'GRANT_INVALID',
    'INVALID_REQUEST',
    'UNAUTHENTICATED',
    'UPSTREAM_TIMEOUT',
  ].includes(outcome.code)
    ? 'rejected'
    : 'failure';
};

const emit = async (
  context: WorkerContext,
  input: AdminWorkspacePortInput,
  outcome: AuthenticationResult<unknown>,
  startedAt: number,
  now: () => number,
  eventName: 'admin.inbox.read' | 'admin.capability.changed',
  attributes: Record<string, Scalar>,
  metrics: Record<string, number>,
  traceSteps: readonly string[],
): Promise<void> => {
  const details = {
    attributes,
    correlationId: context.get('correlationId'),
    durationMs: Math.max(0, now() - startedAt),
    eventName,
    metrics,
    operation: input.operationId,
    outcome: outcomeFor(outcome),
    requestId: context.get('requestId'),
    traceSteps: [...traceSteps],
  };
  const logger = context.get('logger');
  if (details.outcome === 'success')
    logger.info(details, { highRisk: true, samplingClass: 'always' });
  else logger.warn(details, { highRisk: true, samplingClass: 'always' });
};

export const emitAdminWorkspaceTelemetry = async (
  context: WorkerContext,
  input: AdminWorkspacePortInput,
  outcome: AuthenticationResult<unknown>,
  startedAt: number,
  now: () => number,
): Promise<void> => {
  try {
    if (input.operationId === 'CFG-05B-05') return;
    if (input.operationId === 'CFG-05B-01') {
      const value = recordOf(outcome.ok ? outcome.value : null);
      const items = arrayValue(value, 'items');
      const partialSources = arrayValue(value, 'partialSources');
      const partialSourceCount = partialSources.length;
      const freshness =
        stringValue(value, 'aggregateFreshness') ??
        (outcome.ok ? 'unknown' : 'unknown');
      await emit(
        context,
        input,
        outcome,
        startedAt,
        now,
        'admin.inbox.read',
        {
          actorHash: await safeIdentifierDigest(input.session.authUserId),
          taskCountState:
            outcome.ok && items.length === 0
              ? 'empty'
              : outcome.ok
                ? 'known'
                : 'unknown',
          partialSourceCount,
          freshness,
        },
        { latencyMs: Math.max(0, now() - startedAt), partialSourceCount },
        ['request_context', 'task_sources', 'rls'],
      );
      return;
    }
    const body = recordOf(input.body);
    const value = recordOf(outcome.ok ? outcome.value : null);
    await emit(
      context,
      input,
      outcome,
      startedAt,
      now,
      'admin.capability.changed',
      {
        grantId: stringValue(value, 'grantId') ?? stringValue(body, 'grantId'),
        subjectHash: await safeIdentifierDigest(
          stringValue(value, 'subjectPersonId') ??
            stringValue(body, 'subjectPersonId') ??
            '',
        ),
        capabilityKeyHash: await safeIdentifierDigest(
          stringValue(value, 'capabilityKey') ??
            stringValue(body, 'capabilityKey') ??
            '',
        ),
        resourceType:
          stringValue(value, 'resourceType') ??
          stringValue(body, 'resourceType'),
        startsAt:
          stringValue(value, 'startsAt') ?? stringValue(body, 'startsAt'),
        endsAt: stringValue(value, 'endsAt') ?? stringValue(body, 'endsAt'),
        state: stringValue(value, 'state'),
      },
      {
        latencyMs: Math.max(0, now() - startedAt),
        grantMutationCount: outcome.ok ? 1 : 0,
      },
      ['request_context', 'grant_policy', 'notification'],
    );
  } catch {
    // Telemetry failure cannot alter the admin operation response.
  }
};
