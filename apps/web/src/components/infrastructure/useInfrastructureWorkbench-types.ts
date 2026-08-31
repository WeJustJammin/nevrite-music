import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { InfrastructureNavigationQuery } from '@wejammin/ui/infrastructure/navigation';
import type { InfrastructureRecord } from '@wejammin/ui/infrastructure/presentation';

import type {
  RefetchReason,
  ServerInitialState,
} from './infrastructure-workbench-state';

export interface UseInfrastructureWorkbenchInput {
  readonly initial: ServerInitialState;
  readonly query: Readonly<Record<string, string>>;
  readonly initialSelectedId: string | null;
  readonly canonicalUrl: string;
  readonly onCanonicalRefetch?: (reason: RefetchReason) => Promise<void>;
  readonly expectedVersion: string | null;
  readonly onProtectedCommand?: (input: ProtectedCommandInput) => Promise<void>;
}

export interface ProtectedCommandInput {
  readonly recordId: string;
  readonly expectedVersion: string;
  readonly file: File | null;
}

export interface InfrastructureWorkbenchController {
  readonly queryState: InfrastructureNavigationQuery;
  readonly setQueryState: Dispatch<
    SetStateAction<InfrastructureNavigationQuery>
  >;
  readonly selectedId: string | null;
  readonly setSelectedId: Dispatch<SetStateAction<string | null>>;
  readonly records: readonly InfrastructureRecord[];
  readonly selectedRecord: InfrastructureRecord | null;
  readonly liveStatus:
    'idle' | 'loading' | 'stale' | 'failed' | 'offline' | 'pending';
  readonly commandAvailable: boolean;
  readonly showConfirmation: boolean;
  readonly setShowConfirmation: Dispatch<SetStateAction<boolean>>;
  readonly selectedFileName: string | null;
  readonly requestRefetch: (reason: RefetchReason) => Promise<void>;
  readonly hrefForRecord: (recordId: string) => string;
  readonly applyFilters: () => void;
  readonly resetFilters: () => void;
  readonly sortByLabel: () => void;
  readonly onArchiveReview: () => void;
  readonly onArchiveConfirm: () => void;
  readonly onArchiveCancel: () => void;
  readonly onFileChange: (file: File | undefined) => void;
  readonly activeFilters: readonly string[];
  readonly archiveTrigger: RefObject<HTMLButtonElement | null>;
  readonly confirmationHeading: RefObject<HTMLHeadingElement | null>;
}
