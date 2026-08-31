import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  parseInfrastructureQuery,
  serializeInfrastructureQuery,
} from '@wejammin/ui/infrastructure/navigation';
import type { InfrastructureNavigationQuery } from '@wejammin/ui/infrastructure/navigation';
import type { InfrastructureRecord } from '@wejammin/ui/infrastructure/presentation';
import {
  CHANNEL_NAME,
  isInvalidationMessage,
  parseContractState,
  queryFromRecord,
  recordsForState,
  toQueryRecord,
  type RefetchReason,
} from './infrastructure-workbench-state';
import type {
  InfrastructureWorkbenchController,
  UseInfrastructureWorkbenchInput,
} from './useInfrastructureWorkbench-types';

export type {
  InfrastructureWorkbenchController,
  ProtectedCommandInput,
  UseInfrastructureWorkbenchInput,
} from './useInfrastructureWorkbench-types';

export const selectInfrastructureRecord = (
  records: readonly InfrastructureRecord[],
  selectedId: string | null,
): InfrastructureRecord | null =>
  selectedId === null
    ? null
    : (records.find((record) => record.id === selectedId) ?? null);

export function useInfrastructureWorkbench({
  initial,
  query,
  initialSelectedId,
  canonicalUrl,
  expectedVersion,
  onCanonicalRefetch,
  onProtectedCommand,
}: UseInfrastructureWorkbenchInput): InfrastructureWorkbenchController {
  const initialQuery = useMemo(() => queryFromRecord(query), [query]);
  const parsedInitial = parseContractState(initial);
  const [queryState, setQueryState] =
    useState<InfrastructureNavigationQuery>(initialQuery);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId,
  );
  const [liveStatus, setLiveStatus] = useState<
    InfrastructureWorkbenchController['liveStatus']
  >(
    parsedInitial.success && parsedInitial.data.status === 'degraded'
      ? 'offline'
      : 'idle',
  );
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const archiveTrigger = useRef<HTMLButtonElement | null>(null);
  const confirmationHeading = useRef<HTMLHeadingElement | null>(null);
  const refetchInFlight = useRef(false);
  const queuedRefetchReason = useRef<RefetchReason | null>(null);

  const records = useMemo(() => {
    const source = recordsForState(initial);
    const search = queryState.q?.toLocaleLowerCase() ?? '';
    if (search.length === 0) return source;
    return source.filter(
      (record) =>
        record.label.toLocaleLowerCase().includes(search) ||
        record.summary.toLocaleLowerCase().includes(search),
    );
  }, [initial, queryState.q]);

  const selectedRecord = useMemo(
    () => selectInfrastructureRecord(records, selectedId),
    [records, selectedId],
  );

  const updateUrl = useCallback(
    (
      nextQuery: Readonly<Record<string, string>>,
      mode: 'push' | 'replace' = 'push',
    ): void => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const serialized = serializeInfrastructureQuery(
        parseInfrastructureQuery(
          new URLSearchParams(Object.entries(nextQuery)),
        ),
      );
      url.search = serialized;
      if (mode === 'replace') {
        window.history.replaceState({}, '', url);
      } else {
        window.history.pushState({}, '', url);
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sync = (): void => {
      const nextQuery = parseInfrastructureQuery(window.location.href);
      setQueryState(nextQuery);
      setSelectedId(nextQuery.selected ?? null);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const requestRefetch = useCallback(
    async (reason: RefetchReason): Promise<void> => {
      if (refetchInFlight.current) {
        queuedRefetchReason.current = reason;
        return;
      }
      refetchInFlight.current = true;
      setLiveStatus('loading');
      try {
        if (onCanonicalRefetch !== undefined) {
          await onCanonicalRefetch(reason);
          setLiveStatus('idle');
        } else if (typeof window !== 'undefined') {
          window.location.reload();
        }
      } catch {
        setLiveStatus('failed');
      } finally {
        refetchInFlight.current = false;
        const queuedReason = queuedRefetchReason.current;
        queuedRefetchReason.current = null;
        if (queuedReason !== null) void requestRefetch(queuedReason);
      }
    },
    [onCanonicalRefetch],
  );

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof BroadcastChannel === 'undefined'
    )
      return undefined;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const onMessage = (event: MessageEvent<unknown>): void => {
      if (!isInvalidationMessage(event.data, selectedRecord?.id ?? null))
        return;
      setLiveStatus('stale');
      void requestRefetch('realtime-hint');
    };
    channel.addEventListener('message', onMessage);
    return () => {
      channel.removeEventListener('message', onMessage);
      channel.close();
    };
  }, [requestRefetch, selectedRecord?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onOnline = (): void => {
      setLiveStatus('idle');
      void requestRefetch('reconnect');
    };
    const onOffline = (): void => setLiveStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [requestRefetch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || (selectedId === null && !showConfirmation))
        return;
      event.preventDefault();
      if (showConfirmation) {
        setShowConfirmation(false);
        return;
      }
      setSelectedId(null);
      const nextQuery = toQueryRecord(queryState);
      delete nextQuery.selected;
      updateUrl(nextQuery, 'replace');
      document.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    };
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [queryState, selectedId, showConfirmation, updateUrl]);

  useEffect(() => {
    if (showConfirmation) confirmationHeading.current?.focus();
    else archiveTrigger.current?.focus();
  }, [showConfirmation]);

  const applyFilters = (): void => {
    const nextQuery: Record<string, string> = {};
    if (queryState.q !== undefined && queryState.q.trim().length > 0)
      nextQuery.q = queryState.q.trim();
    if (queryState.sort !== undefined) nextQuery.sort = queryState.sort;
    if (queryState.filter !== undefined) nextQuery.filter = queryState.filter;
    updateUrl(nextQuery);
    void requestRefetch('navigation');
  };

  const resetFilters = (): void => {
    setQueryState({});
    updateUrl({}, 'replace');
    void requestRefetch('navigation');
  };

  const sortByLabel = (): void => {
    const sort: NonNullable<InfrastructureNavigationQuery['sort']> =
      queryState.sort === 'label_asc' ? 'modified_desc' : 'label_asc';
    const nextQuery = { ...queryState, sort };
    setQueryState(nextQuery);
    updateUrl(toQueryRecord(nextQuery));
  };

  const hrefForRecord = (recordId: string): string => {
    const url = new URL(canonicalUrl, 'https://wejamm.in');
    const nextQuery = toQueryRecord(queryState);
    nextQuery.selected = recordId;
    const serialized = serializeInfrastructureQuery(
      parseInfrastructureQuery(new URLSearchParams(Object.entries(nextQuery))),
    );
    return `${url.pathname}${serialized.length > 0 ? `?${serialized}` : ''}`;
  };

  const onArchiveReview = (): void => setShowConfirmation(true);
  const onArchiveConfirm = (): void => {
    if (onProtectedCommand === undefined || selectedRecord === null) {
      setShowConfirmation(false);
      setLiveStatus('failed');
      return;
    }
    setShowConfirmation(false);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLiveStatus('offline');
      return;
    }
    setLiveStatus('pending');
    void onProtectedCommand({
      recordId: selectedRecord.id,
      expectedVersion: expectedVersion ?? selectedRecord.version,
      file: selectedFile,
    }).then(
      () => requestRefetch('mutation'),
      () => setLiveStatus('failed'),
    );
  };
  const onArchiveCancel = (): void => setShowConfirmation(false);
  const onFileChange = (file: File | undefined): void =>
    setSelectedFile(file ?? null);
  const activeFilters = [
    queryState.q === undefined ? null : `Search: ${queryState.q}`,
    queryState.sort === undefined ? null : `Sort: ${queryState.sort}`,
    queryState.filter === undefined ? null : `Filter: ${queryState.filter}`,
  ].filter((value): value is string => value !== null);

  return {
    queryState,
    setQueryState,
    selectedId,
    setSelectedId,
    records,
    selectedRecord,
    liveStatus,
    commandAvailable: onProtectedCommand !== undefined,
    showConfirmation,
    setShowConfirmation,
    selectedFileName: selectedFile?.name ?? null,
    requestRefetch,
    hrefForRecord,
    applyFilters,
    resetFilters,
    sortByLabel,
    onArchiveReview,
    onArchiveConfirm,
    onArchiveCancel,
    onFileChange,
    activeFilters,
    archiveTrigger,
    confirmationHeading,
  };
}

export default useInfrastructureWorkbench;
