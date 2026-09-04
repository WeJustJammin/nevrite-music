import * as React from 'react';

import {
  firstProfilePortfolioProjection,
  profilePortfolioSelectionUrl,
} from './profile-portfolio-workbench-helpers';
import {
  mutationFailureStatus,
  parseProfilePortfolioError,
} from './profile-portfolio-workbench-transport';
import { profilePortfolioStateFromProgressiveForm } from '../../lib/profile-portfolio-progressive-state';
import { useProfilePortfolioLifecycle } from './profile-portfolio-lifecycle';
import type {
  ProfilePortfolioAsyncState,
  ProfilePortfolioWorkbenchProps,
} from './profile-portfolio-workbench-types';
import type { ProfilePortfolioWorkbenchViewProps } from './ProfilePortfolioWorkbenchView';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const breakpoint = (): Breakpoint => {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < 640
    ? 'mobile'
    : window.innerWidth < 1100
      ? 'tablet'
      : 'desktop';
};

const subscribeToBreakpoint = (notify: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('resize', notify);
  return () => window.removeEventListener('resize', notify);
};

const versionConflict = (requestId: string) => ({
  code: 'VERSION_CONFLICT',
  message: 'The current profile version changed. Review changes.',
  requestId,
});

export const useProfilePortfolioWorkbenchController = (
  props: ProfilePortfolioWorkbenchProps,
): Omit<
  ProfilePortfolioWorkbenchViewProps,
  'contractFields' | 'variant' | 'access'
> => {
  const [initial, setInitial] = React.useState<ProfilePortfolioAsyncState>(() =>
    profilePortfolioStateFromProgressiveForm(props.initial),
  );
  const [mutationBusy, setMutationBusy] = React.useState(() =>
    ['optimistic-pending', 'conflict'].includes(
      profilePortfolioStateFromProgressiveForm(props.initial).status,
    ),
  );
  const [statusMessage, setStatusMessage] = React.useState<string | undefined>(
    () => {
      const initialFilter = props.query.filter?.trim() ?? '';
      return initialFilter.length > 0
        ? `Profile portfolio results filtered by ${initialFilter}.`
        : undefined;
    },
  );
  const mutationBusyRef = React.useRef(false);
  const lastMutationAtRef = React.useRef(0);
  const keepMutationBusyRef = React.useRef(false);
  const breakpointValue = React.useSyncExternalStore(
    subscribeToBreakpoint,
    breakpoint,
    (): Breakpoint => 'desktop',
  );
  const projection = firstProfilePortfolioProjection(initial);
  const filter = props.query.filter ?? '';
  const selectedId = props.selectedId ?? initial.data?.[0]?.id ?? null;
  const selectionUrl = profilePortfolioSelectionUrl(props.query, selectedId);
  const [idempotencyKey] = React.useState(
    `profile-portfolio-${selectedId ?? 'new'}-${props.expectedVersion ?? '0'}`,
  );

  React.useEffect(() => {
    document
      .querySelector<HTMLElement>('[data-workbench="profile-portfolio-epk"]')
      ?.setAttribute('data-profile-portfolio-hydrated', 'true');
  }, []);
  useProfilePortfolioLifecycle({
    selectedId,
    setInitial,
    mutationBusyRef,
    keepMutationBusyRef,
    setMutationBusy,
  });

  const onFilterSubmit = (value: string): void => {
    const next = value.trim();
    setStatusMessage(
      next.length > 0
        ? `Profile portfolio results filtered by ${next}.`
        : 'Profile portfolio results show all available items.',
    );
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (next) params.set('filter', next);
    else params.delete('filter');
    window.history.pushState({}, '', `${window.location.pathname}?${params}`);
  };

  const onSelection = (id: string): string =>
    profilePortfolioSelectionUrl(props.query, id);

  const onMutationSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    if (event.defaultPrevented) return;
    event.preventDefault();
    const now = Date.now();
    if (
      mutationBusyRef.current ||
      mutationBusy ||
      now - lastMutationAtRef.current < 1000
    ) {
      keepMutationBusyRef.current = true;
      mutationBusyRef.current = true;
      setMutationBusy(true);
      setInitial((current) => ({
        ...current,
        status: 'conflict',
        error: versionConflict('duplicate-mutation'),
      }));
      return;
    }
    const form = event.currentTarget;
    const endpoint = form.getAttribute('action');
    if (!endpoint) return;
    const formData = new FormData(form);
    const headline = formData.get('headline');
    if (typeof headline === 'string' && /[<>]/u.test(headline)) {
      const field = form.elements.namedItem('headline');
      if (field instanceof HTMLElement) field.focus({ preventScroll: true });
      setInitial((current) => ({
        ...current,
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
      }));
      return;
    }
    lastMutationAtRef.current = now;
    mutationBusyRef.current = true;
    setMutationBusy(true);
    setInitial((current) => ({ ...current, status: 'optimistic-pending' }));
    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'If-Match': props.expectedVersion ?? '',
          'Idempotency-Key': idempotencyKey,
          'X-CSRF-Token': props.csrfToken ?? '',
        },
        body: JSON.stringify({ sectionCode: 'now', headline }),
      });
      if (!response.ok) {
        const error = await parseProfilePortfolioError(response);
        const status =
          response.status === 409
            ? ('conflict' as const)
            : mutationFailureStatus(response.status);
        if (keepMutationBusyRef.current) return;
        setInitial((current) => ({
          ...current,
          status,
          error,
          retryable: response.status === 429 || response.status >= 500,
        }));
      } else {
        if (keepMutationBusyRef.current) return;
        setInitial((current) => ({
          ...current,
          status: 'success',
          stale: false,
          version: current.version ?? props.expectedVersion ?? '',
        }));
        await props.onCanonicalRefetch?.('mutation');
      }
    } catch {
      if (!keepMutationBusyRef.current)
        setInitial((current) => ({
          ...current,
          status: 'degraded',
          error: {
            code: 'DEPENDENCY_UNAVAILABLE',
            message: 'The profile service is temporarily unavailable.',
            requestId: 'unknown',
          },
          retryable: true,
        }));
    } finally {
      if (!keepMutationBusyRef.current) {
        mutationBusyRef.current = false;
        setMutationBusy(false);
      }
    }
  };

  const onRetry = (): void => {
    void props.onCanonicalRefetch?.('reconnect');
  };

  return {
    initial,
    projection,
    actorId: props.actorId,
    actingPartyId: props.actingPartyId,
    expectedVersion: props.expectedVersion,
    csrfToken: props.csrfToken ?? '',
    breakpoint: breakpointValue,
    selectionUrl,
    filter,
    mutationBusy,
    idempotencyKey,
    onFilterSubmit,
    onMutationSubmit,
    onRetry,
    onSelection,
    statusMessage,
  };
};
