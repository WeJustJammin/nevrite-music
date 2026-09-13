import {
  AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION,
  ApprovedOutageTargetV1Schema,
  ApprovedRunnerMappingsV1Schema,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

describe('AC265 hosted control-plane public contract exports', () => {
  it('exposes the authenticated runner-mapping and outage-target contracts', () => {
    expect(AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION).toBe(
      'ac265-approved-runner-mappings-v1',
    );
    expect(AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION).toBe(
      'ac265-approved-outage-target-v1',
    );
    expect(ApprovedRunnerMappingsV1Schema).toBeDefined();
    expect(ApprovedOutageTargetV1Schema).toBeDefined();
  });
});
