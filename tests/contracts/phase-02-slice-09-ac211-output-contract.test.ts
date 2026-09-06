import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryAc211CollectorOutputSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  constantDurations,
  validDataset,
  validMeasurement,
  validOutput,
  validSlo,
} from './phase-02-slice-09-ac211-collector-fixtures.ts';

describe('Slice 09 AC211 collector output contract', () => {
  it('accepts the dataset, measurement, and existing SLO evidence shape', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.parse(validOutput),
    ).toEqual(validOutput);
  });

  it('rejects arbitrary provider payload fields at every report boundary', () => {
    for (const candidate of [
      { ...validDataset, providerResponse: { token: 'secret' } },
      {
        ...validMeasurement,
        providerResponse: { authorization: 'Bearer secret' },
      },
      { ...validOutput, rawEvents: [{ emailAddress: 'user@example.test' }] },
    ])
      expect(
        ContentSchemaRegistryAc211CollectorOutputSchema.safeParse(candidate)
          .success,
      ).toBe(false);
  });

  it('binds retained Queue Analytics identity and counts to the report', () => {
    for (const queueAnalytics of [
      { ...validDataset.queueAnalytics, date: '2026-09-01' },
      { ...validDataset.queueAnalytics, queryId: 'different-query' },
      { ...validDataset.queueAnalytics, queueAttempts: 999 },
      { ...validDataset.queueAnalytics, queueId: 'not-a-queue-id' },
    ])
      expect(
        ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
          ...validOutput,
          dataset: { ...validDataset, queueAnalytics },
        }).success,
      ).toBe(false);
  });

  it('rejects output when identity, window, counts, or completeness diverge', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          deploymentId: 'another-deployment',
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          window: {
            startedAt: '2026-09-01T00:00:00.000Z',
            endedAt: '2026-09-02T00:00:00.000Z',
          },
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          samples: { ...validMeasurement.samples, commands: 299 },
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          completeness: {
            ...validMeasurement.completeness,
            eventsRead: 1_199,
            providerEventCount: 1_199,
          },
        },
      }).success,
    ).toBe(false);
  });

  it('requires recomputed percentiles and a derived daily DLQ rate', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          observed: { ...validMeasurement.observed, commandP95Ms: 901 },
        },
        slo: {
          ...validSlo,
          observed: { ...validSlo.observed, commandP95Ms: 901 },
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          observed: { ...validMeasurement.observed, dailyDlqRate: 0.0005 },
        },
        slo: {
          ...validSlo,
          observed: { ...validSlo.observed, dailyDlqRate: 0.0005 },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects more first-attempt durations than total queue attempts', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        dataset: {
          ...validDataset,
          counts: { ...validDataset.counts, queueAttempts: 1 },
        },
        measurement: {
          ...validMeasurement,
          samples: { ...validMeasurement.samples, queueAttempts: 1 },
        },
        slo: {
          ...validSlo,
          samples: { ...validSlo.samples, queueAttempts: 1 },
        },
      }).success,
    ).toBe(false);
  });

  it('requires at least 200 correlated API evidence groups', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        dataset: {
          ...validDataset,
          completeness: {
            ...validDataset.completeness,
            apiEvidenceGroups: 199,
          },
        },
        measurement: {
          ...validMeasurement,
          completeness: {
            ...validDataset.completeness,
            apiEvidenceGroups: 199,
          },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects threshold failures and report-integrity mismatches', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        dataset: {
          ...validDataset,
          durationsMs: {
            ...validDataset.durationsMs,
            command: constantDurations(1_200),
          },
        },
        measurement: {
          ...validMeasurement,
          observed: { ...validMeasurement.observed, commandP95Ms: 1_200 },
        },
        slo: {
          ...validSlo,
          observed: { ...validSlo.observed, commandP95Ms: 1_200 },
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        slo: {
          ...validSlo,
          datasetReport: { ...validSlo.datasetReport, sha256: 'c'.repeat(64) },
        },
      }).success,
    ).toBe(false);
    for (const path of ['reports/measurement.json', 'reports/dataset.json']) {
      const candidate = path.includes('measurement')
        ? {
            ...validOutput,
            slo: {
              ...validSlo,
              measurementReport: { ...validSlo.measurementReport, path },
            },
          }
        : {
            ...validOutput,
            slo: {
              ...validSlo,
              datasetReport: { ...validSlo.datasetReport, path },
            },
          };
      expect(
        ContentSchemaRegistryAc211CollectorOutputSchema.safeParse(candidate)
          .success,
      ).toBe(false);
    }
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        measurement: {
          ...validMeasurement,
          createdAt: '2026-09-03T12:10:01.000Z',
        },
      }).success,
    ).toBe(false);
  });

  it('bounds SLO-only counts and requires its complete UTC-day window', () => {
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        slo: {
          ...validSlo,
          samples: { ...validSlo.samples, errorCount: 64_001 },
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211CollectorOutputSchema.safeParse({
        ...validOutput,
        slo: {
          ...validSlo,
          window: {
            ...validSlo.window,
            endedAt: '2026-09-02T12:00:00.000Z',
          },
        },
      }).success,
    ).toBe(false);
  });
});
