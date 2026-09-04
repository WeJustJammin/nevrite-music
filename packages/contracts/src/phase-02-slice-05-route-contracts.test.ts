import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  ProfileRoutePolicyRegistrySchema,
  activeProfileRoutePolicies,
  deferredProfileRoutePolicies,
  platformRegistrySet,
  profileRoutePolicies,
} from '@wejammin/contracts';

const readErrors = [
  'INVALID_REQUEST',
  'UNAUTHENTICATED',
  'NOT_FOUND',
  'RATE_LIMITED',
  'DEPENDENCY_UNAVAILABLE',
  'DEPENDENCY_TIMEOUT',
  'INTERNAL_ERROR',
] as const;

const mutationErrors = [
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
] as const;

const matchErrors = [
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
] as const;

const anonymousMutationErrors = [
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
] as const;

const challengeErrors = [...mutationErrors, 'DEPENDENCY_BAD_GATEWAY'] as const;

type OpenApiDocument = {
  paths: Record<
    string,
    {
      post?: {
        responses?: Record<
          string,
          {
            headers?: Record<string, unknown>;
            content?: {
              'application/json'?: { schema?: { $ref?: string } };
            };
          }
        >;
      };
    }
  >;
};

const readOpenApiDocument = (): OpenApiDocument =>
  JSON.parse(
    readFileSync(
      new URL('../../../docs/openapi/openapi.json', import.meta.url),
      'utf8',
    ),
  ) as OpenApiDocument;

const route = (operationId: string) => {
  const policy = profileRoutePolicies.find(
    (candidate) => candidate.operationId === operationId,
  );
  if (!policy) throw new Error(`Missing profile route ${operationId}`);
  return policy;
};

describe('Phase 2 Slice 05 profile route registry', () => {
  it('[P2-S05-AC-091, P2-S05-AC-092, P2-S05-AC-093, P2-S05-AC-094, P2-S05-AC-095, P2-S05-AC-096, P2-S05-AC-097, P2-S05-AC-098] keeps active route policy and exact per-route boundaries', () => {
    expect(
      ProfileRoutePolicyRegistrySchema.parse(profileRoutePolicies),
    ).toEqual(profileRoutePolicies);
    expect(
      activeProfileRoutePolicies.map(({ operationId }) => operationId),
    ).toEqual([
      'PRF-API-01',
      'PRF-API-02',
      'PRF-API-03',
      'PRF-API-04',
      'PRF-API-05',
      'PRF-API-06',
      'PRF-API-07',
      'PRF-API-08',
    ]);
    expect(activeProfileRoutePolicies.every(({ active }) => active)).toBe(true);

    expect(route('PRF-API-01')).toMatchObject({
      successSchema: 'MatchResponseSchema',
      rateLimit: 60,
      rateWindowSeconds: 60,
      errors: matchErrors,
    });
    expect(route('PRF-API-02')).toMatchObject({
      successSchema: 'JobStatusSchema',
      timeoutMs: 15_000,
      rateLimit: 60,
      rateWindowSeconds: 60,
      errors: mutationErrors,
    });
    expect(route('PRF-API-03')).toMatchObject({
      auth: 'public',
      rateLimit: 5,
      rateWindowSeconds: 900,
      errors: anonymousMutationErrors,
    });
    expect(route('PRF-API-04')).toMatchObject({ errors: mutationErrors });
    expect(route('PRF-API-05')).toMatchObject({
      method: 'GET',
      ifMatch: 'none',
      idempotency: 'none',
      errors: readErrors,
    });
    expect(route('PRF-API-06')).toMatchObject({
      rateLimit: 10,
      rateWindowSeconds: 3_600,
      errors: challengeErrors,
    });
    expect(route('PRF-API-07')).toMatchObject({ errors: challengeErrors });
    expect(route('PRF-API-08')).toMatchObject({ errors: mutationErrors });
  });

  it('[P2-S05-AC-099, P2-S05-AC-100, P2-S05-AC-101, P2-S05-AC-102, P2-S05-AC-103, P2-S05-AC-104, P2-S05-AC-105, P2-S05-AC-106] keeps deferred route policies typed but unpublished', () => {
    expect(
      deferredProfileRoutePolicies.map(({ operationId }) => operationId),
    ).toEqual([
      'PRF-API-09',
      'PRF-API-10',
      'PRF-API-11',
      'PRF-API-12',
      'PRF-API-13',
      'PRF-API-14',
      'PRF-API-15',
      'PRF-API-16',
    ]);
    expect(deferredProfileRoutePolicies.every(({ active }) => !active)).toBe(
      true,
    );
    expect(() =>
      ProfileRoutePolicyRegistrySchema.parse(
        profileRoutePolicies.map((policy) =>
          policy.operationId === 'PRF-API-16'
            ? { ...policy, active: true }
            : policy,
        ),
      ),
    ).toThrow();
    expect(() =>
      ProfileRoutePolicyRegistrySchema.parse([
        ...profileRoutePolicies.slice(0, 15),
        { ...profileRoutePolicies[15], unknown: true },
      ]),
    ).toThrow();

    const document = readOpenApiDocument();
    for (const policy of activeProfileRoutePolicies) {
      expect(document.paths).toHaveProperty(policy.path);
    }
    for (const policy of deferredProfileRoutePolicies) {
      expect(document.paths).not.toHaveProperty(policy.path);
    }
  });

  it('[P2-S05-AC-092] publishes PRF-API-02 as a 202 JobStatus response with Location', () => {
    const registryRoute = platformRegistrySet.routes.find(
      ({ operationId }) => operationId === 'profileInvitationCreate',
    );
    expect(registryRoute).toMatchObject({
      method: 'POST',
      path: '/api/v1/shadow-parties/{shadowId}/invitations',
      successSchema: 'JobStatusSchema',
    });

    const document = readOpenApiDocument();
    const invitation =
      document.paths['/api/v1/shadow-parties/{shadowId}/invitations'].post;
    expect(
      invitation?.responses?.['202']?.content?.['application/json']?.schema,
    ).toEqual({ $ref: '#/components/schemas/JobStatus' });
    expect(invitation?.responses?.['202']?.headers).toHaveProperty('Location');
  });

  it('[P2-S05-AC-146, P2-S05-AC-226, P2-S05-AC-227, P2-S05-AC-244, P2-S05-AC-245, P2-S05-AC-248] keeps trader, portfolio, EPK, and credential surfaces deferred', () => {
    const publishedProfileSurface = platformRegistrySet.routes
      .filter(({ owner }) => owner === 'Profiles')
      .map(({ operationId, path, requestSchema, successSchema }) =>
        [operationId, path, requestSchema, successSchema].join(' '),
      )
      .join('|');
    expect(publishedProfileSurface).not.toMatch(
      /trader|mismatch|portfolio|epk|credential/iu,
    );
    expect(deferredProfileRoutePolicies.every(({ active }) => !active)).toBe(
      true,
    );
  });
});
