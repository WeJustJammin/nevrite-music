import { describe, expect, it } from 'vitest';

import {
  BlockDefinitionVersionResourceSchema,
  BlockLifecycleAdvanceRequestSchema,
  BlockLifecycleEventResourceSchema,
  BlockRegistrationRequestSchema,
  ContentSchemaRegistryDetailParamsSchema,
  ContentSchemaRegistryDetailSchema,
  ContentSchemaRegistryListPageSchema,
  ContentSchemaRegistryListQuerySchema,
  ContentTypeDraftRequestSchema,
  ContentTypeVersionResourceSchema,
  FieldDefinitionVersionResourceSchema,
  FieldSchemaChangeRequestSchema,
  RelationBindingRequestSchema,
  RelationDefinitionResourceSchema,
  SchemaActivationRequestSchema,
  SchemaActivationResourceSchema,
  buildContentSchemaRegistryBrowserOpenApiDocument,
  buildContentSchemaRegistryOpenApiDocument,
  contentSchemaRegistryRoutePolicies,
} from '../../packages/contracts/src/content-schema-registry';
import { ApiErrorSchema } from '../../packages/contracts/src/api-error';
import {
  humanDetailErrors,
  humanListErrors,
  humanMutationErrors,
  releaseErrors,
} from '../../packages/contracts/src/content-schema-registry/routes-errors';
import {
  CONTENT_SCHEMA_REGISTRY_MUTATION_OPERATIONS,
  contentSchemaRegistryMutationOperationFromRequest,
} from '../../apps/web/src/server/content-schema-registry-platform-api';
import {
  activation,
  block,
  detail,
  field,
  lifecycleEvent,
  relation,
  resource,
  safeBlock,
  validActivation,
  validBlock,
  validDraft,
  validField,
  validLifecycle,
  validRelation,
} from '../../apps/worker/src/content-schema-registry/phase-02-slice-09-test-values';
import { listQueryWithOptionalFields } from './phase-02-slice-09-list-query-options-fixtures';
type ParseSchema = Readonly<{
  safeParse: (value: unknown) => { readonly success: boolean };
}>;

type OperationId =
  (typeof contentSchemaRegistryRoutePolicies)[number]['operationId'];

const operationIds: readonly OperationId[] = [
  'CMS-03A-01',
  'CMS-03A-02',
  'CMS-03A-03',
  'CMS-03A-04',
  'CMS-03A-05',
  'CMS-03A-06',
  'CMS-03A-07',
  'CMS-03A-08',
];

const requestSchemas: Readonly<Record<string, ParseSchema>> = {
  ContentTypeDraftRequestSchema,
  FieldSchemaChangeRequestSchema,
  RelationBindingRequestSchema,
  SchemaActivationRequestSchema,
  BlockRegistrationRequestSchema,
  ContentSchemaRegistryListQuerySchema,
  ContentSchemaRegistryDetailParamsSchema,
  BlockLifecycleAdvanceRequestSchema,
};

const successSchemas: Readonly<Record<string, ParseSchema>> = {
  ContentTypeVersionResourceSchema,
  FieldDefinitionVersionResourceSchema,
  RelationDefinitionResourceSchema,
  SchemaActivationResourceSchema,
  BlockDefinitionVersionResourceSchema,
  ContentSchemaRegistryListPageSchema,
  ContentSchemaRegistryDetailSchema,
  BlockLifecycleEventResourceSchema,
};

const requestFixtures: Readonly<Record<string, object>> = {
  ContentTypeDraftRequestSchema: validDraft,
  FieldSchemaChangeRequestSchema: validField,
  RelationBindingRequestSchema: validRelation,
  SchemaActivationRequestSchema: validActivation,
  BlockRegistrationRequestSchema: validBlock,
  ContentSchemaRegistryListQuerySchema: listQueryWithOptionalFields,
  ContentSchemaRegistryDetailParamsSchema: {
    contentTypeId: '30000000-0000-4000-8000-000000000003',
    versionId: '40000000-0000-4000-8000-000000000004',
  },
  BlockLifecycleAdvanceRequestSchema: validLifecycle,
};

const successFixtures: Readonly<Record<string, unknown>> = {
  ContentTypeVersionResourceSchema: resource,
  FieldDefinitionVersionResourceSchema: field,
  RelationDefinitionResourceSchema: relation,
  SchemaActivationResourceSchema: activation,
  BlockDefinitionVersionResourceSchema: block,
  ContentSchemaRegistryListPageSchema: {
    items: [resource, safeBlock],
    nextCursor: null,
  },
  ContentSchemaRegistryDetailSchema: detail,
  BlockLifecycleEventResourceSchema: lifecycleEvent,
};

