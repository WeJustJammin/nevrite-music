import { failAc265HostedVerification } from './ac265-hosted-verification-bundle-errors.ts';

const MAX_ARRAY = 4096;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const requireRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : failAc265HostedVerification();

const requireMembers = (
  value: Record<string, unknown>,
  members: readonly string[],
): void => {
  const permitted = new Set(members);
  for (const key of Object.keys(value)) {
    if (
      !permitted.has(key) ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    )
      return failAc265HostedVerification();
  }
};

export interface Ac265HostedVerificationArchiveSource {
  readonly ref: string;
  readonly artifactMember: string;
  readonly attestationMember: string;
}

export interface Ac265HostedVerificationArchive {
  readonly selector: 'ci' | 'staging';
  readonly path: string;
  readonly expectedBytes: number;
  readonly expectedSha256: string;
  readonly allowedMembers: readonly string[];
  readonly requiredMembers: readonly string[];
  readonly sources: readonly Ac265HostedVerificationArchiveSource[];
}

export const parseAc265HostedVerificationArchives = (
  value: unknown,
): readonly Ac265HostedVerificationArchive[] => {
  if (!Array.isArray(value) || value.length === 0 || value.length > 4)
    return failAc265HostedVerification();
  return value.map((entry) => {
    const archive = requireRecord(entry);
    requireMembers(archive, [
      'selector',
      'path',
      'expectedBytes',
      'expectedSha256',
      'allowedMembers',
      'requiredMembers',
      'sources',
    ]);
    if (archive['selector'] !== 'ci' && archive['selector'] !== 'staging')
      return failAc265HostedVerification();
    const path = archive['path'];
    if (
      typeof path !== 'string' ||
      !path.startsWith('/') ||
      path.includes('\0') ||
      path.includes('/../') ||
      path.endsWith('/..')
    )
      return failAc265HostedVerification();
    const expectedBytes = archive['expectedBytes'];
    if (
      typeof expectedBytes !== 'number' ||
      !Number.isSafeInteger(expectedBytes) ||
      expectedBytes <= 0
    )
      return failAc265HostedVerification();
    const expectedSha256 = archive['expectedSha256'];
    if (
      typeof expectedSha256 !== 'string' ||
      !/^(?:sha256:)?[a-f0-9]{64}$/u.test(expectedSha256)
    )
      return failAc265HostedVerification();
    const memberList = (key: 'allowedMembers' | 'requiredMembers') => {
      const list = archive[key];
      if (!Array.isArray(list) || list.length > MAX_ARRAY)
        return failAc265HostedVerification();
      for (const member of list) {
        if (
          typeof member !== 'string' ||
          member.length === 0 ||
          member.length > 4096
        )
          return failAc265HostedVerification();
      }
      return list as readonly string[];
    };
    const sources = archive['sources'];
    if (!Array.isArray(sources) || sources.length === 0 || sources.length > 512)
      return failAc265HostedVerification();
    return Object.freeze({
      selector: archive['selector'],
      path,
      expectedBytes,
      expectedSha256,
      allowedMembers: memberList('allowedMembers'),
      requiredMembers: memberList('requiredMembers'),
      sources: Object.freeze(
        sources.map((sourceEntry) => {
          const source = requireRecord(sourceEntry);
          requireMembers(source, [
            'ref',
            'artifactMember',
            'attestationMember',
          ]);
          for (const field of ['ref', 'artifactMember', 'attestationMember']) {
            const fieldValue = source[field];
            if (
              typeof fieldValue !== 'string' ||
              fieldValue.length === 0 ||
              fieldValue.length > 4096
            )
              return failAc265HostedVerification();
          }
          return Object.freeze({
            ref: source['ref'] as string,
            artifactMember: source['artifactMember'] as string,
            attestationMember: source['attestationMember'] as string,
          });
        }),
      ),
    });
  });
};
