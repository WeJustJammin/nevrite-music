import { OfflineIntentSchema, QuotedVersionSchema } from '@wejammin/contracts';

import type {
  OfflineReconciliationDecision,
  OfflineReconciliationInput,
} from './types.ts';

const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const refuse = (
  reason: Extract<OfflineReconciliationDecision, { kind: 'refuse' }>['reason'],
): OfflineReconciliationDecision => ({
  canonicalWrite: false,
  kind: 'refuse',
  preserveIntent: true,
  reason,
  retryable: true,
});

export const reconcileOfflineIntent = (
  input: OfflineReconciliationInput,
): OfflineReconciliationDecision => {
  const parsedIntent = OfflineIntentSchema.safeParse(input.intent);
  if (!parsedIntent.success || input.operationId === null) {
    return refuse('INVALID_INTENT');
  }
  if (!UuidPattern.test(input.operationId)) {
    return refuse('INVALID_INTENT');
  }
  if (parsedIntent.data.state === 'accepted') {
    return { kind: 'noop', preserveIntent: true, reason: 'ALREADY_ACCEPTED' };
  }
  if (parsedIntent.data.state === 'refused') {
    return { kind: 'noop', preserveIntent: true, reason: 'ALREADY_REFUSED' };
  }
  if (parsedIntent.data.state === 'pending_manual_review') {
    return {
      canonicalWrite: false,
      kind: 'noop',
      preserveIntent: true,
      reason: 'PENDING_MANUAL_REVIEW',
      replayable: false,
    };
  }
  if (input.identity === 'expired') {
    return { kind: 'reauthenticate', preserveIntent: true, retryable: true };
  }
  if (input.identity !== 'authenticated') return refuse('UNAUTHENTICATED');

  const hasTarget = parsedIntent.data.targetId !== null;
  if (hasTarget && !input.targetExists) return refuse('TARGET_NOT_FOUND');
  if (!input.authorized) return refuse('FORBIDDEN');
  if (
    (hasTarget && parsedIntent.data.expectedVersion === null) ||
    (!hasTarget &&
      (parsedIntent.data.expectedVersion !== null ||
        input.currentVersion !== null))
  ) {
    return refuse('INVALID_INTENT');
  }
  if (hasTarget && parsedIntent.data.expectedVersion !== null) {
    const expected = QuotedVersionSchema.safeParse(
      parsedIntent.data.expectedVersion,
    );
    const current =
      input.currentVersion === null
        ? null
        : QuotedVersionSchema.safeParse(input.currentVersion);
    if (!expected.success || current === null || !current.success) {
      return refuse('VERSION_MISMATCH');
    }
    if (expected.data !== current.data) return refuse('VERSION_MISMATCH');
  }
  if (!input.payloadHashMatches) return refuse('CONTENT_MISMATCH');
  return {
    canonicalWrite: true,
    intent: parsedIntent.data,
    kind: 'accept',
    operationId: input.operationId,
  };
};
