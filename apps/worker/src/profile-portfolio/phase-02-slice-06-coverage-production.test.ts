import { describe, expect, it, vi } from 'vitest';

import { createProductionProfilePortfolioDependencies } from './production';
import {
  PARTY_ID,
  REEL_ITEM_ID,
  bindings,
  readRequest,
  responses,
} from './phase-02-slice-06.test-support';

const signal = new AbortController().signal;
const json = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const input = (
  operationId: string,
  path: Record<string, string>,
  options: Readonly<{
    body?: Record<string, unknown>;
    query?: Record<string, unknown>;
    ifMatch?: string;
  }> = {},
) =>
  ({
    operationId,
    request: readRequest('/adapter-coverage'),
    path,
    idempotencyKey: `coverage-${operationId}`,
    ...options,
  }) as never;

describe('Phase 2 Slice 06 production adapter operation coverage', () => {
  it('maps every active read and command into its typed RPC body', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl,
    });
    const cases = [
      {
        port: 'readSectionRevisions',
        operationId: 'PRF-PROF-02',
        path: { partyId: PARTY_ID, sectionCode: 'biography' },
        query: { cursor: 'cursor-06', limit: 10 },
        response: {
          data: [],
          meta: {
            requestId: '11111111-1111-4111-8111-111111111111',
            nextCursor: null,
          },
        },
      },
      {
        port: 'putSection',
        operationId: 'PRF-PROF-03',
        path: { partyId: PARTY_ID, sectionCode: 'biography' },
        body: {
          state: 'active',
          blocks: [{ kind: 'paragraph', text: 'Coverage section.' }],
          clientReason: 'Exercise adapter',
        },
        ifMatch: '"2"',
        response: responses.section,
      },
      {
        port: 'putEmphasis',
        operationId: 'PRF-PROF-04',
        path: { partyId: PARTY_ID },
        body: { surface: 'public', defaultFilter: null, orderedRefs: [] },
        ifMatch: '"2"',
        response: responses.emphasis,
      },
      {
        port: 'readPortfolio',
        operationId: 'PRF-PROF-05',
        path: { partyId: PARTY_ID },
        query: {
          cursor: 'cursor-06',
          limit: 10,
          roleCode: 'performer',
          from: '2026-01-01',
          to: '2026-12-31',
        },
        response: responses.portfolio,
      },
      {
        port: 'readReel',
        operationId: 'PRF-PROF-06',
        path: { partyId: PARTY_ID },
        query: { cursor: 'cursor-06', limit: 10, includeInactive: 'true' },
        response: responses.reel,
      },
      {
        port: 'createReelItem',
        operationId: 'PRF-PROF-07',
        path: { partyId: PARTY_ID },
        body: {},
        response: responses.reelItem,
      },
      {
        port: 'updateReelItem',
        operationId: 'PRF-PROF-08',
        path: { reelItemId: REEL_ITEM_ID },
        body: {},
        ifMatch: '"2"',
        response: responses.reelItem,
      },
      {
        port: 'removeReelItem',
        operationId: 'PRF-PROF-09',
        path: { reelItemId: REEL_ITEM_ID },
        body: { clientReason: 'Remove coverage reel item' },
        ifMatch: '"2"',
        response: responses.reelItem,
      },
      {
        port: 'readEmphasis',
        operationId: 'PRF-PROF-11',
        path: { partyId: PARTY_ID },
        query: { surface: 'public' },
        response: responses.emphasis,
      },
    ] as const;

    for (const item of cases) {
      fetchImpl.mockResolvedValueOnce(json(item.response));
      const result = await dependencies[item.port](
        input(item.operationId, item.path, {
          ...('body' in item ? { body: item.body } : {}),
          ...('query' in item ? { query: item.query } : {}),
          ...('ifMatch' in item ? { ifMatch: item.ifMatch } : {}),
        }),
        bindings,
        signal,
      );
      expect(result.ok).toBe(true);
    }

    expect(fetchImpl).toHaveBeenCalledTimes(cases.length);
    const bodies = fetchImpl.mock.calls.map((call) =>
      JSON.parse(String(call[1]?.body)),
    );
    expect(bodies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ p_request: expect.any(Object) }),
      ]),
    );

    for (const [port, operationId, path, response] of [
      [
        'readSectionRevisions',
        'PRF-PROF-02',
        { partyId: PARTY_ID, sectionCode: 'biography' },
        cases[0].response,
      ],
      [
        'readPortfolio',
        'PRF-PROF-05',
        { partyId: PARTY_ID },
        responses.portfolio,
      ],
      ['readReel', 'PRF-PROF-06', { partyId: PARTY_ID }, responses.reel],
    ] as const) {
      fetchImpl.mockResolvedValueOnce(json(response));
      await expect(
        dependencies[port](
          input(operationId, path, { query: {} }),
          bindings,
          signal,
        ),
      ).resolves.toMatchObject({ ok: true });
    }
  });

  it('normalizes generic provider conflict, idempotency, and timeout codes', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ code: 'CONFLICT', message: 'stale' }), {
          status: 409,
          headers: { 'content-type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'IDEMPOTENCY_MISMATCH', message: 'reuse' }),
          { status: 409, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'DEPENDENCY_TIMEOUT', message: 'late' }),
          { status: 504, headers: { 'content-type': 'application/json' } },
        ),
      );
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl,
    });
    const args = input('PRF-PROF-01', { partyId: PARTY_ID });
    await expect(
      dependencies.readPublicProfile(args, bindings, signal),
    ).resolves.toMatchObject({ code: 'VERSION_CONFLICT' });
    await expect(
      dependencies.readPublicProfile(args, bindings, signal),
    ).resolves.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    await expect(
      dependencies.readPublicProfile(args, bindings, signal),
    ).resolves.toMatchObject({ code: 'TIMEOUT' });
  });

  it('validates the transactional event sink envelope', async () => {
    const dependencies = createProductionProfilePortfolioDependencies({
      environment: bindings,
      fetchImpl: vi.fn<typeof fetch>(),
    });
    await expect(
      dependencies.emitEvent({} as never, bindings, signal),
    ).rejects.toThrow('Invalid profile portfolio event.');
    await expect(
      dependencies.emitEvent(
        {
          eventId: crypto.randomUUID(),
          eventType: 'profile.projection.invalidated.v1',
          eventVersion: 1,
          aggregateId: PARTY_ID,
          aggregateVersion: '2',
          occurredAt: new Date().toISOString(),
          correlationId: crypto.randomUUID(),
          causationId: crypto.randomUUID(),
          payload: {
            partyId: PARTY_ID,
            sourceType: 'profile',
            sourceId: PARTY_ID,
            sourceVersion: '2',
            reason: 'section_changed',
          },
        },
        bindings,
        signal,
      ),
    ).resolves.toBeUndefined();
  });
});
