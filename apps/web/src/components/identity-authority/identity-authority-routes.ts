const tabs = [
  'people',
  'auth',
  'aliases',
  'relationships',
  'identifiers',
] as const;

export type IdentityAuthorityTab = (typeof tabs)[number];

export interface IdentityAuthorityRouteDescriptor {
  readonly id: 'index' | 'detail' | 'degraded';
  readonly path: string;
  readonly rendering: 'astro-ssr' | 'server-first' | 'preserved-shell';
  readonly variant: 'appPage' | 'degradedPage';
  readonly urlState?: readonly ('query' | 'cursor' | 'selected' | 'tab')[];
  readonly invalidValues?: 'replaceState';
  readonly backRestores?: readonly ('selection' | 'scroll')[];
  readonly guards?: readonly ('session' | 'acting-context' | 'capability')[];
  readonly concealedStatus?: 404;
  readonly forbidden?: 'capability-gate';
  readonly expiredSession?: 'preserve-safe-return-target';
  readonly staleTarget?: 'canonical-version-and-parent';
  readonly unsafeCache?: 'removed';
  readonly retry?: 'canonical-read';
  readonly reconcileMutationStatus?: true;
}

export const identityAuthorityRouteRegistry: readonly IdentityAuthorityRouteDescriptor[] =
  [
    {
      id: 'index',
      path: '/app/identity-authority',
      rendering: 'astro-ssr',
      variant: 'appPage',
      urlState: ['query', 'cursor', 'selected', 'tab'],
      invalidValues: 'replaceState',
      backRestores: ['selection', 'scroll'],
      guards: ['session', 'acting-context'],
    },
    {
      id: 'detail',
      path: '/app/identity-authority/:recordId',
      rendering: 'server-first',
      variant: 'appPage',
      concealedStatus: 404,
      forbidden: 'capability-gate',
      expiredSession: 'preserve-safe-return-target',
      staleTarget: 'canonical-version-and-parent',
      guards: ['session', 'acting-context'],
    },
    {
      id: 'degraded',
      path: '/system/degraded',
      rendering: 'preserved-shell',
      variant: 'degradedPage',
      unsafeCache: 'removed',
      retry: 'canonical-read',
      reconcileMutationStatus: true,
    },
  ] as const;

export interface IdentityAuthorityQuery {
  readonly q?: string;
  readonly cursor?: string;
  readonly selected?: string;
  readonly tab?: IdentityAuthorityTab;
}

/** Parse only URL-owned view state. Nothing returned by this function grants capability. */
export function normalizeIdentityAuthorityQuery(
  input: URLSearchParams | URL | Readonly<Record<string, string | undefined>>,
): IdentityAuthorityQuery {
  const values: Record<string, string> = {};
  const get = (name: string): string | null | undefined =>
    input instanceof URLSearchParams
      ? input.get(name)
      : input instanceof URL
        ? input.searchParams.get(name)
        : input[name];
  for (const name of ['q', 'cursor', 'selected', 'tab'] as const) {
    const value = get(name);
    if (typeof value === 'string' && value.length > 0) values[name] = value;
  }
  const normalized: Record<string, string> = {};
  if (values.q !== undefined && values.q.length <= 160)
    normalized.q = values.q.trim();
  if (values.cursor !== undefined && values.cursor.length <= 512)
    normalized.cursor = values.cursor;
  if (values.selected !== undefined && values.selected.length <= 160)
    normalized.selected = values.selected;
  if (
    values.tab !== undefined &&
    tabs.includes(values.tab as IdentityAuthorityTab)
  )
    normalized.tab = values.tab;
  return normalized as IdentityAuthorityQuery;
}

export function serializeIdentityAuthorityQuery(
  query: IdentityAuthorityQuery,
): string {
  const params = new URLSearchParams();
  for (const name of ['q', 'cursor', 'selected', 'tab'] as const) {
    const value = query[name];
    if (value !== undefined) params.set(name, value);
  }
  return params.toString();
}

export interface IdentityAuthorityInvalidationMessage {
  readonly kind: 'invalidate';
  readonly tab: IdentityAuthorityTab;
  readonly entityId: string;
  readonly hintedVersion?: string;
  readonly carriesCanonicalState: false;
}

export function createIdentityAuthorityInvalidationMessage(
  input: Readonly<{
    tab: IdentityAuthorityTab;
    entityId: string;
    hintedVersion?: string;
  }>,
): IdentityAuthorityInvalidationMessage {
  if (!tabs.includes(input.tab) || input.entityId.trim() === '') {
    throw new TypeError(
      'Identity authority invalidation requires a tab and entity',
    );
  }
  return input.hintedVersion === undefined
    ? {
        kind: 'invalidate',
        tab: input.tab,
        entityId: input.entityId,
        carriesCanonicalState: false,
      }
    : {
        kind: 'invalidate',
        tab: input.tab,
        entityId: input.entityId,
        hintedVersion: input.hintedVersion,
        carriesCanonicalState: false,
      };
}

export function isIdentityAuthorityInvalidationMessage(
  input: unknown,
): input is IdentityAuthorityInvalidationMessage {
  if (typeof input !== 'object' || input === null) return false;
  const value = input as Record<string, unknown>;
  const allowedKeys = new Set([
    'kind',
    'tab',
    'entityId',
    'hintedVersion',
    'carriesCanonicalState',
  ]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) return false;
  return (
    value.kind === 'invalidate' &&
    typeof value.tab === 'string' &&
    tabs.includes(value.tab as IdentityAuthorityTab) &&
    typeof value.entityId === 'string' &&
    value.entityId.trim().length > 0 &&
    value.carriesCanonicalState === false &&
    (value.hintedVersion === undefined ||
      typeof value.hintedVersion === 'string')
  );
}
