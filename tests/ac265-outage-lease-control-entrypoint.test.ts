import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { runAc265OutageLeaseControl } from '../infra/workflows/run-ac265-outage-lease-control.ts';

const PROJECT_REF = 'abcdefghijklmnopqrst';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_KEY = 'sb_secret_outage_lease_fixture';
const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const TARGET_REF =
  'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001';
const LEASE_REF = 'ac265-lease://staging/76000000-0000-4000-8000-000000000001';
const ACQUIRE_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001';
const CONSUME_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000002';
const RELEASE_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000003';
const ENTRYPOINT_PATH = fileURLToPath(
  new URL(
    '../infra/workflows/run-ac265-outage-lease-control.ts',
    import.meta.url,
  ),
);
const roots: string[] = [];

const sha256Hex = (value: string): string =>
  createHash('sha256').update(Buffer.from(value, 'utf8')).digest('hex');
const LEASE_SHA256 = sha256Hex(LEASE_REF);

const acquireResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-outage-lease-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
  idempotencyRef: ACQUIRE_IDEMPOTENCY_REF,
  leaseRef: LEASE_REF,
  leaseSha256: LEASE_SHA256,
  environment: 'staging',
  state: 'acquired',
  leaseDurationSeconds: 60,
  requestLimit: 1,
  acquiredAt: '2026-09-23T10:00:00.000Z',
  expiresAt: '2026-09-23T10:01:00.000Z',
  redacted: true,
});

const consumeResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-outage-lease-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
  idempotencyRef: CONSUME_IDEMPOTENCY_REF,
  leaseRef: LEASE_REF,
  leaseSha256: LEASE_SHA256,
  environment: 'staging',
  state: 'consumed',
  requestLimit: 1,
  consumedAt: '2026-09-23T10:00:15.000Z',
  redacted: true,
});

const releaseResult = () => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: 'ac265-hosted-outage-lease-control-v1',
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
  idempotencyRef: RELEASE_IDEMPOTENCY_REF,
  leaseRef: LEASE_REF,
  leaseSha256: LEASE_SHA256,
  environment: 'staging',
  state: 'released',
  releasedAt: '2026-09-23T10:00:30.000Z',
  redacted: true,
});

const responseFor = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const harness = (operation: 'acquire' | 'consume' | 'release') => {
  const runnerTemp = mkdtempSync(join(tmpdir(), 'ac265-outage-lease-'));
  roots.push(runnerTemp);
  const summary = join(runnerTemp, 'summary.md');
  writeFileSync(summary, '', { mode: 0o600 });
  const output = join(runnerTemp, 'step-output.txt');
  writeFileSync(output, '', { mode: 0o600 });
  const env: Record<string, string> = {
    RUNNER_TEMP: runnerTemp,
    GITHUB_STEP_SUMMARY: summary,
    GITHUB_OUTPUT: output,
    AC265_OUTAGE_LEASE_OPERATION: operation,
    AC265_AUTHORIZATION_REF: AUTHORIZATION_REF,
    AC265_TARGET_REF: TARGET_REF,
    AC265_IDEMPOTENCY_REF:
      operation === 'acquire'
        ? ACQUIRE_IDEMPOTENCY_REF
        : operation === 'consume'
          ? CONSUME_IDEMPOTENCY_REF
          : RELEASE_IDEMPOTENCY_REF,
    SUPABASE_URL,
    SUPABASE_PROJECT_REF: PROJECT_REF,
    SUPABASE_SECRET_KEY: SERVICE_KEY,
  };
  if (operation !== 'acquire') {
    env['AC265_LEASE_REF'] = LEASE_REF;
    env['AC265_LEASE_SHA256'] = LEASE_SHA256;
  }
  return { runnerTemp, summary, output, env };
};

const recordPath = (runnerTemp: string): string =>
  join(runnerTemp, 'ac265-outage-lease', 'outage-lease-control.json');

afterEach(() => {
  vi.useRealTimers();
  while (roots.length > 0) {
    const root = roots.pop();
    if (root !== undefined) rmSync(root, { recursive: true, force: true });
  }
});

