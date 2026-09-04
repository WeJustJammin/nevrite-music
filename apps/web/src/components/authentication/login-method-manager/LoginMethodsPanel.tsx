import { useEffect, useRef } from 'react';
import {
  formatDate,
  PROVIDER_LABELS,
  PROVIDERS,
  type AccountSecurityActions,
  type AccountSecurityState,
  type UnlinkReason,
} from './types';
export interface LoginMethodsPanelProps {
  readonly state: AccountSecurityState;
  readonly actions: AccountSecurityActions;
}
const busy = (state: AccountSecurityState): boolean => state.pending !== null;

export default function LoginMethodsPanel({
  state,
  actions,
}: LoginMethodsPanelProps) {
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (state.unlinkTarget !== null) confirmationHeading.current?.focus();
  }, [state.unlinkTarget]);

  return (
    <>
      <section
        className="infra-record-list"
        aria-labelledby="connected-methods-heading"
      >
        <div className="infra-region-heading">
          <h3 id="connected-methods-heading">Connected methods</h3>
          <p>
            {state.resource.methods.length} method
            {state.resource.methods.length === 1 ? '' : 's'} connected. The
            server decides which methods can be removed.
          </p>
        </div>
        <ul>
          {state.resource.methods.map((method) => (
            <li key={method.id} className="infra-record-row">
              <div>
                <strong>{method.label}</strong>
                <p>{PROVIDER_LABELS[method.provider]} login method</p>
                <dl>
                  <div>
                    <dt>Verified</dt>
                    <dd>
                      <time dateTime={method.verifiedAt}>
                        {formatDate(method.verifiedAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>Last used</dt>
                    <dd>
                      <time dateTime={method.lastUsedAt ?? undefined}>
                        {formatDate(method.lastUsedAt)}
                      </time>
                    </dd>
                  </div>
                </dl>
              </div>
              {method.removable ? (
                <button
                  type="button"
                  disabled={busy(state)}
                  onClick={() => actions.chooseUnlink(method)}
                  aria-label={`Remove ${method.label} login method`}
                >
                  Remove
                </button>
              ) : (
                <p>Required recovery method</p>
              )}
            </li>
          ))}
        </ul>
        <div className="infra-action-row">
          <p>
            Recovery baseline:{' '}
            {state.resource.recoveryBaselinePresent ? 'present' : 'not present'}
            . Version {state.resource.version}.
          </p>
          <button
            type="button"
            onClick={() => void actions.refresh()}
            disabled={busy(state)}
          >
            {state.pending === 'refresh'
              ? 'Refreshing security state'
              : 'Refresh methods'}
          </button>
        </div>
      </section>

      {state.unlinkTarget !== null && (
        <section
          className="infra-confirmation-step"
          aria-labelledby="remove-method-heading"
        >
          <h3
            id="remove-method-heading"
            tabIndex={-1}
            ref={confirmationHeading}
          >
            Remove login method
          </h3>
          <p>
            Confirm the server-authorized removal. Provider identity details,
            tokens, and email addresses are never displayed here.
          </p>
          <dl>
            <div>
              <dt>Method</dt>
              <dd>{state.unlinkTarget.label}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{PROVIDER_LABELS[state.unlinkTarget.provider]}</dd>
            </div>
          </dl>
          <fieldset>
            <legend>Reason for removal</legend>
            <label htmlFor="unlink-reason">Reason</label>
            <select
              id="unlink-reason"
              value={state.unlinkReason}
              onChange={(event) =>
                actions.setUnlinkReason(
                  event.currentTarget.value as UnlinkReason,
                )
              }
              disabled={busy(state)}
            >
              <option value="user_request">I no longer use this method</option>
              <option value="provider_compromise">
                I think this provider is compromised
              </option>
            </select>
          </fieldset>
          <label>
            <input
              type="checkbox"
              checked={state.unlinkAcknowledged}
              onChange={(event) =>
                actions.setUnlinkAcknowledged(event.currentTarget.checked)
              }
              disabled={busy(state)}
            />{' '}
            I understand this method will be removed after server confirmation.
          </label>
          <div className="infra-action-row">
            <button
              type="button"
              onClick={actions.cancelUnlink}
              disabled={busy(state)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void actions.confirmUnlink()}
              disabled={busy(state) || !state.unlinkAcknowledged}
            >
              {state.pending === 'unlink'
                ? 'Removing method'
                : 'Confirm removal'}
            </button>
          </div>
        </section>
      )}

      <section
        className="infra-record-detail"
        aria-labelledby="add-method-heading"
      >
        <h3 id="add-method-heading">Add a login method</h3>
        <p>
          Each link opens a server-issued authorization flow. Provider secrets
          and raw identity values remain on the server.
        </p>
        <div role="group" aria-label="Available login providers">
          {PROVIDERS.map((provider) => (
            <button
              key={provider}
              type="button"
              onClick={() => void actions.linkProvider(provider)}
              disabled={busy(state)}
            >
              {state.pending === `link:${provider}`
                ? 'Opening secure flow'
                : `Link ${PROVIDER_LABELS[provider]}`}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
