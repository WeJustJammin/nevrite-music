import { TextEncoder } from 'node:util';

import { createPerformanceFixture } from '@wejammin/test-support';
import { describe, expect, it } from 'vitest';

describe('performance test project', () => {
  it('uses a deterministic payload budget instead of wall-clock timing', () => {
    const fixture = createPerformanceFixture();
    const encodedPayload = new TextEncoder().encode(
      JSON.stringify(fixture.payload),
    );

    expect(fixture.requestCount).toBe(1);
    expect(encodedPayload.byteLength).toBeLessThanOrEqual(
      fixture.healthPayloadBudgetBytes,
    );
    expect(fixture.shellResponseBudgetBytes).toBeGreaterThan(
      fixture.healthPayloadBudgetBytes,
    );
  });
});
