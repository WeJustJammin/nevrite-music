import { describe, expect, it } from 'vitest';

import {
  AC265_APPROVED_OUTAGE_TARGET_POLICY_REFERENCE,
  AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_SCHEMA_VERSION,
  ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema,
  ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema,
  ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResultSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-registration.ts';

const request = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-approved-outage-target-registration-v1',
  authorizationRef:
    'ac265-authorization://staging/72000000-0000-4000-8000-000000000001',
  policyRef: 'ac265-outage-policy://staging/v1',
  idempotencyRef:
    'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001',
} as const;

const result = {
  ...request,
  targetRef:
    'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001',
  targetSha256: 'a'.repeat(64),
  approvedAt: '2026-09-21T13:00:00.000Z',
  expiresAt: '2026-09-21T13:04:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: 'abcdefghijklmnopqrst',
  status: 'registered',
  redacted: true,
} as const;

const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
) => expect(schema.safeParse(value).success).toBe(false);

describe('AC265 CP04b approved outage-target registration contracts', () => {
  it('pins the exact protected policy and accepts the canonical exchange', () => {
    expect(AC265_APPROVED_OUTAGE_TARGET_REGISTRATION_SCHEMA_VERSION).toBe(
      request.schemaVersion,
    );
    expect(AC265_APPROVED_OUTAGE_TARGET_POLICY_REFERENCE).toBe(
      request.policyRef,
    );
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema.parse(
        request,
      ),
    ).toEqual(request);
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResultSchema.parse(
        result,
      ),
    ).toEqual(result);
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema.parse(
        result,
      ),
    ).toEqual(result);
  });

  it('accepts only v4 staging authorization/idempotency references and the pinned policy', () => {
    for (const [field, values] of [
      [
        'authorizationRef',
        [
          '',
          'ac265-authorization://production/72000000-0000-4000-8000-000000000001',
          'ac265-authorization://staging/not-a-uuid',
          'ac265-authorization://staging/72000000-0000-1000-8000-000000000001',
        ],
      ],
      [
        'idempotencyRef',
        [
          '',
          'ac265-idempotency://production/75000000-0000-4000-8000-000000000001',
          'ac265-idempotency://staging/not-a-uuid',
          'ac265-idempotency://staging/75000000-0000-4000-0000-000000000001',
        ],
      ],
      [
        'policyRef',
        [
          '',
          'ac265-outage-policy://staging/v2',
          'ac265-outage-policy://production/v1',
          'ac265-outage-policy://staging/v1?target=other',
        ],
      ],
    ] as const)
      for (const value of values)
        expectRejected(
          ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema,
          { ...request, [field]: value },
        );
  });

  it('forbids caller-authored target scope, identity, timestamps, and policy values', () => {
    for (const extra of [
      { targetId: '74000000-0000-4000-8000-000000000001' },
      { targetRef: result.targetRef },
      { runId: '73000000-0000-4000-8000-000000000001' },
      { candidateId: '76000000-0000-4000-8000-000000000001' },
      { dependencyId: 'guessed-dependency' },
      {
        route: {
          method: 'GET',
          operationId: 'CMS-03A-06',
          path: '/api/v1/cms',
        },
      },
      { deploymentId: '6428523608' },
      { hostingProjectId: 'wejammin-staging' },
      { supabaseProjectRef: 'abcdefghijklmnopqrst' },
      { approvedAt: result.approvedAt },
      { expiresAt: result.expiresAt },
      { validitySeconds: 240 },
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedOutageTargetRegisterRequestSchema,
        { ...request, ...extra },
      );
  });

  it('rejects noncanonical, secret-bearing, and time-incoherent results', () => {
    for (const value of [
      { ...result, targetSha256: 'A'.repeat(64) },
      { ...result, targetSha256: 'a'.repeat(63) },
      { ...result, approvedAt: result.expiresAt },
      { ...result, expiresAt: result.approvedAt },
      { ...result, environment: 'production' },
      { ...result, hostingProjectId: 'other-project' },
      { ...result, supabaseProjectRef: 'zyxwvutsrqponmlkjih' },
      { ...result, status: 'ok' },
      { ...result, redacted: false },
      { ...result, dependencyId: 'private' },
      { ...result, serviceRoleKey: 'secret' },
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResultSchema,
        value,
      );
  });

  it('keeps conflicts generic and closed', () => {
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema.parse(
        { status: 'conflict' },
      ),
    ).toEqual({ status: 'conflict' });
    expectRejected(
      ContentSchemaRegistryAc265ApprovedOutageTargetRegisterResponseSchema,
      { status: 'conflict', detail: 'private' },
    );
  });
});
