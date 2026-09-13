import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedReceiptEnvelopeSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-receipt.ts';
import { HostedCleanupResultSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3-cleanup-result.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { createFixture } from './ac265-hosted-receipt-test-fixtures.ts';

type JsonRecord = Record<string, unknown>;

const createSchemaFixture = () =>
  createFixture({
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: '2026-09-03T11:00:00.000Z',
  });

const receiptEnvelope = (
  fixture: ReturnType<typeof createSchemaFixture>,
  kind: 'role' | 'cleanup',
): JsonRecord => {
  const slot = fixture.slots.find((candidate) =>
    kind === 'cleanup'
      ? candidate.kind === 'cleanup'
      : candidate.kind === 'role' && candidate.index === 0,
  );
  if (slot === undefined) throw new Error('Fixture receipt is missing.');
  const bytes = fixture.receiptBytes.get(slot.ref);
  if (bytes === undefined)
    throw new Error('Fixture receipt bytes are missing.');
  return JSON.parse(Buffer.from(bytes).toString('utf8')) as JsonRecord;
};

const expectIssue = (
  result:
    | { success: true }
    | {
        success: false;
        error: { issues: Array<{ path: PropertyKey[]; message: string }> };
      },
  path: PropertyKey[],
  message: string,
): void => {
  expect(result.success).toBe(false);
  if (result.success) return;
  expect(result.error.issues).toEqual(
    expect.arrayContaining([expect.objectContaining({ path, message })]),
  );
};

describe('AC265 hosted schema branch rejections', () => {
  it('rejects invalid role execution evidence in an authenticated receipt envelope', () => {
    const fixture = createSchemaFixture();
    const envelope = receiptEnvelope(fixture, 'role');
    const result = envelope['result'] as JsonRecord;
    result['executionEvidence'] = [];

    expectIssue(
      ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(envelope),
      ['result', 'executionEvidence'],
      'Hosted receipt execution evidence must match its subject kind',
    );
  });

  it('rejects a cleanup receipt with a non-session-scoped logout policy', () => {
    const fixture = createSchemaFixture();
    const envelope = receiptEnvelope(fixture, 'cleanup');
    const result = envelope['result'] as JsonRecord;
    result['logoutPolicy'] = 'all_sessions';

    expectIssue(
      ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(envelope),
      ['result', 'sessionTeardowns'],
      'Hosted cleanup receipt must bind current-session teardown evidence',
    );
  });

  it('rejects an invalid cleanup binding when logout evidence is omitted', () => {
    const fixture = createSchemaFixture();
    const envelope = receiptEnvelope(fixture, 'cleanup');
    const result = envelope['result'] as JsonRecord;
    delete result['logoutPolicy'];
    delete result['sessionTeardowns'];
    result['executionBinding'] = {};

    expectIssue(
      ContentSchemaRegistryHostedReceiptEnvelopeSchema.safeParse(envelope),
      ['result', 'executionBinding'],
      'Hosted receipt execution binding must match its subject kind',
    );
  });

  it('requires cleanup logout policy and session teardowns together', () => {
    const fixture = createSchemaFixture();
    const cleanup = { ...fixture.report.cleanup } as unknown as JsonRecord;
    delete cleanup['logoutPolicy'];

    expectIssue(
      HostedCleanupResultSchema.safeParse(cleanup),
      ['sessionTeardowns'],
      'Hosted cleanup must bind its logout policy and session teardowns together',
    );
  });

  it('fails closed if the declared role inventory gains an unbound role', () => {
    const fixture = createSchemaFixture();
    const roles = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES as unknown as string[];
    const unboundRole = 'future_unbound_role';
    roles.push(unboundRole);
    try {
      expectIssue(
        HostedCleanupResultSchema.safeParse(fixture.report.cleanup),
        ['sessionTeardowns'],
        'Hosted cleanup must bind every declared session teardown',
      );
    } finally {
      roles.pop();
    }
  });
});
