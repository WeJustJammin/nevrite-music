export const listQueryWithOptionalFields = {
  resourceKind: 'content_type',
  keyPrefix: 'release',
  lifecycle: 'active',
  limit: '25',
  cursor: 'opaque-next-cursor',
  sort: 'updatedAt',
  direction: 'desc',
} as const;

export const listQueryWithStateFields = {
  resourceKind: 'schema_artifact',
  state: 'compiled',
  limit: '10',
  cursor: 'opaque-next-cursor-2',
  sort: 'version',
  direction: 'asc',
} as const;

export const LIST_QUERY_OPTIONAL_FIELDS = [
  'resourceKind',
  'keyPrefix',
  'lifecycle',
  'state',
  'limit',
  'cursor',
  'sort',
  'direction',
] as const;
