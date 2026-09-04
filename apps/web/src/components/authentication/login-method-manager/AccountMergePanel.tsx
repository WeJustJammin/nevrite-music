import {
  formatDate,
  mergeStateCopy,
  PROVIDER_LABELS,
  PROVIDERS,
  type AccountSecurityActions,
  type AccountSecurityState,
  type ProviderCode,
} from './types';

export interface AccountMergePanelProps {
  readonly state: AccountSecurityState;
  readonly actions: AccountSecurityActions;
}

const busy = (state: AccountSecurityState): boolean => state.pending !== null;

export default function AccountMergePanel({
  state,
  actions,
}: AccountMergePanelProps) {
  const mergeCase = state.mergeCase;
  return (
    <section className="infra-record-detail" aria-labelledby="merge-heading">
      <h3 id="merge-heading">Duplicate-account recovery</h3>
      <p>
        Recovery verifies an account you control before the server prepares a
        merge. Candidate accounts are never searched for or displayed in this
        UI.
      </p>
      {mergeCase === null ? (
        <button
          type="button"
          onClick={() => void actions.createMerge()}
          disabled={busy(state)}
        >
          {state.pending === 'merge-create'
            ? 'Opening merge case'
            : 'Start duplicate-account recovery'}
        </button>
      ) : (
        <>
          <dl>
            <div>
              <dt>Case state</dt>
              <dd>{mergeCase.state}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>
                <time dateTime={mergeCase.expiresAt}>
                  {formatDate(mergeCase.expiresAt)}
                </time>
              </dd>
            </div>
            {mergeCase.conflictPlanVersion !== null && (
              <div>
                <dt>Conflict plan version</dt>
                <dd>{mergeCase.conflictPlanVersion}</dd>
              </div>
            )}
          </dl>
          <p role="status" aria-live="polite">
            {mergeStateCopy(mergeCase.state)}
          </p>

          {mergeCase.state === 'awaiting_duplicate_proof' && (
            <fieldset>
              <legend>Verify the other account</legend>
              <p id="merge-proof-help">
                Choose a provider for the server-issued proof flow. The account
                itself will not be searched or disclosed.
              </p>
              <label htmlFor="merge-proof-provider">Proof provider</label>
              <select
                id="merge-proof-provider"
                aria-describedby="merge-proof-help"
                value={state.mergeProvider}
                onChange={(event) =>
                  actions.setMergeProvider(
                    event.currentTarget.value as ProviderCode,
                  )
                }
                disabled={busy(state)}
              >
                {PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {PROVIDER_LABELS[provider]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void actions.proveDuplicate()}
                disabled={busy(state)}
              >
                {state.pending?.startsWith('merge-proof:')
                  ? 'Opening secure proof flow'
                  : 'Prove the other account'}
              </button>
            </fieldset>
          )}

          {mergeCase.state === 'awaiting_confirmation' && (
            <form
              className="infra-confirmation-step"
              onSubmit={(event) => {
                event.preventDefault();
                void actions.confirmMerge();
              }}
            >
              <h4>Review conflict plan before commit</h4>
              <p id="merge-plan-help">
                Confirm the exact server conflict plan and acknowledge each open
                conflict code, separated by commas.
              </p>
              <label htmlFor="merge-plan-version">Conflict plan version</label>
              <input
                id="merge-plan-version"
                value={state.conflictPlanVersion}
                onChange={(event) =>
                  actions.setConflictPlanVersion(event.currentTarget.value)
                }
                inputMode="numeric"
                aria-describedby="merge-plan-help"
                disabled={busy(state)}
                required
              />
              <label htmlFor="merge-acknowledgements">
                Acknowledgement codes
              </label>
              <input
                id="merge-acknowledgements"
                value={state.acknowledgements}
                onChange={(event) =>
                  actions.setAcknowledgements(event.currentTarget.value)
                }
                aria-describedby="merge-plan-help"
                disabled={busy(state)}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={state.mergeAcknowledged}
                  onChange={(event) =>
                    actions.setMergeAcknowledged(event.currentTarget.checked)
                  }
                  disabled={busy(state)}
                />{' '}
                I reviewed the server conflict plan and understand this merge is
                irreversible.
              </label>
              <button
                type="submit"
                disabled={busy(state) || !state.mergeAcknowledged}
              >
                {state.pending === 'merge-confirm'
                  ? 'Confirming merge'
                  : 'Confirm account merge'}
              </button>
            </form>
          )}

          {['queued', 'running', 'completed', 'manual_review'].includes(
            mergeCase.state,
          ) && (
            <dl>
              <div>
                <dt>Job</dt>
                <dd>
                  {state.job?.id ?? mergeCase.jobId ?? 'Pending server job'}
                </dd>
              </div>
              {state.job !== null && (
                <div>
                  <dt>Job state</dt>
                  <dd>{state.job.state}</dd>
                </div>
              )}
            </dl>
          )}

          {mergeCase.state === 'expired' && (
            <button
              type="button"
              onClick={actions.resetExpiredMerge}
              disabled={busy(state)}
            >
              Start a new recovery case
            </button>
          )}
        </>
      )}
    </section>
  );
}
