import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it, vi } from 'vitest';

import ProviderEvidencePanel from '../../apps/web/src/components/infrastructure/provider-evidence/ProviderEvidencePanel';
import ProviderEvidenceError from '../../apps/web/src/components/infrastructure/provider-evidence/ProviderEvidenceError';
import { ProviderEvidenceFeedback } from '../../apps/web/src/components/infrastructure/provider-evidence/ProviderEvidenceFeedback';
import {
  createProviderEvidenceProjection,
  getProviderEvidenceErrorPresentation,
  serializeProviderEvidenceState,
  type ProviderEvidenceFilters,
  type ProviderEvidenceProjection,
  type ProviderEvidenceState,
} from '../../apps/web/src/components/infrastructure/provider-evidence/provider-evidence-state';

const OPERATION_ID = '22222222-2222-4222-8222-222222222222';
const RECEIPT_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = '44444444-4444-4444-8444-444444444444';
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

describe('Slice 06 provider evidence persistence and UI coverage', () => {
  it('covers all safe persistence states and sanitizes unsafe values', () => {
    const states: ProviderEvidenceState[] = [
      { status: 'idle', filters },
      { status: 'loading', filters },
      { status: 'success', filters, evidence: evidence() },
      {
        status: 'degraded',
        filters,
        evidence: null,
        requestId: 'bad',
        lastVerifiedAt: 'bad',
        scope: '\u0000',
      },
      {
        status: 'degraded',
        filters,
        evidence: evidence('capability'),
        requestId: REQUEST_ID,
        lastVerifiedAt: AT,
        scope: 'safe scope',
      },
      {
        status: 'error',
        filters,
        code: 'provider-secret',
        requestId: 'bad',
        retryable: true,
        attempt: 0,
      },
      {
        status: 'error',
        filters,
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryAfterSeconds: 12,
        retryable: true,
        attempt: 1,
      },
      { status: 'disabled', filters, reason: 'capability required' },
    ];
    for (const state of states)
      expect(serializeProviderEvidenceState(state)).toContain(
        `"status":"${state.status}"`,
      );
    const safe = serializeProviderEvidenceState(states[4]!);
    expect(safe).toContain(DIGEST);
    expect(safe).not.toContain('providerSecret');
    expect(safe).not.toContain('rawPayload');
    expect(
      serializeProviderEvidenceState({
        status: 'success',
        filters: { provider: 'bad/provider', state: null },
        evidence: evidence(),
      }),
    ).toContain('"provider":null');
    expect(
      serializeProviderEvidenceState({
        status: 'success',
        filters: { provider: null, state: 'unknown' as never },
        evidence: createProviderEvidenceProjection(input('case', null)),
      }),
    ).toContain('"state":null');
  });

  it('renders every panel feedback branch and safe error owner', () => {
    expect(
      renderToStaticMarkup(
        React.createElement(ProviderEvidencePanel, {
          access: 'disabled',
          state: { status: 'success', filters, evidence: evidence() },
        }),
      ),
    ).toContain('explicit evidence capability');
    expect(
      renderToStaticMarkup(
        React.createElement(ProviderEvidencePanel, {
          access: 'read-only',
          state: {
            status: 'disabled',
            filters,
            reason: 'State capability required',
          },
        }),
      ),
    ).toContain('State capability required');
    const idle = render('read-only', { status: 'idle', filters });
    const loading = render('read-only', { status: 'loading', filters });
    expect(idle).toContain('ready to load');
    expect(loading).toContain('Loading canonical');
    expect(
      render('staff-case-scoped', {
        status: 'degraded',
        filters,
        evidence: null,
        requestId: 'bad',
        lastVerifiedAt: null,
        scope: '',
      }),
    ).toContain('Evidence scope unavailable');
    expect(
      render('staff-case-scoped', {
        status: 'degraded',
        filters,
        evidence: evidence('capability'),
        requestId: REQUEST_ID,
        lastVerifiedAt: 'bad',
        scope: 'safe',
      }),
    ).toContain('could not be confirmed');
    expect(
      render('admin-capability-scoped', {
        status: 'success',
        filters,
        evidence: evidence('case'),
      }),
    ).toContain('scope could not');
    const retry = render('read-only', {
      status: 'error',
      filters,
      code: 'RATE_LIMITED',
      requestId: REQUEST_ID,
      retryAfterSeconds: -1,
      retryable: true,
      attempt: 0,
    });
    expect(retry).toContain('RATE_LIMITED');
    expect(
      render(
        'read-only',
        { status: 'success', filters, evidence: evidence() },
        { onCanonicalRefetch: vi.fn() },
      ),
    ).toContain('Provider operation');
    expect(
      render(
        'read-only',
        {
          status: 'error',
          filters,
          code: 'RATE_LIMITED',
          requestId: 'bad',
          retryable: true,
          attempt: 2,
        },
        { onRetry: vi.fn() },
      ),
    ).toContain('RATE_LIMITED');
    const retryCallback = vi.fn(async () => undefined);
    const errorElement = ProviderEvidenceError({
      state: {
        status: 'error',
        filters,
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryable: true,
        attempt: 0,
      },
      onRetry: retryCallback,
    }) as React.ReactElement<{ children?: React.ReactNode }>;
    const errorChildren = React.Children.toArray(errorElement.props.children);
    const retryButton = errorChildren.find(
      (child) => React.isValidElement(child) && child.type === 'button',
    ) as React.ReactElement<{ onClick: () => void }> | undefined;
    expect(retryButton).toBeDefined();
    retryButton?.props.onClick();
    expect(retryCallback).toHaveBeenCalledWith({
      action: 'canonical-refetch',
      attempt: 0,
      delayMs: 250,
    });
    ProviderEvidenceError({
      state: {
        status: 'error',
        filters,
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryAfterSeconds: 12,
        retryable: true,
        attempt: 0,
      },
      onRetry: retryCallback,
    });
    const refreshCallback = vi.fn(async () => undefined);
    const feedbackElement = ProviderEvidenceFeedback({
      access: 'read-only',
      state: {
        status: 'degraded',
        filters,
        evidence: null,
        requestId: '',
        lastVerifiedAt: null,
        scope: 'safe',
      },
      onCanonicalRefetch: refreshCallback,
    }) as React.ReactElement<{ children?: React.ReactNode }>;
    const feedbackChildren = React.Children.toArray(
      feedbackElement.props.children,
    );
    const refreshButton = feedbackChildren.find(
      (child) => React.isValidElement(child) && child.type === 'button',
    ) as React.ReactElement<{ onClick: () => void }> | undefined;
    refreshButton?.props.onClick();
    expect(refreshCallback).toHaveBeenCalledWith('reconnect');
    const noRefreshElement = ProviderEvidenceFeedback({
      access: 'read-only',
      state: {
        status: 'degraded',
        filters,
        evidence: null,
        requestId: '',
        lastVerifiedAt: null,
        scope: 'safe',
      },
    }) as React.ReactElement<{ children?: React.ReactNode }>;
    const noRefreshButton = React.Children.toArray(
      noRefreshElement.props.children,
    ).find(
      (child) => React.isValidElement(child) && child.type === 'button',
    ) as React.ReactElement<{ onClick: () => void }> | undefined;
    noRefreshButton?.props.onClick();
    for (const code of [
      'INVALID_REQUEST',
      'VALIDATION_FAILED',
      'UNAUTHENTICATED',
      'SESSION_EXPIRED',
      'FORBIDDEN',
      'CAPABILITY_REQUIRED',
      'STEP_UP_REQUIRED',
      'AUTHORITY_REQUIRED',
      'FOREIGN_AUTHORITY',
      'AUDIT_REASON_REQUIRED',
      'NOT_FOUND',
      'CONFLICT',
      'VERSION_MISMATCH',
      'IDEMPOTENCY_MISMATCH',
      'RATE_LIMITED',
      'PAYLOAD_TOO_LARGE',
      'UNSUPPORTED_MEDIA_TYPE',
      'WEBHOOK_REJECTED',
      'OBJECT_VERIFICATION_FAILED',
      'VERIFY_FAILED',
      'ORIGIN_CSRF_REQUIRED',
      'BROWSER_SECURITY_REJECTED',
      'DEPENDENCY_UNAVAILABLE',
      'HANDLER_UNAVAILABLE',
      'INTERNAL_ERROR',
      'UNKNOWN',
    ]) {
      const result = getProviderEvidenceErrorPresentation(code);
      expect(result.message).not.toContain(code);
    }
  });
});
