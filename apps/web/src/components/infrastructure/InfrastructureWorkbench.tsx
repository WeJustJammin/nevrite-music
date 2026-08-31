import type {
  AccessVariant,
  DomainVariant,
  InfrastructureWorkbenchContractFields,
} from '@wejammin/ui/infrastructure/presentation';

import { lazy, Suspense, type ComponentType } from 'react';
import type { InfrastructureJobIntegrationProps } from './jobs/InfrastructureJobRegions';
import type { ProviderEvidencePanelProps } from './provider-evidence/ProviderEvidencePanel';
import type { UploadAdmissionFormProps } from './upload-admission/UploadAdmissionForm';
import type { UploadCompletionFormProps } from './upload-completion/UploadCompletionForm';
import {
  type RefetchReason,
  type ServerInitialState,
} from './infrastructure-workbench-types';
import type { ProtectedCommandInput } from './useInfrastructureWorkbench';

export interface InfrastructureWorkbenchIslandProps extends InfrastructureJobIntegrationProps {
  readonly initial: ServerInitialState;
  readonly variant: DomainVariant;
  readonly access: AccessVariant;
  readonly query: Readonly<Record<string, string>>;
  readonly selectedId: string | null;
  readonly expectedVersion: string | null;
  readonly requestId: string;
  readonly canonicalUrl: string;
  readonly actorId?: string;
  readonly actingPartyId?: string;
  readonly contractFields?: InfrastructureWorkbenchContractFields;
  readonly uploadAdmission?: UploadAdmissionFormProps;
  readonly uploadCompletion?: UploadCompletionFormProps;
  readonly providerEvidence?: ProviderEvidencePanelProps;
  readonly onCanonicalRefetch?: (reason: RefetchReason) => Promise<void>;
  readonly onProtectedCommand?: (input: ProtectedCommandInput) => Promise<void>;
}

/**
 * Resolve the full workbench on the server so the document keeps its
 * server-first HTML, while the browser receives it as a separate lazy chunk.
 */
const InfrastructureWorkbenchRuntime: ComponentType<InfrastructureWorkbenchIslandProps> =
  import.meta.env.SSR
    ? (await import('./InfrastructureWorkbenchRuntime')).default
    : (lazy(
        () => import('./InfrastructureWorkbenchRuntime'),
      ) as ComponentType<InfrastructureWorkbenchIslandProps>);

export function InfrastructureWorkbench(
  props: InfrastructureWorkbenchIslandProps,
) {
  return (
    <Suspense
      fallback={
        <section
          className="infra-workbench"
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-labelledby="infrastructure-workbench-heading"
        >
          <header className="infra-workbench-header">
            <p className="infra-eyebrow">Infrastructure workbench</p>
            <h2 id="infrastructure-workbench-heading">
              Current infrastructure records
            </h2>
            <p>Loading interactive controls from the verified server view.</p>
          </header>
        </section>
      }
    >
      <InfrastructureWorkbenchRuntime {...props} />
    </Suspense>
  );
}

export default InfrastructureWorkbench;
