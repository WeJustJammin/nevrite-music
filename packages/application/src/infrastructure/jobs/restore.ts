import type { RestoreFenceDecision, RestoreFenceInput } from './types.ts';

export const evaluateRestoreFence = (
  input: RestoreFenceInput,
): RestoreFenceDecision => {
  if (input.expectedEpoch.trim() === '' || input.consumerEpoch === null) {
    return {
      externalEffects: false,
      kind: 'fenced',
      reason: 'MISSING_EPOCH',
    };
  }
  if (input.expectedEpoch !== input.consumerEpoch) {
    return {
      externalEffects: false,
      kind: 'fenced',
      reason: 'EPOCH_MISMATCH',
    };
  }
  if (!input.integrityVerified) {
    return {
      externalEffects: false,
      kind: 'fenced',
      reason: 'INTEGRITY_UNVERIFIED',
    };
  }
  if (!input.reconciliationComplete) {
    return {
      externalEffects: false,
      kind: 'fenced',
      reason: 'RECONCILIATION_INCOMPLETE',
    };
  }
  return { epoch: input.expectedEpoch, externalEffects: true, kind: 'open' };
};

export const canRunExternalEffect = (input: RestoreFenceInput): boolean =>
  evaluateRestoreFence(input).kind === 'open';
