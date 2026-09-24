import { describe, expect, it } from 'vitest';

import {
  AC265_SESSION_BROKER_MAX_DURATION_MS,
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
import {
  authorizeRequest,
  authorizeResult,
  expectRejected,
  handles,
  resolveRequest,
  resolveResult,
  teardownRequest,
  teardownResult,
  uuidForIndex,
} from './ac265-session-broker-control.test-support.ts';

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

  it('rejects an authorize result that drops or duplicates a locked role', () => {
    const duplicates = [
      ...authorizeResult.handles.slice(0, 8),
      authorizeResult.handles[0],
    ];
    expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
      ...authorizeResult,
      handles: duplicates,
    });
    expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
      ...authorizeResult,
      handles: authorizeResult.handles.slice(0, 8).map((handle, index) =>
        index === 0
          ? {
              ...handle,
              role: 'forbidden_hidden',
              handleRef: handle.handleRef.replace(
                /^ac265-session:\/\/[a-z_]+\//u,
                'ac265-session://forbidden_hidden/',
              ),
            }
          : handle,
      ),
    });
    expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
      ...authorizeResult,
      handles: authorizeResult.handles.slice(1),
    });
    expect(
      Ac265SessionBrokerAuthorizeResultSchema.parse(authorizeResult),
    ).toEqual(authorizeResult);
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

  it('binds the handle to its request by role, not by array position', () => {
    // The role lives inside the handle reference, so a caller cannot satisfy
    // the contract by reordering the locked roles: every permutation either
    // mismatches the reference or duplicates a role.
    const rotated = [...handles.slice(1), handles[0]];
    for (const index of [0, 3, 8])
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        handles: handles.map((handle, position) =>
          position === index ? rotated[position] : handle,
        ),
      });

    const sortedByRole = [...handles].sort((left, right) =>
      left.role.localeCompare(right.role),
    );
    expect(
      Ac265SessionBrokerAuthorizeRequestSchema.parse({
        ...authorizeRequest,
        handles: sortedByRole,
      }).handles.map(({ role }) => role),
    ).toEqual(sortedByRole.map(({ role }) => role));
  });

  it('accepts only the exact replay envelope shape for a repeated reference', () => {
    // Replay semantics are enforced by the control plane: an exact repeat
    // returns the stored envelope, and any change under the same idempotency
    // reference is a conflict. The contract must keep both shapes stable.
    expect(
      Ac265SessionBrokerAuthorizeRequestSchema.parse(authorizeRequest),
    ).toEqual(authorizeRequest);
    expect(
      Ac265SessionBrokerResolveRequestSchema.parse(resolveRequest),
    ).toEqual(resolveRequest);
    expect(
      Ac265SessionBrokerTeardownRequestSchema.parse(teardownRequest),
    ).toEqual(teardownRequest);
    expect(
      Ac265SessionBrokerConflictSchema.parse({ status: 'conflict' }),
    ).toEqual({ status: 'conflict' });
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
      authorizeResult.authorizedAt,
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
});
