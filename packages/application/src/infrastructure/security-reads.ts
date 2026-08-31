import {
  ServerAuthoritySchema,
  VerifiedSessionSchema,
  type ServerAuthority,
  type VerifiedSession,
} from '@wejammin/contracts';

type PublicReadInput = Readonly<{
  parsed: boolean;
  projection: string;
  cacheAllowlisted: boolean;
  clientAuthority?: unknown;
}>;

export type PublicReadDecision =
  | Readonly<{
      kind: 'invalid';
      handled: false;
    }>
  | Readonly<{
      kind: 'allowed';
      projection: 'public';
      cachePolicy: 'public_allowlisted';
      authoritySource: 'server';
    }>
  | Readonly<{
      kind: 'denied';
      reason: 'NON_PUBLIC_PROJECTION' | 'CACHE_NOT_ALLOWLISTED';
      disclosureSafe: true;
      authoritySource: 'server';
    }>;

/** Validates public projection/cache policy without caller authority. */
export const evaluatePublicRead = (
  input: PublicReadInput,
): PublicReadDecision => {
  if (!input.parsed) return { kind: 'invalid', handled: false };
  if (input.projection !== 'public') {
    return {
      authoritySource: 'server',
      disclosureSafe: true,
      kind: 'denied',
      reason: 'NON_PUBLIC_PROJECTION',
    };
  }
  if (!input.cacheAllowlisted) {
    return {
      authoritySource: 'server',
      disclosureSafe: true,
      kind: 'denied',
      reason: 'CACHE_NOT_ALLOWLISTED',
    };
  }
  return {
    authoritySource: 'server',
    cachePolicy: 'public_allowlisted',
    kind: 'allowed',
    projection: 'public',
  };
};

type AuthenticatedReadInput = Readonly<{
  session: VerifiedSession;
  authority: ServerAuthority;
  nowEpochSeconds: number;
  requiredCapability: string;
  requestedPartyId?: string;
}>;

type AuthenticatedReadDenialReason =
  'UNAUTHENTICATED' | 'SESSION_EXPIRED' | 'FOREIGN_AUTHORITY' | 'FORBIDDEN';

export type AuthenticatedReadDecision =
  | Readonly<{
      kind: 'allowed';
      cachePolicy: 'no-store';
      rlsRequired: true;
      actingPartyId: string;
      authoritySource: 'server';
    }>
  | Readonly<{
      kind: 'denied';
      reason: AuthenticatedReadDenialReason;
      cachePolicy: 'no-store';
      authoritySource: 'server';
      preservedInput: true;
      telemetry?: Readonly<{ scrubbed: true }>;
    }>;

const invalidAuthenticatedRead = (
  reason: AuthenticatedReadDenialReason,
): AuthenticatedReadDecision => ({
  authoritySource: 'server',
  cachePolicy: 'no-store',
  kind: 'denied',
  preservedInput: true,
  reason,
});

const parseServerAuthority = (authority: ServerAuthority) =>
  ServerAuthoritySchema.safeParse({
    actingPartyId: authority.actingPartyId,
    capabilities: authority.capabilities,
  });

/** Authorizes a read from verified session and server-resolved authority. */
export const evaluateAuthenticatedRead = (
  input: AuthenticatedReadInput,
): AuthenticatedReadDecision => {
  const session = VerifiedSessionSchema.safeParse(input.session);
  if (!session.success) return invalidAuthenticatedRead('UNAUTHENTICATED');
  if (
    !Number.isFinite(input.nowEpochSeconds) ||
    input.nowEpochSeconds >= session.data.expiresAt
  ) {
    return invalidAuthenticatedRead('SESSION_EXPIRED');
  }

  const authority = parseServerAuthority(input.authority);
  if (!authority.success || authority.data.actingPartyId === null) {
    return invalidAuthenticatedRead('FORBIDDEN');
  }
  if (
    input.requestedPartyId !== undefined &&
    input.requestedPartyId !== authority.data.actingPartyId
  ) {
    return {
      authoritySource: 'server',
      cachePolicy: 'no-store',
      kind: 'denied',
      preservedInput: true,
      reason: 'FOREIGN_AUTHORITY',
      telemetry: { scrubbed: true },
    };
  }
  if (!authority.data.capabilities.includes(input.requiredCapability)) {
    return invalidAuthenticatedRead('FORBIDDEN');
  }
  return {
    actingPartyId: authority.data.actingPartyId,
    authoritySource: 'server',
    cachePolicy: 'no-store',
    kind: 'allowed',
    rlsRequired: true,
  };
};
