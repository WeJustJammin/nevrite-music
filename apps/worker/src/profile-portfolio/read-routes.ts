import {
  EmphasisGetQuerySchema,
  PortfolioListQuerySchema,
  PublicProfilePathSchema,
  PublicProfileQuerySchema,
  ReelListQuerySchema,
  SectionRevisionListQuerySchema,
  SectionRevisionPathSchema,
} from '@wejammin/contracts';

import type { WorkerApp } from '../index';
import type { ProfilePortfolioRouteRuntime } from './route-runtime';
import { usePath } from './route-registration';

export const registerProfilePortfolioReadRoutes = (
  app: WorkerApp,
  runtime: ProfilePortfolioRouteRuntime,
): void => {
  app.get('/api/v1/profiles/:partyId', async (context) =>
    usePath(
      context,
      'PRF-PROF-01',
      PublicProfilePathSchema,
      { partyId: context.req.param('partyId') },
      (path) =>
        runtime.read(
          context,
          'PRF-PROF-01',
          'readPublicProfile',
          path,
          PublicProfileQuerySchema,
          ['locale'],
          { locale: 'en' },
          false,
        ),
    ),
  );

  app.get(
    '/api/v1/profiles/:partyId/sections/:sectionCode/revisions',
    async (context) =>
      usePath(
        context,
        'PRF-PROF-02',
        SectionRevisionPathSchema,
        {
          partyId: context.req.param('partyId'),
          sectionCode: context.req.param('sectionCode'),
        },
        (path) =>
          runtime.read(
            context,
            'PRF-PROF-02',
            'readSectionRevisions',
            path,
            SectionRevisionListQuerySchema,
            ['cursor', 'limit'],
            { limit: '25' },
            true,
          ),
      ),
  );

  app.get('/api/v1/profiles/:partyId/portfolio', async (context) =>
    usePath(
      context,
      'PRF-PROF-05',
      PublicProfilePathSchema,
      { partyId: context.req.param('partyId') },
      (path) =>
        runtime.read(
          context,
          'PRF-PROF-05',
          'readPortfolio',
          path,
          PortfolioListQuerySchema,
          ['cursor', 'limit', 'roleCode', 'from', 'to'],
          { limit: '25' },
          false,
        ),
    ),
  );

  app.get('/api/v1/profiles/:partyId/reel', async (context) =>
    usePath(
      context,
      'PRF-PROF-06',
      PublicProfilePathSchema,
      { partyId: context.req.param('partyId') },
      (path) =>
        runtime.read(
          context,
          'PRF-PROF-06',
          'readReel',
          path,
          ReelListQuerySchema,
          ['cursor', 'limit', 'includeInactive'],
          { limit: '25' },
          false,
        ),
    ),
  );

  app.get('/api/v1/profiles/:partyId/emphasis', async (context) =>
    usePath(
      context,
      'PRF-PROF-11',
      PublicProfilePathSchema,
      { partyId: context.req.param('partyId') },
      (path) =>
        runtime.read(
          context,
          'PRF-PROF-11',
          'readEmphasis',
          path,
          EmphasisGetQuerySchema,
          ['surface'],
          {},
          true,
        ),
    ),
  );
};
