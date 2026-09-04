import type { ProfileEvent, ProfileOperationId } from '@wejammin/contracts';

import type { AuthenticationError } from '../authentication/types';
import type { ProfileOwnershipDependencies } from './types';

export type ActiveOperation = Extract<
  ProfileOperationId,
  `PRF-API-0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`
>;
export type ActivePortName = Exclude<
  keyof ProfileOwnershipDependencies,
  'emitEvent'
>;
export type Outcome =
  | Readonly<{
      ok: true;
      value: unknown;
      status: 200 | 201 | 202;
      event?: ProfileEvent;
    }>
  | Readonly<{ ok: false; error: AuthenticationError }>;
