import {
  ConfigChangeProposedTelemetrySchema,
  ConfigChangeTransitionedTelemetrySchema,
  ConfigDefinitionRegisteredTelemetrySchema,
  ConfigExperimentChangedTelemetrySchema,
  ConfigFlagChangedTelemetrySchema,
  ConfigKillSwitchChangedTelemetrySchema,
  ConfigValueResolvedTelemetrySchema,
  PlatformConfigurationTelemetrySchema,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

const id = '018f2f72-4b5a-7c9d-8e1f-123456789abc';
const otherId = '018f2f72-4b5a-7c9d-8e1f-123456789abd';
const hash = 'a'.repeat(64);
const base = {
  requestId: '11111111-1111-4111-8111-111111111111',
  correlationId: '22222222-2222-4222-8222-222222222222',
  durationMs: 12,
  outcome: 'success',
} as const;

describe('Phase 2 Slice 07 redacted telemetry contracts', () => {
  it('[P2-S07-AC-044] locks registration fields, counters, traces, and redaction', () => {
    const event = ConfigDefinitionRegisteredTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.definition.registered',
      operationId: 'CFG-05A-01',
      definitionId: id,
      version: '1',
      keyHash: hash,
      risk: 'high',
      releaseId: 'phase-2.7',
      releasePrincipalHash: hash,
      metrics: { latencyMs: 12, rejectedProtectedDefinitions: 0 },
      traceSteps: ['release_principal', 'rpc', 'outbox'],
    });

    expect(event.eventName).toBe('cfg.definition.registered');
    expect(
      ConfigDefinitionRegisteredTelemetrySchema.safeParse({
        ...event,
        schema: { type: 'boolean' },
      }).success,
    ).toBe(false);
    expect(
      ConfigDefinitionRegisteredTelemetrySchema.safeParse({
        ...event,
        defaultValue: 'secret-default',
      }).success,
    ).toBe(false);
  });

  it('[P2-S07-AC-045] locks resolver metrics and permits no typed value or subject ID', () => {
    const event = ConfigValueResolvedTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.value.resolved',
      operationId: 'CFG-05A-02',
      definitionId: id,
      version: '1',
      sourceScope: 'party',
      isDefault: false,
      compatibility: 'exact',
      metrics: { fallbackCount: 0, resolverLatencyMs: 12, unknownCount: 0 },
      traceSteps: ['db_query', 'evaluator'],
    });

    expect(
      ConfigValueResolvedTelemetrySchema.safeParse({
        ...event,
        typedValue: 'private-value',
      }).success,
    ).toBe(false);
    expect(
      ConfigValueResolvedTelemetrySchema.safeParse({
        ...event,
        subjectId: otherId,
      }).success,
    ).toBe(false);
  });

  it('[P2-S07-AC-046,P2-S07-AC-047] locks proposal and transition observability', () => {
    const proposed = ConfigChangeProposedTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.change.proposed',
      operationId: 'CFG-05A-03',
      reviewId: id,
      candidateId: otherId,
      candidateVersion: '1',
      risk: 'unknown',
      metrics: { draftLatencyMs: 12, schemaRejectionCount: 0 },
      traceSteps: ['validation', 'impact_planner', 'rpc', 'outbox'],
    });
    const transitioned = ConfigChangeTransitionedTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.change.transitioned',
      operationId: 'CFG-05A-04',
      reviewId: id,
      action: 'activate',
      resultingVersion: '2',
      approvalCount: 2,
      snapshotIntentId: otherId,
      metrics: {
        activationLatencyMs: 12,
        conflictCount: 0,
        pendingCount: 0,
      },
      traceSteps: ['rpc', 'outbox', 'compiler'],
    });

    expect(
      ConfigChangeProposedTelemetrySchema.safeParse({
        ...proposed,
        manifest: { private: true },
      }).success,
    ).toBe(false);
    expect(
      ConfigChangeTransitionedTelemetrySchema.safeParse({
        ...transitioned,
        rollbackValue: 'private',
      }).success,
    ).toBe(false);
  });

  it('[P2-S07-AC-048..P2-S07-AC-050] locks deferred producer contracts without sensitive dimensions, assignments, reasons, or tokens', () => {
    const flag = ConfigFlagChangedTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.flag.changed',
      operationId: 'CFG-05A-05',
      flagId: id,
      version: '1',
      state: 'active',
      environmentCount: 2,
      expiry: '2026-09-03T03:00:00.000Z',
      metrics: { fallbackCount: 0, staleOwnerCount: 0 },
      traceSteps: ['policy', 'evaluator'],
    });
    const experiment = ConfigExperimentChangedTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.experiment.changed',
      operationId: 'CFG-05A-06',
      experimentId: id,
      version: '1',
      state: 'running',
      dimensionCount: 2,
      consentStatus: 'verified',
      metrics: {
        assignmentDeterminismFailures: 0,
        protectedDimensionRejects: 0,
      },
      traceSteps: ['consent_registry'],
    });
    const killSwitch = ConfigKillSwitchChangedTelemetrySchema.parse({
      ...base,
      eventName: 'cfg.kill_switch.changed',
      operationId: 'CFG-05A-07',
      switchId: id,
      version: '1',
      activationId: otherId,
      scopeType: 'platform',
      runtimeHash: hash,
      state: 'active',
      metrics: {
        activationLatencyMs: 12,
        fallbackCount: 0,
        reconciliationLagMs: 0,
      },
      traceSteps: ['step_up', 'rpc', 'runtime_verification'],
    });

    for (const [schema, event, forbidden] of [
      [ConfigFlagChangedTelemetrySchema, flag, { cohortKeyValue: 'private' }],
      [
        ConfigExperimentChangedTelemetrySchema,
        experiment,
        { individualAssignment: otherId },
      ],
      [
        ConfigKillSwitchChangedTelemetrySchema,
        killSwitch,
        { reason: 'private' },
      ],
      [
        ConfigKillSwitchChangedTelemetrySchema,
        killSwitch,
        { token: 'private' },
      ],
    ] as const) {
      expect(schema.safeParse({ ...event, ...forbidden }).success).toBe(false);
    }
    for (const event of [flag, experiment, killSwitch]) {
      expect(PlatformConfigurationTelemetrySchema.parse(event)).toEqual(event);
    }
  });
});
