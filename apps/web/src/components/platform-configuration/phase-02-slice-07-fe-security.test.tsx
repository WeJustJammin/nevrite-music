import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ActionBar from './ActionBar';
import {
  ChangeActionForm,
  ProposeChangeForm,
  normalizeValidationPath,
} from './platform-configuration-forms';

const ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const error = {
  code: 'VALIDATION_FAILED',
  message: 'Check the highlighted fields.',
  requestId: '018f0c45-73fe-7dc2-9c09-68f7ecf132dc',
  details: {
    violations: [
      {
        path: '/interval/effectiveFrom',
        code: 'invalid_format',
        message: 'Use a valid instant.',
      },
      {
        path: '/typedValue/features/0',
        code: 'invalid_type',
        message: 'The value does not match the definition.',
      },
      {
        path: '/unknown/<img src=x onerror=alert(1)>',
        code: 'invalid',
        message: 'Unknown field.',
      },
    ],
  },
} as const;

describe('P2-S07 FE security boundaries', () => {
  it('[P2-S07-AC-136] maps JSON-pointer violations to allowlisted control ids', () => {
    expect(normalizeValidationPath('/interval/effectiveFrom')).toBe(
      'effectiveFrom',
    );
    expect(normalizeValidationPath('/interval/effectiveTo')).toBe(
      'effectiveTo',
    );
    expect(normalizeValidationPath('/typedValue/features/0')).toBe(
      'typedValue',
    );
    expect(normalizeValidationPath('/scopeId')).toBe('scopeId');
    expect(normalizeValidationPath('/unknown/<img src=x>')).toBeNull();
    expect(normalizeValidationPath('/')).toBeNull();
  });

  it('[P2-S07-AC-136] links summary and inline errors without trusting server paths', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ProposeChangeForm, {
        definitionId: ID,
        expectedVersion: '7',
        csrfToken: 'csrf',
        idempotencyKey: 'configuration-operation',
        error,
      }),
    );

    expect(markup).toContain('href="#effectiveFrom"');
    expect(markup).toContain('id="effectiveFrom-error"');
    expect(markup).toContain(
      'aria-describedby="effectiveFrom-help effectiveFrom-error platform-configuration-validation-summary"',
    );
    expect(markup).toContain('href="#typedValue"');
    expect(markup).toContain('id="typedValue-error"');
    expect(markup).toContain(
      'href="#platform-configuration-validation-summary"',
    );
    expect(markup).not.toContain('href="#unknownimg');
    expect(markup).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('[P2-S07-AC-081] disables every ActionBar control that has no native form or handler', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ActionBar, {
        state: 'idle',
        expectedVersion: '7',
        operationId: 'configuration-operation',
        destructive: 'Rollback candidate',
      }),
    );

    expect(markup.match(/<button\b[^>]*disabled=""/gu)).toHaveLength(3);
  });

  it('[P2-S07-AC-094] keeps server-disabled actions natively unavailable', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ActionBar, {
        state: 'disabled',
        expectedVersion: null,
        operationId: null,
        onPrimary: () => undefined,
        onSecondary: () => undefined,
        destructive: 'Rollback candidate',
        onDestructive: () => undefined,
      }),
    );

    expect(markup.match(/<button\b[^>]*disabled=""/gu)).toHaveLength(3);
  });

  it('[P2-S07-AC-081] associates native actions with their owning forms', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ActionBar, {
        state: 'idle',
        expectedVersion: '7',
        operationId: 'configuration-operation',
        primaryFormId: 'propose-form',
        secondaryFormId: 'review-form',
        destructive: 'Rollback candidate',
        destructiveFormId: 'review-form',
      }),
    );

    expect(markup).toMatch(
      /<button\b[^>]*type="submit"[^>]*form="propose-form"/u,
    );
    expect(markup).toMatch(
      /<button\b[^>]*type="submit"[^>]*form="review-form"/gu,
    );
    expect(markup).not.toContain('disabled=""');
  });

  it('[P2-S07-AC-136] applies the same pointer mapping to review action fields', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ChangeActionForm, {
        reviewId: ID,
        expectedVersion: '7',
        candidateHash: 'a'.repeat(64),
        csrfToken: 'csrf',
        idempotencyKey: 'configuration-operation',
        error: {
          ...error,
          details: {
            violations: [
              {
                path: '/scheduledFor',
                message: 'A schedule instant is required.',
              },
            ],
          },
        },
      }),
    );

    expect(markup).toContain('href="#scheduledFor"');
    expect(markup).toContain('id="scheduledFor-error"');
    expect(markup).toContain('aria-invalid="true"');
  });
});
