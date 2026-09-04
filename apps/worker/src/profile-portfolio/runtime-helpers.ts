import type { ProfilePortfolioOperationId } from '@wejammin/contracts';

import type { AuthenticationError } from '../authentication/types';
import type {
  ProfilePortfolioDependencies,
  ProfilePortfolioPortInput,
} from './types';

export type ActiveProfilePortfolioOperation = Extract<
  ProfilePortfolioOperationId,
  `PRF-PROF-${string}`
>;
export type ProfilePortfolioPortName = Exclude<
  keyof ProfilePortfolioDependencies,
  'emitEvent'
>;
export type Outcome =
  | (Readonly<{ ok: true; value: unknown }> &
      Readonly<{ status: 200 | 201 | 202 }>)
  | AuthenticationError;

const statuses: Readonly<
  Record<ActiveProfilePortfolioOperation, 200 | 201 | 202>
> = {
  'PRF-PROF-01': 200,
  'PRF-PROF-02': 200,
  'PRF-PROF-03': 200,
  'PRF-PROF-04': 200,
  'PRF-PROF-05': 200,
  'PRF-PROF-06': 200,
  'PRF-PROF-07': 201,
  'PRF-PROF-08': 200,
  'PRF-PROF-09': 200,
  'PRF-PROF-10': 202,
  'PRF-PROF-11': 200,
};

const cacheControls: Readonly<Record<ActiveProfilePortfolioOperation, string>> =
  {
    'PRF-PROF-01': 'public, max-age=60, stale-if-error=300',
    'PRF-PROF-02': 'private, no-store',
    'PRF-PROF-03': 'private, no-store',
    'PRF-PROF-04': 'private, no-store',
    'PRF-PROF-05': 'public, max-age=60',
    'PRF-PROF-06': 'public, max-age=60',
    'PRF-PROF-07': 'private, no-store',
    'PRF-PROF-08': 'private, no-store',
    'PRF-PROF-09': 'private, no-store',
    'PRF-PROF-10': 'private, no-store',
    'PRF-PROF-11': 'private, no-store',
  };

export const statusFor = (operationId: ActiveProfilePortfolioOperation) =>
  statuses[operationId];
export const cacheFor = (operationId: ActiveProfilePortfolioOperation) =>
  cacheControls[operationId];

const stable = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stable);
  if (typeof value !== 'object' || value === null) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stable(child)]),
  );
};

export const fingerprint = (input: ProfilePortfolioPortInput): string =>
  JSON.stringify(
    stable({
      operationId: input.operationId,
      path: input.path ?? {},
      query: input.query ?? {},
      body: input.body ?? {},
      ifMatch: input.ifMatch ?? null,
    }),
  );

export const replayKey = (input: ProfilePortfolioPortInput): string =>
  `${input.operationId}|${input.session?.authUserId ?? 'anonymous'}|${input.idempotencyKey ?? ''}`;

export const cloneableErrorResponse = (response: Response): Response => {
  const snapshot = response.clone();
  const body = snapshot
    .clone()
    .text()
    .then((text) => JSON.parse(text) as unknown);
  Object.defineProperty(response, 'json', {
    configurable: true,
    value: () => body,
  });
  Object.defineProperty(response, 'clone', {
    configurable: true,
    value: () => snapshot.clone(),
  });
  return response;
};
