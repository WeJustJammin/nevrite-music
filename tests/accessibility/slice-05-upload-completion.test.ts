import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import {
  InfrastructureRecordSchema,
  type JobStatus,
} from '@wejammin/contracts';
import { describe, expect, it, vi } from 'vitest';

import InfrastructureWorkbench from '../../apps/web/src/components/infrastructure/InfrastructureWorkbench';
import UploadCompletionForm from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionForm';
import {
  createUploadCompletionProjection,
  createUploadCompletionRequest,
  createUploadCompletionInvalidationHandler,
  getUploadCompletionErrorPresentation,
  isProductionUploadCompletionEnabled,
  PRODUCTION_UPLOAD_COMPLETION_REGISTRY,
  retryDelayForAttempt,
  serializeUploadCompletionState,
  UPLOAD_COMPLETION_RETRY_DELAYS_MS,
  type UploadCompletionDraft,
  type UploadCompletionPolicy,
  type UploadCompletionProjection,
  type UploadCompletionState,
} from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-state';

const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const INTENT_ID = '11111111-1111-4111-8111-111111111111';
const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';
const AT = '2026-08-30T12:00:00.000Z';
const DIGEST = 'a'.repeat(64);

const validDraft = (): UploadCompletionDraft => ({
  uploadIntentId: INTENT_ID,
  byteSize: 12_000,
  mediaType: 'image/png',
  checksum: { algorithm: 'sha256', value: DIGEST },
  idempotencyKey: 'completion-123',
  ifMatch: '"2"',
});

const policy: UploadCompletionPolicy = {
  allowedMediaTypes: ['image/png'],
  maxBytes: 20_000,
  requiresIfMatch: true,
  persona: 'creator',
  capabilityLabel: 'object.upload.complete',
  stepUpVerified: true,
  auditedReason: 'User-requested cover art upload',
};

const job: JobStatus = {
  id: JOB_ID,
  type: 'platform.object.verify',
  state: 'queued',
  progress: null,
  resultRef: null,
  error: null,
  createdAt: AT,
  updatedAt: AT,
};

const projectionInput = {
  status: 202 as const,
  location: `/api/v1/jobs/${JOB_ID}`,
  etag: '"3"',
  job,
  objectId: OBJECT_ID,
  objectState: 'uploaded' as const,
  replayed: false,
  dispatch: 'sent' as const,
};

const projection = (): UploadCompletionProjection =>
  createUploadCompletionProjection(projectionInput);

const successState = (): UploadCompletionState => ({
  status: 'success',
  draft: validDraft(),
  completion: projection(),
});

const renderForm = (
  overrides: Partial<React.ComponentProps<typeof UploadCompletionForm>> = {},
): string =>
  renderToStaticMarkup(
    React.createElement(UploadCompletionForm, {
      access: 'full',
      initialDraft: validDraft(),
      initialState: { status: 'idle', draft: validDraft() },
      policy,
      ...overrides,
    }),
  );

