import {
  configurationErrorState,
  degradedConfigurationState,
} from './platform-configuration-state';
import {
  recordFromEffectiveResponse,
  requestError,
} from './settings-flags-runtime-controller-helpers';
import type {
  PlatformConfigurationAsyncState,
  SettingsFlagsRuntimeWorkbenchProps,
} from './platform-configuration-workbench-types';
import type * as React from 'react';

export type CanonicalRefetchReason =
  'navigation' | 'realtime-hint' | 'mutation' | 'reconnect';

export interface CanonicalRefetchContext {
  readonly initial: PlatformConfigurationAsyncState;
  readonly setInitial: React.Dispatch<
    React.SetStateAction<PlatformConfigurationAsyncState>
  >;
  readonly props: SettingsFlagsRuntimeWorkbenchProps;
}

export const refetchCanonicalData = async (
  context: CanonicalRefetchContext,
  reason: CanonicalRefetchReason,
): Promise<void> => {
  const { initial, props, setInitial } = context;
  if (props.onCanonicalRefetch !== undefined) {
    await props.onCanonicalRefetch(reason);
    return;
  }

  const key =
    typeof props.query.key === 'string' && props.query.key.length > 0
      ? props.query.key
      : typeof initial.data?.[0]?.projection.key === 'string'
        ? initial.data[0].projection.key
        : null;
  if (key === null) {
    if (typeof window !== 'undefined') window.location.reload();
    return;
  }
  const url = new URL(
    `/api/v1/config/${encodeURIComponent(key)}/effective`,
    typeof window === 'undefined'
      ? 'https://wejamm.in'
      : window.location.origin,
  );
  const source =
    typeof window === 'undefined' ? null : new URL(window.location.href);
  for (const name of [
    'environment',
    'partyId',
    'siteId',
    'route',
    'feature',
    'userId',
    'at',
  ]) {
    const value = source?.searchParams.get(name);
    if (value !== null && value !== undefined && value.length > 0)
      url.searchParams.set(name, value);
  }
  url.searchParams.set(
    'consumerKey',
    source?.searchParams.get('consumerKey') ?? 'web.platform-configuration',
  );
  url.searchParams.set(
    'supportedDefinitionVersions',
    source?.searchParams.get('supportedDefinitionVersions') ?? '1',
  );
  setInitial((current) => ({
    ...current,
    status: 'loading',
    startedAt: new Date().toISOString(),
    preserveSafePriorContent: true,
  }));

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch {
    setInitial((current) =>
      degradedConfigurationState({
        data: current.data ?? null,
        requestId:
          current.requestId ??
          props.requestId ??
          'platform-configuration-request',
        lastVerifiedAt: current.lastVerifiedAt ?? null,
        error: requestError(
          'DEPENDENCY_UNAVAILABLE',
          'Platform configuration is temporarily unavailable.',
        ),
      }),
    );
    return;
  }
  if (!response.ok) {
    const { parsePlatformConfigurationError } =
      await import('./settings-flags-runtime-workbench-transport');
    const error = await parsePlatformConfigurationError(response);
    if (response.status === 404) {
      setInitial({ status: 'empty', reason: 'not-disclosed', data: [] });
    } else if (response.status >= 500) {
      setInitial((current) =>
        degradedConfigurationState({
          data: current.data ?? null,
          requestId: error.requestId,
          lastVerifiedAt: current.lastVerifiedAt ?? null,
          error,
        }),
      );
    } else {
      setInitial(
        configurationErrorState({
          status: response.status,
          requestId: error.requestId,
          error,
        }),
      );
    }
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    setInitial((current) =>
      degradedConfigurationState({
        data: current.data ?? null,
        requestId:
          current.requestId ??
          props.requestId ??
          'platform-configuration-request',
        lastVerifiedAt: current.lastVerifiedAt ?? null,
        error: requestError(
          'INVALID_REQUEST',
          'The canonical response could not be read safely.',
        ),
      }),
    );
    return;
  }
  const record = await recordFromEffectiveResponse(payload);
  if (record === null) {
    setInitial((current) =>
      degradedConfigurationState({
        data: current.data ?? null,
        requestId:
          current.requestId ??
          props.requestId ??
          'platform-configuration-request',
        lastVerifiedAt: current.lastVerifiedAt ?? null,
        error: requestError(
          'INVALID_REQUEST',
          'The canonical response failed validation.',
        ),
      }),
    );
    return;
  }
  setInitial({
    status: 'success',
    data: [record],
    version: record.version,
    stale: false,
  });
};
