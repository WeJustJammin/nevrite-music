import { useState } from 'react';

import {
  confirmMerge as confirmMergeRequest,
  createMerge as createMergeRequest,
  proveMerge,
  readLoginMethods,
  startLink,
  unlink,
} from './api';
import { errorCopy, safeEtag } from './types';
import type {
  AccountSecurityActions,
  AccountSecurityController,
  AccountSecurityState,
  JobStatus,
  LoginMethod,
  LoginMethodManagerProps,
  PendingAction,
  ProviderCode,
  UiError,
  UnlinkReason,
} from './types';

const initialState = (
  props: LoginMethodManagerProps,
): AccountSecurityState => ({
  resource: props.initial,
  etag: safeEtag(props.initialEtag, props.initial.version),
  mergeCase: props.initialMerge,
  mergeEtag: props.initialMerge
    ? safeEtag(props.initialMergeEtag, props.initialMerge.version)
    : null,
  pending: null,
  error: null,
  announcement: 'Current login methods loaded from the server.',
  unlinkTarget: null,
  unlinkReason: 'user_request',
  unlinkAcknowledged: false,
  mergeProvider: 'email',
  mergeAcknowledged: false,
  conflictPlanVersion: props.initialMerge?.conflictPlanVersion ?? '',
  acknowledgements: '',
  job: null,
});

const isUiError = (value: unknown): value is UiError => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<UiError>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.requestId === 'string' &&
    (candidate.retryAfterSeconds === null ||
      typeof candidate.retryAfterSeconds === 'number')
  );
};

const updateMergeUrl = (mergeId: string | null): void => {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (mergeId === null) url.searchParams.delete('mergeId');
  else url.searchParams.set('mergeId', mergeId);
  window.history.replaceState(null, '', `${url.pathname}${url.search}`);
};

