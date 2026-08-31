import type { InfrastructureNavigationQuery } from '@wejammin/ui/infrastructure/navigation';
import type { InfrastructureRecord } from '@wejammin/ui/infrastructure/presentation';
import DataTable from './DataTable';
import FilterBar, { type InfrastructureSort } from './FilterBar';

export interface InfrastructureRecordListProps {
  readonly records: readonly InfrastructureRecord[];
  readonly query: InfrastructureNavigationQuery;
  readonly selectedId: string | null;
  readonly activeFilters: readonly string[];
  readonly hrefForRecord: (recordId: string) => string;
  readonly onQueryChange: (value: string) => void;
  readonly onSortChange: (value: InfrastructureSort) => void;
  readonly onApply: () => void;
  readonly onReset: () => void;
  readonly onSortByLabel: () => void;
}

export function InfrastructureRecordList({
  records,
  query,
  selectedId,
  activeFilters,
  hrefForRecord,
  onQueryChange,
  onSortChange,
  onApply,
  onReset,
  onSortByLabel,
}: InfrastructureRecordListProps) {
  const empty = records.length === 0;

  return (
    <section className="infra-record-list" aria-labelledby="records-heading">
      <div className="infra-region-heading">
        <h3 id="records-heading">Infrastructure records</h3>
        <p>Native links keep selection addressable and bookmarkable.</p>
      </div>
      <FilterBar
        query={query}
        resultCount={Math.min(records.length, 100)}
        activeFilters={activeFilters}
        onQueryChange={onQueryChange}
        onSortChange={onSortChange}
        onApply={onApply}
        onReset={onReset}
      />
      {empty ? (
        <div className="infra-empty-state" role="status">
          <h3>No infrastructure records in this view</h3>
          <p>
            {query.q === undefined
              ? 'No records are available in the current canonical projection.'
              : 'No records match the active filter. Reset filters to review the full projection.'}
          </p>
          {query.q !== undefined && (
            <button type="button" onClick={onReset}>
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <DataTable
          records={records}
          selectedId={selectedId}
          hrefForRecord={hrefForRecord}
          onSortByLabel={onSortByLabel}
          sort={query.sort ?? 'modified_desc'}
        />
      )}
    </section>
  );
}

export default InfrastructureRecordList;
