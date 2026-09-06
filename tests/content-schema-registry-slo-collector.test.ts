import { mkdirSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  ContentSchemaRegistryAc211CollectorOutputSchema,
  CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  buildContentSchemaRegistrySloEvidence,
  serializeContentSchemaRegistrySloReport,
  writeContentSchemaRegistrySloEvidence,
} from '../infra/workflows/collect-content-schema-registry-slo-evidence.ts';
import type {
  NormalizedWorkersObservabilityEvent,
  QueryQueueMessageOperationsResult,
  QueryWorkersObservabilityEventsResult,
} from '../infra/workflows/content-schema-registry-slo-provider.ts';

const sourceRevision = 'a'.repeat(40);
const window = {
  startedAt: '2026-09-07T00:00:00.000Z',
  endedAt: '2026-09-08T00:00:00.000Z',
} as const;

const event = (
  cursor: string,
  eventName: string,
  durationMs: number,
  overrides: Partial<NormalizedWorkersObservabilityEvent> = {},
): NormalizedWorkersObservabilityEvent => ({
  cursor,
  durationMs,
  environment: 'production',
  eventName,
  operation: 'cms.registry.CMS-03A-01',
  outcome: 'success',
  release: sourceRevision,
  service: 'wejammin-api',
  timestamp: '2026-09-07T12:00:00.000Z',
  ...overrides,
});

const measuredEvents = (): NormalizedWorkersObservabilityEvent[] => {
  const events: NormalizedWorkersObservabilityEvent[] = [];
  for (let index = 0; index < 200; index += 1) {
    const requestId = `request-${index}`;
    const outcome = index === 0 ? 'failure' : 'success';
    events.push(
      event(`request-${index}`, 'cms.registry.request', 100 + index, {
        outcome,
        requestId,
      }),
      event(`command-${index}`, 'cms.registry.command', 100 + index, {
        outcome,
        requestId,
      }),
      event(`rpc-${index}`, 'cms.registry.rpc', 50 + index, {
        outcome,
        requestId,
      }),
      event(`acceptance-${index}`, 'cms.registry.acceptance', 200 + index, {
        outcome,
        requestId,
      }),
    );
  }
  events.push(
    event('queue-first', 'cms.registry.queue_attempt', 42_000, {
      attempt: 1,
      operation: 'migration.consume',
      service: 'wejammin-cms-migration-worker',
    }),
    event('queue-retry', 'cms.registry.queue_attempt', 50_000, {
      attempt: 2,
      operation: 'migration.consume',
      outcome: 'failure',
      retryable: true,
      service: 'wejammin-cms-migration-worker',
    }),
    event('migration-success', 'cms.registry.migration', 300, {
      operation: 'migration.batch',
      service: 'wejammin-cms-migration-worker',
    }),
  );
  return events;
};

const telemetry = (
  events = measuredEvents(),
): QueryWorkersObservabilityEventsResult => ({
  events,
  pageCount: 2,
  providerEventCount: events.length,
});

const queue: QueryQueueMessageOperationsResult = {
  date: '2026-09-07',
  dlqMessages: 0,
  queueId: 'c'.repeat(32),
  queueAttempts: 10_000,
  queryId: 'wejammin-ac211-20260907',
};

const build = (workers = telemetry(), queueCounts = queue) =>
  buildContentSchemaRegistrySloEvidence({
    createdAt: '2026-09-08T01:00:00.000Z',
    deploymentId: '6291034733',
    productionDeployedAt: '2026-09-06T08:50:00.000Z',
    queryId: 'wejammin-ac211-20260907',
    queue: queueCounts,
    sourceRevision,
    telemetry: workers,
    window,
  });

