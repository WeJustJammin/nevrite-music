export const ROUTE_PAGE_LOAD_EVENT = 'astro:page-load';
const PAGE_HEADING_ID = 'page-title';

export interface RouteHeadingFocusDocument {
  readonly addEventListener: (type: string, listener: () => void) => void;
  readonly getElementById: (id: string) => HTMLElement | null;
}

export interface RouteHeadingFocusLocation {
  readonly hash: string;
}

/**
 * Focuses the route heading after client navigation while preserving the
 * browser's initial and fragment-navigation focus destinations.
 */
export const installRouteHeadingFocus = (
  documentRef: RouteHeadingFocusDocument,
  locationRef: RouteHeadingFocusLocation,
): void => {
  let initialPageLoad = true;
  documentRef.addEventListener(ROUTE_PAGE_LOAD_EVENT, () => {
    if (initialPageLoad) {
      initialPageLoad = false;
      return;
    }
    if (locationRef.hash !== '') return;
    documentRef.getElementById(PAGE_HEADING_ID)?.focus({ preventScroll: true });
  });
};

const focusInitialNavigationHeading = (): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const search = new URL(window.location.href).searchParams;
  if (!search.has('tab') && !search.has('selected')) return;
  if (window.location.hash !== '') return;
  const focus = (): void =>
    document.getElementById(PAGE_HEADING_ID)?.focus({ preventScroll: true });
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', focus, { once: true });
  else focus();
};

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  installRouteHeadingFocus(document, window.location);
  focusInitialNavigationHeading();
}
