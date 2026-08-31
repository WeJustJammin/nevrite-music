import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import {
  createRequestId,
  InfrastructureRecordSchema,
} from '@wejammin/contracts';
import type { InfrastructureViewState } from '@wejammin/contracts';
import type { InfrastructureRecord } from '@wejammin/ui/infrastructure/presentation';
import { describe, expect, it } from 'vitest';

import ConfirmationStep from '../../apps/web/src/components/infrastructure/ConfirmationStep';
import DataTable from '../../apps/web/src/components/infrastructure/DataTable';
import InfrastructureWorkbench from '../../apps/web/src/components/infrastructure/InfrastructureWorkbench';
import type { InfrastructureWorkbenchIslandProps } from '../../apps/web/src/components/infrastructure/InfrastructureWorkbench';

const REQUEST_ID = createRequestId('11111111-1111-4111-8111-111111111111');
const RECORD_ID = '22222222-2222-4222-8222-222222222222';
const MODIFIED_AT = '2026-08-30T12:00:00.000Z';

const recordFor = (index = 0): InfrastructureRecord =>
  InfrastructureRecordSchema.parse({
    facts: {
      privateNote: 'do-not-render',
      region: 'us-east',
    },
    id:
      index === 0
        ? RECORD_ID
        : `${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`,
    label:
      index === 0
        ? 'Control plane'
        : `Record ${String(index).padStart(3, '0')}`,
    modifiedAt: MODIFIED_AT,
    provenance: [
      {
        label: 'Catalog import',
        recordedAt: MODIFIED_AT,
        sourceType: 'public',
      },
    ],
    summary: 'Canonical infrastructure record summary.',
    version: '"2"',
  });

const record = recordFor();

const apiError = {
  code: 'VALIDATION_FAILED',
  details: {
    violations: [
      { code: 'required', message: 'A label is required.', path: '/label' },
    ],
  },
  message: 'Review the highlighted values.',
  requestId: REQUEST_ID,
} as const;

const successState: InfrastructureViewState = { record, status: 'success' };

const baseProps: Omit<InfrastructureWorkbenchIslandProps, 'initial'> = {
  access: 'full',
  canonicalUrl: '/app/infrastructure',
  expectedVersion: record.version,
  query: { sort: 'label_asc' },
  requestId: REQUEST_ID,
  selectedId: record.id,
  variant: 'appPage',
};

const renderWorkbench = (
  initial: InfrastructureViewState,
  overrides: Partial<Omit<InfrastructureWorkbenchIslandProps, 'initial'>> = {},
): string =>
  renderToStaticMarkup(
    React.createElement(InfrastructureWorkbench, {
      ...baseProps,
      ...overrides,
      initial,
    }),
  );

