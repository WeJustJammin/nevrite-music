export interface ProtectedRouteInput {
  readonly token: Readonly<{
    subject: string;
    expiresAt: number;
    revokedAt: number | null;
  }>;
  readonly serverContext: Readonly<{
    contextId: string;
    actorId: string;
    capabilities: readonly string[];
    expiresAt: number;
    revokedAt: number | null;
  }>;
  readonly suggestedContextId?: string;
  readonly now: number;
  readonly returnTo: string;
  readonly protectedProps: Readonly<Record<string, unknown>>;
}

export type ProtectedRouteResult =
  | Readonly<{
      ok: true;
      actingContextId: string;
      protectedProps: Readonly<Record<string, unknown>>;
    }>
  | Readonly<{
      ok: false;
      protectedProps: Readonly<Record<string, never>>;
      redirect: string;
    }>;

const isLive = (
  value: Readonly<{ expiresAt: number; revokedAt: number | null }>,
  now: number,
): boolean =>
  Number.isFinite(now) &&
  Number.isFinite(value.expiresAt) &&
  value.expiresAt > now &&
  (value.revokedAt === null || value.revokedAt > now);

/** Server-rendered route guard. The suggested context is intentionally ignored. */
export function verifyProtectedRoute(
  input: ProtectedRouteInput,
): ProtectedRouteResult {
  const capability = input.protectedProps.capability;
  const capabilityAllowed =
    typeof capability !== 'string' ||
    input.serverContext.capabilities.includes(capability);
  const valid =
    input.token.subject.trim() !== '' &&
    input.serverContext.contextId.trim() !== '' &&
    input.serverContext.actorId.trim() !== '' &&
    isLive(input.token, input.now) &&
    isLive(input.serverContext, input.now) &&
    capabilityAllowed;

  if (valid) {
    return {
      ok: true,
      actingContextId: input.serverContext.contextId,
      protectedProps: input.protectedProps,
    };
  }

  return {
    ok: false,
    protectedProps: {},
    redirect: `/auth/sign-in?returnTo=${encodeURIComponent(normalizeReturnTo(input.returnTo))}`,
  };
}

export interface MutationBoundaryInput {
  readonly method: string;
  readonly origin: string | null;
  readonly referer?: string;
  readonly allowedOrigins: readonly string[];
  readonly sessionRef: string;
  readonly csrfToken: string | null;
  readonly expectedCsrfToken: string | null;
  readonly csrfSessionRef?: string;
  readonly cookies: Readonly<{
    secure: boolean;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none';
  }>;
}

export type MutationBoundaryResult =
  Readonly<{ ok: true }> | Readonly<{ ok: false; reason: string }>;

/** Cookie mutation boundary shared by identity forms. Safe methods are rejected. */
export function verifyMutationBoundary(
  input: MutationBoundaryInput,
): MutationBoundaryResult {
  const method = input.method.toUpperCase();
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { ok: false, reason: 'mutation_method_required' };
  }
  if (
    input.origin === null ||
    !input.allowedOrigins.includes(input.origin) ||
    input.sessionRef.trim() === '' ||
    input.csrfToken === null ||
    input.expectedCsrfToken === null ||
    input.csrfToken !== input.expectedCsrfToken ||
    (input.csrfSessionRef !== undefined &&
      input.csrfSessionRef !== input.sessionRef) ||
    !input.cookies.secure ||
    !input.cookies.httpOnly ||
    input.cookies.sameSite === 'none'
  ) {
    return { ok: false, reason: 'csrf_or_origin_invalid' };
  }
  if (input.referer !== undefined) {
    try {
      const refererOrigin = new URL(input.referer).origin;
      if (!input.allowedOrigins.includes(refererOrigin)) {
        return { ok: false, reason: 'referer_origin_invalid' };
      }
    } catch {
      return { ok: false, reason: 'referer_invalid' };
    }
  }
  return { ok: true };
}

export function escapeUntrustedText(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 0x1f || code === 0x7f || (code >= 0x80 && code <= 0x9f);
  });

/** Only relative app routes may become a return target. */
export function normalizeReturnTo(
  candidate: string | null | undefined,
): string {
  if (candidate === null || candidate === undefined || candidate === '') {
    return '/app';
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return '/app';
  }
  if (
    !decoded.startsWith('/app') ||
    decoded.startsWith('//') ||
    decoded.includes('\\') ||
    decoded.split('/').includes('..') ||
    hasControlCharacter(decoded) ||
    /%(?:2e|2f|5c|0d|0a)/iu.test(candidate) ||
    decoded.startsWith('/admin')
  ) {
    return '/app';
  }
  try {
    const parsed = new URL(candidate, 'https://app.wejammin.test');
    if (parsed.origin !== 'https://app.wejammin.test') return '/app';
    if (!parsed.pathname.startsWith('/app')) return '/app';
  } catch {
    return '/app';
  }
  return candidate;
}

export function projectRedactedClientState(
  value: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const projected: Record<string, unknown> = {};
  for (const key of [
    'requestId',
    'status',
    'operationId',
    'version',
  ] as const) {
    const candidate = value[key];
    if (
      typeof candidate === 'string' &&
      candidate.length > 0 &&
      candidate.length <= 160
    ) {
      projected[key] = candidate;
    }
  }
  return projected;
}

export interface UploadPresentationInput {
  readonly serverIntent: Readonly<{
    actorId: string;
    targetId: string;
    type: string;
    size: number;
    checksum: string;
    canonicalObjectKey: string;
  }>;
  readonly clientRequestedKey: string;
  readonly byteState: 'pending' | 'quarantined' | 'ready' | 'rejected';
}

export type UploadPresentation = Readonly<{
  ready: boolean;
  renderable: boolean;
}>;

export function authorizeUploadPresentation(
  input: UploadPresentationInput,
): UploadPresentation {
  const intentValid =
    input.serverIntent.actorId.trim() !== '' &&
    input.serverIntent.targetId.trim() !== '' &&
    input.serverIntent.canonicalObjectKey.trim() !== '' &&
    input.clientRequestedKey === input.serverIntent.canonicalObjectKey;
  const ready = intentValid && input.byteState === 'ready';
  return { ready, renderable: ready };
}
