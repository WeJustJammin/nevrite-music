import { describe, expect, it } from 'vitest';

import {
  AC265_APPROVED_REGISTRY_CONTROL_SCHEMA_VERSION,
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
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-registry-control.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input-references.ts';
import {
  makeContract,
  sha256Ref,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';

const CRITERION = 'P2-S09-AC-265' as const;
const SCHEMA_VERSION = 'ac265-hosted-approved-registry-control-v1' as const;
const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const safeResourceIdempotencyRef =
  'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004';
const mappingIdempotencyRef =
  'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005';
const mappingId = '60000000-0000-4000-8000-000000000006';
const approvedAt = '2026-09-21T10:00:00.000Z';
const locatorSha256 = 'a'.repeat(64);

const contract = makeContract();
const resources = contract.resourceRefs;
const resource = resources[0];
if (resource === undefined) throw new Error('Fixture must contain resources.');

const mapping = {
  schemaVersion: 'ac265-approved-runner-mappings-v1',
  source: 'protected-ac265-runner-mapping-control-plane',
  mappingId,
  approvedAt,
  runId: contract.runId,
  identity: contract.identity,
  roleResourceBindings: contract.roleResourceBindings,
  scenarioRoleBindings: contract.scenarioRoleBindings,
} as const;

const safeResourceRegisterRequest = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  resourceKind: resource.kind,
  locatorSha256,
  idempotencyRef: safeResourceIdempotencyRef,
} as const;

const safeResourceRegisterResult = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  idempotencyRef: safeResourceIdempotencyRef,
  resource,
  locatorSha256,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: contract.identity.supabaseProjectRef,
  redacted: true,
  approvedAt,
} as const;

const mappingRegisterRequest = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  idempotencyRef: mappingIdempotencyRef,
  roleResourceBindings: contract.roleResourceBindings,
  scenarioRoleBindings: contract.scenarioRoleBindings,
} as const;

const mappingRegisterResult = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  idempotencyRef: mappingIdempotencyRef,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: contract.identity.supabaseProjectRef,
  redacted: true,
  mapping,
  resources,
} as const;

const mappingReadRequest = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  mappingId,
} as const;

const mappingReadResult = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: contract.identity.supabaseProjectRef,
  redacted: true,
  mapping,
  resources,
} as const;

const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
) => expect(schema.safeParse(value).success).toBe(false);

