import { isCanonicalPaddedBase64 } from '@wejammin/contracts';

import type { ReleasePrincipal, VerifiedReleaseInput } from './types';
import { releaseSignatureDomainFor } from './release-verifier-types';

export const bytesToHex = (bytes: ArrayBuffer): string =>
  [...new Uint8Array(bytes)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');

export const digestHex = async (value: BufferSource): Promise<string> =>
  bytesToHex(await crypto.subtle.digest('SHA-256', value));

export const decodeBase64 = (value: string): Uint8Array | null => {
  if (!isCanonicalPaddedBase64(value)) return null;
  try {
    const decoded = atob(value);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

export const releaseSigningBytes = (input: {
  operationId: VerifiedReleaseInput['operationId'];
  headers: Pick<
    VerifiedReleaseInput['headers'],
    'keyId' | 'issuedAt' | 'nonce'
  > & {
    signature?: string;
  };
  rawBodyHash: string;
}): Uint8Array =>
  new TextEncoder().encode(
    [
      releaseSignatureDomainFor(input.operationId),
      input.headers.keyId,
      input.headers.issuedAt,
      input.headers.nonce,
      input.rawBodyHash,
    ].join('\n'),
  );

export const releaseEvidenceFor = async (
  input: Pick<VerifiedReleaseInput, 'rawBody' | 'headers'>,
): Promise<
  Pick<ReleasePrincipal, 'rawBodyHash' | 'signatureHash' | 'nonceHash'>
> => {
  const signature = decodeBase64(input.headers.signature);
  if (signature === null || signature.byteLength !== 64)
    throw new Error('release signature is not canonical Ed25519 bytes');
  return {
    rawBodyHash: await digestHex(input.rawBody),
    signatureHash: await digestHex(signature),
    nonceHash: await digestHex(new TextEncoder().encode(input.headers.nonce)),
  };
};
