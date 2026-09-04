import {
  ProfileFactObservationRequestSchema,
  PublicProfilePathSchema,
  ReelCreateRequestSchema,
  ReelPutRequestSchema,
  ReelRemoveRequestSchema,
  SectionPutRequestSchema,
  SectionRevisionPathSchema,
} from '@wejammin/contracts';

import type { WorkerApp } from '../index';
import type { ProfilePortfolioRouteRuntime } from './route-runtime';
import {
  emphasisBodySchema,
  ReelItemPathSchema,
  usePath,
} from './route-registration';

export const registerProfilePortfolioMutationRoutes = (
  app: WorkerApp,
  runtime: ProfilePortfolioRouteRuntime,
): void => {
  app.put('/api/v1/profiles/:partyId/sections/:sectionCode', async (context) =>
    usePath(
      context,
      'PRF-PROF-03',
      SectionRevisionPathSchema,
      {
        partyId: context.req.param('partyId'),
        sectionCode: context.req.param('sectionCode'),
      },
      (path) =>
        runtime.command(
          context,
          'PRF-PROF-03',
          'putSection',
          path,
          SectionPutRequestSchema,
          true,
        ),
    ),
  );

  app.put('/api/v1/profiles/:partyId/emphasis', async (context) =>
    usePath(
      context,
      'PRF-PROF-04',
      PublicProfilePathSchema,
      { partyId: context.req.param('partyId') },
      (path) =>
        runtime.command(
          context,
          'PRF-PROF-04',
          'putEmphasis',
          path,
          emphasisBodySchema,
          true,
        ),
    ),
  );

  app.post('/api/v1/profiles/:partyId/reel-items', async (context) =>
    usePath(
      context,
      'PRF-PROF-07',
      PublicProfilePathSchema,
      { partyId: context.req.param('partyId') },
      (path) =>
        runtime.command(
          context,
          'PRF-PROF-07',
          'createReelItem',
          path,
          ReelCreateRequestSchema,
          true,
        ),
    ),
  );

  app.put('/api/v1/reel-items/:reelItemId', async (context) =>
    usePath(
      context,
      'PRF-PROF-08',
      ReelItemPathSchema,
      { reelItemId: context.req.param('reelItemId') },
      (path) =>
        runtime.command(
          context,
          'PRF-PROF-08',
          'updateReelItem',
          path,
          ReelPutRequestSchema,
          true,
        ),
    ),
  );

  app.delete('/api/v1/reel-items/:reelItemId', async (context) =>
    usePath(
      context,
      'PRF-PROF-09',
      ReelItemPathSchema,
      { reelItemId: context.req.param('reelItemId') },
      (path) =>
        runtime.command(
          context,
          'PRF-PROF-09',
          'removeReelItem',
          path,
          ReelRemoveRequestSchema,
          true,
        ),
    ),
  );

  app.post('/internal/v1/profile-fact-observations', async (context) =>
    runtime.producer(
      context,
      'PRF-PROF-10',
      'ingestProfileFactObservation',
      ProfileFactObservationRequestSchema,
    ),
  );
};