export default function useAccountSecurity(
  props: LoginMethodManagerProps,
): AccountSecurityController {
  const [state, setState] = useState<AccountSecurityState>(() =>
    initialState(props),
  );
  const patch = (changes: Partial<AccountSecurityState>): void =>
    setState((current) => ({ ...current, ...changes }));
  const reportError = (value: unknown): void => {
    const error: UiError = isUiError(value)
      ? value
      : {
          code: 'UNKNOWN_ERROR',
          requestId: props.requestId,
          retryAfterSeconds: null,
        };
    patch({ error, announcement: errorCopy(error) });
  };
  const run = async <T>(
    action: PendingAction,
    request: () => Promise<T>,
    changes: (result: T) => Partial<AccountSecurityState>,
  ): Promise<void> => {
    patch({ pending: action, error: null });
    try {
      patch(changes(await request()));
    } catch (error: unknown) {
      reportError(error);
    } finally {
      patch({ pending: null });
    }
  };
  const idle = state.pending === null;

  const refresh = (): Promise<void> =>
    !idle
      ? Promise.resolve()
      : run(
          'refresh',
          () => readLoginMethods(props.requestId),
          ({ data, etag }) => ({
            resource: data,
            etag: safeEtag(etag, data.version),
            announcement: 'Current login methods loaded from the server.',
          }),
        );

  const linkProvider = (provider: ProviderCode): Promise<void> =>
    !idle
      ? Promise.resolve()
      : run(
          `link:${provider}`,
          () =>
            startLink(provider, state.etag, props.returnTo, props.requestId),
          ({ data }) => {
            patch({
              announcement: `Opening the secure ${provider} linking flow.`,
            });
            window.location.assign(data.authorizationUrl);
            return {};
          },
        );

  const chooseUnlink = (method: LoginMethod): void => {
    if (!idle || !method.removable) return;
    patch({
      unlinkTarget: method,
      unlinkReason: 'user_request',
      unlinkAcknowledged: false,
      error: null,
      announcement: `Remove ${method.label} login method confirmation opened.`,
    });
  };
  const cancelUnlink = (): void => {
    if (!idle) return;
    patch({
      unlinkTarget: null,
      unlinkAcknowledged: false,
      announcement: 'Remove login method cancelled.',
    });
  };

  const confirmUnlink = (): Promise<void> => {
    const target = state.unlinkTarget;
    if (!idle || target === null || !state.unlinkAcknowledged)
      return Promise.resolve();
    return run(
      'unlink',
      () => unlink(target.id, state.etag, state.unlinkReason, props.requestId),
      ({ data, etag }) => ({
        resource: data,
        etag: safeEtag(etag, data.version),
        unlinkTarget: null,
        unlinkAcknowledged: false,
        announcement: 'The login method was removed after server confirmation.',
      }),
    );
  };

  const createMerge = (): Promise<void> => {
    if (!idle || state.mergeCase !== null) return Promise.resolve();
    return run(
      'merge-create',
      () => createMergeRequest(state.etag, props.returnTo, props.requestId),
      ({ data, etag }) => {
        updateMergeUrl(data.mergeId);
        return {
          mergeCase: data,
          mergeEtag: safeEtag(etag, data.version),
          conflictPlanVersion: data.conflictPlanVersion ?? '',
          announcement:
            'A merge case was opened for this account. No candidate account was searched or disclosed.',
        };
      },
    );
  };

  const proveDuplicate = (): Promise<void> => {
    const mergeCase = state.mergeCase;
    if (!idle || mergeCase?.state !== 'awaiting_duplicate_proof')
      return Promise.resolve();
    const provider = state.mergeProvider;
    return run(
      `merge-proof:${provider}`,
      () =>
        proveMerge(
          mergeCase.mergeId,
          state.mergeEtag ?? safeEtag(null, mergeCase.version),
          provider,
          props.returnTo,
          props.requestId,
        ),
      ({ data }) => {
        patch({ announcement: `Opening the secure ${provider} proof flow.` });
        window.location.assign(data.authorizationUrl);
        return {};
      },
    );
  };

  const confirmMerge = (): Promise<void> => {
    const mergeCase = state.mergeCase;
    if (!idle || mergeCase?.state !== 'awaiting_confirmation')
      return Promise.resolve();
    const codes = state.acknowledgements
      .split(',')
      .map((code) => code.trim())
      .filter(Boolean);
    if (
      state.conflictPlanVersion === '' ||
      codes.length === 0 ||
      codes.length > 50 ||
      new Set(codes).size !== codes.length ||
      !state.mergeAcknowledged
    ) {
      reportError({
        code: 'VALIDATION_FAILED',
        requestId: props.requestId,
        retryAfterSeconds: null,
      });
      return Promise.resolve();
    }
    return run(
      'merge-confirm',
      () =>
        confirmMergeRequest(
          mergeCase.mergeId,
          state.mergeEtag ?? safeEtag(null, mergeCase.version),
          state.conflictPlanVersion,
          codes,
          props.requestId,
        ),
      ({ data }) => {
        const job: JobStatus = data;
        return {
          job,
          mergeCase: { ...mergeCase, state: 'queued', jobId: job.id },
          mergeEtag: null,
          mergeAcknowledged: false,
          announcement:
            'The merge was accepted by the server and queued for processing.',
        };
      },
    );
  };

  const resetExpiredMerge = (): void => {
    if (!idle) return;
    patch({
      mergeCase: null,
      mergeEtag: null,
      job: null,
      conflictPlanVersion: '',
      acknowledgements: '',
      mergeAcknowledged: false,
      announcement:
        'Expired merge case cleared. Start a new recovery case when ready.',
    });
    updateMergeUrl(null);
  };

  const actions: AccountSecurityActions = {
    refresh,
    linkProvider,
    chooseUnlink,
    setUnlinkReason: (unlinkReason: UnlinkReason) => patch({ unlinkReason }),
    setUnlinkAcknowledged: (unlinkAcknowledged) =>
      patch({ unlinkAcknowledged }),
    cancelUnlink,
    confirmUnlink,
    createMerge,
    setMergeProvider: (mergeProvider) => patch({ mergeProvider }),
    proveDuplicate,
    setConflictPlanVersion: (conflictPlanVersion) =>
      patch({ conflictPlanVersion }),
    setAcknowledgements: (acknowledgements) => patch({ acknowledgements }),
    setMergeAcknowledged: (mergeAcknowledged) => patch({ mergeAcknowledged }),
    confirmMerge,
    resetExpiredMerge,
  };
  return { state, actions };
}
