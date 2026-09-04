import { describe, expect, it } from 'vitest';

import {
  FieldConstraintsSchema,
  FieldDefinitionInputSchema,
  RelationBindingInputSchema,
  WorkflowPolicyEvidenceSchema,
} from './models.ts';

const uuid = '123e4567-e89b-42d3-a456-426614174000';
const hash = 'a'.repeat(64);

const field = {
  stableFieldId: uuid,
  key: 'display_name',
  kind: 'short_text' as const,
  constraints: {},
  required: false,
  validatorKey: null,
  validatorVersion: null,
  defaultMode: 'none' as const,
  localizationMode: 'none' as const,
  editorConfig: { label: 'Display name', order: 0 },
  lifecycle: 'active' as const,
};

const relation = {
  fieldId: uuid,
  targetKind: 'content' as const,
  targetType: 'article',
  projectionKey: 'cms.article.card',
  cardinality: 'many' as const,
  min: 0,
  max: 2,
  ordered: false,
  onUnavailable: 'omit' as const,
};

describe('content schema registry model defensive refinements', () => {
  it('rejects inverted length and numeric ranges', () => {
    expect(
      FieldConstraintsSchema.safeParse({ minLength: 4, maxLength: 2 }).success,
    ).toBe(false);
    expect(
      FieldConstraintsSchema.safeParse({ minimum: 4, maximum: 2 }).success,
    ).toBe(false);
  });

  it('covers validator/default presence combinations', () => {
    expect(
      FieldDefinitionInputSchema.safeParse({
        ...field,
        validatorKey: 'cms.slug',
        validatorVersion: null,
      }).success,
    ).toBe(false);
    expect(
      FieldDefinitionInputSchema.safeParse({
        ...field,
        defaultMode: 'literal',
      }).success,
    ).toBe(false);
    expect(
      FieldDefinitionInputSchema.safeParse({
        ...field,
        defaultMode: 'literal',
        defaultValue: undefined,
      }).success,
    ).toBe(false);
    expect(
      FieldDefinitionInputSchema.parse({
        ...field,
        defaultMode: 'literal',
        defaultValue: 'Display name',
      }).defaultValue,
    ).toBe('Display name');
    expect(
      FieldDefinitionInputSchema.safeParse({
        ...field,
        defaultValue: 'not-allowed-without-literal',
      }).success,
    ).toBe(false);
  });

  it('rejects all invalid one-cardinality combinations', () => {
    expect(
      RelationBindingInputSchema.safeParse({
        ...relation,
        cardinality: 'one',
        min: 0,
        max: 2,
      }).success,
    ).toBe(false);
    expect(
      RelationBindingInputSchema.safeParse({
        ...relation,
        cardinality: 'one',
        min: 2,
        max: 1,
      }).success,
    ).toBe(false);
  });

  it('requires dual named approval for protected policies', () => {
    const base = {
      key: 'cms.publish',
      version: '1',
      policyHash: hash,
      riskClass: 'protected' as const,
      requiredDecisionCount: 1,
      requiredCapabilities: ['cms.publisher'],
      approvalEvidenceHash: hash,
    };
    expect(WorkflowPolicyEvidenceSchema.safeParse(base).success).toBe(false);
    expect(
      WorkflowPolicyEvidenceSchema.safeParse({
        ...base,
        requiredDecisionCount: 2,
        requiredCapabilities: [],
      }).success,
    ).toBe(false);
    expect(
      WorkflowPolicyEvidenceSchema.parse({
        ...base,
        requiredDecisionCount: 2,
      }).riskClass,
    ).toBe('protected');
  });
});