const declaredRequestFields: Readonly<Record<OperationId, readonly string[]>> =
  {
    'CMS-03A-01': [
      'typeKey',
      'label',
      'ownerCapability',
      'sourceLocale',
      'defaultLocale',
      'workflowKey',
      'workflowVersion',
      'defaultTemplateVersionId',
      'fields',
      'relations',
      'templateBindings',
      'capabilityBindings',
    ],
    'CMS-03A-02': [
      'stableFieldId',
      'key',
      'kind',
      'constraints',
      'required',
      'validatorKey',
      'validatorVersion',
      'defaultMode',
      'defaultValue',
      'localizationMode',
      'editorConfig',
      'lifecycle',
      'migrationPlanId',
    ],
    'CMS-03A-03': [
      'fieldId',
      'targetKind',
      'targetType',
      'projectionKey',
      'cardinality',
      'min',
      'max',
      'ordered',
      'onUnavailable',
    ],
    'CMS-03A-04': [
      'expectedVersion',
      'dryRunId',
      'approvalIds',
      'expectedActivationEvidenceHash',
      'migrationPlanId',
    ],
    'CMS-03A-05': [
      'blockKey',
      'blockVersion',
      'propsSchemaRef',
      'propsSchemaHash',
      'propsSchemaSnapshot',
      'propsSnapshotHash',
      'propsSnapshotAttestation',
      'rendererRef',
      'allowedChildren',
      'slotRules',
      'dataSourcePermissions',
      'accessibility',
      'compatibility',
      'lifecycle',
      'releaseDigest',
    ],
    'CMS-03A-06': [
      'resourceKind',
      'keyPrefix',
      'lifecycle',
      'state',
      'limit',
      'cursor',
      'sort',
      'direction',
    ],
    'CMS-03A-07': ['contentTypeId', 'versionId'],
    'CMS-03A-08': [
      'fromLifecycle',
      'toLifecycle',
      'expectedVersion',
      'releaseDigest',
    ],
  };
const optionalRequestFields: Readonly<Record<OperationId, readonly string[]>> =
  {
    'CMS-03A-01': ['defaultTemplateVersionId'],
    'CMS-03A-02': ['stableFieldId', 'defaultValue'],
    'CMS-03A-03': [],
    'CMS-03A-04': ['expectedActivationEvidenceHash'],
    'CMS-03A-05': [],
    'CMS-03A-06': [
      'resourceKind',
      'keyPrefix',
      'lifecycle',
      'state',
      'limit',
      'cursor',
      'sort',
      'direction',
    ],
    'CMS-03A-07': [],
    'CMS-03A-08': [],
  };

const requiredFields = (operationId: OperationId): readonly string[] =>
  declaredRequestFields[operationId].filter(
    (fieldName) => !optionalRequestFields[operationId].includes(fieldName),
  );

const fixtureForRoute = (operationId: OperationId): object => {
  const route = contentSchemaRegistryRoutePolicies.find(
    (candidate) => candidate.operationId === operationId,
  );
  if (route === undefined) throw new Error(`Missing route ${operationId}`);
  const fixture = requestFixtures[route.requestSchema];
  if (fixture === undefined)
    throw new Error(`Missing fixture ${route.requestSchema}`);
  return fixture;
};

const schemaForRoute = (
  operationId: OperationId,
  kind: 'request' | 'success',
): ParseSchema => {
  const route = contentSchemaRegistryRoutePolicies.find(
    (candidate) => candidate.operationId === operationId,
  );
  if (route === undefined) throw new Error(`Missing route ${operationId}`);
  const registry = kind === 'request' ? requestSchemas : successSchemas;
  const name = kind === 'request' ? route.requestSchema : route.successSchema;
  const schema = registry[name];
  if (schema === undefined) throw new Error(`Missing ${kind} schema ${name}`);
  return schema;
};

