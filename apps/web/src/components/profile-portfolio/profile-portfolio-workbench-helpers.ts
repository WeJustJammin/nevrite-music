import {
  profilePortfolioDisplayName,
  profilePortfolioHeadline,
  profilePortfolioLayers,
  type ProfilePortfolioLayerView,
} from '../../server/profile-portfolio-ssr.ts';
import {
  sanitizeProfilePortfolioValue,
  type ProfilePortfolioProjection,
} from '../../server/profile-portfolio-projection.ts';

import type {
  ProfilePortfolioAsyncState,
  ProfilePortfolioError,
} from './profile-portfolio-workbench-types';

export type ProfilePortfolioFactView = Readonly<{
  id: string;
  title: string | null;
  creditRef: string | null;
  rightsBasis: string | null;
  rightsState: string | null;
  roleCodes: readonly string[];
  provenanceState: string | null;
  mediaState: string | null;
  hasCaptions: boolean;
  hasTranscript: boolean;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const safeText = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null;
  if (/^(?:javascript:|data:|https?:\/\/)/iu.test(value)) return null;
  return value;
};

const stringList = (value: unknown): readonly string[] =>
  Array.isArray(value)
    ? value
        .map(safeText)
        .filter((item): item is string => item !== null)
        .slice(0, 20)
    : [];

const safeProjection = (value: unknown): ProfilePortfolioProjection | null => {
  const clean = sanitizeProfilePortfolioValue(value);
  return isRecord(clean) ? clean : null;
};

export const firstProfilePortfolioProjection = (
  state: ProfilePortfolioAsyncState,
): ProfilePortfolioProjection | null =>
  safeProjection(state.data?.[0]?.projection);

const fact = (
  value: unknown,
  index: number,
): ProfilePortfolioFactView | null => {
  if (!isRecord(value)) return null;
  const id = safeText(value.id) ?? `item-${index + 1}`;
  return {
    id,
    title: safeText(value.title) ?? safeText(value.name),
    creditRef: safeText(value.creditRef),
    rightsBasis: safeText(value.rightsBasis),
    rightsState: safeText(value.rightsState),
    roleCodes: stringList(value.roleCodes),
    provenanceState: safeText(value.provenanceState),
    mediaState: safeText(value.mediaState),
    hasCaptions: safeText(value.captions) !== null,
    hasTranscript: safeText(value.transcript) !== null,
  };
};

export const profilePortfolioFacts = (
  projection: ProfilePortfolioProjection | null,
  key: 'portfolio' | 'reel',
): readonly ProfilePortfolioFactView[] => {
  if (projection === null || !Array.isArray(projection[key])) return [];
  return projection[key]
    .map((value, index) => fact(value, index))
    .filter((item): item is ProfilePortfolioFactView => item !== null)
    .slice(0, 50);
};

export const profilePortfolioLayerViews = (
  projection: ProfilePortfolioProjection | null,
): readonly ProfilePortfolioLayerView[] => profilePortfolioLayers(projection);

export const profilePortfolioName = (
  projection: ProfilePortfolioProjection | null,
): string => {
  if (projection === null) return 'Public profile';
  return safeText(profilePortfolioDisplayName(projection)) ?? 'Public profile';
};

export const profilePortfolioTagline = (
  projection: ProfilePortfolioProjection | null,
): string | null =>
  projection === null ? null : safeText(profilePortfolioHeadline(projection));

export const profilePortfolioPartyId = (
  projection: ProfilePortfolioProjection | null,
): string => (projection === null ? '' : (safeText(projection.partyId) ?? ''));

export const profilePortfolioVersion = (
  state: ProfilePortfolioAsyncState,
  expectedVersion: string | null,
): string => {
  const source =
    expectedVersion ?? state.version ?? state.data?.[0]?.version ?? '';
  return source.replace(/^"|"$/gu, '');
};

export const profilePortfolioSelectionUrl = (
  query: Readonly<Record<string, string | null | undefined>>,
  selectedId: string | null,
): string => {
  const params = new URLSearchParams();
  const tab = safeText(query.tab) ?? 'profile';
  params.set('tab', tab);
  const filter = safeText(query.filter);
  if (filter !== null) params.set('filter', filter);
  if (selectedId !== null && selectedId.length > 0)
    params.set('selected', selectedId);
  return `?${params.toString()}`;
};

export const profilePortfolioStatusMessage = (
  state: ProfilePortfolioAsyncState,
): string => {
  if (state.status === 'error' || state.status === 'optimistic-rollback')
    return safeText(state.error?.message) ?? 'Review the highlighted request.';
  if (state.status === 'degraded')
    return 'Current data is temporarily unavailable. Last verified data is shown when safe.';
  if (state.status === 'loading') return 'Loading profile portfolio.';
  if (state.status === 'empty')
    return 'No profile portfolio data is available.';
  if (state.status === 'disabled') return 'Profile portfolio is disabled.';
  if (state.status === 'optimistic-pending') return 'Saving profile changes.';
  return 'Profile portfolio ready.';
};

export const profilePortfolioError = (
  state: ProfilePortfolioAsyncState,
): ProfilePortfolioError | null => state.error ?? null;

export const profilePortfolioRequestId = (
  state: ProfilePortfolioAsyncState,
): string => safeText(state.error?.requestId) ?? '';
