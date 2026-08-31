import {
  InfrastructureRouteMetadataSchema,
  RequestIdSchema,
  SafeReturnPathSchema,
} from '@wejammin/contracts';

export type RouteFamily = 'public' | 'app' | 'admin' | 'system';

const containsControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.charCodeAt(0);
    return (
      codePoint <= 0x1f ||
      codePoint === 0x7f ||
      (codePoint >= 0x80 && codePoint <= 0x9f)
    );
  });

export interface RouteAccessInput {
  readonly family: RouteFamily;
  /** Deliberately ignored. Browser role strings are never authority. */
  readonly clientAuthority?: string;
  readonly sessionVerified?: boolean;
  readonly sessionExpired?: boolean;
  readonly actingContextVerified?: boolean;
  readonly capabilityVerified?: boolean;
  readonly stepUpVerified?: boolean;
  readonly auditReasonPresent?: boolean;
}

export interface RouteAccessDecision {
  readonly allowed: boolean;
  readonly authoritySource: 'server';
  readonly projection?: 'public' | 'private' | 'system';
  readonly requiresAudit?: boolean;
  readonly redirect?: '/auth/sign-in';
  readonly disclosure?: 'concealed';
}

export function evaluateRouteAccess(
  input: RouteAccessInput,
): RouteAccessDecision {
  switch (input.family) {
    case 'public':
      return { allowed: true, projection: 'public', authoritySource: 'server' };
    case 'system':
      return { allowed: true, projection: 'system', authoritySource: 'server' };
    case 'app': {
      const sessionValid =
        input.sessionVerified === true && input.sessionExpired === false;
      const allowed =
        sessionValid &&
        input.actingContextVerified === true &&
        input.capabilityVerified === true;

      return {
        allowed,
        authoritySource: 'server',
        ...(allowed ? { projection: 'private' as const } : {}),
        ...(sessionValid ? {} : { redirect: '/auth/sign-in' as const }),
      };
    }
    case 'admin': {
      const sessionValid =
        input.sessionVerified === true && input.sessionExpired === false;
      const allowed =
        sessionValid &&
        input.capabilityVerified === true &&
        input.stepUpVerified === true &&
        input.auditReasonPresent === true;

      return {
        allowed,
        authoritySource: 'server',
        ...(allowed
          ? { projection: 'private' as const, requiresAudit: true }
          : {}),
        ...(sessionValid ? {} : { redirect: '/auth/sign-in' as const }),
      };
    }
  }
}

/** Returns the only safe fallback when a return target is absent or forged. */
export function normalizeSafeReturnPath(
  candidate: string | null | undefined,
  privilegedRoutePredicate?: (path: string) => boolean,
): string {
  if (candidate === undefined || candidate === null) return '/app';

  let decodedCandidate: string;
  try {
    decodedCandidate = decodeURIComponent(candidate);
  } catch {
    return '/app';
  }
  if (
    decodedCandidate.includes('\\') ||
    decodedCandidate.split('/').some((segment) => segment === '..') ||
    containsControlCharacter(decodedCandidate) ||
    /%2e|%2f|%5c/i.test(candidate)
  ) {
    return '/app';
  }

  const parsed = SafeReturnPathSchema.safeParse(candidate);
  if (!parsed.success) return '/app';

  const url = new URL(parsed.data, 'https://wejamm.in');
  const isPrivileged =
    url.pathname === '/app/admin' || url.pathname.startsWith('/app/admin/');
  if (isPrivileged && privilegedRoutePredicate?.(parsed.data) !== true) {
    return '/app';
  }

  return parsed.data;
}

export interface DegradedShellProjectionInput {
  readonly safeShell: string;
  readonly cachedPrivateData: unknown;
}

export interface DegradedShellProjection {
  readonly safeShell: string;
  readonly discardedUnsafeCache: true;
}

export function createDegradedShellProjection(
  input: DegradedShellProjectionInput,
): DegradedShellProjection {
  void input.cachedPrivateData;
  return { safeShell: input.safeShell, discardedUnsafeCache: true };
}

export function infrastructureRouteMetadata(path: string) {
  if (path === '/app/infrastructure') {
    return InfrastructureRouteMetadataSchema.parse({
      pathPattern: '/app/infrastructure',
      authClass: 'authenticated',
      title: 'Infrastructure',
      description:
        'Work with cross-cutting platform foundation using current authority, record state, and provenance.',
      requiredCapability: null,
    });
  }
  if (path === '/app/infrastructure/:recordId') {
    return InfrastructureRouteMetadataSchema.parse({
      pathPattern: '/app/infrastructure/:recordId',
      authClass: 'authenticated',
      title: 'Infrastructure record',
      description:
        'Review the current record, provenance, history, and permitted actions.',
      requiredCapability: null,
    });
  }
  if (path === '/auth/sign-in') {
    return InfrastructureRouteMetadataSchema.parse({
      pathPattern: '/auth/sign-in',
      authClass: 'public',
      title: 'Sign in',
      description: 'Sign in to continue to the requested WeJammin workspace.',
      requiredCapability: null,
    });
  }
  if (path === '/system/degraded') {
    return InfrastructureRouteMetadataSchema.parse({
      pathPattern: '/system/degraded',
      authClass: 'system',
      title: 'Service status',
      description:
        'Review affected scope, last verified time, request ID, and recovery action.',
      requiredCapability: null,
    });
  }
  throw new RangeError(`Unknown infrastructure route: ${path}`);
}

export interface RecordRouteResolution {
  readonly status: 200 | 400 | 404;
  readonly recordId?: string;
}

export function resolveRecordRoute(
  recordId: string,
  authorized: boolean,
): RecordRouteResolution {
  if (!RequestIdSchema.safeParse(recordId).success) return { status: 400 };
  if (!authorized) return { status: 404 };
  return { status: 200, recordId };
}
