import type {
  AdminWorkspaceActiveProps,
  AdminWorkspaceAsyncState,
  AdminWorkspaceRecord,
} from './admin-workspace-types';

export const asRecord = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : {};

export const textValue = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

export const identifier = (value: unknown): string | null => {
  const candidate = textValue(value);
  return candidate !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      candidate,
    )
    ? candidate
    : null;
};

export const operationId = (record: AdminWorkspaceRecord): string | null =>
  textValue(asRecord(record.projection).operationId);

export const freshnessFor = (
  record: AdminWorkspaceRecord,
  state: AdminWorkspaceAsyncState,
): string => {
  const projection = asRecord(record.projection);
  const aggregate = textValue(projection.aggregateFreshness);
  const freshness = textValue(projection.freshness);
  if (state.stale === true || freshness === 'stale') return 'stale';
  if (aggregate === 'partial') return 'partial';
  if (
    freshness === 'healthy' ||
    freshness === 'partial' ||
    freshness === 'unknown' ||
    freshness === 'failed'
  )
    return freshness;
  return 'unknown';
};

export const safeRecords = (
  state: AdminWorkspaceAsyncState,
): readonly AdminWorkspaceRecord[] =>
  Array.isArray(state.data) ? state.data.filter((item) => item !== null) : [];

const INBOX_CONTEXT_KEYS = [
  'cursor',
  'limit',
  'taskClasses',
  'states',
  'staleAfter',
  'key',
  'query',
  'view',
  'projection',
  'workbench',
  'responsive',
  'contract',
  'registry',
] as const;

const inboxUrl = (props: AdminWorkspaceActiveProps): URL => {
  const url = new URL(
    props.canonicalUrl ?? '/app/platform-configuration-admin',
    'https://wejamm.in',
  );
  for (const name of INBOX_CONTEXT_KEYS) {
    const value = props.query?.[name];
    if (typeof value === 'string' && value.length > 0)
      url.searchParams.set(name, value);
  }
  url.searchParams.set('tab', 'inbox');
  return url;
};

export const inboxHref = (
  props: AdminWorkspaceActiveProps,
  selectedId: string,
): string => {
  const url = inboxUrl(props);
  url.searchParams.set('selected', selectedId);
  return `${url.pathname}${url.search}`;
};

export const inboxBackHref = (props: AdminWorkspaceActiveProps): string => {
  const url = inboxUrl(props);
  url.searchParams.delete('selected');
  return `${url.pathname}${url.search}`;
};

export const invokeRefetch = (
  props: AdminWorkspaceActiveProps,
  reason: string,
): void => {
  if (props.onCanonicalRefetch !== undefined) {
    void props.onCanonicalRefetch(reason);
    return;
  }
  if (typeof window !== 'undefined') window.location.reload();
};
