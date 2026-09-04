import { ReleaseEnvelopeHeadersSchema } from '@wejammin/contracts';

import type {
  ContentSchemaRegistryError,
  ContentSchemaRegistryResult,
  ReleasePrincipal,
  VerifiedReleaseInput,
} from './types';
import {
  decodeBase64,
  digestHex,
  releaseEvidenceFor,
  releaseSigningBytes,
} from './release-crypto';
import {
  parseReleaseKeyRegistry,
  ReleaseKeyRegistryConfigurationError,
} from './release-registry';

const CLOCK_SKEW_MS = 5 * 60 * 1000;
const HEX_PATTERN = /^[a-f0-9]{64}$/u;

const unavailable = (): ContentSchemaRegistryError => ({
  ok: false,
  status: 503,
  code: 'DEPENDENCY_UNAVAILABLE',
  message: 'The CMS registry dependency is temporarily unavailable.',
  details: { dependencyClass: 'release_verifier', retryable: true },
  retryAfterSeconds: 5,
});

const rejected = (): ContentSchemaRegistryError => ({
  ok: false,
  status: 401,
  code: 'WEBHOOK_REJECTED',
  message: 'The release request could not be authenticated.',
  details: {},
});

export const createReleaseVerifier = (
  registryInput: string | undefined,
  now: () => number = Date.now,
): ((
  input: VerifiedReleaseInput,
  signal: AbortSignal,
) => Promise<ContentSchemaRegistryResult<ReleasePrincipal>>) => {
  const registry = parseReleaseKeyRegistry(registryInput);
  return async (input, signal) => {
    if (registry === null) return unavailable();
    if (signal.aborted) return rejected();
    const headers = ReleaseEnvelopeHeadersSchema.safeParse(input.headers);
    if (!headers.success || !(input.rawBody instanceof Uint8Array))
      return rejected();
    const issuedAt = Date.parse(headers.data.issuedAt);
    const currentTime = now();
    if (
      !Number.isFinite(issuedAt) ||
      !Number.isFinite(currentTime) ||
      Math.abs(currentTime - issuedAt) > CLOCK_SKEW_MS
    )
      return rejected();
    const key = registry.keys.find(
      (candidate) => candidate.keyId === headers.data.keyId,
    );
    if (key === undefined) return rejected();
    const validFrom = Date.parse(key.validFrom);
    const validUntil = Date.parse(key.validUntil);
    const revokedAt =
      key.revokedAt === undefined || key.revokedAt === null
        ? null
        : Date.parse(key.revokedAt);
    if (
      !Number.isFinite(validFrom) ||
      !Number.isFinite(validUntil) ||
      issuedAt < validFrom ||
      issuedAt > validUntil ||
      currentTime < validFrom ||
      currentTime > validUntil ||
      // SQL treats any configured revocation timestamp as fail-closed.  Keep
      // the Worker boundary identical, including timestamps in the future.
      revokedAt !== null
    )
      return rejected();
    try {
      const rawBodyHash = await digestHex(input.rawBody);
      const nonceHash = await digestHex(
        new TextEncoder().encode(headers.data.nonce),
      );
      const signature = decodeBase64(headers.data.signature);
      if (signature === null || signature.byteLength !== 64) return rejected();
      const signatureHash = await digestHex(signature);
      if (
        !HEX_PATTERN.test(rawBodyHash) ||
        !HEX_PATTERN.test(signatureHash) ||
        !HEX_PATTERN.test(nonceHash)
      )
        return rejected();
      const publicKey = decodeBase64(key.publicKey);
      if (publicKey === null || publicKey.byteLength !== 32) return rejected();
      if (signal.aborted) return rejected();
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        publicKey,
        { name: 'Ed25519' },
        false,
        ['verify'],
      );
      const verified = await crypto.subtle.verify(
        { name: 'Ed25519' },
        cryptoKey,
        signature,
        releaseSigningBytes({
          operationId: input.operationId,
          headers: headers.data,
          rawBodyHash,
        }),
      );
      if (!verified || signal.aborted) return rejected();
      return {
        ok: true,
        value: {
          principalId: key.principalId,
          keyId: key.keyId,
          capabilities: key.capabilities,
          verifiedAt: new Date(currentTime).toISOString(),
          rawBodyHash,
          signatureHash,
          nonceHash,
        },
      };
    } catch {
      return rejected();
    }
  };
};

export {
  parseReleaseKeyRegistry,
  ReleaseKeyRegistryConfigurationError,
  releaseEvidenceFor,
  releaseSigningBytes,
};
export type {
  ReleaseKeyRegistry,
  ReleaseKeyRegistryEntry,
} from './release-verifier-types';
export { RELEASE_SIGNATURE_DOMAIN } from './release-verifier-types';
