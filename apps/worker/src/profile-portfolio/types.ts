import type {
  ProfilePortfolioEvent,
  ProfilePortfolioOperationId,
} from '@wejammin/contracts';

import type { WorkerBindings } from '../index';
import type {
  AuthenticationError,
  AuthenticationSession,
  AuthenticationResult,
} from '../authentication/types';

/**
 * Server-owned input for profile and portfolio use cases.  Browser supplied
 * values are limited to validated path, query and body values; actor and
 * acting-party identity always come from the resolved session.
 */
export type ProfilePortfolioPortInput = Readonly<{
  operationId: ProfilePortfolioOperationId;
  request: Request;
  body?: Readonly<Record<string, unknown>>;
  path?: Readonly<Record<string, string>>;
  query?: Readonly<Record<string, unknown>>;
  idempotencyKey?: string;
  ifMatch?: string;
  session?: AuthenticationSession;
}>;

export type ProfilePortfolioPort = (
  input: ProfilePortfolioPortInput,
  env: WorkerBindings,
  signal: AbortSignal,
) => Promise<AuthenticationResult<unknown>>;

export type ProfilePortfolioEventSink = (
  event: ProfilePortfolioEvent,
  env: WorkerBindings,
  signal: AbortSignal,
) => void | Promise<void>;

export type ProfilePortfolioDependencies = Readonly<{
  readPublicProfile: ProfilePortfolioPort;
  readSectionRevisions: ProfilePortfolioPort;
  putSection: ProfilePortfolioPort;
  putEmphasis: ProfilePortfolioPort;
  readPortfolio: ProfilePortfolioPort;
  readReel: ProfilePortfolioPort;
  createReelItem: ProfilePortfolioPort;
  updateReelItem: ProfilePortfolioPort;
  removeReelItem: ProfilePortfolioPort;
  ingestProfileFactObservation: ProfilePortfolioPort;
  readEmphasis: ProfilePortfolioPort;
  emitEvent: ProfilePortfolioEventSink;
}>;

export type ProfilePortfolioFailure = AuthenticationError;
