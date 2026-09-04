import { describe, expect, it } from 'vitest';

import { ContentTypeDraftRequestSchema } from '../../packages/contracts/src/content-schema-registry';
import {
  validDraft,
  validField,
} from '../../apps/worker/src/content-schema-registry/phase-02-slice-09-test-values';

const percentile = (
  values: readonly number[],
  percentileRank: number,
): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil(sorted.length * percentileRank) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? Number.NaN;
};

const fieldFor = (index: number) => ({
  stableFieldId: `018f0c45-73fe-4dc2-8c09-${index.toString(16).padStart(12, '0')}`,
  key: `field_${index}`,
  kind: validField.kind,
  constraints: validField.constraints,
  required: validField.required,
  validatorKey: validField.validatorKey,
  validatorVersion: validField.validatorVersion,
  defaultMode: validField.defaultMode,
  localizationMode: validField.localizationMode,
  editorConfig: validField.editorConfig,
  lifecycle: validField.lifecycle,
});

describe('P2-S09 migration parsing performance evidence', () => {
  it('[P2-S09-AC-217] benchmarks strict parsing of the maximum 128-field definition', () => {
    const candidate = {
      ...validDraft,
      fields: Array.from({ length: 128 }, (_, index) => fieldFor(index)),
    };
    expect(ContentTypeDraftRequestSchema.safeParse(candidate).success).toBe(
      true,
    );

    const durations: number[] = [];
    for (let sample = 0; sample < 25; sample += 1) {
      const started = performance.now();
      const parsed = ContentTypeDraftRequestSchema.safeParse(candidate);
      durations.push(performance.now() - started);
      expect(parsed.success).toBe(true);
    }

    const p95 = percentile(durations, 0.95);
    expect(Number.isFinite(p95)).toBe(true);
    expect(p95).toBeLessThan(1_200);
    expect(candidate.fields).toHaveLength(128);
  });
});
