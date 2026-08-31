import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it, vi } from 'vitest';

import DataTable from '../../apps/web/src/components/infrastructure/DataTable';
import UploadAdmissionFields from '../../apps/web/src/components/infrastructure/upload-admission/UploadAdmissionFields';
import UploadAdmissionValidationSummary, {
  firstInvalidId,
} from '../../apps/web/src/components/infrastructure/upload-admission/UploadAdmissionValidationSummary';
import UploadCompletionStatus from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionStatus';
import { focusUploadCompletionResultHeading } from '../../apps/web/src/components/infrastructure/upload-completion/UploadCompletionResult';
import {
  createUploadCompletionProjection,
  type UploadCompletionDraft,
} from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-state';
import type {
  UploadAdmissionDraft,
  UploadAdmissionPolicy,
  UploadAdmissionViolation,
} from '../../apps/web/src/components/infrastructure/upload-admission/upload-admission-state';
import { InfrastructureRecordSchema } from '@wejammin/contracts';
import type { InfrastructureRecord } from '@wejammin/ui/infrastructure/presentation';

const TARGET_ID = '11111111-1111-4111-8111-111111111111';
const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';
const AT = '2026-08-30T12:00:00.000Z';

const admissionDraft: UploadAdmissionDraft = {
  targetType: 'infrastructure.record',
  targetId: TARGET_ID,
  purpose: 'cover_art',
  mediaType: 'image/png',
  byteSize: 12_000,
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  idempotencyKey: 'admission-123',
  ifMatch: '"2"',
};

const admissionPolicy: UploadAdmissionPolicy = {
  targetTypes: ['infrastructure.record'],
  purposes: ['cover_art'],
  allowedMediaTypes: ['image/png'],
  maxBytes: 20_000,
  requiresIfMatch: true,
};

const completionDraft: UploadCompletionDraft = {
  uploadIntentId: TARGET_ID,
  byteSize: 12_000,
  mediaType: 'image/png',
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  idempotencyKey: 'completion-123',
  ifMatch: '"2"',
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

const violationFor = (
  field: UploadAdmissionViolation['field'],
): UploadAdmissionViolation => ({
  field,
  code: 'invalid',
  message: `${field} is invalid`,
});

const recordFor = (modifiedAt: string): InfrastructureRecord =>
  InfrastructureRecordSchema.parse({
    facts: { region: 'us-east' },
    id: OBJECT_ID,
    label: 'Control plane',
    modifiedAt,
    provenance: [
      { label: 'Catalog', recordedAt: modifiedAt, sourceType: 'public' },
    ],
    summary: 'Canonical record',
    version: '"2"',
  });

describe('Phase 1 accessibility blocker regressions', () => {
  it('maps every upload-admission violation to the rendered kebab-case control ID', () => {
    const fields = [
      'targetType',
      'targetId',
      'purpose',
      'mediaType',
      'byteSize',
      'checksum.algorithm',
      'checksum.value',
      'idempotencyKey',
      'ifMatch',
    ] as const;
    const violations = fields.map(violationFor);
    const summary = renderToStaticMarkup(
      React.createElement(UploadAdmissionValidationSummary, { violations }),
    );
    const fieldsMarkup = renderToStaticMarkup(
      React.createElement(UploadAdmissionFields, {
        draft: admissionDraft,
        policy: admissionPolicy,
        violations: [],
        onChange: () => undefined,
        disabled: false,
      }),
    );

    for (const field of fields) {
      const id = `upload-${field
        .replaceAll('.', '-')
        .replace(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`)}`;
      expect(firstInvalidId([violationFor(field)])).toBe(id);
      expect(summary).toContain(`href="#${id}"`);
      expect(fieldsMarkup).toContain(`id="${id}"`);
    }
  });

  it('announces and focuses a successful upload-completion result', () => {
    const markup = renderToStaticMarkup(
      React.createElement(UploadCompletionStatus, {
        state: { status: 'success', draft: completionDraft, completion },
      }),
    );
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain(
      'id="upload-completion-result-heading" tabindex="-1"',
    );

    const focus = vi.fn();
    focusUploadCompletionResultHeading({ focus });
    expect(focus).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('keeps non-rate completion errors assertive while rate waits stay polite', () => {
    const dependency = renderToStaticMarkup(
      React.createElement(UploadCompletionStatus, {
        state: {
          status: 'error',
          draft: completionDraft,
          code: 'DEPENDENCY_UNAVAILABLE',
          requestId: '',
          retryable: false,
          attempt: 0,
        },
      }),
    );
    const rateWait = renderToStaticMarkup(
      React.createElement(UploadCompletionStatus, {
        state: {
          status: 'error',
          draft: completionDraft,
          code: 'RATE_LIMITED',
          requestId: '',
          retryable: false,
          attempt: 0,
        },
      }),
    );
    expect(dependency).toContain('role="alert"');
    expect(dependency).toContain('aria-live="assertive"');
    expect(rateWait).toContain('role="status"');
    expect(rateWait).toContain('aria-live="polite"');
  });

  it('exposes modified-date sort direction on the active DataTable column', () => {
    const records = [recordFor('2026-08-30T12:00:00.000Z')];
    const props = {
      hrefForRecord: (recordId: string) => `/records/${recordId}`,
      onSortByLabel: () => undefined,
      records,
      selectedId: null,
    };
    const ascending = renderToStaticMarkup(
      React.createElement(DataTable, { ...props, sort: 'modified_asc' }),
    );
    const descending = renderToStaticMarkup(
      React.createElement(DataTable, { ...props, sort: 'modified_desc' }),
    );
    expect(ascending).toContain('Last modified</th>');
    expect(ascending).toContain(
      '<th scope="col" aria-sort="ascending">Last modified',
    );
    expect(descending).toContain(
      '<th scope="col" aria-sort="descending">Last modified',
    );
  });
});
