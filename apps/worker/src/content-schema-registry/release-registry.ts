import {
  CapabilitySchema,
  CmsInstantSchema,
  CmsReleaseKeyIdSchema,
} from '@wejammin/contracts';

import { decodeBase64 } from './release-crypto';
import type {
  ReleaseKeyRegistry,
  ReleaseKeyRegistryEntry,
} from './release-verifier-types';

const MAX_REGISTRY_BYTES = 64 * 1024;
const PUBLIC_KEY_PATTERN = /^[A-Za-z0-9+/]{43}=$/u;
const PRINCIPAL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean => {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
};

export class ReleaseKeyRegistryConfigurationError extends Error {
  constructor(message = 'Invalid release key registry configuration') {
    super(message);
    this.name = 'ReleaseKeyRegistryConfigurationError';
  }
}

export const parseReleaseKeyRegistry = (
  input: string | undefined,
): ReleaseKeyRegistry | null => {
  if (input === undefined || input.trim() === '') return null;
  if (
    input.length > MAX_REGISTRY_BYTES ||
    [...input].some((character) => {
      const codePoint = character.codePointAt(0);
      return (
        codePoint !== undefined && (codePoint <= 0x1f || codePoint === 0x7f)
      );
    })
  )
    throw new ReleaseKeyRegistryConfigurationError();
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new ReleaseKeyRegistryConfigurationError();
  }
  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.keys) ||
    parsed.keys.length < 1 ||
    parsed.keys.length > 32
  )
    throw new ReleaseKeyRegistryConfigurationError();
  const keys: ReleaseKeyRegistryEntry[] = [];
  const ids = new Set<string>();
  for (const candidate of parsed.keys) {
    if (
      !isRecord(candidate) ||
      !hasOnlyKeys(candidate, [
        'keyId',
        'principalId',
        'publicKey',
        'validFrom',
        'validUntil',
        'revokedAt',
        'capabilities',
      ])
    )
      throw new ReleaseKeyRegistryConfigurationError();
    const keyId = candidate.keyId;
    const principalId = candidate.principalId;
    const publicKeyText = candidate.publicKey;
    const validFrom = candidate.validFrom;
    const validUntil = candidate.validUntil;
    const revokedAt = candidate.revokedAt;
    const capabilities = candidate.capabilities;
    if (
      typeof keyId !== 'string' ||
      !CmsReleaseKeyIdSchema.safeParse(keyId).success ||
      typeof principalId !== 'string' ||
      !PRINCIPAL_PATTERN.test(principalId) ||
      typeof publicKeyText !== 'string' ||
      !PUBLIC_KEY_PATTERN.test(publicKeyText) ||
      typeof validFrom !== 'string' ||
      !CmsInstantSchema.safeParse(validFrom).success ||
      typeof validUntil !== 'string' ||
      !CmsInstantSchema.safeParse(validUntil).success ||
      !(
        revokedAt === undefined ||
        revokedAt === null ||
        (typeof revokedAt === 'string' &&
          CmsInstantSchema.safeParse(revokedAt).success)
      ) ||
      !Array.isArray(capabilities) ||
      capabilities.length < 1 ||
      capabilities.length > 8 ||
      capabilities.some(
        (capability) =>
          typeof capability !== 'string' ||
          !CapabilitySchema.safeParse(capability).success,
      ) ||
      ids.has(keyId)
    )
      throw new ReleaseKeyRegistryConfigurationError();
    const from = Date.parse(validFrom);
    const until = Date.parse(validUntil);
    if (!Number.isFinite(from) || !Number.isFinite(until) || until <= from)
      throw new ReleaseKeyRegistryConfigurationError();
    if (
      revokedAt !== undefined &&
      revokedAt !== null &&
      Date.parse(revokedAt) < from
    )
      throw new ReleaseKeyRegistryConfigurationError();
    ids.add(keyId);
    const publicKey = decodeBase64(publicKeyText);
    if (publicKey === null || publicKey.byteLength !== 32)
      throw new ReleaseKeyRegistryConfigurationError();
    keys.push({
      keyId,
      principalId,
      publicKey: publicKeyText,
      validFrom,
      validUntil,
      revokedAt: revokedAt === undefined ? null : revokedAt,
      capabilities: Object.freeze([...capabilities]),
    });
  }
  for (const key of keys) {
    const publicKey = decodeBase64(key.publicKey);
    if (publicKey === null || publicKey.byteLength !== 32)
      throw new ReleaseKeyRegistryConfigurationError();
  }
  return { version: 1, keys: Object.freeze(keys) };
};

export type {
  ReleaseKeyRegistry,
  ReleaseKeyRegistryEntry,
} from './release-verifier-types';
