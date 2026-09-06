import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryAc211MeasurementReportSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence.ts';
import {
  validMeasurement,
  validOutput,
} from './phase-02-slice-09-ac211-collector-fixtures.ts';

describe('Slice 09 AC211 measurement contract', () => {
  it('accepts locked SLO values, completeness, and a dataset digest', () => {
    expect(
      ContentSchemaRegistryAc211MeasurementReportSchema.parse(validMeasurement),
    ).toEqual(validMeasurement);
  });

  it('rejects arbitrary provider payload fields', () => {
    expect(
      ContentSchemaRegistryAc211MeasurementReportSchema.safeParse({
        ...validMeasurement,
        providerResponse: { authorization: 'Bearer secret' },
      }).success,
    ).toBe(false);
  });

  it('rejects malformed timestamps and dataset digests', () => {
    expect(
      ContentSchemaRegistryAc211MeasurementReportSchema.safeParse({
        ...validMeasurement,
        createdAt: 'not-a-timestamp',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryAc211MeasurementReportSchema.safeParse({
        ...validMeasurement,
        datasetDigest: 'short',
      }).success,
    ).toBe(false);
  });

  it('keeps the fixture measurement nested in the collector output', () => {
    expect(validOutput.measurement).toEqual(validMeasurement);
  });
});
