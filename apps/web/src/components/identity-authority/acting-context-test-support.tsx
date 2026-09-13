import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import type { ActingContextListResource } from '@wejammin/contracts';
import { CLIENT_BINDING_ID_STORAGE_KEY } from '../../lib/client-binding';
import { createMemoryLockManager } from '../../lib/test-support/memory-lock-manager';
import { MemoryStorage } from '../../lib/test-support/memory-storage';
import ActingContextSwitcher from './ActingContextSwitcher';
import ActingContextSwitcherIsland from './ActingContextSwitcherIsland';

export const SELF_CONTEXT_ID = '11111111-1111-4111-8111-111111111111';
export const SELF_PARTY_ID = '11111111-1111-4111-8111-111111111112';
export const ALIAS_CONTEXT_ID = '22222222-2222-4222-8222-222222222221';
export const ALIAS_PARTY_ID = '22222222-2222-4222-8222-222222222222';

export const initial: ActingContextListResource = {
  projectionVersion: '1',
  items: [
    {
      contextId: SELF_CONTEXT_ID,
      partyId: SELF_PARTY_ID,
      kind: 'person',
      label: 'My profile',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-13T00:00:00.000Z',
    },
    {
      contextId: ALIAS_CONTEXT_ID,
      partyId: ALIAS_PARTY_ID,
      kind: 'alias',
      label: 'Neon Harbor',
      avatarRef: null,
      selectable: true,
      authorityFreshUntil: '2026-09-13T00:00:00.000Z',
    },
  ],
  nextCursor: null,
  hasMore: false,
};

export const sessionResource = (
  actingPartyId: string | null = SELF_PARTY_ID,
) => ({
  authenticated: true as const,
  accountState: 'active' as const,
  bootstrapState: 'complete' as const,
  personId: SELF_PARTY_ID,
  actingPartyId,
  sessionExpiresAt: '2026-09-13T00:00:00.000Z',
});

export { MemoryStorage };

export const installBrowserState = (
  beforeLockRequest?: (name: string) => Promise<void>,
) => {
  const sessionStorage = new MemoryStorage();
  const localStorage = new MemoryStorage();
  const locks = createMemoryLockManager(beforeLockRequest);
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: sessionStorage,
  });
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: locks.manager,
  });
  return { sessionStorage, localStorage, locks };
};

const reactActGlobal = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
const previousActEnvironment = reactActGlobal.IS_REACT_ACT_ENVIRONMENT;
reactActGlobal.IS_REACT_ACT_ENVIRONMENT = true;

export const restoreReactActEnvironment = (): void => {
  if (previousActEnvironment === undefined)
    delete reactActGlobal.IS_REACT_ACT_ENVIRONMENT;
  else reactActGlobal.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
};

type Mounted = Readonly<{ container: HTMLDivElement; root: Root }>;
const mounted: Mounted[] = [];

export const mountNode = (node: ReactNode): Mounted => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(node));
  const view = { container, root };
  mounted.push(view);
  return view;
};

export const mountSwitcher = (
  onBindContext: (
    contextId: string,
  ) => Promise<{ readonly selectedPartyId: string }>,
  onCanonicalRefetch: () => Promise<ActingContextListResource>,
) =>
  mountNode(
    <ActingContextSwitcher
      initial={initial}
      selectedContextId={SELF_CONTEXT_ID}
      selectedPartyId={SELF_PARTY_ID}
      onBindContext={onBindContext}
      onCanonicalRefetch={onCanonicalRefetch}
      invalidationChannel="identity-acting-context-test"
    />,
  );

export const mountIsland = () =>
  mountNode(
    <ActingContextSwitcherIsland
      initial={initial}
      selectedContextId={SELF_CONTEXT_ID}
      selectedPartyId={SELF_PARTY_ID}
      invalidationChannel="identity-acting-context-test"
    />,
  );

export const chooseAlias = (container: HTMLElement): void => {
  const select = container.querySelector(
    '#acting-context-select',
  ) as HTMLSelectElement | null;
  if (select === null)
    throw new Error('acting context select was not rendered');
  act(() => {
    select.value = ALIAS_CONTEXT_ID;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

export const confirm = async (container: HTMLElement): Promise<void> => {
  const button = container.querySelector<HTMLButtonElement>(
    'button[type="button"]',
  );
  if (button === null)
    throw new Error('confirm context button was not rendered');
  await act(async () => {
    button.click();
    await Promise.resolve();
  });
};

export const flushAsyncWork = async (): Promise<void> => {
  await act(async () => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  });
};

export const cleanupMounted = (
  locks: ReturnType<typeof createMemoryLockManager>,
): void => {
  while (mounted.length > 0) {
    const view = mounted.pop();
    if (view === undefined) continue;
    act(() => view.root.unmount());
    view.container.remove();
  }
  document.body.replaceChildren();
  window.dispatchEvent(new Event('pagehide'));
  locks.releaseAll();
  window.dispatchEvent(new Event('pageshow'));
};

export { act, CLIENT_BINDING_ID_STORAGE_KEY };
