import { describe, expect, it, vi } from 'vitest';

const { callRelationshipMock } = vi.hoisted(() => ({
  callRelationshipMock: vi.fn(),
}));

vi.mock('./relationship-production-http', () => ({
  callRelationship: callRelationshipMock,
}));

import type { WorkerBindings } from '../index';
import { normalizeAuthProductionOptions } from '../authentication/production-configuration';
import { createProductionRelationshipDependencies } from './relationship-production';

const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-04-relationship-production',
  SUPABASE_SECRET_KEY: 'sb_secret_relationship_test',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ASSIGNMENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TENURE_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const PERSON_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const TERMS_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const EVIDENCE_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const AUTH_USER_ID = '12121212-1212-4121-8121-121212121212';
const SESSION_ID = '13131313-1313-4131-8131-131313131313';
const ACTING_PARTY_ID = '14141414-1414-4141-8141-141414141414';

const request = new Request('https://api.example.test/relationships', {
  headers: { 'x-request-id': REQUEST_ID },
});
const session = {
  authUserId: AUTH_USER_ID,
  sessionId: SESSION_ID,
  accountState: 'active' as const,
  personId: PERSON_ID,
  actingPartyId: ACTING_PARTY_ID,
  expiresAt: '2026-09-02T00:00:00Z',
  stepUpAt: null,
};
const environmentConfig = normalizeAuthProductionOptions({ environment });

