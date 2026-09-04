const layout = document.querySelector(
  '[data-testid="identity-authority-layout"]',
);

const updateIdentityAuthorityBreakpoint = (): void => {
  if (!(layout instanceof HTMLElement)) return;
  const width = window.innerWidth;
  if (width <= 768) {
    layout.dataset.breakpoint = 'mobile';
    layout.dataset.columns = '4';
    layout.dataset.composition = 'stacked';
  } else if (width <= 1024) {
    layout.dataset.breakpoint = 'tablet';
    layout.dataset.columns = '8';
    layout.dataset.composition = 'collapsible-sidebar';
  } else {
    layout.dataset.breakpoint = 'desktop';
    layout.dataset.columns = '12';
    layout.dataset.composition = 'list-detail-action-rail';
  }
};

updateIdentityAuthorityBreakpoint();
window.addEventListener('resize', updateIdentityAuthorityBreakpoint, {
  passive: true,
});
