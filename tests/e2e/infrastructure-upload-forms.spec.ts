import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '33333333-3333-4333-8333-333333333333';
const REQUEST_AT = '2026-08-30T12:00:00.000Z';

const mountFixtureDocument = async (page: Page): Promise<void> => {
  // The production routes are server-authenticated. Reuse their loaded Astro
  // dev preamble, then replace the document with a deterministic, isolated
  // fixture whose props represent a server-authorized projection.
  await page.goto('/system/degraded', { waitUntil: 'domcontentloaded' });
  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Current infrastructure records',
    }),
  ).toBeVisible();
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>Controlled upload fixture</title></head><body><main><div id="upload-form-fixture"></div></main></body></html>',
  );
};

const mountAdmission = async (
  page: Page,
  options: { readonly invalid?: boolean } = {},
): Promise<void> => {
  await page.evaluate(async (invalid) => {
    const ReactModule = await import('/node_modules/.vite/deps/react.js');
    const React = ReactModule.default ?? ReactModule;
    const ReactDomModule =
      await import('/node_modules/.vite/deps/react-dom_client.js');
    const createRoot =
      ReactDomModule.createRoot ?? ReactDomModule.default?.createRoot;
    if (typeof createRoot !== 'function')
      throw new Error('React DOM createRoot is unavailable');
    const { UploadAdmissionForm } =
      await import('/src/components/infrastructure/upload-admission/UploadAdmissionForm.tsx');
    const draft = invalid
      ? {
          targetType: '',
          targetId: 'not-a-uuid',
          purpose: '',
          mediaType: 'text/plain',
          byteSize: 0,
          checksum: { algorithm: 'sha1', value: 'BAD' },
          idempotencyKey: 'short',
          ifMatch: '2',
        }
      : {
          targetType: 'infrastructure.record',
          targetId: '11111111-1111-4111-8111-111111111111',
          purpose: 'cover_art',
          mediaType: 'image/png',
          byteSize: 12000,
          checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
          idempotencyKey: 'admission-123',
          ifMatch: '"2"',
        };
    const state = globalThis as unknown as Record<string, unknown>;
    state.__wejamminAdmissionSubmitCount = 0;
    state.__wejamminAdmissionTransferName = '';
    const rootElement = document.querySelector('#upload-form-fixture');
    if (!(rootElement instanceof HTMLElement))
      throw new Error('Upload admission fixture root is unavailable');
    createRoot(rootElement).render(
      React.createElement(UploadAdmissionForm, {
        access: 'full',
        initialDraft: draft,
        policy: {
          targetTypes: ['infrastructure.record'],
          purposes: ['cover_art'],
          allowedMediaTypes: ['image/png'],
          maxBytes: 20000,
          requiresIfMatch: true,
        },
        ...(invalid
          ? {}
          : {
              onSubmit: async () => {
                state.__wejamminAdmissionSubmitCount =
                  Number(state.__wejamminAdmissionSubmitCount ?? 0) + 1;
                return {
                  id: '44444444-4444-4444-8444-444444444444',
                  object: {
                    id: '55555555-5555-4555-8555-555555555555',
                    objectKey: 'server/generated/key',
                    state: 'pending_upload',
                    version: '2',
                  },
                  transfer: {
                    method: 'PUT',
                    signedUrl: 'https://storage.example.test/secret-token',
                    expiresAt: '2026-08-30T12:15:00.000Z',
                    maxBytes: 20000,
                    allowedMediaTypes: ['image/png'],
                  },
                };
              },
              onTransfer: async (_view: unknown, file?: File) => {
                state.__wejamminAdmissionTransferName = file?.name ?? '';
              },
            }),
      }),
    );
  }, options.invalid === true);
  await expect(
    page.getByRole('heading', { level: 2, name: 'Upload admission' }),
  ).toBeVisible();
};

