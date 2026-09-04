import * as React from 'react';

export type DataTableColumn = Readonly<{
  key: string;
  label: string;
  priority?: 'primary' | 'secondary';
  render?: (row: DataTableRow) => React.ReactNode;
}>;

export type DataTableRow = Readonly<{
  id: string;
  [key: string]: unknown;
}>;

export interface DataTableProps {
  readonly columns: readonly DataTableColumn[];
  readonly rows: readonly DataTableRow[];
  readonly sort?: Readonly<{
    key: string;
    direction: 'ascending' | 'descending';
  }> | null;
  readonly selection?: Readonly<{
    selectedId: string | null;
    onSelect?: (id: string) => void;
    hrefFor?: (id: string) => string;
  }>;
  readonly density?: 'comfortable' | 'compact';
  readonly caption?: string;
  readonly onSort?: (key: string) => void;
}

const cellValue = (
  row: DataTableRow,
  column: DataTableColumn,
): React.ReactNode => column.render?.(row) ?? String(row[column.key] ?? '—');

const MAX_VISIBLE_ROWS = 100;

/** Semantic desktop table plus a priority list for narrow screens. */
export function DataTable({
  columns,
  rows,
  sort = null,
  selection,
  density = 'comfortable',
  caption = 'Platform configuration records',
  onSort,
}: DataTableProps): React.ReactElement {
  const secondaryColumns = columns.filter(
    (column) => column.priority === 'secondary',
  );
  const visibleRows = rows.slice(0, MAX_VISIBLE_ROWS);
  const selectionHref = (id: string): string =>
    selection?.hrefFor?.(id) ?? `?selected=${encodeURIComponent(id)}`;
  return (
    <div className="platform-configuration-table-wrap" data-density={density}>
      <table className="platform-configuration-data-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? sort.direction : 'none'}
                >
                  <button
                    type="button"
                    aria-label={`Sort by ${column.label}`}
                    onClick={() => onSort?.(column.key)}
                  >
                    {column.label}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const selected = selection?.selectedId === row.id;
            return (
              <tr key={row.id} aria-selected={selected || undefined}>
                {columns.map((column, index) =>
                  index === 0 ? (
                    <th
                      key={`${row.id}-${column.key}`}
                      scope="row"
                      data-label={column.label}
                    >
                      <a
                        href={selectionHref(row.id)}
                        aria-current={selected ? 'page' : undefined}
                        onClick={(event) => {
                          if (selection?.onSelect === undefined) return;
                          event.preventDefault();
                          selection.onSelect(row.id);
                        }}
                      >
                        {cellValue(row, column)}
                      </a>
                    </th>
                  ) : (
                    <td
                      key={`${row.id}-${column.key}`}
                      data-label={column.label}
                    >
                      {cellValue(row, column)}
                    </td>
                  ),
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul
        className="platform-configuration-priority-list"
        aria-label="Configuration records on narrow screens"
      >
        {visibleRows.map((row) => {
          const selected = selection?.selectedId === row.id;
          return (
            <li
              key={`priority-${row.id}`}
              aria-current={selected ? 'page' : undefined}
            >
              <a
                href={selectionHref(row.id)}
                onClick={(event) => {
                  if (selection?.onSelect === undefined) return;
                  event.preventDefault();
                  selection.onSelect(row.id);
                }}
              >
                {cellValue(row, columns[0] ?? { key: 'id', label: 'Record' })}
              </a>
              <dl>
                {secondaryColumns.map((column) => (
                  <div key={`${row.id}-priority-${column.key}`}>
                    <dt>{column.label}</dt>
                    <dd>{cellValue(row, column)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
      {rows.length > MAX_VISIBLE_ROWS ? (
        <p className="platform-configuration-help" role="status">
          Showing the first {MAX_VISIBLE_ROWS} records. Use the server-provided
          cursor or a narrower filter for the next bounded window.
        </p>
      ) : null}
    </div>
  );
}

export default DataTable;
