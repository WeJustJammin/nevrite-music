import {
  InfrastructureViewStateSchema,
  QuotedVersionSchema,
  RequestIdSchema,
  ServerAuthoritySchema,
  VerifiedSessionSchema,
  type InfrastructureViewState,
  type ServerAuthority,
  type VerifiedSession,
} from '@wejammin/contracts';
import type { InfrastructureSurfaceSeeds } from './infrastructure-surface-projection';
type Awaitable<T> = T | Promise<T>;
export const INFRASTRUCTURE_READ_CAPABILITY = 'infrastructure.read' as const;
export type InfrastructureContextRoute = 'index' | 'record';
export interface InfrastructureCanonicalProjection {
  readonly state: unknown;
  readonly version: unknown;
}

export type InfrastructureAuthority = Omit<ServerAuthority, 'actingPartyId'> & {
  readonly actingPartyId: string;
};
export interface InfrastructureContextPorts {
  readonly verifySession: (request: Request) => Awaitable<unknown>;
  readonly now: () => Awaitable<unknown>;
  readonly resolveAuthority: (input: {
    readonly request: Request;
    readonly session: VerifiedSession;
    readonly route: InfrastructureContextRoute;
    readonly recordId: string | null;
  }) => Awaitable<unknown>;
  readonly resolveRouteCapability: (input: {
    readonly request: Request;
    readonly session: VerifiedSession;
    readonly authority: InfrastructureAuthority;
    readonly route: InfrastructureContextRoute;
    readonly recordId: string | null;
    readonly requiredCapability: typeof INFRASTRUCTURE_READ_CAPABILITY;
  }) => Awaitable<
    boolean | { readonly capability: string; readonly granted: boolean } | null
  >;
  readonly loadCanonicalProjection: (input: {
    readonly request: Request;
    readonly session: VerifiedSession;
    readonly authority: InfrastructureAuthority;
    readonly route: InfrastructureContextRoute;
    readonly recordId: string | null;
    readonly capability: typeof INFRASTRUCTURE_READ_CAPABILITY;
  }) => Awaitable<InfrastructureCanonicalProjection | null>;
  /** Optional server-only safe props for the bounded infrastructure islands. */
  readonly loadSurfaceProjection?: (input: {
    readonly request: Request;
    readonly session: VerifiedSession;
    readonly authority: InfrastructureAuthority;
    readonly route: InfrastructureContextRoute;
    readonly recordId: string | null;
    readonly version: string | null;
  }) => Awaitable<InfrastructureSurfaceSeeds | null>;
}
export interface VerifiedInfrastructureContext {
  readonly route: InfrastructureContextRoute;
  readonly recordId: string | null;
  readonly session: VerifiedSession;
  readonly authority: InfrastructureAuthority;
  readonly capability: typeof INFRASTRUCTURE_READ_CAPABILITY;
  readonly projection: InfrastructureViewState;
  readonly version: string | null;
}
export type InfrastructureContextFailure =
  | Readonly<{
      readonly kind: 'unauthenticated';
      readonly reason:
        'missing_session' | 'invalid_session' | 'expired_session';
    }>
  | Readonly<{
      readonly kind: 'forbidden';
      readonly reason: 'missing_authority' | 'capability';
    }>
  | Readonly<{ readonly kind: 'invalid_record' }>
  | Readonly<{ readonly kind: 'not_found' }>
  | Readonly<{
      readonly kind: 'unavailable';
      readonly reason: 'ports' | 'dependency' | 'clock' | 'projection';
    }>;
export type InfrastructureContextResult =
  | Readonly<{
      readonly kind: 'authorized';
      readonly context: VerifiedInfrastructureContext;
    }>
  | InfrastructureContextFailure;
export interface ResolveInfrastructureContextInput {
  readonly request: Request;
  readonly route: InfrastructureContextRoute;
  readonly recordId?: string | null;
  readonly ports: InfrastructureContextPorts | null | undefined;
}
const trustedPorts = new WeakSet<object>();
const verifiedContexts = new WeakSet<object>();

const isObject = (value: unknown): value is object =>
  typeof value === 'object' && value !== null;
const unreachablePort = (): never => {
  throw new Error('anonymous context port is unreachable');
};
const anonymousPorts = Object.freeze({
  verifySession: () => null,
  now: unreachablePort,
  resolveAuthority: unreachablePort,
  resolveRouteCapability: unreachablePort,
  loadCanonicalProjection: unreachablePort,
}) satisfies InfrastructureContextPorts;
trustedPorts.add(anonymousPorts);

export function createInfrastructureContextPorts(
  ports: InfrastructureContextPorts,
): InfrastructureContextPorts {
  const trusted = Object.freeze({ ...ports });
  trustedPorts.add(trusted);
  return trusted;
}

export function readInfrastructureContextPorts(
  locals: unknown,
): InfrastructureContextPorts | null {
  if (locals === undefined) return anonymousPorts;
  if (!isObject(locals)) return null;
  if (!('infrastructureContextPorts' in locals)) return anonymousPorts;
  const candidate = (
    locals as { readonly infrastructureContextPorts?: unknown }
  ).infrastructureContextPorts;
  return isObject(candidate) && trustedPorts.has(candidate)
    ? (candidate as InfrastructureContextPorts)
    : null;
}
/** Structural lookalikes cannot pass this module-private identity check. */
export function isVerifiedInfrastructureContext(
  value: unknown,
): value is VerifiedInfrastructureContext {
  return isObject(value) && verifiedContexts.has(value);
}

