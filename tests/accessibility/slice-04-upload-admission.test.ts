import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import UploadAdmissionForm from '../../apps/web/src/components/infrastructure/upload-admission/UploadAdmissionForm';
import {
  getUploadAdmissionErrorCopy,
  normalizeUploadAdmissionDraft,
  retryDelayForAttempt,
  validateUploadAdmissionDraft,
  type UploadAdmissionDraft,
} from '../../apps/web/src/components/infrastructure/upload-admission/upload-admission-state';
import {
  createUploadInactivityWatch,
  UPLOAD_INACTIVITY_TIMEOUT_MS,
} from '../../apps/web/src/components/infrastructure/upload-admission/upload-transfer';
import {
  createUploadAdmissionView,
  serializeUploadAdmissionState,
} from '../../apps/web/src/server/upload-admission';

const TARGET_ID = '11111111-1111-4111-8111-111111111111';

const validDraft = (): UploadAdmissionDraft => ({
  targetType: 'infrastructure.record',
  targetId: TARGET_ID,
  purpose: 'cover_art',
  mediaType: 'image/png',
  byteSize: 12_000,
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  idempotencyKey: 'admission-123',
  ifMatch: '"2"',
});

describe('Slice 04 upload-admission web surface', () => {
  it('P1-S04-AC-053..063 validates named fields and exact correction categories', () => {
    const draft = validDraft();
    expect(
      validateUploadAdmissionDraft(draft, {
        targetTypes: ['infrastructure.record'],
        purposes: ['cover_art'],
        allowedMediaTypes: ['image/png'],
        maxBytes: 20_000,
        requiresIfMatch: true,
      }),
    ).toEqual([]);

    const violations = validateUploadAdmissionDraft(
      {
        ...draft,
        targetType: 'BAD TYPE',
        targetId: 'not-a-uuid',
        purpose: 'unknown',
        mediaType: 'TEXT/PLAIN',
        byteSize: 0,
        checksum: { algorithm: 'sha1', value: 'A'.repeat(64) },
        idempotencyKey: ' short ',
        ifMatch: '2',
      },
      {
        targetTypes: ['infrastructure.record'],
        purposes: ['cover_art'],
        allowedMediaTypes: ['image/png'],
        maxBytes: 20_000,
        requiresIfMatch: true,
      },
    );

    expect(violations.map(({ field }) => field)).toEqual([
      'targetType',
      'targetId',
      'purpose',
      'mediaType',
      'byteSize',
      'checksum.algorithm',
      'checksum.value',
      'idempotencyKey',
      'ifMatch',
    ]);
    expect(getUploadAdmissionErrorCopy('INVALID_REQUEST')).toBe(
      'This request could not be read. Review the form and try again.',
    );
    expect(getUploadAdmissionErrorCopy('VALIDATION_FAILED')).toBe(
      'Check the highlighted fields.',
    );
    expect(getUploadAdmissionErrorCopy('NOT_FOUND')).toBe(
      'The requested upload target is not available.',
    );
    expect(getUploadAdmissionErrorCopy('PAYLOAD_TOO_LARGE')).toBe(
      'Choose a smaller file.',
    );
    expect(getUploadAdmissionErrorCopy('UNSUPPORTED_MEDIA_TYPE')).toBe(
      'Choose an allowed media type.',
    );
    expect(getUploadAdmissionErrorCopy('INTERNAL_ERROR')).toBe(
      'Upload admission could not be completed.',
    );
    expect(
      normalizeUploadAdmissionDraft({ ...draft, mediaType: ' IMAGE/PNG ' })
        .mediaType,
    ).toBe('image/png');
    expect(retryDelayForAttempt(0)).toBe(250);
    expect(retryDelayForAttempt(1)).toBe(750);
    expect(retryDelayForAttempt(2)).toBeNull();
  });

  it('P1-S04-AC-064..071 hides or disables by server-selected access and never trusts role props', () => {
    const hidden = renderToStaticMarkup(
      React.createElement(UploadAdmissionForm, {
        access: 'not-rendered',
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20_000,
          requiresIfMatch: true,
        },
        initialDraft: validDraft(),
      }),
    );
    expect(hidden).not.toContain('Upload admission');
    expect(hidden).not.toContain(TARGET_ID);

    const disabled = renderToStaticMarkup(
      React.createElement(UploadAdmissionForm, {
        access: 'disabled',
        capabilityReason:
          'A server capability is required before upload admission.',
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20_000,
          requiresIfMatch: true,
        },
        initialDraft: validDraft(),
      }),
    );
    expect(disabled).toContain('Action unavailable');
    expect(disabled).toContain('A server capability is required');
    expect(disabled).toMatch(
      /<button[^>]*disabled=""[^>]*>Request upload intent<\/button>/,
    );
  });

  it('P1-S04-AC-075..078 renders linked labels, summary, pending state, and responsive semantics', () => {
    const markup = renderToStaticMarkup(
      React.createElement(UploadAdmissionForm, {
        access: 'full',
        initialDraft: validDraft(),
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20_000,
          requiresIfMatch: true,
        },
        initialState: {
          status: 'pending',
          message: 'Requesting upload admission.',
        },
      }),
    );
    expect(markup).toContain('aria-labelledby="upload-admission-heading"');
    expect(markup).toContain(
      '<label for="upload-target-type">Target type</label>',
    );
    expect(markup).toContain('<label for="upload-target-id">Target ID</label>');
    expect(markup).toContain(
      '<label for="upload-idempotency-key">Idempotency key</label>',
    );
    expect(markup).toContain(
      '<label for="upload-file">File to transfer</label>',
    );
    expect(markup).toContain('accept="image/png"');
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('Requesting upload admission.');
    expect(markup).toContain('data-responsive="mobile-tablet-desktop"');
    expect(markup).toContain('min-inline-size: 44px');
  });

  it('P1-S04-AC-079..082 keeps offline/refused/retry copy explicit and bounds retry delays', () => {
    const offline = renderToStaticMarkup(
      React.createElement(UploadAdmissionForm, {
        access: 'full',
        initialDraft: validDraft(),
        initialState: {
          status: 'offline',
          message: 'Admission is held locally until reconnect.',
        },
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20_000,
          requiresIfMatch: true,
        },
      }),
    );
    expect(offline).toContain('Admission is held locally until reconnect.');
    expect(offline).toContain('not canonical');

    const refused = renderToStaticMarkup(
      React.createElement(UploadAdmissionForm, {
        access: 'full',
        initialDraft: validDraft(),
        initialState: {
          status: 'error',
          code: 'FORBIDDEN',
          message: 'This upload is not available.',
        },
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20_000,
          requiresIfMatch: true,
        },
      }),
    );
    expect(refused).toContain(
      'This upload is not available for the current server capability.',
    );
    expect(refused).toContain('FORBIDDEN');
    expect(refused).not.toContain('signedUrl');
  });

  it('P1-S04-AC-083 P1-S04-AC-084 renders shared loading semantics and deterministic error ownership', () => {
    const loading = renderToStaticMarkup(
      React.createElement(UploadAdmissionForm, {
        access: 'full',
        initialDraft: validDraft(),
        initialState: { status: 'loading', message: 'Loading admission.' },
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20_000,
          requiresIfMatch: true,
        },
      }),
    );
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('Loading admission.');
    expect(getUploadAdmissionErrorCopy('RATE_LIMITED')).toContain('Wait');
    expect(getUploadAdmissionErrorCopy('DEPENDENCY_UNAVAILABLE')).toContain(
      'temporarily unavailable',
    );
  });

  it('P1-S04-AC-082 resets the exact inactivity window after every transferred byte', () => {
    const timers = {
      callbacks: new Map<number, () => void>(),
      next: 0,
      setTimeout(callback: () => void, delay: number) {
        expect(delay).toBe(UPLOAD_INACTIVITY_TIMEOUT_MS);
        this.callbacks.set(++this.next, callback);
        return this.next;
      },
      clearTimeout(handle: number) {
        this.callbacks.delete(handle);
      },
    };
    let aborted = 0;
    const watch = createUploadInactivityWatch({
      onAbort: () => {
        aborted += 1;
      },
      timers,
    });
    watch.start();
    expect(timers.callbacks.size).toBe(1);
    watch.noteByteTransferred();
    expect(timers.callbacks.size).toBe(1);
    const callback = [...timers.callbacks.values()][0];
    timers.callbacks.clear();
    callback?.();
    expect(aborted).toBe(1);
    watch.noteByteTransferred();
    expect(timers.callbacks.size).toBe(0);
  });

  it('P1-S04-AC-085..086 allows a one-time transfer callback but persists no signed URL', () => {
    const canonical = {
      id: '22222222-2222-4222-8222-222222222222',
      object: {
        id: '33333333-3333-4333-8333-333333333333',
        objectKey: 'server/generated/key',
        state: 'pending_upload' as const,
        version: '2',
      },
      upload: {
        method: 'PUT' as const,
        signedUrl: 'https://storage.example.test/secret-token',
        expiresAt: '2026-08-30T12:15:00.000Z',
        maxBytes: 20_000,
        allowedMediaTypes: ['image/png'],
      },
    };
    const view = createUploadAdmissionView(canonical);
    const serialized = serializeUploadAdmissionState({
      status: 'success',
      view,
    });
    expect(view.transfer.signedUrl).toBe(canonical.upload.signedUrl);
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('signedUrl');
    expect(serialized).toContain('expiresAt');
    expect(serialized).toContain('pending_upload');
  });

  it('fails closed for an unsafe server-generated object key', () => {
    expect(() =>
      createUploadAdmissionView({
        id: '22222222-2222-4222-8222-222222222222',
        object: {
          id: '33333333-3333-4333-8333-333333333333',
          objectKey: '../secret',
          state: 'pending_upload',
          version: '2',
        },
        upload: {
          method: 'PUT',
          signedUrl: 'https://storage.example.test/secret-token',
          expiresAt: '2026-08-30T12:15:00.000Z',
          maxBytes: 20_000,
          allowedMediaTypes: ['image/png'],
        },
      }),
    ).toThrow('Invalid upload intent object key');
  });

  it('fails closed for an unexpected response field instead of persisting provider data', () => {
    expect(() =>
      createUploadAdmissionView({
        id: '22222222-2222-4222-8222-222222222222',
        object: {
          id: '33333333-3333-4333-8333-333333333333',
          objectKey: 'objects/33333333-3333-4333-8333-333333333333',
          state: 'pending_upload',
          version: '2',
          rawPayload: 'never-copy',
        },
        upload: {
          method: 'PUT',
          signedUrl: 'https://storage.example.test/secret-token',
          expiresAt: '2026-08-30T12:15:00.000Z',
          maxBytes: 20_000,
          allowedMediaTypes: ['image/png'],
        },
      }),
    ).toThrow('Invalid upload intent response fields');
  });

  it('persists only safe status metadata when an error message is untrusted', () => {
    const serialized = serializeUploadAdmissionState({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'signedUrl=https://storage.example.test/secret-token',
      requestId: '33333333-3333-4333-8333-333333333333',
    });
    expect(serialized).toContain('INTERNAL_ERROR');
    expect(serialized).toContain('33333333-3333-4333-8333-333333333333');
    expect(serialized).not.toContain('signedUrl');
    expect(serialized).not.toContain('secret-token');
  });
});
