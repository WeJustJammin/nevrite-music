import { describe, expect, it } from 'vitest';

import {
  ContentSchemaRegistryListPageSchema,
  ContentSchemaRegistryListQuerySchema,
  ContentSchemaRegistryRecordSchema,
  parseContentSchemaRegistryQuery,
} from '../../server/content-schema-registry-contracts';

const UUID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const HASH = 'a'.repeat(64);

const safeBlock = {
  resourceKind: 'block_definition_registry_record',
  id: UUID,
  version: '3',
  blockKey: 'hero.banner',
  blockVersion: 2,
  propsSchemaRef: 'cms/hero-banner',
  propsSchemaHash: HASH,
  rendererRef: 'blocks/hero-banner',
  releaseDigest: HASH,
  lifecycle: 'supported',
} as const;

describe('content schema registry generated-boundary contracts', () => {
  it('parses bounded list query values and applies defaults', () => {
    expect(
      parseContentSchemaRegistryQuery(
        new URL(
          'https://app.test/app/cms-content-modeling?resourceKind=content_type&lifecycle=active&limit=10&sort=updatedAt&direction=desc',
        ),
      ),
    ).toEqual({
      resourceKind: 'content_type',
      lifecycle: 'active',
      limit: 10,
      sort: 'updatedAt',
      direction: 'desc',
    });
  });

  it('rejects unknown keys and incompatible state/lifecycle filters', () => {
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        state: 'draft',
        unexpected: 'leak',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        resourceKind: 'content_type',
        state: 'draft',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        resourceKind: 'schema_artifact',
        lifecycle: 'active',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        resourceKind: 'block_definition_registry_record',
        lifecycle: 'supported',
      }).success,
    ).toBe(true);
  });

  it('accepts the safe block projection and rejects worker evidence', () => {
    expect(ContentSchemaRegistryRecordSchema.safeParse(safeBlock).success).toBe(
      true,
    );
    expect(
      ContentSchemaRegistryRecordSchema.safeParse({
        ...safeBlock,
        releaseKeyId: 'release-key',
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListPageSchema.safeParse({
        items: [safeBlock],
        nextCursor: null,
      }).success,
    ).toBe(true);
  });
});
