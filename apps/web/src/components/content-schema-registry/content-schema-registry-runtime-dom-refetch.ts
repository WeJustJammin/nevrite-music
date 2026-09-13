import {
  CONTENT_SCHEMA_REGISTRY_LOADING_DELAY_MS,
  executeContentSchemaRegistryRead,
} from './content-schema-registry-runtime';
import { subscribeContentSchemaRegistryInvalidation } from './content-schema-registry-invalidation';
import { replaceContentSchemaRegistryWithBoundary } from './content-schema-registry-runtime-dom-refetch-boundary';
import { hydrateContentSchemaRegistryRetryCountdown } from './content-schema-registry-runtime-dom-retry';
import {
  captureContentSchemaRegistryFocus,
  mergeContentSchemaRegistryRefetchReason,
  restoreContentSchemaRegistryFocus,
} from './content-schema-registry-runtime-dom-refetch-support';
import {
  clearContentSchemaRegistryOfflineStatus,
  ensureContentSchemaRegistryLiveRegion,
  showContentSchemaRegistryOfflineStatus,
} from './content-schema-registry-runtime-dom-refetch-status';
import { ACTING_CONTEXT_CHANGED_EVENT } from '../../lib/client-binding';
export type ContentSchemaRegistryRefetchReason =
  'list-read' | 'detail-read' | 'reconnect';

export interface ContentSchemaRegistryCanonicalRefetchOptions {
  readonly document: Document;
  readonly canonicalUrl: string;
  readonly reason: ContentSchemaRegistryRefetchReason;
  readonly onAfterReplace?: () => void;
}

const sameOriginTarget = (document: Document, value: string): string | null => {
  try {
    const target = new URL(value, document.location.href);
    return target.origin === document.location.origin
      ? `${target.pathname}${target.search}${target.hash}`
      : null;
  } catch {
    return null;
  }
};

