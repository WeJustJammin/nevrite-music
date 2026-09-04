interface RetryCountdownEntry {
  readonly marker: HTMLElement;
  readonly control: HTMLButtonElement;
  readonly href: string;
  readonly deadline: number;
}

interface RetryCountdownBinding {
  readonly cleanup: () => void;
}

const retryCountdownBindings = new WeakMap<
  HTMLElement,
  RetryCountdownBinding
>();

const retryAfterSeconds = (value: string | undefined): number | null => {
  if (value === undefined || !/^(?:0|[1-9]\d*)$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds <= 3_600 ? seconds : null;
};

const retryMessage = (seconds: number): string =>
  seconds === 0
    ? 'Retry is available now.'
    : `Retry available in ${seconds} second${seconds === 1 ? '' : 's'}.`;

const safeRetryHref = (root: HTMLElement, retryUrl: string): string | null => {
  if (retryUrl.length === 0) return null;
  try {
    const document = root.ownerDocument;
    const target = new URL(retryUrl, document.location.href);
    if (target.origin !== document.location.origin) return null;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return null;
  }
};

const statusContainer = (marker: HTMLElement, root: HTMLElement): HTMLElement =>
  marker.closest<HTMLElement>('section') ?? root;

const entriesFor = (
  root: HTMLElement,
  retryUrl: string,
  now: number,
): RetryCountdownEntry[] => {
  const safeHref = safeRetryHref(root, retryUrl);
  if (safeHref === null) return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>('[data-retry-after-seconds]'),
  ).flatMap((marker) => {
    const seconds = retryAfterSeconds(marker.dataset.retryAfterSeconds);
    const control = statusContainer(
      marker,
      root,
    ).querySelector<HTMLButtonElement>('[data-cms-retry-control="disabled"]');
    if (seconds === null || control === null) return [];
    return [
      {
        marker,
        control,
        href: safeHref,
        deadline: now + seconds * 1_000,
      },
    ];
  });
};

const enableRetry = (entry: RetryCountdownEntry, root: HTMLElement): void => {
  const anchor = root.ownerDocument.createElement('a');
  anchor.href = entry.href;
  anchor.dataset.cmsRetryControl = 'enabled';
  anchor.textContent = 'Retry';
  entry.control.replaceWith(anchor);
};

/** Hydrate server-rendered 429 controls after a bounded DOM replacement. */
export const hydrateContentSchemaRegistryRetryCountdown = (
  root: HTMLElement,
  retryUrl: string,
): (() => void) => {
  const existing = retryCountdownBindings.get(root);
  if (existing !== undefined) return existing.cleanup;
  const windowObject = root.ownerDocument.defaultView;
  if (windowObject === null) return () => undefined;
  const entries = entriesFor(root, retryUrl, Date.now());
  if (entries.length === 0) return () => undefined;

  let timer: number | undefined;
  let disposed = false;
  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    if (timer !== undefined) windowObject.clearTimeout(timer);
    retryCountdownBindings.delete(root);
  };
  retryCountdownBindings.set(root, { cleanup });

  const update = (): void => {
    if (disposed) return;
    let pending = false;
    const now = Date.now();
    for (const entry of entries) {
      const remaining = Math.max(0, Math.ceil((entry.deadline - now) / 1_000));
      entry.marker.dataset.retryAfterSeconds = String(remaining);
      if (remaining === 0) {
        entry.marker.textContent = retryMessage(0);
        enableRetry(entry, root);
      } else {
        pending = true;
        entry.marker.textContent = retryMessage(remaining);
      }
    }
    if (!pending) cleanup();
    else timer = windowObject.setTimeout(update, 1_000);
  };

  update();
  return cleanup;
};
