import type {
  AccessVariant,
  DomainVariant,
  InfrastructureContractField,
} from '@wejammin/ui/infrastructure/presentation';
import type { InfrastructureViewState } from '@wejammin/contracts';
import { lazy, Suspense, useState, type ReactNode } from 'react';
import ConfirmationStep from './ConfirmationStep';
import InfrastructureRecordDetail from './InfrastructureRecordDetail';
import InfrastructureRecordList from './InfrastructureRecordList';
import InfrastructureWorkbenchMeta from './InfrastructureWorkbenchMeta';
import InfrastructureWorkbenchStatus from './InfrastructureWorkbenchStatus';
import type { InfrastructureJobIntegrationProps } from './jobs/InfrastructureJobRegions';
import type { ProviderEvidencePanelProps } from './provider-evidence/ProviderEvidencePanel';
import SyncConflict from './SyncConflict';
import type { UploadAdmissionFormProps } from './upload-admission/UploadAdmissionForm';
import type { UploadCompletionFormProps } from './upload-completion/UploadCompletionForm';
import type { InfrastructureWorkbenchController } from './useInfrastructureWorkbench';
import type { ServerInitialState } from './infrastructure-workbench-state';

const ProviderEvidencePanel = lazy(
  () => import('./provider-evidence/ProviderEvidencePanel'),
);
const InfrastructureJobRegions = lazy(
  () => import('./jobs/InfrastructureJobRegions'),
);
const UploadAdmissionForm = lazy(
  () => import('./upload-admission/UploadAdmissionForm'),
);
const UploadCompletionForm = lazy(
  () => import('./upload-completion/UploadCompletionForm'),
);

interface DeferredFeatureProps {
  readonly id: string;
  readonly title: string;
  readonly description: ReactNode;
  readonly buttonLabel: string;
  readonly render: () => ReactNode;
}

function DeferredFeature({
  id,
  title,
  description,
  buttonLabel,
  render,
}: DeferredFeatureProps) {
  const [activated, setActivated] = useState(false);
  if (!activated) {
    return (
      <section
        id={`${id}-deferred`}
        className="infra-deferred-feature"
        aria-labelledby={`${id}-deferred-heading`}
      >
        <h2 id={`${id}-deferred-heading`}>{title}</h2>
        <div id={`${id}-region`} className="infra-deferred-feature__summary">
          {description}
        </div>
        <button
          type="button"
          aria-controls={`${id}-region`}
          onClick={() => setActivated(true)}
        >
          {buttonLabel}
        </button>
      </section>
    );
  }

  return (
    <section id={`${id}-deferred`} aria-label={title}>
      <div id={`${id}-region`}>
        <Suspense
          fallback={
            <p role="status" aria-live="polite">
              Loading {title.toLocaleLowerCase()} controls.
            </p>
          }
        >
          {render()}
        </Suspense>
      </div>
    </section>
  );
}

const realtimeSummary = (
  state: NonNullable<InfrastructureJobIntegrationProps['realtimeState']>,
): string => {
  switch (state) {
    case 'idle':
      return 'Canonical job status is current.';
    case 'stale':
      return 'A change hint arrived. Canonical job status will be refreshed.';
    case 'loading':
      return 'Refreshing canonical job status.';
    case 'success':
      return 'Canonical job status refreshed.';
    case 'error':
      return 'Canonical job status could not be refreshed.';
  }
};

