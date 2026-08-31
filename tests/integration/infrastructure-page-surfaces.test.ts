import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import InfrastructureWorkbench from '../../apps/web/src/components/infrastructure/InfrastructureWorkbench';
import {
  createInfrastructureSurfaceProjection,
  type InfrastructureSurfaceSeeds,
} from '../../apps/web/src/server/infrastructure-surface-projection';

const ROOT = resolve(import.meta.dirname, '../..');
const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const RECORD_ID = '11111111-1111-4111-8111-111111111111';

const seeds: InfrastructureSurfaceSeeds = {
  uploadAdmission: {
    access: 'disabled',
    capabilityReason: 'Server-selected upload admission.',
    initialDraft: {
      targetType: 'infrastructure.record',
      targetId: RECORD_ID,
      purpose: 'media',
      mediaType: 'image/png',
      byteSize: '',
      checksum: { algorithm: 'sha256', value: '' },
      idempotencyKey: '',
      ifMatch: '"2"',
    },
    policy: {
      targetTypes: ['infrastructure.record'],
      purposes: ['media'],
      allowedMediaTypes: ['image/png'],
      maxBytes: 2_000_000,
      requiresIfMatch: true,
    },
  },
  uploadCompletion: {
    access: 'disabled',
    initialDraft: {
      uploadIntentId: RECORD_ID,
      byteSize: '',
      mediaType: 'image/png',
      checksum: { algorithm: 'sha256', value: '' },
      idempotencyKey: '',
      ifMatch: '"2"',
    },
    policy: {
      allowedMediaTypes: ['image/png'],
      maxBytes: 2_000_000,
      requiresIfMatch: true,
    },
  },
  providerEvidence: {
    access: 'disabled',
    state: {
      status: 'idle',
      filters: { provider: null, state: null },
    },
  },
};

describe('server-owned infrastructure page surfaces', () => {
  it('returns a disclosure-safe hidden projection before route read authorization', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: [],
      seeds,
    });

    expect(projection).toEqual({
      access: 'not-rendered',
      endpoints: {
        uploadAdmission: '/api/v1/upload-intents',
        uploadCompletion: '/api/v1/upload-intents/{uploadIntentId}/complete',
        providerEvidence:
          '/app/infrastructure/provider-operations/{operationId}',
      },
    });
  });

  it('projects every authorized surface from explicit capabilities and keeps canonical endpoints', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: [
        'infrastructure.read',
        'infrastructure.upload.admit',
        'infrastructure.upload.complete',
        'infrastructure.provider.evidence:case',
      ],
      seeds,
    });

    expect(projection.access).toBe('read-only');
    expect(projection.uploadAdmission?.access).toBe('full');
    expect(projection.uploadCompletion?.access).toBe('full');
    expect(projection.providerEvidence?.access).toBe('staff-case-scoped');
    expect(projection.endpoints).toEqual({
      uploadAdmission: '/api/v1/upload-intents',
      uploadCompletion: '/api/v1/upload-intents/{uploadIntentId}/complete',
      providerEvidence: '/app/infrastructure/provider-operations/{operationId}',
    });
    expect(JSON.stringify(projection)).not.toContain('signedUrl');
    expect(JSON.stringify(projection)).not.toContain('providerSecret');
    expect(JSON.stringify(projection)).not.toContain(REQUEST_ID);
  });

  it('renders the authorized projection through the Workbench without provider data', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: [
        'infrastructure.read',
        'infrastructure.upload.admit',
        'infrastructure.upload.complete',
        'infrastructure.provider.evidence:case',
      ],
      seeds,
    });
    const record = {
      facts: {},
      id: RECORD_ID,
      label: 'Infrastructure upload target',
      modifiedAt: '2026-08-30T12:00:00.000Z',
      provenance: [],
      summary: 'Server-owned record projection.',
      version: '"2"',
    } as const;
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        access: projection.access,
        canonicalUrl: '/app/infrastructure',
        expectedVersion: record.version,
        initial: { record, status: 'success' },
        query: {},
        requestId: REQUEST_ID,
        selectedId: RECORD_ID,
        variant: 'appPage',
        uploadAdmission: projection.uploadAdmission,
        uploadCompletion: projection.uploadCompletion,
        providerEvidence: projection.providerEvidence,
      }),
    );

    expect(markup).toContain('Upload admission');
    expect(markup).toContain('Upload completion');
    expect(markup).toContain('Provider operation evidence');
    expect(markup).not.toContain('providerSecret');
    expect(markup).not.toContain('signedUrl');
  });

  it('omits denied surfaces and does not invent data for the default read context', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: ['infrastructure.read'],
    });

    expect(projection.access).toBe('read-only');
    expect(projection.uploadAdmission).toBeUndefined();
    expect(projection.uploadCompletion).toBeUndefined();
    expect(projection.providerEvidence).toBeUndefined();
    expect(JSON.stringify(projection)).not.toContain(RECORD_ID);
  });

  it('renders a truthful disabled seam when capability is granted but configuration is absent', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: [
        'infrastructure.read',
        'infrastructure.upload.admit',
        'infrastructure.upload.complete',
        'infrastructure.provider.evidence:any',
      ],
    });

    expect(projection.uploadAdmission?.access).toBe('disabled');
    expect(projection.uploadAdmission?.initialState).toMatchObject({
      status: 'disabled',
    });
    expect(projection.uploadCompletion?.access).toBe('disabled');
    expect(projection.uploadCompletion?.initialState).toMatchObject({
      status: 'disabled',
    });
    expect(projection.providerEvidence?.access).toBe('disabled');
    expect(projection.providerEvidence?.state).toMatchObject({
      status: 'disabled',
    });
  });

  it('preserves a server-selected partial-hidden upload policy', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: [
        'infrastructure.read',
        'infrastructure.upload.admit:partial',
      ],
      seeds,
    });

    expect(projection.access).toBe('read-only');
    expect(projection.uploadAdmission?.access).toBe('partial-hidden');
    expect(projection.uploadCompletion).toBeUndefined();
    expect(projection.providerEvidence).toBeUndefined();
  });

  it('maps the canonical evidence capability to read-only evidence', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: ['infrastructure.read', 'infrastructure.provider.evidence'],
      seeds,
    });

    expect(projection.providerEvidence?.access).toBe('read-only');
  });

  it('widens only the Workbench access when a separate write capability is present', () => {
    const projection = createInfrastructureSurfaceProjection({
      capabilities: ['infrastructure.read', 'infrastructure.write'],
    });

    expect(projection.access).toBe('full');
    expect(projection.uploadAdmission).toBeUndefined();
    expect(projection.uploadCompletion).toBeUndefined();
    expect(projection.providerEvidence).toBeUndefined();
  });

  it('mounts the server projection on both protected infrastructure pages', () => {
    for (const relativePath of [
      'apps/web/src/pages/app/infrastructure/index.astro',
      'apps/web/src/pages/app/infrastructure/[recordId].astro',
    ]) {
      const source = readFileSync(resolve(ROOT, relativePath), 'utf8');
      expect(source).toContain('createInfrastructureSurfaceProjection');
      expect(source).toContain('access={surface.access}');
      expect(source).toContain('uploadAdmission: surface.uploadAdmission');
      expect(source).toContain('uploadCompletion: surface.uploadCompletion');
      expect(source).toContain('providerEvidence: surface.providerEvidence');
      expect(source).not.toContain('access="read-only"');
    }
  });
});