describe('content schema registry AC211 SLO collector', () => {
  it('builds a strict redacted report set from one complete production UTC day', () => {
    const output = build();

    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.parse(output),
    ).toEqual(output);
    expect(output.dataset.durationsMs.command).toHaveLength(200);
    expect(output.dataset.durationsMs.protectedRpc).toHaveLength(200);
    expect(output.dataset.durationsMs.acceptance).toHaveLength(200);
    expect(output.dataset.durationsMs.queueFirstAttempt).toEqual([42_000]);
    expect(output.dataset.completeness.apiEvidenceGroups).toBe(200);
    expect(output.measurement.samples).toEqual({
      acceptances: 200,
      commands: 200,
      dlqMessages: 0,
      errorCount: 2,
      protectedRpcs: 200,
      queueAttempts: 10_000,
    });
    expect(output.measurement.thresholds).toEqual(
      CONTENT_SCHEMA_REGISTRY_SLO_THRESHOLDS,
    );
    expect(output.measurement.observed).toEqual({
      acceptanceP99Ms: 397,
      commandP95Ms: 289,
      dailyDlqRate: 0,
      protectedRpcP95Ms: 239,
      queueFirstAttemptP95Ms: 42_000,
    });
    expect(output.slo.datasetReport).toEqual({
      path: 'slo/dataset.json',
      sha256: output.measurement.datasetDigest,
    });
    expect(output.slo.measurementReport.path).toBe('slo/measurement.json');
    expect(JSON.stringify(output)).not.toMatch(
      /authorization|bearer|request-failure|queue-first|cursor|requestId/iu,
    );
  });

  it('uses deterministic newline-terminated JSON for retained digests', () => {
    const output = build();
    const first = serializeContentSchemaRegistrySloReport(output.dataset);
    const second = serializeContentSchemaRegistrySloReport(output.dataset);

    expect(first).toBe(second);
    expect(first.endsWith('\n')).toBe(true);
    expect(first).not.toContain(sourceRevision.slice(0, 10).toUpperCase());
  });

  it('writes only the three bounded retained report files without overwriting', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac211-'));
    const output = build();
    const paths = writeContentSchemaRegistrySloEvidence(output, root);

    expect(paths).toEqual({
      dataset: join(root, 'slo/dataset.json'),
      measurement: join(root, 'slo/measurement.json'),
      slo: join(root, 'slo/ac211-slo.json'),
    });
    expect(JSON.parse(readFileSync(paths.dataset, 'utf8'))).toEqual(
      output.dataset,
    );
    expect(JSON.parse(readFileSync(paths.measurement, 'utf8'))).toEqual(
      output.measurement,
    );
    expect(JSON.parse(readFileSync(paths.slo, 'utf8'))).toEqual(output.slo);
    expect(() => writeContentSchemaRegistrySloEvidence(output, root)).toThrow(
      'already exists',
    );

    const occupiedRoot = mkdtempSync(join(tmpdir(), 'wejammin-ac211-'));
    mkdirSync(join(occupiedRoot, 'slo'));
    expect(() =>
      writeContentSchemaRegistrySloEvidence(output, occupiedRoot),
    ).toThrow('already exists');
    expect(readdirSync(join(occupiedRoot, 'slo'))).toEqual([]);
    expect(
      readdirSync(occupiedRoot).filter((entry) => entry.startsWith('.ac211-')),
    ).toEqual([]);

    const lockedRoot = mkdtempSync(join(tmpdir(), 'wejammin-ac211-'));
    mkdirSync(join(lockedRoot, '.ac211-publish.lock'));
    expect(() =>
      writeContentSchemaRegistrySloEvidence(output, lockedRoot),
    ).toThrow('already exists');
    expect(readdirSync(lockedRoot)).toEqual(['.ac211-publish.lock']);
  });

  it('fails closed on insufficient samples and missing queue evidence', () => {
    const tooFewCommands = measuredEvents().filter(
      (candidate) =>
        candidate.eventName !== 'cms.registry.command' ||
        candidate.cursor !== 'command-199',
    );
    expect(() => build(telemetry(tooFewCommands))).toThrow(
      'AC211 production samples are insufficient',
    );
    expect(() =>
      build(telemetry(), { dlqMessages: 0, queueAttempts: 0 }),
    ).toThrow('AC211 queue evidence is insufficient');
    const noFirstAttempt = measuredEvents().filter(
      (candidate) =>
        !(
          candidate.eventName === 'cms.registry.queue_attempt' &&
          candidate.attempt === 1
        ),
    );
    expect(() => build(telemetry(noFirstAttempt))).toThrow(
      'AC211 queue first-attempt samples are insufficient',
    );
  });

  it('rejects threshold equality and inconsistent provider completeness', () => {
    const equality = measuredEvents().map((candidate) =>
      candidate.eventName === 'cms.registry.command' &&
      Number(candidate.cursor.split('-').at(-1)) >= 189
        ? { ...candidate, durationMs: 1_200 }
        : candidate,
    );
    expect(() => build(telemetry(equality))).toThrow(
      'AC211 production SLO thresholds were not met',
    );
    expect(() =>
      build({
        ...telemetry(),
        providerEventCount: measuredEvents().length + 1,
      }),
    ).toThrow('Workers Observability collection is incomplete');
  });

  it('rejects mixed releases, out-of-window events, and pre-deployment windows', () => {
    const mixedRelease = measuredEvents();
    mixedRelease[0] = { ...mixedRelease[0]!, release: 'b'.repeat(40) };
    expect(() => build(telemetry(mixedRelease))).toThrow(
      'Workers Observability event identity is invalid',
    );

    const outside = measuredEvents();
    outside[0] = {
      ...outside[0]!,
      timestamp: '2026-09-08T00:00:00.000Z',
    };
    expect(() => build(telemetry(outside))).toThrow(
      'Workers Observability event window is invalid',
    );

    expect(() =>
      buildContentSchemaRegistrySloEvidence({
        createdAt: '2026-09-08T01:00:00.000Z',
        deploymentId: '6291034733',
        productionDeployedAt: '2026-09-07T00:00:00.001Z',
        queryId: 'wejammin-ac211-20260907',
        queue,
        sourceRevision,
        telemetry: telemetry(),
        window,
      }),
    ).toThrow('AC211 window predates the production deployment');
  });

  it('binds evidence events to exact services, operations, and outcomes', () => {
    const wrongService = measuredEvents();
    wrongService[0] = { ...wrongService[0]!, service: 'another-worker' };
    expect(() => build(telemetry(wrongService))).toThrow(
      'Workers Observability event identity is invalid',
    );

    const wrongOperation = measuredEvents();
    wrongOperation[0] = {
      ...wrongOperation[0]!,
      operation: 'cms.registry.CMS-03A-99',
    };
    expect(() => build(telemetry(wrongOperation))).toThrow(
      'Workers Observability event identity is invalid',
    );

    const wrongOutcome = measuredEvents();
    wrongOutcome[0] = { ...wrongOutcome[0]!, outcome: 'unknown' };
    expect(() => build(telemetry(wrongOutcome))).toThrow(
      'Workers Observability event identity is invalid',
    );

    const impossibleCommand = measuredEvents();
    const commandIndex = impossibleCommand.findIndex(
      (candidate) => candidate.eventName === 'cms.registry.command',
    );
    impossibleCommand[commandIndex] = {
      ...impossibleCommand[commandIndex]!,
      operation: 'cms.registry.CMS-03A-06',
    };
    expect(() => build(telemetry(impossibleCommand))).toThrow(
      'Workers Observability event identity is invalid',
    );

    const unknownEvent = measuredEvents();
    unknownEvent.push(event('unknown-event', 'cms.registry.unknown', 100));
    expect(() => build(telemetry(unknownEvent))).toThrow(
      'Workers Observability event identity is invalid',
    );

    const rejected = measuredEvents().map((candidate) =>
      candidate.requestId === 'request-1'
        ? { ...candidate, outcome: 'rejected' }
        : candidate,
    );
    expect(build(telemetry(rejected)).measurement.samples.errorCount).toBe(3);
  });

  it('requires complete API evidence groups correlated by request ID', () => {
    const unpaired = measuredEvents().filter(
      (candidate) => candidate.eventName !== 'cms.registry.request',
    );
    expect(() => build(telemetry(unpaired))).toThrow(
      'Workers Observability API evidence correlation is invalid',
    );
  });

  it('binds Queue Analytics counts to the exact report day and query', () => {
    expect(() => build(telemetry(), { ...queue, date: '2026-09-06' })).toThrow(
      'AC211 queue evidence is insufficient',
    );
    expect(() =>
      build(telemetry(), { ...queue, queryId: 'different-query' }),
    ).toThrow('AC211 queue evidence is insufficient');
  });
});
