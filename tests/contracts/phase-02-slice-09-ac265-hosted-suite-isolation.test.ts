import { describe, expect, it } from 'vitest';

import defaultConfig from '../../playwright.config.ts';
import { createAc265HostedPlaywrightConfig } from '../e2e/support/ac265-hosted-config.ts';

describe('AC265 hosted browser-suite isolation', () => {
  it('keeps protected hosted specs out of the ordinary local/CI Playwright run', () => {
    const hostedConfig = createAc265HostedPlaywrightConfig(
      'https://staging.wejamm.in',
    );

    expect(defaultConfig.testIgnore).toContain('**/*.ac265-hosted.spec.ts');
    expect(hostedConfig.testMatch).toEqual(['**/*.ac265-hosted.spec.ts']);
    expect(hostedConfig.projects?.[0]?.use).toMatchObject({
      channel: 'chrome',
    });
    expect(hostedConfig.use).toMatchObject({
      trace: 'off',
      screenshot: 'off',
      video: 'off',
    });
    expect(hostedConfig.retries).toBe(0);
    expect(hostedConfig.workers).toBe(1);
    expect(hostedConfig.webServer).toBeUndefined();
  });
});
