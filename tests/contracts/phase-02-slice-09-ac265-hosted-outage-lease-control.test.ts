import { describe, expect, it } from 'vitest';

import {
  AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS,
  CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION,
  ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema,
  ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema,
  ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';

const CRITERION = 'P2-S09-AC-265' as const;
const SCHEMA_VERSION = 'ac265-hosted-outage-lease-control-v1' as const;

const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const targetRef =
  'ac265-outage-target://staging/30000000-0000-4000-8000-000000000003';
const acquireIdempotencyRef =
  'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004';
const consumeIdempotencyRef =
  'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005';
const releaseIdempotencyRef =
  'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006';
const leaseRef = 'ac265-lease://staging/70000000-0000-4000-8000-000000000007';
const leaseSha256 = 'a'.repeat(64);

const acquiredAt = '2026-09-21T10:00:00.000Z';
const expiresAt = '2026-09-21T10:01:00.000Z';
const consumedAt = '2026-09-21T10:00:15.000Z';
const releasedAt = '2026-09-21T10:00:30.000Z';

const acquireRequest = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  targetRef,
  idempotencyRef: acquireIdempotencyRef,
  leaseDurationSeconds: AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS,
  requestLimit: 1,
} as const;

const acquireResult = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  targetRef,
  idempotencyRef: acquireIdempotencyRef,
  leaseRef,
  leaseSha256,
  environment: 'staging',
  state: 'acquired',
  leaseDurationSeconds: AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS,
  requestLimit: 1,
  acquiredAt,
  expiresAt,
  redacted: true,
} as const;

const consumeRequest = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  targetRef,
  leaseRef,
  leaseSha256,
  idempotencyRef: consumeIdempotencyRef,
} as const;

const consumeResult = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  targetRef,
  idempotencyRef: consumeIdempotencyRef,
  leaseRef,
  leaseSha256,
  environment: 'staging',
  state: 'consumed',
  requestLimit: 1,
  consumedAt,
  redacted: true,
} as const;

const releaseRequest = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  targetRef,
  leaseRef,
  leaseSha256,
  idempotencyRef: releaseIdempotencyRef,
} as const;

const releaseResult = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  targetRef,
  idempotencyRef: releaseIdempotencyRef,
  leaseRef,
  leaseSha256,
  environment: 'staging',
  state: 'released',
  releasedAt,
  redacted: true,
} as const;

const requestCases = [
  {
    schema: ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
    value: acquireRequest,
  },
  {
    schema: ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema,
    value: consumeRequest,
  },
  {
    schema: ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema,
    value: releaseRequest,
  },
] as const;

const resultCases = [
  {
    schema: ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema,
    value: acquireResult,
  },
  {
    schema: ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema,
    value: consumeResult,
  },
  {
    schema: ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema,
    value: releaseResult,
  },
] as const;

const expectRejected = (
  schema: { safeParse: (value: unknown) => unknown },
  value: unknown,
) => {
  expect(schema.safeParse(value)).toMatchObject({ success: false });
};

