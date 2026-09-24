import { describe, expect, it } from 'vitest';

import {
  AC265_SESSION_BROKER_CRITERION,
  AC265_SESSION_BROKER_ENVIRONMENT,
  AC265_SESSION_BROKER_HOSTING_PROJECT_ID,
  AC265_SESSION_BROKER_LOGOUT_SCOPE,
  AC265_SESSION_BROKER_MAX_DURATION_MS,
  AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE,
  CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION,
  Ac265SessionBrokerAuthorizeRequestSchema,
  Ac265SessionBrokerAuthorizeResponseSchema,
  Ac265SessionBrokerAuthorizeResultSchema,
  Ac265SessionBrokerConflictSchema,
  Ac265SessionBrokerResolveRequestSchema,
  Ac265SessionBrokerResolveResponseSchema,
  Ac265SessionBrokerResolveResultSchema,
  Ac265SessionBrokerTeardownRequestSchema,
  Ac265SessionBrokerTeardownResponseSchema,
  Ac265SessionBrokerTeardownResultSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';

const SCHEMA_VERSION =
  'ac265-hosted-session-broker-control-v1' as const satisfies typeof CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION;

const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
const runId = '10000000-0000-4000-8000-000000000001';
const identitySha256 = 'b'.repeat(64);

const authorizeIdempotencyRef =
  'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004';
const resolveIdempotencyRef =
  'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005';
const teardownIdempotencyRef =
  'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006';

const uuidForIndex = (index: number): string =>
  `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const handleFor = (
  role: (typeof CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)[number],
  index: number,
) => {
  const handleRef = `ac265-session://${role}/${uuidForIndex(index)}`;
  return {
    role,
    handleRef,
    handleSha256: String(index).padStart(64, 'c').slice(-64),
    materialRef: `ac265-session-material://staging/${uuidForIndex(index)}`,
  } as const;
};

const handles = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) =>
  handleFor(role, index + 1),
);

const authorizedAt = '2026-09-24T10:00:00.000Z';
const expiresAt = '2026-09-24T10:05:00.000Z';
const resolvedAt = '2026-09-24T10:00:30.000Z';
const loggedOutAt = '2026-09-24T10:04:00.000Z';

const controlBase = {
  criterion: AC265_SESSION_BROKER_CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef,
  runId,
  identitySha256,
} as const;

const redactedBase = {
  ...controlBase,
  environment: AC265_SESSION_BROKER_ENVIRONMENT,
  hostingProjectId: AC265_SESSION_BROKER_HOSTING_PROJECT_ID,
  redacted: true,
} as const;

const authorizeRequest = {
  ...controlBase,
  idempotencyRef: authorizeIdempotencyRef,
  handles,
} as const;

const authorizeResult = {
  ...redactedBase,
  idempotencyRef: authorizeIdempotencyRef,
  state: 'authorized',
  handles: handles.map(({ role, handleRef, handleSha256 }) => ({
    role,
    handleRef,
    handleSha256,
  })),
  maxResolvesPerHandle: AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE,
  authorizedAt,
  expiresAt,
} as const;

const firstMaterialRef = handles[0]!.materialRef;
const firstHandle = {
  role: handles[0]!.role,
  handleRef: handles[0]!.handleRef,
  handleSha256: handles[0]!.handleSha256,
} as const;

const resolveRequest = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef: resolveIdempotencyRef,
} as const;

const resolveResult = {
  ...redactedBase,
  ...firstHandle,
  idempotencyRef: resolveIdempotencyRef,
  state: 'resolved',
  materialRef: firstMaterialRef,
  maxResolvesPerHandle: AC265_SESSION_BROKER_MAX_RESOLVES_PER_HANDLE,
  resolvedAt,
  expiresAt,
} as const;

const teardownRequest = {
  ...controlBase,
  ...firstHandle,
  logoutScope: AC265_SESSION_BROKER_LOGOUT_SCOPE,
  idempotencyRef: teardownIdempotencyRef,
} as const;

const teardownResult = {
  ...redactedBase,
  ...firstHandle,
  idempotencyRef: teardownIdempotencyRef,
  state: 'logged_out',
  logoutScope: AC265_SESSION_BROKER_LOGOUT_SCOPE,
  sessionRefSha256: firstHandle.handleSha256,
  teardownsRemaining: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length - 1,
  loggedOutAt,
} as const;

const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
): void => expect(schema.safeParse(value).success).toBe(false);

