import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  readAc265HostedArtifactArchive,
  type Ac265HostedArtifactArchiveInput,
  type Ac265HostedArtifactArchiveLimits,
} from '../infra/workflows/ac265-hosted-artifact-archive.ts';

const archiveRoots = new Set<string>();

export interface ZipEntry {
  readonly name: string;
  readonly bytes: Buffer;
  readonly mode?: number;
  readonly compressed?: Buffer;
  readonly declaredUncompressedBytes?: number;
}

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const u32 = (value: number): Buffer => {
  const output = Buffer.alloc(4);
  output.writeUInt32LE(value >>> 0);
  return output;
};

const u16 = (value: number): Buffer => {
  const output = Buffer.alloc(2);
  output.writeUInt16LE(value);
  return output;
};

export const zipStoredEntries = (entries: readonly ZipEntry[]): Buffer => {
  const local: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const compressed = entry.compressed ?? entry.bytes;
    const method = entry.compressed === undefined ? 0 : 8;
    const crc = crc32(entry.bytes);
    const declaredUncompressedBytes =
      entry.declaredUncompressedBytes ?? entry.bytes.length;
    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(method),
      u16(0),
      u16(0),
      u32(crc),
      u32(compressed.length),
      u32(declaredUncompressedBytes),
      u16(name.length),
      u16(0),
      name,
      compressed,
    ]);
    local.push(localHeader);
    const externalMode = entry.mode ?? 0o100644;
    central.push(
      Buffer.concat([
        u32(0x02014b50),
        u16((3 << 8) | 30),
        u16(20),
        u16(0),
        u16(method),
        u16(0),
        u16(0),
        u32(crc),
        u32(compressed.length),
        u32(declaredUncompressedBytes),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(externalMode << 16),
        u32(offset),
        name,
      ]),
    );
    offset += localHeader.length;
  }
  const centralBytes = Buffer.concat(central);
  return Buffer.concat([
    ...local,
    centralBytes,
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralBytes.length),
    u32(offset),
    u16(0),
  ]);
};

export const writeArchive = (
  entries: readonly ZipEntry[],
  name = 'artifact.zip',
): { readonly root: string; readonly archivePath: string } => {
  const root = mkdtempSync(join(tmpdir(), 'ac265-archive-test-'));
  archiveRoots.add(root);
  const archivePath = join(root, name);
  writeFileSync(archivePath, zipStoredEntries(entries), { mode: 0o600 });
  return { root, archivePath };
};

export const cleanupArchiveFixtures = (): void => {
  for (const root of archiveRoots)
    rmSync(root, { recursive: true, force: true });
  archiveRoots.clear();
};

export const limits = (
  patch: Partial<Ac265HostedArtifactArchiveLimits> = {},
): Ac265HostedArtifactArchiveLimits => ({
  maxArchiveBytes: 4 * 1024 * 1024,
  maxMembers: 32,
  maxMemberNameBytes: 256,
  maxMemberBytes: 1024 * 1024,
  maxTotalUncompressedBytes: 2 * 1024 * 1024,
  maxCompressionRatio: 100,
  ...patch,
});

export const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

type ArchiveReadOptions = Omit<
  Ac265HostedArtifactArchiveInput,
  'archivePath' | 'expectedArchiveBytes' | 'expectedArchiveSha256'
> &
  Partial<
    Pick<
      Ac265HostedArtifactArchiveInput,
      'expectedArchiveBytes' | 'expectedArchiveSha256'
    >
  >;

export const readArchive = (
  archivePath: string,
  options: ArchiveReadOptions,
) => {
  const archiveBytes = readFileSync(archivePath);
  return readAc265HostedArtifactArchive({
    archivePath,
    expectedArchiveBytes: archiveBytes.length,
    expectedArchiveSha256: sha256(archiveBytes),
    ...options,
  });
};
