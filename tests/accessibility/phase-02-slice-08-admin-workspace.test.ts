import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import AdminWorkspaceOperationsWorkbench from '../../apps/web/src/components/platform-configuration/AdminWorkspaceOperationsWorkbench';

const ACTOR_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const TASK_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132da';
const REQUEST_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132db';

const task = {
  id: TASK_ID,
  version: '12',
  state: 'assigned',
  provenance: [
    {
      source: 'platform-configuration',
      evidence: 'task-projection-12',
      at: '2026-09-02T12:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: {
    operationId: 'CFG-05B-01',
    taskId: TASK_ID,
    sourceType: 'platform-configuration',
    sourceId: REQUEST_ID,
    sourceVersion: '12',
    taskClass: 'approval',
    requiredCapability: 'configuration.approver',
    assigneePersonId: ACTOR_ID,
    dueAt: '2026-09-03T12:00:00.000Z',
    severity: 'high',
    freshnessAt: '2026-09-02T12:00:00.000Z',
    freshness: 'healthy',
    state: 'assigned',
    sourceStatus: 'awaiting_approval',
    canAct: true,
  },
} as const;

const props = {
  contractFields: {
    source: '05b-admin-workspace-operations.md',
    fields: {
      Cfg05b01InboxResponse: ['taskId', 'sourceVersion', 'freshness', 'state'],
      Cfg05b04CapabilityActionRequest: [
        'subjectPersonId',
        'capabilityKey',
        'resourceId',
        'actions',
        'startsAt',
        'endsAt',
        'reason',
        'stepUpToken',
      ],
    },
  },
  variant: 'adminStepUp' as const,
  initial: {
    status: 'success' as const,
    data: [task],
    version: '12',
    stale: false,
  },
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  access: 'full' as const,
  query: { states: 'open,assigned' },
  selectedId: TASK_ID,
  expectedVersion: '12',
  csrfToken: 'csrf-s08',
  requestId: REQUEST_ID,
  onCanonicalRefetch: async () => undefined,
};

const render = (overrides: Record<string, unknown> = {}): string =>
  renderToStaticMarkup(
    React.createElement(
      AdminWorkspaceOperationsWorkbench as unknown as React.ComponentType<
        Record<string, unknown>
      >,
      { ...props, ...overrides },
    ),
  );

describe('P2-S08 admin workspace accessibility contract', () => {
  it('[P2-S08-AC-001, P2-S08-AC-002, P2-S08-AC-006, P2-S08-AC-043] names inbox landmarks and exposes URL-addressable native selection', () => {
    const markup = render();

    expect(markup).toContain('data-workbench="admin-workspace-operations"');
    expect(markup).toContain(
      'data-contract-source="05b-admin-workspace-operations.md"',
    );
    expect(markup).toContain('aria-label="Admin task inbox"');
    expect(markup).toContain('aria-label="Task list"');
    expect(markup).toContain('aria-label="Task detail"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    const taskLink = markup.match(
      new RegExp(`<a[^>]+data-task-id="${TASK_ID}"[^>]+href="([^"]+)"`, 'u'),
    );
    expect(taskLink?.[1]).toBeDefined();
    const taskUrl = new URL(
      (taskLink?.[1] ?? '').replaceAll('&amp;', '&'),
      'https://example.test',
    );
    expect(taskUrl.pathname).toBe('/app/platform-configuration-admin');
    expect(taskUrl.searchParams.get('tab')).toBe('inbox');
    expect(taskUrl.searchParams.get('selected')).toBe(TASK_ID);
    expect(taskUrl.searchParams.get('states')).toBe('open,assigned');
  });

  it('[P2-S08-AC-002, P2-S08-AC-010, P2-S08-AC-042] presents auth expiry and dependency failure as recoverable named states', () => {
    const markup = render({
      initial: {
        status: 'error',
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Sign in again to continue.',
          requestId: REQUEST_ID,
        },
        retryable: true,
      },
    });
    expect(markup).toMatch(/role="(?:alert|status)"/u);
    expect(markup).toContain('UNAUTHENTICATED');
    expect(markup).toContain('Sign in again to continue.');
    expect(markup).toContain(REQUEST_ID);
    expect(markup).toMatch(/sign in|retry/iu);
    expect(markup).not.toContain('healthy');

    const unavailable = render({
      initial: {
        status: 'degraded',
        data: null,
        requestId: REQUEST_ID,
        lastVerifiedAt: null,
      },
    });
    expect(unavailable).toContain('unknown');
    expect(unavailable).toContain(REQUEST_ID);
    expect(unavailable).toMatch(/retry|status/iu);
    expect(unavailable).not.toMatch(/0 tasks|no tasks/iu);
  });

  it('[P2-S08-AC-002, P2-S08-AC-003, P2-S08-AC-046] uses text and semantics for stale/partial states and bounded grant forms', () => {
    const stale = render({
      initial: {
        ...props.initial,
        data: [
          {
            ...task,
            projection: {
              ...task.projection,
              freshness: 'stale',
              aggregateFreshness: 'partial',
              partialSources: ['quality-diagnostics'],
            },
          },
        ],
      },
    });
    expect(stale).toContain('data-freshness="stale"');
    expect(stale).toContain('partial');
    expect(stale).toContain('quality-diagnostics');
    expect(stale).not.toMatch(/0 tasks|no tasks/iu);
    expect(stale).not.toMatch(/color|background-color/iu);

    const grant = render({
      ...props,
      initial: {
        ...props.initial,
        data: [
          {
            ...task,
            projection: {
              operationId: 'CFG-05B-04',
              grantId: REQUEST_ID,
              state: 'active',
            },
          },
        ],
      },
    });
    expect(grant).toContain('<form');
    expect(grant).toContain('action="/api/v1/admin/capability-grants/actions"');
    for (const field of [
      'subjectPersonId',
      'capabilityKey',
      'resourceId',
      'actions',
      'startsAt',
      'endsAt',
      'reason',
      'stepUpToken',
    ]) {
      expect(grant).toContain(`for="${field}"`);
      expect(grant).toContain(`name="${field}"`);
    }
    expect(grant).toContain('Grant capability');
    expect(grant).toContain('Revoke capability');
    expect(grant).toContain('name="csrf"');
    expect(grant).toContain('name="expectedVersion"');
  });

  it('[P2-S08-AC-001, P2-S08-AC-004] keeps hidden and deferred operations absent from server HTML', () => {
    const hidden = render({
      access: 'not-rendered',
      variant: 'forbiddenHidden',
    });
    expect(hidden).not.toContain('Admin task inbox');
    expect(hidden).not.toContain('Grant capability');
    expect(hidden).not.toContain('Revoke capability');
    expect(hidden).not.toContain(TASK_ID);

    const deferred = render();
    expect(deferred).not.toContain('CFG-05B-02');
    expect(deferred).not.toContain('CFG-05B-03');
    expect(deferred).not.toMatch(/global search|bulk operation/iu);
  });
});