describe('AC265 run-scoped session broker control contract', () => {
  it('accepts a complete nine-role authorization round trip', () => {
    expect(
      Ac265SessionBrokerAuthorizeRequestSchema.parse(authorizeRequest),
    ).toEqual(authorizeRequest);
    expect(
      Ac265SessionBrokerAuthorizeResultSchema.parse(authorizeResult),
    ).toEqual(authorizeResult);
    expect(
      Ac265SessionBrokerAuthorizeResponseSchema.parse(authorizeResult),
    ).toEqual(authorizeResult);
  });

  it('accepts resolve and teardown round trips bound to one handle', () => {
    expect(
      Ac265SessionBrokerResolveRequestSchema.parse(resolveRequest),
    ).toEqual(resolveRequest);
    expect(Ac265SessionBrokerResolveResultSchema.parse(resolveResult)).toEqual(
      resolveResult,
    );
    expect(
      Ac265SessionBrokerTeardownRequestSchema.parse(teardownRequest),
    ).toEqual(teardownRequest);
    expect(
      Ac265SessionBrokerTeardownResultSchema.parse(teardownResult),
    ).toEqual(teardownResult);
    expect(
      Ac265SessionBrokerResolveResponseSchema.parse(resolveResult),
    ).toEqual(resolveResult);
    expect(
      Ac265SessionBrokerTeardownResponseSchema.parse(teardownResult),
    ).toEqual(teardownResult);
  });

  it('accepts only the closed conflict envelope for every operation', () => {
    for (const schema of [
      Ac265SessionBrokerAuthorizeResponseSchema,
      Ac265SessionBrokerResolveResponseSchema,
      Ac265SessionBrokerTeardownResponseSchema,
    ]) {
      expect(schema.parse({ status: 'conflict' })).toEqual({
        status: 'conflict',
      });
      expectRejected(schema, { status: 'conflict', detail: 'private' });
      expectRejected(schema, { status: 'ok' });
    }
    expect(
      Ac265SessionBrokerConflictSchema.parse({ status: 'conflict' }),
    ).toEqual({ status: 'conflict' });
  });

  it('requires every locked role exactly once with distinct handles and material', () => {
    expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
      ...authorizeRequest,
      handles: handles.slice(0, -1),
    });
    expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
      ...authorizeRequest,
      handles: [...handles.slice(0, -1), handles[0]],
    });
    expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
      ...authorizeRequest,
      handles: [
        ...handles.slice(0, -1),
        { ...handles[8], materialRef: handles[0]!.materialRef },
      ],
    });
    for (const index of [0, 4, 8])
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        handles: handles.map((handle, position) =>
          position === index
            ? {
                ...handle,
                handleRef: `ac265-session://${CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES[(index + 1) % 9]}/${uuidForIndex(index + 1)}`,
              }
            : handle,
        ),
      });
  });

  it('rejects handle references that are not the locked staging role shape', () => {
    const rejectedReferences = [
      '',
      'ac265-session://owner_full',
      `ac265-session://owner_full/${uuidForIndex(1)}/extra`,
      `ac265-session://owner_full/${uuidForIndex(1)}?token=secret`,
      `ac265-session://owner_full/${uuidForIndex(1)}#fragment`,
      `ac265-session://production/owner_full/${uuidForIndex(1)}`,
      'ac265-session://owner_full/not-a-uuid',
      'ac265-session://owner_full/30000000-0000-3000-8000-000000000001',
      'ac265-session://owner_full/30000000-0000-4000-0000-000000000001',
      'ac265-session://OWNER_FULL/30000000-0000-4000-8000-000000000001',
      'ac265-session://role/30000000-0000-4000-8000-000000000001',
      'https://example.test/owner_full/30000000-0000-4000-8000-000000000001',
    ];
    for (const handleRef of rejectedReferences)
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        handleRef,
      });
  });

  it('rejects session-state material anywhere in the contract', () => {
    const forbidden = [
      { cookies: [] },
      { storageState: { cookies: [], origins: [] } },
      { storage_state: '{"cookies":[]}' },
      { accessToken: 'redacted' },
      { refreshToken: 'redacted' },
      { session: { access_token: 'redacted' } },
      { material: '{"cookies":[]}' },
      { materialBytes: 'ey' + 'JhbGciOiJIUzI1NiJ9' },
    ];
    for (const injected of forbidden) {
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerTeardownRequestSchema, {
        ...teardownRequest,
        ...injected,
      });
    }
  });

  it('rejects material references that are not opaque staging references', () => {
    for (const materialRef of [
      '',
      'ac265-session-material://staging',
      `ac265-session-material://production/${uuidForIndex(1)}`,
      `ac265-session-material://staging/${uuidForIndex(1)}/extra`,
      'ac265-session-material://staging/not-a-uuid',
      'ac265-session://owner_full/30000000-0000-4000-8000-000000000001',
      'https://storage.example.test/material.json',
    ])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        materialRef,
      });
  });

  it('rejects a resolve or teardown result whose role contradicts the handle', () => {
    expectRejected(Ac265SessionBrokerResolveResultSchema, {
      ...resolveResult,
      role: 'forbidden_hidden',
    });
    expectRejected(Ac265SessionBrokerTeardownResultSchema, {
      ...teardownResult,
      role: 'forbidden_hidden',
    });
    expectRejected(Ac265SessionBrokerResolveRequestSchema, {
      ...resolveRequest,
      role: 'forbidden_hidden',
    });
  });

  it('rejects teardown that does not bind the exact handle digest', () => {
    expectRejected(Ac265SessionBrokerTeardownResultSchema, {
      ...teardownResult,
      sessionRefSha256: 'd'.repeat(64),
    });
    expectRejected(Ac265SessionBrokerTeardownResultSchema, {
      ...teardownResult,
      sessionRefSha256: 'D'.repeat(64),
    });
    expectRejected(Ac265SessionBrokerTeardownResultSchema, {
      ...teardownResult,
      sessionRefSha256: 'd'.repeat(63),
    });
  });

  it('rejects any logout scope other than current_session_only', () => {
    for (const logoutScope of ['all', 'global', 'others', '', 'current'])
      expectRejected(Ac265SessionBrokerTeardownRequestSchema, {
        ...teardownRequest,
        logoutScope,
      });
    for (const logoutScope of ['all', 'global', null])
      expectRejected(Ac265SessionBrokerTeardownResultSchema, {
        ...teardownResult,
        logoutScope,
      });
  });

  it('rejects teardown counts outside the locked role denominator', () => {
    for (const teardownsRemaining of [-1, 9, 1.5, '2', null])
      expectRejected(Ac265SessionBrokerTeardownResultSchema, {
        ...teardownResult,
        teardownsRemaining,
      });
    expect(
      Ac265SessionBrokerTeardownResultSchema.parse({
        ...teardownResult,
        teardownsRemaining: 0,
      }).teardownsRemaining,
    ).toBe(0);
  });

  it('rejects an authorization window that is not positive and bounded', () => {
    for (const expires of [
      authorizedAt,
      '2026-09-24T09:59:59.000Z',
      '2026-09-24T10:05:00.001Z',
      '2026-09-24T11:00:00.000Z',
    ])
      expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
        ...authorizeResult,
        expiresAt: expires,
      });
    expect(AC265_SESSION_BROKER_MAX_DURATION_MS).toBe(300_000);
    expect(
      Ac265SessionBrokerAuthorizeResultSchema.parse({
        ...authorizeResult,
        expiresAt: '2026-09-24T10:05:00Z',
      }).expiresAt,
    ).toBe('2026-09-24T10:05:00Z');
  });

  it('rejects a resolve result that outlives its authorization window', () => {
    expectRejected(Ac265SessionBrokerResolveResultSchema, {
      ...resolveResult,
      expiresAt: '2026-09-24T10:06:00.000Z',
    });
    expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
      ...authorizeResult,
      maxResolvesPerHandle: 2,
    });
    expectRejected(Ac265SessionBrokerResolveResultSchema, {
      ...resolveResult,
      maxResolvesPerHandle: 9,
    });
  });

  it('rejects unauthorized criterion, version, environment, and project drift', () => {
    for (const criterion of ['P2-S09-AC-264', 'P2-S09-AC-266', ''])
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        criterion,
      });
    for (const schemaVersion of [
      'ac265-hosted-session-broker-control-v2',
      'ac265-hosted-outage-lease-control-v1',
      '',
    ])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        schemaVersion,
      });
    for (const environment of ['production', 'local', ''])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        environment,
      });
    for (const hostingProjectId of ['wejammin-production', 'other', ''])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        hostingProjectId,
      });
  });

  it('rejects a non-redacted or redaction-absent result envelope', () => {
    for (const redacted of [false, null, undefined])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        redacted,
      });
    const withoutRedaction: Record<string, unknown> = { ...resolveResult };
    delete withoutRedaction.redacted;
    expectRejected(Ac265SessionBrokerResolveResultSchema, withoutRedaction);
  });

  it('rejects non-canonical digests, references, and identity values', () => {
    for (const identity of ['B'.repeat(64), 'b'.repeat(63), 'b'.repeat(65), ''])
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        identitySha256: identity,
      });
    for (const handleSha256 of ['C'.repeat(64), 'c'.repeat(63), ''])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        handleSha256,
      });
    for (const authorization of [
      '',
      'ac265-authorization://production/20000000-0000-4000-8000-000000000002',
      'ac265-authorization://staging/not-a-uuid',
      `ac265-authorization://staging/${uuidForIndex(2)}?token=secret`,
    ])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        authorizationRef: authorization,
      });
    for (const run of ['', 'not-a-uuid', '10000000-0000-4000-8000-00000000000'])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        runId: run,
      });
  });

  it('rejects unknown members on every request and result', () => {
    for (const injected of [
      { unknown: true },
      { runner: 'other' },
      { identity: {} },
      { resolvedMaterial: 'redacted' },
    ]) {
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
        ...authorizeResult,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerTeardownRequestSchema, {
        ...teardownRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerTeardownResultSchema, {
        ...teardownResult,
        ...injected,
      });
    }
  });
});
