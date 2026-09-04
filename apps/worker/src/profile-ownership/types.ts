import type { ProfileEvent, ProfileOperationId } from '@wejammin/contracts';

import type { WorkerBindings } from '../index';
import type {
  AuthenticationResult,
  AuthenticationSession,
} from '../authentication/types';

/**
 * Server-owned input passed to a profile-ownership use case.  Browser values
 * are limited to the validated body/path; session, request metadata, and CAS
 * headers are supplied by the Worker boundary.
 */
export type ProfilePortInput = Readonly<{
  operationId: ProfileOperationId;
  request: Request;
  body?: Readonly<Record<string, unknown>>;
  path?: Readonly<Record<string, string>>;
  idempotencyKey?: string;
  ifMatch?: string;
  session?: AuthenticationSession;
}>;

export type ProfilePort = (
  input: ProfilePortInput,
  env: WorkerBindings,
  signal: AbortSignal,
) => Promise<AuthenticationResult<unknown>>;

export type ProfileEventSink = (
  event: ProfileEvent,
  env: WorkerBindings,
  signal: AbortSignal,
) => void | Promise<void>;

/** Dependencies injected by tests and by the production Supabase adapter. */
export type ProfileOwnershipDependencies = Readonly<{
  matchShadowParty: ProfilePort;
  dispatchInvitation: ProfilePort;
  submitRemedy: ProfilePort;
  startClaim: ProfilePort;
  readClaim: ProfilePort;
  issueClaimChallenge: ProfilePort;
  completeClaimProof: ProfilePort;
  convertClaim: ProfilePort;
  emitEvent: ProfileEventSink;
}>;
