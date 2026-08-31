import {
  createRequestId,
  type HighRiskServerAuthority,
  type InfrastructureCommand,
  type ProtectedCommandHeaders,
  type VerifiedSession,
} from '@wejammin/contracts';

import {
  executeProtectedCommand,
  type ProtectedCommandClassification,
  type ProtectedCommandDecision,
  type ProtectedCommandPorts,
  type ProtectedCommandResolution,
  type ProtectedCommandTarget,
} from '@wejammin/application/infrastructure/security';
import {
  boundaryErrorResponse,
  parseAuthenticatedReadRequest,
  parseProtectedCommandRequest,
  parsePublicReadRequest,
  verifyBrowserMutationSecurity,
  type BrowserMutationSecurityPolicy,
  type ProtectedCommandRequest,
  type RequestBoundaryResult,
} from './request-boundary';
import {
  addOriginVary,
  browserSecurityFailure,
  dependencyFailure,
  protectedDecisionResponse,
} from './infrastructure-security-response';

type MaybePromise<T> = T | Promise<T>;

export {
  evaluateAuthenticatedRead,
  evaluatePublicRead,
  executeProtectedCommand,
} from '@wejammin/application/infrastructure/security';

export {
  boundaryErrorResponse,
  createSafeErrorResponse,
  parseAuthenticatedReadRequest,
  parseProtectedCommandRequest,
  parsePublicReadRequest,
  validateRequestBeforeAuth,
  verifyBrowserMutationSecurity,
  withNoStore,
} from './request-boundary';

export type ProtectedCommandResolutionInput = Readonly<{
  request: Request;
  session: VerifiedSession;
  command: InfrastructureCommand;
}>;

export type ProtectedCommandHashInput = Readonly<{
  request: Request;
  session: VerifiedSession;
  authority: HighRiskServerAuthority;
  target: ProtectedCommandTarget;
  command: InfrastructureCommand;
  headers: ProtectedCommandHeaders;
  classification: ProtectedCommandClassification;
}>;

export type WorkerInfrastructureSecurityDependencies = Readonly<
  {
    /** Returns only a server-verified, non-revoked session or null. */
    verifySession: (request: Request) => MaybePromise<VerifiedSession | null>;
    /** Trusted server clock; no request timestamp is accepted. */
    now: () => MaybePromise<number>;
    /** Resolves authority and target through server state/RLS. */
    resolveAuthorityAndTarget: (
      input: ProtectedCommandResolutionInput,
    ) => MaybePromise<ProtectedCommandResolution>;
    /** Classifies risk and required capability from server-side facts. */
    classifyOperationRisk: (
      input: Readonly<{
        request: Request;
        session: VerifiedSession;
        authority: HighRiskServerAuthority;
        target: ProtectedCommandTarget;
        command: InfrastructureCommand;
      }>,
    ) => MaybePromise<ProtectedCommandClassification | boolean>;
    /** Hashes canonical output and server facts, never raw request text. */
    calculateCanonicalHash: (
      input: ProtectedCommandHashInput,
    ) => MaybePromise<string>;
    /** Verified deployment origins plus the session-bound CSRF token. */
    browserMutationSecurity: BrowserMutationSecurityPolicy;
  } & Pick<
    ProtectedCommandPorts,
    'commitAtomically' | 'auditDenial' | 'recordAbuseSignal'
  >
>;

/**
 * Validates the complete command before invoking `verifySession`. A caller can
 * therefore not turn malformed input into an existence or authentication
 * oracle. All later data access is supplied through injected server ports.
 */
export const handleProtectedCommandRequest = async (
  request: Request,
  dependencies: WorkerInfrastructureSecurityDependencies,
): Promise<Response> => {
  const requestId = createRequestId(
    request.headers.get('x-request-id') ?? undefined,
  );
  const browserSecurity = verifyBrowserMutationSecurity(
    request,
    dependencies.browserMutationSecurity,
  );
  if (!browserSecurity.ok) return browserSecurityFailure(requestId);

  const boundary = await parseProtectedCommandRequest(request);
  if (!boundary.ok) return addOriginVary(boundaryErrorResponse(boundary));

  const securePorts: ProtectedCommandPorts = {
    auditDenial: dependencies.auditDenial,
    calculateCanonicalHash: (input) =>
      dependencies.calculateCanonicalHash({
        ...input,
        request,
      }),
    classifyOperationRisk: (input) =>
      dependencies.classifyOperationRisk({
        ...input,
        request,
      }),
    commitAtomically: dependencies.commitAtomically,
    now: dependencies.now,
    recordAbuseSignal: dependencies.recordAbuseSignal,
    resolveAuthorityAndTarget: (input) =>
      dependencies.resolveAuthorityAndTarget({
        ...input,
        request,
      }),
    verifySession: () => dependencies.verifySession(request),
  };

  let decision: ProtectedCommandDecision;
  try {
    decision = await executeProtectedCommand(
      {
        command: boundary.value.command,
        headers: boundary.value.headers,
      },
      securePorts,
    );
  } catch {
    return addOriginVary(dependencyFailure(boundary.requestId));
  }

  return addOriginVary(protectedDecisionResponse(boundary.requestId, decision));
};

export const validateBeforeAuth = parseProtectedCommandRequest;

export type PublicReadBoundary = ReturnType<typeof parsePublicReadRequest>;
export type AuthenticatedReadBoundary = ReturnType<
  typeof parseAuthenticatedReadRequest
>;
export type ProtectedCommandBoundary =
  RequestBoundaryResult<ProtectedCommandRequest>;
