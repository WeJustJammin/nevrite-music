export const RELEASE_SIGNATURE_DOMAIN = 'WEJAMMIN' as const;

export const releaseSignatureDomainFor = (
  operationId: 'CMS-03A-05' | 'CMS-03A-08',
): string => `${RELEASE_SIGNATURE_DOMAIN}-${operationId}-RELEASE-V1`;

export type ReleaseKeyRegistryEntry = Readonly<{
  keyId: string;
  principalId: string;
  publicKey: string;
  validFrom: string;
  validUntil: string;
  revokedAt: string | null;
  capabilities: readonly string[];
}>;

export type ReleaseKeyRegistry = Readonly<{
  version: 1;
  keys: readonly ReleaseKeyRegistryEntry[];
}>;
