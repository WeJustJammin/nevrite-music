import type {
  ActingContextBindingResponse,
  ActingContextListResource,
  AliasResponse,
  ApiError,
  FacetMutationResponse,
  PersonIdentityResponse,
  PublicPartyProjectionResponse,
  TransferOfferResponse,
} from '@wejammin/contracts';

import type { WorkerBindings } from '../index';
import type {
  AuthenticationResult,
  AuthenticationSession,
} from '../authentication/types';
import type { RelationshipAuthorityDependencies } from './relationship-dependencies';

export type {
  AcceptMembershipInput,
  AddCapacityPeriodInput,
  AddOrganizationTypeInput,
  AssertMembershipInput,
  CreateOrganizationInput,
  EndMembershipInput,
  InviteMembershipInput,
  ReadMembershipsInput,
  ReadOrganizationInput,
  RemoveOrganizationTypeInput,
} from './relationship-types';

type MaybePromise<T> = T | Promise<T>;

export type IdentityRequestInput = Readonly<{
  request: Request;
  session: AuthenticationSession;
  idempotencyKey: string;
  ifMatch: string | null;
}>;

export type CreatePersonInput = Readonly<{
  request: Request;
  session: AuthenticationSession;
  idempotencyKey: string;
}>;

export type AddFacetInput = IdentityRequestInput &
  Readonly<{ facetCode: string; source: 'self_asserted' }>;
export type RemoveFacetInput = IdentityRequestInput &
  Readonly<{ facetCode: string; ifMatch: string }>;
export type CreateAliasInput = IdentityRequestInput &
  Readonly<{
    displayName: string;
    handle: string;
    publicLinkState: 'private' | 'public';
  }>;
export type PatchAliasInput = IdentityRequestInput &
  Readonly<{
    aliasId: string;
    displayName?: string;
    publicLinkState?: 'private' | 'public';
    ifMatch: string;
  }>;
export type ChangeHandleInput = IdentityRequestInput &
  Readonly<{ aliasId: string; handle: string; ifMatch: string }>;
export type RetireAliasInput = IdentityRequestInput &
  Readonly<{ aliasId: string; ifMatch: string }>;
export type CreateTransferOfferInput = IdentityRequestInput &
  Readonly<{ aliasId: string; recipientPersonId: string }>;
export type TransferDecisionInput = IdentityRequestInput &
  Readonly<{ offerId: string; ifMatch: string }>;
export type ReadPersonInput = Readonly<{
  request: Request;
  session: AuthenticationSession;
}>;
export type ReadActingContextsInput = Readonly<{
  request: Request;
  session: AuthenticationSession;
  cursor: string | null;
}>;
export type BindActingContextInput = IdentityRequestInput &
  Readonly<{
    contextId: string;
    deliberateConfirmation: true;
    clientBindingId: string;
  }>;
export type ReadPublicProjectionInput = Readonly<{
  request: Request;
  partyId: string;
}>;

export type IdentityCommitResult =
  | Readonly<{
      kind: 'committed';
      status: 200 | 201 | 202;
      body: unknown;
      auditId?: string;
      outboxIds?: readonly string[];
    }>
  | Readonly<{
      kind: 'conflict';
      status: 409;
      code: string;
      details?: ApiError['details'];
    }>;

export type IdentityRecoveryInput = Readonly<{
  operationId: string;
  requestId: string;
  idempotencyKey?: string;
  ifMatch?: string | null;
  actorId?: string | null;
  aggregateId?: string | null;
  atomicWrites?: readonly ['canonical_state', 'audit', 'outbox', 'idempotency'];
}>;

export type IdentityRecoveryEvent = Readonly<{
  operationId: string;
  requestId: string;
  outcome: 'success' | 'failure' | 'reconciled';
  status: number;
  errorCode?: string;
}>;

export type IdentityRecoveryDependencies = Readonly<{
  commit: (input: IdentityRecoveryInput) => MaybePromise<IdentityCommitResult>;
  read: (input: IdentityRecoveryInput) => MaybePromise<IdentityCommitResult>;
  reconcile: (
    input: IdentityRecoveryInput,
  ) => MaybePromise<IdentityCommitResult | null>;
  telemetry: (event: IdentityRecoveryEvent) => MaybePromise<void>;
}>;

export type IdentityAuthorityDependencies = Readonly<{
  createPerson?: (
    input: CreatePersonInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<PersonIdentityResponse>>;
  readPerson?: (
    input: ReadPersonInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<PersonIdentityResponse>>;
  addFacet?: (
    input: AddFacetInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<FacetMutationResponse>>;
  removeFacet?: (
    input: RemoveFacetInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<FacetMutationResponse>>;
  createAlias?: (
    input: CreateAliasInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<AliasResponse>>;
  patchAlias?: (
    input: PatchAliasInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<AliasResponse>>;
  changeHandle?: (
    input: ChangeHandleInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<AliasResponse>>;
  retireAlias?: (
    input: RetireAliasInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<AliasResponse>>;
  createTransferOffer?: (
    input: CreateTransferOfferInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<TransferOfferResponse>>;
  acceptTransferOffer?: (
    input: TransferDecisionInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<AliasResponse>>;
  declineTransferOffer?: (
    input: TransferDecisionInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<TransferOfferResponse>>;
  readActingContexts?: (
    input: ReadActingContextsInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<ActingContextListResource>>;
  bindActingContext?: (
    input: BindActingContextInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<ActingContextBindingResponse>>;
  readPublicProjection?: (
    input: ReadPublicProjectionInput,
    env: WorkerBindings,
    signal: AbortSignal,
  ) => Promise<AuthenticationResult<PublicPartyProjectionResponse>>;
  commit?: IdentityRecoveryDependencies['commit'];
  read?: IdentityRecoveryDependencies['read'];
  reconcile?: IdentityRecoveryDependencies['reconcile'];
  telemetry?: IdentityRecoveryDependencies['telemetry'];
}> &
  RelationshipAuthorityDependencies;

export type IdentityPortName =
  | 'createPerson'
  | 'readPerson'
  | 'addFacet'
  | 'removeFacet'
  | 'createAlias'
  | 'patchAlias'
  | 'changeHandle'
  | 'retireAlias'
  | 'createTransferOffer'
  | 'acceptTransferOffer'
  | 'declineTransferOffer'
  | 'readActingContexts'
  | 'bindActingContext'
  | 'readPublicProjection'
  | 'createOrganization'
  | 'readOrganization'
  | 'addOrganizationType'
  | 'removeOrganizationType'
  | 'inviteMembership'
  | 'assertMembership'
  | 'acceptMembership'
  | 'endMembership'
  | 'addCapacityPeriod'
  | 'readMemberships';
