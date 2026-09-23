import { execFileSync, spawnSync } from 'node:child_process';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  cleanupArchiveFixtures,
  limits,
  readArchive,
  writeArchive,
} from './ac265-hosted-artifact-archive.test-support.ts';

interface RecordedToolCall {
  readonly command: string;
  readonly options: Record<string, unknown> | undefined;
}

const recordedToolCalls = vi.hoisted(() => [] as RecordedToolCall[]);

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  const recordingExecFileSync = (
    command: string,
    args: readonly string[],
    options?: Record<string, unknown>,
  ): unknown => {
    recordedToolCalls.push({ command, options });
    return (
      actual.execFileSync as unknown as (
        command: string,
        args: readonly string[],
        options?: Record<string, unknown>,
      ) => unknown
    )(command, args, options);
  };
  return { ...actual, execFileSync: recordingExecFileSync };
});

const TOOL_TIMEOUT_MS = 10_000;
const SIGTERM_IGNORING_CHILD = 'trap "" TERM; sleep 30';
const SIGTERM_IGNORING_PROBE = [
  "const { execFileSync } = require('node:child_process');",
  'const startedAt = Date.now();',
  'let code = null;',
  'try {',
  '  execFileSync("/bin/bash", ["-c", "trap \'\' TERM; sleep 1"], { timeout: 150 });',
  '} catch (error) {',
  '  code = error.code ?? null;',
  '}',
  'console.log(JSON.stringify({ elapsedMs: Date.now() - startedAt, code }));',
].join('\n');

describe('AC265 hosted artifact archive subprocess timeouts', () => {
  afterEach(cleanupArchiveFixtures);

  it('bounds every archive subprocess with SIGKILL so a timeout cannot be ignored', () => {
    const archive = writeArchive([
      { name: 'candidate/receipt.bin', bytes: Buffer.from('receipt') },
    ]);
    recordedToolCalls.length = 0;
    readArchive(archive.archivePath, {
      allowedMembers: ['candidate/receipt.bin'],
      limits: limits(),
    });

    expect(recordedToolCalls.map((call) => call.command)).toEqual([
      '/usr/bin/zipinfo',
      '/usr/bin/unzip',
      '/usr/bin/unzip',
    ]);
    for (const call of recordedToolCalls) {
      expect(call.options?.timeout).toBe(TOOL_TIMEOUT_MS);
      expect(call.options?.killSignal).toBe('SIGKILL');
    }
  });

  it('hard-bounds a SIGTERM-ignoring child when the kill signal is SIGKILL', () => {
    const startedAt = Date.now();
    let error: { code?: string; signal?: string } | undefined;
    try {
      execFileSync('/bin/bash', ['-c', SIGTERM_IGNORING_CHILD], {
        timeout: 150,
        killSignal: 'SIGKILL',
      });
    } catch (caught) {
      error = caught as { code?: string; signal?: string };
    }

    expect(Date.now() - startedAt).toBeLessThan(5_000);
    expect(error?.code).toBe('ETIMEDOUT');
    expect(error?.signal).toBe('SIGKILL');
  });

  it('documents that a SIGTERM-only timeout returns only after a SIGTERM-ignoring child exits', () => {
    const watchdog = spawnSync(
      process.execPath,
      ['-e', SIGTERM_IGNORING_PROBE],
      {
        encoding: 'utf8',
        timeout: 8_000,
        killSignal: 'SIGKILL',
      },
    );

    expect(watchdog.error).toBeUndefined();
    const probe = JSON.parse(watchdog.stdout) as {
      readonly elapsedMs: number;
      readonly code: string | null;
    };
    expect(probe.code).toBe('ETIMEDOUT');
    expect(probe.elapsedMs).toBeGreaterThanOrEqual(700);
  });
});
