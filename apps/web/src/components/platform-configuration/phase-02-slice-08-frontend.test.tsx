import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AdminWorkspaceOperationsWorkbench from './AdminWorkspaceOperationsWorkbench';

const ACTOR_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const PARTY_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d9';
const TASK_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132da';
const SOURCE_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132db';
const GRANT_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dc';
const RESOURCE_ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132dd';
const VERSION = '12';
const PRIVATE_PAYLOAD = 'private-audit-payload-must-not-render';

type AdminRecord = Readonly<{
  id: string;
  version: string;
  state: string;
  provenance: readonly Readonly<{
    source: string;
    evidence: string;
    at: string;
    visibility: string;
  }>[];
  projection: Readonly<Record<string, unknown>>;
}>;

type FutureAsyncState = Readonly<{
  status: string;
  data?: readonly AdminRecord[] | null;
  version?: string;
  stale?: boolean;
  lastVerifiedAt?: string | null;
  requestId?: string;
  error?: Readonly<{
    code: string;
    message: string;
    requestId: string;
    details?: Readonly<Record<string, unknown>>;
  }>;
  retryable?: boolean;
  reason?: string;
}>;

type FutureProps = Readonly<{
  contractFields: Readonly<{
    source: string;
    fields: Readonly<Record<string, unknown>>;
  }>;
  variant: 'adminStepUp';
  initial: FutureAsyncState;
  actorId: string;
  actingPartyId: string;
  access: 'full' | 'read-only' | 'partial-hidden' | 'disabled' | 'not-rendered';
  query: Readonly<Record<string, string>>;
  selectedId: string | null;
  expectedVersion: string | null;
  csrfToken: string;
  requestId: string;
  onCanonicalRefetch: (reason: string) => Promise<void>;
}>;