describe('rendered Slice 02 infrastructure accessibility', () => {
  it('renders a successful workbench with landmarks, labels, table semantics, and disabled protected controls', () => {
    const markup = renderWorkbench(successState);

    expect(markup).toContain(
      '<section class="infra-workbench" data-domain-variant="appPage"',
    );
    expect(markup).toContain(
      'aria-labelledby="infrastructure-workbench-heading"',
    );
    expect(markup).toContain('aria-busy="false"');
    expect(markup).toContain(
      '<section class="infra-record-list" aria-labelledby="records-heading">',
    );
    expect(markup).toContain(
      '<section class="infra-record-detail" aria-labelledby="record-details-heading">',
    );
    expect(markup).toContain(
      '<form class="infra-filter-bar" aria-labelledby="filter-heading">',
    );
    expect(markup).toContain(
      '<label for="infrastructure-query">Search records</label>',
    );
    expect(markup).toContain(
      '<label for="infrastructure-sort">Sort records</label>',
    );
    expect(markup).toContain('<table class="infra-data-table">');
    expect(markup).toContain('<caption>Infrastructure records</caption>');
    expect(markup).toContain('<th scope="col" aria-sort="ascending">');
    expect(markup).toContain(
      'role="status" aria-live="polite" aria-atomic="true"',
    );
    expect(markup).toMatch(
      /<button type="button" disabled="">Review archive<\/button>/,
    );
    expect(markup).toMatch(/id="record-title"[^>]*disabled=""/);
    expect(markup).toMatch(/id="record-upload"[^>]*disabled=""/);
    expect(markup).toContain(
      'Archive is disabled until a server command callback is available.',
    );
  });

  it('renders validation errors as an announced, labelled alert', () => {
    const initial: InfrastructureViewState = {
      error: apiError,
      httpStatus: 422,
      retainedInput: { label: 'Draft label' },
      status: 'validation_error',
    };
    const markup = renderWorkbench(initial);

    expect(markup).toContain('Review the highlighted values.');
    expect(markup).toContain(
      '<section id="validation-summary" class="infra-validation-summary" role="alert"',
    );
    expect(markup).toContain('aria-labelledby="validation-summary-heading"');
    expect(markup).toContain(
      'href="#infrastructure-query">Return to the first filter</a>',
    );
  });

  it('renders conflict and rate-wait states with recovery context in live regions', () => {
    const conflict: InfrastructureViewState = {
      currentVersion: '"3"',
      retainedInput: { label: 'Draft label' },
      status: 'conflict',
    };
    const conflictMarkup = renderWorkbench(conflict);
    expect(conflictMarkup).toContain(
      '<section class="infra-sync-conflict" role="alert"',
    );
    expect(conflictMarkup).toContain('Review current version');
    expect(conflictMarkup).toContain(
      'Server version: <code>&quot;3&quot;</code>',
    );
    expect(conflictMarkup).toContain('Review differences</button>');
    expect(conflictMarkup).toContain('Reapply retained draft</button>');
    expect(conflictMarkup).toContain('Discard draft</button>');

    const rateWait: InfrastructureViewState = {
      retainedInput: { label: 'Draft label' },
      retryAt: '2026-08-30T12:05:00.000Z',
      status: 'rate_wait',
    };
    const rateMarkup = renderWorkbench(rateWait);
    expect(rateMarkup).toContain(
      'The server asked us to wait until 2026-08-30T12:05:00.000Z.',
    );
    expect(rateMarkup).toContain('role="status" aria-live="polite"');
  });

  it('renders degraded data as an explicit offline status with freshness context', () => {
    const initial: InfrastructureViewState = {
      lastKnownGood: { record, verifiedAt: MODIFIED_AT },
      requestId: REQUEST_ID,
      scope: 'infrastructure records',
      status: 'degraded',
    };
    const markup = renderWorkbench(initial);

    expect(markup).toContain(
      '<div class="infra-offline-status" role="status" aria-labelledby="offline-status-heading"',
    );
    expect(markup).toContain('aria-live="polite" aria-atomic="true"');
    expect(markup).toContain('Working offline');
    expect(markup).toContain(`Last verified: <time dateTime="${MODIFIED_AT}">`);
    expect(markup).toContain('Retry canonical read</button>');
  });

  it('does not leak protected labels or fields when access is hidden', () => {
    const markup = renderWorkbench(successState, { access: 'not-rendered' });

    expect(markup).toContain('This view is unavailable');
    expect(markup).not.toContain('Control plane');
    expect(markup).not.toContain('do-not-render');
    expect(markup).not.toContain('Protected command inputs');
    expect(markup).not.toContain('Review archive');
    expect(markup).not.toContain('id="records-heading"');
  });

  it('renders a confirmation step with labelled consequences and disabled commit until step-up', () => {
    const markup = renderToStaticMarkup(
      React.createElement(ConfirmationStep, {
        actingContext: 'Server-selected acting party',
        consequence: 'Archive this infrastructure record',
        expectedVersion: '"2"',
        onCancel: () => {},
        onConfirm: () => {},
        scope: 'Control plane',
        stepUpVerified: false,
      }),
    );

    expect(markup).toContain(
      '<form class="infra-confirmation-step" aria-labelledby="confirmation-heading">',
    );
    expect(markup).toContain('<h3 id="confirmation-heading" tabindex="-1">');
    expect(markup).toContain(
      'Consequence</dt><dd>Archive this infrastructure record',
    );
    expect(markup).toContain('Affected scope</dt><dd>Control plane');
    expect(markup).toContain(
      'Expected version</dt><dd><code>&quot;2&quot;</code>',
    );
    expect(markup).toContain(
      'Acting context</dt><dd>Server-selected acting party',
    );
    expect(markup).toContain(
      'Step-up verification</dt><dd>Required before commit',
    );
    expect(markup).toContain(
      '<label class="infra-checkbox-label" for="confirm-archive">',
    );
    expect(markup).toMatch(
      /<button type="submit" disabled="">Confirm archive<\/button>/,
    );
    expect(markup).toContain(
      'Complete the named step-up verification before committing this action.',
    );
  });

  it('bounds DataTable output to 100 rows while preserving caption and row headers', () => {
    const records = Array.from({ length: 101 }, (_, index) =>
      recordFor(index + 1),
    );
    let sortCalls = 0;
    const markup = renderToStaticMarkup(
      React.createElement(DataTable, {
        hrefForRecord: (recordId: string) =>
          `/app/infrastructure?selected=${recordId}`,
        onSortByLabel: () => {
          sortCalls += 1;
        },
        records,
        selectedId: records[0]?.id ?? null,
        sort: 'label_asc',
      }),
    );

    expect(markup.match(/<tr\b/g)?.length).toBe(101);
    expect(markup).toContain('<caption>Infrastructure records</caption>');
    expect(markup).toContain('Record 100');
    expect(markup).not.toContain('Record 101');
    expect(markup).toContain('Showing the first 100 records.');
    expect(markup).toContain('<th scope="row">');
    expect(sortCalls).toBe(0);
  });
});