describe('relationship production adapters', () => {
  it('maps every active relationship port to its allowlisted RPC seam', async () => {
    callRelationshipMock.mockResolvedValue({ ok: true, value: {} });
    const dependencies =
      createProductionRelationshipDependencies(environmentConfig);
    const signal = new AbortController().signal;
    const command = {
      request,
      session,
      idempotencyKey: 'relationship-adapter-test',
      ifMatch: '"7"',
    };

    await dependencies.createOrganization!(
      { ...command, mode: 'self_member', typeCodes: ['band'] },
      environment,
      signal,
    );
    await dependencies.readOrganization!(
      { request, session: null, organizationId: ORGANIZATION_ID },
      environment,
      signal,
    );
    await dependencies.addOrganizationType!(
      { ...command, organizationId: ORGANIZATION_ID, typeCode: 'label' },
      environment,
      signal,
    );
    await dependencies.removeOrganizationType!(
      {
        ...command,
        organizationId: ORGANIZATION_ID,
        assignmentId: ASSIGNMENT_ID,
      },
      environment,
      signal,
    );
    await dependencies.inviteMembership!(
      {
        ...command,
        organizationId: ORGANIZATION_ID,
        personId: PERSON_ID,
        startsOn: '2026-09-01',
        termsVersionId: TERMS_ID,
        governanceMode: 'governed',
        capacity: 'permanent',
        inviteExpiresAt: '2026-09-03T00:00:00Z',
      },
      environment,
      signal,
    );
    await dependencies.assertMembership!(
      {
        ...command,
        organizationId: ORGANIZATION_ID,
        personId: PERSON_ID,
        startsOn: '2024-01-01',
        provenance: 'historical_assertion',
        evidenceRef: EVIDENCE_ID,
      },
      environment,
      signal,
    );
    await dependencies.acceptMembership!(
      {
        ...command,
        tenureId: TENURE_ID,
        termsVersionId: TERMS_ID,
        termsHash: 'a'.repeat(64),
        decision: 'accept',
      },
      environment,
      signal,
    );
    await dependencies.endMembership!(
      {
        ...command,
        tenureId: TENURE_ID,
        mode: 'retroactive',
        endsOn: '2026-08-31',
        counterpartConfirmationId: EVIDENCE_ID,
        reasonCode: 'DATE_CORRECTION',
      },
      environment,
      signal,
    );
    await dependencies.addCapacityPeriod!(
      {
        ...command,
        tenureId: TENURE_ID,
        capacity: 'touring',
        startsOn: '2026-09-01',
        endsOn: '2026-10-01',
      },
      environment,
      signal,
    );
    await dependencies.readMemberships!(
      {
        request,
        session,
        organizationId: ORGANIZATION_ID,
        query: { cursor: null, limit: 25 },
      },
      environment,
      signal,
    );

    expect(callRelationshipMock.mock.calls.map(([, name]) => name)).toEqual([
      'rpc_create_organization',
      'identity_organization_read',
      'rpc_change_organization_type',
      'rpc_change_organization_type',
      'rpc_invite_membership',
      'rpc_assert_membership',
      'rpc_accept_or_end_membership',
      'rpc_accept_or_end_membership',
      'rpc_add_capacity_period',
      'identity_memberships_read',
    ]);

    const inputs = callRelationshipMock.mock.calls.map(([, , input]) => input);
    expect(inputs[0]).toMatchObject({
      p_mode: 'self_member',
      p_type_codes: ['band'],
      p_auth_user_id: AUTH_USER_ID,
      p_session_id: SESSION_ID,
      p_actor_id: PERSON_ID,
      p_acting_party_id: ACTING_PARTY_ID,
      p_request_id: REQUEST_ID,
      p_correlation_id: REQUEST_ID,
    });
    expect(inputs[0]?.p_key_hash).toMatch(/^\\x[0-9a-f]{64}$/u);
    expect(inputs[0]?.p_request_hash).toMatch(/^\\x[0-9a-f]{64}$/u);
    expect(inputs[1]).toEqual({
      p_organization_id: ORGANIZATION_ID,
      p_request_id: REQUEST_ID,
      p_correlation_id: REQUEST_ID,
    });
    expect(inputs[2]).toMatchObject({
      p_organization_id: ORGANIZATION_ID,
      p_type_code: 'label',
      p_action: 'add',
      p_expected_version: '7',
    });
    expect(inputs[3]).toMatchObject({
      p_organization_id: ORGANIZATION_ID,
      p_assignment_id: ASSIGNMENT_ID,
      p_action: 'remove',
      p_expected_version: '7',
    });
    expect(inputs[3]).not.toHaveProperty('p_type_code');
    expect(inputs[4]).toMatchObject({
      p_organization_id: ORGANIZATION_ID,
      p_terms_version_id: TERMS_ID,
      p_governance_mode: 'governed',
      p_expected_version: '7',
    });
    expect(inputs[5]).toMatchObject({ p_expected_version: '7' });
    expect(inputs[6]).toMatchObject({
      p_terms_version_id: TERMS_ID,
      p_terms_hash: 'a'.repeat(64),
      p_expected_version: '7',
    });
    expect(inputs[7]).toMatchObject({
      p_ends_on: '2026-08-31',
      p_counterpart_confirmation_id: EVIDENCE_ID,
      p_expected_version: '7',
    });
    expect(inputs[8]).toMatchObject({
      p_starts_on: '2026-09-01',
      p_expected_version: '7',
    });
    expect(inputs[9]).toMatchObject({
      p_organization_id: ORGANIZATION_ID,
      p_cursor: null,
      p_limit: 25,
      p_auth_user_id: AUTH_USER_ID,
    });
    for (const index of [0, 2, 3, 4, 5, 6, 7, 8]) {
      expect(inputs[index]?.p_key_hash).toMatch(/^\\x[0-9a-f]{64}$/u);
      expect(inputs[index]?.p_request_hash).toMatch(/^\\x[0-9a-f]{64}$/u);
    }

    expect(callRelationshipMock).toHaveBeenCalledTimes(10);
    expect(callRelationshipMock.mock.calls[0]![5]).toMatchObject({
      'X-Operation-Id': 'ORG-01',
      'X-Request-Id': REQUEST_ID,
      'X-Correlation-Id': REQUEST_ID,
      'X-Idempotency-Key': command.idempotencyKey,
    });
    expect(callRelationshipMock.mock.calls[1]![5]).toEqual({
      'X-Operation-Id': 'ORG-02',
      'X-Request-Id': REQUEST_ID,
      'X-Correlation-Id': REQUEST_ID,
    });
  });

  it('forwards nullable optional fields and the now-end membership branch', async () => {
    callRelationshipMock.mockClear();
    callRelationshipMock.mockResolvedValue({ ok: true, value: {} });
    const dependencies =
      createProductionRelationshipDependencies(environmentConfig);
    const signal = new AbortController().signal;
    const command = {
      request,
      session,
      idempotencyKey: 'relationship-adapter-optional-test',
      ifMatch: null,
    };

    await dependencies.addOrganizationType!(
      { ...command, organizationId: ORGANIZATION_ID, typeCode: 'label' },
      environment,
      signal,
    );
    await dependencies.inviteMembership!(
      {
        ...command,
        organizationId: ORGANIZATION_ID,
        personId: PERSON_ID,
        startsOn: '2026-09-01',
        governanceMode: 'ungoverned',
        capacity: 'touring',
        inviteExpiresAt: '2026-09-03T00:00:00Z',
      },
      environment,
      signal,
    );
    await dependencies.endMembership!(
      {
        ...command,
        tenureId: TENURE_ID,
        mode: 'now',
        reasonCode: 'PERSONAL_REQUEST',
      },
      environment,
      signal,
    );
    await dependencies.addCapacityPeriod!(
      {
        ...command,
        tenureId: TENURE_ID,
        capacity: 'touring',
        startsOn: '2026-09-01',
      },
      environment,
      signal,
    );

    expect(callRelationshipMock.mock.calls[0]![2]).toMatchObject({
      p_expected_version: '0',
    });
    expect(callRelationshipMock.mock.calls[1]![2]).toMatchObject({
      p_terms_version_id: null,
      p_governance_mode: 'ungoverned',
      p_expected_version: '0',
    });
    expect(callRelationshipMock.mock.calls[2]![2]).toMatchObject({
      p_ends_on: null,
      p_counterpart_confirmation_id: null,
    });
    expect(callRelationshipMock.mock.calls[3]![2]).toMatchObject({
      p_ends_on: null,
    });
  });
});
