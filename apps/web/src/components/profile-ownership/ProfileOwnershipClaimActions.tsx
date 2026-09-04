import * as React from 'react';

import {
  CommandForm,
  TextField,
  type ProfileOwnershipOperation,
} from './ProfileOwnershipCommandForms';
import type { ProfileOwnershipAccess } from './ShadowClaimOwnershipWorkbench';

type Props = Readonly<{
  recordId: string;
  expectedVersion: string;
  access: ProfileOwnershipAccess;
  csrfToken: string;
  onStatus: (message: string) => void;
  onSuccess: (operation: ProfileOwnershipOperation, payload: unknown) => void;
}>;

const labels: Readonly<Record<ProfileOwnershipOperation, string>> = {
  'PRF-API-01': 'Create shadow',
  'PRF-API-02': 'Dispatch invitation',
  'PRF-API-03': 'Suppress or correct',
  'PRF-API-04': 'Start claim',
  'PRF-API-05': 'Read claim',
  'PRF-API-06': 'Request challenge',
  'PRF-API-07': 'Complete claim proof',
  'PRF-API-08': 'Convert provisional claim',
};

const field = (
  id: string,
  name: string,
  label: string,
  options: Readonly<{
    required?: boolean;
    inputMode?: 'numeric' | 'text';
  }> = {},
): React.ReactElement => (
  <TextField id={id} name={name} label={label} {...options} />
);

const choice = (
  id: string,
  name: string,
  label: string,
  options: readonly string[],
): React.ReactElement => (
  <label htmlFor={id}>
    {label}
    <select id={id} name={name} defaultValue={options[0]} required>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const command = (
  operation: ProfileOwnershipOperation,
  action: string,
  children: React.ReactNode,
  props: Props,
): React.ReactElement => (
  <CommandForm
    operation={operation}
    action={action}
    label={labels[operation]}
    expectedVersion={props.expectedVersion}
    csrfToken={props.csrfToken}
    disabled={props.access !== 'full' || props.recordId.length === 0}
    onStatus={props.onStatus}
    onSuccess={props.onSuccess}
  >
    {children}
  </CommandForm>
);

const ProfileOwnershipClaimActions = (props: Props): React.ReactElement => {
  const { recordId } = props;
  return (
    <section aria-labelledby="claim-actions-heading">
      <h2 id="claim-actions-heading">Claim verification</h2>
      <h3>Start or resume claim</h3>
      {command(
        'PRF-API-04',
        '/api/v1/party-claims',
        <>
          {field('target-party-id', 'targetPartyId', 'Target party ID')}
          {choice('claim-kind', 'claimKind', 'Claim kind', [
            'self',
            'representation',
            'transfer',
          ])}
        </>,
        props,
      )}
      <h3>Request claim challenge</h3>
      {command(
        'PRF-API-06',
        `/api/v1/party-claims/${encodeURIComponent(recordId)}/challenges`,
        <>
          {choice('challenge-method', 'method', 'Method', [
            'domain_challenge',
            'business_oauth',
            'dsp_oauth',
            'postal',
            'business_phone',
            'attester_route',
          ])}
          {field('challenge-route', 'routeId', 'Route ID', { required: false })}
          {field(
            'challenge-attester',
            'attesterPersonId',
            'Attester person ID',
            { required: false },
          )}
        </>,
        props,
      )}
      <p data-challenge-attempts="true" data-max-attempts="5">
        At most 5 proof attempts.
      </p>
      <p data-challenge-expiry="true">Challenge expires after 15 minutes.</p>
      <h3>Complete claim proof</h3>
      {command(
        'PRF-API-07',
        `/api/v1/party-claims/${encodeURIComponent(recordId)}/proofs`,
        <>
          <input type="hidden" name="kind" value="challenge_code" />
          {field('challenge-id', 'challengeId', 'Challenge ID')}
          <TextField
            id="challenge-code"
            name="code"
            label="One-time proof code"
            inputMode="numeric"
            maxLength={6}
          />
          {field('proof-reason-code', 'reasonCode', 'Reason code')}
        </>,
        props,
      )}
      <h3>Convert provisional claim</h3>
      {command(
        'PRF-API-08',
        `/api/v1/party-claims/${encodeURIComponent(recordId)}/convert`,
        <>{field('reason-code', 'reasonCode', 'Reason code')}</>,
        props,
      )}
    </section>
  );
};

export default ProfileOwnershipClaimActions;
