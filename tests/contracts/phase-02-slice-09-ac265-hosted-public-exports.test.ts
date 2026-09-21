import {
  AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS,
  AC265_APPROVED_OUTAGE_TARGET_SCHEMA_VERSION,
  AC265_APPROVED_REGISTRY_CONTROL_SCHEMA_VERSION,
  AC265_APPROVED_RUNNER_MAPPINGS_SCHEMA_VERSION,
  CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION,
  ApprovedOutageTargetV1Schema,
  ApprovedRunnerMappingsV1Schema,
  ContentSchemaRegistryAc265ApprovedRegistryConflictSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingReadResponseSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema,
  ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema,
  ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema,
  ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema,
  ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema,
  ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema,
  ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema,
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

  it('exposes the CP-02 approved registry control contracts', () => {
    expect(AC265_APPROVED_REGISTRY_CONTROL_SCHEMA_VERSION).toBe(
      'ac265-hosted-approved-registry-control-v1',
    );
    expect(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRegistryConflictSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadResponseSchema,
    ).toBeDefined();
  });

  it('exposes the staging-only one-use outage-lease control contracts', () => {
    expect(
      CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION,
    ).toBe('ac265-hosted-outage-lease-control-v1');
    expect(AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS).toBe(60);
    expect(
      ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema,
    ).toBeDefined();
    expect(
      ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema,
    ).toBeDefined();
  });
});