function JobActivitySummary({
  integration,
}: {
  readonly integration: InfrastructureJobIntegrationProps;
}) {
  const {
    jobStatus,
    jobRetryAfterSeconds,
    offlineConnectivity,
    offlineIntents,
    realtimeMessage,
    realtimeState,
  } = integration;
  const hasOfflineState =
    offlineIntents !== undefined || offlineConnectivity !== undefined;

  return (
    <>
      <p>
        The current server projection remains visible. Load live controls to
        start polling, reconciliation, retry, and realtime subscriptions.
      </p>
      {jobStatus !== undefined && (
        <section aria-labelledby="deferred-job-status-heading">
          <p className="infra-eyebrow">Infrastructure job</p>
          <h3 id="deferred-job-status-heading">Job status</h3>
          {'etag' in jobStatus ? (
            <p>
              Job ID: <code>{jobStatus.data.id}</code>. Status:{' '}
              {jobStatus.data.state}.
            </p>
          ) : jobStatus.status === 'error' ? (
            <p role="alert">
              {jobStatus.error.message} Error code:{' '}
              <code>{jobStatus.error.code}</code>.
            </p>
          ) : (
            <p>Status: {jobStatus.status}.</p>
          )}
          {jobRetryAfterSeconds !== undefined &&
            jobRetryAfterSeconds !== null && (
              <p>Retry available in {jobRetryAfterSeconds} seconds.</p>
            )}
        </section>
      )}
      {hasOfflineState && (
        <section aria-labelledby="deferred-offline-intents-heading">
          <h3 id="deferred-offline-intents-heading">Offline intents</h3>
          <p role="status">Connectivity: {offlineConnectivity ?? 'offline'}.</p>
          {(offlineIntents ?? []).map((intent) =>
            intent.state === 'refused' && intent.refusal !== null ? (
              <p key={intent.intentId}>
                Refused: <code>{intent.refusal.code}</code>
              </p>
            ) : null,
          )}
        </section>
      )}
      {realtimeState !== undefined && (
        <p role="status" aria-live="polite" aria-atomic="true">
          {realtimeMessage ?? realtimeSummary(realtimeState)}
        </p>
      )}
    </>
  );
}

type ConflictState = Extract<InfrastructureViewState, { status: 'conflict' }>;

export interface InfrastructureWorkbenchContentProps {
  readonly initial: ServerInitialState;
  readonly variant: DomainVariant;
  readonly access: AccessVariant;
  readonly requestId: string;
  readonly expectedVersion: string | null;
  readonly actorId?: string;
  readonly actingPartyId?: string;
  readonly contractFieldNames: readonly InfrastructureContractField[];
  readonly initialPresentation: string | null;
  readonly validationMessage: string | null;
  readonly conflict: ConflictState | null;
  readonly capabilityReason: string;
  readonly controller: InfrastructureWorkbenchController;
  readonly onRetry: () => void;
  readonly jobIntegration: InfrastructureJobIntegrationProps;
  readonly uploadAdmission?: UploadAdmissionFormProps;
  readonly uploadCompletion?: UploadCompletionFormProps;
  readonly providerEvidence?: ProviderEvidencePanelProps;
}

