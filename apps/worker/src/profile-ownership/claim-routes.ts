import {
  ChallengeRequestSchema,
  ClaimCreateRequestSchema,
  ClaimPathSchema,
  ConversionRequestSchema,
  ProofRequestSchema,
} from '@wejammin/contracts';

import type { WorkerApp } from '../index';
import { responseForAuthError } from '../authentication/boundary';
import { configureProfileRoute, parseProfilePath } from './route-support';
import type { ProfileRouteRuntime } from './route-runtime';

export const registerProfileClaimRoutes = (
  app: WorkerApp,
  runtime: ProfileRouteRuntime,
): void => {
  app.post('/api/v1/party-claims', async (context) => {
    configureProfileRoute(context, 'PRF-API-04');
    return runtime.command(
      context,
      'PRF-API-04',
      'startClaim',
      ClaimCreateRequestSchema,
      'session',
      true,
    );
  });
  app.get('/api/v1/party-claims/:claimId', async (context) => {
    configureProfileRoute(context, 'PRF-API-05');
    const path = parseProfilePath(ClaimPathSchema, {
      claimId: context.req.param('claimId'),
    });
    if (!path.ok) return responseForAuthError(context, path);
    return runtime.read(context, 'PRF-API-05', 'readClaim', path.value);
  });
  app.post('/api/v1/party-claims/:claimId/challenges', async (context) => {
    configureProfileRoute(context, 'PRF-API-06');
    const path = parseProfilePath(ClaimPathSchema, {
      claimId: context.req.param('claimId'),
    });
    if (!path.ok) return responseForAuthError(context, path);
    return runtime.command(
      context,
      'PRF-API-06',
      'issueClaimChallenge',
      ChallengeRequestSchema,
      'session',
      true,
      path.value,
    );
  });
  app.post('/api/v1/party-claims/:claimId/proofs', async (context) => {
    configureProfileRoute(context, 'PRF-API-07');
    const path = parseProfilePath(ClaimPathSchema, {
      claimId: context.req.param('claimId'),
    });
    if (!path.ok) return responseForAuthError(context, path);
    return runtime.command(
      context,
      'PRF-API-07',
      'completeClaimProof',
      ProofRequestSchema,
      'session_step_up',
      true,
      path.value,
    );
  });
  app.post('/api/v1/party-claims/:claimId/convert', async (context) => {
    configureProfileRoute(context, 'PRF-API-08');
    const path = parseProfilePath(ClaimPathSchema, {
      claimId: context.req.param('claimId'),
    });
    if (!path.ok) return responseForAuthError(context, path);
    return runtime.command(
      context,
      'PRF-API-08',
      'convertClaim',
      ConversionRequestSchema,
      'session_step_up',
      true,
      path.value,
    );
  });
};
