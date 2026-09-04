import { expect, vi } from 'vitest';
import {
  createContentSchemaRegistryApp,
  type ContentSchemaRegistryDependencies,
  type ContentSchemaRegistryResult,
  type ContentSchemaRegistrySession,
} from './index';
import {
  API_ORIGIN,
  CMS_ORIGIN,
  RELEASE_ORIGIN,
  VERSION_ID,
  FIELD_ID,
  BLOCK_ID,
  REQUEST_ID,
  NONCE,
  HASH,
  SIGNATURE,
  session,
  resource,
  validRelation,
  validBlock,
  ok,
} from './phase-02-slice-09-test-values';
export * from './phase-02-slice-09-test-values';

export const releasePrincipal = {
  principalId: 'release-worker-1',
  keyId: 'release-key-1',
  capabilities: ['release.block_registry.write'],
  verifiedAt: '2026-09-02T12:00:00.000Z',
  rawBodyHash: HASH,
  signatureHash: HASH,
  nonceHash: HASH,
} as const;

export type Harness = Readonly<{
  app: ReturnType<typeof createContentSchemaRegistryApp>;
  dependencies: ContentSchemaRegistryDependencies;
  ports: Record<string, ReturnType<typeof vi.fn>>;
  resolveSession: ReturnType<typeof vi.fn>;
  verifyRelease: ReturnType<typeof vi.fn>;
  rateLimit: ReturnType<typeof vi.fn>;
}>;
export const releaseHeaders = (): Record<string, string> => ({
  'X-WeJammin-Release-Key-Id': releasePrincipal.keyId,
  'X-WeJammin-Release-Issued-At': releasePrincipal.verifiedAt,
  'X-WeJammin-Release-Nonce': NONCE,
  'X-WeJammin-Release-Signature': SIGNATURE,
});
export const jsonRequest = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Request =>
  new Request(`${API_ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      origin: CMS_ORIGIN,
      authorization: 'Bearer verified-session',
      'content-type': 'application/json',
      'idempotency-key': 'cms-test-key-001',
      'x-request-id': REQUEST_ID,
      ...headers,
    },
    body: JSON.stringify(body),
  });
export const releaseRequest = (
  path: string,
  body: unknown,
  headers: Record<string, string> = {},
): Request =>
  new Request(`${API_ORIGIN}${path}`, {
    method: 'POST',
    headers: {
      origin: RELEASE_ORIGIN,
      'content-type': 'application/json',
      'idempotency-key': 'release-test-key-001',
      'x-request-id': REQUEST_ID,
      ...releaseHeaders(),
      ...headers,
    },
    body: JSON.stringify(body),
  });
export const readRequest = (
  path = '/api/v1/cms/content-types',
  headers: Record<string, string> = {},
): Request =>
  new Request(`${API_ORIGIN}${path}`, {
    headers: {
      origin: CMS_ORIGIN,
      authorization: 'Bearer verified-session',
      'x-request-id': REQUEST_ID,
      ...headers,
    },
  });
export const makeHarness = (
  overrides: Readonly<{
    session?: ContentSchemaRegistryResult<ContentSchemaRegistrySession>;
    release?: ContentSchemaRegistryResult<typeof releasePrincipal>;
    rate?: ContentSchemaRegistryResult<{
      allowed: boolean;
      limit: number;
      remaining: number;
      resetAt: number;
    }>;
    deadlineMs?: number;
  }> = {},
): Harness => {
  const outputs: Record<string, unknown> = {
    createTypeDraft: resource,
    addFieldDefinition: {
      resourceKind: 'field_definition_version',
      id: FIELD_ID,
      version: '1',
      contentHash: HASH,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      contentTypeVersionId: VERSION_ID,
      stableFieldId: FIELD_ID,
      key: 'title',
      kind: 'short_text',
      required: true,
      validatorKey: null,
      validatorVersion: null,
      defaultMode: 'none',
      localizationMode: 'none',
      lifecycle: 'active',
      migrationPlanId: null,
    },
    bindRelation: {
      resourceKind: 'relation_definition',
      id: BLOCK_ID,
      version: '1',
      contentHash: HASH,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      state: 'draft',
      contentTypeVersionId: VERSION_ID,
      ...validRelation,
    },
    activateSchema: {
      id: VERSION_ID,
      version: '1',
      contentHash: HASH,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      state: 'active',
      contentTypeVersionId: VERSION_ID,
      activatedAt: resource.createdAt,
      migrationPlanId: null,
      activationEvidence: {
        key: 'editorial.default',
        version: '1',
        policyHash: HASH,
        riskClass: 'ordinary',
        requiredDecisionCount: 1,
        requiredCapabilities: [],
        approvalEvidenceHash: HASH,
      },
      jobId: null,
      eventType: 'cms.schema.activated.v1',
    },
    registerBlock: {
      resourceKind: 'block_definition_version',
      id: BLOCK_ID,
      version: '1',
      contentHash: HASH,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      ...validBlock,
      releaseKeyId: releasePrincipal.keyId,
      releaseRawBodyHash: HASH,
      releaseSignatureHash: HASH,
      releaseNonceHash: HASH,
      releaseVerifiedAt: resource.createdAt,
    },
    advanceBlockLifecycle: {
      resourceKind: 'block_definition_lifecycle_event',
      id: BLOCK_ID,
      version: '1',
      blockDefinitionVersionId: BLOCK_ID,
      blockKey: 'hero.banner',
      blockVersion: 1,
      fromLifecycle: 'supported',
      toLifecycle: 'deprecated',
      lifecycle: 'deprecated',
      releaseDigest: HASH,
      releaseKeyId: releasePrincipal.keyId,
      releaseNonceHash: HASH,
      releaseVerifiedAt: resource.createdAt,
      eventType: 'cms.block.lifecycle.changed.v1',
      createdAt: resource.createdAt,
    },
    listContentTypes: { items: [], nextCursor: null },
    getContentTypeVersion: {
      resourceKind: 'content_type_version',
      resource,
      fields: [],
      relations: [],
      schemaArtifact: {
        resourceKind: 'schema_artifact',
        id: FIELD_ID,
        version: '1',
        state: 'compiled',
        contentTypeVersionId: VERSION_ID,
        compilerVersion: '1',
        zodContractRef: 'contracts/cms/type-v1',
        artifactHash: HASH,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
        compiledAt: resource.createdAt,
      },
      templateBindings: [],
      capabilityBindings: [],
      blockDefinitions: [],
    },
  };
  const names = [
    'createTypeDraft',
    'addFieldDefinition',
    'bindRelation',
    'activateSchema',
    'registerBlock',
    'advanceBlockLifecycle',
    'listContentTypes',
    'getContentTypeVersion',
  ] as const;
  const ports = Object.fromEntries(
    names.map((name) => [name, vi.fn(async () => ok(outputs[name]))]),
  ) as Record<string, ReturnType<typeof vi.fn>>;
  const resolveSession = vi.fn(async () => overrides.session ?? ok(session));
  const verifyRelease = vi.fn(
    async () => overrides.release ?? ok(releasePrincipal),
  );
  const rateLimit = vi.fn(
    async () =>
      overrides.rate ??
      ok({ allowed: true, limit: 100, remaining: 99, resetAt: 1_788_345_600 }),
  );
  const dependencies: ContentSchemaRegistryDependencies = {
    ports: ports as unknown as ContentSchemaRegistryDependencies['ports'],
    resolveSession,
    verifyRelease,
    rateLimit,
    humanOrigins: [CMS_ORIGIN],
    releaseOrigins: [RELEASE_ORIGIN],
    deadlineMs: overrides.deadlineMs ?? 15_000,
    now: () => 1_788_345_600_000,
  };
  return {
    app: createContentSchemaRegistryApp(dependencies),
    dependencies,
    ports,
    resolveSession,
    verifyRelease,
    rateLimit,
  };
};
export const expectError = async (
  response: Response,
  status: number,
  code: string,
): Promise<Record<string, unknown>> => {
  expect(response.status).toBe(status);
  const body = (await response.json()) as Record<string, unknown>;
  expect(body.code).toBe(code);
  expect(body.requestId).toBe(REQUEST_ID);
  expect(body.details).toEqual(expect.any(Object));
  expect(JSON.stringify(body)).not.toMatch(
    /ownerId|releaseSignature|stack|sql|script|process\.env/iu,
  );
  return body;
};