export function InfrastructureWorkbenchContent({
  initial,
  variant,
  access,
  requestId,
  expectedVersion,
  actorId,
  actingPartyId,
  contractFieldNames,
  initialPresentation,
  validationMessage,
  conflict,
  capabilityReason,
  controller,
  onRetry,
  jobIntegration,
  uploadAdmission,
  uploadCompletion,
  providerEvidence,
}: InfrastructureWorkbenchContentProps) {
  return (
    <section
      className="infra-workbench"
      data-domain-variant={variant}
      data-contract-source="00-infrastructure.md"
      data-contract-field-count={contractFieldNames.length}
      aria-labelledby="infrastructure-workbench-heading"
      aria-busy={controller.liveStatus === 'loading'}
    >
      <InfrastructureWorkbenchStatus
        initial={initial}
        requestId={requestId}
        liveStatus={controller.liveStatus}
        lastKnownGoodAt={initialPresentation}
        contractFieldCount={contractFieldNames.length}
        hasActorContext={actorId !== undefined || actingPartyId !== undefined}
        validationMessage={validationMessage}
        onRetry={onRetry}
      />

      {(jobIntegration.jobStatus !== undefined ||
        jobIntegration.offlineIntents !== undefined ||
        jobIntegration.offlineConnectivity !== undefined ||
        jobIntegration.realtimeState !== undefined) && (
        <DeferredFeature
          id="infrastructure-job-activity"
          title="Infrastructure job activity"
          description={<JobActivitySummary integration={jobIntegration} />}
          buttonLabel="Load live job controls"
          render={() => <InfrastructureJobRegions {...jobIntegration} />}
        />
      )}

      {uploadAdmission !== undefined &&
        uploadAdmission.access !== 'not-rendered' && (
          <DeferredFeature
            id="upload-admission"
            title="Upload admission"
            description={
              uploadAdmission.access === 'disabled'
                ? (uploadAdmission.capabilityReason ??
                  'A server capability is required before upload admission.')
                : 'Load the server-authorized upload admission fields when you are ready to attach an object.'
            }
            buttonLabel="Load upload admission"
            render={() => <UploadAdmissionForm {...uploadAdmission} />}
          />
        )}

      {uploadCompletion !== undefined &&
        uploadCompletion.access !== 'not-rendered' && (
          <DeferredFeature
            id="upload-completion"
            title="Upload completion"
            description={
              uploadCompletion.access === 'disabled'
                ? uploadCompletion.initialState?.status === 'disabled'
                  ? uploadCompletion.initialState.reason
                  : (uploadCompletion.capabilityReason ??
                    'A server completion capability is required.')
                : 'Load verification controls when the object transfer is complete.'
            }
            buttonLabel="Load upload completion"
            render={() => <UploadCompletionForm {...uploadCompletion} />}
          />
        )}

      {providerEvidence !== undefined &&
        providerEvidence.access !== 'not-rendered' && (
          <DeferredFeature
            id="provider-evidence"
            title={
              providerEvidence.access === 'disabled' ||
              providerEvidence.state.status === 'disabled'
                ? 'Provider evidence'
                : 'Provider operation evidence'
            }
            description={
              providerEvidence.state.status === 'disabled'
                ? providerEvidence.state.reason
                : 'Load the current server-authorized provider evidence projection.'
            }
            buttonLabel="Load provider evidence"
            render={() => <ProviderEvidencePanel {...providerEvidence} />}
          />
        )}

      {conflict !== null && (
        <SyncConflict
          currentVersion={conflict.currentVersion}
          retainedInput={conflict.retainedInput}
          onReview={() =>
            controller.setSelectedId(controller.selectedRecord?.id ?? null)
          }
          onReapply={() => void controller.requestRefetch('mutation')}
          onDiscard={controller.onArchiveCancel}
        />
      )}

      {access === 'not-rendered' ? (
        <section
          className="infra-access-hidden"
          role="status"
          aria-labelledby="access-hidden-heading"
        >
          <h3 id="access-hidden-heading">This view is unavailable</h3>
          <p>
            The server did not grant a disclosure projection for this request.
          </p>
        </section>
      ) : (
        <div className="infra-workbench-grid">
          <InfrastructureRecordList
            records={controller.records}
            query={controller.queryState}
            selectedId={controller.selectedId}
            activeFilters={controller.activeFilters}
            hrefForRecord={controller.hrefForRecord}
            onQueryChange={(value) =>
              controller.setQueryState((current) => ({
                ...current,
                q: value,
              }))
            }
            onSortChange={(value) =>
              controller.setQueryState((current) => ({
                ...current,
                sort: value,
              }))
            }
            onApply={controller.applyFilters}
            onReset={controller.resetFilters}
            onSortByLabel={controller.sortByLabel}
          />
          <InfrastructureRecordDetail
            record={controller.selectedRecord}
            access={access}
            variant={variant}
            expectedVersion={expectedVersion}
            {...(actingPartyId === undefined ? {} : { actingPartyId })}
            isPending={controller.liveStatus === 'pending'}
            commandAvailable={controller.commandAvailable}
            selectedFileName={controller.selectedFileName}
            archiveTrigger={controller.archiveTrigger}
            onReviewArchive={controller.onArchiveReview}
            onRetry={onRetry}
            onFileChange={controller.onFileChange}
          />
        </div>
      )}

      {controller.showConfirmation && controller.selectedRecord !== null && (
        <div className="infra-confirmation-region">
          <ConfirmationStep
            headingRef={controller.confirmationHeading}
            consequence="Archive this infrastructure record"
            scope={controller.selectedRecord.label}
            expectedVersion={
              expectedVersion ?? controller.selectedRecord.version
            }
            actingContext={
              actingPartyId === undefined
                ? 'Server-selected acting context'
                : 'Server-selected acting party'
            }
            stepUpVerified={access === 'full' && variant === 'adminStepUp'}
            onConfirm={controller.onArchiveConfirm}
            onCancel={controller.onArchiveCancel}
          />
        </div>
      )}

      <InfrastructureWorkbenchMeta
        access={access}
        capabilityReason={capabilityReason}
        requestId={requestId}
        contractFieldNames={contractFieldNames}
      />
    </section>
  );
}
