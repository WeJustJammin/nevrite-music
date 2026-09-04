import {
  ActingContextBindingResponseSchema,
  ActingContextListResponseSchema,
  AliasResponseSchema,
  FacetMutationResponseSchema,
  PersonIdentityResponseSchema,
  PublicPartyProjectionResponseSchema,
  TransferOfferResponseSchema,
} from '@wejammin/contracts';

import {
  normalizeAuthProductionOptions,
  type AuthProductionOptions,
} from '../authentication/production-configuration';
import type { IdentityAuthorityDependencies } from './types';
import { callIdentity } from './production-http';
import { createProductionRelationshipDependencies } from './relationship-production';

export const createProductionIdentityAuthorityDependencies = (
  options: AuthProductionOptions,
): IdentityAuthorityDependencies => {
  const config = normalizeAuthProductionOptions(options);
  return {
    ...createProductionRelationshipDependencies(config),
    createPerson: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_create',
        {},
        signal,
        PersonIdentityResponseSchema,
      ),
    readPerson: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_person_read',
        {},
        signal,
        PersonIdentityResponseSchema,
      ),
    addFacet: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_facet_add',
        { p_facet_code: input.facetCode },
        signal,
        FacetMutationResponseSchema,
      ),
    removeFacet: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_facet_remove',
        {
          p_facet_code: input.facetCode,
          p_expected_version: input.ifMatch.slice(1, -1),
        },
        signal,
        FacetMutationResponseSchema,
      ),
    createAlias: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_alias_create',
        {
          p_display_name: input.displayName,
          p_handle: input.handle,
          p_public_link_state: input.publicLinkState,
        },
        signal,
        AliasResponseSchema,
      ),
    patchAlias: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_alias_patch',
        {
          p_alias_id: input.aliasId,
          ...(input.displayName === undefined
            ? {}
            : { p_display_name: input.displayName }),
          ...(input.publicLinkState === undefined
            ? {}
            : { p_public_link_state: input.publicLinkState }),
          p_expected_version: input.ifMatch.slice(1, -1),
        },
        signal,
        AliasResponseSchema,
      ),
    changeHandle: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_handle_change',
        {
          p_alias_id: input.aliasId,
          p_handle: input.handle,
          p_expected_version: input.ifMatch.slice(1, -1),
        },
        signal,
        AliasResponseSchema,
      ),
    retireAlias: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_alias_retire',
        {
          p_alias_id: input.aliasId,
          p_expected_version: input.ifMatch.slice(1, -1),
        },
        signal,
        AliasResponseSchema,
      ),
    createTransferOffer: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_transfer_offer_create',
        {
          p_alias_id: input.aliasId,
          p_recipient_person_id: input.recipientPersonId,
        },
        signal,
        TransferOfferResponseSchema,
      ),
    acceptTransferOffer: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_transfer_accept',
        {
          p_offer_id: input.offerId,
          p_expected_version: input.ifMatch.slice(1, -1),
        },
        signal,
        AliasResponseSchema,
      ),
    declineTransferOffer: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_transfer_decline',
        {
          p_offer_id: input.offerId,
          p_expected_version: input.ifMatch.slice(1, -1),
        },
        signal,
        TransferOfferResponseSchema,
      ),
    readActingContexts: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_contexts_read',
        { p_cursor: input.cursor },
        signal,
        ActingContextListResponseSchema,
      ),
    bindActingContext: async (input, _env, signal) =>
      callIdentity(
        config,
        'identity_context_bind',
        {
          p_context_id: input.contextId,
          p_deliberate_confirmation: input.deliberateConfirmation,
          p_client_binding_id: input.clientBindingId,
        },
        signal,
        ActingContextBindingResponseSchema,
      ),
    readPublicProjection: async (input, _env, signal) =>
      callIdentity(
        config,
        'get_public_party_projection',
        { p_party_id: input.partyId },
        signal,
        PublicPartyProjectionResponseSchema,
      ),
  };
};
