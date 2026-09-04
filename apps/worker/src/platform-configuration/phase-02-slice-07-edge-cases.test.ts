import { describe, expect, it, vi } from 'vitest';

import type { ConfigurationPort } from './types';
import {
  action,
  actionRequest,
  definitionRequest,
  effectiveQuery,
  effectiveRequest,
  expectError,
  later,
  makeHarness,
  otherId,
  proposalRequest,
  releaseRequest,
} from './phase-02-slice-07.test-support';

describe('Phase 2 Slice 07 Worker route behavioral acceptance', () => {
  const edgeCases = [
    {
      criterion: 'P2-S07-AC-063',
      makeRequest: () =>
        releaseRequest({
          ...definitionRequest,
          key: 'undefined.admin.minted.key',
        }),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'PROTECTED_SETTING',
        message: 'The setting is protected.',
      },
    },
    {
      criterion: 'P2-S07-AC-064',
      makeRequest: () =>
        effectiveRequest(`${effectiveQuery}&siteId=${otherId}`),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'DISALLOWED_CONTEXT',
        message: 'The request context is not allowed.',
      },
    },
    {
      criterion: 'P2-S07-AC-065',
      makeRequest: effectiveRequest,
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'VALUE_INVALID',
        message: 'The setting value is invalid.',
      },
    },
    {
      criterion: 'P2-S07-AC-066',
      makeRequest: () =>
        effectiveRequest(
          '/api/v1/config/profile.visibility/effective?consumerKey=old.client&supportedDefinitionVersions=1',
        ),
      error: {
        ok: false as const,
        status: 409 as const,
        code: 'STALE_DEFINITION',
        message: 'The definition changed; reload and try again.',
      },
    },
    {
      criterion: 'P2-S07-AC-067',
      makeRequest: actionRequest,
      error: {
        ok: false as const,
        status: 409 as const,
        code: 'VERSION_CONFLICT',
        message: 'The configuration changed; reload and try again.',
      },
    },
    {
      criterion: 'P2-S07-AC-068',
      makeRequest: actionRequest,
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'VALUE_UNAVAILABLE',
        message: 'The effective value is temporarily unavailable.',
      },
    },
    {
      criterion: 'P2-S07-AC-069',
      makeRequest: () =>
        actionRequest({ ...action, action: 'schedule', scheduledFor: later }),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'APPROVAL_INVALID',
        message: 'The approval requirements were not met.',
      },
    },
    {
      criterion: 'P2-S07-AC-070',
      makeRequest: actionRequest,
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'SNAPSHOT_UNAVAILABLE',
        message: 'The runtime snapshot is not available.',
      },
    },
    {
      criterion: 'P2-S07-AC-071',
      makeRequest: effectiveRequest,
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'VALUE_UNAVAILABLE',
        message: 'The effective value is temporarily unavailable.',
      },
    },
    {
      criterion: 'P2-S07-AC-072',
      makeRequest: effectiveRequest,
      error: {
        ok: false as const,
        status: 403 as const,
        code: 'FORBIDDEN',
        message: 'The action is not allowed.',
      },
    },
    {
      criterion: 'P2-S07-AC-073',
      makeRequest: proposalRequest,
      error: {
        ok: false as const,
        status: 409 as const,
        code: 'VERSION_CONFLICT',
        message: 'The configuration changed; reload and try again.',
      },
    },
    {
      criterion: 'P2-S07-AC-074',
      makeRequest: actionRequest,
      error: {
        ok: false as const,
        status: 403 as const,
        code: 'FORBIDDEN',
        message: 'The action is not allowed.',
      },
    },
    {
      criterion: 'P2-S07-AC-075',
      makeRequest: effectiveRequest,
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'VALUE_UNAVAILABLE',
        message: 'The effective value is temporarily unavailable.',
      },
    },
    {
      criterion: 'P2-S07-AC-076',
      makeRequest: () =>
        releaseRequest({ ...definitionRequest, key: 'ownership.authority' }),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'PROTECTED_SETTING',
        message: 'The setting is protected.',
      },
    },
    {
      criterion: 'P2-S07-AC-077',
      makeRequest: () =>
        effectiveRequest(
          '/api/v1/config/export.protected/effective?consumerKey=web.profile&supportedDefinitionVersions=1',
        ),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'PROTECTED_SETTING',
        message: 'The setting is protected.',
      },
    },
    {
      criterion: 'P2-S07-AC-078',
      makeRequest: () =>
        actionRequest({ ...action, action: 'rollback', rollbackValue: false }),
      error: {
        ok: false as const,
        status: 503 as const,
        code: 'SNAPSHOT_UNAVAILABLE',
        message: 'The runtime snapshot is not available.',
      },
    },
    {
      criterion: 'P2-S07-AC-079',
      makeRequest: () =>
        actionRequest({ ...action, action: 'schedule', scheduledFor: later }),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'APPROVAL_INVALID',
        message: 'The approval requirements were not met.',
      },
    },
    {
      criterion: 'P2-S07-AC-080',
      makeRequest: () =>
        actionRequest({ ...action, action: 'rollback', rollbackValue: false }),
      error: {
        ok: false as const,
        status: 422 as const,
        code: 'VALUE_INVALID',
        message: 'The setting value is invalid.',
      },
    },
  ] as const;

  it.each(edgeCases)(
    '[$criterion] returns the typed edge outcome from the real route and preserves the no-fabricated-success boundary',
    async ({ makeRequest, error }) => {
      const port = vi.fn<ConfigurationPort>(async () => error);
      const harness = makeHarness({ port });

      const response = await harness.app.request(makeRequest());

      await expectError(response, error.status, error.code, error.message);
      expect(port).toHaveBeenCalledOnce();
    },
  );
});
