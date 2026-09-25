import {
  AC265_SESSION_BROKER_HOSTING_PROJECT_ID,
  CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION,
  Ac265SessionBrokerAuthorizeResponseSchema,
  Ac265SessionBrokerResolveResponseSchema,
  Ac265SessionBrokerTeardownResponseSchema,
  type Ac265SessionBrokerAuthorizeResult,
  type Ac265SessionBrokerResolveResult,
  type Ac265SessionBrokerTeardownResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  decodeStrict,
  fail,
  sha256Hex,
} from './ac265-session-broker-rpc-transport.ts';

const HANDLE_ROLE_PATTERN =
  /^ac265-session:\/\/([a-z_]+)\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/u;

function requireBoundHandle(
  handleRef: string,
  role: string,
): { readonly role: string; readonly handleRef: string } {
  const match = HANDLE_ROLE_PATTERN.exec(handleRef);
  if (match === null || match[1] !== role) return fail();
  return { role, handleRef };
}

export async function parseAuthorizeResult(
  source: string,
  request: {
    readonly authorizationRef: string;
    readonly runId: string;
    readonly idempotencyRef: string;
    readonly identitySha256: string;
  },
): Promise<Ac265SessionBrokerAuthorizeResult> {
  const decoded = decodeStrict(source);
  const parsed = Ac265SessionBrokerAuthorizeResponseSchema.safeParse(decoded);
  if (!parsed.success || 'status' in parsed.data) return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.runId !== request.runId ||
    result.idempotencyRef !== request.idempotencyRef ||
    result.identitySha256 !== request.identitySha256 ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== AC265_SESSION_BROKER_HOSTING_PROJECT_ID ||
    result.schemaVersion !==
      CONTENT_SCHEMA_REGISTRY_AC265_SESSION_BROKER_SCHEMA_VERSION ||
    result.handles.length !== CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length
  )
    return fail();

  const roles = new Set<string>();
  const references = new Set<string>();
  for (const handle of result.handles) {
    requireBoundHandle(handle.handleRef, handle.role);
    if (roles.has(handle.role) || references.has(handle.handleRef))
      return fail();
    roles.add(handle.role);
    references.add(handle.handleRef);
    if (handle.handleSha256 !== (await sha256Hex(handle.handleRef)))
      return fail();
  }
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES)
    if (!roles.has(role)) return fail();

  return result;
}

export async function parseResolveResult(
  source: string,
  request: {
    readonly authorizationRef: string;
    readonly runId: string;
    readonly identitySha256: string;
    readonly role: string;
    readonly handleRef: string;
    readonly handleSha256: string;
    readonly idempotencyRef: string;
  },
): Promise<Ac265SessionBrokerResolveResult> {
  const decoded = decodeStrict(source);
  const parsed = Ac265SessionBrokerResolveResponseSchema.safeParse(decoded);
  if (!parsed.success || 'status' in parsed.data) return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.runId !== request.runId ||
    result.idempotencyRef !== request.idempotencyRef ||
    result.identitySha256 !== request.identitySha256 ||
    result.role !== request.role ||
    result.handleRef !== request.handleRef ||
    result.handleSha256 !== request.handleSha256 ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== AC265_SESSION_BROKER_HOSTING_PROJECT_ID ||
    result.materialRef === result.handleRef
  )
    return fail();

  requireBoundHandle(result.handleRef, result.role);
  if (result.handleSha256 !== (await sha256Hex(result.handleRef)))
    return fail();
  return result;
}

export async function parseTeardownResult(
  source: string,
  request: {
    readonly authorizationRef: string;
    readonly runId: string;
    readonly identitySha256: string;
    readonly role: string;
    readonly handleRef: string;
    readonly handleSha256: string;
    readonly idempotencyRef: string;
  },
): Promise<Ac265SessionBrokerTeardownResult> {
  const decoded = decodeStrict(source);
  const parsed = Ac265SessionBrokerTeardownResponseSchema.safeParse(decoded);
  if (!parsed.success || 'status' in parsed.data) return fail();

  const result = parsed.data;
  if (
    result.authorizationRef !== request.authorizationRef ||
    result.runId !== request.runId ||
    result.idempotencyRef !== request.idempotencyRef ||
    result.identitySha256 !== request.identitySha256 ||
    result.role !== request.role ||
    result.handleRef !== request.handleRef ||
    result.handleSha256 !== request.handleSha256 ||
    result.sessionRefSha256 !== request.handleSha256 ||
    result.environment !== 'staging' ||
    result.hostingProjectId !== AC265_SESSION_BROKER_HOSTING_PROJECT_ID
  )
    return fail();

  requireBoundHandle(result.handleRef, result.role);
  return result;
}
