import * as React from 'react';

import { renderAdminWorkspaceActive } from './AdminWorkspaceActiveView';
import type {
  AdminWorkspaceLegacyProps,
  AdminWorkspaceOperationsWorkbenchProps,
} from './admin-workspace-types';

export type {
  AdminWorkspaceActiveProps,
  AdminWorkspaceAsyncState,
  AdminWorkspaceOperationsWorkbenchProps,
  AdminWorkspaceRecord,
} from './admin-workspace-types';

/** Error copy reserved for the future server-authorized 05b workbench. */
export const ADMIN_WORKSPACE_ERROR_CODES = [
  'AUDIT_TARGET_NOT_FOUND',
  'BULK_UNAVAILABLE',
  'DIAGNOSTIC_UNAVAILABLE',
  'DIAGNOSTIC_VERSION_CONFLICT',
  'FORBIDDEN',
  'MANIFEST_CONFLICT',
  'GRANT_INVALID',
  'GRANT_NOT_FOUND',
  'GRANT_VERSION_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'RATE_LIMITED',
  'SEARCH_UNAVAILABLE',
  'STEP_UP_REQUIRED',
  'TARGET_NOT_FOUND',
  'TASK_SOURCE_UNAVAILABLE',
  'UNAUTHENTICATED',
  'UPSTREAM_TIMEOUT',
  'VERSION_CONFLICT',
] as const;

const renderLegacyWorkbench = ({
  taskClasses = [],
  states = [],
  staleAfter = null,
}: AdminWorkspaceLegacyProps): React.ReactElement => (
  <section
    aria-labelledby="admin-workspace-operations-heading"
    data-workbench="admin-workspace-operations"
    data-state="deferred"
  >
    <h2 id="admin-workspace-operations-heading">Admin workspace operations</h2>
    <p>
      This workbench is deferred until its server-authorized contract is active.
    </p>
    <dl>
      <div>
        <dt>Task classes</dt>
        <dd>{taskClasses.length || 'none'}</dd>
      </div>
      <div>
        <dt>States</dt>
        <dd>{states.length === 0 ? 'none' : states.join(', ')}</dd>
      </div>
      <div>
        <dt>Stale after</dt>
        <dd>{staleAfter ?? 'not available'}</dd>
      </div>
    </dl>
    <p className="platform-configuration-help">
      RecordHeader, ProvenanceFact, and ActionBar remain unmounted until
      authorization is verified.
    </p>
    <p data-error-codes={ADMIN_WORKSPACE_ERROR_CODES.join(' ')} hidden>
      {ADMIN_WORKSPACE_ERROR_CODES.join(', ')}
    </p>
  </section>
);

const isActiveProps = (
  props: AdminWorkspaceOperationsWorkbenchProps,
): props is Extract<
  AdminWorkspaceOperationsWorkbenchProps,
  { readonly initial: unknown }
> => 'initial' in props && 'access' in props && 'contractFields' in props;

const ADMIN_TABS = ['settings', 'inbox', 'capabilities', 'audit'] as const;

export function AdminWorkspaceOperationsWorkbench(
  props: AdminWorkspaceOperationsWorkbenchProps,
): React.ReactElement {
  const active = isActiveProps(props);
  React.useEffect(() => {
    if (!active || typeof window === 'undefined') return;
    const tab = props.query?.tab;
    if (
      typeof tab !== 'string' ||
      ADMIN_TABS.includes(tab as (typeof ADMIN_TABS)[number])
    )
      return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'settings');
    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [active, props]);
  return isActiveProps(props)
    ? renderAdminWorkspaceActive(props)
    : renderLegacyWorkbench(props);
}

export default AdminWorkspaceOperationsWorkbench;
