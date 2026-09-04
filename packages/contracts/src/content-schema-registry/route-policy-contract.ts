export type ContentSchemaRegistryCapability =
  | 'cms.schema_designer'
  | 'cms.schema_registry.read'
  | 'release.block_registry.write';

export type ContentSchemaRegistryRequestSchemaName =
  | 'ContentTypeDraftRequestSchema'
  | 'FieldSchemaChangeRequestSchema'
  | 'RelationBindingRequestSchema'
  | 'SchemaActivationRequestSchema'
  | 'BlockRegistrationRequestSchema'
  | 'ContentSchemaRegistryListQuerySchema'
  | 'ContentSchemaRegistryDetailParamsSchema'
  | 'BlockLifecycleAdvanceRequestSchema';

export type ContentSchemaRegistrySuccessSchemaName =
  | 'ContentTypeVersionResourceSchema'
  | 'FieldDefinitionVersionResourceSchema'
  | 'RelationDefinitionResourceSchema'
  | 'SchemaActivationResourceSchema'
  | 'BlockDefinitionVersionResourceSchema'
  | 'ContentSchemaRegistryListPageSchema'
  | 'ContentSchemaRegistryDetailSchema'
  | 'BlockLifecycleEventResourceSchema';

export type ContentSchemaRegistryOpenApiSuccessSchemaName =
  | 'ContentTypeVersionResourceSchema'
  | 'FieldDefinitionVersionResourceSchema'
  | 'RelationDefinitionResourceSchema'
  | 'SchemaActivationResourceSchema'
  | 'BlockDefinitionRegistryRecordSchema'
  | 'ContentSchemaRegistryListPageSchema'
  | 'ContentSchemaRegistryDetailSchema'
  | 'BlockLifecycleEventReceiptSchema';

export type ContentSchemaRegistryPath =
  | '/api/v1/cms/content-types'
  | '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/fields'
  | '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/relations'
  | '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}/activate'
  | '/api/v1/cms/blocks/versions'
  | '/api/v1/cms/content-types/{contentTypeId}/versions/{versionId}'
  | '/api/v1/cms/blocks/versions/{blockDefinitionVersionId}/lifecycle';

export type ContentSchemaRegistryErrorCode =
  | 'INVALID_REQUEST'
  | 'UNAUTHENTICATED'
  | 'WEBHOOK_REJECTED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'BAD_GATEWAY'
  | 'DEPENDENCY_UNAVAILABLE'
  | 'GATEWAY_TIMEOUT'
  | 'INTERNAL_ERROR';

export type ContentSchemaRegistryErrorStatus =
  400 | 401 | 403 | 404 | 409 | 415 | 422 | 429 | 500 | 502 | 503 | 504;

export type RouteContract = {
  method: 'GET' | 'POST';
  path: ContentSchemaRegistryPath;
  requestSchema: ContentSchemaRegistryRequestSchemaName;
  successSchema: ContentSchemaRegistrySuccessSchemaName;
  openApiSuccessSchema?: ContentSchemaRegistryOpenApiSuccessSchemaName;
  successStatus: 200 | 201 | 202;
  successStatuses?: readonly (200 | 201 | 202)[];
  auth: 'schema_designer' | 'registry_reader' | 'signed_release_worker';
  capability: ContentSchemaRegistryCapability;
  capabilities?: readonly ContentSchemaRegistryCapability[];
  audience: 'browser' | 'release-worker';
  cors: 'cms-console' | 'release-worker';
  csrf: 'required' | 'forbidden' | 'none';
  rawBodySignature: 'required' | 'none';
  idempotency: 'required' | 'none';
  ifMatch: 'required' | 'none';
  rateClass:
    | 'cms-definition-write'
    | 'cms-activation'
    | 'cms-definition-read'
    | 'release-registry-write'
    | 'release-registry-lifecycle';
  rateLimit: number;
  partyRateLimit?: number;
  rateWindowSeconds: 60;
  rateScope: 'user' | 'release';
  timeoutMs: 15_000;
  cacheControl: 'no-store';
  slo: Readonly<{
    tier: 2;
    commandP95Ms: 1_200;
    protectedRpcP95Ms: 300;
    acceptanceP99Ms: 1_000;
  }>;
};
