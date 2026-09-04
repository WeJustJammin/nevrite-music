import { CmsInstantSchema } from './contracts';
import type {
  ContentSchemaRegistryError,
  ContentSchemaRegistryOperationId,
  ContentSchemaRegistrySession,
  ReleasePrincipal,
} from './types';
import { UUID_PATTERN } from './admission-common';

export const requireCapability = (
  session: ContentSchemaRegistrySession,
  operationId: ContentSchemaRegistryOperationId,
): ContentSchemaRegistryError | null => {
  const required =
    operationId === 'CMS-03A-06' || operationId === 'CMS-03A-07'
      ? ['cms.schema_registry.read', 'cms.schema_designer']
      : ['cms.schema_designer'];
  return required.some((capability) =>
    session.capabilities.includes(capability),
  )
    ? null
    : {
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        message: 'The required CMS capability is not granted.',
        details: { reasonCode: 'CAPABILITY_REQUIRED' },
      };
};

export const requireReleaseCapability = (
  principal: ReleasePrincipal,
): ContentSchemaRegistryError | null =>
  principal.capabilities.includes('release.block_registry.write')
    ? null
    : {
        ok: false,
        status: 403,
        code: 'FORBIDDEN',
        message: 'The release principal is not allowed for this operation.',
        details: { reasonCode: 'CAPABILITY_REQUIRED' },
      };

export const validHumanSession = (
  session: ContentSchemaRegistrySession,
): ContentSchemaRegistryError | null => {
  const value = session as unknown as Record<string, unknown>;
  const capabilities = value.capabilities;
  const valid =
    typeof value.userId === 'string' &&
    UUID_PATTERN.test(value.userId) &&
    (value.actingPartyId === null ||
      (typeof value.actingPartyId === 'string' &&
        UUID_PATTERN.test(value.actingPartyId))) &&
    Array.isArray(capabilities) &&
    capabilities.every((capability) => typeof capability === 'string') &&
    typeof value.mfaFresh === 'boolean';
  return valid
    ? null
    : {
        ok: false,
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'The authentication context is invalid.',
        details: { recoveryAction: 'reauthenticate' },
      };
};

export const validReleasePrincipal = (
  principal: ReleasePrincipal,
  keyId: string,
): ContentSchemaRegistryError | null => {
  const value = principal as unknown as Record<string, unknown>;
  const capabilities = value.capabilities;
  const valid =
    value.keyId === keyId &&
    typeof value.principalId === 'string' &&
    value.principalId.length > 0 &&
    Array.isArray(capabilities) &&
    capabilities.every((capability) => typeof capability === 'string') &&
    typeof value.verifiedAt === 'string' &&
    CmsInstantSchema.safeParse(value.verifiedAt).success &&
    typeof value.rawBodyHash === 'string' &&
    /^[a-f0-9]{64}$/u.test(value.rawBodyHash) &&
    typeof value.signatureHash === 'string' &&
    /^[a-f0-9]{64}$/u.test(value.signatureHash) &&
    typeof value.nonceHash === 'string' &&
    /^[a-f0-9]{64}$/u.test(value.nonceHash);
  return valid
    ? null
    : {
        ok: false,
        status: 401,
        code: 'WEBHOOK_REJECTED',
        message: 'The signed release webhook was rejected.',
        details: {},
      };
};
