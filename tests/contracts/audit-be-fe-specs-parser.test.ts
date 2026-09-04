import { describe, expect, it } from 'vitest';

// @ts-expect-error -- repository audit helpers are executable ESM without declarations.
import {
  currentRunDate,
  parseArguments,
  routeRegistryTable,
} from '../../.memory/pipeline/audit-be-fe-specs.mjs';
// @ts-expect-error -- repository audit helpers are executable ESM without declarations.
import {
  fieldIds,
  missingResponseFields,
  operationIds,
  responseFieldIds,
  schemaPropertyIds,
} from '../../.memory/pipeline/audit-fe-specs.mjs';

const routeSource = `
# Synthetic spec

| Method | Path | Note |
| --- | --- | --- |
| GET | /decoy/one | not canonical |
| GET | /decoy/two | larger decoy |
| GET | /decoy/three | still not canonical |

### Route Registry

| Operation ID | Flow | Method | Path |
| --- | --- | --- | --- |
| CMS-03A-06 | Protected list | GET | /api/v1/cms/content-types |
| CMS-03A-07 | Protected detail | GET | /api/v1/cms/content-types/{contentTypeId}/versions/{versionId} |
`;

const schemaSource = `
const ContentSchemaRegistryListQuery = z.strictObject({
  requestOnly: z.string().optional(),
  contentTypeId: UUID,
  versionId: UUID,
  cursor: z.string().optional()
});
const PublicResponse = z.strictObject({
  visibleField: z.string(),
  tableMappedField: z.string(),
  unmappedField: z.string(),
});
const AuthenticatedPrivateResponse = z.strictObject({
  ordinaryPrivateField: z.string(),
});
const PrivateStorageResponse = z.strictObject({
  privateStorageField: z.string(),
});
const WorkerResponse = z.strictObject({
  workerSecret: z.string(),
});
const PrivateType = z.enum(['private']);
const DbTableShape = z.strictObject({
  dbOnlyField: z.string(),
});
`;

const responseRouteSource = `
## Route Registry

| Operation ID | Method and path | Request → success | Auth / ownership |
| --- | --- | --- | --- |
| CMS-03A-08 | POST /api/v1/cms/blocks/lifecycle | ContentSchemaRegistryListQuery → 200 PublicResponse | browser |
| TEST-PRIVATE-01 | GET /api/v1/cms/private-view | ContentSchemaRegistryListQuery → 200 AuthenticatedPrivateResponse | authenticated private browser resource |
| CMS-03B-09 | POST /api/v1/cms/editorial | ContentSchemaRegistryListQuery → 200 PrivateStorageResponse | private/storage-only; never browser |
| CMS-03C-05 | POST /api/v1/cms/composition | ContentSchemaRegistryListQuery → 200 WorkerResponse | signed worker-only; no browser |
`;

const mappedFeSource = `
type ContractField = 'visibleField' | 'ordinaryPrivateField';

| Parsed field set |
| --- |
| \`tableMappedField\` |

\`privateStorageField\` is private/storage-only and excluded from browser state.
\`workerSecret\` is worker-only and never enters the browser.
`;

const completeMappedFeSource = `
type ContractField = 'visibleField' | 'unmappedField' | 'ordinaryPrivateField';

| Parsed field set |
| --- |
| \`tableMappedField\` |

\`privateStorageField\` is private/storage-only and excluded from browser state.
\`workerSecret\` is worker-only and never enters the browser.
`;

const inheritedResponseUnionFeSource = `
The workbench \`projection\` is the parsed union of the response schemas named
in the BE route registry; runtime validation rejects unknown variants.
`;

const nonContractIdentifiers = `
The database/table \`cms_private_table\`, enum \`PrivateType\`, and storage
identifier \`storage_locator\` remain server-only. The request field is
\`requestOnly\`.
`;

describe('fresh BE/FE audit parser regressions', () => {
  it('selects the canonical Route Registry and preserves CMS operation IDs', () => {
    const table = routeRegistryTable(routeSource);

    expect(table.headingLine).toBeGreaterThan(0);
    expect(
      table.rows.map((row: { operationId: string }) => row.operationId),
    ).toEqual(['CMS-03A-06', 'CMS-03A-07']);
    expect(
      operationIds(
        routeSource.replace(
          '| CMS-03A-07 | Protected detail | GET | /api/v1/cms/content-types/{contentTypeId}/versions/{versionId} |',
          '| CMS-03A-07 | Protected detail | GET | /api/v1/cms/content-types/{contentTypeId}/versions/{versionId} |\n| CMS-03B-09 | Editorial | POST | /api/v1/cms/editorial |\n| CMS-03C-05 | Composition | POST | /api/v1/cms/composition |',
        ),
      ),
    ).toEqual(['CMS-03A-06', 'CMS-03A-07', 'CMS-03B-09', 'CMS-03C-05']);
  });

  it('extracts named response properties from multiline fenced code', () => {
    const markdown = `\`\`\`ts\n${schemaSource}\n\`\`\``;

    expect(schemaPropertyIds(schemaSource)).toEqual(
      expect.arrayContaining([
        'requestOnly',
        'contentTypeId',
        'versionId',
        'cursor',
        'visibleField',
        'tableMappedField',
        'unmappedField',
        'ordinaryPrivateField',
      ]),
    );
    expect(responseFieldIds(responseRouteSource + markdown)).toEqual(
      expect.arrayContaining([
        'visibleField',
        'tableMappedField',
        'unmappedField',
      ]),
    );
    expect(fieldIds(responseRouteSource + markdown)).toEqual(
      responseFieldIds(responseRouteSource + markdown),
    );
    expect(responseFieldIds(responseRouteSource + markdown)).not.toEqual(
      expect.arrayContaining([
        'requestOnly',
        'cms_private_table',
        'storage_locator',
        'PrivateType',
        'dbOnlyField',
        'privateStorageField',
        'workerSecret',
      ]),
    );
  });

  it('accepts equivalent table and union mapping but fails a truly unmapped response field', () => {
    const be = responseRouteSource + schemaSource + nonContractIdentifiers;

    expect(missingResponseFields(be, mappedFeSource)).toEqual([
      'unmappedField',
    ]);
    expect(missingResponseFields(be, completeMappedFeSource)).toEqual([]);
    expect(missingResponseFields(be, inheritedResponseUnionFeSource)).toEqual(
      [],
    );
    expect(
      missingResponseFields(
        be,
        'The projection uses selected BE response fields at runtime.',
      ),
    ).toEqual([
      'visibleField',
      'tableMappedField',
      'unmappedField',
      'ordinaryPrivateField',
    ]);
  });

  it('uses explicit run metadata and rejects malformed required values', () => {
    expect(currentRunDate(new Date('2026-09-02T23:59:59.000Z'))).toBe(
      '2026-09-02',
    );
    expect(
      parseArguments(['--root', '.', '--run-date', '2026-09-02']),
    ).toMatchObject({
      runDate: '2026-09-02',
    });
    expect(() => parseArguments(['--run-date', '09/02/2026'])).toThrow(
      /ISO date/u,
    );
    expect(() => parseArguments(['--root'])).toThrow(/requires/u);
  });
});
