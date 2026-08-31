import { JobStatusSchema } from '../../../../contracts/src/job-status.ts';
import {
  ObjectLifecycleStateSchema,
  StorageObjectMetadataSchema,
} from '../../../../contracts/src/upload-completion.ts';
import { PositiveBigintDecimalSchema } from '../../../../contracts/src/platform-events.ts';

import type {
  VerificationDecision,
  VerificationFinishInput,
  VerifyUploadedObjectInput,
  VerificationTarget,
} from './types.ts';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const signalFor = (input: VerifyUploadedObjectInput): AbortSignal =>
  input.signal ?? new AbortController().signal;

const metadataMatches = (
  expected: VerificationTarget['expected'],
  observed: VerificationTarget['expected'],
): boolean =>
  expected.objectKey === observed.objectKey &&
  expected.byteSize === observed.byteSize &&
  expected.mediaType === observed.mediaType &&
  expected.checksum.algorithm === observed.checksum.algorithm &&
  expected.checksum.value === observed.checksum.value;

const validTarget = (target: VerificationTarget): boolean =>
  UUID.test(target.id) &&
  UUID.test(target.jobId) &&
  PositiveBigintDecimalSchema.safeParse(target.version).success &&
  ObjectLifecycleStateSchema.safeParse(target.state).success &&
  StorageObjectMetadataSchema.safeParse(target.expected).success;

const resultFromFinish = (
  state: 'ready' | 'rejected' | 'quarantined',
  result: Awaited<
    ReturnType<
      NonNullable<
        VerifyUploadedObjectInput['persistence']['finishVerification']
      >
    >
  >,
): VerificationDecision => {
  if (result.kind === 'conflict')
    return { kind: 'retry', reason: 'cas_conflict' };
  if (result.kind === 'dependency_unavailable') {
    return { kind: 'retry', reason: 'persistence_unavailable' };
  }
  if (result.kind === 'noop') return { kind: 'noop', state: result.state };
  const job = JobStatusSchema.safeParse(result.job);
  if (
    !job.success ||
    !PositiveBigintDecimalSchema.safeParse(result.objectVersion).success
  ) {
    return { kind: 'retry', reason: 'invalid_canonical_state' };
  }
  return { kind: state, job: job.data, objectVersion: result.objectVersion };
};

const finishInput = (
  input: Readonly<{
    expectedVersion: string;
    jobId: string;
    nextState: 'ready' | 'rejected' | 'quarantined';
    objectId: string;
    signal: AbortSignal;
  }>,
): VerificationFinishInput => ({
  expectedVersion: input.expectedVersion,
  from: 'verifying',
  jobId: input.jobId,
  nextState: input.nextState,
  objectId: input.objectId,
  signal: input.signal,
});

/**
 * Reconciles one object from canonical `uploaded` state. Every state advance
 * is delegated to the persistence CAS port; a terminal object is a no-op.
 */
export const verifyUploadedObject = async (
  input: VerifyUploadedObjectInput,
): Promise<VerificationDecision> => {
  const signal = signalFor(input);
  if (!UUID.test(input.objectId)) return { kind: 'not_found' };

  let target: VerificationTarget | null;
  try {
    target = await input.persistence.readVerificationTarget({
      objectId: input.objectId,
      signal,
    });
  } catch {
    return { kind: 'retry', reason: 'persistence_unavailable' };
  }
  if (target === null) return { kind: 'not_found' };
  if (!validTarget(target) || target.id !== input.objectId) {
    return { kind: 'retry', reason: 'invalid_canonical_state' };
  }
  if (
    target.state === 'ready' ||
    target.state === 'rejected' ||
    target.state === 'quarantined'
  ) {
    return { kind: 'noop', state: target.state };
  }
  if (target.state === 'pending_upload') {
    return { kind: 'retry', reason: 'not_uploaded' };
  }

  let expectedVersion = target.version;
  if (target.state === 'uploaded') {
    let claim;
    try {
      claim = await input.persistence.claimVerification({
        expectedVersion: target.version,
        from: 'uploaded',
        objectId: target.id,
        signal,
        to: 'verifying',
      });
    } catch {
      return { kind: 'retry', reason: 'persistence_unavailable' };
    }
    if (claim.kind === 'conflict')
      return { kind: 'retry', reason: 'cas_conflict' };
    if (claim.kind === 'dependency_unavailable') {
      return { kind: 'retry', reason: 'persistence_unavailable' };
    }
    if (
      claim.expectedVersion !== target.version ||
      !PositiveBigintDecimalSchema.safeParse(claim.version).success
    ) {
      return { kind: 'retry', reason: 'invalid_canonical_state' };
    }
    expectedVersion = claim.version;
  }

  let observed;
  try {
    observed = await input.storage.observe({
      objectKey: target.expected.objectKey,
      signal,
    });
  } catch {
    return { kind: 'retry', reason: 'storage_unavailable' };
  }

  let nextState: 'ready' | 'rejected' | 'quarantined' = 'ready';
  let failed = false;
  if (observed === null) {
    nextState = 'quarantined';
    failed = true;
  } else {
    const parsed = StorageObjectMetadataSchema.safeParse(observed);
    if (!parsed.success || !metadataMatches(target.expected, parsed.data)) {
      nextState = 'quarantined';
      failed = true;
    } else if (input.policy !== undefined) {
      try {
        const policyResult = await input.policy.verify({
          objectId: target.id,
          observed: parsed.data,
          signal,
        });
        if (policyResult === 'reject') {
          nextState = 'rejected';
          failed = true;
        } else if (policyResult === 'quarantine') {
          nextState = 'quarantined';
          failed = true;
        }
      } catch {
        return { kind: 'retry', reason: 'storage_unavailable' };
      }
    }
  }

  const base = finishInput({
    expectedVersion,
    jobId: target.jobId,
    nextState,
    objectId: target.id,
    signal,
  });
  const finish: VerificationFinishInput = failed
    ? { ...base, errorCode: 'OBJECT_VERIFICATION_FAILED' }
    : base;
  let result;
  try {
    result = await input.persistence.finishVerification(finish);
  } catch {
    return { kind: 'retry', reason: 'persistence_unavailable' };
  }
  return resultFromFinish(nextState, result);
};

export const canConsumeObject = (state: unknown): state is 'ready' =>
  ObjectLifecycleStateSchema.safeParse(state).success && state === 'ready';

export const readReadyObject = async (
  input: Readonly<{
    objectId: string;
    persistence: VerifyUploadedObjectInput['persistence'];
    signal?: AbortSignal;
  }>,
): Promise<Readonly<{
  id: string;
  objectKey: string;
  state: 'ready';
  version: string;
}> | null> => {
  if (!UUID.test(input.objectId)) return null;
  let object;
  try {
    object = await input.persistence.readObject({
      objectId: input.objectId,
      signal: input.signal ?? new AbortController().signal,
    });
  } catch {
    return null;
  }
  if (
    object === null ||
    object.id !== input.objectId ||
    !canConsumeObject(object.state) ||
    !PositiveBigintDecimalSchema.safeParse(object.version).success
  ) {
    return null;
  }
  return {
    id: object.id,
    objectKey: object.objectKey,
    state: 'ready',
    version: object.version,
  };
};
