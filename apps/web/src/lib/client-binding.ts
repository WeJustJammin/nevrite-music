export const CLIENT_BINDING_ID_HEADER = 'x-client-binding-id';
export const CLIENT_BINDING_ID_STORAGE_KEY = 'wj_client_binding_id_v1';
export const ACTING_CONTEXT_CHANGED_EVENT = 'wj:acting-context-changed:v1';

const clientBindingIdPattern = /^[A-Za-z0-9._:-]{1,128}$/u;
const CLIENT_BINDING_LOCK_PREFIX = 'wj:client-binding:v1:';

const bindingIdPromises = new WeakMap<Storage, Promise<string | null>>();
const bindingLockReleases = new WeakMap<Storage, () => void>();
const activeBindingLockReleases = new Set<() => void>();
const trackedBindingStorages = new Set<Storage>();
let pagehideWindow: Window | null = null;
let pageLifecycleRevision = 0;
let pageActive = true;

const registerPagehideRelease = (): void => {
  if (typeof window === 'undefined' || pagehideWindow === window) return;
  pagehideWindow = window;
  window.addEventListener('pagehide', () => {
    pageActive = false;
    pageLifecycleRevision += 1;
    for (const storage of [...trackedBindingStorages]) {
      releaseTabLock(storage);
      bindingIdPromises.delete(storage);
    }
    for (const release of [...activeBindingLockReleases]) release();
    trackedBindingStorages.clear();
  });
  window.addEventListener('pageshow', () => {
    pageActive = true;
  });
};

const createOpaqueTabId = (): string | null => {
  try {
    const cryptoApi = globalThis.crypto;
    if (typeof cryptoApi.randomUUID === 'function')
      return cryptoApi.randomUUID();
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  } catch {
    return null;
  }
};

const acquireTabLock = async (
  bindingId: string,
): Promise<(() => void) | null> => {
  if (typeof navigator === 'undefined' || navigator.locks === undefined)
    return null;
  let settleClaim: (release: (() => void) | null) => void = () => undefined;
  const claim = new Promise<(() => void) | null>((resolve) => {
    settleClaim = resolve;
  });
  try {
    const request = navigator.locks.request(
      `${CLIENT_BINDING_LOCK_PREFIX}${bindingId}`,
      { mode: 'exclusive', ifAvailable: true },
      (lock) => {
        if (lock === null) {
          settleClaim(null);
          return false;
        }
        let releaseHold: () => void = () => undefined;
        const hold = new Promise<void>((resolve) => {
          releaseHold = resolve;
        });
        settleClaim(releaseHold);
        return hold;
      },
    );
    void request.catch(() => settleClaim(null));
    return await claim;
  } catch {
    return null;
  }
};

const createAndClaimBindingId = async (
  storage: Storage,
  lifecycleRevision: number,
): Promise<string | null> => {
  try {
    let candidate = storage.getItem(CLIENT_BINDING_ID_STORAGE_KEY);
    if (candidate === null || !clientBindingIdPattern.test(candidate))
      candidate = createOpaqueTabId();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      if (candidate === null || !clientBindingIdPattern.test(candidate))
        return null;
      const release = await acquireTabLock(candidate);
      if (release !== null) {
        if (lifecycleRevision !== pageLifecycleRevision || !pageActive) {
          release();
          return null;
        }
        try {
          storage.setItem(CLIENT_BINDING_ID_STORAGE_KEY, candidate);
          bindingLockReleases.set(storage, release);
          activeBindingLockReleases.add(release);
          registerPagehideRelease();
          return candidate;
        } catch {
          release();
          return null;
        }
      }
      candidate = createOpaqueTabId();
    }
    return null;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts. The
    // caller then omits the optional selector and the server remains at self.
    return null;
  }
};

const releaseTabLock = (storage: Storage): void => {
  const release = bindingLockReleases.get(storage);
  trackedBindingStorages.delete(storage);
  if (release === undefined) return;
  bindingLockReleases.delete(storage);
  activeBindingLockReleases.delete(release);
  release();
};

/** Return a stable opaque identifier after this tab owns its browser lock. */
export const getClientBindingId = async (
  storage?: Storage,
): Promise<string | null> => {
  try {
    const tabStorage =
      storage ??
      (typeof window === 'undefined' ? undefined : window.sessionStorage);
    if (tabStorage === undefined || !pageActive) return null;
    const current = bindingIdPromises.get(tabStorage);
    if (current !== undefined) return current;
    trackedBindingStorages.add(tabStorage);
    registerPagehideRelease();
    const pending = createAndClaimBindingId(tabStorage, pageLifecycleRevision);
    bindingIdPromises.set(tabStorage, pending);
    return pending;
  } catch {
    return null;
  }
};

/** Remove only the current tab's binding selector before self-context recovery. */
export const clearClientBindingId = async (
  storage?: Storage,
): Promise<boolean> => {
  try {
    const tabStorage =
      storage ??
      (typeof window === 'undefined' ? undefined : window.sessionStorage);
    if (tabStorage === undefined) return false;
    const current = bindingIdPromises.get(tabStorage);
    if (current === undefined) await getClientBindingId(tabStorage);
    else await current;
    tabStorage.removeItem(CLIENT_BINDING_ID_STORAGE_KEY);
    releaseTabLock(tabStorage);
    bindingIdPromises.delete(tabStorage);
    return true;
  } catch {
    return false;
  }
};

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof Request !== 'undefined' && input instanceof Request)
    return input.url;
  return input instanceof URL ? input.href : String(input);
};

/** Add the selector only to same-origin browser requests, never SSR or third-party URLs. */
export const addClientBindingIdHeader = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<RequestInit> => {
  if (typeof window === 'undefined') return init;
  let target: URL;
  try {
    target = new URL(requestUrl(input), window.location.href);
  } catch {
    return init;
  }
  if (target.origin !== window.location.origin) return init;
  const headers = new Headers(init.headers);
  const clientBindingId = await getClientBindingId();
  if (clientBindingId === null) headers.delete(CLIENT_BINDING_ID_HEADER);
  else headers.set(CLIENT_BINDING_ID_HEADER, clientBindingId);
  return { ...init, headers };
};
