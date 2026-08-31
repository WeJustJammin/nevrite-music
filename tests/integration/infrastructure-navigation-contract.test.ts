import { describe, expect, it } from 'vitest';

describe('Slice 02 responsive, route, navigation, and network contract', () => {
  it('P1-S02-AC-048', async () => {
    const { responsiveLayoutForWidth } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    expect(responsiveLayoutForWidth(390)).toMatchObject({
      breakpoint: 'mobile',
      columns: 4,
      backActionFirst: true,
      minimumTargetPx: 44,
    });
  });

  it('P1-S02-AC-049', async () => {
    const { responsiveLayoutForWidth } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    expect(responsiveLayoutForWidth(900)).toMatchObject({
      breakpoint: 'tablet',
      columns: 8,
      composition: 'collapsible_sidebar',
      preservesRowDetails: true,
    });
  });

  it('P1-S02-AC-050', async () => {
    const { responsiveLayoutForWidth } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    expect(responsiveLayoutForWidth(1280)).toMatchObject({
      breakpoint: 'desktop',
      columns: 12,
      virtualizeAboveRows: 100,
    });
  });

  it('P1-S02-AC-051', async () => {
    const { evaluateRouteAccess } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      evaluateRouteAccess({ family: 'public', clientAuthority: 'forged' }),
    ).toMatchObject({
      allowed: true,
      projection: 'public',
      authoritySource: 'server',
    });
  });

  it('P1-S02-AC-052', async () => {
    const { evaluateRouteAccess } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      evaluateRouteAccess({
        family: 'app',
        sessionVerified: true,
        sessionExpired: false,
        actingContextVerified: true,
        capabilityVerified: true,
      }),
    ).toMatchObject({ allowed: true, authoritySource: 'server' });
  });

  it('P1-S02-AC-053', async () => {
    const { evaluateRouteAccess } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      evaluateRouteAccess({
        family: 'admin',
        sessionVerified: true,
        sessionExpired: false,
        capabilityVerified: true,
        stepUpVerified: true,
        auditReasonPresent: true,
      }),
    ).toMatchObject({ allowed: true, requiresAudit: true });
  });

  it('P1-S02-AC-054', async () => {
    const { normalizeSafeReturnPath } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect([
      normalizeSafeReturnPath('https://evil.example'),
      normalizeSafeReturnPath('/app/infrastructure'),
      normalizeSafeReturnPath('/app/admin/operations'),
    ]).toEqual(['/app', '/app/infrastructure', '/app']);
  });

  it('P1-S02-AC-055', async () => {
    const { createDegradedShellProjection } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      createDegradedShellProjection({
        safeShell: 'System status',
        cachedPrivateData: 'secret',
      }),
    ).toEqual({ safeShell: 'System status', discardedUnsafeCache: true });
  });

  it('P1-S02-AC-056', async () => {
    const { infrastructureRouteMetadata } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(infrastructureRouteMetadata('/app/infrastructure')).toMatchObject({
      title: 'Infrastructure',
      description: expect.any(String),
      authClass: 'authenticated',
    });
  });

  it('P1-S02-AC-057', async () => {
    const { resolveRecordRoute } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect([
      resolveRecordRoute('not-a-uuid', true),
      resolveRecordRoute('33333333-3333-4333-8333-333333333333', false),
    ]).toEqual([{ status: 400 }, { status: 404 }]);
  });

  it('P1-S02-AC-058', async () => {
    const { roundTripNavigationState } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    const state = {
      query: {
        q: 'status',
        selected: '33333333-3333-4333-8333-333333333333',
        tab: 'facts' as const,
      },
      scrollOffset: 240,
    };
    expect(roundTripNavigationState(state)).toEqual(state);
  });

  it('P1-S02-AC-059', async () => {
    const { createInvalidationMessage } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      createInvalidationMessage({
        entityId: '33333333-3333-4333-8333-333333333333',
        entityType: 'infrastructure_record',
        hintedVersion: '"2"',
      }),
    ).toEqual({
      kind: 'invalidate',
      entityId: '33333333-3333-4333-8333-333333333333',
      hintedVersion: '"2"',
      carriesCanonicalState: false,
    });
  });

  it('P1-S02-AC-067', async () => {
    const { planNetworkAction } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(planNetworkAction({ operation: 'read', condition: 'slow' })).toEqual(
      { showLoadingAfterMs: 250, preserveSafePriorContent: true },
    );
  });

  it('P1-S02-AC-068', async () => {
    const { planNetworkAction } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      planNetworkAction({
        operation: 'mutation',
        condition: 'rate_limited',
        retryAt: '2026-08-30T12:01:00.000Z',
      }),
    ).toEqual({
      preserveInput: true,
      retryAt: '2026-08-30T12:01:00.000Z',
      automaticRetry: false,
    });
  });

  it('P1-S02-AC-069', async () => {
    const { planNetworkAction } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect([
      planNetworkAction({
        operation: 'read',
        condition: 'dependency_error',
        safeRetryDeclared: true,
        attempt: 0,
      }),
      planNetworkAction({
        operation: 'mutation',
        condition: 'dependency_error',
      }),
    ]).toEqual([
      { retryDelaysMs: [250, 750], maximumRetries: 2 },
      { reconcileFirst: true, automaticRetry: false },
    ]);
  });

  it('P1-S02-AC-070', async () => {
    const { planNetworkAction } =
      await import('../../packages/ui/src/infrastructure/navigation.ts');
    expect(
      planNetworkAction({
        operation: 'read',
        condition: 'offline',
        lastKnownGoodAllowed: true,
        verifiedAt: '2026-08-30T12:00:00.000Z',
      }),
    ).toEqual({
      route: '/system/degraded',
      lastKnownGoodAllowed: true,
      freshness: '2026-08-30T12:00:00.000Z',
    });
  });
});
