import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import {
  InfrastructureRecordSchema,
  JobStatusTransportSchema,
  OfflineIntentSchema,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import InfrastructureWorkbench from '../../apps/web/src/components/infrastructure/InfrastructureWorkbench';

const REQUEST_ID = '99999999-9999-4999-8999-999999999999';
const RECORD_ID = '22222222-2222-4222-8222-222222222222';
const JOB_ID = '11111111-1111-4111-8111-111111111111';
const AT = '2026-08-30T12:00:00.000Z';

const record = InfrastructureRecordSchema.parse({
  facts: { region: 'us-east' },
  id: RECORD_ID,
  label: 'Control plane',
  modifiedAt: AT,
  provenance: [],
  summary: 'Canonical infrastructure record.',
  version: '"2"',
});

const transport = JobStatusTransportSchema.parse({
  data: {
    id: JOB_ID,
    type: 'infrastructure.reconcile',
    state: 'running',
    progress: { completed: 2, total: 4, unit: 'items' },
    resultRef: null,
    error: null,
    createdAt: AT,
    updatedAt: AT,
  },
  etag: '"3"',
});

const refusedIntent = OfflineIntentSchema.parse({
  intentId: '33333333-3333-4333-8333-333333333333',
  operation: 'infrastructure.archive',
  targetId: RECORD_ID,
  localPayloadRef: 'local:44444444-4444-4444-8444-444444444444',
  payloadHash: `sha256:${'a'.repeat(64)}`,
  expectedVersion: '"2"',
  state: 'refused',
  refusal: {
    code: 'VERSION_MISMATCH',
    retryable: false,
    requestId: REQUEST_ID,
  },
  createdAt: AT,
  updatedAt: AT,
});

const baseProps = {
  access: 'read-only' as const,
  canonicalUrl: '/app/infrastructure',
  expectedVersion: record.version,
  query: {},
  requestId: REQUEST_ID,
  selectedId: RECORD_ID,
  variant: 'appPage' as const,
};

describe('server-first Workbench job integration', () => {
  it('keeps the existing Slice 02 surface unchanged when job props are absent', () => {
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        ...baseProps,
        initial: { record, status: 'success' },
      }),
    );

    expect(markup).toContain('Infrastructure record details');
    expect(markup).not.toContain('Infrastructure job');
    expect(markup).not.toContain('Offline intents');
    expect(markup).not.toContain('Canonical job status is current.');
    expect(markup).not.toContain('Upload admission');
    expect(markup).not.toContain('Provider and webhook evidence');
  });

  it('integrates provider evidence only from an explicit safe server projection', () => {
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        ...baseProps,
        initial: { record, status: 'success' },
        providerEvidence: {
          access: 'disabled',
          state: {
            status: 'disabled',
            filters: { provider: null, state: null },
            reason: 'No production provider is configured.',
          },
        },
      }),
    );

    expect(markup).toContain('Provider evidence');
    expect(markup).toContain('No production provider is configured.');
    expect(markup).not.toContain('provider secret');
    expect(markup).not.toContain('Replay webhook');
  });

  it('integrates upload admission only from an explicit server projection', () => {
    const uploadAdmission = {
      access: 'disabled' as const,
      capabilityReason:
        'Production object storage admission is not configured.',
      initialDraft: {
        targetType: '',
        targetId: '',
        purpose: '',
        mediaType: '',
        byteSize: '' as const,
        checksum: { algorithm: 'sha256', value: '' },
        idempotencyKey: '',
        ifMatch: '',
      },
      policy: {
        targetTypes: [],
        purposes: [],
        allowedMediaTypes: [],
        maxBytes: 1,
        requiresIfMatch: true,
      },
    };
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        ...baseProps,
        initial: { record, status: 'success' },
        uploadAdmission,
      }),
    );

    expect(markup).toContain('Upload admission');
    expect(markup).toContain(
      'Production object storage admission is not configured.',
    );
    expect(markup).not.toContain('signedUrl');
    expect(markup).not.toContain('https://');

    const hiddenMarkup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        ...baseProps,
        initial: { record, status: 'success' },
        uploadAdmission: { ...uploadAdmission, access: 'not-rendered' },
      }),
    );
    expect(hiddenMarkup).not.toContain('Upload admission');
  });

  it('renders validated job, offline refusal, realtime, and retry countdown props', () => {
    const markup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        ...baseProps,
        initial: { record, status: 'success' },
        jobStatus: transport,
        jobRequestId: REQUEST_ID,
        offlineConnectivity: 'offline',
        offlineIntents: [refusedIntent],
        realtimeState: 'stale',
        realtimeRequestId: REQUEST_ID,
        jobRetryAfterSeconds: 5,
      }),
    );

    expect(markup).toContain('Infrastructure job');
    expect(markup).toContain(JOB_ID);
    expect(markup).toContain('Offline intents');
    expect(markup).toContain('Connectivity: offline');
    expect(markup).toContain('Refused: <code>VERSION_MISMATCH</code>');
    expect(markup).toContain(
      'A change hint arrived. Canonical job status will be refreshed.',
    );

    const rateLimitedMarkup = renderToStaticMarkup(
      React.createElement(InfrastructureWorkbench, {
        ...baseProps,
        initial: { record, status: 'success' },
        jobStatus: {
          status: 'error',
          error: {
            code: 'RATE_LIMITED',
            details: {},
            message: 'The server asked us to wait.',
            requestId: REQUEST_ID,
          },
          retryable: false,
        },
        jobRequestId: REQUEST_ID,
        jobRetryAfterSeconds: 5,
      }),
    );
    expect(rateLimitedMarkup).toContain('Retry available in 5 seconds.');
  });
});
