import { describe, expect, it } from 'vitest';

import { parseRestoreFence } from './async-runtime-support';

const openFence = {
  expected_epoch: '7',
  consumer_epoch: '7',
  integrity_verified: true,
  reconciliation_complete: true,
};

describe('canonical restore-fence parser', () => {
  it('normalizes the typed PostgREST row to the application fence contract', () => {
    expect(parseRestoreFence([openFence])).toEqual({
      expectedEpoch: '7',
      consumerEpoch: '7',
      integrityVerified: true,
      reconciliationComplete: true,
    });
    expect(
      parseRestoreFence({
        expectedEpoch: 8,
        consumerEpoch: 8,
        integrityVerified: false,
        reconciliationComplete: false,
      }),
    ).toEqual({
      expectedEpoch: '8',
      consumerEpoch: '8',
      integrityVerified: false,
      reconciliationComplete: false,
    });
  });

  it.each([
    ['empty response', []],
    ['malformed expected epoch', [{ ...openFence, expected_epoch: '0' }]],
    ['malformed consumer epoch', [{ ...openFence, consumer_epoch: 'epoch-7' }]],
    ['missing consumer epoch', [{ ...openFence, consumer_epoch: null }]],
    ['stale consumer epoch', [{ ...openFence, consumer_epoch: '6' }]],
    ['conflicting epoch aliases', [{ ...openFence, expectedEpoch: '8' }]],
    ['missing integrity result', [{ ...openFence, integrity_verified: null }]],
    [
      'malformed reconciliation result',
      [{ ...openFence, reconciliation_complete: 'true' }],
    ],
  ])('rejects %s', (_name, value) => {
    expect(() => parseRestoreFence(value)).toThrow();
  });
});
