import { describe, expect, it, vi } from 'vitest';

const { callIdentityMock } = vi.hoisted(() => ({
  callIdentityMock: vi.fn(),
}));

vi.mock('./production-http', () => ({ callIdentity: callIdentityMock }));

import type { WorkerBindings } from '../index';
import { createProductionIdentityAuthorityDependencies } from './production';

const env: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'slice-03-production-coverage',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const request = new Request('https://api.example.test/identity');
const session = {} as never;

describe('identity production adapters', () => {
  it('maps every identity adapter into its RPC call, including patch branches', async () => {
    callIdentityMock.mockResolvedValue({ ok: true, value: {} });
    const dependencies = createProductionIdentityAuthorityDependencies({
      environment: env,
    });
    const signal = new AbortController().signal;
    const common = {
      request,
      session,
      idempotencyKey: 'identity-adapter-test',
      ifMatch: '"42"',
    };

    await dependencies.createPerson!(
      { request, session, idempotencyKey: common.idempotencyKey },
      env,
      signal,
    );
    await dependencies.readPerson!({ request, session }, env, signal);
    await dependencies.addFacet!(
      { ...common, facetCode: 'artist', source: 'self_asserted' },
      env,
      signal,
    );
    await dependencies.removeFacet!(
      { ...common, facetCode: 'artist', ifMatch: '"43"' },
      env,
      signal,
    );
    await dependencies.createAlias!(
      {
        ...common,
        displayName: 'Neon Harbor',
        handle: 'neon-harbor',
        publicLinkState: 'public',
      },
      env,
      signal,
    );
    await dependencies.patchAlias!(
      { ...common, aliasId: 'alias-absent', ifMatch: '"44"' },
      env,
      signal,
    );
    await dependencies.patchAlias!(
      {
        ...common,
        aliasId: 'alias-present',
        displayName: 'Neon Harbor Live',
        publicLinkState: 'private',
      },
      env,
      signal,
    );
    await dependencies.changeHandle!(
      { ...common, aliasId: 'alias-id', handle: 'neon-harbor-live' },
      env,
      signal,
    );
    await dependencies.retireAlias!(
      { ...common, aliasId: 'alias-id' },
      env,
      signal,
    );
    await dependencies.createTransferOffer!(
      {
        ...common,
        aliasId: 'alias-id',
        recipientPersonId: 'person-recipient',
      },
      env,
      signal,
    );
    await dependencies.acceptTransferOffer!(
      { ...common, offerId: 'offer-id' },
      env,
      signal,
    );
    await dependencies.declineTransferOffer!(
      { ...common, offerId: 'offer-id' },
      env,
      signal,
    );
    await dependencies.readActingContexts!(
      { request, session, cursor: null },
      env,
      signal,
    );
    await dependencies.bindActingContext!(
      {
        ...common,
        contextId: 'context-id',
        deliberateConfirmation: true,
        clientBindingId: 'binding-id',
      },
      env,
      signal,
    );
    await dependencies.readPublicProjection!(
      { request, partyId: 'party-id' },
      env,
      signal,
    );

    expect(
      callIdentityMock.mock.calls.map(([, name, input]) => [name, input]),
    ).toEqual([
      ['identity_create', {}],
      ['identity_person_read', {}],
      ['identity_facet_add', { p_facet_code: 'artist' }],
      [
        'identity_facet_remove',
        { p_facet_code: 'artist', p_expected_version: '43' },
      ],
      [
        'identity_alias_create',
        {
          p_display_name: 'Neon Harbor',
          p_handle: 'neon-harbor',
          p_public_link_state: 'public',
        },
      ],
      [
        'identity_alias_patch',
        { p_alias_id: 'alias-absent', p_expected_version: '44' },
      ],
      [
        'identity_alias_patch',
        {
          p_alias_id: 'alias-present',
          p_display_name: 'Neon Harbor Live',
          p_public_link_state: 'private',
          p_expected_version: '42',
        },
      ],
      [
        'identity_handle_change',
        {
          p_alias_id: 'alias-id',
          p_handle: 'neon-harbor-live',
          p_expected_version: '42',
        },
      ],
      [
        'identity_alias_retire',
        { p_alias_id: 'alias-id', p_expected_version: '42' },
      ],
      [
        'identity_transfer_offer_create',
        { p_alias_id: 'alias-id', p_recipient_person_id: 'person-recipient' },
      ],
      [
        'identity_transfer_accept',
        { p_offer_id: 'offer-id', p_expected_version: '42' },
      ],
      [
        'identity_transfer_decline',
        { p_offer_id: 'offer-id', p_expected_version: '42' },
      ],
      ['identity_contexts_read', { p_cursor: null }],
      [
        'identity_context_bind',
        {
          p_context_id: 'context-id',
          p_deliberate_confirmation: true,
          p_client_binding_id: 'binding-id',
        },
      ],
      ['get_public_party_projection', { p_party_id: 'party-id' }],
    ]);
  });
});
