import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it, vi } from 'vitest';

import ProviderEvidencePanel from '../../apps/web/src/components/infrastructure/provider-evidence/ProviderEvidencePanel';
import {
  createCanonicalEvidenceInvalidationHandler,
  createProviderEvidenceProjection,
  EVIDENCE_RETRY_DELAYS_MS,
  evidenceRetryDelayForAttempt,
  isProductionProviderEnabled,
  providerEvidenceBackHref,
  providerEvidenceListHref,
  providerOperationHref,
  PRODUCTION_PROVIDER_REGISTRY,
  type ProviderEvidenceFilters,
  type ProviderEvidenceProjection,
  type ProviderEvidenceState,
} from '../../apps/web/src/components/infrastructure/provider-evidence/provider-evidence-state';

const OPERATION_ID = '22222222-2222-4222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-4333-8333-333333333333';
const AT = '2026-08-30T12:15:00.000Z';
const DIGEST = 'a'.repeat(64);
const filters: ProviderEvidenceFilters = {
  provider: 'local',
  state: 'pending',
};

const input = (
  scope: 'case' | 'capability' = 'case',
  receipt: unknown = {
    id: RECEIPT_ID,
    provider: 'local',
    state: 'accepted',
    payloadDigest: DIGEST,
    signatureVerifiedAt: AT,
    receivedAt: AT,
    operationId: OPERATION_ID,
    externalEventPresent: true,
  },
) => ({
  operation: {
    id: OPERATION_ID,
    provider: 'local',
    operationType: 'email.send',
    state: 'pending',
    payloadDigest: DIGEST,
    version: '3',
  },
  receipt,
  provenance: { source: 'reconciler', observedAt: AT, lastVerifiedAt: AT },
  scope: { kind: scope, label: `${scope} evidence` },
});

const evidence = (
  scope: 'case' | 'capability' = 'case',
): ProviderEvidenceProjection => createProviderEvidenceProjection(input(scope));

const render = (
  access: 'read-only' | 'staff-case-scoped' | 'admin-capability-scoped',
  state: ProviderEvidenceState,
  options: Readonly<Record<string, unknown>> = {},
) =>
  renderToStaticMarkup(
    React.createElement(ProviderEvidencePanel, { access, state, ...options }),
  );

describe('Slice 06 provider evidence branch coverage', () => {
  it('covers projection validation and every operation/receipt display state', () => {
    for (const state of [
      'planned',
      'pending',
      'confirmed',
      'failed',
      'manual_review',
    ] as const) {
      const value = createProviderEvidenceProjection({
        ...input(),
        operation: { ...input().operation, state },
      });
      expect(value).toBeTruthy();
      const markup = render('staff-case-scoped', {
        status: 'success',
        filters,
        evidence: value,
      });
      expect(markup).toContain(
        state === 'manual_review'
          ? 'manual review'
          : state === 'pending'
            ? 'pending reconciliation'
            : state,
      );
    }
    for (const state of [
      'received',
      'accepted',
      'duplicate',
      'rejected',
      'processed',
      'failed',
      'manual_review',
    ] as const) {
      const value = createProviderEvidenceProjection({
        ...input(),
        receipt: {
          ...(input().receipt as Record<string, unknown>),
          state,
          externalEventPresent: false,
        },
      });
      expect(value.receipt?.state).toBe(state);
      expect(
        render('staff-case-scoped', {
          status: 'success',
          filters,
          evidence: value,
        }),
      ).toContain(
        state === 'manual_review'
          ? 'Manual review required'
          : state === 'duplicate'
            ? 'Duplicate acknowledged'
            : state[0]!.toUpperCase() + state.slice(1),
      );
    }
    expect(
      createProviderEvidenceProjection(input('case', null)).receipt,
    ).toBeNull();
    expect(
      createProviderEvidenceProjection({
        ...input(),
        receipt: {
          ...(input().receipt as Record<string, unknown>),
          operationId: null,
        },
      }).receipt?.operationId,
    ).toBeNull();
    const base = input();
    const invalids = [
      null,
      { ...base, operation: { ...base.operation, id: 'bad' } },
      { ...base, operation: { ...base.operation, provider: 'Bad Provider' } },
      { ...base, operation: { ...base.operation, operationType: 'Bad Type' } },
      { ...base, operation: { ...base.operation, state: 'unknown' } },
      { ...base, operation: { ...base.operation, payloadDigest: 'bad' } },
      { ...base, operation: { ...base.operation, version: '0' } },
      { ...base, provenance: { ...base.provenance, observedAt: 'bad' } },
      { ...base, scope: { ...base.scope, label: '' } },
      {
        ...base,
        receipt: {
          ...(base.receipt as Record<string, unknown>),
          operationId: 'bad',
        },
      },
      {
        ...base,
        receipt: {
          ...(base.receipt as Record<string, unknown>),
          externalEventPresent: 'yes',
        },
      },
      {
        ...base,
        receipt: {
          ...(base.receipt as Record<string, unknown>),
          externalEventId: 'secret',
        },
      },
    ];
    for (const value of invalids)
      expect(() => createProviderEvidenceProjection(value)).toThrow();
  });

  it('covers navigation, retry bounds, invalidation, and filter allowlists', async () => {
    expect(EVIDENCE_RETRY_DELAYS_MS).toEqual([250, 750]);
    expect(evidenceRetryDelayForAttempt(-1)).toBeNull();
    expect(evidenceRetryDelayForAttempt(0)).toBe(250);
    expect(evidenceRetryDelayForAttempt(1)).toBe(750);
    expect(evidenceRetryDelayForAttempt(2)).toBeNull();
    expect(providerOperationHref(OPERATION_ID)).toContain(OPERATION_ID);
    expect(() => providerOperationHref('bad')).toThrow();
    expect(providerEvidenceListHref({ provider: null, state: null })).toBe(
      '/app/infrastructure/provider-operations',
    );
    expect(
      providerEvidenceListHref({ provider: 'bad/provider', state: 'pending' }),
    ).toBe('/app/infrastructure/provider-operations?state=pending');
    const canonical = providerEvidenceListHref(filters);
    expect(providerEvidenceBackHref(undefined, filters)).toBe(canonical);
    expect(providerEvidenceBackHref(canonical, filters)).toBe(canonical);
    for (const href of [
      'https://evil.invalid/app/infrastructure/provider-operations',
      `${canonical}#replay`,
      `${canonical}&rawPayload=secret`,
      '/not-provider-evidence',
      `${canonical}&provider=another`,
      'http://[invalid',
    ])
      expect(providerEvidenceBackHref(href, filters)).toBe(canonical);
    const refetch = vi.fn(async () => undefined);
    await createCanonicalEvidenceInvalidationHandler(refetch)('realtime-hint');
    expect(refetch).toHaveBeenCalledWith('realtime-hint');
    const registry = PRODUCTION_PROVIDER_REGISTRY as unknown as string[];
    registry.push('local');
    expect(isProductionProviderEnabled('local')).toBe(true);
    expect(
      render('read-only', { status: 'success', filters, evidence: evidence() }),
    ).toContain('configured outside');
    registry.pop();
  });
});
