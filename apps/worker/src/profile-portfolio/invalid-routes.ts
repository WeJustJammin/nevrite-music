import type { WorkerApp } from '../index';
import { authError, responseForAuthError } from '../authentication/boundary';
import {
  configureProfilePortfolioRoute,
  parseProfilePath,
} from './route-support';
import { ReelItemPathSchema } from './route-registration';

export const registerProfilePortfolioInvalidRoutes = (app: WorkerApp): void => {
  app.get('/api/v1/profiles/:partyId/:invalidSegment', (context) => {
    configureProfilePortfolioRoute(context, 'PRF-PROF-01');
    return responseForAuthError(
      context,
      authError(422, 'VALIDATION_FAILED', 'Check the highlighted fields.', {
        violations: [
          {
            path: '/path',
            code: 'route_invalid',
            message: 'The value is invalid.',
          },
        ],
      }),
    );
  });

  app.get('/api/v1/reel-items/:reelItemId', (context) => {
    configureProfilePortfolioRoute(context, 'PRF-PROF-08');
    const parsed = parseProfilePath(ReelItemPathSchema, {
      reelItemId: context.req.param('reelItemId'),
    });
    return parsed.ok
      ? responseForAuthError(
          context,
          authError(404, 'NOT_FOUND', 'The requested resource was not found.'),
        )
      : responseForAuthError(context, parsed);
  });
};
