// @vitest-environment jsdom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import AdminWorkspaceInbox from './AdminWorkspaceInbox';
import FilterBar from './FilterBar';
import { SettingsFlagsRuntimeWorkbenchRuntime } from './SettingsFlagsRuntimeWorkbenchRuntime';
import {
  SettingsFlagsRuntimeWorkbenchView,
  type SettingsFlagsRuntimeWorkbenchViewProps,
} from './SettingsFlagsRuntimeWorkbenchView';
import type {
  AdminWorkspaceActiveProps,
  AdminWorkspaceRecord,
} from './admin-workspace-types';
import type {
  PlatformConfigurationRecord,
  SettingsFlagsRuntimeWorkbenchProps,
} from './platform-configuration-workbench-types';

const RECORD_A = '018f0c45-73fe-7dc2-9c09-68f7ecf132da';
const RECORD_B = '018f0c45-73fe-7dc2-9c09-68f7ecf132db';
const ACTOR = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const PARTY = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
const previousActEnvironment = reactActGlobal.IS_REACT_ACT_ENVIRONMENT;
reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;

afterAll(() => {
  if (previousActEnvironment === undefined)
    delete reactActGlobal.IS_REACT_ACT_ENVIRONMENT;
  else reactActGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

type Mounted = Readonly<{ container: HTMLDivElement; root: Root }>;
const mounted: Mounted[] = [];

const mount = (element: React.ReactElement): Mounted => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  const view = { container, root };
  mounted.push(view);
  return view;
};

const settingsRecord = (
  id: string,
  key: string,
): PlatformConfigurationRecord => ({
  id,
  version: '2',
  state: 'effective',
  provenance: [
    {
      source: 'canonical-settings',
      evidence: `definition:${id}`,
      at: '2026-09-02T12:00:00.000Z',
      visibility: 'disclosed',
    },
  ],
  projection: {
    key,
    valueKind: 'short_text',
    typedValue: key,
    sourceScope: 'platform',
    evaluatedAt: '2026-09-02T12:00:00.000Z',
  },
});

const settingsProps = (
  records: readonly PlatformConfigurationRecord[],
  selectedId: string | null,
  filter = '',
): SettingsFlagsRuntimeWorkbenchViewProps => ({
  contractFields: { source: '05a-settings-flags-runtime.md', fields: {} },
  variant: 'adminStepUp',
  access: 'read-only',
  initial: { status: 'success', data: records },
  breakpoint: 'desktop',
  selectedId,
  selectionUrl:
    '/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime',
  filter,
  idempotencyKey: 'settings-reaudit',
  mutationBusy: false,
  statusMessage: '',
  onFilterSubmit: vi.fn(),
  onMutationSubmit: vi.fn() as React.FormEventHandler<HTMLFormElement>,
  onRetry: vi.fn(),
  onSelection: vi.fn(
    () =>
      '/app/platform-configuration-admin?tab=settings&key=web.theme&selected=record-b',
  ),
  actorId: ACTOR,
  actingPartyId: PARTY,
  expectedVersion: '2',
  csrfToken: 'csrf-reaudit',
  requestId: 'request-reaudit',
});

const runtimeProps = (
  records: readonly PlatformConfigurationRecord[],
): SettingsFlagsRuntimeWorkbenchProps => ({
  contractFields: { source: '05a-settings-flags-runtime.md', fields: {} },
  variant: 'adminStepUp',
  initial: { status: 'success', data: records },
  actorId: ACTOR,
  actingPartyId: PARTY,
  access: 'read-only',
  query: { tab: 'settings', key: 'web.theme', view: 'runtime' },
  selectedId: null,
  expectedVersion: '2',
  csrfToken: 'csrf-reaudit',
  requestId: 'request-reaudit',
  canonicalUrl: '/app/platform-configuration-admin',
});

const adminRecord = (operationId?: string): AdminWorkspaceRecord => ({
  id: RECORD_A,
  version: '12',
  state: 'assigned',
  provenance: [],
  projection: {
    ...(operationId === undefined ? {} : { operationId }),
    taskId: RECORD_A,
    taskClass: 'approval',
    freshness: 'healthy',
    sourceVersion: '12',
  },
});

const adminProps = (
  record: AdminWorkspaceRecord,
): AdminWorkspaceActiveProps => ({
  contractFields: {
    source: '05b-admin-workspace-operations.md',
    fields: {},
  },
  variant: 'adminStepUp',
  initial: { status: 'success', data: [record], version: '12' },
  actorId: ACTOR,
  actingPartyId: PARTY,
  access: 'full',
  query: { tab: 'inbox' },
  selectedId: null,
  expectedVersion: '12',
  csrfToken: 'csrf-reaudit',
  requestId: 'request-reaudit',
  canonicalUrl: '/app/platform-configuration-admin',
});

afterEach(() => {
  while (mounted.length > 0) {
    const view = mounted.pop();
    if (view === undefined) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  window.history.replaceState(
    {},
    '',
    '/app/platform-configuration-admin?tab=settings&key=web.theme',
  );
  vi.restoreAllMocks();
});

describe('Slice 08 independent UI re-audit regressions', () => {
  it('keeps settings selection hrefs on the current tab and key context', () => {
    const { container } = mount(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps([settingsRecord(RECORD_A, 'web.theme')], null)}
      />,
    );
    expect(
      container.querySelector('a[href*="selected="]')?.getAttribute('href'),
    ).toBe(
      `/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime&selected=${RECORD_A}`,
    );
  });

  it('keeps native filter GET and reset targets on tab and key context', () => {
    const markup = renderToStaticMarkup(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps([settingsRecord(RECORD_A, 'web.theme')], null)}
      />,
    );
    const form = markup.match(
      /<form class="platform-configuration-filter-bar"[\s\S]*?<\/form>/u,
    )?.[0];
    expect(form).toMatch(/method="get"/u);
    expect(form).toMatch(
      /action="\/app\/platform-configuration-admin\?tab=settings&amp;key=web.theme&amp;view=runtime"/u,
    );
    expect(form).toMatch(/name="tab" value="settings"/u);
    expect(form).toMatch(/name="key" value="web.theme"/u);
    expect(form).toMatch(/name="view" value="runtime"/u);
    expect(markup).toMatch(
      /<noscript>[\s\S]*href="\/app\/platform-configuration-admin\?tab=settings&amp;key=web.theme&amp;view=runtime"[\s\S]*>Reset filters</u,
    );
  });

  it('synchronizes a local filter input after browser popstate', () => {
    window.history.replaceState(
      {},
      '',
      '/app/platform-configuration-admin?tab=settings&key=web.theme&query=old',
    );
    const { container } = mount(
      <FilterBar
        schema={{ query: { type: 'string' } }}
        values={{ query: 'old' }}
        resultCount={1}
        resetHref="/app/platform-configuration-admin?tab=settings&key=web.theme"
      />,
    );
    window.history.pushState(
      {},
      '',
      '/app/platform-configuration-admin?tab=settings&key=web.theme&query=new',
    );
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe(
      'new',
    );
  });

  it('distinguishes a filter miss and offers a reset action', () => {
    const markup = renderToStaticMarkup(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps(
          [settingsRecord(RECORD_A, 'web.theme')],
          RECORD_A,
          'missing',
        )}
      />,
    );
    expect(markup).toMatch(/No records match the current filter/iu);
    expect(markup).toMatch(
      /href="\/app\/platform-configuration-admin\?tab=settings&amp;key=web.theme&amp;view=runtime"/u,
    );
  });

  it('does not disclose the first settings record for an invalid selected id', () => {
    const first = settingsRecord(RECORD_A, 'web.theme');
    const markup = renderToStaticMarkup(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps([first], RECORD_B)}
      />,
    );
    const detail = markup.match(
      /<section class="platform-configuration-record-detail"[\s\S]*?<\/section>/u,
    )?.[0];
    expect(detail).toContain('No selected configuration record is disclosed');
    expect(detail).not.toContain('web.theme');
  });

  it('fails closed when an inbox record has no allowlisted operation id', () => {
    const record = adminRecord();
    const markup = renderToStaticMarkup(
      <AdminWorkspaceInbox props={adminProps(record)} records={[record]} />,
    );
    expect(markup).not.toContain(`data-task-id="${RECORD_A}"`);
  });

  it('declares and exercises an actual combobox Escape target', () => {
    const { container } = mount(
      <FilterBar
        schema={{ query: { type: 'string' } }}
        values={{ query: 'runtime' }}
        resultCount={1}
        resetHref="/app/platform-configuration-admin?tab=settings&key=web.theme"
        escapeBehavior="search"
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input');
    expect(input?.getAttribute('role')).toBeNull();
    expect(input?.getAttribute('aria-haspopup')).toBeNull();
    act(() =>
      input?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      ),
    );
    expect(input?.value).toBe('');
  });

  it('builds runtime settings links with the same context as the controller URL', () => {
    window.history.replaceState(
      {},
      '',
      '/app/platform-configuration-admin?tab=settings&key=web.theme',
    );
    const { container } = mount(
      <SettingsFlagsRuntimeWorkbenchRuntime
        {...runtimeProps([settingsRecord(RECORD_A, 'web.theme')])}
      />,
    );
    expect(
      container.querySelector('a[href*="selected="]')?.getAttribute('href'),
    ).toBe(
      `/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime&selected=${RECORD_A}`,
    );
  });
});