const mountCompletion = async (page: Page): Promise<void> => {
  await page.evaluate(
    async ({ jobId, objectId, requestAt }) => {
      const ReactModule = await import('/node_modules/.vite/deps/react.js');
      const React = ReactModule.default ?? ReactModule;
      const ReactDomModule =
        await import('/node_modules/.vite/deps/react-dom_client.js');
      const createRoot =
        ReactDomModule.createRoot ?? ReactDomModule.default?.createRoot;
      if (typeof createRoot !== 'function')
        throw new Error('React DOM createRoot is unavailable');
      const { UploadCompletionForm } =
        await import('/src/components/infrastructure/upload-completion/UploadCompletionForm.tsx');
      const state = globalThis as unknown as Record<string, unknown>;
      state.__wejamminCompletionSubmitCount = 0;
      const rootElement = document.querySelector('#upload-form-fixture');
      if (!(rootElement instanceof HTMLElement))
        throw new Error('Upload completion fixture root is unavailable');
      createRoot(rootElement).render(
        React.createElement(UploadCompletionForm, {
          access: 'full',
          initialDraft: {
            uploadIntentId: '11111111-1111-4111-8111-111111111111',
            byteSize: 12000,
            mediaType: 'image/png',
            checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
            idempotencyKey: 'completion-123',
            ifMatch: '"2"',
          },
          policy: {
            allowedMediaTypes: ['image/png'],
            maxBytes: 20000,
            requiresIfMatch: true,
            persona: 'creator',
            capabilityLabel: 'object.upload.complete',
            stepUpVerified: true,
            auditedReason: 'User-requested cover art upload',
          },
          onSubmit: async () => {
            state.__wejamminCompletionSubmitCount =
              Number(state.__wejamminCompletionSubmitCount ?? 0) + 1;
            return {
              status: 202,
              location: `/api/v1/jobs/${jobId}`,
              etag: '"3"',
              job: {
                id: jobId,
                type: 'platform.object.verify',
                state: 'queued',
                progress: null,
                resultRef: null,
                error: null,
                createdAt: requestAt,
                updatedAt: requestAt,
              },
              objectId,
              objectState: 'uploaded',
              replayed: false,
              dispatch: 'sent',
            };
          },
        }),
      );
    },
    { jobId: JOB_ID, objectId: OBJECT_ID, requestAt: REQUEST_AT },
  );
  await expect(
    page.getByRole('heading', { level: 2, name: 'Upload completion' }),
  ).toBeVisible();
};

const expectFixtureAxeClean = async (page: Page): Promise<void> => {
  const results = await new AxeBuilder({ page })
    .include('#upload-form-fixture')
    .analyze();
  expect(results.violations).toEqual([]);
};

test('controlled upload admission validation stays keyboard reachable and axe-clean', async ({
  page,
}) => {
  await mountFixtureDocument(page);
  await mountAdmission(page, { invalid: true });

  const submit = page.getByRole('button', {
    name: 'Request upload intent',
    exact: true,
  });
  await submit.press('Enter');

  await expect(
    page.getByRole('alert').getByRole('heading', {
      name: 'Check the highlighted fields.',
    }),
  ).toBeVisible();
  await expect(page.getByLabel('Target type', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Target type', { exact: true })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expectFixtureAxeClean(page);
});

test('controlled upload admission reaches success and transfer through keyboard interaction', async ({
  page,
}) => {
  await mountFixtureDocument(page);
  await mountAdmission(page);

  await page
    .getByRole('button', { name: 'Request upload intent', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Upload admission accepted' }),
  ).toBeFocused();
  await expect(
    page.getByText('Transfer selected file', { exact: true }),
  ).toBeDisabled();
  await expectFixtureAxeClean(page);

  await page.getByLabel('File to transfer', { exact: true }).setInputFiles({
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: Buffer.from('controlled browser fixture'),
  });
  await expect(page.getByText('Selected file: cover.png')).toBeVisible();
  const transfer = page.getByRole('button', {
    name: 'Transfer selected file',
    exact: true,
  });
  await transfer.press('Enter');
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (globalThis as unknown as Record<string, unknown>)
            .__wejamminAdmissionTransferName,
      ),
    )
    .toBe('cover.png');
  await expectFixtureAxeClean(page);
  expect(
    await page.evaluate(
      () =>
        (globalThis as unknown as Record<string, unknown>)
          .__wejamminAdmissionSubmitCount,
    ),
  ).toBe(1);
});

test('controlled upload completion validation and success transitions keep focus and axe clean', async ({
  page,
}) => {
  await mountFixtureDocument(page);
  await mountCompletion(page);

  const byteSize = page.getByLabel('Byte size', { exact: true });
  await byteSize.fill('');
  await page
    .getByRole('button', {
      name: 'Complete upload and start verification',
      exact: true,
    })
    .press('Enter');

  await expect(
    page.getByRole('alert').getByRole('heading', {
      name: 'Check the highlighted completion fields.',
    }),
  ).toBeVisible();
  await expect(byteSize).toBeFocused();
  await expectFixtureAxeClean(page);

  await byteSize.fill('12000');
  await page
    .getByRole('button', {
      name: 'Complete upload and start verification',
      exact: true,
    })
    .press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Verification job' }),
  ).toBeFocused();
  await expectFixtureAxeClean(page);
  expect(
    await page.evaluate(
      () =>
        (globalThis as unknown as Record<string, unknown>)
          .__wejamminCompletionSubmitCount,
    ),
  ).toBe(1);
});