const routeToSignIn = (document: Document): void => {
  const location = document.defaultView?.location;
  if (location === undefined) return;
  const returnTo = `${location.pathname}${location.search}`;
  location.assign(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
};

/** Fetch one canonical projection and replace only the bounded workbench. */
export const refetchContentSchemaRegistryCanonical = async (
  options: ContentSchemaRegistryCanonicalRefetchOptions,
): Promise<void> => {
  const { document, canonicalUrl, reason, onAfterReplace } = options;
  const currentRoot = document.querySelector<HTMLElement>(
    '[data-workbench="content-schema-registry"], [data-cms-canonical-boundary]',
  );
  if (currentRoot === null) return;
  const focusLocator = captureContentSchemaRegistryFocus(currentRoot);
  const live = ensureContentSchemaRegistryLiveRegion(document);
  let skeleton: HTMLElement | null = null;
  const loadingTimer = document.defaultView?.setTimeout(() => {
    currentRoot.setAttribute('aria-busy', 'true');
    skeleton = document.createElement('div');
    skeleton.className = 'content-schema-registry-loading-skeleton';
    skeleton.dataset.cmsLoadingSkeleton = 'true';
    skeleton.setAttribute('aria-hidden', 'true');
    currentRoot.insertBefore(skeleton, currentRoot.firstChild);
    live.textContent =
      reason === 'reconnect'
        ? 'Reconnecting and loading current records.'
        : 'Loading current records.';
  }, CONTENT_SCHEMA_REGISTRY_LOADING_DELAY_MS);
  const result = await executeContentSchemaRegistryRead({ url: canonicalUrl });
  if (loadingTimer !== undefined)
    document.defaultView?.clearTimeout(loadingTimer);
  const renderedSkeleton = skeleton as HTMLElement | null;
  renderedSkeleton?.remove();
  currentRoot.removeAttribute('aria-busy');

  const response = result.response;
  if (response === null) {
    const boundary = replaceContentSchemaRegistryWithBoundary(
      currentRoot,
      'Registry read unavailable',
      'The network did not return a current registry projection.',
      'disabled',
      canonicalUrl,
    );
    boundary.querySelector('h2')?.focus({ preventScroll: true });
    live.textContent = 'The registry is temporarily unavailable. Try again.';
    return;
  }
  if (response.status >= 300 && response.status < 400) {
    const target = response.headers.get('location');
    const safeTarget =
      target === null ? null : sameOriginTarget(document, target);
    if (safeTarget !== null) document.defaultView?.location.assign(safeTarget);
    else {
      const boundary = replaceContentSchemaRegistryWithBoundary(
        currentRoot,
        'Registry navigation unavailable',
        'The registry response did not include a safe same-origin destination.',
        'disabled',
        canonicalUrl,
      );
      boundary.querySelector('h2')?.focus({ preventScroll: true });
      live.textContent = 'The registry response was not a safe destination.';
    }
    return;
  }
  if (response.status === 401) {
    routeToSignIn(document);
    return;
  }
  if (response.status === 403) {
    const boundary = replaceContentSchemaRegistryWithBoundary(
      currentRoot,
      'Registry access unavailable',
      'The server did not grant this registry scope.',
      'disabled',
      canonicalUrl,
    );
    boundary.querySelector('h2')?.focus({ preventScroll: true });
    live.textContent = 'Registry access is unavailable.';
    return;
  }
  if (response.status === 404) {
    const boundary = replaceContentSchemaRegistryWithBoundary(
      currentRoot,
      'Registry record not found',
      'The requested registry record is no longer available.',
      'not-found',
      canonicalUrl,
    );
    live.textContent = 'The requested registry record was not found.';
    boundary.querySelector('h2')?.focus({ preventScroll: true });
    return;
  }
  // A rate-limited HTML projection carries the exact Retry-After countdown;
  // keep that server-rendered status instead of replacing it with a generic
  // boundary. Dependency failures still use the bounded generic boundary.
  if (result.outcome !== 'success' && response.status !== 429) {
    const boundary = replaceContentSchemaRegistryWithBoundary(
      currentRoot,
      'Registry temporarily unavailable',
      'The server could not provide a current registry projection.',
      'disabled',
      canonicalUrl,
    );
    boundary.querySelector('h2')?.focus({ preventScroll: true });
    live.textContent = 'The registry is temporarily unavailable. Try again.';
    return;
  }
  let markup: string;
  try {
    markup = await response.text();
  } catch {
    const boundary = replaceContentSchemaRegistryWithBoundary(
      currentRoot,
      'Registry response unavailable',
      'The network response could not be read safely. Try again.',
      'disabled',
      canonicalUrl,
    );
    boundary.querySelector('h2')?.focus({ preventScroll: true });
    live.textContent =
      'The registry response could not be read safely. Try again.';
    return;
  }
  const parsed = new DOMParser().parseFromString(markup, 'text/html');
  const nextRoot = parsed.querySelector<HTMLElement>(
    '[data-workbench="content-schema-registry"]',
  );
  if (nextRoot === null) {
    const boundary = replaceContentSchemaRegistryWithBoundary(
      currentRoot,
      'Registry response unavailable',
      'The server response could not be rendered safely.',
      'disabled',
      canonicalUrl,
    );
    boundary.querySelector('h2')?.focus({ preventScroll: true });
    live.textContent = 'The registry response could not be rendered safely.';
    return;
  }
  const hydrationState = currentRoot.getAttribute(
    'data-content-schema-registry-hydrated',
  );
  if (hydrationState !== null) {
    nextRoot.setAttribute(
      'data-content-schema-registry-hydrated',
      hydrationState,
    );
  }
  currentRoot.replaceWith(nextRoot);
  if (parsed.title.length > 0) document.title = parsed.title;
  onAfterReplace?.();
  hydrateContentSchemaRegistryRetryCountdown(nextRoot, canonicalUrl);
  restoreContentSchemaRegistryFocus(document, focusLocator);
  clearContentSchemaRegistryOfflineStatus(document);
  live.textContent =
    response.status === 429
      ? 'Registry retry timing refreshed from the server.'
      : 'Current server-verified records refreshed.';
};

/** Bind metadata-only invalidation and connectivity to canonical refetch. */
export const installContentSchemaRegistryCanonicalRefetch = (
  document: Document,
  canonicalUrl: string,
  onRefetch?: (
    reason: ContentSchemaRegistryRefetchReason,
  ) => void | Promise<void>,
): (() => void) => {
  const root = document.querySelector<HTMLElement>(
    '[data-workbench="content-schema-registry"]',
  );
  const windowObject = document.defaultView;
  if (root === null || windowObject === null) return () => undefined;
  const readReason: ContentSchemaRegistryRefetchReason = canonicalUrl.includes(
    '/versions/',
  )
    ? 'detail-read'
    : 'list-read';
  let inFlight: Promise<void> | null = null;
  let pendingReason: ContentSchemaRegistryRefetchReason | null = null;
  let debounceTimer: number | undefined;
  let disposed = false;
  const run = (reason: ContentSchemaRegistryRefetchReason): void => {
    if (disposed) return;
    pendingReason = mergeContentSchemaRegistryRefetchReason(
      pendingReason,
      reason,
    );
    if (inFlight !== null || debounceTimer !== undefined) return;
    debounceTimer = windowObject.setTimeout(() => {
      debounceTimer = undefined;
      const nextReason = pendingReason;
      pendingReason = null;
      if (nextReason === null || disposed) return;
      const operation = (): void | Promise<void> =>
        onRefetch === undefined
          ? windowObject.location.assign(canonicalUrl)
          : onRefetch(nextReason);
      inFlight = Promise.resolve()
        .then(operation)
        .catch(() => undefined)
        .finally(() => {
          inFlight = null;
          if (pendingReason !== null) run(pendingReason);
        });
    }, 0);
  };
  const subscription = subscribeContentSchemaRegistryInvalidation({
    onInvalidate: () => run(readReason),
  });
  const onOffline = (): void =>
    showContentSchemaRegistryOfflineStatus(document);
  const onOnline = (): void => {
    clearContentSchemaRegistryOfflineStatus(document);
    run('reconnect');
  };
  const onActingContextChanged = (): void => run(readReason);
  windowObject.addEventListener('offline', onOffline);
  windowObject.addEventListener('online', onOnline);
  windowObject.addEventListener(
    ACTING_CONTEXT_CHANGED_EVENT,
    onActingContextChanged,
  );
  // Astro SSR cannot carry sessionStorage-backed acting context. Re-read the
  // canonical page projection once after hydration with this tab's selector.
  run(readReason);
  return () => {
    disposed = true;
    if (debounceTimer !== undefined) windowObject.clearTimeout(debounceTimer);
    pendingReason = null;
    subscription.unsubscribe();
    windowObject.removeEventListener('offline', onOffline);
    windowObject.removeEventListener('online', onOnline);
    windowObject.removeEventListener(
      ACTING_CONTEXT_CHANGED_EVENT,
      onActingContextChanged,
    );
  };
};
