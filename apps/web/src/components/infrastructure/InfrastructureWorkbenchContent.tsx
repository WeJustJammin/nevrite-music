import type {
  AccessVariant,
  DomainVariant,
  InfrastructureContractField,
} from '@wejammin/ui/infrastructure/presentation';
import type { InfrastructureViewState } from '@wejammin/contracts';
import ConfirmationStep from './ConfirmationStep';
import InfrastructureRecordDetail from './InfrastructureRecordDetail';
import InfrastructureRecordList from './InfrastructureRecordList';
import InfrastructureWorkbenchMeta from './InfrastructureWorkbenchMeta';
import InfrastructureWorkbenchStatus from './InfrastructureWorkbenchStatus';
import InfrastructureJobRegions, {
  type InfrastructureJobIntegrationProps,
} from './jobs/InfrastructureJobRegions';
import ProviderEvidencePanel, {
  type ProviderEvidencePanelProps,
} from './provider-evidence/ProviderEvidencePanel';
import SyncConflict from './SyncConflict';
import UploadAdmissionForm, {
  type UploadAdmissionFormProps,
} from './upload-admission/UploadAdmissionForm';
import UploadCompletionForm, {
  type UploadCompletionFormProps,
} from './upload-completion/UploadCompletionForm';
import type { InfrastructureWorkbenchController } from './useInfrastructureWorkbench';
import type { ServerInitialState } from './infrastructure-workbench-state';

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

      <InfrastructureJobRegions {...jobIntegration} />

      {uploadAdmission !== undefined && (
        <UploadAdmissionForm {...uploadAdmission} />
      )}

      {uploadCompletion !== undefined && (
        <UploadCompletionForm {...uploadCompletion} />
      )}

      {providerEvidence !== undefined && (
        <ProviderEvidencePanel {...providerEvidence} />
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
