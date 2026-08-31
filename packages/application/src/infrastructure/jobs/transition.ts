import { JobStateSchema, QuotedVersionSchema } from '@wejammin/contracts';

import type { JobTransitionDecision, JobTransitionInput } from './types.ts';

const MAX_VERSION = 9_223_372_036_854_775_807n;

const parseVersion = (value: string): bigint | null => {
  const parsed = QuotedVersionSchema.safeParse(value);
  if (!parsed.success) return null;
  return BigInt(parsed.data.slice(1, -1));
};

const reject = (
  reason: Extract<JobTransitionDecision, { kind: 'reject' }>['reason'],
): JobTransitionDecision => ({
  kind: 'reject',
  partialEffects: false,
  reason,
});

const isTerminal = (state: JobTransitionInput['currentState']): boolean =>
  state === 'succeeded' || state === 'failed' || state === 'cancelled';

const legalTransition = (input: JobTransitionInput): boolean => {
  if (input.currentState === 'queued') return input.nextState === 'running';
  if (input.nextState === 'queued') return input.retryable === true;
  if (input.nextState === 'failed') return input.retryable !== true;
  return input.nextState === 'succeeded' || input.nextState === 'cancelled';
};

export const evaluateJobTransition = (
  input: JobTransitionInput,
): JobTransitionDecision => {
  const currentState = JobStateSchema.safeParse(input.currentState);
  const nextState = JobStateSchema.safeParse(input.nextState);
  const expectedVersion = parseVersion(input.expectedVersion);
  const currentVersion = parseVersion(input.currentVersion);
  if (
    !currentState.success ||
    !nextState.success ||
    expectedVersion === null ||
    currentVersion === null
  ) {
    return reject('INVALID_VERSION');
  }
  if (expectedVersion !== currentVersion) return reject('VERSION_MISMATCH');
  if (isTerminal(currentState.data)) {
    return currentState.data === nextState.data
      ? { kind: 'noop', reason: 'ALREADY_TERMINAL' }
      : reject('TERMINAL_CLOSED');
  }
  if (
    !legalTransition({
      ...input,
      currentState: currentState.data,
      nextState: nextState.data,
    })
  ) {
    return input.currentState === 'running' && input.nextState === 'queued'
      ? reject('RETRY_NOT_ALLOWED')
      : reject('INVALID_TRANSITION');
  }
  if (currentVersion >= MAX_VERSION) return reject('INVALID_VERSION');
  return {
    kind: 'apply',
    nextState: nextState.data,
    nextVersion: `"${currentVersion + 1n}"`,
  };
};
