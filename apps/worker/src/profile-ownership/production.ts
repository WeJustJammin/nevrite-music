import {
  ChallengeResourceSchema,
  ClaimResourceSchema,
  JobStatusSchema,
  MatchResponseSchema,
  ProfileEventSchema,
  RemedyResourceSchema,
} from '@wejammin/contracts';

import {
  normalizeAuthProductionOptions,
  type AuthProductionOptions,
} from '../authentication/production-configuration';
import {
  commandRpc,
  expectedVersion,
  readRpc,
  replayFor,
} from './production-request';
import type { ProfileOwnershipDependencies, ProfilePortInput } from './types';

export const PROFILE_RPC = {
  matchShadowParty: 'rpc_match_shadow',
  dispatchInvitation: 'rpc_dispatch_invitation',
  submitRemedy: 'rpc_submit_remedy',
  startClaim: 'rpc_start_claim',
  readClaim: 'rpc_read_claim',
  issueClaimChallenge: 'rpc_issue_claim_challenge',
  completeClaimProof: 'rpc_submit_claim_proof',
  convertClaim: 'rpc_convert_claim',
} as const;

const bodyValue = <T>(input: ProfilePortInput, key: string): T =>
  input.body?.[key] as T;

const pathValue = (input: ProfilePortInput, key: string): string =>
  input.path?.[key] as string;

const versionValue = (
  input: ProfilePortInput,
): Readonly<Record<string, string>> => {
  const version = expectedVersion(input.ifMatch);
  return version === undefined ? {} : { expectedVersion: version };
};

export const createProductionProfileOwnershipDependencies = (
  options: AuthProductionOptions,
): ProfileOwnershipDependencies => {
  const config = normalizeAuthProductionOptions(options);
  return {
    matchShadowParty: (input, _env, signal) =>
      commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.matchShadowParty,
        MatchResponseSchema,
        {
          partyId: bodyValue(input, 'partyId'),
          sourceDomain: bodyValue(input, 'sourceDomain'),
          sourceEntityId: bodyValue(input, 'sourceEntityId'),
          sourceVersion: bodyValue(input, 'sourceVersion'),
          roleCode: bodyValue(input, 'roleCode') ?? null,
          instrumentCode: bodyValue(input, 'instrumentCode') ?? null,
        },
      ),

    dispatchInvitation: (input, _env, signal) =>
      commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.dispatchInvitation,
        JobStatusSchema,
        {
          shadowId: pathValue(input, 'shadowId'),
          contactRouteId: bodyValue(input, 'contactRouteId'),
          trigger: bodyValue(input, 'trigger'),
          attesterPersonId: bodyValue(input, 'attesterPersonId') ?? null,
          ...versionValue(input),
        },
      ),

    submitRemedy: (input, _env, signal) => {
      const proof = bodyValue<Readonly<Record<string, unknown>>>(
        input,
        'proof',
      );
      return commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.submitRemedy,
        RemedyResourceSchema,
        {
          pointerToken: bodyValue(input, 'pointerToken'),
          action: bodyValue(input, 'action'),
          scope: bodyValue(input, 'scope'),
          proof,
        },
      );
    },

    startClaim: (input, _env, signal) =>
      commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.startClaim,
        ClaimResourceSchema,
        {
          targetPartyId: bodyValue(input, 'targetPartyId'),
          claimKind: bodyValue(input, 'claimKind'),
          ...versionValue(input),
        },
        replayFor(input, PROFILE_RPC.readClaim, 'id', 'claimId', 'PRF-API-05'),
      ),

    readClaim: (input, _env, signal) =>
      readRpc(
        config,
        input,
        signal,
        PROFILE_RPC.readClaim,
        ClaimResourceSchema,
        { claimId: pathValue(input, 'claimId') },
      ),

    issueClaimChallenge: (input, _env, signal) =>
      commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.issueClaimChallenge,
        ChallengeResourceSchema,
        {
          claimId: pathValue(input, 'claimId'),
          method: bodyValue(input, 'method'),
          routeId: bodyValue(input, 'routeId') ?? null,
          attesterPersonId: bodyValue(input, 'attesterPersonId') ?? null,
          ...versionValue(input),
        },
      ),

    completeClaimProof: (input, _env, signal) => {
      const proof = input.body ?? {};
      return commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.completeClaimProof,
        ClaimResourceSchema,
        {
          claimId: pathValue(input, 'claimId'),
          ...proof,
          ...versionValue(input),
        },
        replayFor(input, PROFILE_RPC.readClaim, 'id', 'claimId', 'PRF-API-05'),
      );
    },

    convertClaim: (input, _env, signal) =>
      commandRpc(
        config,
        input,
        signal,
        PROFILE_RPC.convertClaim,
        ClaimResourceSchema,
        {
          claimId: pathValue(input, 'claimId'),
          reasonCode: bodyValue(input, 'reasonCode'),
          ...versionValue(input),
        },
        replayFor(input, PROFILE_RPC.readClaim, 'id', 'claimId', 'PRF-API-05'),
      ),

    emitEvent: async (event) => {
      // Claim RPCs commit their outbox event atomically.  The route-level
      // sink validates the already-committed envelope without writing twice.
      const parsed = ProfileEventSchema.safeParse(event);
      if (!parsed.success) throw new Error('Invalid profile event.');
    },
  };
};