describe('AC265 CP-02 approved registry control contracts', () => {
  it('pins the exact criterion/version and accepts valid safe-resource and mapping exchanges', () => {
    expect(AC265_APPROVED_REGISTRY_CONTROL_SCHEMA_VERSION).toBe(SCHEMA_VERSION);

    expect(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema.parse(
        safeResourceRegisterRequest,
      ),
    ).toEqual(safeResourceRegisterRequest);
    expect(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema.parse(
        safeResourceRegisterResult,
      ),
    ).toEqual(safeResourceRegisterResult);
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema.parse(
        mappingRegisterRequest,
      ),
    ).toEqual(mappingRegisterRequest);
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema.parse(
        mappingRegisterResult,
      ),
    ).toEqual(mappingRegisterResult);
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema.parse(
        mappingReadRequest,
      ),
    ).toEqual(mappingReadRequest);
    expect(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema.parse(
        mappingReadResult,
      ),
    ).toEqual(mappingReadResult);
  });

  it('requires v4 staging authorization and idempotency references and exact safe kinds', () => {
    for (const value of [
      '',
      'https://example.test/authorization',
      'ac265-authorization://production/20000000-0000-4000-8000-000000000002',
      'ac265-authorization://staging/not-a-uuid',
      'ac265-authorization://staging/20000000-0000-4000-8000-000000000002?token=secret',
    ]) {
      expectRejected(
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
        { ...safeResourceRegisterRequest, authorizationRef: value },
      );
      expectRejected(
        ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
        { ...mappingRegisterRequest, authorizationRef: value },
      );
      expectRejected(
        ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
        { ...mappingReadRequest, authorizationRef: value },
      );
    }

    for (const value of [
      '',
      'ac265-idempotency://production/40000000-0000-4000-8000-000000000004',
      'ac265-idempotency://staging/not-a-uuid',
      'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004/extra',
    ]) {
      expectRejected(
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
        { ...safeResourceRegisterRequest, idempotencyRef: value },
      );
      expectRejected(
        ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
        { ...mappingRegisterRequest, idempotencyRef: value },
      );
    }

    expect(CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.length).toBe(4);
    for (const resourceKind of [
      'content_schema',
      'staff_case',
      'organization',
      'prerequisite',
      'content_type',
    ]) {
      const value = { ...safeResourceRegisterRequest, resourceKind };
      if (
        CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS.includes(
          resourceKind as (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_RESOURCE_KINDS)[number],
        )
      )
        expect(
          ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema.safeParse(
            value,
          ).success,
        ).toBe(true);
      else
        expectRejected(
          ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
          value,
        );
    }
  });

  it('accepts exactly four server-returned resource entries and rejects manifest drift', () => {
    expect(resources).toHaveLength(4);
    expect(new Set(resources.map(({ kind }) => kind)).size).toBe(4);
    expect(new Set(resources.map(({ ref }) => ref)).size).toBe(4);

    for (const [schema, base] of [
      [
        ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema,
        mappingRegisterResult,
      ],
      [
        ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema,
        mappingReadResult,
      ],
    ] as const) {
      expectRejected(schema, {
        ...base,
        resources: resources.slice(0, 3),
      });
      expectRejected(schema, {
        ...base,
        resources: resources.map((entry, index) =>
          index === 1 ? { ...entry, kind: resources[0]?.kind } : entry,
        ),
      });
      expectRejected(schema, {
        ...base,
        resources: resources.map((entry, index) =>
          index === 1 ? { ...entry, ref: resources[0]?.ref } : entry,
        ),
      });
    }

    expectRejected(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema,
      {
        ...safeResourceRegisterResult,
        resource: {
          ...resource,
          ref: 'ac265-resource://organization/not-a-uuid',
        },
      },
    );
    expectRejected(
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema,
      {
        ...safeResourceRegisterResult,
        resource: { ...resource, sha256: 'A'.repeat(64) },
      },
    );
  });

  it('keeps caller input narrow and server-owned mapping fields out of requests', () => {
    const forbidden = [
      { callerRef: 'caller-controlled' },
      { resourceRef: resource.ref },
      { resource: resource },
      { mappingId },
      { approvedAt },
      { runId: contract.runId },
      { identity: contract.identity },
      { project: 'wejammin-staging' },
      { content: 'raw-content' },
      { credentials: { accessToken: 'secret' } },
      { session: { cookie: 'secret' } },
      { unknown: true },
    ];

    for (const extra of forbidden) {
      expectRejected(
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterRequestSchema,
        { ...safeResourceRegisterRequest, ...extra },
      );
      expectRejected(
        ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
        { ...mappingRegisterRequest, ...extra },
      );
    }

    for (const extra of [
      { idempotencyRef: mappingIdempotencyRef },
      { resources: [] },
      { identity: contract.identity },
      { credentials: { accessToken: 'secret' } },
      { unknown: true },
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
        { ...mappingReadRequest, ...extra },
      );
  });

  it('binds mapping reads to the authorization and server mapping id and rejects sensitive outputs', () => {
    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
      {
        ...mappingReadRequest,
        mappingId: '',
      },
    );
    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
      {
        ...mappingReadRequest,
        mappingId: '../other-project',
      },
    );
    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadRequestSchema,
      {
        ...mappingReadRequest,
        mappingId: 'placeholder',
      },
    );

    for (const schema of [
      ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema,
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema,
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema,
    ]) {
      expectRejected(schema, {
        ...(schema ===
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema
          ? safeResourceRegisterResult
          : schema ===
              ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema
            ? mappingRegisterResult
            : mappingReadResult),
        environment: 'production',
      });
      expectRejected(schema, {
        ...(schema ===
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema
          ? safeResourceRegisterResult
          : schema ===
              ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema
            ? mappingRegisterResult
            : mappingReadResult),
        supabaseProjectRef: 'wrong',
      });
      expectRejected(schema, {
        ...(schema ===
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema
          ? safeResourceRegisterResult
          : schema ===
              ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema
            ? mappingRegisterResult
            : mappingReadResult),
        redacted: false,
      });
      expectRejected(schema, {
        ...(schema ===
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResultSchema
          ? safeResourceRegisterResult
          : schema ===
              ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema
            ? mappingRegisterResult
            : mappingReadResult),
        credentials: { accessToken: 'secret' },
      });
    }
  });

  it('keeps the locked role/scenario keysets exact in mapping requests', () => {
    expect(
      Object.keys(mappingRegisterRequest.roleResourceBindings).sort(),
    ).toEqual([...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES].sort());
    expect(
      Object.keys(mappingRegisterRequest.scenarioRoleBindings).sort(),
    ).toEqual([...CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS].sort());

    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
      {
        ...mappingRegisterRequest,
        roleResourceBindings: {
          ...mappingRegisterRequest.roleResourceBindings,
          not_a_role: [resource.ref],
        },
      },
    );

    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
      {
        ...mappingRegisterRequest,
        roleResourceBindings: Object.fromEntries(
          CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
            role,
            [resource.ref],
          ]),
        ),
      },
    );

    const prerequisiteRef = resources.find(
      (entry) => entry.kind === 'prerequisite',
    )?.ref;
    expect(prerequisiteRef).toBeDefined();
    const duplicateKindRef =
      'ac265-resource://content_schema/70000000-0000-4000-8000-000000000007';
    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
      {
        ...mappingRegisterRequest,
        roleResourceBindings: Object.fromEntries(
          CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => [
            role,
            mappingRegisterRequest.roleResourceBindings[role].map(
              (reference) =>
                reference === prerequisiteRef ? duplicateKindRef : reference,
            ),
          ]),
        ),
      },
    );
    expectRejected(
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterRequestSchema,
      {
        ...mappingRegisterRequest,
        scenarioRoleBindings: {
          ...mappingRegisterRequest.scenarioRoleBindings,
          not_a_scenario: ['owner_full'],
        },
      },
    );

    expect(uuidFor(1)).toMatch(/-4000-8000-/u);
    expect(sha256Ref(resource.ref)).toHaveLength(64);
  });

  it('binds every approved role resource to the returned four-resource manifest', () => {
    const undeclaredRef =
      'ac265-resource://content_schema/70000000-0000-4000-8000-000000000007';
    const roleResourceBindings = {
      ...mapping.roleResourceBindings,
      entitled_read: [undeclaredRef],
    };

    for (const schema of [
      ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema,
      ContentSchemaRegistryAc265ApprovedRunnerMappingReadResultSchema,
    ]) {
      const base =
        schema ===
        ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResultSchema
          ? mappingRegisterResult
          : mappingReadResult;
      expectRejected(schema, {
        ...base,
        mapping: { ...mapping, roleResourceBindings },
      });

      const unusedRef = resources[3]?.ref;
      expect(unusedRef).toBeDefined();
      expectRejected(schema, {
        ...base,
        mapping: {
          ...mapping,
          roleResourceBindings: {
            ...mapping.roleResourceBindings,
            disabled_prerequisite: [resource.ref],
          },
        },
      });
    }
  });

  it('models the exact conflict response for every registry RPC', () => {
    const conflict = { status: 'conflict' } as const;

    expect(
      ContentSchemaRegistryAc265ApprovedRegistryConflictSchema.parse(conflict),
    ).toEqual(conflict);
    for (const [schema, success] of [
      [
        ContentSchemaRegistryAc265ApprovedSafeResourceRegisterResponseSchema,
        safeResourceRegisterResult,
      ],
      [
        ContentSchemaRegistryAc265ApprovedRunnerMappingRegisterResponseSchema,
        mappingRegisterResult,
      ],
      [
        ContentSchemaRegistryAc265ApprovedRunnerMappingReadResponseSchema,
        mappingReadResult,
      ],
    ] as const) {
      expect(schema.parse(success)).toEqual(success);
      expect(schema.parse(conflict)).toEqual(conflict);
      expectRejected(schema, { status: 'conflict', reason: 'secret' });
      expectRejected(schema, { status: 'CONFLICT' });
    }
  });
});
