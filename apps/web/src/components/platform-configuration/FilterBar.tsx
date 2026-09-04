import * as React from 'react';

export interface FilterBarProps {
  readonly schema: Readonly<Record<string, unknown>>;
  readonly values: Readonly<Record<string, string | null | undefined>>;
  readonly resultCount: number;
  readonly resetHref: string;
  readonly action?: string;
  readonly hiddenValues?: Readonly<Record<string, string>>;
  readonly escapeBehavior?: 'preserve' | 'search';
  readonly onApply?: (values: Readonly<Record<string, string>>) => void;
  readonly onReset?: (() => void) | undefined;
}

/** URL-addressable filters with persistent labels and a polite result count. */
export function FilterBar({
  schema,
  values,
  resultCount,
  resetHref,
  action,
  hiddenValues,
  escapeBehavior = 'preserve',
  onApply,
  onReset,
}: FilterBarProps): React.ReactElement {
  const [query, setQuery] = React.useState(values.query ?? '');
  const resetButtonRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    resetButtonRef.current?.removeAttribute('hidden');
  }, []);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromUrl = (): void => {
      setQuery(new URL(window.location.href).searchParams.get('query') ?? '');
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);
  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    if (onApply === undefined) return;
    event.preventDefault();
    const next = { query: query.trim() };
    onApply(next);
  };
  const reset = (): void => {
    setQuery('');
    onReset?.();
  };
  return (
    <form
      className="platform-configuration-filter-bar"
      method="get"
      {...(action === undefined ? {} : { action })}
      onSubmit={submit}
      data-schema={Object.keys(schema).join(',')}
      aria-labelledby="platform-configuration-filter-heading"
    >
      <h2 id="platform-configuration-filter-heading">
        Filter configuration records
      </h2>
      {Object.entries(hiddenValues ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="platform-configuration-field">
        <label htmlFor="platform-configuration-query">
          Search configuration
        </label>
        <input
          id="platform-configuration-query"
          name="query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && escapeBehavior === 'search') {
              setQuery('');
            }
          }}
          aria-describedby="platform-configuration-filter-help"
          autoComplete="off"
        />
        <p
          id="platform-configuration-filter-help"
          className="platform-configuration-help"
        >
          Filter values are applied to the URL;{' '}
          {escapeBehavior === 'search'
            ? 'Escape clears this search field.'
            : 'Escape leaves this filter unchanged.'}
        </p>
      </div>
      <div className="platform-configuration-actions">
        <button type="submit">Apply filters</button>
        {onReset === undefined ? null : (
          <button
            type="button"
            className="secondary-action"
            onClick={reset}
            hidden
            ref={resetButtonRef}
          >
            Reset filters
          </button>
        )}
        <noscript>
          <a className="secondary-action" href={resetHref}>
            Reset filters
          </a>
        </noscript>
      </div>
      <p
        className="platform-configuration-result-count"
        aria-live="polite"
        aria-atomic="true"
      >
        {resultCount} {resultCount === 1 ? 'record' : 'records'} shown
      </p>
    </form>
  );
}

export default FilterBar;
