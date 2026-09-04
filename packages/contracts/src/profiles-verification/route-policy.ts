import { z } from 'zod';

export const ProfileOperationIdSchema = z.enum([
  'PRF-API-01',
  'PRF-API-02',
  'PRF-API-03',
  'PRF-API-04',
  'PRF-API-05',
  'PRF-API-06',
  'PRF-API-07',
  'PRF-API-08',
  'PRF-API-09',
  'PRF-API-10',
  'PRF-API-11',
  'PRF-API-12',
  'PRF-API-13',
  'PRF-API-14',
  'PRF-API-15',
  'PRF-API-16',
]);
export const ProfileRouteErrorCodeSchema = z.enum([
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'STEP_UP_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'DEPENDENCY_BAD_GATEWAY',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
]);

export const ProfileRoutePolicySchema = z
  .object({
    operationId: ProfileOperationIdSchema,
    active: z.boolean(),
    method: z.enum(['GET', 'POST']),
    path: z.string().regex(/^\/api\/v1(?:\/[A-Za-z0-9{}_.:-]+)*$/u),
    requestSchema: z.string().min(1),
    successSchema: z.string().min(1),
    auth: z.enum(['public', 'session', 'session_step_up']),
    rateLimit: z.number().int().positive(),
    rateWindowSeconds: z.number().int().positive(),
    rateClass: z.string().min(1),
    timeoutMs: z.union([z.literal(8_000), z.literal(15_000)]),
    cacheControl: z.literal('no-store'),
    idempotency: z.enum(['none', 'required']),
    ifMatch: z.enum(['none', 'required']),
    sloTier: z.enum(['tier_1', 'tier_2']),
    errors: z.array(ProfileRouteErrorCodeSchema).min(1).readonly(),
  })
  .strict()
  .readonly();
export type ProfileOperationId = z.infer<typeof ProfileOperationIdSchema>;
export type ProfileRouteErrorCode = z.infer<typeof ProfileRouteErrorCodeSchema>;
export type ProfileRoutePolicy = z.infer<typeof ProfileRoutePolicySchema>;
export const profileRoute = (
  operationId: ProfileOperationId,
  method: ProfileRoutePolicy['method'],
  path: string,
  requestSchema: string,
  successSchema: string,
  auth: ProfileRoutePolicy['auth'],
  rateClass: string,
  rateLimit: number,
  ifMatch: ProfileRoutePolicy['ifMatch'],
  sloTier: ProfileRoutePolicy['sloTier'],
  errors: readonly ProfileRouteErrorCode[],
  active = true,
  timeoutMs: ProfileRoutePolicy['timeoutMs'] = method === 'GET'
    ? 8_000
    : 15_000,
  rateWindowSeconds = rateClass === 'profile_remedy' ? 900 : 60,
): ProfileRoutePolicy => ({
  operationId,
  active,
  method,
  path,
  requestSchema,
  successSchema,
  auth,
  rateLimit,
  rateWindowSeconds,
  rateClass,
  timeoutMs,
  cacheControl: 'no-store',
  idempotency: method === 'GET' ? 'none' : 'required',
  ifMatch,
  sloTier,
  errors,
});
export const profileReadErrors = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfileRouteErrorCode[];
export const profileMatchErrors = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfileRouteErrorCode[];
export const profileAnonymousMutationErrors = [
  'INVALID_REQUEST',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfileRouteErrorCode[];
export const profileMutationErrors = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'VALIDATION_FAILED',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const satisfies readonly ProfileRouteErrorCode[];
export const profileChallengeErrors = [
  ...profileMutationErrors,
  'DEPENDENCY_BAD_GATEWAY',
] as const satisfies readonly ProfileRouteErrorCode[];