const normalizeProjection = (
  projection: InfrastructureCanonicalProjection,
): {
  readonly state: InfrastructureViewState;
  readonly version: string | null;
} | null => {
  if (!isObject(projection)) return null;
  const parsedState = InfrastructureViewStateSchema.safeParse(projection.state);
  if (!parsedState.success) return null;

  let version: string | null = null;
  if (projection.version !== null) {
    const parsedVersion = QuotedVersionSchema.safeParse(projection.version);
    if (!parsedVersion.success) return null;
    version = parsedVersion.data;
  }

  if (parsedState.data.status === 'success') {
    if (version === null || version !== parsedState.data.record.version) {
      return null;
    }
  } else if (version !== null) {
    return null;
  }

  return { state: parsedState.data, version };
};
const unauthorizedRead = (
  reason: 'missing_authority' | 'capability',
): InfrastructureContextFailure => ({ kind: 'forbidden', reason });
export async function resolveInfrastructureContext(
  input: ResolveInfrastructureContextInput,
): Promise<InfrastructureContextResult> {
  if (
    (input.route !== 'index' && input.route !== 'record') ||
    !isObject(input.ports) ||
    !trustedPorts.has(input.ports)
  ) {
    return { kind: 'unavailable', reason: 'ports' };
  }

  const recordId = input.recordId ?? null;
  let rawSession: unknown;
  try {
    rawSession = await input.ports.verifySession(input.request);
  } catch {
    return { kind: 'unavailable', reason: 'dependency' };
  }
  if (rawSession === null || rawSession === undefined) {
    return { kind: 'unauthenticated', reason: 'missing_session' };
  }
  const parsedSession = VerifiedSessionSchema.safeParse(rawSession);
  if (!parsedSession.success) {
    return { kind: 'unauthenticated', reason: 'invalid_session' };
  }
  let rawNow: unknown;
  try {
    rawNow = await input.ports.now();
  } catch {
    return { kind: 'unavailable', reason: 'dependency' };
  }
  if (
    typeof rawNow !== 'number' ||
    !Number.isSafeInteger(rawNow) ||
    rawNow < 0
  ) {
    return { kind: 'unavailable', reason: 'clock' };
  }
  const nowEpochSeconds = rawNow;
  if (nowEpochSeconds >= parsedSession.data.expiresAt) {
    return { kind: 'unauthenticated', reason: 'expired_session' };
  }

  if (recordId !== null && !RequestIdSchema.safeParse(recordId).success) {
    return { kind: 'invalid_record' };
  }
  if (input.route === 'record' && recordId === null) {
    return { kind: 'invalid_record' };
  }
  let rawAuthority: unknown;
  try {
    rawAuthority = await input.ports.resolveAuthority({
      request: input.request,
      session: parsedSession.data,
      route: input.route,
      recordId,
    });
  } catch {
    return { kind: 'unavailable', reason: 'dependency' };
  }
  const parsedAuthority = ServerAuthoritySchema.safeParse(rawAuthority);
  if (!parsedAuthority.success || parsedAuthority.data.actingPartyId === null) {
    return unauthorizedRead('missing_authority');
  }
  const authority: InfrastructureAuthority = Object.freeze({
    actingPartyId: parsedAuthority.data.actingPartyId,
    capabilities: parsedAuthority.data.capabilities,
  });

  let rawCapability: unknown;
  try {
    rawCapability = await input.ports.resolveRouteCapability({
      request: input.request,
      session: parsedSession.data,
      authority,
      route: input.route,
      recordId,
      requiredCapability: INFRASTRUCTURE_READ_CAPABILITY,
    });
  } catch {
    return { kind: 'unavailable', reason: 'dependency' };
  }
  const capabilityGranted =
    rawCapability === true ||
    (isObject(rawCapability) &&
      (rawCapability as { readonly granted?: unknown }).granted === true &&
      (rawCapability as { readonly capability?: unknown }).capability ===
        INFRASTRUCTURE_READ_CAPABILITY);
  if (!capabilityGranted) return unauthorizedRead('capability');

  if (!authority.capabilities.includes(INFRASTRUCTURE_READ_CAPABILITY)) {
    return unauthorizedRead('capability');
  }

  let rawProjection: InfrastructureCanonicalProjection | null;
  try {
    rawProjection = await input.ports.loadCanonicalProjection({
      request: input.request,
      session: parsedSession.data,
      authority,
      route: input.route,
      recordId,
      capability: INFRASTRUCTURE_READ_CAPABILITY,
    });
  } catch {
    return { kind: 'unavailable', reason: 'dependency' };
  }
  if (rawProjection === null) return { kind: 'not_found' };
  const projection = normalizeProjection(rawProjection);
  if (projection === null) return { kind: 'unavailable', reason: 'projection' };

  if (
    projection.state.status === 'success' &&
    recordId !== null &&
    projection.state.record.id !== recordId
  ) {
    return { kind: 'not_found' };
  }
  if (
    input.route === 'record' &&
    (projection.state.status !== 'success' ||
      projection.state.record.id !== recordId)
  ) {
    return { kind: 'not_found' };
  }

  const context: VerifiedInfrastructureContext = Object.freeze({
    route: input.route,
    recordId,
    session: parsedSession.data,
    authority,
    capability: INFRASTRUCTURE_READ_CAPABILITY,
    projection: projection.state,
    version: projection.version,
  });
  verifiedContexts.add(context);
  return { kind: 'authorized', context };
}
