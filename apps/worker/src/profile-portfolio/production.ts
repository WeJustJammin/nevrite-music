import { ProfilePortfolioEventSchema } from '@wejammin/contracts';
import type { ProfilePortfolioOperationId } from '@wejammin/contracts';

import {
  normalizeAuthProductionOptions,
  type AuthProductionOptions,
} from '../authentication/production-configuration';
import type { AuthenticationResult } from '../authentication/types';
import {
  commandRpc,
  expectedVersion,
  readRpc,
} from '../profile-ownership/production-request';
import type { ProfilePortInput } from '../profile-ownership/types';
import type {
  ProfilePortfolioDependencies,
  ProfilePortfolioPortInput,
} from './types';
import { profilePortfolioResponseSchemas } from './responses';

export const PROFILE_PORTFOLIO_RPC = {
  readPublicProfile: 'rpc_profile_public',
  readSectionRevisions: 'rpc_profile_section_revisions',
  putSection: 'rpc_profile_section_put',
  putEmphasis: 'rpc_profile_emphasis_put',
  readPortfolio: 'rpc_profile_portfolio',
  readReel: 'rpc_profile_reel',
  createReelItem: 'rpc_reel_item_create',
  updateReelItem: 'rpc_reel_item_update',
  removeReelItem: 'rpc_reel_item_remove',
  ingestProfileFactObservation: 'rpc_profile_fact_observation_ingest',
  readEmphasis: 'rpc_profile_emphasis_read',
} as const;

const bodyValue = <T>(input: ProfilePortfolioPortInput, key: string): T =>
  input.body?.[key] as T;
const pathValue = (input: ProfilePortfolioPortInput, key: string): string =>
  input.path?.[key] as string;
const queryValue = <T>(input: ProfilePortfolioPortInput, key: string): T =>
  input.query?.[key] as T;
const versionValue = (
  input: ProfilePortfolioPortInput,
): Readonly<Record<string, string>> => {
  const version = expectedVersion(input.ifMatch);
  return version === undefined ? {} : { expectedVersion: version };
};

const asProfilePortInput = (
  input: ProfilePortfolioPortInput,
): ProfilePortInput => input as unknown as ProfilePortInput;

const normalizeFailure = <T>(
  result: AuthenticationResult<T>,
): AuthenticationResult<T> => {
  if (result.ok) return result;
  if (result.code === 'CONFLICT')
    return { ...result, code: 'VERSION_CONFLICT' };
  if (result.code === 'IDEMPOTENCY_MISMATCH')
    return { ...result, code: 'IDEMPOTENCY_CONFLICT' };
  if (result.code === 'DEPENDENCY_TIMEOUT')
    return { ...result, code: 'TIMEOUT' };
  return result;
};

const invoke = async <T>(
  operation: Promise<AuthenticationResult<T>>,
): Promise<AuthenticationResult<T>> => normalizeFailure(await operation);

const read = (
  config: ReturnType<typeof normalizeAuthProductionOptions>,
  input: ProfilePortfolioPortInput,
  signal: AbortSignal,
  operationId: Exclude<ProfilePortfolioOperationId, `PRF-EPK-${string}`>,
  rpc: string,
  body: Readonly<Record<string, unknown>>,
) =>
  invoke(
    readRpc(
      config,
      asProfilePortInput(input),
      signal,
      rpc,
      profilePortfolioResponseSchemas[operationId],
      body,
    ),
  );

const command = (
  config: ReturnType<typeof normalizeAuthProductionOptions>,
  input: ProfilePortfolioPortInput,
  signal: AbortSignal,
  operationId: Exclude<ProfilePortfolioOperationId, `PRF-EPK-${string}`>,
  rpc: string,
  body: Readonly<Record<string, unknown>>,
) =>
  invoke(
    commandRpc(
      config,
      asProfilePortInput(input),
      signal,
      rpc,
      profilePortfolioResponseSchemas[operationId],
      body,
    ),
  );