describe('P2-S09 exact operation contracts and release/read boundaries', () => {
  it('[P2-S09-AC-264] validates every operation against an explicit field map and rejects unknown fields', () => {
    expect(
      contentSchemaRegistryRoutePolicies.map(({ operationId }) => operationId),
    ).toEqual(operationIds);
    for (const operationId of operationIds) {
      const schema = schemaForRoute(operationId, 'request');
      const fixture = fixtureForRoute(operationId);
      expect(schema.safeParse(fixture).success, `${operationId} fixture`).toBe(
        true,
      );
      expect(
        schema.safeParse({ ...fixture, __s09_unknown_field: 'reject' }).success,
        `${operationId} unknown field`,
      ).toBe(false);
      for (const fieldName of requiredFields(operationId)) {
        const missing = { ...fixture };
        delete missing[fieldName];
        expect(
          schema.safeParse(missing).success,
          `${operationId} required ${fieldName}`,
        ).toBe(false);
      }
      expect(
        declaredRequestFields[operationId].includes('__s09_unknown_field'),
      ).toBe(false);
    }
  });

  it('[P2-S09-AC-264] maps each generated request and success schema to its exact route policy and ApiError envelope', () => {
    const expectedErrors = {
      'CMS-03A-01': humanMutationErrors,
      'CMS-03A-02': humanMutationErrors,
      'CMS-03A-03': humanMutationErrors,
      'CMS-03A-04': humanMutationErrors,
      'CMS-03A-05': releaseErrors,
      'CMS-03A-06': humanListErrors,
      'CMS-03A-07': humanDetailErrors,
      'CMS-03A-08': releaseErrors,
    } as const satisfies Readonly<
      Record<OperationId, Readonly<Record<string, number>>>
    >;

    for (const route of contentSchemaRegistryRoutePolicies) {
      expect(
        schemaForRoute(route.operationId, 'request').safeParse(
          fixtureForRoute(route.operationId),
        ).success,
      ).toBe(true);
      expect(
        schemaForRoute(route.operationId, 'success').safeParse(
          successFixtures[route.successSchema],
        ).success,
      ).toBe(true);
      expect(route.errors, `${route.operationId} error map`).toEqual(
        expectedErrors[route.operationId],
      );
      for (const [code, status] of Object.entries(route.errors)) {
        expect(
          ApiErrorSchema.safeParse({
            code,
            message: 'safe operation error',
            requestId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            details: {},
          }).success,
        ).toBe(true);
        expect(status).toBeGreaterThanOrEqual(400);
        expect(status).toBeLessThanOrEqual(599);
      }
    }
  });

  it('[P2-S09-AC-264] covers A05-A08 signed-release/read boundaries at executable browser facades', async () => {
    const byId = Object.fromEntries(
      contentSchemaRegistryRoutePolicies.map((route) => [
        route.operationId,
        route,
      ]),
    ) as Partial<
      Record<OperationId, (typeof contentSchemaRegistryRoutePolicies)[number]>
    >;

    for (const operationId of ['CMS-03A-05', 'CMS-03A-08'] as const) {
      expect(byId[operationId]?.auth).toBe('signed_release_worker');
      expect(byId[operationId]?.audience).toBe('release-worker');
      expect(byId[operationId]?.rawBodySignature).toBe('required');
      expect(byId[operationId]?.csrf).toBe('forbidden');
      expect(byId[operationId]?.idempotency).toBe('required');
    }
    for (const operationId of ['CMS-03A-06', 'CMS-03A-07'] as const) {
      expect(byId[operationId]?.method).toBe('GET');
      expect(byId[operationId]?.audience).toBe('browser');
      expect(byId[operationId]?.rawBodySignature).toBe('none');
      expect(byId[operationId]?.csrf).toBe('none');
      expect(byId[operationId]?.idempotency).toBe('none');
      expect(byId[operationId]?.ifMatch).toBe('none');
    }

    expect(
      Object.keys(CONTENT_SCHEMA_REGISTRY_MUTATION_OPERATIONS).sort(),
    ).toEqual(['CMS-03A-01', 'CMS-03A-02', 'CMS-03A-03', 'CMS-03A-04']);
    const browserPaths = Object.keys(
      buildContentSchemaRegistryBrowserOpenApiDocument().paths,
    );
    expect(browserPaths.some((path) => path.includes('/blocks/'))).toBe(false);
    const internalPaths = Object.keys(
      buildContentSchemaRegistryOpenApiDocument().paths,
    );
    expect(
      internalPaths.some((path) => path === '/api/v1/cms/blocks/versions'),
    ).toBe(true);
    expect(
      internalPaths.some((path) =>
        path.includes('/blocks/versions/{blockDefinitionVersionId}'),
      ),
    ).toBe(true);

    const releaseJson = new Request(
      'https://cms.test/app/cms-content-modeling',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operationId: 'CMS-03A-05', ...validBlock }),
      },
    );
    expect(
      await contentSchemaRegistryMutationOperationFromRequest(releaseJson),
    ).toBeNull();
    const lifecycleForm = new FormData();
    lifecycleForm.set('operationId', 'CMS-03A-08');
    const releaseForm = new Request(
      'https://cms.test/app/cms-content-modeling',
      {
        method: 'POST',
        body: lifecycleForm,
      },
    );
    expect(
      await contentSchemaRegistryMutationOperationFromRequest(releaseForm),
    ).toBeNull();
  });
});
