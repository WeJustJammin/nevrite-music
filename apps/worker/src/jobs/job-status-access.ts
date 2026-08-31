import {
  JobStatusDependencyError,
  type JobOperatorAuditEvent,
  type JobStatusDependencies,
  type JobStatusPrincipal,
  type JobStatusRecord,
} from './job-status-types';
import {
  dependencyError,
  notFoundError,
  unauthenticatedError,
  type JobError,
} from './job-status-support';

export const currentTimeMs = (dependencies: JobStatusDependencies): number => {
  const value = dependencies.now?.() ?? Date.now();
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new JobStatusDependencyError();
  }
  return value;
};

const auditOperator = async (
  dependencies: JobStatusDependencies,
  principal: Extract<JobStatusPrincipal, { kind: 'operator' }>,
  jobId: string,
  requestId: string,
  decision: JobOperatorAuditEvent['decision'],
  reason: string,
  signal: AbortSignal,
): Promise<void> => {
  if (dependencies.auditOperatorAccess === undefined) {
    throw new JobStatusDependencyError('Operator audit port is not configured');
  }
  await dependencies.auditOperatorAccess({
    actorId: principal.userId,
    actingPartyId: principal.actingPartyId,
    decision,
    jobId,
    reason,
    requestId,
    signal,
  });
};

export const authorizeJobStatus = async (
  dependencies: JobStatusDependencies,
  principal: JobStatusPrincipal,
  job: JobStatusRecord,
  jobId: string,
  requestId: string,
  signal: AbortSignal = new AbortController().signal,
): Promise<JobError | null> => {
  switch (principal.kind) {
    case 'user':
      return principal.userId === job.actorId ? null : notFoundError();
    case 'acting_party':
      return principal.actingPartyId === job.actingPartyId &&
        principal.capabilities.includes('jobs.read')
        ? null
        : notFoundError();
    case 'operator': {
      const allowed =
        principal.stepUpVerified &&
        principal.capabilities.includes('jobs.read:any') &&
        principal.reason !== null &&
        principal.reason.trim().length >= 3;
      if (!allowed) {
        try {
          await auditOperator(
            dependencies,
            principal,
            jobId,
            requestId,
            'deny',
            'operator_prerequisite_missing',
            signal,
          );
        } catch {
          return dependencyError();
        }
        return notFoundError();
      }
      try {
        await auditOperator(
          dependencies,
          principal,
          jobId,
          requestId,
          'allow',
          principal.reason as string,
          signal,
        );
      } catch {
        return dependencyError();
      }
      return null;
    }
    case 'anonymous':
      return unauthenticatedError();
    case 'queue':
    case 'webhook':
    case 'deployment':
    case 'service':
      return notFoundError();
  }
};
