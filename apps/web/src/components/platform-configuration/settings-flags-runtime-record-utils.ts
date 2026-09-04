import {
  isSafeConfigurationKey,
  sanitizeConfigurationValue,
} from './platform-configuration-presentation-security';
import type { PlatformConfigurationRecord } from './platform-configuration-workbench-types';
import type { DataTableColumn, DataTableRow } from './DataTable';

export type SortState = Readonly<{
  key: string;
  direction: 'ascending' | 'descending';
}>;

export const nextSortState = (
  current: SortState | null,
  key: string,
): SortState =>
  current?.key === key
    ? {
        key,
        direction:
          current.direction === 'ascending' ? 'descending' : 'ascending',
      }
    : { key, direction: 'ascending' };

export const displayValue = (value: unknown): string => {
  const safe = sanitizeConfigurationValue(value);
  if (safe === null) return 'Not disclosed';
  if (typeof safe === 'string') return safe;
  try {
    return JSON.stringify(safe);
  } catch {
    return 'Not disclosed';
  }
};

export const recordKey = (record: PlatformConfigurationRecord): string => {
  const key = record.projection.key;
  return typeof key === 'string' && isSafeConfigurationKey(key)
    ? key
    : record.id;
};

export const tableRows = (
  records: readonly PlatformConfigurationRecord[],
): readonly DataTableRow[] =>
  records.map((record) => ({
    id: record.id,
    key: recordKey(record),
    version: record.version,
    state: record.state,
    source: record.provenance[0]?.source ?? 'canonical response',
  }));

export const tableColumns: readonly DataTableColumn[] = [
  { key: 'key', label: 'Configuration key', priority: 'primary' },
  { key: 'state', label: 'State', priority: 'primary' },
  { key: 'version', label: 'Version', priority: 'secondary' },
  { key: 'source', label: 'Source', priority: 'secondary' },
];

export const matchesFilter = (
  record: PlatformConfigurationRecord,
  query: string,
): boolean => {
  const needle = query.trim().toLocaleLowerCase();
  if (needle.length === 0) return true;
  const searchable = [
    recordKey(record),
    record.state,
    ...record.provenance.flatMap((fact) => [fact.source, fact.evidence]),
  ];
  return searchable.some((value) => value.toLocaleLowerCase().includes(needle));
};

export const filteredRecords = (
  records: readonly PlatformConfigurationRecord[],
  query: string,
): readonly PlatformConfigurationRecord[] =>
  records.filter((record) => matchesFilter(record, query));

const sortableValue = (
  record: PlatformConfigurationRecord,
  key: string,
): string => {
  if (key === 'key') return recordKey(record);
  if (key === 'source') return record.provenance[0]?.source ?? '';
  if (key === 'version') return record.version;
  if (key === 'state') return record.state;
  return '';
};

export const sortRecords = (
  records: readonly PlatformConfigurationRecord[],
  sort: SortState | null,
): readonly PlatformConfigurationRecord[] => {
  if (sort === null) return records;
  return [...records].sort((left, right) => {
    const compared = sortableValue(left, sort.key).localeCompare(
      sortableValue(right, sort.key),
      undefined,
      { numeric: true, sensitivity: 'base' },
    );
    if (compared !== 0)
      return sort.direction === 'ascending' ? compared : -compared;
    return left.id.localeCompare(right.id);
  });
};

export const selectedRecord = (
  records: readonly PlatformConfigurationRecord[],
  selectedId: string | null,
): PlatformConfigurationRecord | null =>
  records.find((record) => record.id === selectedId) ?? null;
