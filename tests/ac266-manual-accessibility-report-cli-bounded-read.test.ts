import { describe, expect, it } from 'vitest';

import * as ac266ReportFiles from '../infra/workflows/ac266-manual-accessibility-report-cli-files.ts';

interface ReaderStat {
  readonly size: number;
  readonly mtimeMs: number;
}

interface FakeReportReader {
  readonly stat: () => Promise<ReaderStat>;
  readonly read: (
    buffer: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => Promise<{ readonly bytesRead: number }>;
}

type BoundedReader = (
  handle: FakeReportReader,
  opened: ReaderStat,
  maximumBytes: number,
) => Promise<Buffer>;

const boundedReader = (
  ac266ReportFiles as unknown as {
    readAc266ReportBounded?: BoundedReader;
  }
).readAc266ReportBounded;

describe('AC266 bounded positional report reader', () => {
  it('detects growth after initial stat using at most the cap plus one byte', async () => {
    expect(boundedReader).toBeTypeOf('function');
    if (boundedReader === undefined) return;

    const maximumBytes = 32 * 1024;
    const grownContent = Buffer.alloc(maximumBytes + 257, 0x61);
    const opened = { size: 12, mtimeMs: 1 };
    let maximumBufferLength = 0;
    let maximumRequestedLength = 0;
    const fakeReader: FakeReportReader = {
      stat: async () => ({ size: grownContent.length, mtimeMs: 2 }),
      read: async (buffer, offset, length, position) => {
        maximumBufferLength = Math.max(maximumBufferLength, buffer.length);
        maximumRequestedLength = Math.max(maximumRequestedLength, length);
        const bytesRead = Math.min(length, 512, grownContent.length - position);
        grownContent.copy(buffer, offset, position, position + bytesRead);
        return { bytesRead };
      },
    };

    await expect(
      boundedReader(fakeReader, opened, maximumBytes),
    ).rejects.toThrow(/32 KiB|changed while/u);
    expect(maximumBufferLength).toBe(maximumBytes + 1);
    expect(maximumRequestedLength).toBeLessThanOrEqual(maximumBytes + 1);
  });

  it('assembles short positional reads into the exact original bytes', async () => {
    expect(boundedReader).toBeTypeOf('function');
    if (boundedReader === undefined) return;

    const source = Buffer.from('{"report":"private"}\n', 'utf8');
    const opened = { size: source.length, mtimeMs: 4 };
    const fakeReader: FakeReportReader = {
      stat: async () => opened,
      read: async (buffer, offset, length, position) => {
        const bytesRead = Math.min(length, 3, source.length - position);
        source.copy(buffer, offset, position, position + bytesRead);
        return { bytesRead };
      },
    };

    await expect(boundedReader(fakeReader, opened, 32 * 1024)).resolves.toEqual(
      source,
    );
  });
});
