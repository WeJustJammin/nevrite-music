import { describe, expect, it } from 'vitest';

import {
  OBJECT_UPLOADED_EVENT_TYPE,
  OBJECT_UPLOADED_SCHEMA_VERSION,
  OBJECT_VERIFICATION_JOB_TYPE,
  OBJECT_VERIFICATION_QUEUE,
  ObjectLifecycleStateSchema,
  ObjectUploadedEventSchema,
  ObjectUploadedQueueEnvelopeSchema,
  StorageObjectMetadataSchema,
  UploadCompletionHeadersSchema,
  UploadCompletionRequestSchema,
} from './upload-completion.ts';

const INTENT_ID = '11111111-1111-4111-8111-111111111111';
const OBJECT_ID = '22222222-2222-4222-8222-222222222222';
const ACTOR_ID = '33333333-3333-4333-8333-333333333333';
const PARTY_ID = '44444444-4444-4444-8444-444444444444';
const EVENT_ID = '55555555-5555-4555-8555-555555555555';
const CORRELATION_ID = '66666666-6666-4666-8666-666666666666';
const CHECKSUM = 'a'.repeat(64);

const validBody = {
  byteSize: 512,
  checksum: { algorithm: 'sha256', value: CHECKSUM },
  mediaType: 'AUDIO/MPEG',
};

const validRequest = {
  body: validBody,
  headers: {
    contentType: 'application/json',
    idempotencyKey: 'complete-key-1',
    ifMatch: '"7"',
  },
  uploadIntentId: INTENT_ID,
};

const validObserved = {
  byteSize: 512,
  checksum: { algorithm: 'sha256', value: CHECKSUM },
  mediaType: 'audio/mpeg',
  objectKey: `objects/${OBJECT_ID}`,
};

describe('upload completion contracts', () => {
  it('normalizes MIME input and keeps the completion request strict', () => {
    expect(UploadCompletionRequestSchema.parse(validRequest)).toEqual({
      body: {
        ...validBody,
        mediaType: 'audio/mpeg',
      },
      headers: validRequest.headers,
      uploadIntentId: INTENT_ID,
    });

    expect(
      UploadCompletionRequestSchema.safeParse({
        ...validRequest,
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      UploadCompletionRequestSchema.safeParse({
        ...validRequest,
        body: { ...validBody, extra: true },
      }).success,
    ).toBe(false);
  });

  it('enforces positive safe size, SHA-256 shape, exact ETag, and required key', () => {
    for (const body of [
      { ...validBody, byteSize: 0 },
      { ...validBody, byteSize: Number.MAX_SAFE_INTEGER + 1 },
      {
        ...validBody,
        checksum: { algorithm: 'md5', value: CHECKSUM },
      },
      {
        ...validBody,
        checksum: { algorithm: 'sha256', value: CHECKSUM.toUpperCase() },
      },
    ]) {
      expect(
        UploadCompletionRequestSchema.safeParse({
          ...validRequest,
          body,
        }).success,
      ).toBe(false);
    }
    for (const headers of [
      { ...validRequest.headers, idempotencyKey: 'short' },
      { ...validRequest.headers, idempotencyKey: 'complete-key-1\n' },
      { ...validRequest.headers, ifMatch: '7' },
      { ...validRequest.headers, ifMatch: '"01"' },
    ]) {
      expect(UploadCompletionHeadersSchema.safeParse(headers).success).toBe(
        false,
      );
    }
  });

  it('rejects invalid provider observations and allows only safe metadata', () => {
    expect(StorageObjectMetadataSchema.parse(validObserved)).toEqual(
      validObserved,
    );
    for (const candidate of [
      { ...validObserved, byteSize: 0 },
      { ...validObserved, objectKey: '../outside' },
      { ...validObserved, objectKey: `objects/${OBJECT_ID}\n` },
      { ...validObserved, mediaType: 'not-a-media-type' },
      {
        ...validObserved,
        checksum: { algorithm: 'sha256', value: 'b'.repeat(63) },
      },
      { ...validObserved, secret: 'must-not-cross-boundary' },
    ]) {
      expect(StorageObjectMetadataSchema.safeParse(candidate).success).toBe(
        false,
      );
    }
  });

  it('locks the five object lifecycle states and no extra blocked state', () => {
    expect(ObjectLifecycleStateSchema.options).toEqual([
      'pending_upload',
      'uploaded',
      'verifying',
      'ready',
      'rejected',
      'quarantined',
    ]);
    expect(ObjectLifecycleStateSchema.safeParse('blocked').success).toBe(false);
  });

  it('defines the minimal object.uploaded/1 event and platform-objects queue envelope', () => {
    const event = ObjectUploadedEventSchema.parse({
      actorId: ACTOR_ID,
      actingPartyId: PARTY_ID,
      aggregateId: OBJECT_ID,
      aggregateType: 'object_record',
      aggregateVersion: '8',
      causationId: null,
      correlationId: CORRELATION_ID,
      eventId: EVENT_ID,
      eventType: OBJECT_UPLOADED_EVENT_TYPE,
      occurredAt: '2026-08-30T13:00:00.000Z',
      payload: { objectId: OBJECT_ID },
      schemaVersion: OBJECT_UPLOADED_SCHEMA_VERSION,
    });
    expect(event.payload).toEqual({ objectId: OBJECT_ID });
    expect(OBJECT_VERIFICATION_JOB_TYPE).toBe('platform.object.verify');
    expect(OBJECT_VERIFICATION_QUEUE).toBe('platform-objects');

    const envelope = ObjectUploadedQueueEnvelopeSchema.parse({
      aggregateId: OBJECT_ID,
      aggregateType: 'object_record',
      aggregateVersion: '8',
      causationId: EVENT_ID,
      correlationId: CORRELATION_ID,
      eventId: EVENT_ID,
      eventType: 'object.uploaded',
      schemaVersion: 1,
    });
    expect(envelope).not.toHaveProperty('payload');
    expect(
      ObjectUploadedQueueEnvelopeSchema.safeParse({
        ...envelope,
        payload: { objectId: OBJECT_ID },
      }).success,
    ).toBe(false);
  });
});
