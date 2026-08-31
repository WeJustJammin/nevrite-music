import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { InfrastructureRecordSchema } from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import InfrastructureWorkbench from '../../apps/web/src/components/infrastructure/InfrastructureWorkbench';
import type { UploadCompletionDraft } from '../../apps/web/src/components/infrastructure/upload-completion/upload-completion-state';

const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const INTENT_ID = '11111111-1111-4111-8111-111111111111';
const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const AT = '2026-08-30T12:00:00.000Z';

const draft: UploadCompletionDraft = {
  uploadIntentId: INTENT_ID,
  byteSize: 12000,
  mediaType: 'image/png',
  checksum: { algorithm: 'sha256', value: 'a'.repeat(64) },
  idempotencyKey: 'completion-123',
  ifMatch: '"2"',
};

describe('Slice 05 upload-completion Workbench seam', () => {
  it('renders only when the server supplies the explicit completion prop', () => {
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
          initialDraft: draft,
          initialState: {
            status: 'disabled',
            draft,
            reason: 'Production upload completion is disabled.',
          },
          policy: {
            allowedMediaTypes: ['image/png'],
            maxBytes: 20000,
            requiresIfMatch: true,
            persona: 'paid',
          },
        },
      }),
    );

    expect(markup).toContain('Upload completion');
    expect(markup).toContain('Production upload completion is disabled');
    expect(markup).toContain('data-access-variant="disabled"');
    expect(markup).not.toContain('signedUrl');
    expect(markup).not.toContain('providerSecret');
  });
});
