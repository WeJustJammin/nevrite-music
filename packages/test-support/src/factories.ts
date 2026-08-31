import type {
  AccessibilityFixture,
  ApiErrorFixture,
  BrowserEnvironmentFixture,
  ConsumerRegistryFixture,
  ContractFixture,
  E2eFixture,
  FixtureIds,
  HealthResponseFixture,
  IntegrationFixture,
  PerformanceFixture,
  ProviderRegistryFixture,
  ReadinessResponseFixture,
  RegistrySetFixture,
  RequestContextFixture,
  RetentionRegistryFixture,
  RouteRegistryFixture,
  SecurityFixture,
  ServerEnvironmentFixture,
  SloRegistryFixture,
  StructuredLogFixture,
} from './types.ts';

const IDS: FixtureIds = Object.freeze({
  requestId: '11111111-1111-4111-8111-111111111111',
  correlationId: '22222222-2222-4222-8222-222222222222',
  causationId: '55555555-5555-4555-8555-555555555555',
  userId: '33333333-3333-4333-8333-333333333333',
  actingPartyId: '44444444-4444-4444-8444-444444444444',
  traceId: 'trace-foundation-20260830',
});

const DEFAULT_ROUTE: RouteRegistryFixture = Object.freeze({
  method: 'GET',
  path: '/api/v1/health',
  authClass: 'public',
  cacheClass: 'no_store',
  timeoutMs: 8_000,
  rateClass: 'public_read',
  sloTier: 'tier_1',
  criticality: 'high',
  owner: 'Infrastructure',
  operationId: 'healthRead',
  requestSchema: 'EmptyRequestSchema',
  successSchema: 'HealthResponseSchema',
  errorSchemas: Object.freeze(['ApiErrorSchema']),
  bolaTest: 'public route has no object selector',
  runbook: 'docs/runbooks/platform/operational-endpoints.md',
  deprecated: false,
});

const DEFAULT_CONSUMER: ConsumerRegistryFixture = Object.freeze({
  consumerId: 'platform.job.execute',
  owner: 'Infrastructure',
  messageSchema: 'QueueEnvelopeSchema',
  queueName: 'platform-jobs',
  leaseSeconds: 300,
  heartbeatSeconds: 60,
  maxLeaseSeconds: 840,
  maxDeliveries: 4,
  retryClass: 'bounded_exponential',
  retryDelaysSeconds: Object.freeze([15, 60, 300] as const),
  deadLetterClass: 'platform-jobs-dlq',
  acceptedEvents: Object.freeze([
    Object.freeze({ eventType: 'job.requested', schemaVersion: 1 }),
  ]),
  sloTier: 'tier_1',
  runbook: 'docs/runbooks/platform/jobs-outbox-reconciliation.md',
});

const DEFAULT_PROVIDER: ProviderRegistryFixture = Object.freeze({
  providerId: 'object_store',
  owner: 'Infrastructure',
  adapter: 'storage.r2',
  credentialBinding: 'OBJECT_STORAGE_TOKEN',
  replayWindowSeconds: 300,
  sloTier: 'tier_2',
  runbook: 'docs/runbooks/platform/upload-admission-reconciliation.md',
});

const DEFAULT_RETENTION: RetentionRegistryFixture = Object.freeze({
  dataClass: 'operational.events',
  owner: 'Infrastructure',
  retentionDays: 30,
  deletionMode: 'hard_delete',
  legalHoldSupported: false,
  runbook: 'docs/runbooks/platform/retention.md',
});

const DEFAULT_SLO: SloRegistryFixture = Object.freeze({
  tier: 'tier_1',
  owner: 'Infrastructure',
  targetBasisPoints: 9_990,
  measurementLabel: 'api.availability',
  alertRoute: 'platform.on_call',
  runbook: 'docs/runbooks/platform/slo.md',
});

const freezeArray = <T>(values: readonly T[]): readonly T[] =>
  Object.freeze([...values]);

export const createDeterministicIds = (): FixtureIds =>
  Object.freeze({ ...IDS });

export const createApiErrorFixture = (
  overrides: Partial<ApiErrorFixture> = {},
): ApiErrorFixture =>
  Object.freeze({
    code: 'NOT_FOUND',
    details: Object.freeze({ recoveryAction: 'return_to_list' }),
    message: 'The requested resource does not exist.',
    requestId: IDS.requestId,
    ...overrides,
  });

export const createRequestContextFixture = (
  overrides: Partial<RequestContextFixture> = {},
): RequestContextFixture =>
  Object.freeze({
    requestId: IDS.requestId,
    correlationId: IDS.correlationId,
    causationId: null,
    traceId: IDS.traceId,
    userId: IDS.userId,
    actingPartyId: IDS.actingPartyId,
    capabilities: freezeArray(['diagnostics.read']),
    locale: 'en-US',
    clientVersion: 'test-2026.08.30',
    ...overrides,
  });

