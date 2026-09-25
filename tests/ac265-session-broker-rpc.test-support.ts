import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';

export const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SERVICE_ROLE_KEY = 'service-role-key';

export const FAILURE = 'AC265 session broker request failed';

export const authorizationRef =
  'ac265-authorization://staging/20000000-0000-4000-8000-000000000002';
export const runId = '10000000-0000-4000-8000-000000000001';
export const identitySha256 = 'b'.repeat(64);

export const uuidForIndex = (index: number): string =>
  `30000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

export const sha256Hex = async (value: string): Promise<string> => {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

export const handles = await Promise.all(
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map(async (role, index) => {
    const handleRef = `ac265-session://${role}/${uuidForIndex(index + 1)}`;
    return {
      role,
      handleRef,
      handleSha256: await sha256Hex(handleRef),
      materialRef: `ac265-session-material://staging/${uuidForIndex(index + 1)}`,
    } as const;
  }),
);

const controlBase = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-session-broker-control-v1',
  authorizationRef,
  runId,
  identitySha256,
} as const;

export const authorizeRequest = {
  ...controlBase,
  idempotencyRef:
    'ac265-idempotency://staging/40000000-0000-4000-8000-000000000004',
  handles,
} as const;

export const authorizeResult = {
  ...controlBase,
  idempotencyRef: authorizeRequest.idempotencyRef,
  state: 'authorized',
  handles: handles.map(({ role, handleRef, handleSha256 }) => ({
    role,
    handleRef,
    handleSha256,
  })),
  maxResolvesPerHandle: 1,
  authorizedAt: '2026-09-24T10:00:00.000Z',
  expiresAt: '2026-09-24T10:05:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

export const firstHandle = {
  role: handles[0]!.role,
  handleRef: handles[0]!.handleRef,
  handleSha256: handles[0]!.handleSha256,
} as const;

export const resolveRequest = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef:
    'ac265-idempotency://staging/50000000-0000-4000-8000-000000000005',
} as const;

export const resolveResult = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef: resolveRequest.idempotencyRef,
  state: 'resolved',
  maxResolvesPerHandle: 1,
  resolvedAt: '2026-09-24T10:00:30.000Z',
  expiresAt: '2026-09-24T10:05:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

export const teardownRequest = {
  ...controlBase,
  ...firstHandle,
  logoutScope: 'current_session_only',
  idempotencyRef:
    'ac265-idempotency://staging/60000000-0000-4000-8000-000000000006',
} as const;

export const teardownResult = {
  ...controlBase,
  ...firstHandle,
  idempotencyRef: teardownRequest.idempotencyRef,
  state: 'logged_out',
  logoutScope: 'current_session_only',
  sessionRefSha256: firstHandle.handleSha256,
  teardownsRemaining: CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length - 1,
  loggedOutAt: '2026-09-24T10:04:00.000Z',
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  redacted: true,
} as const;

export const clientOptions = (fetchImpl: typeof fetch) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey: SERVICE_ROLE_KEY,
  fetchImpl,
});

export const responseFor = (
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(
    typeof payload === 'string' ? payload : JSON.stringify(payload),
    {
      status,
      headers: { 'content-type': 'application/json', ...headers },
    },
  );
