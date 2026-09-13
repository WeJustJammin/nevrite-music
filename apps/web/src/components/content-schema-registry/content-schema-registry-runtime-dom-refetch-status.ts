export const ensureContentSchemaRegistryLiveRegion = (
  document: Document,
): HTMLElement => {
  let live = document.querySelector<HTMLElement>('[data-cms-canonical-status]');
  if (live !== null) return live;
  live = document.createElement('p');
  live.dataset.cmsCanonicalStatus = 'true';
  live.className = 'visually-hidden';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  const main = document.querySelector('main');
  if (main === null) document.body.insertBefore(live, document.body.firstChild);
  else main.insertBefore(live, main.firstChild);
  return live;
};

export const showContentSchemaRegistryOfflineStatus = (
  document: Document,
): void => {
  const root = document.querySelector<HTMLElement>(
    '[data-workbench="content-schema-registry"]',
  );
  if (root === null || root.querySelector('[data-cms-offline-status]') !== null)
    return;
  const status = document.createElement('section');
  status.dataset.cmsOfflineStatus = 'true';
  status.className = 'content-schema-registry-offline-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const heading = document.createElement('h3');
  heading.textContent = 'Registry is offline';
  const message = document.createElement('p');
  message.textContent =
    'Canonical registry reads are unavailable. No registry intent was retained offline.';
  status.appendChild(heading);
  status.appendChild(message);
  root.insertBefore(status, root.firstChild);
};

export const clearContentSchemaRegistryOfflineStatus = (
  document: Document,
): void => {
  document.querySelector<HTMLElement>('[data-cms-offline-status]')?.remove();
};
