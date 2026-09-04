import { authError } from '../authentication/boundary';
import type { AuthenticationError } from '../authentication/types';

type ProfileConflict = Readonly<{
  code: string;
  message: string;
  recoveryAction: string;
}>;

const conflicts: readonly ProfileConflict[] = [
  {
    code: 'CHALLENGE_EXPIRED',
    message: 'The proof challenge expired; issue a new challenge.',
    recoveryAction: 'issue_new_challenge',
  },
  {
    code: 'CHALLENGE_INVALID',
    message: 'The proof challenge is not valid; issue a new challenge.',
    recoveryAction: 'issue_new_challenge',
  },
  {
    code: 'CHALLENGE_ALREADY_USED',
    message: 'The proof challenge was already used; issue a new challenge.',
    recoveryAction: 'issue_new_challenge',
  },
  {
    code: 'PROOF_REJECTED',
    message: 'The proof was rejected; check the code and try again.',
    recoveryAction: 'retry_with_remaining_attempts',
  },
  {
    code: 'PROOF_ATTEMPTS_EXHAUSTED',
    message: 'The proof attempts were exhausted; issue a new challenge.',
    recoveryAction: 'issue_new_challenge',
  },
] as const;

const asRecord = (value: unknown): Readonly<Record<string, unknown>> | null =>
  typeof value === 'object' && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : null;

const normalize = (value: unknown): unknown =>
  Array.isArray(value) && value.length === 1 ? value[0] : value;

const candidates = (value: unknown): readonly string[] => {
  const record = asRecord(value);
  const nested = record === null ? null : asRecord(record.error);
  return [
    record?.errorCode,
    record?.code,
    record?.message,
    nested?.code,
    nested?.errorCode,
    nested?.message,
  ].filter((candidate): candidate is string => typeof candidate === 'string');
};

const conflictFor = (
  value: unknown,
): Readonly<{
  conflict: ProfileConflict;
  attemptsRemaining?: number;
}> | null => {
  const normalized = normalize(value);
  const match = conflicts.find(({ code }) =>
    candidates(normalized).some((candidate) =>
      candidate.toUpperCase().includes(code),
    ),
  );
  if (match === undefined) return null;
  const record = asRecord(normalized);
  const attemptsRemaining = record?.attemptsRemaining;
  return {
    conflict: match,
    ...(typeof attemptsRemaining === 'number' &&
    Number.isInteger(attemptsRemaining) &&
    attemptsRemaining >= 0 &&
    attemptsRemaining <= 5
      ? { attemptsRemaining }
      : {}),
  };
};

const toError = (
  value: Readonly<{ conflict: ProfileConflict; attemptsRemaining?: number }>,
): AuthenticationError =>
  authError(409, 'CONFLICT', value.conflict.message, {
    conflict: value.conflict.code,
    recoveryAction: value.conflict.recoveryAction,
    ...(value.attemptsRemaining === undefined
      ? {}
      : { attemptsRemaining: value.attemptsRemaining }),
  });

/** Maps known profile proof errors from a PostgREST error envelope. */
export const profileRpcConflictFailure = (
  value: unknown,
): AuthenticationError | null => {
  const conflict = conflictFor(value);
  return conflict === null ? null : toError(conflict);
};

/** Maps a committed proof-failure sentinel without treating it as bad JSON. */
export const profileApplicationFailure = (
  value: unknown,
): AuthenticationError | null => {
  const normalized = normalize(value);
  const record = asRecord(normalized);
  if (record?.accepted !== false) return null;
  const conflict = conflictFor(normalized);
  return conflict === null ? null : toError(conflict);
};
