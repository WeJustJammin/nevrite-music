import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it, vi } from 'vitest';

import UploadCompletionError from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionError';
import UploadCompletionFeedback, {
  UploadCompletionPersonaNotice,
} from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionFeedback';
import UploadCompletionForm from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionForm';
import UploadCompletionStatus from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionStatus';
import {
  createUploadCompletionProjection,
  isProductionUploadCompletionEnabled,
  PRODUCTION_UPLOAD_COMPLETION_REGISTRY,
  serializeUploadCompletionState,
  uploadCompletionHref,
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
const draft: UploadCompletionDraft = {
  uploadIntentId: INTENT_ID,
  byteSize: 12000,
  mediaType: 'image/png',
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  idempotencyKey: 'completion-123',
  ifMatch: '"2"',
};
const policy: UploadCompletionPolicy = {
  allowedMediaTypes: ['image/png'],
  maxBytes: 20000,
  requiresIfMatch: true,
};
const completion = createUploadCompletionProjection({
  status: 202,
  location: `/api/v1/jobs/${JOB_ID}`,
  etag: '"3"',
  job: {
    id: JOB_ID,
    type: 'platform.object.verify',
    state: 'queued',
    progress: null,
    resultRef: null,
    error: null,
    createdAt: AT,
    updatedAt: AT,
  },
  objectId: OBJECT_ID,
  objectState: 'uploaded',
  replayed: false,
  dispatch: 'sent',
});

const renderForm = (
  options: Partial<React.ComponentProps<typeof UploadCompletionForm>> = {},
) =>
  renderToStaticMarkup(
    React.createElement(UploadCompletionForm, {
      access: 'full',
      initialDraft: draft,
      policy,
      ...options,
    }),
  );

describe('Slice 05 upload-completion render branch coverage', () => {
  it('covers optional form props and every visible field error link', () => {
    const form = renderForm({
      onSubmit: async () => completion,
      onCanonicalRefetch: vi.fn(),
      onRetry: vi.fn(),
    });
    expect(form).toContain('Complete upload and start verification');
    const fields = [
      'uploadIntentId',
      'byteSize',
      'mediaType',
      'checksum.algorithm',
      'checksum.value',
      'idempotencyKey',
      'ifMatch',
    ] as const;
    const invalid = renderForm({
      initialState: {
        status: 'validation_error',
        draft,
        violations: fields.map((field) => ({
          field,
          code: 'required',
          message: `${field} is required`,
        })),
      },
    });
    for (const field of fields) {
      const id = field
        .replace('.', '-')
        .replace(/[A-Z]/gu, (value) => `-${value.toLowerCase()}`);
      expect(invalid).toContain(
        `aria-describedby="upload-completion-${id}-error"`,
      );
    }
  });

  it('covers safe error owners, status callbacks, navigation, and persistence guards', () => {
    const dependency = renderToStaticMarkup(
      React.createElement(UploadCompletionError, {
        state: {
          status: 'error',
          draft,
          code: 'DEPENDENCY_UNAVAILABLE',
          requestId: 'not-a-request-id',
          retryAfterSeconds: -1,
          retryable: false,
          attempt: 0,
        },
      }),
    );
    expect(dependency).toContain('Reconcile verification status');
    expect(dependency).toContain('role="alert"');
    const internal = renderToStaticMarkup(
      React.createElement(UploadCompletionError, {
        state: {
          status: 'error',
          draft,
          code: 'INTERNAL_ERROR',
          requestId: '',
          retryable: false,
          attempt: 0,
        },
      }),
    );
    expect(internal).toContain('Reconcile verification status');

    expect(
      UploadCompletionPersonaNotice({ persona: '' as never }),
    ).not.toBeNull();
    const feedback = UploadCompletionFeedback({
      state: { status: 'idle', draft },
      onCanonicalRefetch: vi.fn(),
      onRetry: vi.fn(),
      onConflictReview: vi.fn(),
      onConflictReapply: vi.fn(),
      onConflictDiscard: vi.fn(),
    });
    expect(feedback).not.toBeNull();
    const degraded = UploadCompletionStatus({
      state: {
        status: 'degraded',
        draft,
        requestId: '',
        lastVerifiedAt: null,
        message: 'degraded',
        completion: null,
      },
    }) as React.ReactElement<{ children?: React.ReactNode }>;
    const reconcile = React.Children.toArray(degraded.props.children).find(
      (child) => React.isValidElement(child) && child.type === 'button',
    ) as React.ReactElement<{ onClick: () => void }> | undefined;
    reconcile?.props.onClick();
    UploadCompletionStatus({
      state: {
        status: 'error',
        draft,
        code: 'RATE_LIMITED',
        requestId: REQUEST_ID,
        retryable: true,
        attempt: 0,
      },
      onRetry: vi.fn(),
    });

    const canonical = uploadCompletionHref(INTENT_ID);
    expect(
      uploadCompletionBackHref(
        '/app/infrastructure/upload-completion?uploadIntentId=bad',
        INTENT_ID,
      ),
    ).toBe(canonical);
    expect(uploadCompletionBackHref('http://[invalid', INTENT_ID)).toBe(
      canonical,
    );

    const validation: UploadCompletionState = {
      status: 'validation_error',
      draft,
      violations: [
        { field: 'mediaType', code: 'required', message: 'required' },
      ],
    };
    expect(serializeUploadCompletionState(validation)).toContain('mediaType');
    expect(
      serializeUploadCompletionState({
        status: 'conflict',
        draft,
        currentVersion: 'unsafe',
        requestId: REQUEST_ID,
      }),
    ).toContain('"currentVersion":null');
    expect(
      serializeUploadCompletionState({ status: 'pending', draft, message: '' }),
    ).toContain('"message":""');
    expect(
      serializeUploadCompletionState({
        status: 'error',
        draft,
        code: 'INTERNAL_ERROR',
        requestId: REQUEST_ID,
        retryAfterSeconds: -1,
        retryable: false,
        attempt: -1,
      }),
    ).toContain('"attempt":0');
    expect(
      serializeUploadCompletionState({
        status: 'disabled',
        draft,
        reason: '\u0000',
      }),
    ).toContain('"reason":""');

    const registry =
      PRODUCTION_UPLOAD_COMPLETION_REGISTRY as unknown as string[];
    registry.push('local');
    expect(isProductionUploadCompletionEnabled('local')).toBe(true);
    registry.pop();
  });
});
