import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it, vi } from 'vitest';

import UploadCompletionError from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionError';
import { UploadCompletionPersonaNotice } from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionFeedback';
import UploadCompletionForm from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionForm';
import UploadCompletionStatus from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionStatus';
import {
  createUploadCompletionInvalidationHandler,
  createUploadCompletionProjection,
  createUploadCompletionRequest,
  getUploadCompletionErrorPresentation,
  isProductionUploadCompletionEnabled,
  normalizeUploadCompletionErrorCode,
  normalizeUploadCompletionDraft,
  PRODUCTION_UPLOAD_COMPLETION_REGISTRY,
  retryDelayForAttempt,
  serializeUploadCompletionState,
  UPLOAD_COMPLETION_PENDING_DELAY_MS,
  validateUploadCompletionDraft,
  uploadCompletionHref,
  UPLOAD_COMPLETION_RETRY_DELAYS_MS,
  type UploadCompletionDraft,
  type UploadCompletionPolicy,
  type UploadCompletionState,
} from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-state';
import { uploadCompletionBackHref } from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-navigation';

const INTENT_ID = '11111111-1111-4111-8111-111111111111';
const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const AT = '2026-08-30T12:00:00.000Z';
const DIGEST = 'a'.repeat(64);

const draft = (): UploadCompletionDraft => ({
  uploadIntentId: INTENT_ID,
  byteSize: 12000,
  mediaType: 'image/png',
  checksum: { algorithm: 'sha256', value: DIGEST },
  idempotencyKey: 'completion-123',
  ifMatch: '"2"',
});

const policy: UploadCompletionPolicy = {
  allowedMediaTypes: ['image/png'],
  maxBytes: 20000,
  requiresIfMatch: true,
};

const job = {
  id: JOB_ID,
  type: 'platform.object.verify',
  state: 'queued' as const,
  progress: null,
  resultRef: null,
  error: null,
  createdAt: AT,
  updatedAt: AT,
};

const projection = (dispatch: 'sent' | 'deferred' = 'sent') =>
  createUploadCompletionProjection({
    status: 202,
    location: `/api/v1/jobs/${JOB_ID}`,
    etag: '"3"',
    job,
    objectId: OBJECT_ID,
    objectState: 'uploaded',
    replayed: false,
    dispatch,
  });

const render = (
  state: UploadCompletionState,
  access: 'full' | 'read-only' | 'partial-hidden' | 'disabled' = 'full',
  options: Readonly<Record<string, unknown>> = {},
) =>
  renderToStaticMarkup(
    React.createElement(UploadCompletionForm, {
      access,
      initialDraft: draft(),
      initialState: state,
      policy,
      ...options,
    }),
  );

