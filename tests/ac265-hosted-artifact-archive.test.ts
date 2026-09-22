import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  readArchive,
  sha256,
  writeArchive,
  limits,
  cleanupArchiveFixtures,
} from './ac265-hosted-artifact-archive.test-support.ts';

describe('AC265 hosted artifact archive boundary', () => {
  afterEach(cleanupArchiveFixtures);

  it('returns exact archive and member bytes with immutable metadata and no public extraction tree', () => {
    const archive = writeArchive([
      { name: 'candidate/', bytes: Buffer.alloc(0), mode: 0o040755 },
      { name: 'candidate/identity.json', bytes: Buffer.from('{"ok":true}\n') },
      { name: 'candidate/receipt.bin', bytes: Buffer.from([0, 1, 2, 255]) },
    ]);
    const original = readFileSync(archive.archivePath);
    const result = readArchive(archive.archivePath, {
      allowedMembers: [
        'candidate/',
        'candidate/identity.json',
        'candidate/receipt.bin',
      ],
      requiredMembers: [
        'candidate/',
        'candidate/identity.json',
        'candidate/receipt.bin',
      ],
      limits: limits(),
    });

    expect(result.archiveSha256).toBe(sha256(original));
    expect(result.members.map((member) => member.name)).toEqual([
      'candidate/identity.json',
      'candidate/receipt.bin',
    ]);
    expect(result.members.map((member) => member.sha256)).toEqual([
      sha256(Buffer.from('{"ok":true}\n')),
      sha256(Buffer.from([0, 1, 2, 255])),
    ]);
    expect([...result.members[1]!.bytes]).toEqual([0, 1, 2, 255]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.members)).toBe(true);
    expect(result).not.toHaveProperty('extractionRoot');
    const archiveView = result.archiveBytes as Uint8Array;
    archiveView[0] = archiveView[0]! ^ 0xff;
    const memberView = result.members[0]!.bytes as Uint8Array;
    memberView[0] = memberView[0]! ^ 0xff;
    expect(result.archiveBytes).toEqual(original);
    expect(result.members[0]!.bytes).toEqual(Buffer.from('{"ok":true}\n'));
  });

  it('binds the archive content length and SHA-256 digest before trusting ZIP metadata', () => {
    const archive = writeArchive([
      { name: 'candidate/receipt.bin', bytes: Buffer.from('receipt') },
    ]);
    const original = readFileSync(archive.archivePath);
    expect(
      readArchive(archive.archivePath, {
        allowedMembers: ['candidate/receipt.bin'],
        limits: limits(),
        expectedArchiveSha256: `sha256:${sha256(original)}`,
      }).archiveSha256,
    ).toBe(sha256(original));
    for (const patch of [
      { expectedArchiveBytes: original.length - 1 },
      { expectedArchiveSha256: '0'.repeat(64) },
    ]) {
      expect(() =>
        readArchive(archive.archivePath, {
          allowedMembers: ['candidate/receipt.bin'],
          limits: limits(),
          ...patch,
        }),
      ).toThrow(/provenance verification failed/i);
    }
  });

  it('rejects unexpected and missing allowlist members', () => {
    const archive = writeArchive([
      { name: 'candidate/identity.json', bytes: Buffer.from('identity') },
      { name: 'candidate/extra.txt', bytes: Buffer.from('extra') },
    ]);
    expect(() =>
      readArchive(archive.archivePath, {
        allowedMembers: ['candidate/identity.json'],
        limits: limits(),
      }),
    ).toThrow(/provenance verification failed/i);

    const missing = writeArchive([
      { name: 'candidate/identity.json', bytes: Buffer.from('identity') },
    ]);
    expect(() =>
      readArchive(missing.archivePath, {
        allowedMembers: ['candidate/identity.json', 'candidate/receipt.bin'],
        requiredMembers: ['candidate/identity.json', 'candidate/receipt.bin'],
        limits: limits(),
      }),
    ).toThrow(/provenance verification failed/i);
  });

  it('rejects symlink and device entries before extraction', () => {
    for (const mode of [0o120777, 0o060666, 0o010666]) {
      const archive = writeArchive([
        {
          name: 'candidate/special',
          bytes: Buffer.from('target'),
          mode,
        },
      ]);
      expect(() =>
        readArchive(archive.archivePath, {
          allowedMembers: ['candidate/special'],
          limits: limits(),
        }),
      ).toThrow(/provenance verification failed/i);
    }
  });

  it('rejects malformed, truncated, and CRC-invalid archives', () => {
    const valid = writeArchive([
      { name: 'candidate/receipt.bin', bytes: Buffer.from('hello') },
    ]);
    const original = readFileSync(valid.archivePath);
    for (const bytes of [
      original.subarray(0, original.length - 4),
      (() => {
        const copy = Buffer.from(original);
        const centralSignature = copy.indexOf(
          Buffer.from([0x50, 0x4b, 0x01, 0x02]),
        );
        copy[centralSignature] = copy[centralSignature]! ^ 1;
        return copy;
      })(),
      (() => {
        const copy = Buffer.from(original);
        const index = copy.indexOf(Buffer.from('hello'));
        copy[index] = copy[index]! ^ 1;
        return copy;
      })(),
    ]) {
      const archivePath = join(valid.root, `invalid-${bytes.length}.zip`);
      writeFileSync(archivePath, bytes, { mode: 0o600 });
      expect(() =>
        readArchive(archivePath, {
          allowedMembers: ['candidate/receipt.bin'],
          limits: limits(),
        }),
      ).toThrow(/provenance verification failed/i);
    }
  });
});
