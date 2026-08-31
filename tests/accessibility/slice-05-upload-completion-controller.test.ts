import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it, vi } from 'vitest';

import {
  focusFirstInvalidUploadCompletionField,
  useUploadCompletionForm,
  type UseUploadCompletionFormInput,
} from '../../apps/web/src/components/infrastructure/upload-completion/useUploadCompletionForm';
import { uploadCompletionFieldId } from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-navigation';
import {
  createUploadCompletionProjection,
  type UploadCompletionDraft,
  type UploadCompletionState,
} from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-state';

const INTENT_ID = '11111111-1111-4111-8111-111111111111';
const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';
const AT = '2026-08-30T12:00:00.000Z';
const draft: UploadCompletionDraft = {
  uploadIntentId: INTENT_ID,
  byteSize: 12000,
  mediaType: 'image/png',
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  idempotencyKey: 'completion-123',
  ifMatch: '"2"',
};
const policy = {
  allowedMediaTypes: ['image/png'],
  maxBytes: 20000,
  requiresIfMatch: true,
} as const;
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

const hookRender = (
  input: UseUploadCompletionFormInput,
  run: (
    result: ReturnType<typeof useUploadCompletionForm>,
  ) => void | Promise<void>,
): Promise<void>[] => {
  const pending: Promise<void>[] = [];
  let called = false;
  function Probe() {
    const result = useUploadCompletionForm(input);
    if (!called) {
      called = true;
      const operation = run(result);
      if (operation !== undefined) pending.push(operation);
    }
    return React.createElement('span');
  }
  renderToStaticMarkup(React.createElement(Probe));
  return pending;
};

const eventFor = (name: string, value: string) =>
  ({ currentTarget: { name, value } }) as never;

describe('Slice 05 upload-completion controller evidence', () => {
  it('focuses the first server-owned validation field after render', async () => {
    const focus = vi.fn();
    vi.stubGlobal('document', {
      getElementById: (id: string) =>
        id === uploadCompletionFieldId('byteSize') ? { focus } : null,
    });
    const validation: UploadCompletionState = {
      status: 'validation_error',
      draft,
      violations: [{ field: 'byteSize', code: 'positive', message: 'invalid' }],
    };
    focusFirstInvalidUploadCompletionField(validation);
    await Promise.resolve();
    expect(focus).toHaveBeenCalledOnce();
    focusFirstInvalidUploadCompletionField({ status: 'idle', draft });
    focusFirstInvalidUploadCompletionField({
      status: 'validation_error',
      draft,
      violations: [],
    });
    vi.unstubAllGlobals();
  });

  it('covers every named field updater through the bounded hook seam', () => {
    for (const [name, value] of [
      ['uploadIntentId', INTENT_ID],
      ['byteSize', '13000'],
      ['byteSize', ''],
      ['mediaType', 'image/jpeg'],
      ['checksum.algorithm', 'sha256'],
      ['checksum.value', 'b'.repeat(64)],
      ['idempotencyKey', 'completion-456'],
      ['ifMatch', '"3"'],
      ['unknown', 'ignored'],
    ]) {
      hookRender({ access: 'full', policy, initialDraft: draft }, (result) =>
        result.update(eventFor(name, value)),
      );
    }
  });

  it('covers validation, offline, unavailable, accepted, rejected, and disabled submissions', async () => {
    const invalidPromises = hookRender(
      {
        access: 'full',
        policy,
        initialDraft: { ...draft, byteSize: '' },
      },
      (result) => result.submit({ preventDefault: () => undefined } as never),
    );
    await Promise.all(invalidPromises);

    vi.stubGlobal('navigator', { onLine: false });
    const offlinePromises = hookRender(
      { access: 'full', policy, initialDraft: draft },
      (result) => result.submit({ preventDefault: () => undefined } as never),
    );
    await Promise.all(offlinePromises);
    vi.unstubAllGlobals();
    vi.stubGlobal('navigator', { onLine: true });

    const unavailablePromises = hookRender(
      { access: 'full', policy, initialDraft: draft },
      (result) => result.submit({ preventDefault: () => undefined } as never),
    );
    await Promise.all(unavailablePromises);

    const accepted: UseUploadCompletionFormInput = {
      access: 'full',
      policy,
      initialDraft: draft,
      onSubmit: async () => completion,
    };
    await Promise.all(
      hookRender(accepted, (result) =>
        result.submit({ preventDefault: () => undefined } as never),
      ),
    );
    await Promise.resolve();

    const rejected: UseUploadCompletionFormInput = {
      ...accepted,
      onSubmit: async () => {
        throw new Error('DEPENDENCY_UNAVAILABLE');
      },
    };
    await Promise.all(
      hookRender(rejected, (result) =>
        result.submit({ preventDefault: () => undefined } as never),
      ),
    );
    await Promise.resolve();

    const unknownRejected: UseUploadCompletionFormInput = {
      ...accepted,
      onSubmit: async () => {
        throw 'unknown failure';
      },
    };
    await Promise.all(
      hookRender(unknownRejected, (result) =>
        result.submit({ preventDefault: () => undefined } as never),
      ),
    );
    await Promise.resolve();
    vi.unstubAllGlobals();

    for (const status of ['loading', 'success', 'conflict'] as const) {
      const state: UploadCompletionState =
        status === 'loading'
          ? { status, draft, startedAt: AT, preserveDraft: true }
          : status === 'success'
            ? { status, draft, completion }
            : { status, draft, currentVersion: '"4"', requestId: '' };
      await Promise.all(
        hookRender(
          { access: 'full', policy, initialDraft: draft, initialState: state },
          (result) =>
            result.submit({ preventDefault: () => undefined } as never),
        ),
      );
    }
  });
});