const taskRecord: AdminRecord = {
  id: TASK_ID,
  version: VERSION,
  state: 'assigned',
  provenance: [
    {
      source: 'platform-configuration',
      evidence: `task:${TASK_ID}:source:${SOURCE_ID}`,
      at: '2026-09-02T12:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: {
    operationId: 'CFG-05B-01',
    taskId: TASK_ID,
    sourceType: 'platform-configuration',
    sourceId: SOURCE_ID,
    sourceVersion: VERSION,
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
    aggregateFreshness: 'healthy',
    partialSources: [],
    generatedAt: '2026-09-02T12:00:00.000Z',
    [PRIVATE_PAYLOAD]: PRIVATE_PAYLOAD,
  },
};

const grantRecord: AdminRecord = {
  id: GRANT_ID,
  version: '4',
  state: 'active',
  provenance: [
    {
      source: 'admin-capability-grants',
      evidence: `grant:${GRANT_ID}`,
      at: '2026-09-02T12:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: {
    operationId: 'CFG-05B-04',
    grantId: GRANT_ID,
    subjectPersonId: SOURCE_ID,
    capabilityKey: 'admin.audit.read',
    resourceType: 'platform_configuration',
    resourceId: RESOURCE_ID,
    scope: { environment: 'staging' },
    actions: ['audit.read', 'security.notify'],
    startsAt: '2026-09-02T12:00:00.000Z',
    endsAt: '2026-09-02T18:00:00.000Z',
    reason: 'Bounded incident review',
    approverPersonId: ACTOR_ID,
    purposeGrant: false,
    stepUpRequired: true,
    state: 'active',
    [PRIVATE_PAYLOAD]: PRIVATE_PAYLOAD,
  },
};

const auditRecord: AdminRecord = {
  id: SOURCE_ID,
  version: '8',
  state: 'known',
  provenance: [
    {
      source: 'admin-audit-links',
      evidence: `audit:${SOURCE_ID}`,
      at: '2026-09-02T12:00:00.000Z',
      visibility: 'authorized',
    },
  ],
  projection: {
    operationId: 'CFG-05B-05',
    targetId: SOURCE_ID,
    targetVersion: '8',
    contentRevisionId: TASK_ID,
    auditEventId: GRANT_ID,
    securityEventId: RESOURCE_ID,
    safeLabel: 'Configuration approval activity',
    freshness: 'healthy',
    [PRIVATE_PAYLOAD]: PRIVATE_PAYLOAD,
  },
};

const Workbench =
  AdminWorkspaceOperationsWorkbench as unknown as React.ComponentType<FutureProps>;

const makeProps = (
  initial: FutureAsyncState = {
    status: 'success',
    data: [taskRecord],
    version: VERSION,
    stale: false,
  },
  access: FutureProps['access'] = 'full',
): FutureProps => ({
  contractFields: {
    source: '05b-admin-workspace-operations.md',
    fields: {
      Cfg05b01InboxQuery: ['taskClasses', 'states', 'staleAfter'],
      Cfg05b04CapabilityActionRequest: [
        'subjectPersonId',
        'capabilityKey',
        'resourceType',
        'resourceId',
        'scope',
        'actions',
        'startsAt',
        'endsAt',
        'reason',
        'approverPersonId',
        'purposeGrant',
        'stepUpToken',
      ],
      Cfg05b05AuditLinkQuery: ['targetId', 'targetVersion'],
    },
  },
  variant: 'adminStepUp',
  initial,
  actorId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  access,
  query: { states: 'open,assigned' },
  selectedId: TASK_ID,
  expectedVersion: VERSION,
  csrfToken: 'csrf-s08',
  requestId: TASK_ID,
  onCanonicalRefetch: async () => undefined,
});

const renderWorkbench = (props = makeProps()): string =>
  renderToStaticMarkup(React.createElement(Workbench, props));

describe('Phase 2 Slice 08 admin workspace frontend contracts', () => {
  it('[P2-S08-AC-001, P2-S08-AC-002, P2-S08-AC-006, P2-S08-AC-041] renders a server-first, capability-filtered inbox projection', () => {
    const markup = renderWorkbench();

    expect(markup).toContain(
      'data-contract-source="05b-admin-workspace-operations.md"',
    );
    expect(markup).toContain('data-workbench="admin-workspace-operations"');
    expect(markup).toContain('data-access="full"');
    expect(markup).not.toContain('data-state="deferred"');
    expect(markup).toContain('Admin task inbox');
    expect(markup).toContain(TASK_ID);
    expect(markup).toContain('sourceVersion');
    expect(markup).toContain(VERSION);
    expect(markup).toContain('healthy');
    expect(markup).toContain('assigned');
    expect(markup).toContain('awaiting_approval');
    expect(markup).toContain('data-freshness="healthy"');
    expect(markup).not.toContain(PRIVATE_PAYLOAD);
  });

  it('[P2-S08-AC-002, P2-S08-AC-042] labels partial and unknown data without false empty or healthy states', () => {
    const partial = renderWorkbench({
      ...makeProps({
        status: 'success',
        data: [
          {
            ...taskRecord,
            projection: {
              ...taskRecord.projection,
              aggregateFreshness: 'partial',
              partialSources: ['quality-diagnostics'],
              freshness: 'partial',
            },
          },
        ],
        version: VERSION,
        stale: false,
      }),
    });
    expect(partial).toContain('data-freshness="partial"');
    expect(partial).toContain('quality-diagnostics');
    expect(partial).not.toMatch(/0 tasks|no tasks|healthy/u);

    const unknown = renderWorkbench({
      ...makeProps({
        status: 'degraded',
        data: null,
        requestId: SOURCE_ID,
        lastVerifiedAt: null,
      }),
    });
    expect(unknown).toContain('unknown');
    expect(unknown).toContain(SOURCE_ID);
    expect(unknown).toMatch(/retry|status/u);
    expect(unknown).not.toMatch(/0 tasks|no tasks|healthy/u);
  });

  it('[P2-S08-AC-003, P2-S08-AC-004, P2-S08-AC-044, P2-S08-AC-046, P2-S08-AC-047, P2-S08-AC-049] exposes only named grant/revoke and audit/security actions', () => {
    const grants = renderWorkbench({
      ...makeProps({
        status: 'success',
        data: [grantRecord],
        version: '4',
        stale: false,
      }),
    });
    expect(grants).toContain('CFG-05B-04');
    expect(grants).toContain('Grant capability');
    expect(grants).toContain('Revoke capability');
    for (const field of [
      'subjectPersonId',
      'capabilityKey',
      'resourceType',
      'resourceId',
      'actions',
      'startsAt',
      'endsAt',
      'reason',
      'approverPersonId',
      'purposeGrant',
      'stepUpToken',
    ]) {
      expect(grants).toContain(`name="${field}"`);
    }
    expect(grants).toContain('name="csrf"');
    expect(grants).toContain('name="expectedVersion"');
    expect(grants).not.toContain(PRIVATE_PAYLOAD);

    const audit = renderWorkbench({
      ...makeProps({
        status: 'success',
        data: [auditRecord],
        version: '8',
        stale: false,
      }),
    });
    expect(audit).toContain('CFG-05B-05');
    expect(audit).toContain('Configuration approval activity');
    expect(audit).toContain(GRANT_ID);
    expect(audit).toContain(RESOURCE_ID);
    expect(audit).not.toContain(PRIVATE_PAYLOAD);
    expect(audit).not.toMatch(/run diagnostic|repair|site health/iu);
  });

  it('[P2-S08-AC-004] keeps deferred search and bulk operations absent from the DOM and island boundary', () => {
    const markup = renderWorkbench();

    expect(markup).not.toContain('CFG-05B-02');
    expect(markup).not.toContain('CFG-05B-03');
    expect(markup).not.toMatch(/global search|bulk action|bulk operation/iu);
    expect(markup).not.toMatch(/data-operation-id="CFG-05B-0[23]"/u);
  });

  it('[P2-S08-AC-001, P2-S08-AC-003] emits no protected labels or records for a hidden capability projection', () => {
    const markup = renderWorkbench(
      makeProps(
        {
          status: 'empty',
          reason: 'not-disclosed',
          data: [],
        },
        'not-rendered',
      ),
    );

    expect(markup).not.toContain('Admin task inbox');
    expect(markup).not.toContain('Grant capability');
    expect(markup).not.toContain('Revoke capability');
    expect(markup).not.toContain(TASK_ID);
    expect(markup).not.toContain(GRANT_ID);
    expect(markup).not.toContain('configuration.approver');
  });
});
