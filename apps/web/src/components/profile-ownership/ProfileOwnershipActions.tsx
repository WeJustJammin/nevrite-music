import * as React from 'react';

import {
  CommandForm,
  type ProfileOwnershipOperation,
} from './ProfileOwnershipCommandForms';
import ProfileOwnershipClaimActions from './ProfileOwnershipClaimActions';
import type { ProfileOwnershipAccess } from './ShadowClaimOwnershipWorkbench';
import {
  actionChoice,
  actionField,
  actionLabels,
  DeferredBoundary,
} from './profile-ownership-action-helpers';

type Props = Readonly<{
  recordId: string;
  expectedVersion: string;
  access: ProfileOwnershipAccess;
  hasError: boolean;
  csrfToken: string;
  onStatus: (message: string) => void;
  onSuccess: (operation: ProfileOwnershipOperation, payload: unknown) => void;
}>;

const command = (
  operation: ProfileOwnershipOperation,
  action: string,
  children: React.ReactNode,
  props: Props,
  anonymous = false,
): React.ReactElement => (
  <CommandForm
    operation={operation}
    action={action}
    label={actionLabels[operation]}
    expectedVersion={props.expectedVersion}
    csrfToken={props.csrfToken}
    disabled={props.access !== 'full'}
    anonymous={anonymous}
    onStatus={props.onStatus}
    onSuccess={props.onSuccess}
  >
    {children}
  </CommandForm>
);

const ProfileOwnershipActions = (props: Props): React.ReactElement => {
  const { recordId, hasError } = props;
  return (
    <>
      <section aria-labelledby="active-commands-heading">
        <h2 id="active-commands-heading">Shadow and claim actions</h2>
        <h3>Create shadow by reference</h3>
        {command(
          'PRF-API-01',
          '/api/v1/shadow-party-matches',
          <>
            {actionField('party-id', 'partyId', 'Party ID', hasError)}
            {actionField(
              'source-domain',
              'sourceDomain',
              'Source domain',
              hasError,
            )}
            {actionField(
              'source-entity-id',
              'sourceEntityId',
              'Source entity ID',
              false,
            )}
            {actionField(
              'source-version',
              'sourceVersion',
              'Source version',
              false,
            )}
            {actionField('role-code', 'roleCode', 'Role code', false, false)}
            {actionField(
              'instrument-code',
              'instrumentCode',
              'Instrument code',
              false,
              false,
            )}
          </>,
          props,
        )}
        <h3>Match possible duplicate</h3>
        <p>Matching is advisory and never authenticates an account.</p>
        <h3>Dispatch invitation</h3>
        {command(
          'PRF-API-02',
          `/api/v1/shadow-parties/${encodeURIComponent(recordId)}/invitations`,
          <>
            {actionField(
              'contact-route-id',
              'contactRouteId',
              'Contact route ID',
              false,
            )}
            {actionChoice('invitation-trigger', 'trigger', 'Trigger', [
              'initial',
              'schedule',
              'new_attester',
            ])}
            {actionField(
              'attester-person-id',
              'attesterPersonId',
              'Attester person ID',
              false,
              false,
            )}
          </>,
          props,
        )}
        <h3>Account-free suppress or correct</h3>
        {command(
          'PRF-API-03',
          '/api/v1/shadow-remedies',
          <>
            {actionField(
              'pointer-token',
              'pointerToken',
              'Invitation pointer',
              false,
            )}
            {actionChoice('remedy-action', 'action', 'Action', [
              'suppress',
              'correct',
            ])}
            {actionChoice('remedy-scope', 'scope', 'Scope', [
              'outreach',
              'publication',
              'both',
            ])}
            {actionChoice('proof-kind', 'proofKind', 'Proof kind', [
              'route_code',
            ])}
            {actionField('proof-code', 'proofCode', 'Proof code', false)}
          </>,
          props,
          true,
        )}
      </section>
      <ProfileOwnershipClaimActions
        recordId={recordId}
        expectedVersion={props.expectedVersion}
        access={props.access}
        csrfToken={props.csrfToken}
        onStatus={props.onStatus}
        onSuccess={props.onSuccess}
      />
      <section aria-labelledby="deferred-heading">
        <h2 id="deferred-heading">Deferred profile ownership capabilities</h2>
        <p>Deferred capabilities are not available in this phase.</p>
        {(
          [
            'PRF-API-09',
            'PRF-API-10',
            'PRF-API-11',
            'PRF-API-12',
            'PRF-API-13',
            'PRF-API-14',
            'PRF-API-15',
            'PRF-API-16',
          ] as const
        ).map((operation) => (
          <DeferredBoundary key={operation} operation={operation} />
        ))}
      </section>
    </>
  );
};

export default ProfileOwnershipActions;
