import { readFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

import { afterEach, describe, expect, it } from 'vitest';

import type { Ac265HostedArtifactArchiveLimits } from '../infra/workflows/ac265-hosted-artifact-archive.ts';
import { validateAc265HostedArtifactArchiveDownloadMetadata } from '../infra/workflows/ac265-hosted-artifact-archive-policy.ts';
import {
  cleanupArchiveFixtures,
  limits,
  readArchive,
  writeArchive,
} from './ac265-hosted-artifact-archive.test-support.ts';

describe('AC265 hosted artifact archive policy boundary', () => {
  afterEach(cleanupArchiveFixtures);

  it('requires the exact GitHub archive origin, ZIP content type, no redirect, and bounded length', () => {
    const valid = {
      url: 'https://api.github.com/repos/WeJustJammin/wejammin/actions/artifacts/123/zip',
      expectedPath: '/repos/WeJustJammin/wejammin/actions/artifacts/123/zip',
      status: 200,
      redirected: false,
      contentType: 'application/zip',
      contentLength: '123',
    } as const;
    expect(() =>
      validateAc265HostedArtifactArchiveDownloadMetadata({
        metadata: valid,
        maxArchiveBytes: 123,
      }),
    ).not.toThrow();
    for (const patch of [
      { url: valid.url.replace('api.github.com', 'evil.example') },
      { url: valid.url.replace('https://', 'https://user:password@') },
      { url: valid.url.replace('https://', 'https://@') },
      { url: `${valid.url}?download=1` },
      { expectedPath: '/repos/evil/repo/actions/artifacts/123/zip' },
      { status: 302 },
      { redirected: true },
      { contentType: 'application/octet-stream' },
      { contentLength: '124' },
      { contentLength: 'not-a-length' },
    ]) {
      expect(() =>
        validateAc265HostedArtifactArchiveDownloadMetadata({
          metadata: { ...valid, ...patch },
          maxArchiveBytes: 123,
        }),
      ).toThrow(/provenance verification failed/i);
    }
  });

  it('rejects traversal, absolute, backslash, and control-character names', () => {
    for (const name of [
      '../outside.txt',
      '/absolute.txt',
      'C:/absolute.txt',
      'candidate\\outside.txt',
      'candidate/../outside.txt',
      'candidate/./outside.txt',
      'candidate/with\u0000nul.txt',
      'candidate/*.txt',
    ]) {
      const archive = writeArchive([{ name, bytes: Buffer.from('bad') }]);
      expect(() =>
        readArchive(archive.archivePath, {
          allowedMembers: [name],
          limits: limits(),
        }),
      ).toThrow(/provenance verification failed/i);
    }
  });

  it('rejects duplicate, case-colliding, and prefix-conflicting member names', () => {
    for (const entries of [
      [
        { name: 'candidate/a.txt', bytes: Buffer.from('a') },
        { name: 'candidate/a.txt', bytes: Buffer.from('b') },
      ],
      [
        { name: 'candidate/a.txt', bytes: Buffer.from('a') },
        { name: 'candidate/A.txt', bytes: Buffer.from('b') },
      ],
      [
        { name: 'candidate', bytes: Buffer.from('a') },
        { name: 'candidate/a.txt', bytes: Buffer.from('b') },
      ],
      [
        { name: 'candidate/a.txt', bytes: Buffer.from('b') },
        { name: 'candidate', bytes: Buffer.from('a') },
      ],
      [
        { name: 'Candidate', bytes: Buffer.from('a') },
        { name: 'candidate/a.txt', bytes: Buffer.from('b') },
      ],
    ] as const) {
      const archive = writeArchive(entries);
      expect(() =>
        readArchive(archive.archivePath, {
          allowedMembers: entries.map((entry) => entry.name),
          limits: limits(),
        }),
      ).toThrow(/provenance verification failed/i);
    }
  });

  it('enforces archive, member, aggregate, member-count, and compression-ratio limits', () => {
    const compressed = deflateRawSync(Buffer.alloc(10_000));
    const archive = writeArchive([
      {
        name: 'candidate/zeros.bin',
        bytes: Buffer.alloc(10_000),
        compressed,
      },
    ]);
    const reject = (patch: Partial<Ac265HostedArtifactArchiveLimits>) =>
      expect(() =>
        readArchive(archive.archivePath, {
          allowedMembers: ['candidate/zeros.bin'],
          limits: limits(patch),
        }),
      ).toThrow(/provenance verification failed/i);

    reject({ maxArchiveBytes: originalArchiveSize(archive.archivePath) - 1 });
    reject({ maxMemberBytes: 9_999 });
    reject({ maxTotalUncompressedBytes: 9_999 });
    reject({ maxCompressionRatio: 2 });

    const lying = writeArchive([
      {
        name: 'candidate/lying.bin',
        bytes: Buffer.alloc(10_000),
        compressed: deflateRawSync(Buffer.alloc(10_000)),
        declaredUncompressedBytes: 1,
      },
    ]);
    expect(() =>
      readArchive(lying.archivePath, {
        allowedMembers: ['candidate/lying.bin'],
        limits: limits({
          maxMemberBytes: 1,
          maxTotalUncompressedBytes: 1,
        }),
      }),
    ).toThrow(/provenance verification failed/i);

    const many = writeArchive([
      { name: 'candidate/one.bin', bytes: Buffer.from('one') },
      { name: 'candidate/two.bin', bytes: Buffer.from('two') },
    ]);
    expect(() =>
      readArchive(many.archivePath, {
        allowedMembers: ['candidate/one.bin', 'candidate/two.bin'],
        limits: limits({ maxMembers: 1 }),
      }),
    ).toThrow(/provenance verification failed/i);
  });
});

const originalArchiveSize = (path: string): number => readFileSync(path).length;
