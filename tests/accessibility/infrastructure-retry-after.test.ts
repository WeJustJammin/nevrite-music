import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import RetryAfterCountdown from '../../apps/web/src/components/infrastructure/jobs/RetryAfterCountdown';

describe('Retry-After countdown presentation', () => {
  it('exposes a polite, visible server wait without starting an automatic retry', () => {
    const markup = renderToStaticMarkup(
      React.createElement(RetryAfterCountdown, { retryAfterSeconds: 5 }),
    );

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain('Retry available in 5 seconds.');
    expect(markup).not.toContain('setInterval');
    expect(markup).not.toContain('Retrying automatically');
  });

  it('does not show a negative or client-authoritative wait', () => {
    const markup = renderToStaticMarkup(
      React.createElement(RetryAfterCountdown, { retryAfterSeconds: -1 }),
    );

    expect(markup).toContain('Retry available now.');
    expect(markup).not.toContain('-1');
  });
});
