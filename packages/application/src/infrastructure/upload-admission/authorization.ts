import { QuotedVersionSchema } from '@wejammin/contracts';

import type {
  UploadAdmissionUseCaseInput,
  UploadAdmissionError,
  UploadAuthorization,
} from './types.ts';
import { UUID_PATTERN } from './constants.ts';
import { error } from './errors.ts';

export const isSession = (
  value: UploadAdmissionUseCaseInput['session'],
): value is NonNullable<UploadAdmissionUseCaseInput['session']> =>
  typeof value === 'object' &&
  value !== null &&
  UUID_PATTERN.test(value.userId);

export const mapAuthorization = (
  decision: Extract<UploadAuthorization, { kind: 'allow' }>,
  sessionUserId: string,
): UploadAdmissionError | null => {
  if (
    !UUID_PATTERN.test(decision.actorId) ||
    decision.actorId !== sessionUserId ||
    !UUID_PATTERN.test(decision.actingPartyId) ||
    (decision.targetVersion !== null &&
      !QuotedVersionSchema.safeParse(decision.targetVersion).success)
  ) {
    return error('INTERNAL_ERROR', 500, 'Authorization could not be verified.');
  }
  return null;
};
