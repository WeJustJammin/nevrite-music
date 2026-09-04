// @vitest-environment jsdom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import AdminWorkspaceOperationsWorkbench from './AdminWorkspaceOperationsWorkbench';
import FilterBar from './FilterBar';
import {
  SettingsFlagsRuntimeWorkbenchView,
  type SettingsFlagsRuntimeWorkbenchViewProps,
} from './SettingsFlagsRuntimeWorkbenchView';
import type {
  AdminWorkspaceActiveProps,
  AdminWorkspaceRecord,
} from './admin-workspace-types';
import type { PlatformConfigurationRecord } from './platform-configuration-workbench-types';

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

const TASK_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132da';
const SOURCE_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132db';
const ACTOR_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';

const taskRecord: AdminWorkspaceRecord = {
  id: TASK_ID,
  version: '12',
  state: 'assigned',
  provenance: [],
  projection: {
    operationId: 'CFG-05B-01',
    taskId: TASK_ID,
    sourceType: 'platform-configuration',
    sourceId: SOURCE_ID,
    sourceVersion: '12',
    taskClass: 'approval',
    requiredCapability: 'admin.capability.grant',
    assigneePersonId: ACTOR_ID,
    freshnessAt: '2026-09-02T12:00:00.000Z',
    freshness: 'healthy',
    state: 'assigned',
    sourceStatus: 'awaiting_approval',
    canAct: true,
  },
};

const adminProps = (
  overrides: Partial<AdminWorkspaceActiveProps> = {},
): AdminWorkspaceActiveProps => ({
  contractFields: {
    source: '05b-admin-workspace-operations.md',
    fields: {},
  },
  variant: 'adminStepUp',
  initial: { status: 'success', data: [taskRecord], version: '12' },
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  access: 'full',
  query: { tab: 'inbox' },
  selectedId: TASK_ID,
  expectedVersion: '12',
  csrfToken: 'csrf-s08',
  requestId: SOURCE_ID,
  ...overrides,
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

const click = (element: Element | null): void => {
  if (element === null) throw new Error('expected interactive element');
  act(() => (element as HTMLElement).click());
};

const settingsRecord = (
  id: string,
  key: string,
  version: string,
): PlatformConfigurationRecord => ({
  id,
  version,
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
  selectionUrl: '/app/platform-configuration-admin?tab=settings',
  filter,
  idempotencyKey: 'settings-test',
  mutationBusy: false,
  statusMessage: '',
  onFilterSubmit: vi.fn(),
  onMutationSubmit: vi.fn() as React.FormEventHandler<HTMLFormElement>,
  onRetry: vi.fn(),
  onSelection: vi.fn(() => '/app/platform-configuration-admin?tab=settings'),
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  expectedVersion: '2',
  csrfToken: 'csrf-s08',
  requestId: SOURCE_ID,
});

afterEach(() => {
  while (mounted.length > 0) {
    const view = mounted.pop();
    if (view === undefined) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  vi.restoreAllMocks();
});

describe('Phase 2 Slice 08 remediation interactions', () => {
  it('invokes canonical refetch from a degraded Retry control', async () => {
    const onCanonicalRefetch = vi.fn().mockResolvedValue(undefined);
    const { container } = mount(
      <AdminWorkspaceOperationsWorkbench
        {...adminProps({
          initial: {
            status: 'degraded',
            data: null,
            requestId: SOURCE_ID,
            retryable: true,
          },
          access: 'disabled',
          onCanonicalRefetch,
        })}
      />,
    );

    await act(async () => {
      click(container.querySelector('button'));
      await Promise.resolve();
    });
    expect(onCanonicalRefetch).toHaveBeenCalledWith('reconnect');
  });

  it('makes each conflict recovery action meaningful and returns focus to the conflict heading', async () => {
    const onCanonicalRefetch = vi.fn().mockResolvedValue(undefined);
    const { container } = mount(
      <AdminWorkspaceOperationsWorkbench
        {...adminProps({
          initial: {
            status: 'conflict',
            data: [taskRecord],
            version: '13',
            retryable: false,
          },
          onCanonicalRefetch,
        })}
      />,
    );
    const conflict = container.querySelector('[data-state="conflict"]');
    const heading = document.getElementById('admin-workspace-conflict-heading');
    if (conflict === null || heading === null)
      throw new Error('conflict missing');

    for (const [label, reason] of [
      ['Review changes', 'conflict-review'],
      ['Reapply', 'conflict-reapply'],
      ['Discard', 'conflict-discard'],
    ] as const) {
      const button = [...conflict.querySelectorAll('button')].find(
        (candidate) => candidate.textContent === label,
      );
      click(button ?? null);
      expect(onCanonicalRefetch).toHaveBeenCalledWith(reason);
    }
    expect(document.activeElement).toBe(heading);
  });

  it('keeps inbox selection links on the inbox tab', () => {
    const markup = renderToStaticMarkup(
      <AdminWorkspaceOperationsWorkbench {...adminProps()} />,
    );
    expect(markup).toMatch(
      /href="\/app\/platform-configuration-admin\?tab=inbox&amp;selected=/u,
    );
  });

  it('resolves settings detail by selected record instead of the first record', () => {
    const first = settingsRecord('record-a', 'web.theme', '1');
    const selected = settingsRecord('record-b', 'web.locale', '2');
    const markup = renderToStaticMarkup(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps([first, selected], 'record-b')}
      />,
    );
    const detail = markup.match(
      /<section class="platform-configuration-record-detail"[\s\S]*?<\/section>/u,
    )?.[0];
    expect(detail).toContain('web.locale');
    expect(detail).not.toContain('web.theme');
  });

  it('filters settings records before rendering the table and detail', () => {
    const markup = renderToStaticMarkup(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps(
          [
            settingsRecord('record-a', 'web.theme', '1'),
            settingsRecord('record-b', 'web.locale', '2'),
          ],
          'record-a',
          'locale',
        )}
      />,
    );
    expect(markup.match(/<tbody>[\s\S]*?<\/tbody>/u)?.[0]).toContain(
      'web.locale',
    );
    expect(markup.match(/<tbody>[\s\S]*?<\/tbody>/u)?.[0]).not.toContain(
      'web.theme',
    );
    expect(markup).toContain('1 record shown');
  });

  it('sorts settings rows when a supported header is activated', () => {
    const { container } = mount(
      <SettingsFlagsRuntimeWorkbenchView
        {...settingsProps(
          [
            settingsRecord('record-a', 'web.zeta', '1'),
            settingsRecord('record-b', 'web.alpha', '2'),
          ],
          null,
        )}
      />,
    );
    click(
      container.querySelector('button[aria-label="Sort by Configuration key"]'),
    );
    expect(container.querySelector('tbody tr')?.textContent).toContain(
      'web.alpha',
    );
  });

  it('includes a native no-JavaScript reset target', () => {
    const markup = renderToStaticMarkup(
      <FilterBar
        schema={{ query: { type: 'string' } }}
        values={{ query: 'locale' }}
        resultCount={1}
        resetHref="/app/platform-configuration-admin?tab=settings"
      />,
    );
    expect(markup).toMatch(
      /<noscript>[\s\S]*href="\/app\/platform-configuration-admin\?tab=settings"[\s\S]*>Reset filters</u,
    );
  });
});
