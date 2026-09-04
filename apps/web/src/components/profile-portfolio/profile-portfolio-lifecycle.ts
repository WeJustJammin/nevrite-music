import * as React from 'react';

import { readCanonicalProfileError } from './profile-portfolio-canonical-read';
import type { ProfilePortfolioAsyncState } from './profile-portfolio-workbench-types';

type LifecycleInput = Readonly<{
  selectedId: string | null;
  setInitial: React.Dispatch<React.SetStateAction<ProfilePortfolioAsyncState>>;
  mutationBusyRef: React.MutableRefObject<boolean>;
  keepMutationBusyRef: React.MutableRefObject<boolean>;
  setMutationBusy: React.Dispatch<React.SetStateAction<boolean>>;
}>;

export const useProfilePortfolioLifecycle = ({
  selectedId,
  setInitial,
  mutationBusyRef,
  keepMutationBusyRef,
  setMutationBusy,
}: LifecycleInput): void => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let active = true;
    void readCanonicalProfileError(selectedId).then((error) => {
      if (!active || error === null) return;
      setInitial((current) => ({
        ...current,
        status: error.code === 'DEPENDENCY_UNAVAILABLE' ? 'degraded' : 'error',
        stale: error.code === 'DEPENDENCY_UNAVAILABLE',
        error,
        retryable:
          error.code === 'DEPENDENCY_UNAVAILABLE' ||
          error.code === 'RATE_LIMITED',
      }));
    });
    const setOffline = (): void =>
      setInitial((current) => ({
        ...current,
        status: 'degraded',
        stale: true,
        lastVerifiedAt: current.lastVerifiedAt ?? new Date().toISOString(),
        error: {
          code: 'OFFLINE',
          message: 'Offline. Showing last verified profile data.',
          requestId: 'offline',
        },
        retryable: true,
      }));
    const setOnline = (): void =>
      setInitial((current) => {
        const next = {
          ...current,
          status: 'success' as const,
          stale: false,
          retryable: false,
        };
        delete next.error;
        return next;
      });
    window.addEventListener('offline', setOffline);
    window.addEventListener('online', setOnline);

    const channel =
      typeof BroadcastChannel === 'function'
        ? new BroadcastChannel('profile-portfolio')
        : undefined;
    channel?.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (
        typeof event.data !== 'object' ||
        event.data === null ||
        !('type' in event.data) ||
        event.data.type !== 'profile.projection.invalidated.v1' ||
        !('partyId' in event.data) ||
        event.data.partyId !== selectedId
      )
        return;
      keepMutationBusyRef.current = true;
      mutationBusyRef.current = true;
      setMutationBusy(true);
      setInitial((current) => ({
        ...current,
        status: 'conflict',
        stale: true,
        error: {
          code: 'VERSION_CONFLICT',
          message: 'The current profile version changed. Review changes.',
          requestId: 'sync-conflict',
        },
      }));
    });
    return () => {
      active = false;
      window.removeEventListener('offline', setOffline);
      window.removeEventListener('online', setOnline);
      channel?.close();
    };
  }, [
    keepMutationBusyRef,
    mutationBusyRef,
    selectedId,
    setInitial,
    setMutationBusy,
  ]);
};
