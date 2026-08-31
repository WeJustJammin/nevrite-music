import { describe, expect, it, vi } from 'vitest';

import {
  createUploadIntent,
  validateUploadAdmission,
  type UploadAdmissionUseCaseInput,
} from './index.ts';

const ACTOR_ID = '11111111-1111-4111-8111-111111111111';
const PARTY_ID = '22222222-2222-4222-8222-222222222222';
const TARGET_ID = '33333333-3333-4333-8333-333333333333';
const INTENT_ID = '44444444-4444-4444-8444-444444444444';
const OBJECT_ID = '55555555-5555-4555-8555-555555555555';
const HASH = 'a'.repeat(64);

const policy = {
  'infrastructure.record': {
    targetType: 'infrastructure.record',
    purposes: ['cover-art'],
    allowedMediaTypes: ['image/png'],
    maxBytes: 10_000,
    immutable: false,
  },
} as const;

const request = {
  headers: {
    contentType: 'application/json',
    idempotencyKey: 'upload-security-key',
    ifMatch: '"2"',
  },
  body: {
    targetType: 'infrastructure.record',
    targetId: TARGET_ID,
    purpose: 'cover-art',
    mediaType: 'IMAGE/PNG',
    byteSize: 512,
    checksum: { algorithm: 'sha256', value: HASH },
  },
} as const;

const makeInput = (
  overrides: Partial<UploadAdmissionUseCaseInput> = {},
): UploadAdmissionUseCaseInput => ({
  request,
  session: { userId: ACTOR_ID },
  policies: policy,
  authorization: {
    authorize: vi.fn(async () => ({
      kind: 'allow' as const,
      actorId: ACTOR_ID,
      actingPartyId: PARTY_ID,
      targetVersion: '"2"',
    })),
  },
  digest: { digest: vi.fn(async () => HASH) },
  persistence: {
    readIdempotency: vi.fn(async () => null),
    commitUploadIntent: vi.fn(async () => ({
      kind: 'committed' as const,
      metadata: {
        intentId: INTENT_ID,
        objectId: OBJECT_ID,
        objectKey: `uploads/${PARTY_ID}/${OBJECT_ID}`,
        objectVersion: '1',
        expiresAt: '2026-08-30T13:15:00.000Z',
        maxBytes: 10_000,
        allowedMediaTypes: ['image/png'],
      },
    })),
  },
  signer: {
    sign: vi.fn(async () => ({
      signedUrl: `https://storage.example/upload/${OBJECT_ID}`,
    })),
    revoke: vi.fn(async () => undefined),
  },
  ids: {
    next: vi.fn((kind: 'upload_intent' | 'object_record') =>
      kind === 'upload_intent' ? INTENT_ID : OBJECT_ID,
    ),
  },
  objectKeys: {
    create: vi.fn(() => `uploads/${PARTY_ID}/${OBJECT_ID}`),
  },
  clock: { now: vi.fn(() => '2026-08-30T13:00:00.000Z') },
  ...overrides,
});

describe('upload admission security contracts', () => {
  it('uses immutable policy semantics for the If-Match requirement', () => {
    const immutablePolicies = {
      'infrastructure.record': {
        ...policy['infrastructure.record'],
        immutable: true,
      },
    };
    const withoutIfMatch = {
      ...request,
      headers: {
        contentType: 'application/json',
        idempotencyKey: 'upload-immutable-key',
      },
    };

    expect(
      validateUploadAdmission({
        request: withoutIfMatch,
        policies: immutablePolicies,
      }),
    ).toMatchObject({ kind: 'valid', value: { ifMatch: null } });
    expect(
      validateUploadAdmission({
        request: withoutIfMatch,
        policies: { 'infrastructure.record': policy['infrastructure.record'] },
      }),
    ).toMatchObject({ kind: 'invalid', code: 'INVALID_REQUEST' });
  });

  it('binds request digest to route, authority, target, and expected version', async () => {
    const digestInputs: string[] = [];
    const input = makeInput({
      digest: {
        digest: vi.fn(async (value: string) => {
          digestInputs.push(value);
          return HASH;
        }),
      },
    });

    expect(await createUploadIntent(input)).toMatchObject({ kind: 'created' });
    const requestHashInput = JSON.parse(digestInputs[1] ?? '{}') as {
      operationId?: string;
      method?: string;
      path?: string;
      actorId?: string;
      actingPartyId?: string;
      expectedVersion?: string | null;
      contractMajorVersion?: number;
      request?: Record<string, unknown>;
    };
    expect(requestHashInput).toMatchObject({
      operationId: 'upload-intent.create',
      method: 'POST',
      path: '/api/v1/upload-intents',
      actorId: ACTOR_ID,
      actingPartyId: PARTY_ID,
      expectedVersion: '"2"',
      contractMajorVersion: 1,
      request: {
        targetType: 'infrastructure.record',
        targetId: TARGET_ID,
        purpose: 'cover-art',
        mediaType: 'image/png',
        byteSize: 512,
        checksum: { algorithm: 'sha256', value: HASH },
      },
    });
  });
});
