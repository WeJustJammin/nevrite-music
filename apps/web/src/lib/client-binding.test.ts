// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ACTING_CONTEXT_CHANGED_EVENT,
  CLIENT_BINDING_ID_STORAGE_KEY,
  addClientBindingIdHeader,
  clearClientBindingId,
  getClientBindingId,
} from './client-binding';
import { createMemoryLockManager } from './test-support/memory-lock-manager';
import { MemoryStorage } from './test-support/memory-storage';

let tabStorage = new MemoryStorage();
let localStorage = new MemoryStorage();
let lockManager = createMemoryLockManager();

beforeEach(() => {
  tabStorage = new MemoryStorage();
  localStorage = new MemoryStorage();
  lockManager = createMemoryLockManager();
  tabStorage.clear();
  localStorage.clear();
  Object.defineProperty(window, 'sessionStorage', {
    configurable: true,
    value: tabStorage,
  });
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorage,
  });
  Object.defineProperty(navigator, 'locks', {
    configurable: true,
    value: lockManager.manager,
  });
});

afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  lockManager.releaseAll();
  window.dispatchEvent(new Event('pageshow'));
  vi.restoreAllMocks();
});

describe('per-tab client binding', () => {
  it('persists one opaque identifier in sessionStorage without using cookies or localStorage', async () => {
    const beforeCookie = document.cookie;
    const localStorageWrite = vi.spyOn(localStorage, 'setItem');

    const first = await getClientBindingId();
    const second = await getClientBindingId();

    expect(first).toMatch(/^[A-Za-z0-9._:-]{1,128}$/u);
    expect(second).toBe(first);
    expect(window.sessionStorage.length).toBe(1);
    expect(localStorageWrite).not.toHaveBeenCalled();
    expect(document.cookie).toBe(beforeCookie);
  });

  it('uses each tab session store independently', async () => {
    const tabOneId = await getClientBindingId(new MemoryStorage());
    const tabTwoId = await getClientBindingId(new MemoryStorage());

    expect(tabOneId).not.toBeNull();
    expect(tabTwoId).not.toBe(tabOneId);
  });

  it('replaces an identifier copied from another tab sessionStorage', async () => {
    const originalTab = new MemoryStorage();
    const clonedTab = new MemoryStorage();
    originalTab.setItem(CLIENT_BINDING_ID_STORAGE_KEY, 'copied-tab-binding');
    clonedTab.setItem(
      CLIENT_BINDING_ID_STORAGE_KEY,
      originalTab.getItem(CLIENT_BINDING_ID_STORAGE_KEY) ?? '',
    );

    const originalId = await getClientBindingId(originalTab);
    const clonedId = await getClientBindingId(clonedTab);

    expect(originalId).not.toBeNull();
    expect(clonedId).not.toBe(originalId);
    expect(clonedTab.getItem(CLIENT_BINDING_ID_STORAGE_KEY)).toBe(clonedId);
    expect(await getClientBindingId(clonedTab)).toBe(clonedId);
  });

  it('reuses the stored identifier after a document reload releases its lock', async () => {
    const firstDocumentStorage = new MemoryStorage();
    const firstId = await getClientBindingId(firstDocumentStorage);
    const reloadedDocumentStorage = new MemoryStorage();
    reloadedDocumentStorage.setItem(
      CLIENT_BINDING_ID_STORAGE_KEY,
      firstDocumentStorage.getItem(CLIENT_BINDING_ID_STORAGE_KEY) ?? '',
    );
    const pagehide = new Event('pagehide');
    Object.defineProperty(pagehide, 'persisted', { value: true });
    window.dispatchEvent(pagehide);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    window.dispatchEvent(new Event('pageshow'));

    expect(await getClientBindingId(reloadedDocumentStorage)).toBe(firstId);
  });

  it('fails closed when browser tab locks are unavailable', async () => {
    Object.defineProperty(navigator, 'locks', {
      configurable: true,
      value: undefined,
    });

    expect(await getClientBindingId()).toBeNull();
    expect(
      window.sessionStorage.getItem(CLIENT_BINDING_ID_STORAGE_KEY),
    ).toBeNull();
    const init = await addClientBindingIdHeader('/api/v1/auth/session');
    expect(new Headers(init.headers).get('x-client-binding-id')).toBeNull();
  });

  it('removes only the current tab binding from sessionStorage', async () => {
    window.sessionStorage.setItem('wj_client_binding_id_v1', 'tab-binding');
    window.sessionStorage.setItem('unrelated-state', 'keep-me');
    window.localStorage.setItem('wj_client_binding_id_v1', 'persistent-value');

    expect(await clearClientBindingId()).toBe(true);
    expect(window.sessionStorage.getItem('wj_client_binding_id_v1')).toBeNull();
    expect(window.sessionStorage.getItem('unrelated-state')).toBe('keep-me');
    expect(window.localStorage.getItem('wj_client_binding_id_v1')).toBe(
      'persistent-value',
    );
  });

  it('adds the binding header to same-origin requests only', async () => {
    const sameOrigin = await addClientBindingIdHeader(
      '/api/v1/me/acting-contexts',
      { method: 'GET' },
    );
    const external = await addClientBindingIdHeader(
      'https://other.example/api',
      { method: 'GET' },
    );

    expect(new Headers(sameOrigin.headers).get('x-client-binding-id')).toBe(
      await getClientBindingId(),
    );
    expect(new Headers(external.headers).get('x-client-binding-id')).toBeNull();
    expect(ACTING_CONTEXT_CHANGED_EVENT).toBe('wj:acting-context-changed:v1');
  });
});
