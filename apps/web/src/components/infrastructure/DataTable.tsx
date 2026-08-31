import type { InfrastructureRecord } from '@wejammin/ui/infrastructure/presentation';

export interface DataTableProps {
  readonly records: readonly InfrastructureRecord[];
  readonly selectedId: string | null;
  readonly hrefForRecord: (recordId: string) => string;
  readonly onSortByLabel: () => void;
  readonly sort: 'modified_desc' | 'modified_asc' | 'label_asc';
}

const MAX_VISIBLE_ROWS = 100;

export function DataTable({
  records,
  selectedId,
  hrefForRecord,
  onSortByLabel,
  sort,
}: DataTableProps) {
  const sortedRecords = [...records].sort((left, right) => {
    if (sort === 'label_asc') {
      return left.label.localeCompare(right.label);
    }
    const direction = sort === 'modified_asc' ? 1 : -1;
    return direction * left.modifiedAt.localeCompare(right.modifiedAt);
  });
  const visibleRecords = sortedRecords.slice(0, MAX_VISIBLE_ROWS);

  return (
    <div className="infra-table-wrap">
      <table className="infra-data-table">
        <caption>Infrastructure records</caption>
        <thead>
          <tr>
            <th
              scope="col"
              aria-sort={sort === 'label_asc' ? 'ascending' : 'none'}
            >
              <button type="button" onClick={onSortByLabel}>
                Label
              </button>
            </th>
            <th scope="col">Summary</th>
            <th scope="col">Version</th>
            <th
              scope="col"
              aria-sort={
                sort === 'modified_asc'
                  ? 'ascending'
                  : sort === 'modified_desc'
                    ? 'descending'
                    : 'none'
              }
            >
              Last modified
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleRecords.map((record) => {
            const selected = selectedId === record.id;
            return (
              <tr key={record.id} aria-selected={selected}>
                <th scope="row">
                  <a
                    href={hrefForRecord(record.id)}
                    aria-current={selected ? 'page' : undefined}
                  >
                    {record.label}
                  </a>
                </th>
                <td>{record.summary}</td>
                <td>
                  <code>{record.version}</code>
                </td>
                <td>
                  <time dateTime={record.modifiedAt}>{record.modifiedAt}</time>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sortedRecords.length > MAX_VISIBLE_ROWS && (
        <p className="infra-help" role="status">
          Showing the first 100 records. Use filters or the server-provided
          cursor to request another bounded window.
        </p>
      )}
    </div>
  );
}

export default DataTable;