export const createHealthResponseFixture = (
  overrides: Partial<HealthResponseFixture> = {},
): HealthResponseFixture =>
  Object.freeze({
    requestId: IDS.requestId,
    service: 'wejammin-api',
    status: 'ok',
    version: 'v1',
    ...overrides,
  });

export const createReadinessResponseFixture = (
  overrides: Partial<ReadinessResponseFixture> = {},
): ReadinessResponseFixture =>
  Object.freeze({
    requestId: IDS.requestId,
    service: 'wejammin-api',
    status: 'ready',
    version: 'v1',
    ...overrides,
  });

export type RegistrySetFixtureOverrides = Partial<RegistrySetFixture>;

export const createRegistrySetFixture = (
  overrides: RegistrySetFixtureOverrides = {},
): RegistrySetFixture =>
  Object.freeze({
    routes: freezeArray([DEFAULT_ROUTE]),
    consumers: freezeArray([DEFAULT_CONSUMER]),
    providers: freezeArray([DEFAULT_PROVIDER]),
    retention: freezeArray([DEFAULT_RETENTION]),
    slos: freezeArray([DEFAULT_SLO]),
    ...overrides,
  });

export const createServerEnvironmentFixture = (
  overrides: Partial<ServerEnvironmentFixture> = {},
): ServerEnvironmentFixture =>
  Object.freeze({
    APP_ENVIRONMENT: 'development',
    APP_RELEASE: 'test-2026.08.30',
    SUPABASE_SECRET_KEY: 'synthetic-local-secret',
    SUPABASE_URL: 'http://127.0.0.1:54321',
    ...overrides,
  });

export const createBrowserEnvironmentFixture = (
  overrides: Partial<BrowserEnvironmentFixture> = {},
): BrowserEnvironmentFixture =>
  Object.freeze({
    PUBLIC_APP_ORIGIN: 'http://127.0.0.1:4321',
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'synthetic-publishable-key',
    PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
    ...overrides,
  });

export const createStructuredLogFixture = (
  overrides: Partial<StructuredLogFixture> = {},
): StructuredLogFixture =>
  Object.freeze({
    eventName: 'http.request.completed',
    operation: 'health.read',
    outcome: 'success',
    requestId: IDS.requestId,
    correlationId: IDS.correlationId,
    routeTemplate: '/api/v1/health',
    durationMs: 12,
    retryable: false,
    service: 'wejammin-api',
    environment: 'development',
    release: 'test-2026.08.30',
    severity: 'INFO',
    timestamp: '2026-08-30T06:30:00.000Z',
    ...overrides,
  });

export const createContractFixture = (): ContractFixture =>
  Object.freeze({
    ids: createDeterministicIds(),
    apiError: createApiErrorFixture(),
    requestContext: createRequestContextFixture(),
    health: createHealthResponseFixture(),
    readiness: createReadinessResponseFixture(),
    registries: createRegistrySetFixture(),
  });

export const createIntegrationFixture = (): IntegrationFixture =>
  Object.freeze({
    request: Object.freeze({
      method: 'GET',
      path: '/api/v1/health',
      requestId: IDS.requestId,
      correlationId: IDS.correlationId,
    }),
    bindings: createServerEnvironmentFixture(),
  });

export const createAccessibilityFixture = (): AccessibilityFixture =>
  Object.freeze({
    title: 'WeJammin | Operational foundation',
    heading: 'WeJammin operational foundation',
    language: 'en',
    requiredLandmarks: Object.freeze(['main', 'heading', 'definition-list']),
    statusText: 'Workspace status: ready for local development',
  });

export const createPerformanceFixture = (): PerformanceFixture =>
  Object.freeze({
    healthPayloadBudgetBytes: 256,
    shellResponseBudgetBytes: 32_768,
    requestCount: 1,
    payload: createHealthResponseFixture(),
  });

export const createSecurityFixture = (): SecurityFixture =>
  Object.freeze({
    serverSecret: 'synthetic-local-secret',
    privateEmail: 'private-user@example.test',
    browserSecretKeyName: 'SUPABASE_SECRET_KEY',
    publicEnvironment: createBrowserEnvironmentFixture(),
  });

export const createE2eFixture = (): E2eFixture =>
  Object.freeze({
    baseUrl: 'http://127.0.0.1:4321',
    title: 'WeJammin | Operational foundation',
    heading: 'WeJammin operational foundation',
    statusText: 'Workspace status: ready for local development',
  });

export const createE2EFixture = createE2eFixture;
