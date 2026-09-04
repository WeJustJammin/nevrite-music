import type { IdentityDataTableProps } from './identity-authority-primitive-types';

const valueForRow = (
  row: Readonly<Record<string, unknown>>,
  key: string,
): string => {
  const value = row[key];
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value)
    : '';
};

export function IdentityDataTable({
  value,
}: {
  readonly value: IdentityDataTableProps;
}) {
  return (
    <section
      className="identity-data-region"
      aria-labelledby="identity-records-heading"
    >
      <h2 id="identity-records-heading">Identity records</h2>
      <p role="status" aria-live="polite">
        {value.rows.length} result{value.rows.length === 1 ? '' : 's'}
      </p>
      <div
        className="identity-table-wrap"
        data-density={value.density}
        data-responsive="mobile-tablet-desktop"
      >
        <table>
          <caption>Identity records sorted by {value.sort}</caption>
          <thead>
            <tr>
              {value.columns.map((column) => (
                <th
                  scope="col"
                  key={column}
                  aria-sort={column === value.sort ? 'ascending' : 'none'}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row) => {
              const rowId = valueForRow(row, 'id');
              const selected = value.selection.includes(rowId);
              return (
                <tr key={rowId} aria-selected={selected}>
                  {value.columns.map((column) => (
                    <td key={`${rowId}-${column}`}>
                      {column === 'id' ? (
                        <a href={`?selected=${encodeURIComponent(rowId)}`}>
                          {valueForRow(row, column)}
                        </a>
                      ) : (
                        valueForRow(row, column)
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