describe('Slice 05 upload-completion branch evidence', () => {
  it('covers validation alternatives and strict request/projection guards', () => {
    expect(
      normalizeUploadCompletionDraft({ ...draft(), mediaType: ' IMAGE/PNG ' })
        .mediaType,
    ).toBe('image/png');
    const invalidDrafts: UploadCompletionDraft[] = [
      { ...draft(), uploadIntentId: 'bad' },
      { ...draft(), byteSize: '' },
      { ...draft(), byteSize: 0 },
      { ...draft(), byteSize: Number.MAX_SAFE_INTEGER + 1 },
      { ...draft(), byteSize: 30000 },
      { ...draft(), mediaType: 'bad type' },
      { ...draft(), mediaType: 'audio/mp3' },
      { ...draft(), checksum: { ...draft().checksum, algorithm: 'md5' } },
      { ...draft(), checksum: { ...draft().checksum, value: 'BAD' } },
      { ...draft(), idempotencyKey: 'short' },
      { ...draft(), idempotencyKey: ' completion-123' },
      { ...draft(), ifMatch: '2' },
    ];
    for (const value of invalidDrafts)
      expect(
        validateUploadCompletionDraft(value, policy).length,
      ).toBeGreaterThan(0);
    expect(validateUploadCompletionDraft(draft(), policy)).toEqual([]);
    expect(createUploadCompletionRequest(draft()).headers.contentType).toBe(
      'application/json',
    );
    expect(() =>
      createUploadCompletionRequest({ ...draft(), byteSize: '' }),
    ).toThrow();
    const invalidProjections: unknown[] = [
      null,
      { status: 200 },
      {
        status: 202,
        location: '/bad',
        etag: '"3"',
        job,
        objectId: OBJECT_ID,
        objectState: 'uploaded',
        replayed: false,
        dispatch: 'sent',
      },
      {
        status: 202,
        location: `/api/v1/jobs/${JOB_ID}`,
        etag: 'bad',
        job,
        objectId: OBJECT_ID,
        objectState: 'uploaded',
        replayed: false,
        dispatch: 'sent',
      },
      {
        status: 202,
        location: `/api/v1/jobs/${JOB_ID}`,
        etag: '"3"',
        job: { ...job, state: 'bad' },
        objectId: OBJECT_ID,
        objectState: 'uploaded',
        replayed: false,
        dispatch: 'sent',
      },
      {
        status: 202,
        location: `/api/v1/jobs/${JOB_ID}`,
        etag: '"3"',
        job,
        objectId: 'bad',
        objectState: 'uploaded',
        replayed: false,
        dispatch: 'sent',
      },
      {
        status: 202,
        location: `/api/v1/jobs/${JOB_ID}`,
        etag: '"3"',
        job,
        objectId: OBJECT_ID,
        objectState: 'ready',
        replayed: false,
        dispatch: 'sent',
      },
      {
        status: 202,
        location: `/api/v1/jobs/${JOB_ID}`,
        etag: '"3"',
        job,
        objectId: OBJECT_ID,
        objectState: 'uploaded',
        replayed: 'no',
        dispatch: 'sent',
      },
      {
        status: 202,
        location: `/api/v1/jobs/${JOB_ID}`,
        etag: '"3"',
        job,
        objectId: OBJECT_ID,
        objectState: 'uploaded',
        replayed: false,
        dispatch: 'lost',
      },
    ];
    for (const value of invalidProjections)
      expect(() => createUploadCompletionProjection(value)).toThrow();
  });

  it('covers canonical links, invalidation, retry bounds, error mapping, and registry default', async () => {
    expect(uploadCompletionHref(INTENT_ID)).toContain(INTENT_ID);
    expect(() => uploadCompletionHref('bad')).toThrow();
    const canonical = uploadCompletionHref(INTENT_ID);
    expect(uploadCompletionBackHref(canonical, INTENT_ID)).toBe(canonical);
    expect(uploadCompletionBackHref(undefined, 'bad')).toBe(
      '/app/infrastructure/upload-completion',
    );
    expect(
      uploadCompletionBackHref(`${canonical}&extra=secret`, INTENT_ID),
    ).toBe(canonical);
    expect(UPLOAD_COMPLETION_PENDING_DELAY_MS).toBe(250);
    expect(UPLOAD_COMPLETION_RETRY_DELAYS_MS).toEqual([250, 750]);
    expect(retryDelayForAttempt(-1)).toBeNull();
    expect(retryDelayForAttempt(0)).toBe(250);
    expect(retryDelayForAttempt(1)).toBe(750);
    expect(retryDelayForAttempt(2)).toBeNull();
    const refetch = vi.fn(async () => undefined);
    await createUploadCompletionInvalidationHandler(refetch)('realtime-hint');
    expect(refetch).toHaveBeenCalledWith('realtime-hint');
    expect(normalizeUploadCompletionErrorCode('RATE_LIMITED')).toBe(
      'RATE_LIMITED',
    );
    expect(normalizeUploadCompletionErrorCode('provider-secret')).toBe(
      'INTERNAL_ERROR',
    );
    expect(getUploadCompletionErrorPresentation('unknown').owner).toBe(
      'degraded',
    );
    expect(PRODUCTION_UPLOAD_COMPLETION_REGISTRY).toEqual([]);
    expect(isProductionUploadCompletionEnabled('production')).toBe(false);
  });

  it('serializes each state with safe optional-field alternatives', () => {
    const states: UploadCompletionState[] = [
      { status: 'idle', draft: draft() },
      { status: 'loading', draft: draft(), startedAt: AT, preserveDraft: true },
      { status: 'pending', draft: draft(), message: 'pending' },
      { status: 'offline', draft: draft(), message: 'offline' },
      { status: 'validation_error', draft: draft(), violations: [] },
      {
        status: 'conflict',
        draft: draft(),
        currentVersion: '"4"',
        requestId: REQUEST_ID,
      },
      {
        status: 'error',
        draft: draft(),
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryable: true,
        attempt: 0,
      },
      {
        status: 'error',
        draft: draft(),
        code: 'provider-secret',
        requestId: 'bad',
        retryAfterSeconds: 12,
        retryAt: AT,
        retryable: false,
        attempt: 3,
      },
      {
        status: 'degraded',
        draft: draft(),
        requestId: REQUEST_ID,
        lastVerifiedAt: AT,
        message: 'degraded',
        completion: projection('deferred'),
      },
      {
        status: 'degraded',
        draft: draft(),
        requestId: 'bad',
        lastVerifiedAt: 'bad',
        message: 'degraded',
        completion: null,
      },
      { status: 'success', draft: draft(), completion: projection() },
      { status: 'disabled', draft: draft(), reason: 'disabled' },
    ];
    for (const state of states)
      expect(serializeUploadCompletionState(state)).toContain(
        `"status":"${state.status}"`,
      );
    expect(serializeUploadCompletionState(states[8]!)).toContain('deferred');
    expect(serializeUploadCompletionState(states[9]!)).not.toContain('bad');
    expect(serializeUploadCompletionState(states[10]!)).not.toContain(
      'completion-123',
    );
  });

  it('renders remaining access/persona/status branches without raw details', () => {
    expect(
      render({ status: 'disabled', draft: draft(), reason: 'disabled' }),
    ).toContain('Action unavailable');
    expect(render({ status: 'idle', draft: draft() }, 'read-only')).toContain(
      'Read-only',
    );
    expect(
      render({ status: 'idle', draft: draft() }, 'partial-hidden'),
    ).not.toContain('upload-completion-checksum');
    expect(render({ status: 'idle', draft: draft() }, 'disabled')).toContain(
      'Action unavailable',
    );
    expect(
      render({ status: 'idle', draft: draft() }, 'full', {
        policy: { ...policy, persona: 'admin' },
      }),
    ).toContain('recent step-up');
    expect(
      render({ status: 'idle', draft: draft() }, 'full', {
        policy: {
          ...policy,
          persona: 'admin',
          stepUpVerified: true,
          auditedReason: 'reason',
        },
      }),
    ).toContain('Admin completion');
    expect(
      render({
        status: 'success',
        draft: draft(),
        completion: projection('deferred'),
      }),
    ).toContain('Deferred safely');
    expect(
      render({
        status: 'degraded',
        draft: draft(),
        requestId: '',
        lastVerifiedAt: null,
        message: 'degraded',
        completion: null,
      }),
    ).toContain('Reconcile verification status');
    expect(UploadCompletionPersonaNotice({})).toBeNull();
    expect(
      render({ status: 'success', draft: draft(), completion: projection() }),
    ).not.toContain('signedUrl');
  });

  it('covers direct retry and canonical refresh callbacks', () => {
    const retry = vi.fn(async () => undefined);
    const element = UploadCompletionError({
      state: {
        status: 'error',
        draft: draft(),
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryable: true,
        attempt: 0,
      },
      onRetry: retry,
    }) as React.ReactElement<{ children?: React.ReactNode }>;
    const button = React.Children.toArray(element.props.children).find(
      (child) => React.isValidElement(child) && child.type === 'button',
    ) as React.ReactElement<{ onClick: () => void }> | undefined;
    button?.props.onClick();
    expect(retry).toHaveBeenCalledWith({
      action: 'canonical-refetch',
      attempt: 0,
      delayMs: 250,
    });
    const refetch = vi.fn(async () => undefined);
    const degraded = UploadCompletionStatus({
      state: {
        status: 'degraded',
        draft: draft(),
        requestId: '',
        lastVerifiedAt: null,
        message: 'degraded',
        completion: null,
      },
      onCanonicalRefetch: refetch,
    }) as React.ReactElement<{ children?: React.ReactNode }>;
    const refresh = React.Children.toArray(degraded.props.children).find(
      (child) => React.isValidElement(child) && child.type === 'button',
    ) as React.ReactElement<{ onClick: () => void }> | undefined;
    refresh?.props.onClick();
    expect(refetch).toHaveBeenCalledWith('reconnect');
  });
});
