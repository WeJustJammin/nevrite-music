import { describe, expect, it } from 'vitest';

import {
  BlockLifecycleAdvanceRequestSchema,
  ContentSchemaRegistryListQuerySchema,
  FieldSchemaChangeRequestSchema,
  SchemaActivationRequestSchema,
} from './requests.ts';

const uuid = '123e4567-e89b-42d3-a456-426614174000';
const hash = 'a'.repeat(64);

const field = {
  stableFieldId: uuid,
  key: 'display_name',
  kind: 'short_text' as const,
  constraints: {},
  required: true,
  validatorKey: null,
  validatorVersion: null,
  defaultMode: 'none' as const,
  localizationMode: 'none' as const,
  editorConfig: { label: 'Display name', order: 0 },
  lifecycle: 'active' as const,
  migrationPlanId: null,
};

describe('content schema registry request coverage boundaries', () => {
  it('copies an explicitly present default into the nested field contract', () => {
    expect(
      FieldSchemaChangeRequestSchema.parse({
        ...field,
        defaultMode: 'literal',
        defaultValue: 'untitled',
      }).defaultValue,
    ).toBe('untitled');
    expect(
      FieldSchemaChangeRequestSchema.safeParse({
        ...field,
        constraints: { minLength: 4, maxLength: 2 },
      }).success,
    ).toBe(false);
  });

  it('covers both valid lifecycle transition directions', () => {
    expect(
      BlockLifecycleAdvanceRequestSchema.parse({
        fromLifecycle: 'deprecated',
        toLifecycle: 'withdrawn',
        expectedVersion: '2',
        releaseDigest: hash,
      }).toLifecycle,
    ).toBe('withdrawn');
    expect(
      BlockLifecycleAdvanceRequestSchema.safeParse({
        fromLifecycle: 'supported',
        toLifecycle: 'withdrawn',
        expectedVersion: '2',
        releaseDigest: hash,
      }).success,
    ).toBe(false);
  });

  it('rejects duplicate approval IDs before persistence', () => {
    expect(
      SchemaActivationRequestSchema.safeParse({
        expectedVersion: '1',
        dryRunId: uuid,
        approvalIds: [uuid, uuid],
        migrationPlanId: null,
      }).success,
    ).toBe(false);
  });

  it('validates each resource-kind lifecycle compatibility guard', () => {
    expect(
      ContentSchemaRegistryListQuerySchema.parse({
        resourceKind: 'content_type',
        lifecycle: 'active',
      }).resourceKind,
    ).toBe('content_type');
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        resourceKind: 'content_type',
        lifecycle: 'deprecated',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        resourceKind: 'field_definition_version',
        lifecycle: 'supported',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        resourceKind: 'block_definition_registry_record',
        lifecycle: 'active',
      }).success,
    ).toBe(false);
  });
});
