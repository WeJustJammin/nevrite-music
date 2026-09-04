import type { WorkerBindings } from '../index';

export const BASE_URL = 'https://api.wejammin.test';
export const ORIGIN = BASE_URL;
export const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
export const CORRELATION_ID = '22222222-2222-4222-8222-222222222222';
export const ACTOR_ID = '33333333-3333-4333-8333-333333333333';
export const PARTY_ID = '44444444-4444-4444-8444-444444444444';
export const SUBJECT_ID = '55555555-5555-4555-8555-555555555555';
export const TARGET_ID = '66666666-6666-4666-8666-666666666666';
export const GRANT_ID = '77777777-7777-4777-8777-777777777777';
export const AUDIT_LINK_ID = '88888888-8888-4888-8888-888888888888';
export const OUTBOX_EVENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const APPROVER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const instant = '2026-09-02T03:00:00.000Z';
export const later = '2026-09-03T03:00:00.000Z';

export const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-08-worker-red',
  SUPABASE_SECRET_KEY: 'sb_secret_slice_08_worker_red',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

export const inboxResponse = {
  items: [
    {
      taskId: TARGET_ID,
      sourceType: 'setting_definition',
      sourceId: TARGET_ID,
      sourceVersion: '4',
      taskClass: 'approval',
      requiredCapability: 'admin.inbox.read',
      assigneePersonId: ACTOR_ID,
      dueAt: later,
      severity: 'high',
      freshnessAt: instant,
      freshness: 'healthy',
      state: 'assigned',
      sourceStatus: 'active',
      canAct: true,
    },
  ],
  nextCursor: 'next_cursor_1',
  aggregateFreshness: 'healthy',
  partialSources: [],
  generatedAt: instant,
} as const;

export const partialInboxResponse = {
  items: [
    {
      ...inboxResponse.items[0],
      freshness: 'partial',
      state: 'unknown',
      sourceStatus: 'dependency_lagging',
      canAct: false,
    },
  ],
  nextCursor: null,
  aggregateFreshness: 'partial',
  partialSources: ['task_source'],
  generatedAt: instant,
} as const;

export const capabilityActionRequest = {
  action: 'create',
  grantId: null,
  expectedVersion: null,
  subjectPersonId: SUBJECT_ID,
  capabilityKey: 'admin.inbox.read',
  resourceType: 'admin_task',
  resourceId: TARGET_ID,
  scope: { actingPartyId: PARTY_ID },
  actions: ['read'],
  startsAt: instant,
  endsAt: later,
  reason: 'Grant a bounded inbox capability for this review.',
  approverPersonId: APPROVER_ID,
  purposeGrant: false,
  stepUpToken: 'fresh-step-up-token-0123456789',
} as const;

export const capabilityActionResponse = {
  grantId: GRANT_ID,
  subjectPersonId: SUBJECT_ID,
  capabilityKey: 'admin.inbox.read',
  resourceType: 'admin_task',
  resourceId: TARGET_ID,
  state: 'active',
  startsAt: instant,
  endsAt: later,
  version: '1',
  notificationTaskId: TARGET_ID,
  outboxEventId: OUTBOX_EVENT_ID,
} as const;

export const auditReadRequest = {
  action: 'read_audit',
  targetType: 'setting_definition',
  targetId: TARGET_ID,
  targetVersion: '4',
  auditLinkId: AUDIT_LINK_ID,
  diagnosticDefinitionKey: null,
  diagnosticDefinitionVersion: null,
  input: null,
  expectedFreshnessAt: null,
  reason: 'Inspect the immutable audit link for this review.',
} as const;

export const auditReadResponse = {
  action: 'read_audit',
  auditLinkId: AUDIT_LINK_ID,
  diagnosticRunId: null,
  targetType: 'setting_definition',
  targetId: TARGET_ID,
  targetVersion: '4',
  state: 'healthy',
  freshnessAt: instant,
  evidenceRef: null,
  resultCodes: [],
  outboxEventId: null,
} as const;

export const diagnosticRunRequest = {
  action: 'run_diagnostic',
  targetType: 'security_notification',
  targetId: TARGET_ID,
  targetVersion: '4',
  auditLinkId: null,
  diagnosticDefinitionKey: 'security.notification.delivery',
  diagnosticDefinitionVersion: '2',
  input: { scope: 'notification_delivery' },
  expectedFreshnessAt: instant,
  reason: 'Verify the bounded notification delivery diagnostic.',
} as const;
