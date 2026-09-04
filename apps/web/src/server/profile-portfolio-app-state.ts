import type { ProfilePortfolioAsyncState } from '../components/profile-portfolio/profile-portfolio-workbench-types';
import type {
  ProfilePortfolioPageResult,
  ProfilePortfolioPageState,
} from './profile-portfolio-context';

export const PROFILE_PORTFOLIO_CONTRACT_FIELDS = {
  source: '02b-profile-portfolio-epk.md',
  fields: {
    PublicProfileResponse: ['partyId', 'projectionVersion', 'layers'],
    PortfolioListResponse: ['creditRef', 'rightsBasis', 'roleCodes'],
    ReelListResponse: ['mediaRef', 'rightsState', 'listingState'],
  },
} as const;

export const profilePortfolioRecord = (
  partyId: string,
  page: ProfilePortfolioPageState | null,
) => {
  if (page === null || page.projection === null) return null;
  const projection = page.projection;
  const version = page.projectionVersion ?? '1';
  return {
    id: partyId,
    version,
    state: 'active',
    provenance: [
      {
        source: 'profile-publication',
        evidence: 'server-authorized-projection',
        at: page.lastVerifiedAt ?? new Date().toISOString(),
        visibility: 'authorized',
      },
    ],
    projection,
  } as const;
};

export const profilePortfolioInitial = (
  pageResult: ProfilePortfolioPageResult | null,
  page: ProfilePortfolioPageState | null,
  record: ReturnType<typeof profilePortfolioRecord>,
): ProfilePortfolioAsyncState => {
  const degraded = page?.state === 'degraded';
  const version = page?.projectionVersion ?? record?.version;
  return {
    status:
      pageResult?.kind !== 'ready'
        ? 'disabled'
        : degraded
          ? 'degraded'
          : record === null
            ? 'empty'
            : 'success',
    ...(record === null ? { data: [] } : { data: [record] }),
    ...(version === undefined || version === null ? {} : { version }),
    stale: degraded,
    ...(page?.lastVerifiedAt === null || page === null
      ? {}
      : { lastVerifiedAt: page.lastVerifiedAt }),
    ...(degraded
      ? {
          error: {
            code: 'DEPENDENCY_UNAVAILABLE',
            message: 'Profile portfolio data is temporarily unavailable.',
            requestId: page?.requestId ?? 'profile-portfolio-degraded',
          },
          retryable: true,
        }
      : {}),
  };
};

export const profilePortfolioVariant = (
  pageResult: ProfilePortfolioPageResult | null,
): 'ownerFull' | 'disabledPrerequisite' =>
  pageResult?.kind === 'ready' ? 'ownerFull' : 'disabledPrerequisite';