describe('AC265 outage-lease control entrypoint', () => {
  it.each([
    ['acquire', acquireResult()],
    ['consume', consumeResult()],
    ['release', releaseResult()],
  ] as const)(
    'records the redacted %s result and reports it in the summary',
    async (operation, result) => {
      const { runnerTemp, summary, output, env } = harness(operation);
      const fetchImpl = vi.fn<typeof fetch>(async () => responseFor(result));

      const reported = await runAc265OutageLeaseControl({ env, fetchImpl });

      expect(reported).toEqual({
        operation,
        state: result.state,
        leaseRefSha256: LEASE_SHA256,
        environment: 'staging',
        redacted: true,
      });
      const recordBytes = readFileSync(recordPath(runnerTemp), 'utf8');
      expect(JSON.parse(recordBytes)).toEqual(reported);
      // The raw lease reference is a capability: it must never be retained in
      // the uploaded record or the step summary.
      expect(recordBytes).not.toContain(LEASE_REF);
      const streamed = readFileSync(summary, 'utf8');
      expect(streamed).toContain(
        'Local control-plane operation only. Hosted browser acceptance was not run.',
      );
      expect(streamed).toContain(`- Operation: \`${operation}\``);
      expect(streamed).toContain(`- State: \`${result.state}\``);
      expect(streamed).not.toContain(LEASE_REF);
      expect(streamed).toContain(LEASE_SHA256);
      const outputs = readFileSync(output, 'utf8');
      expect(outputs).toContain(`operation=${operation}`);
      expect(outputs).toContain(`state=${result.state}`);
      expect(outputs).toContain(`leaseRef=${LEASE_REF}`);
      expect(outputs).toContain(`leaseSha256=${LEASE_SHA256}`);
      expect(recordBytes).toMatch(/"leaseRefSha256":"[a-f0-9]{64}"/u);
    },
  );

  it.each(['acquire', 'consume', 'release'] as const)(
    'sends exactly one request for %s using the derived request shape',
    async (operation) => {
      const { env } = harness(operation);
      let body: unknown;
      const fetchImpl = vi.fn<typeof fetch>(async (_input, init) => {
        body = JSON.parse(String(init?.body)) as unknown;
        return responseFor(
          operation === 'acquire'
            ? acquireResult()
            : operation === 'consume'
              ? consumeResult()
              : releaseResult(),
        );
      });

      await runAc265OutageLeaseControl({ env, fetchImpl });

      expect(fetchImpl).toHaveBeenCalledOnce();
      const request = (body as { p_request: Record<string, unknown> })
        .p_request;
      expect(request['authorizationRef']).toBe(AUTHORIZATION_REF);
      expect(request['targetRef']).toBe(TARGET_REF);
      expect(request['criterion']).toBe('P2-S09-AC-265');
      if (operation === 'acquire') {
        expect(request['leaseDurationSeconds']).toBe(60);
        expect(request['requestLimit']).toBe(1);
        expect(request['leaseRef']).toBeUndefined();
      } else {
        expect(request['leaseRef']).toBe(LEASE_REF);
        expect(request['leaseSha256']).toBe(LEASE_SHA256);
        expect(request['leaseDurationSeconds']).toBeUndefined();
      }
    },
  );

  it('reports a deliberate refusal as a distinct conflict without writing a record', async () => {
    const { runnerTemp, env } = harness('acquire');
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({ status: 'conflict' }),
    );

    await expect(
      runAc265OutageLeaseControl({ env, fetchImpl }),
    ).rejects.toThrow('AC265 outage lease acquire conflict');
    expect(existsSync(recordPath(runnerTemp))).toBe(false);
  });

  it('fails generically and writes no record for malformed transport results', async () => {
    const { runnerTemp, env } = harness('acquire');
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor({ ...acquireResult(), leaseSha256: 'f'.repeat(64) }),
    );

    await expect(
      runAc265OutageLeaseControl({ env, fetchImpl }),
    ).rejects.toThrow('AC265 outage lease control failed');
    expect(existsSync(recordPath(runnerTemp))).toBe(false);
  });

  it('refuses an unsupported operation, a non-target reference, and a missing lease binding', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(acquireResult()),
    );
    const cases = [
      { ...harness('acquire').env, AC265_OUTAGE_LEASE_OPERATION: 'expire' },
      { ...harness('acquire').env, AC265_TARGET_REF: AUTHORIZATION_REF },
      { ...harness('consume').env, AC265_LEASE_REF: undefined },
      { ...harness('release').env, AC265_LEASE_SHA256: 'f'.repeat(64) },
      { ...harness('acquire').env, AC265_IDEMPOTENCY_REF: 'not a reference' },
    ];
    for (const env of cases)
      await expect(
        runAc265OutageLeaseControl({
          env: env as Readonly<Record<string, string | undefined>>,
          fetchImpl,
        }),
      ).rejects.toThrow('AC265 outage lease control failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('never exposes the service key through the record, summary, or errors', async () => {
    const { runnerTemp, summary, env } = harness('acquire');
    const secret = 'sb_secret_sensitive_outage_lease_key';
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`upstream body contains ${secret}`);
    });

    const thrown = await runAc265OutageLeaseControl({
      env: { ...env, SUPABASE_SECRET_KEY: secret },
      fetchImpl,
    }).catch((error: unknown) => error);

    expect((thrown as Error).message).toBe('AC265 outage lease control failed');
    expect(String(thrown)).not.toContain(secret);
    expect(readFileSync(summary, 'utf8')).not.toContain(secret);
    expect(existsSync(recordPath(runnerTemp))).toBe(false);
  });

  it('rejects a summary or output path that escapes the runner temp boundary', async () => {
    const { env } = harness('acquire');
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(acquireResult()),
    );

    for (const summaryPath of [
      '/etc/passwd',
      '../escape.md',
      env['RUNNER_TEMP'] + '/sub/../x.md',
    ])
      await expect(
        runAc265OutageLeaseControl({
          env: { ...env, GITHUB_STEP_SUMMARY: summaryPath },
          fetchImpl,
        }),
      ).rejects.toThrow('AC265 outage lease control failed');

    const linkParent = mkdtempSync(join(tmpdir(), 'ac265-lease-link-'));
    roots.push(linkParent);
    const escaped = join(linkParent, 'escaped.md');
    writeFileSync(escaped, '', { mode: 0o600 });
    const link = join(linkParent, 'link.md');
    symlinkSync(escaped, link);
    expect(lstatSync(link).isSymbolicLink()).toBe(true);
    await expect(
      runAc265OutageLeaseControl({
        env: { ...env, GITHUB_STEP_SUMMARY: link },
        fetchImpl,
      }),
    ).rejects.toThrow('AC265 outage lease control failed');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('validates the step-output path before contacting the control plane', async () => {
    const { env } = harness('acquire');
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(acquireResult()),
    );

    for (const output of [
      undefined,
      '',
      '/tmp/outside-output.txt',
      '../escape.txt',
    ])
      await expect(
        runAc265OutageLeaseControl({
          env: { ...env, GITHUB_OUTPUT: output } as Readonly<
            Record<string, string | undefined>
          >,
          fetchImpl,
        }),
      ).rejects.toThrow('AC265 outage lease control failed');

    // A missing or unsafe step-output file must fail before any lease exists.
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('emits exactly one record file inside the private output directory', async () => {
    const { runnerTemp, env } = harness('consume');
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      responseFor(consumeResult()),
    );

    await runAc265OutageLeaseControl({ env, fetchImpl });

    expect(readdirSync(join(runnerTemp, 'ac265-outage-lease'))).toEqual([
      'outage-lease-control.json',
    ]);
  });

  it('fails closed as a direct CLI when the environment is incomplete', () => {
    const result = spawnSync(process.execPath, [ENTRYPOINT_PATH], {
      encoding: 'utf8',
      env: { PATH: process.env['PATH'] ?? '' },
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
    expect(result.stderr.trim()).toBe('AC265 outage lease control failed');
  });
});
