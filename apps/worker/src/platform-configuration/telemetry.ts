import {
  ConfigChangeProposedTelemetrySchema,
  ConfigChangeTransitionedTelemetrySchema,
  ConfigDefinitionRegisteredTelemetrySchema,
  ConfigValueResolvedTelemetrySchema,
  type PlatformConfigurationTelemetry,
} from '@wejammin/contracts';

import type { WorkerContext, WorkerDependencies } from '../index';
import type { ConfigurationOutcome, ConfigurationPortInput } from './types';

type ActiveConfigurationTelemetry = Extract<
  PlatformConfigurationTelemetry,
  {
    operationId: 'CFG-05A-01' | 'CFG-05A-02' | 'CFG-05A-03' | 'CFG-05A-04';
  }
>;

const recordOf = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : {};

const stringValue = (
  record: Readonly<Record<string, unknown>>,
  key: string,
): string | null => (typeof record[key] === 'string' ? record[key] : null);

const numberValue = (
  record: Readonly<Record<string, unknown>>,
  key: string,
): number | null => (typeof record[key] === 'number' ? record[key] : null);

const booleanValue = (
  record: Readonly<Record<string, unknown>>,
  key: string,
): boolean | null => (typeof record[key] === 'boolean' ? record[key] : null);

const hash = async (
  value: string | null | undefined,
): Promise<string | null> => {
  if (value === null || value === undefined || value.length === 0) return null;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

const failedCode = (outcome: ConfigurationOutcome): string | null =>
  outcome.ok ? null : outcome.code;

const domainOutcome = (
  operationId: ConfigurationPortInput['operationId'],
  outcome: ConfigurationOutcome,
): ActiveConfigurationTelemetry['outcome'] => {
  if (outcome.ok) {
    const value = recordOf(outcome.value);
    if (
      operationId === 'CFG-05A-02' &&
      (value.compatibility === 'contract_fallback' || value.isDefault === true)
    )
      return 'fallback';
    if (
      operationId === 'CFG-05A-04' &&
      (outcome.status === 202 || value.resultingState === 'scheduled')
    )
      return 'pending';
    return 'success';
  }
  if (operationId === 'CFG-05A-02' && outcome.code === 'VALUE_UNAVAILABLE')
    return 'unknown';
  if (
    [
      'APPROVAL_INVALID',
      'DISALLOWED_CONTEXT',
      'FORBIDDEN',
      'INVALID_DEFINITION',
      'INVALID_REQUEST',
      'PROTECTED_SETTING',
      'STEP_UP_REQUIRED',
      'UNAUTHENTICATED',
      'VALUE_INVALID',
    ].includes(outcome.code)
  )
    return 'rejected';
  return 'failure';
};

const definitionTelemetry = async (
  context: WorkerContext,
  input: ConfigurationPortInput,
  outcome: ConfigurationOutcome,
  durationMs: number,
): Promise<ActiveConfigurationTelemetry> => {
  const body = recordOf(input.body);
  const value = outcome.ok ? recordOf(outcome.value) : {};
  return ConfigDefinitionRegisteredTelemetrySchema.parse({
    eventName: 'cfg.definition.registered',
    operationId: 'CFG-05A-01',
    requestId: context.get('requestId'),
    correlationId: context.get('correlationId'),
    durationMs,
    outcome: domainOutcome(input.operationId, outcome),
    definitionId: stringValue(value, 'definitionId'),
    version: stringValue(value, 'version'),
    keyHash: await hash(stringValue(body, 'key')),
    risk:
      stringValue(value, 'riskClass') ?? stringValue(body, 'riskClass') ?? null,
    releaseId: stringValue(body, 'contractRelease'),
    releasePrincipalHash: await hash(input.servicePrincipalId),
    metrics: {
      latencyMs: durationMs,
      rejectedProtectedDefinitions:
        failedCode(outcome) === 'PROTECTED_SETTING' ? 1 : 0,
    },
    traceSteps: ['release_principal', 'rpc', 'outbox'],
  });
};

const valueTelemetry = (
  context: WorkerContext,
  input: ConfigurationPortInput,
  outcome: ConfigurationOutcome,
  durationMs: number,
): ActiveConfigurationTelemetry => {
  const value = outcome.ok ? recordOf(outcome.value) : {};
  const fallback =
    value.compatibility === 'contract_fallback' || value.isDefault === true;
  return ConfigValueResolvedTelemetrySchema.parse({
    eventName: 'cfg.value.resolved',
    operationId: 'CFG-05A-02',
    requestId: context.get('requestId'),
    correlationId: context.get('correlationId'),
    durationMs,
    outcome: domainOutcome(input.operationId, outcome),
    definitionId: stringValue(value, 'definitionId'),
    version: stringValue(value, 'evaluatorVersion'),
    sourceScope: stringValue(value, 'sourceScope'),
    isDefault: booleanValue(value, 'isDefault'),
    compatibility: stringValue(value, 'compatibility'),
    metrics: {
      resolverLatencyMs: durationMs,
      fallbackCount: fallback ? 1 : 0,
      unknownCount: !outcome.ok && outcome.code === 'VALUE_UNAVAILABLE' ? 1 : 0,
    },
    traceSteps: ['db_query', 'evaluator'],
  });
};

const proposalTelemetry = (
  context: WorkerContext,
  input: ConfigurationPortInput,
  outcome: ConfigurationOutcome,
  durationMs: number,
): ActiveConfigurationTelemetry => {
  const value = outcome.ok ? recordOf(outcome.value) : {};
  return ConfigChangeProposedTelemetrySchema.parse({
    eventName: 'cfg.change.proposed',
    operationId: 'CFG-05A-03',
    requestId: context.get('requestId'),
    correlationId: context.get('correlationId'),
    durationMs,
    outcome: domainOutcome(input.operationId, outcome),
    reviewId: stringValue(value, 'reviewId'),
    candidateId: stringValue(value, 'candidateValueVersionId'),
    candidateVersion: stringValue(value, 'definitionVersion'),
    risk: 'unknown',
    metrics: {
      draftLatencyMs: durationMs,
      schemaRejectionCount:
        !outcome.ok &&
        ['INVALID_REQUEST', 'VALUE_INVALID'].includes(outcome.code)
          ? 1
          : 0,
    },
    traceSteps: ['validation', 'impact_planner', 'rpc', 'outbox'],
  });
};

const transitionTelemetry = (
  context: WorkerContext,
  input: ConfigurationPortInput,
  outcome: ConfigurationOutcome,
  durationMs: number,
): ActiveConfigurationTelemetry => {
  const body = recordOf(input.body);
  const value = outcome.ok ? recordOf(outcome.value) : {};
  return ConfigChangeTransitionedTelemetrySchema.parse({
    eventName: 'cfg.change.transitioned',
    operationId: 'CFG-05A-04',
    requestId: context.get('requestId'),
    correlationId: context.get('correlationId'),
    durationMs,
    outcome: domainOutcome(input.operationId, outcome),
    reviewId:
      stringValue(value, 'reviewId') ??
      stringValue(recordOf(input.path), 'reviewId'),
    action: stringValue(body, 'action'),
    resultingVersion: stringValue(value, 'resultingVersion'),
    approvalCount: numberValue(value, 'approvalCount'),
    snapshotIntentId: stringValue(value, 'snapshotIntentId'),
    metrics: {
      activationLatencyMs: durationMs,
      conflictCount:
        !outcome.ok &&
        ['IDEMPOTENCY_CONFLICT', 'VERSION_CONFLICT'].includes(outcome.code)
          ? 1
          : 0,
      pendingCount:
        outcome.ok &&
        (outcome.status === 202 || value.resultingState === 'scheduled')
          ? 1
          : 0,
    },
    traceSteps: ['rpc', 'outbox', 'compiler'],
  });
};

const buildTelemetry = async (
  context: WorkerContext,
  input: ConfigurationPortInput,
  outcome: ConfigurationOutcome,
  durationMs: number,
): Promise<ActiveConfigurationTelemetry> => {
  switch (input.operationId) {
    case 'CFG-05A-01':
      return definitionTelemetry(context, input, outcome, durationMs);
    case 'CFG-05A-02':
      return valueTelemetry(context, input, outcome, durationMs);
    case 'CFG-05A-03':
      return proposalTelemetry(context, input, outcome, durationMs);
    case 'CFG-05A-04':
      return transitionTelemetry(context, input, outcome, durationMs);
    default:
      throw new Error('Admin workspace telemetry uses its own emitter.');
  }
};

const loggerOutcome = (
  outcome: ActiveConfigurationTelemetry['outcome'],
): 'success' | 'failure' | 'rejected' | 'retry' | 'unknown' => {
  if (outcome === 'fallback' || outcome === 'pending') return 'retry';
  return outcome;
};

export const emitPlatformConfigurationTelemetry = async (
  context: WorkerContext,
  dependencies: Pick<WorkerDependencies, 'now'>,
  input: ConfigurationPortInput,
  outcome: ConfigurationOutcome,
  startedAt: number,
): Promise<void> => {
  try {
    const durationMs = Math.max(0, dependencies.now() - startedAt);
    const event = await buildTelemetry(context, input, outcome, durationMs);
    const {
      eventName,
      operationId,
      outcome: eventOutcome,
      requestId,
      correlationId,
      durationMs: eventDurationMs,
      metrics,
      traceSteps,
      ...attributes
    } = event;
    const details = {
      attributes,
      correlationId,
      durationMs: eventDurationMs,
      eventName,
      metrics,
      operation: operationId,
      outcome: loggerOutcome(eventOutcome),
      requestId,
      traceSteps,
    } as const;
    const options = { highRisk: true, samplingClass: 'always' } as const;
    if (details.outcome === 'success')
      context.get('logger').info(details, options);
    else context.get('logger').warn(details, options);
  } catch {
    // Telemetry validation or sink failure must never alter a domain response.
  }
};
