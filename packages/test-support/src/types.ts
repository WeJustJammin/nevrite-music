/**
 * JSON values used by deterministic test fixtures. The type intentionally
 * excludes functions, dates, and provider objects so fixtures can be safely
 * cloned, serialized, and reused by every test runner.
 */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type FixtureIds = Readonly<{
  requestId: string;
  correlationId: string;
  causationId: string;
  userId: string;
  actingPartyId: string;
  traceId: string;
}>;

export type ApiErrorFixture = Readonly<{
  code: string;
  details: Readonly<Record<string, JsonValue>>;
  message: string;
  requestId: string;
}>;

export type RequestContextFixture = Readonly<{
  requestId: string;
  correlationId: string;
  causationId: string | null;
  traceId: string;
  userId: string | null;
  actingPartyId: string | null;
  capabilities: readonly string[];
  locale: string;
  clientVersion: string | null;
}>;

export type HealthResponseFixture = Readonly<{
  requestId: string;
  service: 'wejammin-api';
  status: 'ok';
  version: 'v1';
}>;

export type ReadinessResponseFixture = Readonly<{
  requestId: string;
  service: 'wejammin-api';
  status: 'ready' | 'not_ready';
  version: 'v1';
}>;

export type RouteRegistryFixture = Readonly<{
  method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  path: string;
  authClass: string;
  cacheClass: string;
  timeoutMs: number;
  rateClass: string;
  sloTier: string;
  criticality: 'critical' | 'high' | 'standard';
  owner: string;
  operationId: string;
  requestSchema: string;
  successSchema: string;
  errorSchemas: readonly string[];
  bolaTest: string;
  runbook: string;
  deprecated: boolean;
}>;

export type ConsumerRegistryFixture = Readonly<{
  consumerId: string;
  owner: string;
  messageSchema: string;
  queueName: string;
  leaseSeconds: number;
  heartbeatSeconds: 60;
  maxLeaseSeconds: 840;
  maxDeliveries: 4;
  retryClass: string;
  retryDelaysSeconds: readonly [15, 60, 300];
  deadLetterClass: string;
  acceptedEvents: readonly Readonly<{
    eventType: string;
    schemaVersion: number;
  }>[];
  sloTier: string;
  runbook: string;
}>;

export type ProviderRegistryFixture = Readonly<{
  providerId: string;
  owner: string;
  adapter: string;
  credentialBinding: string;
  replayWindowSeconds: number;
  sloTier: string;
  runbook: string;
}>;

export type RetentionRegistryFixture = Readonly<{
  dataClass: string;
  owner: string;
  retentionDays: number;
  deletionMode: 'hard_delete' | 'redact' | 'tombstone';
  legalHoldSupported: boolean;
  runbook: string;
}>;

export type SloRegistryFixture = Readonly<{
  tier: string;
  owner: string;
  targetBasisPoints: number;
  measurementLabel: string;
  alertRoute: string;
  runbook: string;
}>;

export type RegistrySetFixture = Readonly<{
  routes: readonly RouteRegistryFixture[];
  consumers: readonly ConsumerRegistryFixture[];
  providers: readonly ProviderRegistryFixture[];
  retention: readonly RetentionRegistryFixture[];
  slos: readonly SloRegistryFixture[];
}>;

export type ServerEnvironmentFixture = Readonly<{
  APP_ENVIRONMENT: 'development' | 'staging' | 'production';
  APP_RELEASE: string;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_URL: string;
}>;

export type BrowserEnvironmentFixture = Readonly<{
  PUBLIC_APP_ORIGIN: string;
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  PUBLIC_SUPABASE_URL: string;
}>;

export type StructuredLogFixture = Readonly<{
  eventName: string;
  operation: string;
  outcome: 'success' | 'failure' | 'rejected' | 'retry' | 'unknown';
  requestId: string;
  correlationId: string;
  routeTemplate: string;
  durationMs: number;
  retryable: boolean;
  service: 'wejammin-api';
  environment: 'development' | 'staging' | 'production';
  release: string;
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  timestamp: string;
}>;

export type ContractFixture = Readonly<{
  ids: FixtureIds;
  apiError: ApiErrorFixture;
  requestContext: RequestContextFixture;
  health: HealthResponseFixture;
  readiness: ReadinessResponseFixture;
  registries: RegistrySetFixture;
}>;

export type IntegrationFixture = Readonly<{
  request: Readonly<{
    method: 'GET';
    path: '/api/v1/health';
    requestId: string;
    correlationId: string;
  }>;
  bindings: ServerEnvironmentFixture;
}>;

export type AccessibilityFixture = Readonly<{
  title: string;
  heading: string;
  language: 'en';
  requiredLandmarks: readonly string[];
  statusText: string;
}>;

export type PerformanceFixture = Readonly<{
  healthPayloadBudgetBytes: number;
  shellResponseBudgetBytes: number;
  requestCount: number;
  payload: HealthResponseFixture;
}>;

export type SecurityFixture = Readonly<{
  serverSecret: string;
  privateEmail: string;
  browserSecretKeyName: 'SUPABASE_SECRET_KEY';
  publicEnvironment: BrowserEnvironmentFixture;
}>;

export type E2eFixture = Readonly<{
  baseUrl: 'http://127.0.0.1:4321';
  title: string;
  heading: string;
  statusText: string;
}>;

export type E2EFixture = E2eFixture;
