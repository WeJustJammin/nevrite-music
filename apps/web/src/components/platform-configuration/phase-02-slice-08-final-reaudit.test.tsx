// @vitest-environment jsdom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import AdminWorkspaceOperationsWorkbench from './AdminWorkspaceOperationsWorkbench';
import FilterBar from './FilterBar';
import { SettingsFlagsRuntimeWorkbenchRuntime } from './SettingsFlagsRuntimeWorkbenchRuntime';
import type { AdminWorkspaceActiveProps } from './admin-workspace-types';
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

const click = (element: Element | null): void => {
  if (element === null) throw new Error('expected interactive element');
  act(() => (element as HTMLElement).click());
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

const runtimeProps = (
  records: readonly PlatformConfigurationRecord[],
  selectedId: string | null,
): SettingsFlagsRuntimeWorkbenchProps => ({
  contractFields: { source: '05a-settings-flags-runtime.md', fields: {} },
  variant: 'adminStepUp',
  initial: { status: 'success', data: records },
  actorId: ACTOR,
  actingPartyId: PARTY,
  access: 'read-only',
  query: { tab: 'settings', key: 'web.theme', view: 'runtime' },
  selectedId,
  expectedVersion: '2',
  csrfToken: 'csrf-final-reaudit',
  requestId: 'request-final-reaudit',
  canonicalUrl: '/app/platform-configuration-admin',
});

const adminProps = (
  access: AdminWorkspaceActiveProps['access'],
): AdminWorkspaceActiveProps => ({
  contractFields: {
    source: '05b-admin-workspace-operations.md',
    fields: {},
  },
  variant: 'adminStepUp',
  initial: {
    status: 'success',
    data: [
      {
        id: RECORD_A,
        version: '12',
        state: 'assigned',
        projection: {
          operationId: 'CFG-05B-04',
          taskId: RECORD_A,
          freshness: 'healthy',
        },
      },
    ],
    version: '12',
  },
  actorId: ACTOR,
  actingPartyId: PARTY,
  access,
  query: { tab: 'capabilities' },
  selectedId: null,
  expectedVersion: '12',
  csrfToken: 'csrf-final-reaudit',
  requestId: 'request-final-reaudit',
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
    '/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime',
  );
  vi.restoreAllMocks();
});

describe('Slice 08 final UI re-audit regressions', () => {
  it('uses one controller history writer and clears selected state on reset', () => {
    window.history.replaceState(
      {},
      '',
      `/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime&selected=${RECORD_A}`,
    );
    const pushState = vi.spyOn(window.history, 'pushState');
    const { container } = mount(
      <SettingsFlagsRuntimeWorkbenchRuntime
        {...runtimeProps(
          [
            settingsRecord(RECORD_A, 'web.theme'),
            settingsRecord(RECORD_B, 'web.locale'),
          ],
          RECORD_A,
        )}
      />,
    );

    click(container.querySelector('button.secondary-action'));

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(new URL(window.location.href).searchParams.get('selected')).toBe(
      null,
    );
    expect(container.textContent).toContain(
      'No selected configuration record is disclosed.',
    );
  });

  it('keeps the progressive reset control hidden in server HTML while noscript remains active', () => {
    const markup = renderToStaticMarkup(
      <FilterBar
        schema={{ query: { type: 'string' } }}
        values={{ query: 'runtime' }}
        resultCount={1}
        resetHref="/app/platform-configuration-admin?tab=settings"
        onReset={() => undefined}
      />,
    );

    expect(markup).toMatch(
      /<button[^>]*class="secondary-action"[^>]*hidden(?:="")?[^>]*>Reset filters<\/button>/u,
    );
    expect(markup).toMatch(
      /<noscript>[\s\S]*href="\/app\/platform-configuration-admin\?tab=settings"[\s\S]*>Reset filters<\/a>[\s\S]*<\/noscript>/u,
    );
  });

  it('explains read-only Capabilities access with a reason, prerequisite, and recovery target', () => {
    const markup = renderToStaticMarkup(
      <AdminWorkspaceOperationsWorkbench {...adminProps('read-only')} />,
    );

    expect(markup).toContain('Access is limited');
    expect(markup).toContain('READ_ONLY_CONTEXT');
    expect(markup).toMatch(/server capability prerequisite|read-only/iu);
    expect(markup).toMatch(
      /href="\/app\/platform-configuration-admin\?tab=capabilities"/u,
    );
    expect(markup).not.toContain('Grant capability');
  });

  it('serializes sort and restores it from browser history', () => {
    window.history.replaceState(
      {},
      '',
      '/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime',
    );
    const { container } = mount(
      <SettingsFlagsRuntimeWorkbenchRuntime
        {...runtimeProps(
          [
            settingsRecord(RECORD_A, 'web.zeta'),
            settingsRecord(RECORD_B, 'web.alpha'),
          ],
          null,
        )}
      />,
    );

    click(
      container.querySelector('button[aria-label="Sort by Configuration key"]'),
    );
    expect(new URL(window.location.href).searchParams.get('sort')).toBe(
      'key_asc',
    );
    expect(container.querySelector('tbody tr')?.textContent).toContain(
      'web.alpha',
    );

    window.history.pushState(
      {},
      '',
      '/app/platform-configuration-admin?tab=settings&key=web.theme&view=runtime&sort=key_desc',
    );
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));

    expect(
      container
        .querySelector('button[aria-label="Sort by Configuration key"]')
        ?.closest('th')
        ?.getAttribute('aria-sort'),
    ).toBe('descending');
    expect(container.querySelector('tbody tr')?.textContent).toContain(
      'web.zeta',
    );
  });
});
