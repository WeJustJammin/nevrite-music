import type { ChangeEvent } from 'react';

interface FormSubmitLike {
  readonly preventDefault: () => void;
}

export type InfrastructureSort = 'modified_desc' | 'modified_asc' | 'label_asc';

export interface FilterBarProps {
  readonly query: Readonly<{ q?: string; sort?: InfrastructureSort }>;
  readonly resultCount: number;
  readonly activeFilters: readonly string[];
  readonly onQueryChange: (value: string) => void;
  readonly onSortChange: (value: InfrastructureSort) => void;
  readonly onApply: () => void;
  readonly onReset: () => void;
}

export function FilterBar({
  query,
  resultCount,
  activeFilters,
  onQueryChange,
  onSortChange,
  onApply,
  onReset,
}: FilterBarProps) {
  const submit = (event: FormSubmitLike): void => {
    event.preventDefault();
    onApply();
  };

  const changeSort = (event: ChangeEvent<HTMLSelectElement>): void => {
    onSortChange(event.target.value as InfrastructureSort);
  };

  return (
    <form
      className="infra-filter-bar"
      onSubmit={submit}
      aria-labelledby="filter-heading"
    >
      <h2 id="filter-heading">Filter infrastructure records</h2>
      <div className="infra-filter-controls">
        <div className="infra-field">
          <label htmlFor="infrastructure-query">Search records</label>
          <input
            id="infrastructure-query"
            name="q"
            type="search"
            value={query.q ?? ''}
            onChange={(event) => onQueryChange(event.target.value)}
            aria-describedby="filter-help"
            autoComplete="off"
          />
          <p id="filter-help" className="infra-help">
            Search by the server-provided record label or summary.
          </p>
        </div>
        <div className="infra-field">
          <label htmlFor="infrastructure-sort">Sort records</label>
          <select
            id="infrastructure-sort"
            name="sort"
            value={query.sort ?? 'modified_desc'}
            onChange={changeSort}
          >
            <option value="modified_desc">Recently modified</option>
            <option value="modified_asc">Least recently modified</option>
            <option value="label_asc">Label A–Z</option>
          </select>
        </div>
      </div>
      <div className="infra-filter-actions">
        <button type="submit">Apply filters</button>
        <button
          type="button"
          className="infra-secondary-action"
          onClick={onReset}
        >
          Reset filters
        </button>
      </div>
      <p
        id="filter-result-count"
        className="infra-result-count"
        aria-live="polite"
        aria-atomic="true"
      >
        {resultCount} {resultCount === 1 ? 'record' : 'records'} shown
      </p>
      {activeFilters.length > 0 && (
        <div className="infra-active-filters" aria-label="Active filters">
          <span>Active filters:</span>
          <ul>
            {activeFilters.map((filter) => (
              <li key={filter}>{filter}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

export default FilterBar;
