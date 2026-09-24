import { expect } from 'vitest';

import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';

export const AC265_SESSION_BROKER_SCHEMA_VERSION =
  'ac265-hosted-session-broker-control-v1' as const;

export const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
export const runId = '10000000-0000-4000-8000-000000000001';
export const identitySha256 = 'b'.repeat(64);

export const authorizeIdempotencyRef =
  'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004';
export const resolveIdempotencyRef =
  'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005';
export const teardownIdempotencyRef =
  'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006';

export const uuidForIndex = (index: number): string =>
  `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

export const handleFor = (
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

export const handles = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) =>
  handleFor(role, index + 1),
);

export const authorizedAt = '2026-09-24T10:00:00.000Z';
export const expiresAt = '2026-09-24T10:05:00.000Z';
export const resolvedAt = '2026-09-24T10:00:30.000Z';
export const loggedOutAt = '2026-09-24T10:04:00.000Z';

export const controlBase = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: AC265_SESSION_BROKER_SCHEMA_VERSION,
  authorizationRef,
  runId,
  identitySha256,
} as const;

export const redactedBase = {
  ...controlBase,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

export const authorizeRequest = {
  ...controlBase,
  idempotencyRef: authorizeIdempotencyRef,
  handles,
} as const;

export const authorizeResult = {
  ...redactedBase,
  idempotencyRef: authorizeIdempotencyRef,
  state: 'authorized',
  handles: handles.map(({ role, handleRef, handleSha256 }) => ({
    role,
    handleRef,
    handleSha256,
  })),
  maxResolvesPerHandle: 1,
  authorizedAt,
  expiresAt,
} as const;

export const firstMaterialRef = handles[0]!.materialRef;
export const firstHandle = {
  role: handles[0]!.role,
  handleRef: handles[0]!.handleRef,
  handleSha256: handles[0]!.handleSha256,
} as const;

export const resolveRequest = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef: resolveIdempotencyRef,
} as const;

export const resolveResult = {
  ...redactedBase,
  ...firstHandle,
  idempotencyRef: resolveIdempotencyRef,
  state: 'resolved',
  materialRef: firstMaterialRef,
  maxResolvesPerHandle: 1,
  resolvedAt,
  expiresAt,
} as const;

export const teardownRequest = {
  ...controlBase,
  ...firstHandle,
  logoutScope: 'current_session_only',
  idempotencyRef: teardownIdempotencyRef,
} as const;

export const teardownResult = {
  ...redactedBase,
  ...firstHandle,
  idempotencyRef: teardownIdempotencyRef,
  state: 'logged_out',
  logoutScope: 'current_session_only',
  sessionRefSha256: firstHandle.handleSha256,
  teardownsRemaining: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length - 1,
  loggedOutAt,
} as const;

export const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
): void => expect(schema.safeParse(value).success).toBe(false);
