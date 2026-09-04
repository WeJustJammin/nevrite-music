import { describe, expect, it } from 'vitest';

import {
  ContentSchemaRegistryListQuerySchema,
  contentSchemaRegistryRoutePolicies,
} from '../../packages/contracts/src/content-schema-registry';
import {
  LIST_QUERY_OPTIONAL_FIELDS,
  listQueryWithOptionalFields,
  listQueryWithStateFields,
} from './phase-02-slice-09-list-query-options-fixtures';

describe('[P2-S09-AC-264] A06 list-query optional fields', () => {
  it('accepts compatible query combinations with every optional field populated', () => {
    const listRoute = contentSchemaRegistryRoutePolicies.find(
      ({ operationId }) => operationId === 'CMS-03A-06',
    );
    expect(listRoute?.requestSchema).toBe(
      'ContentSchemaRegistryListQuerySchema',
    );

    const fixtures = [listQueryWithOptionalFields, listQueryWithStateFields];
    expect(
      [...new Set(fixtures.flatMap((fixture) => Object.keys(fixture)))].sort(),
    ).toEqual([...LIST_QUERY_OPTIONAL_FIELDS].sort());
    for (const fixture of fixtures)
      expect(
        ContentSchemaRegistryListQuerySchema.safeParse(fixture).success,
      ).toBe(true);
  });

  it('retains the empty-query defaults while accepting URL-shaped values', () => {
    expect(ContentSchemaRegistryListQuerySchema.safeParse({}).success).toBe(
      true,
    );
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        keyPrefix: 'release',
        limit: '25',
        sort: 'key',
        direction: 'asc',
      }).success,
    ).toBe(true);
  });
});
