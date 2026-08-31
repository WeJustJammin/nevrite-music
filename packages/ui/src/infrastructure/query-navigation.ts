import {
  InfrastructureQuerySchema,
  InvalidationHintSchema,
  NavigationStateSchema,
} from '@wejammin/contracts';

export interface InfrastructureNavigationQuery {
  readonly q?: string;
  readonly sort?: 'modified_desc' | 'modified_asc' | 'label_asc';
  readonly filter?: 'all' | 'active' | 'degraded';
  readonly cursor?: string;
  readonly selected?: string;
  readonly tab?: 'facts' | 'provenance' | 'history';
}

export interface InfrastructureNavigationState {
  readonly query: InfrastructureNavigationQuery;
  readonly scrollOffset: number;
}

type ParsedInfrastructureQuery = {
  readonly q?: string | undefined;
  readonly sort?: 'modified_desc' | 'modified_asc' | 'label_asc' | undefined;
  readonly filter?: 'all' | 'active' | 'degraded' | undefined;
  readonly cursor?: string | undefined;
  readonly selected?: string | undefined;
  readonly tab?: 'facts' | 'provenance' | 'history' | undefined;
};

function withoutUndefinedQueryValues(
  query: ParsedInfrastructureQuery,
): InfrastructureNavigationQuery {
  const normalized: {
    -readonly [
      Key in keyof InfrastructureNavigationQuery
    ]?: InfrastructureNavigationQuery[Key];
  } = {};
  if (query.q !== undefined) normalized.q = query.q;
  if (query.sort !== undefined) normalized.sort = query.sort;
  if (query.filter !== undefined) normalized.filter = query.filter;
  if (query.cursor !== undefined) normalized.cursor = query.cursor;
  if (query.selected !== undefined) normalized.selected = query.selected;
  if (query.tab !== undefined) normalized.tab = query.tab;
  return normalized;
}

export function roundTripNavigationState(
  state: InfrastructureNavigationState,
): InfrastructureNavigationState {
  NavigationStateSchema.parse(state);
  return state;
}

export interface InvalidationMessageInput {
  readonly entityId: string;
  readonly entityType: 'infrastructure_record';
  readonly hintedVersion?: string;
}

export interface InvalidationMessage {
  readonly kind: 'invalidate';
  readonly entityId: string;
  readonly hintedVersion?: string;
  readonly carriesCanonicalState: false;
}

export function createInvalidationMessage(
  input: InvalidationMessageInput,
): InvalidationMessage {
  const parsed = InvalidationHintSchema.parse(input);
  return parsed.hintedVersion === undefined
    ? {
        kind: 'invalidate',
        entityId: parsed.entityId,
        carriesCanonicalState: false,
      }
    : {
        kind: 'invalidate',
        entityId: parsed.entityId,
        hintedVersion: parsed.hintedVersion,
        carriesCanonicalState: false,
      };
}

export function parseInfrastructureQuery(
  input: URL | URLSearchParams | string,
): InfrastructureNavigationQuery {
  const params =
    typeof input === 'string'
      ? new URL(input, 'https://wejamm.in').searchParams
      : input instanceof URL
        ? input.searchParams
        : input;
  const candidate: Record<string, string> = {};
  const names = ['q', 'sort', 'filter', 'cursor', 'selected', 'tab'] as const;
  for (const name of names) {
    const value = params.get(name);
    if (value !== null) candidate[name] = value;
  }
  const parsed = InfrastructureQuerySchema.safeParse(candidate);
  return parsed.success ? withoutUndefinedQueryValues(parsed.data) : {};
}

export function serializeInfrastructureQuery(
  query: InfrastructureNavigationQuery,
): string {
  const candidate: Record<string, string> = {};
  for (const name of [
    'q',
    'sort',
    'filter',
    'cursor',
    'selected',
    'tab',
  ] as const) {
    const value = query[name];
    if (value !== undefined) candidate[name] = value;
  }
  const parsed = InfrastructureQuerySchema.parse(candidate);
  const params = new URLSearchParams();
  for (const name of [
    'q',
    'sort',
    'filter',
    'cursor',
    'selected',
    'tab',
  ] as const) {
    const value = parsed[name];
    if (value !== undefined) params.set(name, value);
  }
  return params.toString();
}
