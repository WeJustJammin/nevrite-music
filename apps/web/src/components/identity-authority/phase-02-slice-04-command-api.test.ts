import { describe, expect, it } from 'vitest';

import {
  CREATE_ORGANIZATION_COMMAND,
  buildRelationshipCommandRequest,
} from './relationship-command-api';
import { relationshipCommandDefinitions } from './relationship-command-definitions';

const definition = (operationId: string) => {
  const command = relationshipCommandDefinitions.find(
    (candidate) => candidate.operationId === operationId,
  );
  if (command === undefined) throw new Error(`Missing ${operationId}`);
  return command;
};

const build = (
  command: Parameters<typeof buildRelationshipCommandRequest>[0]['definition'],
  values: Readonly<Record<string, string | readonly string[]>>,
  organizationId: string | null = 'organization-s04',
) =>
  buildRelationshipCommandRequest({
    definition: command,
    values,
    organizationId,
    expectedVersion: '"7"',
    idempotencyKey: 'relationship-intent-s04',
    csrfToken: 'csrf-s04',
  });

describe('P2-S04 relationship command browser request contract', () => {
  it('[P2-S04-AC-148] sends ORG-01 as strict JSON with an idempotency key', () => {
    const result = build(
      CREATE_ORGANIZATION_COMMAND,
      {
        mode: 'self_member',
        typeCodes: 'band, artist ',
      },
      null,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request).toMatchObject({
      url: '/api/v1/organizations',
      method: 'POST',
      body: JSON.stringify({
        mode: 'self_member',
        typeCodes: ['band', 'artist'],
      }),
    });
    expect(result.request.headers.get('content-type')).toBe('application/json');
    expect(result.request.headers.get('idempotency-key')).toBe(
      'relationship-intent-s04',
    );
    expect(result.request.headers.get('if-match')).toBeNull();
    expect(result.request.headers.get('x-csrf-token')).toBe('csrf-s04');
  });

  it('[P2-S04-AC-151] targets TYPE-02 by opaque assignment ID and sends an empty JSON body', () => {
    const result = build(definition('TYPE-02'), {
      assignmentId: 'assignment/s04',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.url).toBe(
      '/api/v1/organizations/organization-s04/type-assignments/assignment%2Fs04',
    );
    expect(result.request.method).toBe('DELETE');
    expect(result.request.body).toBe('{}');
    expect(result.request.headers.get('if-match')).toBe('"7"');
  });

  it('[P2-S04-AC-154] targets MEM-03/04/05 by tenure ID and keeps the target out of the body', () => {
    const accept = build(definition('MEM-03'), {
      tenureId: 'tenure/s04',
      termsVersionId: 'terms-s04',
      termsHash: 'a'.repeat(64),
      decision: 'accept',
    });
    const end = build(definition('MEM-04'), {
      tenureId: 'tenure/s04',
      mode: 'now',
      reasonCode: 'user_requested',
    });
    const capacity = build(definition('MEM-05'), {
      tenureId: 'tenure/s04',
      capacity: '0.5',
      startsOn: '2026-09-01',
    });

    for (const result of [accept, end, capacity]) {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.request.url).toContain(
          '/api/v1/membership-tenures/tenure%2Fs04/',
        );
        expect(JSON.parse(result.request.body)).not.toHaveProperty('tenureId');
        expect(result.request.headers.get('if-match')).toBe('"7"');
        expect(result.request.headers.get('idempotency-key')).toBe(
          'relationship-intent-s04',
        );
      }
    }
  });

  it('[P2-S04-AC-150, AC-153] refuses mutation when the server target or version is unavailable', () => {
    const missingTarget = build(definition('TYPE-02'), {}, null);
    expect(missingTarget).toEqual({
      ok: false,
      message: 'A canonical relationship target is required before submitting.',
    });

    const missingVersion = buildRelationshipCommandRequest({
      definition: definition('TYPE-01'),
      values: { typeCode: 'band' },
      organizationId: 'organization-s04',
      expectedVersion: null,
      idempotencyKey: 'relationship-intent-s04',
    });
    expect(missingVersion).toEqual({
      ok: false,
      message: 'Refresh the organization before submitting this command.',
    });
  });
});
