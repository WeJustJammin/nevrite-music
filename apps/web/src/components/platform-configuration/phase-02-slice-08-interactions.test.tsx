// @vitest-environment jsdom

import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import AdminWorkspaceOperationsWorkbench from './AdminWorkspaceOperationsWorkbench';

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

const Workbench =
  AdminWorkspaceOperationsWorkbench as unknown as React.ComponentType<
    Record<string, unknown>
  >;

type Mounted = Readonly<{ container: HTMLDivElement; root: Root }>;
const mounted: Mounted[] = [];

const mount = (overrides: Record<string, unknown> = {}): Mounted => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() =>
    root.render(React.createElement(Workbench, { ...props, ...overrides })),
  );
  const view = { container, root };
  mounted.push(view);
  return view;
};

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(() => {
  while (mounted.length > 0) {
    const view = mounted.pop();
    if (view === undefined) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
});

describe('Phase 2 Slice 08 admin workspace interactions', () => {
  it('[P2-S08-AC-002, P2-S08-AC-010, P2-S08-AC-042] preserves the draft and offers explicit recovery for a version conflict', () => {
    const { container } = mount({
      initial: {
        status: 'conflict',
        data: [task],
        version: '13',
        error: {
          code: 'VERSION_CONFLICT',
          message: 'The current task version changed. Review before retrying.',
          requestId: REQUEST_ID,
        },
        retryable: false,
      },
    });

    expect(container.querySelector('[data-state="conflict"]')).not.toBeNull();
    expect(container.textContent).toContain('VERSION_CONFLICT');
    expect(container.textContent).toContain('12');
    expect(container.textContent).toContain('13');
    expect(container.textContent).toContain('Review changes');
    expect(container.textContent).toContain('Reapply');
    expect(container.textContent).toContain('Discard');
    expect(container.textContent).not.toContain('automatically overwritten');
  });

  it('[P2-S08-AC-002, P2-S08-AC-043] keeps selection focus stable during canonical refetch', () => {
    const view = mount();
    const selected = view.container.querySelector<HTMLAnchorElement>(
      `a[data-task-id="${TASK_ID}"]`,
    );
    expect(selected).not.toBeNull();
    if (selected === null) return;
    selected.focus();
    expect(document.activeElement).toBe(selected);

    act(() =>
      view.root.render(
        React.createElement(Workbench, {
          ...props,
          initial: {
            ...props.initial,
            version: '13',
            data: [{ ...task, version: '13' }],
          },
        }),
      ),
    );
    expect(document.activeElement?.getAttribute('data-task-id')).toBe(TASK_ID);
  });
});
