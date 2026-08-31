import type { InfrastructureViewState } from '../../../../../packages/contracts/src/infrastructure-view-state.ts';
import type {
  AsyncState,
  InfrastructureRecord,
} from '@wejammin/ui/infrastructure/presentation';

export type ServerInitialState =
  InfrastructureViewState | AsyncState<readonly InfrastructureRecord[]>;

export type RefetchReason =
  'navigation' | 'realtime-hint' | 'mutation' | 'reconnect';
