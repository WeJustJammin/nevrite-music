import * as React from 'react';

import type {
  AdminWorkspaceActiveProps,
  AdminWorkspaceRecord,
} from './admin-workspace-types';
import {
  asRecord,
  freshnessFor,
  inboxBackHref,
  identifier,
  inboxHref,
  textValue,
} from './admin-workspace-view-utils';

export interface AdminWorkspaceInboxProps {
  readonly props: AdminWorkspaceActiveProps;
  readonly records: readonly AdminWorkspaceRecord[];
}

const displayFreshness = (value: string): string => value;

export const AdminWorkspaceInbox = ({
  props,
  records,
}: AdminWorkspaceInboxProps): React.ReactElement => {
  const visible = records
    .filter((record) => operationId(record) === 'CFG-05B-01')
    .slice(0, 100);
  const selected =
    props.selectedId === null
      ? (visible[0] ?? null)
      : (visible.find((record) => identifier(record.id) === props.selectedId) ??
        null);
  const selectedTaskId = selected
    ? (identifier(asRecord(selected.projection).taskId) ??
      identifier(selected.id))
    : null;
  const selectedProjection = selected ? asRecord(selected.projection) : {};
  const selectedFreshness = selected
    ? freshnessFor(selected, props.initial)
    : 'unknown';
  const selectedAggregateFreshness = textValue(
    selectedProjection.aggregateFreshness,
  );
  return (
    <section
      aria-label="Admin task inbox"
      className="platform-configuration-admin-inbox"
    >
      <h3>Admin task inbox</h3>
      <div
        aria-label="Task list"
        role="region"
        aria-live="polite"
        aria-atomic="true"
        className="platform-configuration-admin-task-list"
        data-render-limit="100"
        data-virtualized={records.length > 100 ? 'true' : 'false'}
      >
        {visible.length === 0 ? (
          <p role="status" aria-live="polite">
            No authorized records are available for this view.
          </p>
        ) : (
          <ul>
            {visible.map((record) => {
              const projection = asRecord(record.projection);
              const taskId =
                identifier(projection.taskId) ?? identifier(record.id);
              if (taskId === null) return null;
              const taskClass = textValue(projection.taskClass) ?? 'task';
              const freshness = freshnessFor(record, props.initial);
              return (
                <li key={taskId} data-freshness={freshness}>
                  <a
                    data-task-id={taskId}
                    href={inboxHref(props, taskId)}
                    aria-current={
                      taskId === props.selectedId ? 'page' : undefined
                    }
                  >
                    {taskClass} task
                  </a>
                  <span data-field="sourceVersion" aria-label="Source version">
                    {textValue(projection.sourceVersion) ??
                      record.version ??
                      'unknown'}
                  </span>
                  <span aria-label="Freshness">
                    {displayFreshness(freshness)}
                  </span>
                  <span aria-label="Assigned to">
                    {identifier(projection.assigneePersonId) ?? 'unassigned'}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div
        aria-label="Task detail"
        role="region"
        className="platform-configuration-admin-task-detail"
      >
        {props.selectedId === null || props.selectedId === undefined ? null : (
          <p className="platform-configuration-back-action">
            <a href={inboxBackHref(props)}>Back to task inbox</a>
          </p>
        )}
        {selected === null || selectedTaskId === null ? (
          <p role="status" aria-live="polite">
            Select an authorized task to view details.
          </p>
        ) : (
          <>
            <h4>{textValue(selectedProjection.taskClass) ?? 'Task'} details</h4>
            <dl>
              <div>
                <dt>Task ID</dt>
                <dd>{selectedTaskId}</dd>
              </div>
              <div>
                <dt>Source version</dt>
                <dd>
                  {textValue(selectedProjection.sourceVersion) ??
                    selected.version ??
                    'unknown'}
                </dd>
              </div>
              <div>
                <dt>Freshness</dt>
                <dd data-freshness={selectedFreshness}>
                  {displayFreshness(selectedFreshness)}
                </dd>
              </div>
              <div>
                <dt>Assigned to</dt>
                <dd>
                  {identifier(selectedProjection.assigneePersonId) ??
                    'unassigned'}
                </dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>
                  {textValue(selectedProjection.state) ??
                    selected.state ??
                    'unknown'}
                </dd>
              </div>
              <div>
                <dt>Source status</dt>
                <dd>
                  {textValue(selectedProjection.sourceStatus) ?? 'unknown'}
                </dd>
              </div>
              {selectedAggregateFreshness === 'partial' ||
              selectedFreshness === 'partial' ? (
                <>
                  <div>
                    <dt>Aggregate freshness</dt>
                    <dd>partial</dd>
                  </div>
                  <div>
                    <dt>Partial sources</dt>
                    <dd>
                      {Array.isArray(selectedProjection.partialSources)
                        ? selectedProjection.partialSources
                            .filter(
                              (item): item is string =>
                                typeof item === 'string',
                            )
                            .join(', ') || 'unknown'
                        : 'unknown'}
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
          </>
        )}
      </div>
    </section>
  );
};

function operationId(record: AdminWorkspaceRecord): string | null {
  return textValue(asRecord(record.projection).operationId);
}

export default AdminWorkspaceInbox;