const boundedObservation = async (
  input: ProfilePortfolioPortInput,
): Promise<Readonly<Record<string, unknown>>> => {
  const payload = bodyValue<unknown>(input, 'payload');
  const payloadDigest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const digest = [...new Uint8Array(payloadDigest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return {
    operationId: input.operationId,
    messageId: bodyValue(input, 'messageId'),
    producer: bodyValue(input, 'producer'),
    partyId: bodyValue(input, 'partyId'),
    fact: bodyValue(input, 'fact'),
    provenanceState: bodyValue(input, 'provenanceState'),
    evidenceClass: bodyValue(input, 'evidenceClass'),
    evidenceCount: bodyValue(input, 'evidenceCount'),
    visibility: bodyValue(input, 'visibility'),
    embargoUntil: bodyValue(input, 'embargoUntil'),
    listingState: bodyValue(input, 'listingState'),
    disputeState: bodyValue(input, 'disputeState'),
    occurredOn: bodyValue(input, 'occurredOn'),
    roleCodes: bodyValue(input, 'roleCodes'),
    observedAt: bodyValue(input, 'observedAt'),
    payloadDigest: digest,
  };
};

export const createProductionProfilePortfolioDependencies = (
  options: AuthProductionOptions,
): ProfilePortfolioDependencies => {
  const config = normalizeAuthProductionOptions(options);
  return {
    readPublicProfile: (input, _env, signal) =>
      read(
        config,
        input,
        signal,
        'PRF-PROF-01',
        PROFILE_PORTFOLIO_RPC.readPublicProfile,
        {
          partyId: pathValue(input, 'partyId'),
          locale: queryValue<string>(input, 'locale') ?? 'en',
        },
      ),
    readSectionRevisions: (input, _env, signal) =>
      read(
        config,
        input,
        signal,
        'PRF-PROF-02',
        PROFILE_PORTFOLIO_RPC.readSectionRevisions,
        {
          partyId: pathValue(input, 'partyId'),
          sectionCode: pathValue(input, 'sectionCode'),
          cursor: queryValue<string | undefined>(input, 'cursor') ?? null,
          limit: queryValue<number>(input, 'limit') ?? 25,
        },
      ),
    putSection: (input, _env, signal) =>
      command(
        config,
        input,
        signal,
        'PRF-PROF-03',
        PROFILE_PORTFOLIO_RPC.putSection,
        {
          partyId: pathValue(input, 'partyId'),
          sectionCode: pathValue(input, 'sectionCode'),
          ...input.body,
          ...versionValue(input),
        },
      ),
    putEmphasis: (input, _env, signal) =>
      command(
        config,
        input,
        signal,
        'PRF-PROF-04',
        PROFILE_PORTFOLIO_RPC.putEmphasis,
        {
          partyId: pathValue(input, 'partyId'),
          ...input.body,
          ...versionValue(input),
        },
      ),
    readPortfolio: (input, _env, signal) =>
      read(
        config,
        input,
        signal,
        'PRF-PROF-05',
        PROFILE_PORTFOLIO_RPC.readPortfolio,
        {
          partyId: pathValue(input, 'partyId'),
          cursor: queryValue<string | undefined>(input, 'cursor') ?? null,
          limit: queryValue<number>(input, 'limit') ?? 25,
          roleCode: queryValue<string | undefined>(input, 'roleCode') ?? null,
          from: queryValue<string | undefined>(input, 'from') ?? null,
          to: queryValue<string | undefined>(input, 'to') ?? null,
        },
      ),
    readReel: (input, _env, signal) =>
      read(
        config,
        input,
        signal,
        'PRF-PROF-06',
        PROFILE_PORTFOLIO_RPC.readReel,
        {
          partyId: pathValue(input, 'partyId'),
          cursor: queryValue<string | undefined>(input, 'cursor') ?? null,
          limit: queryValue<number>(input, 'limit') ?? 25,
          includeInactive:
            queryValue<string | undefined>(input, 'includeInactive') === 'true',
        },
      ),
    createReelItem: (input, _env, signal) =>
      command(
        config,
        input,
        signal,
        'PRF-PROF-07',
        PROFILE_PORTFOLIO_RPC.createReelItem,
        {
          partyId: pathValue(input, 'partyId'),
          ...input.body,
          ...versionValue(input),
        },
      ),
    updateReelItem: (input, _env, signal) =>
      command(
        config,
        input,
        signal,
        'PRF-PROF-08',
        PROFILE_PORTFOLIO_RPC.updateReelItem,
        {
          reelItemId: pathValue(input, 'reelItemId'),
          ...input.body,
          ...versionValue(input),
        },
      ),
    removeReelItem: (input, _env, signal) =>
      command(
        config,
        input,
        signal,
        'PRF-PROF-09',
        PROFILE_PORTFOLIO_RPC.removeReelItem,
        {
          reelItemId: pathValue(input, 'reelItemId'),
          ...input.body,
          ...versionValue(input),
        },
      ),
    ingestProfileFactObservation: async (input, _env, signal) =>
      command(
        config,
        input,
        signal,
        'PRF-PROF-10',
        PROFILE_PORTFOLIO_RPC.ingestProfileFactObservation,
        await boundedObservation(input),
      ),
    readEmphasis: (input, _env, signal) =>
      read(
        config,
        input,
        signal,
        'PRF-PROF-11',
        PROFILE_PORTFOLIO_RPC.readEmphasis,
        {
          partyId: pathValue(input, 'partyId'),
          surface: queryValue<string>(input, 'surface'),
        },
      ),
    emitEvent: async (event) => {
      if (!ProfilePortfolioEventSchema.safeParse(event).success)
        throw new Error('Invalid profile portfolio event.');
      // Profile mutation RPCs append the outbox record transactionally.  The
      // route sink validates the committed envelope without writing twice.
    },
  };
};
