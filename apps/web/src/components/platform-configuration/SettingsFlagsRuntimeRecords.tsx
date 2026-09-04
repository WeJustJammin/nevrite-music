import * as React from 'react';

import DataTable from './DataTable';
import FilterBar from './FilterBar';
import SettingsFlagsRuntimeBackLink from './SettingsFlagsRuntimeBackLink';
import type { PlatformConfigurationBreakpoint } from './platform-configuration-workbench-types';
import type { PlatformConfigurationRecord } from './platform-configuration-workbench-types';
import {
  displayValue,
  recordKey,
  tableColumns,
  tableRows,
  type SortState,
} from './settings-flags-runtime-record-utils';
import { isSafeConfigurationKey } from './platform-configuration-presentation-security';

export interface SettingsFlagsRuntimeRecordsProps {
  readonly records: readonly PlatformConfigurationRecord[];
  readonly totalRecords: number;
  readonly breakpoint: PlatformConfigurationBreakpoint;
  readonly selectedId: string | null;
  readonly filter: string;
  readonly selectionUrl: string;
  readonly sort: SortState | null;
  readonly onSort: (key: string) => void;
  readonly onFilterSubmit: (value: string) => void;
  readonly onFilterReset?: (() => void) | undefined;
  readonly onSelection: (id: string) => string;
}

export const SettingsFlagsRuntimeRecords = ({
  records,
  totalRecords,
  breakpoint,
  selectedId,
  filter,
  selectionUrl,
  sort,
  onSort,
  onFilterSubmit,
  onFilterReset,
  onSelection,
}: SettingsFlagsRuntimeRecordsProps): React.ReactElement => {
  const record =
    records.find((candidate) => candidate.id === selectedId) ?? null;
  const selectionHref = (id: string): string => {
    const url = new URL(selectionUrl, 'https://wejamm.in');
    url.searchParams.set('selected', id);
    url.hash = '';
    return `${url.pathname}${url.search}`;
  };
  const resetHref = new URL(selectionUrl, 'https://wejamm.in');
  resetHref.searchParams.delete('query');
  resetHref.searchParams.delete('selected');
  resetHref.hash = '';
  const filterResetHref = `${resetHref.pathname}${resetHref.search}`;
  const hiddenValues: Record<string, string> = {};
  for (const name of [
    'tab',
    'key',
    'view',
    'cursor',
    'state',
    'projection',
    'workbench',
    'responsive',
    'contract',
    'registry',
    'sort',
  ]) {
    const value = resetHref.searchParams.get(name);
    if (value !== null) hiddenValues[name] = value;
  }
  const filterMiss = records.length === 0 && filter.trim().length > 0;
  return (
    <>
      <SettingsFlagsRuntimeBackLink
        breakpoint={breakpoint}
        selectedId={selectedId}
        selectionUrl={selectionUrl}
      />
      <FilterBar
        schema={{ query: 'string' }}
        values={{ query: filter }}
        resultCount={records.length}
        action={filterResetHref}
        resetHref={filterResetHref}
        hiddenValues={hiddenValues}
        escapeBehavior="search"
        onApply={(values) => onFilterSubmit(values.query ?? '')}
        onReset={onFilterReset}
      />
      {filterMiss && totalRecords > 0 ? (
        <p className="platform-configuration-empty" data-state="filter-miss">
          No records match the current filter.{' '}
          <a href={filterResetHref}>Reset filters</a>
        </p>
      ) : null}
      <DataTable
        columns={tableColumns}
        rows={tableRows(records)}
        sort={sort}
        onSort={onSort}
        selection={{
          selectedId,
          hrefFor: selectionHref,
          onSelect: (id) => {
            onSelection(id);
          },
        }}
        caption="Settings and flags runtime records"
      />

      <section
        className="platform-configuration-record-detail"
        aria-labelledby="settings-flags-runtime-detail-heading"
      >
        <h3 id="settings-flags-runtime-detail-heading">
          Selected configuration detail
        </h3>
        {record === null ? (
          <p>No selected configuration record is disclosed.</p>
        ) : (
          <>
            <dl className="platform-configuration-record-meta">
              <div>
                <dt>RecordHeader</dt>
                <dd>
                  <code>{record.id}</code>
                </dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>
                  <code>{record.version}</code>
                </dd>
              </div>
              <div>
                <dt>StateLabel</dt>
                <dd>{record.state}</dd>
              </div>
              <div>
                <dt>Configuration key</dt>
                <dd>{recordKey(record)}</dd>
              </div>
            </dl>
            <section aria-labelledby="settings-flags-runtime-provenance-heading">
              <h4 id="settings-flags-runtime-provenance-heading">
                ProvenanceFact
              </h4>
              <ol>
                {record.provenance.map((fact) => (
                  <li key={`${fact.source}-${fact.at}`}>
                    <span>{fact.source}</span>; {fact.evidence};{' '}
                    <time dateTime={fact.at}>{fact.at}</time>; {fact.visibility}
                  </li>
                ))}
              </ol>
            </section>
            <dl className="platform-configuration-record-meta">
              {Object.entries(record.projection)
                .filter(([key]) => isSafeConfigurationKey(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>
                      <code>{displayValue(value)}</code>
                    </dd>
                  </div>
                ))}
            </dl>
          </>
        )}
      </section>
    </>
  );
};

export default SettingsFlagsRuntimeRecords;
