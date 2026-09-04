import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  CreateOrganizationRequestSchema,
  type RelationshipOperationId,
} from '@wejammin/contracts';

import {
  ORIGIN,
  REQUEST_ID,
  bindings,
} from '../authentication/phase-02-slice-02.test-fixtures';
import {
  createApp,
  success,
} from '../authentication/phase-02-slice-02.test-support';
import { callRelationshipPort } from './relationship-handler-runtime';
import {
  parseRelationshipJsonBody,
  relationshipPolicy,
} from './relationship-handler-support';

const ORGANIZATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

afterEach(() => {
  vi.useRealTimers();
});

describe('Phase 2 Slice 04 relationship runtime failure mapping', () => {
  it('[P2-S04-AC-007,013,019,025,031,037,043,049,055,061] preserves a typed domain failure thrown by an adapter', async () => {
    const domainFailure = {
      ok: false as const,
      status: 409 as const,
      code: 'ORGANIZATION_VERSION_CONFLICT',
      message: 'The organization version changed.',
      details: { recoveryAction: 'refetch_and_retry' },
    };

    await expect(
      callRelationshipPort('TYPE-01', async () =>
        Promise.reject(domainFailure),
      ),
    ).resolves.toEqual(domainFailure);
  });

  it('[P2-S04-AC-007,013,019,025,031,037,043,049,055,061] conceals an unexpected adapter exception as dependency unavailable', async () => {
    const result = await callRelationshipPort('MEM-01', async () =>
      Promise.reject(new Error('private database topology')),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
    });
    expect(JSON.stringify(result)).not.toContain('private database topology');
  });

  it('[P2-S04-AC-007,013,019,025,031,037,043,049,055,061] maps adapter aborts to the typed timeout boundary', async () => {
    const result = await callRelationshipPort('MEM-03', async () =>
      Promise.reject(new DOMException('deadline', 'AbortError')),
    );

    expect(result).toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('[P2-S04-AC-006,012,018,024,030,036,042,048,054,060] aborts a hung adapter at the registered operation deadline', async () => {
    vi.useFakeTimers();
    const operationId = 'ORG-01' as const;
    const pending = callRelationshipPort(
      operationId,
      (signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );

    await vi.advanceTimersByTimeAsync(
      relationshipPolicy(operationId).timeoutMs,
    );
    await expect(pending).resolves.toMatchObject({
      ok: false,
      status: 504,
      code: 'DEPENDENCY_TIMEOUT',
    });
  });

  it('[P2-S04-AC-001,002] fails closed for an operation without a locked route policy', () => {
    expect(() =>
      relationshipPolicy('UNREGISTERED' as RelationshipOperationId),
    ).toThrow('Missing relationship policy UNREGISTERED');
  });

  it('[P2-S04-AC-004] normalizes malformed JSON to the stable relationship request error', async () => {
    const parsed = await parseRelationshipJsonBody(
      new Request(`${ORIGIN}/api/v1/organizations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
      CreateOrganizationRequestSchema,
    );

    expect(parsed).toMatchObject({
      ok: false,
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'The request contains an invalid value.',
    });
  });

  it('[P2-S04-AC-009,013] rejects a malformed public projection from persistence', async () => {
    const { app, identity } = createApp();
    (identity as unknown as Record<string, unknown>).readOrganization = vi.fn(
      async () =>
        success({ organizationId: ORGANIZATION_ID, privateData: true }),
    );
    const response = await app.fetch(
      new Request(`${ORIGIN}/api/v1/organizations/${ORGANIZATION_ID}`, {
        headers: {
          accept: 'application/json',
          origin: ORIGIN,
          'x-request-id': REQUEST_ID,
        },
      }),
      bindings,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: 'DEPENDENCY_INVALID_RESPONSE',
      requestId: REQUEST_ID,
    });
  });
});