describe('AC265 CP-01 hosted outage-lease control contracts', () => {
  it('pins the exact criterion and schema version and accepts each valid request/result shape', () => {
    expect(SCHEMA_VERSION).toBe(
      CONTENT_SCHEMA_REGISTRY_AC265_OUTAGE_LEASE_CONTROL_SCHEMA_VERSION,
    );
    expect(CRITERION).toBe('P2-S09-AC-265');
    expect(AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS).toBe(60);

    expect(
      ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema.parse(
        acquireRequest,
      ),
    ).toEqual(acquireRequest);
    expect(
      ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema.parse(
        acquireResult,
      ),
    ).toEqual(acquireResult);
    expect(
      ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema.parse(
        consumeRequest,
      ),
    ).toEqual(consumeRequest);
    expect(
      ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema.parse(
        consumeResult,
      ),
    ).toEqual(consumeResult);
    expect(
      ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema.parse(
        releaseRequest,
      ),
    ).toEqual(releaseRequest);
    expect(
      ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema.parse(
        releaseResult,
      ),
    ).toEqual(releaseResult);
  });

  it('accepts only the pinned one-request, sixty-second lease policy', () => {
    expect(
      ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema.safeParse(
        acquireRequest,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema.safeParse(
        acquireResult,
      ).success,
    ).toBe(true);

    for (const duration of [0, 1, 59, 61, 120]) {
      expectRejected(
        ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
        { ...acquireRequest, leaseDurationSeconds: duration },
      );
      expectRejected(ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema, {
        ...acquireResult,
        leaseDurationSeconds: duration,
      });
    }
    for (const requestLimit of [0, 2, 10, 1.5, '1']) {
      expectRejected(
        ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
        { ...acquireRequest, requestLimit },
      );
      expectRejected(ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema, {
        ...acquireResult,
        requestLimit,
      });
      expectRejected(ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema, {
        ...consumeResult,
        requestLimit,
      });
    }
  });

  it('requires staging-only, redacted result envelopes and server-issued lease timestamps', () => {
    for (const { schema, value } of resultCases) {
      expectRejected(schema, { ...value, environment: 'production' });
      expectRejected(schema, { ...value, redacted: false });
      expectRejected(schema, { ...value, redacted: undefined });
      expectRejected(schema, { ...value, identity: { email: 'x' } });
      expectRejected(schema, { ...value, credentials: 'token' });
      expectRejected(schema, {
        ...value,
        target: { dependencyId: 'x' },
      });
      expectRejected(schema, { ...value, targetBytes: 'raw-target' });
    }

    expectRejected(ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema, {
      ...acquireResult,
      expiresAt: '2026-09-21T10:01:00.001Z',
    });
    expectRejected(ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema, {
      ...acquireResult,
      acquiredAt: '2026-09-21T10:00:01.000Z',
    });
    expectRejected(ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema, {
      ...consumeResult,
      consumedAt: 'not-a-timestamp',
    });
    expectRejected(ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema, {
      ...releaseResult,
      releasedAt: 'not-a-timestamp',
    });
  });

  it('rejects unknown keys and caller-supplied scope, timestamps, identity, credentials, and raw target bytes', () => {
    const forbiddenCallerFields = [
      { callerScope: { runId: 'caller-controlled' } },
      { scope: { dependencyId: 'caller-controlled' } },
      { runId: '10000000-0000-4000-8000-000000000001' },
      { issuedAt: acquiredAt },
      { identity: { personId: '10000000-0000-4000-8000-000000000001' } },
      { credentials: { accessToken: 'secret' } },
      { authorization: 'Bearer secret' },
      { target: { dependencyId: 'dependency' } },
      { targetBytes: new Uint8Array([1, 2, 3]) },
      { rawTargetBytes: 'eyJzY29wZSI6ey4uLn0=' },
      { unknown: true },
    ];

    for (const { schema, value } of requestCases) {
      for (const forbiddenFields of forbiddenCallerFields)
        expectRejected(schema, { ...value, ...forbiddenFields });
    }
    for (const { schema, value } of resultCases) {
      for (const forbiddenFields of forbiddenCallerFields)
        expectRejected(schema, { ...value, ...forbiddenFields });
    }
  });

  it('rejects malformed, production, non-opaque, and cross-scheme authorization/target/idempotency/lease references', () => {
    const invalidRefs = [
      '',
      'https://example.test/authorization',
      'ac265-authorization://production/20000000-0000-4000-8000-000000000002',
      'ac265-outage-target://production/30000000-0000-4000-8000-000000000003',
      'ac265-idempotency://production/40000000-0000-4000-8000-000000000004',
      'ac265-lease://production/70000000-0000-4000-8000-000000000007',
      'ac265-authorization://staging/not-a-uuid',
      'ac265-outage-target://staging/not-a-uuid',
      'ac265-idempotency://staging/not-a-uuid',
      'ac265-lease://staging/not-a-uuid',
      'ac265-authorization://staging/20000000-0000-4000-8000-000000000002?token=secret',
      'ac265-outage-target://staging/30000000-0000-4000-8000-000000000003#scope',
      'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004/extra',
      'ac265-lease://staging/../70000000-0000-4000-8000-000000000007',
    ];

    for (const invalidRef of invalidRefs) {
      for (const { schema, value } of [...requestCases, ...resultCases]) {
        for (const field of [
          'authorizationRef',
          'targetRef',
          'idempotencyRef',
        ] as const)
          expectRejected(schema, { ...value, [field]: invalidRef });
        if ('leaseRef' in value)
          expectRejected(schema, { ...value, leaseRef: invalidRef });
      }
    }

    for (const invalidDigest of [
      '',
      'A'.repeat(64),
      'a'.repeat(63),
      'a'.repeat(65),
      'not-a-digest',
    ])
      for (const { schema, value } of [...requestCases, ...resultCases])
        if ('leaseSha256' in value)
          expectRejected(schema, { ...value, leaseSha256: invalidDigest });
  });

  it('rejects request schema versions, criteria, and result states that are not CP-01 exact', () => {
    for (const { schema, value } of requestCases) {
      expectRejected(schema, { ...value, criterion: 'P2-S09-AC-266' });
      expectRejected(schema, { ...value, schemaVersion: 'v0' });
    }
    for (const { schema, value } of resultCases) {
      expectRejected(schema, { ...value, criterion: 'P2-S09-AC-266' });
      expectRejected(schema, { ...value, schemaVersion: 'v0' });
    }
    expectRejected(ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema, {
      ...acquireResult,
      state: 'consumed',
    });
    expectRejected(ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema, {
      ...consumeResult,
      state: 'released',
    });
    expectRejected(ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema, {
      ...releaseResult,
      state: 'acquired',
    });
  });
});
