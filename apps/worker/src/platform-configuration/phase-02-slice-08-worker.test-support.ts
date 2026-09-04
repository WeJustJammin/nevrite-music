import {
  RequestContextSchema,
  type ApiError,
  type RequestContext,
} from '@wejammin/contracts';
import { createLogger } from '@wejammin/observability/logging';
import { vi } from 'vitest';

import { createWorkerApp } from '../index';
import type {
  AuthenticationError,
  AuthenticationResult,
  AuthenticationSession,
  AuthRateLimitDecision,
} from '../authentication/types';
import type { WorkerBindings } from '../index';
import {
  ACTOR_ID,
  CORRELATION_ID,
  PARTY_ID,
  REQUEST_ID,
  auditReadResponse,
  bindings,
  capabilityActionResponse,
  inboxResponse,
} from './phase-02-slice-08-worker.fixtures';

export * from './phase-02-slice-08-worker.fixtures';
export {
  auditRequest,
  capabilityRequest,
  diagnosticRequest,
  expectApiError,
  inboxRequest,
  jsonRequest,
  request,
  telemetryEvents,
} from './phase-02-slice-08-worker.request-support';
export type { TestHeaders } from './phase-02-slice-08-worker.request-support';

export type AdminOperationId = 'CFG-05B-01' | 'CFG-05B-04' | 'CFG-05B-05';

/**
 * Boundary shape expected by the S08 Worker route adapter.  It is local to
 * RED support until the admin contract/production seam is locked.  Actor,
 * party, and capabilities are deliberately absent from the browser request
 * and are supplied by the verified request context in the harness.
 */
export type AdminWorkspacePortInput = Readonly<{
  operationId: AdminOperationId;
  request: Request;
  query?: Readonly<Record<string, unknown>>;
  body?: Readonly<Record<string, unknown>>;
  session: AuthenticationSession;
  requestContext: RequestContext;
  idempotencyKey?: string;
  ifMatch?: string;
}>;

export type AdminWorkspacePort = (
  input: AdminWorkspacePortInput,
  env: WorkerBindings,
  signal: AbortSignal,
) => Promise<AuthenticationResult<unknown>>;

export type AdminWorkspaceDependencies = Readonly<{
  readInbox: AdminWorkspacePort;
  capabilityAction: AdminWorkspacePort;
  auditDiagnostic: AdminWorkspacePort;
}>;

export const sessionFor = (): AuthenticationSession => ({
  authUserId: ACTOR_ID,
  sessionId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  accountState: 'active',
  personId: ACTOR_ID,
  actingPartyId: PARTY_ID,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  stepUpAt: new Date(Date.now() - 30 * 1000).toISOString(),
});

export const contextFor = (
  capabilities: readonly string[] = [
    'admin.inbox.read',
    'admin.capability.grant',
    'admin.audit.read',
    'admin.diagnostic.run',
  ],
): RequestContext =>
  RequestContextSchema.parse({
    requestId: REQUEST_ID,
    correlationId: CORRELATION_ID,
    causationId: null,
    traceId: 'trace-slice-08-worker',
    userId: ACTOR_ID,
    actingPartyId: PARTY_ID,
    capabilities,
    locale: 'en-US',
    clientVersion: 'slice-08-worker-red',
  });

const unavailable = (): AuthenticationError => ({
  ok: false,
  status: 503,
  code: 'DEPENDENCY_UNAVAILABLE',
  message: 'Admin workspace persistence is temporarily unavailable.',
  details: { dependencyClass: 'admin_workspace', retryable: true },
});

export const adminError = (
  status: AuthenticationError['status'],
  code: string,
  message: string,
  details: ApiError['details'] = {},
): AuthenticationError => ({ ok: false, status, code, message, details });

