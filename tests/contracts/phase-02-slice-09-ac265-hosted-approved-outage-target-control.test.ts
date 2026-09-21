import { describe, expect, it } from 'vitest';

import {
  AC265_APPROVED_OUTAGE_TARGET_CONTROL_SCHEMA_VERSION,
  ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema,
  ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema,
  ContentSchemaRegistryAc265ApprovedOutageTargetReadResultSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-approved-outage-target-control.ts';

const criterion = 'P2-S09-AC-265' as const;
const schemaVersion = 'ac265-hosted-approved-outage-target-control-v1' as const;
const authorizationRef =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
const targetRef =
  'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001';
const runId = '73000000-0000-4000-8000-000000000001';
const scope = {
  runId,
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: 'abcdefghijklmnopqrst',
  deploymentId: '6428523608',
  dependencyId: 'supabase-auth',
  route: {
    operationId: 'CMS-03A-06',
    method: 'GET',
    path: '/api/v1/cms/content-types',
  },
} as const;

const request = {
  criterion,
  schemaVersion,
  authorizationRef,
  targetRef,
} as const;

const target = {
  schemaVersion: 'ac265-approved-outage-target-v1',
  source: 'protected-staging-fault-control-plane',
  targetId: '74000000-0000-4000-8000-000000000001',
  targetRef,
  approvedAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T11:00:00.000Z',
  scope,
} as const;

const result = {
  criterion,
  schemaVersion,
  authorizationRef,
  environment: 'staging',
  hostingProjectId: 'wejammin-staging',
  supabaseProjectRef: 'abcdefghijklmnopqrst',
  redacted: true,
  targetSha256: 'a'.repeat(64),
  target,
} as const;

const expectRejected = (
  schema: { safeParse: (value: unknown) => { success: boolean } },
  value: unknown,
) => expect(schema.safeParse(value).success).toBe(false);

describe('AC265 CP04a approved outage-target control contracts', () => {
  it('pins the exact control version and accepts the canonical read exchange', () => {
    expect(AC265_APPROVED_OUTAGE_TARGET_CONTROL_SCHEMA_VERSION).toBe(
      schemaVersion,
    );
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema.parse(
        request,
      ),
    ).toEqual(request);
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetReadResultSchema.parse(
        result,
      ),
    ).toEqual(result);
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema.parse(
        result,
      ),
    ).toEqual(result);
  });

  it('requires a v4 staging authorization and target reference with no caller scope', () => {
    for (const value of [
      '',
      'https://example.test/authorization',
      'ac265-authorization://production/72000000-0000-4000-8000-000000000001',
      'ac265-authorization://staging/not-a-uuid',
      'ac265-authorization://staging/72000000-0000-4000-8000-000000000001?secret=x',
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema,
        { ...request, authorizationRef: value },
      );

    for (const value of [
      '',
      'ac265-outage-target://production/74000000-0000-4000-8000-000000000001',
      'ac265-outage-target://staging/not-a-uuid',
      'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001?secret=x',
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema,
        { ...request, targetRef: value },
      );

    for (const extra of [
      { runId },
      { dependencyId: 'other-dependency' },
      { route: scope.route },
      { targetId: target.targetId },
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedOutageTargetReadRequestSchema,
        { ...request, ...extra },
      );
  });

  it('rejects noncanonical response projection, digest, identity, and secret fields', () => {
    for (const value of [
      { ...result, targetSha256: 'A'.repeat(64) },
      { ...result, targetSha256: 'a'.repeat(63) },
      { ...result, environment: 'production' },
      { ...result, hostingProjectId: 'other-project' },
      { ...result, supabaseProjectRef: 'zyxwvutsrqponmlkjih' },
      { ...result, redacted: false },
      {
        ...result,
        target: { ...target, targetRef: targetRef.replace('001', '002') },
      },
      {
        ...result,
        target: {
          ...target,
          scope: { ...scope, runId: 'not-a-uuid' },
        },
      },
      { ...result, rawTarget: 'secret' },
      { ...result, target: { ...target, token: 'secret' } },
    ])
      expectRejected(
        ContentSchemaRegistryAc265ApprovedOutageTargetReadResultSchema,
        value,
      );
  });

  it('accepts and rejects the conflict envelope as a closed union', () => {
    expect(
      ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema.parse({
        status: 'conflict',
      }),
    ).toEqual({ status: 'conflict' });
    expectRejected(
      ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema,
      { status: 'conflict', detail: 'private' },
    );
    expectRejected(
      ContentSchemaRegistryAc265ApprovedOutageTargetReadResponseSchema,
      { status: 'ok' },
    );
  });
});
