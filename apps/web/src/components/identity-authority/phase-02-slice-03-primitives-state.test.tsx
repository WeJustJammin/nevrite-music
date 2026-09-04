import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
type ModuleExports = Readonly<Record<string, unknown>>;
type ModuleLoad = Readonly<{
  module: ModuleExports | null;
  error: unknown | null;
}>;
const loadPrimitives = async (): Promise<ModuleLoad> => {
  try {
    return {
      module: (await import('./IdentityAuthorityPrimitives')) as ModuleExports,
      error: null,
    };
  } catch (error) {
    return { module: null, error };
  }
};
const loadState = async (): Promise<ModuleLoad> => {
  try {
    return {
      module: (await import('./identity-authority-state')) as ModuleExports,
      error: null,
    };
  } catch (error) {
    return { module: null, error };
  }
};
const loadRoutes = async (): Promise<ModuleLoad> => {
  try {
    return {
      module: (await import('./identity-authority-routes')) as ModuleExports,
      error: null,
    };
  } catch (error) {
    return { module: null, error };
  }
};
const requireModule = (
  loaded: ModuleLoad,
  label: string,
): ModuleExports | null => {
  expect(loaded.error, `${label} must load`).toBeNull();
  return loaded.module;
};
const componentProps = {
  actionBar: {
    primary: 'Save identity',
    secondary: 'Cancel',
    destructive: 'Remove identity',
    state: 'pending',
    expectedVersion: '"7"',
    operationId: 'op-172',
  },
  capabilityGate: {
    variant: 'disabled',
    reasonCode: 'STEP_UP_REQUIRED',
    recoveryHref: '/app/identity-authority?tab=security',
    disclosure: 'Step-up verification is required.',
  },
  filterBar: {
    schema: 'IdentityAuthorityFilterSchema',
    values: { q: 'Neon', tab: 'aliases' },
    resultCount: 1,
    resetHref: '/app/identity-authority',
  },
  dataTable: {
    columns: ['displayName', 'state', 'version'],
    rows: [{ id: 'person-1', displayName: 'Neon Harbor', state: 'active' }],
    sort: 'displayName',
    selection: ['person-1'],
    density: 'compact',
  },
  confirmationStep: {
    consequence: 'Remove the role facet from this person',
    affectedScope: 'person-1',
    expectedVersion: '"7"',
    stepUpState: 'required',
    idempotencyKey: 'idem-176',
  },
  offlineStatus: {
    connectivity: 'offline',
    intents: [{ id: 'intent-1', state: 'refused', reason: 'version_conflict' }],
    serverVersion: '"7"',
    localVersion: '"6"',
  },
} as const;
type PrimitiveComponent = (
  props: Readonly<Record<string, unknown>>,
) => React.ReactElement | null;
const renderPrimitives = async (
  overrides: Readonly<Record<string, unknown>> = {},
): Promise<string | null> => {
  const loaded = await loadPrimitives();
  const module = requireModule(loaded, 'IdentityAuthorityPrimitives');
  if (module === null) return null;
  const value = module.IdentityAuthorityPrimitives;
  expect(typeof value, 'IdentityAuthorityPrimitives export').toBe('function');
  if (typeof value !== 'function') return null;
  return renderToStaticMarkup(
    React.createElement(value as PrimitiveComponent, {
      ...componentProps,
      ...overrides,
    }),
  );
};
const present = async (
  state: Readonly<Record<string, unknown>>,
): Promise<unknown | null> => {
  const loaded = await loadState();
  const module = requireModule(loaded, 'identity-authority-state');
  if (module === null) return null;
  const value = module.presentIdentityAuthorityState;
  expect(typeof value, 'presentIdentityAuthorityState export').toBe('function');
  if (typeof value !== 'function') return null;
  return (value as (input: Readonly<Record<string, unknown>>) => unknown)(
    state,
  );
};
const error = {
  code: 'VERSION_MISMATCH',
  message: 'Review the current server version.',
  requestId: 'req-s03-180',
  details: null,
} as const;
describe('Phase 2 Slice 03 identity-authority primitives and state', () => {
  it('[P2-S03-AC-172] composes ActionBar fields with native actions, stable pending copy, and operation/version context', async () => {
    const markup = await renderPrimitives();
    if (markup === null) return;
    expect(markup).toContain('Save identity');
    expect(markup).toContain('Cancel');
    expect(markup).toContain('Remove identity');
    expect(markup).toContain('op-172');
    expect(markup).toContain('&quot;7&quot;');
    expect(markup).toMatch(/<button\b[^>]*>/);
    expect(markup).toMatch(/pending|Pending/);
  });
  it('[P2-S03-AC-173] composes CapabilityGate disclosure, recovery, disabled reason, and hidden protected labels', async () => {
    const disabled = await renderPrimitives();
    if (disabled === null) return;
    expect(disabled).toContain('Step-up verification is required.');
    expect(disabled).toContain('/app/identity-authority?tab=security');
    const hidden = await renderPrimitives({
      capabilityGate: {
        ...componentProps.capabilityGate,
        variant: 'not-rendered',
      },
    });
    if (hidden === null) return;
    expect(hidden).not.toContain('Step-up verification is required.');
    expect(hidden).not.toContain('Neon Harbor');
  });
  it('[P2-S03-AC-174] composes FilterBar labels, URL reset target, result count, and named filter values', async () => {
    const markup = await renderPrimitives();
    if (markup === null) return;
    expect(markup).toContain('IdentityAuthorityFilterSchema');
    expect(markup).toContain('Neon');
    expect(markup).toContain('1');
    expect(markup).toContain('/app/identity-authority');
    expect(markup).toMatch(/Apply|Reset/);
  });
  it('[P2-S03-AC-175] composes DataTable semantic headers, stable row identity, sort, selection, and density', async () => {
    const markup = await renderPrimitives();
    if (markup === null) return;
    expect(markup).toContain('<table');
    expect(markup).toContain('<th');
    expect(markup).toContain('Neon Harbor');
    expect(markup).toContain('person-1');
    expect(markup).toContain('displayName');
    expect(markup).toMatch(/compact|selected/i);
  });
  it('[P2-S03-AC-176] composes ConfirmationStep consequence, scope, version, step-up, and idempotency review', async () => {
    const markup = await renderPrimitives();
    if (markup === null) return;
    expect(markup).toContain('Remove the role facet from this person');
    expect(markup).toContain('person-1');
    expect(markup).toContain('&quot;7&quot;');
    expect(markup).toContain('required');
    expect(markup).toContain('idem-176');
    expect(markup).toMatch(/<form\b|<section\b/);
  });
  it('[P2-S03-AC-177] composes OfflineStatus and SyncConflict with refused intents and server/local versions without overwrite', async () => {
    const markup = await renderPrimitives();
    if (markup === null) return;
    expect(markup).toContain('offline');
    expect(markup).toContain('intent-1');
    expect(markup).toContain('refused');
    expect(markup).toContain('&quot;7&quot;');
    expect(markup).toContain('&quot;6&quot;');
    expect(markup).toMatch(/Review|Reapply|Discard|Retry/);
    expect(markup).not.toMatch(/automatically overwrite|last-write-wins/i);
  });
  it('[P2-S03-AC-178] presents idle as URL/server-owned and not artificially busy', async () => {
    const value = await present({ status: 'idle' });
    if (value === null) return;
    expect(value).toMatchObject({ status: 'idle', busy: false });
  });
  it('[P2-S03-AC-179] presents loading with an in-flight descriptor, delayed skeleton, copy, and safe prior content policy', async () => {
    const value = await present({
      status: 'loading',
      startedAt: '2026-09-01T00:00:00.000Z',
      preserveSafePriorContent: true,
    });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'loading',
      busy: true,
      startedAt: '2026-09-01T00:00:00.000Z',
      preserveSafePriorContent: true,
    });
    expect(value).toHaveProperty('loadingLabel', 'Loading current records');
  });
  it('[P2-S03-AC-180] presents typed error classes with exact recovery actions and retained valid input', async () => {
    const value = await present({ status: 'error', error, retryable: false });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'error',
      error,
      recoveryAction: 'sync-conflict',
      retainsInput: true,
    });
  });
  it('[P2-S03-AC-181] presents empty with a canonical reason distinction and exactly one legitimate next action', async () => {
    const value = await present({ status: 'empty', reason: 'filter-miss' });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'empty',
      emptyReason: 'filter-miss',
      action: 'reset-filters',
    });
  });
  it('[P2-S03-AC-182] presents success from the validated server resource with version and provenance intact', async () => {
    const data = [
      { id: 'person-1', provenance: [{ source: 'self_asserted' }] },
    ];
    const value = await present({
      status: 'success',
      data,
      version: '"7"',
      stale: false,
    });
    if (value === null) return;
    expect(value).toMatchObject({ status: 'success', data, version: '"7"' });
  });
  it('[P2-S03-AC-183] presents optimistic-pending by operation ID with pending controls disabled until confirmation', async () => {
    const data = [{ id: 'person-1', state: 'pending' }];
    const value = await present({
      status: 'optimistic-pending',
      data,
      operationId: 'op-183',
      version: '"7"',
    });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'optimistic-pending',
      operationId: 'op-183',
      controlsDisabled: true,
    });
  });
  it('[P2-S03-AC-184] presents optimistic-rollback with canonical preimage, refusal announcement, and retained input', async () => {
    const data = [{ id: 'person-1', state: 'active' }];
    const value = await present({
      status: 'optimistic-rollback',
      data,
      error,
      version: '"7"',
    });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'optimistic-rollback',
      data,
      error,
      restoredPreimage: true,
      retainsInput: true,
    });
  });
  it('[P2-S03-AC-185] presents disabled with a visible prerequisite and no executable action', async () => {
    const value = await present({
      status: 'disabled',
      reason: 'Named capability is required before editing.',
    });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'disabled',
      reason: 'Named capability is required before editing.',
      hasHandler: false,
    });
  });
  it('[P2-S03-AC-186] presents degraded last-known-good data with exact scope, freshness, request ID, and retry', async () => {
    const data = [{ id: 'person-1', state: 'active' }];
    const value = await present({
      status: 'degraded',
      data,
      requestId: 'req-s03-186',
      lastVerifiedAt: '2026-09-01T00:00:00.000Z',
    });
    if (value === null) return;
    expect(value).toMatchObject({
      status: 'degraded',
      data,
      requestId: 'req-s03-186',
      lastVerifiedAt: '2026-09-01T00:00:00.000Z',
      retryAction: 'canonical-refetch',
    });
  });
  it('[P2-S03-AC-187] defines the index route as server-first with public/protected/admin guards and URL-owned selection state', async () => {
    const loaded = await loadRoutes();
    const module = requireModule(loaded, 'identity-authority-routes');
    if (module === null) return;
    const registry = module.identityAuthorityRouteRegistry;
    expect(Array.isArray(registry)).toBe(true);
    if (!Array.isArray(registry)) return;
    const index = registry.find(
      (route): route is Record<string, unknown> =>
        typeof route === 'object' &&
        route !== null &&
        'path' in route &&
        route.path === '/app/identity-authority',
    );
    expect(index).toMatchObject({
      path: '/app/identity-authority',
      rendering: 'astro-ssr',
      variant: 'appPage',
      urlState: ['query', 'cursor', 'selected', 'tab'],
      invalidValues: 'replaceState',
      backRestores: ['selection', 'scroll'],
    });
    expect(index).toHaveProperty(
      'guards',
      expect.arrayContaining(['session', 'acting-context']),
    );
  });
  it('[P2-S03-AC-188] defines the record detail route with disclosure-safe 404, capability gate, expiry return, and canonical bookmark resolution', async () => {
    const loaded = await loadRoutes();
    const module = requireModule(loaded, 'identity-authority-routes');
    if (module === null) return;
    const registry = module.identityAuthorityRouteRegistry;
    expect(Array.isArray(registry)).toBe(true);
    if (!Array.isArray(registry)) return;
    const detail = registry.find(
      (route): route is Record<string, unknown> =>
        typeof route === 'object' &&
        route !== null &&
        'path' in route &&
        route.path === '/app/identity-authority/:recordId',
    );
    expect(detail).toMatchObject({
      path: '/app/identity-authority/:recordId',
      rendering: 'server-first',
      concealedStatus: 404,
      forbidden: 'capability-gate',
      expiredSession: 'preserve-safe-return-target',
      staleTarget: 'canonical-version-and-parent',
    });
  });
  it('[P2-S03-AC-189] defines the degraded boundary as a preserved safe shell that removes unsafe cache and retries canonical reads', async () => {
    const loaded = await loadRoutes();
    const module = requireModule(loaded, 'identity-authority-routes');
    if (module === null) return;
    const registry = module.identityAuthorityRouteRegistry;
    expect(Array.isArray(registry)).toBe(true);
    if (!Array.isArray(registry)) return;
    const degraded = registry.find(
      (route): route is Record<string, unknown> =>
        typeof route === 'object' &&
        route !== null &&
        'id' in route &&
        route.id === 'degraded',
    );
    expect(degraded).toMatchObject({
      id: 'degraded',
      variant: 'degradedPage',
      rendering: 'preserved-shell',
      unsafeCache: 'removed',
      retry: 'canonical-read',
      reconcileMutationStatus: true,
    });
  });
});