export type HarnessOptions = Readonly<{
  inboxResult?: AuthenticationResult<unknown>;
  capabilityResult?: AuthenticationResult<unknown>;
  auditDiagnosticResult?: AuthenticationResult<unknown>;
  session?: AuthenticationSession;
  resolveSession?: AuthenticationResult<AuthenticationSession>;
  requestContext?: RequestContext | null;
  rateLimit?: AuthenticationResult<AuthRateLimitDecision>;
  rateLimitThrows?: boolean;
}>;

export type Harness = Readonly<{
  app: ReturnType<typeof createWorkerApp>;
  ports: {
    inbox: ReturnType<typeof vi.fn>;
    capabilityAction: ReturnType<typeof vi.fn>;
    auditDiagnostic: ReturnType<typeof vi.fn>;
  };
  auth: {
    resolveSession: ReturnType<typeof vi.fn>;
    rateLimit: ReturnType<typeof vi.fn>;
  };
  lines: string[];
  session: AuthenticationSession;
  requestContext: RequestContext | null;
  resolveRequestContext: ReturnType<typeof vi.fn>;
}>;

const allowedRate = (): AuthenticationResult<AuthRateLimitDecision> => ({
  ok: true,
  value: {
    allowed: true,
    limit: 1_000,
    remaining: 999,
    resetAt: Math.floor(Date.now() / 1000) + 300,
  },
});

export const makeHarness = (options: HarnessOptions = {}): Harness => {
  const session = options.session ?? sessionFor();
  const requestContext = options.requestContext ?? contextFor();
  const lines: string[] = [];
  const ports = {
    inbox: vi.fn<AdminWorkspacePort>(
      async () =>
        options.inboxResult ?? { ok: true as const, value: inboxResponse },
    ),
    capabilityAction: vi.fn<AdminWorkspacePort>(
      async () =>
        options.capabilityResult ?? {
          ok: true as const,
          value: capabilityActionResponse,
        },
    ),
    auditDiagnostic: vi.fn<AdminWorkspacePort>(
      async () =>
        options.auditDiagnosticResult ?? {
          ok: true as const,
          value: auditReadResponse,
        },
    ),
  };
  const auth = {
    resolveSession: vi.fn(
      async () =>
        options.resolveSession ?? { ok: true as const, value: session },
    ),
    rateLimit: vi.fn(async () => {
      if (options.rateLimitThrows) throw new Error('rate limiter unavailable');
      return options.rateLimit ?? allowedRate();
    }),
  };
  const resolveRequestContext = vi.fn(async () => requestContext);
  const legacyPort = vi.fn(async () => unavailable());
  const adminWorkspace: AdminWorkspaceDependencies = {
    readInbox: ports.inbox,
    capabilityAction: ports.capabilityAction,
    auditDiagnostic: ports.auditDiagnostic,
  };

  // Keep both likely composition names in the RED fixture.  The active
  // implementation must choose one explicit server-owned seam; neither can
  // be satisfied by browser role/capability headers.
  const platformConfiguration = {
    registerDefinition: legacyPort,
    resolveEffectiveValue: legacyPort,
    proposeChange: legacyPort,
    changeAction: legacyPort,
    readInbox: ports.inbox,
    adminInbox: ports.inbox,
    capabilityAction: ports.capabilityAction,
    grantCapability: ports.capabilityAction,
    auditDiagnostic: ports.auditDiagnostic,
    inspectAuditDiagnostic: ports.auditDiagnostic,
  };

  const app = createWorkerApp({
    auth: auth as never,
    captureException: () => undefined,
    createLogger: () =>
      createLogger(
        {
          environment: bindings.APP_ENVIRONMENT,
          release: bindings.APP_RELEASE,
          service: 'wejammin-api',
        },
        { random: () => 0, sink: (line) => lines.push(line) },
      ),
    now: () => Date.now(),
    resolveRequestContext,
    platformConfiguration: platformConfiguration as never,
    adminWorkspace: adminWorkspace as never,
  } as never);
  return {
    app,
    ports,
    auth,
    lines,
    session,
    requestContext,
    resolveRequestContext,
  };
};
