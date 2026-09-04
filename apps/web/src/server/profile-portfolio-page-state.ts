import type { ProfilePortfolioPageState } from './profile-portfolio-context.ts';
import {
  projectionGeneratedAt,
  projectionVersion,
  type ProfilePortfolioProjection,
} from './profile-portfolio-projection.ts';

const etagVersion = (response: Response): string | null => {
  const value = response.headers.get('etag');
  if (value === null) return null;
  const match = /^"([1-9][0-9]{0,18})"$/u.exec(value);
  return match?.[1] ?? null;
};

export const emptyProfilePortfolioPage = (input: {
  requestId: string;
  actorId: string | null;
  actingPartyId: string | null;
  csrfToken: string;
  state: 'forbidden' | 'degraded';
}): ProfilePortfolioPageState => ({
  state: input.state,
  actorId: input.actorId,
  actingPartyId: input.actingPartyId,
  capabilitySnapshot: [],
  access: 'disabled',
  csrfToken: input.csrfToken,
  requestId: input.requestId,
  projection: null,
  projectionVersion: null,
  etag: null,
  lastVerifiedAt: null,
});

export const degradedProfilePortfolioPage = (input: {
  requestId: string;
  actorId: string | null;
  actingPartyId: string | null;
}): ProfilePortfolioPageState =>
  emptyProfilePortfolioPage({ ...input, state: 'degraded', csrfToken: '' });

export const readyProfilePortfolioPage = (input: {
  requestId: string;
  actorId: string | null;
  actingPartyId: string | null;
  csrfToken: string;
  access: 'read-only' | 'full';
  projection: ProfilePortfolioProjection;
  response: Response;
}): ProfilePortfolioPageState => {
  const version = projectionVersion(
    input.projection,
    etagVersion(input.response),
  );
  return {
    state: 'ready',
    actorId: input.actorId,
    actingPartyId: input.actingPartyId,
    capabilitySnapshot: [],
    access: input.access,
    csrfToken: input.csrfToken,
    requestId: input.requestId,
    projection: input.projection,
    projectionVersion: version,
    etag: input.response.headers.get('etag'),
    lastVerifiedAt: projectionGeneratedAt(input.projection),
  };
};
