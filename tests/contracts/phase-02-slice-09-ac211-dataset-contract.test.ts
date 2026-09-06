import { describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE,
  ContentSchemaRegistryAc211DatasetReportSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import { validDataset } from './phase-02-slice-09-ac211-collector-fixtures.ts';

describe('Slice 09 AC211 dataset contract', () => {
  it('accepts a bounded, fully redacted dataset report', () => {
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.parse(validDataset),
    ).toEqual(validDataset);
    expect(CONTENT_SCHEMA_REGISTRY_AC211_PROVIDER_PROVENANCE).toEqual([
      'cloudflare_workers_logs',
      'cloudflare_queue_analytics',
    ]);
  });

  it('rejects arbitrary provider payload fields', () => {
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        providerResponse: { token: 'secret' },
      }).success,
    ).toBe(false);
  });

  it('rejects invalid provenance, non-production identity, and incomplete collection', () => {
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        providerProvenance: ['https://api.example.test'],
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        environment: 'staging',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        completeness: { ...validDataset.completeness, complete: false },
      }).success,
    ).toBe(false);
  });

  it('rejects unsafe numeric values and values above collector caps', () => {
    for (const duration of [-1, Number.NaN, Number.POSITIVE_INFINITY])
      expect(
        ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
          ...validDataset,
          durationsMs: {
            ...validDataset.durationsMs,
            command: [duration],
          },
        }).success,
      ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        counts: { ...validDataset.counts, queueAttempts: 64_001 },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        completeness: {
          ...validDataset.completeness,
          eventsRead: 64_001,
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        completeness: {
          ...validDataset.completeness,
          apiEvidenceGroups: 1_201,
        },
      }).success,
    ).toBe(false);
    for (const queueAnalytics of [
      { ...validDataset.queueAnalytics, queueAttempts: 0 },
      { ...validDataset.queueAnalytics, dlqMessages: 2, queueAttempts: 1 },
    ])
      expect(
        ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
          ...validDataset,
          queueAnalytics,
        }).success,
      ).toBe(false);
  });

  it('rejects malformed UTC windows and timestamps', () => {
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        window: {
          startedAt: '2026-09-02T01:00:00.000Z',
          endedAt: '2026-09-03T01:00:00.000Z',
        },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        createdAt: 'not-a-timestamp',
      }).success,
    ).toBe(false);
  });

  it('rejects duplicate provenance values and duration arrays beyond the cap', () => {
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        providerProvenance: [
          'cloudflare_workers_logs',
          'cloudflare_workers_logs',
        ],
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        durationsMs: {
          ...validDataset.durationsMs,
          command: Array.from({ length: 64_001 }, () => 1),
        },
      }).success,
    ).toBe(false);
  });

  it('requires complete provider coverage and matching provider event counts', () => {
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        providerProvenance: [
          'cloudflare_workers_logs',
          'supabase_operational_rpc',
        ],
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211DatasetReportSchema.safeParse({
        ...validDataset,
        completeness: {
          ...validDataset.completeness,
          eventsRead: 1_199,
        },
      }).success,
    ).toBe(false);
  });
});
