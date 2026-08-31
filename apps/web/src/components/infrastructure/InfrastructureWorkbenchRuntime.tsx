import type { InfrastructureContractField } from '@wejammin/ui/infrastructure/presentation';
import { Suspense } from 'react';

import ErrorBoundary from './ErrorBoundary';
import { InfrastructureWorkbenchContent } from './InfrastructureWorkbenchContent';
import type { InfrastructureJobIntegrationProps } from './jobs/InfrastructureJobRegions';
import {
  parseContractState,
  type RefetchReason,
  type ServerInitialState,
} from './infrastructure-workbench-state';
import useInfrastructureWorkbench, {
  type ProtectedCommandInput,
  type UseInfrastructureWorkbenchInput,
} from './useInfrastructureWorkbench';
import type { InfrastructureWorkbenchIslandProps } from './InfrastructureWorkbench';

interface ControllerInput {
  readonly initial: ServerInitialState;
  readonly query: Readonly<Record<string, string>>;
  readonly initialSelectedId: string | null;
  readonly canonicalUrl: string;
  readonly expectedVersion: string | null;
  readonly onCanonicalRefetch:
    ((reason: RefetchReason) => Promise<void>) | undefined;
  readonly onProtectedCommand:
    ((input: ProtectedCommandInput) => Promise<void>) | undefined;
}

const controllerInput = ({
  initial,
  query,
  initialSelectedId,
  canonicalUrl,
  expectedVersion,
  onCanonicalRefetch,
  onProtectedCommand,
}: ControllerInput): UseInfrastructureWorkbenchInput => ({
  initial,
  query,
  initialSelectedId,
  canonicalUrl,
  expectedVersion,
  ...(onCanonicalRefetch === undefined ? {} : { onCanonicalRefetch }),
  ...(onProtectedCommand === undefined ? {} : { onProtectedCommand }),
});

export function InfrastructureWorkbenchRuntime({
  initial,
  variant,
  access,
  query,
  selectedId: initialSelectedId,
  expectedVersion,
  requestId,
  canonicalUrl,
  actorId,
  actingPartyId,
  contractFields,
  uploadAdmission,
  uploadCompletion,
  providerEvidence,
  onCanonicalRefetch,
  onProtectedCommand,
  jobStatus,
  jobRequestId,
  jobRetryAfterSeconds,
  jobReader,
  jobPollingEnabled,
  jobPollIntervalMs,
  onJobRetry,
  onJobRefetch,
  offlineIntents,
  offlineConnectivity,
  onOfflineIntentRetry,
  offlineAdapter,
  persistOfflineIntents,
  realtimeState,
  realtimeRequestId,
  realtimeMessage,
  realtimeConfig,
  realtimeSubscribe,
}: InfrastructureWorkbenchIslandProps) {
  const controller = useInfrastructureWorkbench(
    controllerInput({
      initial,
      query,
      initialSelectedId,
      canonicalUrl,
      expectedVersion,
      onCanonicalRefetch,
      onProtectedCommand,
    }),
  );
  const parsedInitial = parseContractState(initial);
  const initialPresentation =
    parsedInitial.success && parsedInitial.data.status === 'degraded'
      ? (parsedInitial.data.lastKnownGood?.verifiedAt ?? null)
      : null;
  const validationMessage =
    parsedInitial.success && parsedInitial.data.status === 'validation_error'
      ? parsedInitial.data.error.message
      : null;
  const conflict =
    parsedInitial.success && parsedInitial.data.status === 'conflict'
      ? parsedInitial.data
      : null;
  const contractFieldNames = Object.keys(
    contractFields?.fields ?? {},
  ) as InfrastructureContractField[];
  const capabilityReason =
    access === 'disabled'
      ? 'A named server capability or prerequisite is required before this action is enabled.'
      : access === 'partial-hidden'
        ? 'Some fields are hidden by the current server disclosure policy.'
        : 'This view is read-only for the current server-derived access decision.';
  const retry = (): void => {
    void controller.requestRefetch('navigation');
  };
  const jobIntegration: InfrastructureJobIntegrationProps = {
    requestId,
    ...(jobStatus === undefined ? {} : { jobStatus }),
    ...(jobRequestId === undefined ? {} : { jobRequestId }),
    ...(jobRetryAfterSeconds === undefined ? {} : { jobRetryAfterSeconds }),
    ...(jobReader === undefined ? {} : { jobReader }),
    ...(jobPollingEnabled === undefined ? {} : { jobPollingEnabled }),
    ...(jobPollIntervalMs === undefined ? {} : { jobPollIntervalMs }),
    ...(onJobRetry === undefined ? {} : { onJobRetry }),
    ...(onJobRefetch === undefined ? {} : { onJobRefetch }),
    ...(offlineIntents === undefined ? {} : { offlineIntents }),
    ...(offlineConnectivity === undefined ? {} : { offlineConnectivity }),
    ...(onOfflineIntentRetry === undefined ? {} : { onOfflineIntentRetry }),
    ...(offlineAdapter === undefined ? {} : { offlineAdapter }),
    ...(persistOfflineIntents === undefined ? {} : { persistOfflineIntents }),
    ...(realtimeState === undefined ? {} : { realtimeState }),
    ...(realtimeRequestId === undefined ? {} : { realtimeRequestId }),
    ...(realtimeMessage === undefined ? {} : { realtimeMessage }),
    ...(realtimeConfig === undefined ? {} : { realtimeConfig }),
    ...(realtimeSubscribe === undefined ? {} : { realtimeSubscribe }),
  };

  return (
    <ErrorBoundary requestId={requestId} onRetry={retry}>
      <Suspense
        fallback={
          <section
            className="infra-workbench"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-label="Infrastructure workbench"
          >
            Loading the interactive infrastructure view.
          </section>
        }
      >
        <InfrastructureWorkbenchContent
          initial={initial}
          variant={variant}
          access={access}
          requestId={requestId}
          expectedVersion={expectedVersion}
          {...(actorId === undefined ? {} : { actorId })}
          {...(actingPartyId === undefined ? {} : { actingPartyId })}
          contractFieldNames={contractFieldNames}
          initialPresentation={initialPresentation}
          validationMessage={validationMessage}
          conflict={conflict}
          capabilityReason={capabilityReason}
          controller={controller}
          onRetry={retry}
          jobIntegration={jobIntegration}
          {...(uploadAdmission === undefined ? {} : { uploadAdmission })}
          {...(uploadCompletion === undefined ? {} : { uploadCompletion })}
          {...(providerEvidence === undefined ? {} : { providerEvidence })}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

export default InfrastructureWorkbenchRuntime;
