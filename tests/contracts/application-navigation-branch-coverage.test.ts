import {
  InfrastructureAccessProjectionSchema,
  type ActorClass,
  type InfrastructureAccessProjection,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import {
  createInvalidationMessage,
  evaluateRouteAccess,
  infrastructureRouteMetadata,
  normalizeSafeReturnPath,
  parseInfrastructureQuery,
  planNetworkAction,
  resolveRecordRoute,
  serializeInfrastructureQuery,
} from '../../packages/ui/src/infrastructure/navigation.ts';
import {
  accessVariantForMode,
  presentInfrastructureState,
  responsiveLayoutForWidth,
  resolvePresentation,
} from '../../packages/ui/src/infrastructure/presentation.ts';
import type { PresentationDecision } from '@wejammin/contracts';

const RECORD_ID = '33333333-3333-4333-8333-333333333333';

const access = (
  actorClass: ActorClass,
  overrides: Partial<InfrastructureAccessProjection> = {},
): InfrastructureAccessProjection =>
  InfrastructureAccessProjectionSchema.parse({
    actorClass,
    capabilities: [],
    entitled: false,
    ownsResource: false,
    guardianMandate: false,
    ageAllowed: true,
    organizationMandate: false,
    caseScoped: false,
    stepUpVerified: false,
    auditReasonPresent: false,
    ...overrides,
  });

describe('Slice 02 navigation and presentation branch coverage', () => {
  it('covers calendar validation and every network fallback', () => {
    const retry = (retryAt: string) =>
      planNetworkAction({
        operation: 'read',
        condition: 'rate_limited',
        retryAt,
      });

    expect(retry('2024-02-29T00:00:00Z')).toMatchObject({
      retryAt: '2024-02-29T00:00:00Z',
    });
    expect(retry('2000-02-29T00:00:00Z')).toMatchObject({
      retryAt: '2000-02-29T00:00:00Z',
    });
    expect(retry('2100-02-28T00:00:00Z')).toMatchObject({
      retryAt: '2100-02-28T00:00:00Z',
    });
    expect([
      retry('2026-00-01T00:00:00Z'),
      retry('2026-01-00T00:00:00Z'),
      retry('2026-01-32T00:00:00Z'),
      retry('2026-02-29T00:00:00Z'),
      retry('2026-01-01T00:00:00+99:99'),
    ]).toEqual([
      { preserveInput: true, automaticRetry: false },
      { preserveInput: true, automaticRetry: false },
      { preserveInput: true, automaticRetry: false },
      { preserveInput: true, automaticRetry: false },
      { preserveInput: true, automaticRetry: false },
    ]);

    expect(
      planNetworkAction({
        operation: 'read',
        condition: 'dependency_error',
        safeRetryDeclared: true,
      }),
    ).toEqual({ retryDelaysMs: [250, 750], maximumRetries: 2 });
    expect(
      planNetworkAction({
        operation: 'read',
        condition: 'offline',
        lastKnownGoodAllowed: true,
      }),
    ).toEqual({ route: '/system/degraded', lastKnownGoodAllowed: true });
    expect(
      planNetworkAction({
        operation: 'read',
        condition: 'offline',
        lastKnownGoodAllowed: false,
        verifiedAt: '2026-08-30T12:00:00Z',
      }),
    ).toEqual({ route: '/system/degraded', lastKnownGoodAllowed: false });
  });

  it('round trips every query representation and omission branch', () => {
    const query = {
      q: 'status',
      sort: 'modified_asc' as const,
      filter: 'degraded' as const,
      cursor: 'cursor_1',
      selected: RECORD_ID,
      tab: 'history' as const,
    };
    const url = new URL(
      'https://wejamm.in/app/infrastructure?q=status&sort=modified_asc&filter=degraded&cursor=cursor_1&selected=33333333-3333-4333-8333-333333333333&tab=history',
    );
    expect(parseInfrastructureQuery(url)).toEqual(query);
    expect(parseInfrastructureQuery(url.searchParams)).toEqual(query);
    expect(parseInfrastructureQuery(url.toString())).toEqual(query);
    expect(
      parseInfrastructureQuery('https://wejamm.in/app/infrastructure?q=status'),
    ).toEqual({ q: 'status' });
    expect(
      parseInfrastructureQuery(
        'https://wejamm.in/app/infrastructure?sort=modified_desc',
      ),
    ).toEqual({ sort: 'modified_desc' });
    expect(
      parseInfrastructureQuery('https://wejamm.in/app/infrastructure?q='),
    ).toEqual({});
    expect(serializeInfrastructureQuery(query)).toBe(
      'q=status&sort=modified_asc&filter=degraded&cursor=cursor_1&selected=33333333-3333-4333-8333-333333333333&tab=history',
    );
    expect(serializeInfrastructureQuery({})).toBe('');
    expect(
      createInvalidationMessage({
        entityId: RECORD_ID,
        entityType: 'infrastructure_record',
      }),
    ).toEqual({
      kind: 'invalidate',
      entityId: RECORD_ID,
      carriesCanonicalState: false,
    });
  });

  it('covers server route families and safe return-path guards', () => {
    expect(evaluateRouteAccess({ family: 'system' })).toEqual({
      allowed: true,
      projection: 'system',
      authoritySource: 'server',
    });
    expect(
      evaluateRouteAccess({
        family: 'app',
        sessionVerified: true,
        sessionExpired: false,
        actingContextVerified: false,
        capabilityVerified: false,
      }),
    ).toEqual({
      allowed: false,
      authoritySource: 'server',
    });
    expect(
      evaluateRouteAccess({ family: 'app', sessionVerified: false }),
    ).toEqual({
      allowed: false,
      authoritySource: 'server',
      redirect: '/auth/sign-in',
    });
    expect(
      evaluateRouteAccess({
        family: 'admin',
        sessionVerified: true,
        sessionExpired: false,
        capabilityVerified: false,
        stepUpVerified: false,
        auditReasonPresent: false,
      }),
    ).toEqual({ allowed: false, authoritySource: 'server' });
    expect(
      evaluateRouteAccess({ family: 'admin', sessionExpired: true }),
    ).toEqual({
      allowed: false,
      authoritySource: 'server',
      redirect: '/auth/sign-in',
    });

    expect([
      normalizeSafeReturnPath(undefined),
      normalizeSafeReturnPath(null),
      normalizeSafeReturnPath('/app/%'),
      normalizeSafeReturnPath('/app\\escape'),
      normalizeSafeReturnPath('/app/../other'),
      normalizeSafeReturnPath('/app/\u0001'),
      normalizeSafeReturnPath('/app/\u007f'),
      normalizeSafeReturnPath('/app/\u0080'),
      normalizeSafeReturnPath('/app/%2Fother'),
      normalizeSafeReturnPath('/app/admin/operations'),
      normalizeSafeReturnPath('https://evil.example'),
      normalizeSafeReturnPath('/app/\u00a0'),
    ]).toEqual([
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app',
      '/app/\u00a0',
    ]);
    expect(normalizeSafeReturnPath('/app/admin/operations', () => false)).toBe(
      '/app',
    );
    expect(normalizeSafeReturnPath('/app/admin/operations', () => true)).toBe(
      '/app/admin/operations',
    );
  });

  it('covers every infrastructure route metadata and record resolution outcome', () => {
    expect(
      infrastructureRouteMetadata('/app/infrastructure/:recordId'),
    ).toMatchObject({
      authClass: 'authenticated',
    });
    expect(infrastructureRouteMetadata('/auth/sign-in')).toMatchObject({
      authClass: 'public',
    });
    expect(infrastructureRouteMetadata('/system/degraded')).toMatchObject({
      authClass: 'system',
    });
    expect(() => infrastructureRouteMetadata('/unknown')).toThrow(RangeError);
    expect(resolveRecordRoute(RECORD_ID, true)).toEqual({
      status: 200,
      recordId: RECORD_ID,
    });
  });

  it('covers access variants and protected presentation denials', () => {
    expect(resolvePresentation('public_read', access('staff'))).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
    expect(resolvePresentation('public_read', access('admin'))).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
    expect(
      ['full', 'read_only', 'partial_hidden', 'disabled', 'not_rendered'].map(
        (mode) => accessVariantForMode(mode as PresentationDecision['mode']),
      ),
    ).toEqual([
      'full',
      'read-only',
      'partial-hidden',
      'disabled',
      'not-rendered',
    ]);
  });

  it('covers responsive validation and the state presentation entry point', () => {
    expect(() => responsiveLayoutForWidth(Number.NaN)).toThrow(RangeError);
    expect(() => responsiveLayoutForWidth(-1)).toThrow(RangeError);
    expect(presentInfrastructureState({ status: 'idle' })).toEqual({
      status: 'idle',
      busy: false,
    });
  });
});