describe('Slice 05 upload-completion web surface', () => {
  it('P1-S05-AC-057..064 uses only server-selected persona capability variants', () => {
    const hidden = renderForm({ access: 'not-rendered' });
    const disabled = renderForm({
      access: 'disabled',
      capabilityReason: 'A named completion capability is required.',
    });
    const partial = renderForm({ access: 'partial-hidden' });
    const readOnly = renderForm({ access: 'read-only' });

    expect(hidden).toBe('');
    expect(hidden).not.toContain(INTENT_ID);
    expect(disabled).toContain('Action unavailable');
    expect(disabled).toContain('named completion capability');
    expect(disabled).toMatch(
      /<button[^>]*disabled=""[^>]*>Complete upload and start verification<\/button>/,
    );
    expect(partial).toContain('Some completion fields are hidden');
    expect(partial).not.toContain('id="upload-completion-checksum"');
    expect(readOnly).toContain('Read-only');
    expect(readOnly).toMatch(
      /<button[^>]*disabled=""[^>]*>Complete upload and start verification<\/button>/,
    );
  });

  it('P1-S05-AC-049..056 validates named completion fields and preserves the request contract', () => {
    const request = createUploadCompletionRequest(validDraft());
    expect(request.uploadIntentId).toBe(INTENT_ID);
    expect(request.body.mediaType).toBe('image/png');
    expect(request.headers.ifMatch).toBe('"2"');
    expect(() =>
      createUploadCompletionRequest({
        ...validDraft(),
        uploadIntentId: 'not-a-uuid',
      }),
    ).toThrow('Invalid upload completion');
    expect(() =>
      createUploadCompletionProjection({
        ...projectionInput,
        signedUrl: 'https://storage.example.test/secret',
      }),
    ).toThrow('Invalid upload completion projection');
  });

  it('P1-S05-AC-065..067 keeps safe deep links, Back navigation, drafts, and canonical invalidation', async () => {
    const markup = renderForm({ initialState: successState() });
    expect(markup).toContain(
      'href="/app/infrastructure/upload-completion?uploadIntentId=11111111-1111-4111-8111-111111111111"',
    );
    expect(markup).toContain('Back to upload details');
    expect(markup).not.toContain('signedUrl');
    expect(markup).not.toContain('secret-token');

    const refetch = vi.fn(async () => undefined);
    await createUploadCompletionInvalidationHandler(refetch)('multi-tab');
    expect(refetch).toHaveBeenCalledWith('multi-tab');
  });

  it('P1-S05-AC-068..069 links validation summary to the first field and announces progress politely', () => {
    const loading = renderForm({
      initialState: {
        status: 'loading',
        draft: validDraft(),
        startedAt: AT,
        preserveDraft: true,
      },
    });
    const invalid = renderForm({
      initialState: {
        status: 'validation_error',
        draft: validDraft(),
        violations: [
          {
            field: 'byteSize',
            code: 'positive',
            message: 'Enter a positive byte size.',
          },
        ],
      },
    });
    expect(loading).toContain('aria-live="polite"');
    expect(loading).toContain('Loading upload verification');
    expect(loading).not.toContain('autofocus');
    expect(invalid).toContain('role="alert"');
    expect(invalid).toContain('href="#upload-completion-byte-size"');
    expect(invalid).toContain('aria-invalid="true"');
  });

  it('P1-S05-AC-070 presents a conflict without overwriting the preserved draft', () => {
    const markup = renderForm({
      initialState: {
        status: 'conflict',
        draft: validDraft(),
        currentVersion: '"4"',
        requestId: REQUEST_ID,
      },
      onConflictReview: () => undefined,
      onConflictReapply: () => undefined,
      onConflictDiscard: () => undefined,
    });
    expect(markup).toContain('Review current upload version');
    expect(markup).toContain('Server version');
    expect(markup).toContain('&quot;4&quot;');
    expect(markup).toContain('Review changes');
    expect(markup).toContain('Reapply preserved completion');
    expect(markup).toContain('Discard preserved completion');
    expect(markup).toContain('completion-123');
  });

  it('P1-S05-AC-071..074 keeps pending, server-time rate waits, safe 5xx retry, and offline noncanonical states explicit', () => {
    expect(UPLOAD_COMPLETION_RETRY_DELAYS_MS).toEqual([250, 750]);
    expect(retryDelayForAttempt(0)).toBe(250);
    expect(retryDelayForAttempt(1)).toBe(750);
    expect(retryDelayForAttempt(2)).toBeNull();
    const pending = renderForm({
      initialState: {
        status: 'pending',
        draft: validDraft(),
        message: 'Completion accepted; verification pending.',
      },
    });
    const rateWait = renderForm({
      initialState: {
        status: 'error',
        draft: validDraft(),
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryAfterSeconds: 12,
        retryAt: '2026-08-30T12:00:12.000Z',
        retryable: true,
        attempt: 0,
      },
    });
    const degraded = renderForm({
      initialState: {
        status: 'degraded',
        draft: validDraft(),
        requestId: REQUEST_ID,
        lastVerifiedAt: AT,
        message: 'Verification status is temporarily unavailable.',
        completion: projection(),
      },
    });
    const offline = renderForm({
      initialState: {
        status: 'offline',
        draft: validDraft(),
        message: 'Completion is held locally until reconnect.',
      },
    });
    expect(pending).toContain('Verification pending');
    expect(pending).not.toContain('Object is ready');
    expect(rateWait).toContain('Retry available at');
    expect(rateWait).toContain('12 seconds');
    expect(rateWait).toContain('completion-123');
    expect(degraded).toContain('Reconcile verification status');
    expect(degraded).toContain('Last verified');
    expect(degraded).toContain(AT);
    expect(offline).toContain('not canonical');
    expect(offline).toContain('completion-123');
  });

  it('P1-S05-AC-075..078 renders typed success fields and deterministic error ownership', () => {
    const success = renderForm({ initialState: successState() });
    expect(success).toContain('Verification job');
    expect(success).toContain(JOB_ID);
    expect(success).toContain('Object version');
    expect(success).toContain('&quot;3&quot;');
    expect(success).toContain('Check verification status');
    expect(success).toContain('Production upload completion is disabled');
    expect(success).not.toContain('signedUrl');
    expect(success).not.toContain('providerSecret');

    for (const code of [
      'INVALID_REQUEST',
      'UNAUTHENTICATED',
      'FORBIDDEN',
      'NOT_FOUND',
      'CONFLICT',
      'PAYLOAD_TOO_LARGE',
      'UNSUPPORTED_MEDIA_TYPE',
      'VALIDATION_FAILED',
      'RATE_LIMITED',
      'DEPENDENCY_UNAVAILABLE',
      'INTERNAL_ERROR',
      'OBJECT_VERIFICATION_FAILED',
    ]) {
      const presentation = getUploadCompletionErrorPresentation(code);
      expect([
        'inline',
        'auth',
        'capability',
        'conflict',
        'rate-wait',
        'degraded',
      ]).toContain(presentation.owner);
      expect(presentation.message).not.toContain(code);
    }
  });

  it('keeps production completion disabled and integrates through an explicit workbench prop', () => {
    expect(PRODUCTION_UPLOAD_COMPLETION_REGISTRY).toEqual([]);
    expect(isProductionUploadCompletionEnabled('supabase')).toBe(false);
    const record = InfrastructureRecordSchema.parse({
      facts: {},
      id: OBJECT_ID,
      label: 'Upload target',
      modifiedAt: AT,
      provenance: [],
      summary: 'Canonical upload target.',
      version: '"2"',
    });
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        access: 'read-only',
        canonicalUrl: '/app/infrastructure',
        expectedVersion: record.version,
        initial: { record, status: 'success' },
        query: {},
        requestId: REQUEST_ID,
        selectedId: record.id,
        variant: 'appPage',
        uploadCompletion: {
          access: 'disabled',
          initialDraft: validDraft(),
          initialState: {
            status: 'disabled',
            draft: validDraft(),
            reason: 'Production upload completion is disabled.',
          },
          policy,
        },
      }),
    );
    expect(markup).toContain('Upload completion');
    expect(markup).toContain('Production upload completion is disabled');
    expect(markup).not.toContain('signedUrl');
  });

  it('serializes only safe completion state and never persists raw upload details', () => {
    const serialized = serializeUploadCompletionState(successState());
    expect(serialized).toContain(JOB_ID);
    expect(serialized).not.toContain('signedUrl');
    expect(serialized).not.toContain('providerSecret');
    expect(serialized).not.toContain('rawPayload');
  });
});
