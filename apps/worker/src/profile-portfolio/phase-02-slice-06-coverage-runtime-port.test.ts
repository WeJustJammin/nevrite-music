import { afterEach, describe, expect, it, vi } from 'vitest';

import { createProfilePortfolioPortRunner } from './runtime-port';
import {
  PARTY_ID,
  bindings,
  responses,
} from './phase-02-slice-06.test-support';

const context = {
  env: bindings,
  get: (key: string) =>
    key === 'requestId'
      ? '11111111-1111-4111-8111-111111111111'
      : '22222222-2222-4222-8222-222222222222',
} as never;
const request = new Request('https://api.example.test/coverage');
const input = (body: Readonly<Record<string, unknown>>) =>
  ({
    operationId: 'PRF-PROF-04',
    request,
    path: { partyId: PARTY_ID },
    body,
    idempotencyKey: 'pending-key-06',
    ifMatch: '"1"',
    session: { authUserId: 'auth-user-06' },
  }) as never;

afterEach(() => {
  vi.useRealTimers();
});

describe('Phase 2 Slice 06 port runner concurrency and timeout coverage', () => {
  it('coalesces identical pending commands and rejects divergent reuse', async () => {
    let resolvePort: ((value: unknown) => void) | undefined;
    const putEmphasis = vi.fn(
      async () =>
        await new Promise((resolve) => {
          resolvePort = resolve;
        }),
    );
    const run = createProfilePortfolioPortRunner({
      profilePortfolio: { putEmphasis },
    } as never);
    const first = run(
      context,
      'PRF-PROF-04',
      'putEmphasis',
      input({ surface: 'public' }),
    );
    const second = run(
      context,
      'PRF-PROF-04',
      'putEmphasis',
      input({ surface: 'public' }),
    );
    await expect(
      run(
        context,
        'PRF-PROF-04',
        'putEmphasis',
        input({ surface: 'public', changed: true }),
      ),
    ).resolves.toMatchObject({ ok: false, code: 'IDEMPOTENCY_CONFLICT' });

    resolvePort?.({ ok: true, value: responses.emphasis });
    await expect(first).resolves.toMatchObject({ ok: true, status: 200 });
    await expect(second).resolves.toMatchObject({ ok: true, status: 200 });
    expect(putEmphasis).toHaveBeenCalledTimes(1);
  });

  it('aborts a port at the operation deadline', async () => {
    vi.useFakeTimers();
    const putEmphasis = vi.fn(
      async (_input: unknown, _env: unknown, signal: AbortSignal) =>
        await new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(new DOMException('deadline', 'AbortError')),
          );
        }),
    );
    const run = createProfilePortfolioPortRunner({
      profilePortfolio: { putEmphasis },
    } as never);
    const outcome = run(
      context,
      'PRF-PROF-04',
      'putEmphasis',
      input({ surface: 'public' }),
    );
    await vi.runAllTimersAsync();
    await expect(outcome).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('maps unexpected port errors to dependency unavailability', async () => {
    const run = createProfilePortfolioPortRunner({
      profilePortfolio: {
        putEmphasis: vi.fn(async () => {
          throw new Error('unexpected port error');
        }),
      },
    } as never);
    await expect(
      run(context, 'PRF-PROF-04', 'putEmphasis', input({ surface: 'public' })),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const aborted = createProfilePortfolioPortRunner({
      profilePortfolio: {
        putEmphasis: vi.fn(async () => {
          throw new DOMException('aborted', 'AbortError');
        }),
      },
    } as never);
    await expect(
      aborted(
        context,
        'PRF-PROF-04',
        'putEmphasis',
        input({ surface: 'public', abortCase: true }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('fails closed for missing ports and malformed successful responses', async () => {
    const missing = createProfilePortfolioPortRunner({} as never);
    await expect(
      missing(
        context,
        'PRF-PROF-04',
        'putEmphasis',
        input({ surface: 'public' }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });

    const malformed = createProfilePortfolioPortRunner({
      profilePortfolio: {
        putEmphasis: vi.fn(async () => ({
          ok: true,
          value: { unexpected: true },
        })),
      },
    } as never);
    await expect(
      malformed(
        context,
        'PRF-PROF-04',
        'putEmphasis',
        input({ surface: 'public' }),
      ),
    ).resolves.toMatchObject({
      ok: false,
      status: 502,
      code: 'DEPENDENCY_BAD_GATEWAY',
    });
  });
});
