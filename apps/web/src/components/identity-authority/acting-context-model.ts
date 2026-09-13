import type { ActingContextListResource } from '@wejammin/contracts';

export type ActingContextItem = ActingContextListResource['items'][number];
export type ActingContextResource = ActingContextListResource;

export interface ActingContextSwitcherProps {
  readonly contexts?: readonly ActingContextItem[];
  readonly items?: readonly ActingContextItem[];
  readonly initial: ActingContextResource;
  readonly selectedContextId: string;
  readonly selectedPartyId: string;
  readonly tabContextStatus?: 'checking' | 'verified' | 'unavailable';
  readonly contextReverted?: boolean;
  readonly suggestedContextId?: string | null;
  readonly onBindContext: (
    contextId: string,
  ) => Promise<{ readonly selectedPartyId: string }>;
  readonly onCanonicalRefetch: () => Promise<ActingContextResource>;
  readonly invalidationChannel: string;
}
