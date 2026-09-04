import * as React from 'react';

import type {
  PlatformConfigurationAsyncState,
  PlatformConfigurationBreakpoint,
  PlatformConfigurationRecord,
  SettingsFlagsRuntimeWorkbenchProps,
} from './platform-configuration-workbench-types';
import {
  getBreakpoint,
  normalizedVersion,
  parseSettingsRuntimeSort,
  queryValue,
  selectedFromUrl,
  settingsRuntimeUrl,
  sortFromUrl,
  subscribeToBreakpoint,
} from './settings-flags-runtime-controller-helpers';
import {
  refetchCanonicalData,
  type CanonicalRefetchReason,
} from './settings-flags-runtime-refetch';
import { submitConfigurationMutation } from './settings-flags-runtime-mutation';
import {
  nextSortState,
  type SortState,
} from './settings-flags-runtime-record-utils';

export interface SettingsFlagsRuntimeController {
  readonly initial: PlatformConfigurationAsyncState;
  readonly breakpoint: PlatformConfigurationBreakpoint;
  readonly selectedId: string | null;
  readonly selectionUrl: string;
  readonly filter: string;
  readonly idempotencyKey: string;
  readonly mutationBusy: boolean;
  readonly statusMessage: string;
  readonly onFilterSubmit: (value: string) => void;
  readonly onFilterReset?: () => void;
  readonly onSelection: (id: string) => string;
  readonly sort?: SortState | null;
  readonly onSort?: (key: string) => void;
  readonly onMutationSubmit: React.FormEventHandler<HTMLFormElement>;
  readonly onRetry: () => void;
}

export const useSettingsFlagsRuntimeWorkbenchController = (
  props: SettingsFlagsRuntimeWorkbenchProps,
): SettingsFlagsRuntimeController => {
  const [initial, setInitial] = React.useState<PlatformConfigurationAsyncState>(
    props.initial,
  );
  const breakpoint = React.useSyncExternalStore(
    subscribeToBreakpoint,
    getBreakpoint,
    (): PlatformConfigurationBreakpoint => 'desktop',
  );
  const [filter, setFilter] = React.useState(() =>
    String(props.query.query ?? ''),
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => props.selectedId ?? selectedFromUrl() ?? null,
  );
  const [sort, setSort] = React.useState(
    () => parseSettingsRuntimeSort(props.query.sort) ?? sortFromUrl(),
  );
  const [mutationBusy, setMutationBusy] = React.useState(false);
  const mutationBusyRef = React.useRef(false);
  const lastMutationAtRef = React.useRef(0);
  const preimageRef = React.useRef<readonly PlatformConfigurationRecord[]>(
    initial.data ?? [],
  );
  const idempotencyKey = React.useMemo(
    () =>
      `settings-flags-runtime-${selectedId ?? 'new'}-${normalizedVersion(props.expectedVersion) ?? '0'}`,
    [props.expectedVersion, selectedId],
  );
  const refetchCanonical = React.useCallback(
    (reason: CanonicalRefetchReason): Promise<void> =>
      refetchCanonicalData({ initial, setInitial, props }, reason),
    [initial, props],
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    let changed = false;
    if (
      props.query.tab === 'settings' &&
      url.searchParams.get('tab') !== 'settings'
    ) {
      url.searchParams.set('tab', 'settings');
      changed = true;
    }
    const rawSort = url.searchParams.get('sort');
    if (rawSort !== null && parseSettingsRuntimeSort(rawSort) === null) {
      url.searchParams.delete('sort');
      changed = true;
    }
    if (changed)
      window.history.replaceState(
        {},
        '',
        `${url.pathname}${url.search}${url.hash}`,
      );
  }, [props.query]);

  React.useEffect(() => {
    const root = document.querySelector<HTMLElement>(
      '[data-workbench="settings-flags-runtime"]',
    );
    root?.setAttribute('data-hydrated', 'true');
  }, []);

  React.useEffect(() => {
    const onPopState = (): void => {
      setFilter(queryValue('query'));
      setSelectedId(selectedFromUrl());
      setSort(sortFromUrl());
    };
    window.addEventListener('popstate', onPopState);
    const channel =
      typeof BroadcastChannel === 'undefined'
        ? null
        : new BroadcastChannel('wejammin-platform-configuration');
    const onMessage = (): void => {
      void refetchCanonical('realtime-hint');
    };
    channel?.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('popstate', onPopState);
      channel?.removeEventListener('message', onMessage);
      channel?.close();
    };
  }, [refetchCanonical]);

  const selectionUrl = React.useMemo(() => {
    return settingsRuntimeUrl(
      props.canonicalUrl,
      props.query,
      filter,
      selectedId,
      sort,
    );
  }, [filter, props.canonicalUrl, props.query, selectedId, sort]);

  const pushUrl = React.useCallback(
    (
      nextFilter: string,
      nextSelectedId: string | null,
      nextSort: SortState | null,
    ): string => {
      const url = settingsRuntimeUrl(
        props.canonicalUrl,
        props.query,
        nextFilter,
        nextSelectedId,
        nextSort,
      );
      if (typeof window !== 'undefined') window.history.pushState({}, '', url);
      return url;
    },
    [props.canonicalUrl, props.query],
  );

  const onSelection = React.useCallback(
    (id: string): string => {
      setSelectedId(id);
      return pushUrl(filter, id, sort);
    },
    [filter, pushUrl, sort],
  );

  const onFilterSubmit = React.useCallback(
    (value: string): void => {
      const next = value.trim();
      setFilter(next);
      pushUrl(next, selectedId, sort);
    },
    [pushUrl, selectedId, sort],
  );

  const onFilterReset = React.useCallback((): void => {
    setFilter('');
    setSelectedId(null);
    pushUrl('', null, sort);
  }, [pushUrl, sort]);

  const onSort = React.useCallback(
    (key: string): void => {
      const next = nextSortState(sort ?? null, key);
      setSort(next);
      pushUrl(filter, selectedId, next);
    },
    [filter, pushUrl, selectedId, sort],
  );

  const onMutationSubmit = React.useCallback<
    React.FormEventHandler<HTMLFormElement>
  >(
    (event) =>
      submitConfigurationMutation({
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
      }),
    [idempotencyKey, initial, props, refetchCanonical],
  );

  const onRetry = (): void => {
    setInitial((current) => ({
      ...current,
      status: 'loading',
      startedAt: new Date().toISOString(),
      preserveSafePriorContent: true,
    }));
    void refetchCanonical('reconnect');
  };

  return {
    initial,
    breakpoint,
    selectedId,
    selectionUrl,
    filter,
    idempotencyKey,
    mutationBusy,
    statusMessage:
      initial.status === 'success' ? 'Canonical configuration loaded.' : '',
    onFilterSubmit,
    onFilterReset,
    onSelection,
    sort,
    onSort,
    onMutationSubmit,
    onRetry,
  };
};
