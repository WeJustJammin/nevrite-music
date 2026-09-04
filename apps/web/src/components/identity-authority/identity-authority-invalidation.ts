import { useEffect } from 'react';

import {
  isIdentityAuthorityInvalidationMessage,
  type IdentityAuthorityTab,
} from './identity-authority-routes';
import type { IdentityAuthorityRefetchReason } from './identity-authority-workbench-types';

export const IDENTITY_AUTHORITY_CHANNEL =
  'wejammin:identity-authority-invalidation';

export function useIdentityAuthorityInvalidation(
  tab: IdentityAuthorityTab,
  onCanonicalRefetch: (reason: IdentityAuthorityRefetchReason) => Promise<void>,
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const refetch = (): void => {
      void onCanonicalRefetch('realtime-hint').catch(() => undefined);
    };
    const handleMessage = (event: MessageEvent<unknown>): void => {
      if (!isIdentityAuthorityInvalidationMessage(event.data)) return;
      if (event.data.tab === tab) refetch();
    };
    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== IDENTITY_AUTHORITY_CHANNEL || event.newValue === null)
        return;
      try {
        const message: unknown = JSON.parse(event.newValue);
        if (
          isIdentityAuthorityInvalidationMessage(message) &&
          message.tab === tab
        ) {
          refetch();
        }
      } catch {
        return;
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(IDENTITY_AUTHORITY_CHANNEL);
      channel.addEventListener('message', handleMessage);
    } catch {
      channel = null;
    }
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      if (channel !== null) {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      }
    };
  }, [onCanonicalRefetch, tab]);
}
