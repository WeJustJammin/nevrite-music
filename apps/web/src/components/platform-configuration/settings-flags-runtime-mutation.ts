import {
  conflictConfigurationState,
  optimisticConfigurationState,
  rollbackConfigurationState,
} from './platform-configuration-state';
import { formDataToConfigurationCommand } from './settings-flags-runtime-workbench-command';
import {
  ifMatchHeader,
  requestError,
  safeMutationEndpoint,
  stateWithError,
} from './settings-flags-runtime-controller-helpers';
import type {
  PlatformConfigurationAsyncState,
  PlatformConfigurationRecord,
  SettingsFlagsRuntimeWorkbenchProps,
} from './platform-configuration-workbench-types';
import type { CanonicalRefetchReason } from './settings-flags-runtime-refetch';
import type * as React from 'react';

export interface MutationContext {
  readonly event: React.FormEvent<HTMLFormElement>;
  readonly initial: PlatformConfigurationAsyncState;
  readonly props: SettingsFlagsRuntimeWorkbenchProps;
  readonly idempotencyKey: string;
  readonly mutationBusyRef: React.MutableRefObject<boolean>;
  readonly lastMutationAtRef: React.MutableRefObject<number>;
  readonly preimageRef: React.MutableRefObject<
    readonly PlatformConfigurationRecord[]
  >;
  readonly setInitial: React.Dispatch<
    React.SetStateAction<PlatformConfigurationAsyncState>
  >;
  readonly setMutationBusy: React.Dispatch<React.SetStateAction<boolean>>;
  readonly refetchCanonical: (reason: CanonicalRefetchReason) => Promise<void>;
}

export const submitConfigurationMutation = async ({
  event,
  initial,
  props,
  idempotencyKey,
  mutationBusyRef,
  lastMutationAtRef,
  preimageRef,
  setInitial,
  setMutationBusy,
  refetchCanonical,
}: MutationContext): Promise<void> => {
  event.preventDefault();
  const now = Date.now();
  if (mutationBusyRef.current || now - lastMutationAtRef.current < 1_000) {
    const error = requestError(
      'IDEMPOTENCY_CONFLICT',
      'This operation is already pending. Review its canonical result.',
    );
    setInitial((current) =>
      conflictConfigurationState({
        data: current.data ?? [],
        ...(current.version === undefined ? {} : { version: current.version }),
        error,
      }),
    );
    return;
  }
  const form = event.currentTarget;
  const endpoint = form.getAttribute('action');
  if (endpoint === null || endpoint === '' || !safeMutationEndpoint(endpoint)) {
    setInitial((current) =>
      stateWithError(
        current,
        requestError('INVALID_REQUEST', 'This command target is not allowed.'),
      ),
    );
    return;
  }
  const method =
    form.getAttribute('method')?.toUpperCase() === 'GET' ? 'GET' : 'POST';
  const command = formDataToConfigurationCommand(form);
  const previous = initial.data ?? [];
  preimageRef.current = previous;
  lastMutationAtRef.current = now;
  mutationBusyRef.current = true;
  setMutationBusy(true);
  setInitial((current) =>
    optimisticConfigurationState({
      data: current.data ?? [],
      operationId: idempotencyKey,
      version: current.version ?? props.expectedVersion ?? '1',
    }),
  );
  try {
    const {
      commandFailureState,
      parseConfigurationCommandResponse,
      parsePlatformConfigurationError,
    } = await import('./settings-flags-runtime-workbench-transport');
    const match = ifMatchHeader(props.expectedVersion);
    const response = await fetch(endpoint, {
      method,
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'X-CSRF-Token': props.csrfToken ?? '',
        ...(match === null ? {} : { 'If-Match': match }),
      },
      body: JSON.stringify(command),
    });
    if (!response.ok) {
      const error = await parsePlatformConfigurationError(response);
      const failure = commandFailureState(response, error);
      setInitial((current) =>
        response.status === 409
          ? conflictConfigurationState({
              data: previous,
              ...(current.version === undefined
                ? {}
                : { version: current.version }),
              error,
            })
          : failure.status === 'degraded'
            ? failure
            : rollbackConfigurationState({
                preimage: previous,
                version: current.version ?? props.expectedVersion ?? '1',
                operationId: idempotencyKey,
                error,
              }),
      );
      if (error.code === 'VALIDATION_FAILED') {
        form
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus({ preventScroll: true });
      }
      return;
    }
    const operationId = endpoint.includes('/actions')
      ? 'CFG-05A-04'
      : 'CFG-05A-03';
    const parsed = parseConfigurationCommandResponse(
      await response.clone().json(),
      operationId,
    );
    if (parsed === null) {
      setInitial((current) =>
        stateWithError(
          current,
          requestError(
            'INVALID_REQUEST',
            'The canonical command response could not be read safely.',
          ),
          'degraded',
        ),
      );
      return;
    }
    const nextVersion =
      'resultingVersion' in parsed
        ? parsed.resultingVersion
        : parsed.definitionVersion;
    setInitial((current) => ({
      ...current,
      status: 'success',
      version: nextVersion,
      stale: false,
      data: current.data ?? previous,
    }));
    await refetchCanonical('mutation');
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('wejammin-platform-configuration');
      channel.postMessage({
        type: 'configuration-invalidation',
        operationId: idempotencyKey,
      });
      channel.close();
    }
  } catch {
    setInitial((current) =>
      stateWithError(
        current,
        requestError(
          'DEPENDENCY_UNAVAILABLE',
          'Platform configuration is temporarily unavailable.',
        ),
        'degraded',
      ),
    );
  } finally {
    mutationBusyRef.current = false;
    setMutationBusy(false);
  }
};
