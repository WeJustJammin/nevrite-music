export const STATUS_UPDATED_EVENT = 'wejammin:status-updated';

export const installReleaseRecoveryStatusFocus = (
  documentRef: Document,
): void => {
  const statusRoots = documentRef.querySelectorAll<HTMLElement>(
    '[data-release-recovery-status]',
  );

  for (const root of statusRoots) {
    root.addEventListener(STATUS_UPDATED_EVENT, () => {
      if (documentRef.activeElement !== documentRef.body) return;
      root
        .querySelector<HTMLElement>('[data-status-heading]')
        ?.focus({ preventScroll: true });
    });
  }
};

if (typeof document !== 'undefined') {
  installReleaseRecoveryStatusFocus(document);
}
