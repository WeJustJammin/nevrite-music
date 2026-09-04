import { z } from 'zod';

export const ProfilePortfolioOperationIdSchema = z.enum([
  'PRF-PROF-01',
  'PRF-PROF-02',
  'PRF-PROF-03',
  'PRF-PROF-04',
  'PRF-PROF-05',
  'PRF-PROF-06',
  'PRF-PROF-07',
  'PRF-PROF-08',
  'PRF-PROF-09',
  'PRF-PROF-10',
  'PRF-PROF-11',
  'PRF-EPK-01',
  'PRF-EPK-02',
  'PRF-EPK-03',
  'PRF-EPK-04',
  'PRF-EPK-05',
  'PRF-EPK-06',
  'PRF-EPK-07',
  'PRF-EPK-08',
]);
export const ProfilePortfolioErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'RESOURCE_NOT_FOUND',
  'VERSION_CONFLICT',
  'SECTION_STATE_CONFLICT',
  'CONTENT_NOT_ALLOWED',
  'INVALID_EMPHASIS',
  'CURSOR_STALE',
  'RIGHTS_BASIS_REQUIRED',
  'MEDIA_NOT_READY',
  'RIGHTS_REVOKED',
  'INVALID_STATE_TRANSITION',
  'PRODUCER_AUTH_FAILED',
  'EVENT_SCHEMA_INVALID',
  'CONSENT_REQUIRED',
  'UNAPPROVED_DISCLOSURE',
  'INVALID_EXPIRY',
  'SHARE_UNAVAILABLE',
  'PDF_NOT_READY',
  'ACCESSIBILITY_VALIDATION_FAILED',
  'IDEMPOTENCY_CONFLICT',
  'DEPENDENCY_BAD_GATEWAY',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
]);

export const ProfilePortfolioRoutePolicySchema = z
  .strictObject({
    operationId: ProfilePortfolioOperationIdSchema,
    active: z.boolean(),
    method: z.enum(['DELETE', 'GET', 'POST', 'PUT']),
    path: z
      .string()
      .regex(/^\/(?:api\/v1|internal\/v1|epk)(?:\/[A-Za-z0-9{}_.:-]+)*$/u),
    requestSchema: z.string().min(1).max(128),
    successSchema: z.string().min(1).max(128),
    auth: z.enum(['public', 'session', 'internal_producer']),
    rateLimit: z.number().int().positive(),
    rateWindowSeconds: z.number().int().positive(),
    rateScope: z.enum(['ip', 'session', 'actor', 'party', 'share', 'producer']),
    rateClass: z.string().regex(/^[a-z][a-z0-9_.-]*$/u),
    timeoutMs: z.number().int().positive().max(30_000),
    cacheControl: z.enum([
      'public, max-age=60',
      'public, max-age=60, stale-if-error=300',
      'no-store',
    ]),
    idempotency: z.enum(['none', 'required']),
    ifMatch: z.enum(['none', 'required']),
    sloTier: z.enum(['tier_1', 'tier_2']),
    errors: z.array(ProfilePortfolioErrorCodeSchema).min(1).max(32).readonly(),
  })
  .readonly();
export type ProfilePortfolioOperationId = z.infer<
  typeof ProfilePortfolioOperationIdSchema
>;
export type ProfilePortfolioErrorCode = z.infer<
  typeof ProfilePortfolioErrorCodeSchema
>;
export type ProfilePortfolioRoutePolicy = z.infer<
  typeof ProfilePortfolioRoutePolicySchema
>;

export const profilePortfolioRoute = (
  operationId: ProfilePortfolioOperationId,
  method: ProfilePortfolioRoutePolicy['method'],
  path: string,
  requestSchema: string,
  successSchema: string,
  auth: ProfilePortfolioRoutePolicy['auth'],
  rateLimit: number,
  rateWindowSeconds: number,
  rateScope: ProfilePortfolioRoutePolicy['rateScope'],
  rateClass: string,
  cacheControl: ProfilePortfolioRoutePolicy['cacheControl'],
  idempotency: ProfilePortfolioRoutePolicy['idempotency'],
  ifMatch: ProfilePortfolioRoutePolicy['ifMatch'],
  sloTier: ProfilePortfolioRoutePolicy['sloTier'],
  errors: readonly ProfilePortfolioErrorCode[],
  active = true,
): ProfilePortfolioRoutePolicy => ({
  operationId,
  active,
  method,
  path,
  requestSchema,
  successSchema,
  auth,
  rateLimit,
  rateWindowSeconds,
  rateScope,
  rateClass,
  timeoutMs: method === 'GET' ? 800 : 2_000,
  cacheControl,
  idempotency,
  ifMatch,
  sloTier,
  errors,
});

export const profilePortfolioReadErrors = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'RESOURCE_NOT_FOUND',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfilePortfolioErrorCode[];
export const profilePortfolioMutationErrors = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'RESOURCE_NOT_FOUND',
  'VERSION_CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfilePortfolioErrorCode[];
export const profilePortfolioProjectionErrors = [
  'INVALID_REQUEST',
  'PRODUCER_AUTH_FAILED',
  'IDEMPOTENCY_CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'EVENT_SCHEMA_INVALID',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfilePortfolioErrorCode[];
