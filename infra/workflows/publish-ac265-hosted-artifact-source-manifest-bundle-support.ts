import { createPublicKey } from 'node:crypto';
import { lstatSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import {
  AC265_PUBLICATION_FAILURE,
  type Ac265PublicationEnv,
} from './publish-ac265-hosted-artifact-source-manifest-context.ts';

export const MAX_BUNDLE_BASE64_BYTES = 400_000;
export const MAX_BUNDLE_BYTES = 256 * 1024;
const MAX_DEPTH = 24;
const MAX_KEYS = 512;
const MAX_ARRAY = 256;
const MAX_STRING = 32 * 1024;
const BASE64 =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

const fail = (): never => {
  throw new Error(AC265_PUBLICATION_FAILURE);
};
export const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
export const requireRecord = (value: unknown): Record<string, unknown> =>
  record(value) ? value : fail();
export const allowed = (
  value: Record<string, unknown>,
  keys: readonly string[],
): void => {
  const permitted = new Set(keys);
  if (
    Object.keys(value).some(
      (key) =>
        !permitted.has(key) ||
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype',
    )
  )
    return fail();
};
export const strictString = (value: unknown, max = MAX_STRING): string => {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > max ||
    value.includes('\0')
  )
    return fail();
  return value;
};
export const walkBounds = (value: unknown, depth = 0): void => {
  if (depth > MAX_DEPTH) return fail();
  if (typeof value === 'string') {
    strictString(value);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY) return fail();
    value.forEach((entry) => walkBounds(entry, depth + 1));
    return;
  }
  if (!record(value)) return;
  if (Object.getPrototypeOf(value) !== Object.prototype) return fail();
  const keys = Object.keys(value);
  if (keys.length > MAX_KEYS) return fail();
  keys.forEach((key) => {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype')
      return fail();
    walkBounds(value[key], depth + 1);
  });
};
export const decodeBase64 = (value: unknown, maxBytes: number): Uint8Array => {
  const encoded = strictString(value, MAX_BUNDLE_BASE64_BYTES);
  if (encoded.length % 4 !== 0 || !BASE64.test(encoded)) return fail();
  const decoded = Buffer.from(encoded, 'base64');
  if (
    decoded.byteLength === 0 ||
    decoded.byteLength > maxBytes ||
    decoded.toString('base64') !== encoded
  )
    return fail();
  return decoded;
};
export const safeDigest = (value: unknown): string => {
  const digest = strictString(value, 80);
  if (!/^(?:sha256:)?[a-f0-9]{64}$/u.test(digest)) return fail();
  return digest;
};
const safePath = (value: unknown): string => {
  const path = strictString(value);
  if (!path.startsWith('/') || path.includes('/../') || path.endsWith('/..'))
    return fail();
  return path;
};
const contained = (root: string, candidate: string): boolean => {
  const value = relative(root, candidate);
  return value !== '' && value !== '..' && !value.startsWith('../');
};
const validatePublicPem = (value: unknown): void => {
  const pem = strictString(value, 8_192);
  if (/PRIVATE KEY/u.test(pem)) return fail();
  try {
    if (createPublicKey(pem).asymmetricKeyType !== 'ed25519') return fail();
  } catch {
    return fail();
  }
};
export const validateArchiveEnvelope = (
  value: unknown,
): Record<string, unknown> => {
  const archive = requireRecord(value);
  allowed(archive, [
    'selector',
    'expectedBytes',
    'expectedSha256',
    'allowedMembers',
    'requiredMembers',
    'sources',
  ]);
  if (archive['selector'] !== 'ci' && archive['selector'] !== 'staging')
    return fail();
  if (
    !Number.isSafeInteger(archive['expectedBytes']) ||
    (archive['expectedBytes'] as number) <= 0
  )
    return fail();
  safeDigest(archive['expectedSha256']);
  for (const key of ['allowedMembers', 'requiredMembers'] as const) {
    const members = archive[key];
    if (!Array.isArray(members) || members.length > MAX_ARRAY) return fail();
    members.forEach((member) => strictString(member, 4_096));
  }
  const sources = archive['sources'];
  if (!Array.isArray(sources) || sources.length > MAX_ARRAY) return fail();
  sources.forEach((value) => {
    const source = requireRecord(value);
    allowed(source, ['ref', 'artifactMember', 'attestationMember']);
    strictString(source['ref'], 4_096);
    strictString(source['artifactMember'], 4_096);
    strictString(source['attestationMember'], 4_096);
  });
  return archive;
};
export const archivePath = (
  env: Ac265PublicationEnv,
  selector: 'ci' | 'staging',
): string => {
  const key =
    selector === 'ci'
      ? 'AC265_SOURCE_MANIFEST_CI_SOURCE_DIR'
      : 'AC265_SOURCE_MANIFEST_STAGING_SOURCE_DIR';
  const rawRoot = safePath(env[key]);
  if (lstatSync(rawRoot).isSymbolicLink()) return fail();
  const root = realpathSync(rawRoot);
  if (!statSync(root).isDirectory()) return fail();
  const files = readdirSync(root, { withFileTypes: true }).filter(
    (entry) => entry.isFile() && !entry.isSymbolicLink(),
  );
  if (files.length !== 1) return fail();
  const candidate = realpathSync(join(root, files[0]!.name));
  if (!contained(root, candidate) || !lstatSync(candidate).isFile())
    return fail();
  return candidate;
};
export const normalizeAuthority = (
  value: Record<string, unknown>,
): Record<string, unknown> => {
  allowed(value, [
    'manifestBytesBase64',
    'expected',
    'trustedAuthorityKeys',
    'artifactTrustedKeys',
    'trustedCutoffAt',
  ]);
  const manifestBytes = decodeBase64(value['manifestBytesBase64'], 64 * 1024);
  const expected = requireRecord(value['expected']);
  allowed(expected, [
    'authorityId',
    'authorityKeyId',
    'manifestRef',
    'manifestSha256',
    'authorizationRef',
    'authorization',
    'runId',
    'candidateIdentitySha256',
    'sourceRevision',
    'deploymentId',
    'runnerContractSha256',
  ]);
  const authorization = requireRecord(expected['authorization']);
  allowed(authorization, ['authorizedAt', 'expiresAt']);
  for (const key of ['trustedAuthorityKeys', 'artifactTrustedKeys'] as const) {
    const keys = value[key];
    if (!Array.isArray(keys) || keys.length === 0 || keys.length > 16)
      return fail();
    keys.forEach((entry) => {
      const keyRecord = requireRecord(entry);
      allowed(
        keyRecord,
        key === 'trustedAuthorityKeys'
          ? [
              'authorityId',
              'keyId',
              'publicKeyPem',
              'validFrom',
              'validUntil',
              'status',
            ]
          : ['keyId', 'publicKeyPem', 'validFrom', 'validUntil', 'status'],
      );
      validatePublicPem(keyRecord['publicKeyPem']);
    });
  }
  return {
    expected,
    trustedAuthorityKeys: value['trustedAuthorityKeys'],
    artifactTrustedKeys: value['artifactTrustedKeys'],
    trustedCutoffAt: value['trustedCutoffAt'],
    manifestBytes,
  };
};
