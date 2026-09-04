import type {
  AuthenticationResult,
  AuthenticationSession,
} from '../authentication/types';
import { authError } from '../authentication/boundary';

const scopeDenied = (): AuthenticationResult<never> =>
  authError(
    403,
    'FORBIDDEN',
    'The requested configuration context is outside the verified acting context.',
  );

/** Bind user and party selectors to the verified human session. */
export const bindEffectiveQueryScope = (
  query: Readonly<Record<string, unknown>>,
  session: AuthenticationSession,
): AuthenticationResult<Readonly<Record<string, unknown>>> => {
  const partyId = query.partyId;
  if (partyId !== undefined && partyId !== session.actingPartyId)
    return scopeDenied();
  const userId = query.userId;
  if (userId !== undefined && userId !== session.authUserId)
    return scopeDenied();
  return {
    ok: true,
    value: {
      ...query,
      ...(partyId === undefined
        ? {}
        : { partyId: session.actingPartyId as string }),
      ...(userId === undefined ? {} : { userId: session.authUserId }),
    },
  };
};

/** Bind mutation scope identifiers before the persistence port is invoked. */
export const bindMutationScope = (
  body: Readonly<Record<string, unknown>>,
  session: AuthenticationSession,
): AuthenticationResult<Readonly<Record<string, unknown>>> => {
  const scopeType = body.scopeType;
  const scopeId = body.scopeId;
  if (
    scopeType === 'party' &&
    (session.actingPartyId === null || scopeId !== session.actingPartyId)
  )
    return scopeDenied();
  if (scopeType === 'user' && scopeId !== session.authUserId)
    return scopeDenied();
  return {
    ok: true,
    value: {
      ...body,
      ...(scopeType === 'party'
        ? { scopeId: session.actingPartyId as string }
        : {}),
      ...(scopeType === 'user' ? { scopeId: session.authUserId } : {}),
    },
  };
};
