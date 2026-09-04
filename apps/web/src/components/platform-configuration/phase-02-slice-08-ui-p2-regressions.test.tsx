// @vitest-environment jsdom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import AdminWorkspaceInbox from './AdminWorkspaceInbox';
import AdminWorkspaceOperationsWorkbench from './AdminWorkspaceOperationsWorkbench';
import DataTable from './DataTable';
import { SettingsFlagsRuntimeWorkbenchRuntime } from './SettingsFlagsRuntimeWorkbenchRuntime';
import { SettingsFlagsRuntimeWorkbenchView } from './SettingsFlagsRuntimeWorkbenchView';
import type { AdminWorkspaceActiveProps } from './admin-workspace-types';
import type {
  PlatformConfigurationRecord,
  SettingsFlagsRuntimeWorkbenchProps,
} from './platform-configuration-workbench-types';
import type { SettingsFlagsRuntimeWorkbenchViewProps } from './settings-flags-runtime-view-types';

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

const SETTING_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132da';
const OTHER_SETTING_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132db';
const ACTOR_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';

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
  version: '7',
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

const task = {
  id: SETTING_ID,
  version: '12',
  state: 'assigned',
  provenance: [
    {
      source: 'platform-configuration',
      evidence: `task:${SETTING_ID}`,
      at: '2026-09-02T12:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: {
    operationId: 'CFG-05B-01',
    taskId: SETTING_ID,
    taskClass: 'approval',
    sourceVersion: '12',
    freshness: 'healthy',
    state: 'assigned',
    sourceStatus: 'awaiting_approval',
    assigneePersonId: ACTOR_ID,
  },
} as const;

const adminProps = (
  query: Readonly<Record<string, string>> = { tab: 'inbox' },
): AdminWorkspaceActiveProps => ({
  contractFields: { source: '05b-admin-workspace-operations.md', fields: {} },
  variant: 'adminStepUp',
  initial: { status: 'success', data: [task], version: '12' },
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  access: 'full',
  query,
  selectedId: SETTING_ID,
  expectedVersion: '12',
  csrfToken: 'csrf-ui-p2',
  requestId: 'request-ui-p2',
  canonicalUrl: '/app/platform-configuration-admin',
});

const runtimeProps = (
  query: Readonly<Record<string, string | null | undefined>>,
): SettingsFlagsRuntimeWorkbenchProps => ({
  contractFields: { source: '05a-settings-flags-runtime.md', fields: {} },
  variant: 'adminStepUp',
  initial: {
    status: 'success',
    data: [
      settingsRecord(SETTING_ID, 'web.theme'),
      settingsRecord(OTHER_SETTING_ID, 'web.locale'),
    ],
  },
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  access: 'read-only',
  query,
  selectedId: null,
  expectedVersion: '7',
  csrfToken: 'csrf-ui-p2',
  requestId: 'request-ui-p2',
  canonicalUrl: '/app/platform-configuration-admin',
});

const settingsViewProps = (): SettingsFlagsRuntimeWorkbenchViewProps => ({
  ...runtimeProps({ tab: 'settings', key: 'web.theme' }),
  csrfToken: 'csrf-ui-p2',
  requestId: 'request-ui-p2',
  breakpoint: 'mobile',
  selectedId: SETTING_ID,
  selectionUrl: `/app/platform-configuration-admin?tab=settings&key=web.theme&selected=${SETTING_ID}`,
  filter: '',
  idempotencyKey: 'settings-ui-p2',
  mutationBusy: false,
  statusMessage: '',
  onFilterSubmit: () => undefined,
  onFilterReset: () => undefined,
  onSelection: () => '',
  onMutationSubmit: (event) => event.preventDefault(),
  onRetry: () => undefined,
  sort: null,
  onSort: () => undefined,
});

const parseMarkup = (markup: string): HTMLDivElement => {
  const container = document.createElement('div');
  container.innerHTML = markup;
  return container;
};

afterEach(() => {
  while (mounted.length > 0) {
    const view = mounted.pop();
    if (view === undefined) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  window.history.replaceState({}, '', '/app/platform-configuration-admin');
  vi.restoreAllMocks();
});

describe('Slice 08 independent UI P2 regressions', () => {
  it('keeps settings version and source facts in both responsive DataTable surfaces', () => {
    const host = parseMarkup(
      renderToStaticMarkup(
        <DataTable
          columns={[
            { key: 'key', label: 'Configuration key', priority: 'primary' },
            { key: 'state', label: 'State', priority: 'primary' },
            { key: 'version', label: 'Version', priority: 'secondary' },
            { key: 'source', label: 'Source', priority: 'secondary' },
          ]}
          rows={[
            {
              id: SETTING_ID,
              key: 'web.theme',
              state: 'effective',
              version: '7',
              source: 'canonical-settings',
            },
          ]}
          caption="Settings and flags runtime records"
        />,
      ),
    );

    const table = host.querySelector('table');
    const priority = host.querySelector(
      '.platform-configuration-priority-list',
    );
    expect(
      table?.querySelector('[data-label="Version"]')?.textContent,
    ).toContain('7');
    expect(
      table?.querySelector('[data-label="Source"]')?.textContent,
    ).toContain('canonical-settings');
    expect(priority?.querySelector('dt')?.textContent).toContain('Version');
    expect(priority?.querySelector('dd')?.textContent).toContain('7');
    expect(priority?.textContent).toContain('Source');
    expect(priority?.textContent).toContain('canonical-settings');
  });

  it('preserves inbox pagination, filters, and surrounding URL context on task selection', () => {
    const host = parseMarkup(
      renderToStaticMarkup(
        <AdminWorkspaceInbox
          props={adminProps({
            tab: 'inbox',
            cursor: 'cursor-7',
            limit: '20',
            taskClasses: 'approval,audit',
            states: 'open,assigned',
            staleAfter: 'PT15M',
            key: 'web.theme',
            view: 'provenance',
          })}
          records={[task]}
        />,
      ),
    );
    const link = host.querySelector<HTMLAnchorElement>('a[data-task-id]');
    expect(link).not.toBeNull();
    if (link === null) return;
    const url = new URL(link.getAttribute('href') ?? '', 'https://wejamm.in');
    expect(url.searchParams.get('tab')).toBe('inbox');
    expect(url.searchParams.get('selected')).toBe(SETTING_ID);
    for (const [name, value] of Object.entries({
      cursor: 'cursor-7',
      limit: '20',
      taskClasses: 'approval,audit',
      states: 'open,assigned',
      staleAfter: 'PT15M',
      key: 'web.theme',
      view: 'provenance',
    })) {
      expect(url.searchParams.get(name), `missing ${name}`).toBe(value);
    }
  });

  it('replaces invalid tab and sort URL values with canonical state', () => {
    window.history.replaceState(
      {},
      '',
      '/app/platform-configuration-admin?tab=not-a-tab&key=web.theme&sort=not-a-sort',
    );
    const replaceState = vi.spyOn(window.history, 'replaceState');

    mount(
      <AdminWorkspaceOperationsWorkbench
        {...adminProps({ tab: 'not-a-tab', key: 'web.theme' })}
      />,
    );
    mount(
      <SettingsFlagsRuntimeWorkbenchRuntime
        {...runtimeProps({
          tab: 'settings',
          key: 'web.theme',
          sort: 'not-a-sort',
        })}
      />,
    );

    expect(replaceState).toHaveBeenCalled();
    const lastCall = replaceState.mock.calls.at(-1);
    const nextUrl = new URL(
      String(lastCall?.[2] ?? window.location.href),
      'https://wejamm.in',
    );
    expect(nextUrl.searchParams.get('tab')).toBe('settings');
    expect(nextUrl.searchParams.get('sort')).toBeNull();
    expect(nextUrl.searchParams.get('key')).toBe('web.theme');
  });

  it('exposes truthful persistent Back actions for mobile settings and admin detail', () => {
    const settingsHost = parseMarkup(
      renderToStaticMarkup(
        <SettingsFlagsRuntimeWorkbenchView {...settingsViewProps()} />,
      ),
    );
    const adminHost = parseMarkup(
      renderToStaticMarkup(
        <AdminWorkspaceOperationsWorkbench {...adminProps()} />,
      ),
    );
    const backLink = (host: HTMLDivElement): HTMLAnchorElement | null =>
      [...host.querySelectorAll<HTMLAnchorElement>('a')].find((anchor) =>
        /back/iu.test(
          anchor.textContent ?? anchor.getAttribute('aria-label') ?? '',
        ),
      ) ?? null;

    const settingsBack = backLink(settingsHost);
    const adminBack = backLink(adminHost);
    expect(settingsBack, 'mobile settings detail needs Back').not.toBeNull();
    expect(adminBack, 'admin task detail needs Back').not.toBeNull();
    if (settingsBack === null || adminBack === null) return;
    for (const [link, tab] of [
      [settingsBack, 'settings'],
      [adminBack, 'inbox'],
    ] as const) {
      const url = new URL(link.getAttribute('href') ?? '', 'https://wejamm.in');
      expect(url.searchParams.get('tab')).toBe(tab);
      expect(url.searchParams.get('selected')).toBeNull();
    }
  });
});
