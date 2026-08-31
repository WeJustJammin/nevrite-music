import { JobStatusSchema } from '@wejammin/contracts';

import type {
  JobReadDecision,
  JobReadInput,
  JobReadPrincipal,
} from './types.ts';

const UuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const OWNER_CAPABILITY = 'jobs.read';
const OPERATOR_CAPABILITY = 'jobs.read:any';

const notFound = (): JobReadDecision => ({
  cachePolicy: 'no-store',
  disclosureSafe: true,
  kind: 'not_found',
});

const isUuid = (value: string): boolean => UuidPattern.test(value);

const isValidTarget = (
  target: NonNullable<JobReadInput['target']>,
): boolean => {
  const parsedJob = JobStatusSchema.safeParse(target.job);
  return (
    parsedJob.success &&
    parsedJob.data.id === parsedJob.data.id.toLowerCase() &&
    isUuid(target.actorId) &&
    isUuid(target.actingPartyId)
  );
};

const isAuthenticatedPrincipal = (
  principal: Extract<JobReadPrincipal, { kind: 'authenticated' | 'operator' }>,
): boolean => isUuid(principal.userId);

export const evaluateJobRead = (input: JobReadInput): JobReadDecision => {
  if (input.target === null) return notFound();
  if (!isValidTarget(input.target)) return notFound();

  const { principal } = input;
  if (principal.kind === 'anonymous') {
    return {
      cachePolicy: 'no-store',
      disclosureSafe: true,
      kind: 'unauthenticated',
    };
  }

  if (
    principal.kind === 'authenticated' &&
    isAuthenticatedPrincipal(principal)
  ) {
    if (principal.userId === input.target.actorId) {
      return {
        authority: 'owner',
        cachePolicy: 'no-store',
        disclosure: 'full',
        kind: 'allow',
      };
    }
    if (
      principal.actingPartyId === input.target.actingPartyId &&
      principal.capabilities.includes(OWNER_CAPABILITY)
    ) {
      return {
        authority: 'acting_party',
        cachePolicy: 'no-store',
        disclosure: 'full',
        kind: 'allow',
      };
    }
    return notFound();
  }

  if (principal.kind === 'operator' && isAuthenticatedPrincipal(principal)) {
    if (!principal.capabilities.includes(OPERATOR_CAPABILITY)) {
      return notFound();
    }
    if (!principal.stepUpVerified) {
      return {
        cachePolicy: 'no-store',
        disclosureSafe: true,
        kind: 'forbidden',
        reason: 'STEP_UP_REQUIRED',
      };
    }
    if (!principal.auditReasonPresent) {
      return {
        cachePolicy: 'no-store',
        disclosureSafe: true,
        kind: 'forbidden',
        reason: 'AUDIT_REASON_REQUIRED',
      };
    }
    return {
      auditRequired: true,
      authority: 'operator',
      cachePolicy: 'no-store',
      disclosure: 'full',
      kind: 'allow',
    };
  }

  return notFound();
};
