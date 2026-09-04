import * as React from 'react';

import type { OwnershipRecord } from './ShadowClaimOwnershipWorkbench';

const selectionFor = (selectionUrl: string, recordId: string): string => {
  const params = new URLSearchParams(
    selectionUrl.startsWith('?') ? selectionUrl.slice(1) : selectionUrl,
  );
  params.set('selected', recordId);
  return `?${params.toString()}`;
};

const recordsFor = (
  records: readonly OwnershipRecord[],
  selectionUrl: string,
): readonly OwnershipRecord[] => {
  const params = new URLSearchParams(
    selectionUrl.startsWith('?') ? selectionUrl.slice(1) : selectionUrl,
  );
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const direction = params.get('sort') === 'state-desc' ? -1 : 1;
  return records
    .filter((record) =>
      query.length === 0
        ? true
        : `${record.state} ${record.id}`.toLowerCase().includes(query),
    )
    .toSorted(
      (left, right) => direction * left.state.localeCompare(right.state),
    );
};

const ProfileOwnershipList = ({
  records,
  recordId,
  selectionUrl,
}: Readonly<{
  records: readonly OwnershipRecord[];
  recordId: string;
  selectionUrl: string;
}>): React.ReactElement => {
  const params = new URLSearchParams(
    selectionUrl.startsWith('?') ? selectionUrl.slice(1) : selectionUrl,
  );
  const matchingRecords = recordsFor(records, selectionUrl);
  const visibleRecords = matchingRecords.slice(0, 100);
  const query = params.get('q') ?? '';
  const sort = params.get('sort') ?? 'state-asc';

  return (
    <section
      role="region"
      aria-label="Shadow ownership list"
      aria-labelledby="shadow-claim-ownership-list-heading"
    >
      <h2 id="shadow-claim-ownership-list-heading">Shadow ownership list</h2>
      <p>Server-authorized records only. Matching is advisory.</p>
      <p data-uniqueness="not-a-constraint">
        A possible match does not establish uniqueness or control.
      </p>
      <form method="get" action="/app/profiles-verification" data-filter-bar>
        <input
          type="hidden"
          name="tab"
          value={params.get('tab') ?? 'ownership'}
        />
        <label>
          Filter ownership records
          <input name="q" defaultValue={query} type="search" />
        </label>
        <label>
          Sort ownership records
          <select name="sort" defaultValue={sort}>
            <option value="state-asc">State A–Z</option>
            <option value="state-desc">State Z–A</option>
          </select>
        </label>
        <button type="submit">Apply filters</button>
        <a href="/app/profiles-verification?tab=ownership">Reset filters</a>
        <span role="status" aria-live="polite">
          {matchingRecords.length} ownership records
        </span>
      </form>
      {matchingRecords.length > visibleRecords.length ? (
        <p role="status">
          Showing the first 100 records. Refine filters to keep the workbench
          bounded.
        </p>
      ) : null}
      {visibleRecords.length === 0 ? (
        <ul data-empty-state>
          <li>
            {records.length === 0
              ? 'No ownership records are available.'
              : 'No ownership records match the current filters.'}
          </li>
          <li>
            <a
              href={
                records.length === 0
                  ? '/claim'
                  : '/app/profiles-verification?tab=ownership'
              }
            >
              {records.length === 0
                ? 'Open invitation remediation'
                : 'Reset filters'}
            </a>
          </li>
        </ul>
      ) : null}
      <table data-ownership-table data-density="comfortable">
        <caption>Shadow ownership records</caption>
        <thead>
          <tr>
            <th
              scope="col"
              aria-sort={sort === 'state-desc' ? 'descending' : 'ascending'}
            >
              State
            </th>
            <th scope="col">Version</th>
            <th scope="col">Selection</th>
          </tr>
        </thead>
        <tbody>
          {visibleRecords.map((record) => (
            <tr key={record.id} aria-selected={record.id === recordId}>
              <th scope="row">{record.state}</th>
              <td>{record.version}</td>
              <td>
                <a
                  href={selectionFor(selectionUrl, record.id)}
                  aria-current={record.id === recordId ? 'page' : undefined}
                >
                  Review record
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul data-ownership-priority-list>
        {visibleRecords.map((record) => (
          <li key={record.id}>
            <a
              href={selectionFor(selectionUrl, record.id)}
              aria-current={record.id === recordId ? 'page' : undefined}
            >
              {record.state} record, version {record.version}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProfileOwnershipList;
