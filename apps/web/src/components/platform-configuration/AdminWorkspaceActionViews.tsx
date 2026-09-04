import * as React from 'react';
import type {
  AdminWorkspaceActiveProps,
  AdminWorkspaceRecord,
} from './admin-workspace-types';

const objectValue = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : {};

const textValue = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const identifier = (value: unknown): string | null => {
  const candidate = textValue(value);
  return candidate !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      candidate,
    )
    ? candidate
    : null;
};

const recoverConflict = (
  props: AdminWorkspaceActiveProps,
  reason: string,
): void => {
  if (props.onCanonicalRefetch !== undefined) {
    void props.onCanonicalRefetch(reason);
  } else if (typeof window !== 'undefined') {
    window.location.reload();
  }
  if (typeof document !== 'undefined') {
    document
      .getElementById('admin-workspace-conflict-heading')
      ?.focus({ preventScroll: true });
  }
};

export const renderVersionConflict = (
  props: AdminWorkspaceActiveProps,
): React.ReactElement => (
  <section
    data-state="conflict"
    className="platform-configuration-help"
    aria-labelledby="admin-workspace-conflict-heading"
  >
    <h3 id="admin-workspace-conflict-heading" tabIndex={-1}>
      Version conflict recovery
    </h3>
    <strong>VERSION_CONFLICT</strong>
    <span>
      Current version {props.initial.version ?? 'unknown'} differs from the
      selected draft.
    </span>
    <button
      type="button"
      data-conflict-action="review"
      onClick={() => recoverConflict(props, 'conflict-review')}
    >
      Review changes
    </button>
    <button
      type="button"
      data-conflict-action="reapply"
      onClick={() => recoverConflict(props, 'conflict-reapply')}
    >
      Reapply
    </button>
    <button
      type="button"
      data-conflict-action="discard"
      onClick={() => recoverConflict(props, 'conflict-discard')}
    >
      Discard
    </button>
  </section>
);

export const renderGrantForm = (
  props: AdminWorkspaceActiveProps,
): React.ReactElement => (
  <form
    method="post"
    action="/api/v1/admin/capability-grants/actions"
    aria-label="Grant or revoke capability"
    data-operation-id="CFG-05B-04"
    className="platform-configuration-command-form"
  >
    <h3>Capability grants</h3>
    <input type="hidden" name="grantId" value="" />
    <input
      type="hidden"
      name="expectedVersion"
      value={props.expectedVersion ?? ''}
    />
    <input type="hidden" name="csrf" value={props.csrfToken ?? ''} />
    <label htmlFor="subjectPersonId">Subject person ID</label>
    <input id="subjectPersonId" name="subjectPersonId" autoComplete="off" />
    <label htmlFor="capabilityKey">Capability key</label>
    <input id="capabilityKey" name="capabilityKey" autoComplete="off" />
    <label htmlFor="resourceType">Resource type</label>
    <input id="resourceType" name="resourceType" autoComplete="off" />
    <label htmlFor="resourceId">Resource ID</label>
    <input id="resourceId" name="resourceId" autoComplete="off" />
    <label htmlFor="actions">Actions</label>
    <input id="actions" name="actions" autoComplete="off" />
    <label htmlFor="startsAt">Starts at</label>
    <input id="startsAt" name="startsAt" type="datetime-local" />
    <label htmlFor="endsAt">Ends at</label>
    <input id="endsAt" name="endsAt" type="datetime-local" />
    <label htmlFor="reason">Reason</label>
    <textarea id="reason" name="reason" />
    <label htmlFor="approverPersonId">Approver person ID</label>
    <input id="approverPersonId" name="approverPersonId" autoComplete="off" />
    <label htmlFor="purposeGrant">Purpose grant</label>
    <input id="purposeGrant" name="purposeGrant" type="checkbox" value="true" />
    <label htmlFor="stepUpToken">Step-up token</label>
    <input
      id="stepUpToken"
      name="stepUpToken"
      type="password"
      autoComplete="one-time-code"
    />
    <div className="platform-configuration-actions">
      <button type="submit" name="action" value="create">
        Grant capability
      </button>
      <button type="submit" name="action" value="revoke">
        Revoke capability
      </button>
    </div>
  </form>
);

const freshnessLabel = (record: AdminWorkspaceRecord): string => {
  const freshness = textValue(objectValue(record.projection).freshness);
  return freshness === 'healthy' ||
    freshness === 'stale' ||
    freshness === 'partial'
    ? freshness
    : 'unknown';
};

export const renderAudit = (
  records: readonly AdminWorkspaceRecord[],
): React.ReactElement => {
  const audit = records.find(
    (record) => objectValue(record.projection).operationId === 'CFG-05B-05',
  );
  const projection = audit ? objectValue(audit.projection) : {};
  const targetId = identifier(projection.targetId);
  const auditEventId = identifier(projection.auditEventId);
  const securityEventId = identifier(projection.securityEventId);
  return (
    <section
      aria-label="Audit and security activity"
      role="region"
      data-operation-id="CFG-05B-05"
    >
      <h3>Audit and security activity</h3>
      {audit === undefined ? (
        <p role="status" aria-live="polite">
          Authorized audit links are available when a target is selected.
        </p>
      ) : (
        <dl>
          <div>
            <dt>Safe label</dt>
            <dd>{textValue(projection.safeLabel) ?? 'Audit activity'}</dd>
          </div>
          {targetId !== null ? (
            <div>
              <dt>Target ID</dt>
              <dd>{targetId}</dd>
            </div>
          ) : null}
          {auditEventId !== null ? (
            <div>
              <dt>Audit event ID</dt>
              <dd>{auditEventId}</dd>
            </div>
          ) : null}
          {securityEventId !== null ? (
            <div>
              <dt>Security event ID</dt>
              <dd>{securityEventId}</dd>
            </div>
          ) : null}
          <div>
            <dt>Freshness</dt>
            <dd>{freshnessLabel(audit)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};
