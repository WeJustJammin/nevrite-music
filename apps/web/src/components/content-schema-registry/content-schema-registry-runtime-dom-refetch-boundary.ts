export type ContentSchemaRegistryBoundaryVariant = 'disabled' | 'not-found';

export const replaceContentSchemaRegistryWithBoundary = (
  root: HTMLElement,
  heading: string,
  message: string,
  variant: ContentSchemaRegistryBoundaryVariant,
  retryUrl: string,
): HTMLElement => {
  const boundary = root.ownerDocument.createElement('section');
  boundary.className = 'content-schema-registry-capability-gate';
  boundary.dataset.cmsCanonicalBoundary = 'true';
  boundary.dataset.canonicalRefetchUrl = retryUrl;
  boundary.dataset.variant = variant;
  boundary.setAttribute('role', variant === 'not-found' ? 'status' : 'alert');
  boundary.setAttribute('aria-live', 'polite');
  const title = root.ownerDocument.createElement('h2');
  title.id = 'content-schema-registry-boundary-heading';
  title.tabIndex = -1;
  title.textContent = heading;
  const copy = root.ownerDocument.createElement('p');
  copy.textContent = message;
  const retry = root.ownerDocument.createElement('a');
  retry.href = retryUrl;
  retry.textContent = 'Retry canonical read';
  boundary.appendChild(title);
  boundary.appendChild(copy);
  boundary.appendChild(retry);
  root.replaceWith(boundary);
  return boundary;
};
