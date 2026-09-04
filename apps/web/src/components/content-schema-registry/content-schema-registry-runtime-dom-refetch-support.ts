export type ContentSchemaRegistryFocusLocator =
  | { readonly kind: 'focus-key'; readonly value: string }
  | { readonly kind: 'id'; readonly value: string };

export const captureContentSchemaRegistryFocus = (
  root: HTMLElement,
): ContentSchemaRegistryFocusLocator | null => {
  const active = root.ownerDocument.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) return null;
  const focusKey = active.dataset.cmsFocusKey;
  if (focusKey !== undefined && focusKey.length > 0)
    return { kind: 'focus-key', value: focusKey };
  return active.id.length > 0 ? { kind: 'id', value: active.id } : null;
};

export const restoreContentSchemaRegistryFocus = (
  document: Document,
  locator: ContentSchemaRegistryFocusLocator | null,
): void => {
  if (locator === null) return;
  let next: HTMLElement | null = null;
  if (locator.kind === 'id') next = document.getElementById(locator.value);
  else {
    const candidates = document.querySelectorAll<HTMLElement>(
      '[data-cms-focus-key]',
    );
    for (const candidate of candidates) {
      if (candidate.dataset.cmsFocusKey === locator.value) {
        next = candidate;
        break;
      }
    }
  }
  next?.focus({ preventScroll: true });
};

export type ContentSchemaRegistryRefetchReason =
  'list-read' | 'detail-read' | 'reconnect';

const refetchReasonPriority: Readonly<
  Record<ContentSchemaRegistryRefetchReason, number>
> = {
  'list-read': 1,
  'detail-read': 2,
  reconnect: 3,
};

export const mergeContentSchemaRegistryRefetchReason = (
  current: ContentSchemaRegistryRefetchReason | null,
  next: ContentSchemaRegistryRefetchReason,
): ContentSchemaRegistryRefetchReason =>
  current === null ||
  refetchReasonPriority[next] > refetchReasonPriority[current]
    ? next
    : current;
