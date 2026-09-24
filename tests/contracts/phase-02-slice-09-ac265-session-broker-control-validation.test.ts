import { describe, it } from 'vitest';

import {
  Ac265SessionBrokerAuthorizeRequestSchema,
  Ac265SessionBrokerAuthorizeResultSchema,
  Ac265SessionBrokerResolveRequestSchema,
  Ac265SessionBrokerResolveResultSchema,
  Ac265SessionBrokerTeardownRequestSchema,
  Ac265SessionBrokerTeardownResultSchema,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-session-broker-control.ts';
import {
  authorizeRequest,
  authorizeResult,
  expectRejected,
  resolveRequest,
  resolveResult,
  teardownRequest,
  teardownResult,
  uuidForIndex,
} from './ac265-session-broker-control.test-support.ts';

describe('AC265 session broker control contract validation', () => {
  it('rejects handle references that are not the locked staging role shape', () => {
    const rejectedReferences = [
      '',
      'ac265-session://owner_full',
      `ac265-session://owner_full/${uuidForIndex(1)}/extra`,
      `ac265-session://owner_full/${uuidForIndex(1)}?token=secret`,
      `ac265-session://owner_full/${uuidForIndex(1)}#fragment`,
      `ac265-session://production/owner_full/${uuidForIndex(1)}`,
      'ac265-session://owner_full/not-a-uuid',
      'ac265-session://owner_full/30000000-0000-3000-8000-000000000001',
      'ac265-session://owner_full/30000000-0000-4000-0000-000000000001',
      'ac265-session://OWNER_FULL/30000000-0000-4000-8000-000000000001',
      'ac265-session://role/30000000-0000-4000-8000-000000000001',
      'https://example.test/owner_full/30000000-0000-4000-8000-000000000001',
    ];
    for (const handleRef of rejectedReferences)
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        handleRef,
      });
  });

  it('rejects session-state material anywhere in the contract', () => {
    const forbidden = [
      { cookies: [] },
      { storageState: { cookies: [], origins: [] } },
      { storage_state: '{"cookies":[]}' },
      { accessToken: 'redacted' },
      { refreshToken: 'redacted' },
      { session: { access_token: 'redacted' } },
      { material: '{"cookies":[]}' },
      { materialBytes: `ey${'JhbGciOiJIUzI1NiJ9'}` },
    ];
    for (const injected of forbidden) {
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerTeardownRequestSchema, {
        ...teardownRequest,
        ...injected,
      });
    }
  });

  it('rejects material references that are not opaque staging references', () => {
    for (const materialRef of [
      '',
      'ac265-session-material://staging',
      `ac265-session-material://production/${uuidForIndex(1)}`,
      `ac265-session-material://staging/${uuidForIndex(1)}/extra`,
      'ac265-session-material://staging/not-a-uuid',
      'ac265-session://owner_full/30000000-0000-4000-8000-000000000001',
      'https://storage.example.test/material.json',
    ])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        materialRef,
      });
  });

  it('rejects unauthorized criterion, version, environment, and project drift', () => {
    for (const criterion of ['P2-S09-AC-264', 'P2-S09-AC-266', ''])
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        criterion,
      });
    for (const schemaVersion of [
      'ac265-hosted-session-broker-control-v2',
      'ac265-hosted-outage-lease-control-v1',
      '',
    ])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        schemaVersion,
      });
    for (const environment of ['production', 'local', ''])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        environment,
      });
    for (const hostingProjectId of ['wejammin-production', 'other', ''])
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        hostingProjectId,
      });
  });

  it('rejects non-canonical digests, references, and identity values', () => {
    for (const identity of ['B'.repeat(64), 'b'.repeat(63), 'b'.repeat(65), ''])
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        identitySha256: identity,
      });
    for (const handleSha256 of ['C'.repeat(64), 'c'.repeat(63), ''])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        handleSha256,
      });
    for (const authorization of [
      '',
      'ac265-authorization://production/20000000-0000-4000-8000-000000000002',
      'ac265-authorization://staging/not-a-uuid',
      `ac265-authorization://staging/${uuidForIndex(2)}?token=secret`,
    ])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        authorizationRef: authorization,
      });
    for (const run of ['', 'not-a-uuid', '10000000-0000-4000-8000-00000000000'])
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        runId: run,
      });
  });

  it('rejects unknown members on every request and result', () => {
    for (const injected of [
      { unknown: true },
      { runner: 'other' },
      { identity: {} },
      { resolvedMaterial: 'redacted' },
    ]) {
      expectRejected(Ac265SessionBrokerAuthorizeRequestSchema, {
        ...authorizeRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerAuthorizeResultSchema, {
        ...authorizeResult,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerResolveRequestSchema, {
        ...resolveRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerResolveResultSchema, {
        ...resolveResult,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerTeardownRequestSchema, {
        ...teardownRequest,
        ...injected,
      });
      expectRejected(Ac265SessionBrokerTeardownResultSchema, {
        ...teardownResult,
        ...injected,
      });
    }
  });
});
