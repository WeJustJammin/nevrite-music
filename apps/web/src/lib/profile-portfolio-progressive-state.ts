import type { ProfilePortfolioAsyncState } from '../components/profile-portfolio/profile-portfolio-workbench-types';

const WORKBENCH_SELECTOR = '[data-workbench="profile-portfolio-epk"]';

/** Preserve a pre-hydration form result when React takes ownership of the island. */
export const profilePortfolioStateFromProgressiveForm = (
  fallback: ProfilePortfolioAsyncState,
): ProfilePortfolioAsyncState => {
  if (typeof document === 'undefined') return fallback;
  const root = document.querySelector<HTMLElement>(WORKBENCH_SELECTOR);
  const state = root?.dataset.progressiveState;
  if (state === 'error')
    return {
      ...fallback,
      status: 'error',
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Check the highlighted fields.',
        requestId: 'client-validation',
        details: {
          violations: [
            {
              path: 'headline',
              message: 'Headline contains unsupported markup.',
            },
          ],
        },
      },
    };
  if (state === 'conflict')
    return {
      ...fallback,
      status: 'conflict',
      stale: true,
      error: {
        code: 'VERSION_CONFLICT',
        message: 'The current profile version changed. Review changes.',
        requestId: 'duplicate-mutation',
      },
    };
  if (state === 'optimistic-pending')
    return { ...fallback, status: 'optimistic-pending' };
  return fallback;
};
