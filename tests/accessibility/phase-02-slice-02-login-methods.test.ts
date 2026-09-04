import { createElement } from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import { LoginMethodManager } from '../../apps/web/src/components/authentication/LoginMethodManager';

const method = {
  id: '55555555-5555-4555-8555-555555555555',
  provider: 'google' as const,
  label: 'Google',
  verifiedAt: '2026-09-01T05:00:00Z',
  lastUsedAt: null,
  removable: true,
};

const renderManager = (
  overrides: Partial<Parameters<typeof LoginMethodManager>[0]> = {},
): string =>
  renderToStaticMarkup(
    createElement(LoginMethodManager, {
      initial: {
        methods: [method],
        recoveryBaselinePresent: true,
        version: '7',
      },
      initialEtag: '"7"',
      initialMerge: null,
      initialMergeEtag: null,
      requestId: '11111111-1111-4111-8111-111111111111',
      returnTo: '/settings/security',
      ...overrides,
    }),
  );

describe('Phase 2 Slice 02 login-method accessibility', () => {
  it('provides named regions and a polite atomic operation announcement', () => {
    const markup = renderManager();
    expect(markup).toContain('aria-labelledby="security-workbench-heading"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain('Connected methods');
    expect(markup).toContain('Duplicate-account recovery');
  });

  it('offers explicit removal only for a server-removable method', () => {
    expect(renderManager()).toContain(
      'aria-label="Remove Google login method"',
    );
    expect(
      renderManager({
        initial: {
          methods: [{ ...method, removable: false }],
          recoveryBaselinePresent: false,
          version: '8',
        },
      }),
    ).not.toContain('Remove Google login method');
  });

  it('offers only reviewed provider controls and no candidate-account search', () => {
    const markup = renderManager().toLowerCase();
    for (const provider of [
      'email',
      'google',
      'apple',
      'facebook',
      'soundcloud',
    ]) {
      expect(markup).toContain(`link ${provider}`);
    }
    expect(markup).not.toMatch(
      /candidate email|search account|auth uuid|provider subject/u,
    );
  });

  it('renders explicit merge acknowledgement before queueing a resolved plan', () => {
    const markup = renderManager({
      initialMerge: {
        mergeId: '66666666-6666-4666-8666-666666666666',
        state: 'awaiting_confirmation',
        expiresAt: '2026-09-02T05:00:00Z',
        conflictPlanVersion: '4',
        jobId: null,
        version: '3',
      },
      initialMergeEtag: '"3"',
    });
    expect(markup).toContain('merge-acknowledgements');
    expect(markup).toContain('Confirm account merge');
    expect(markup).toContain('disabled=""');
  });
});
