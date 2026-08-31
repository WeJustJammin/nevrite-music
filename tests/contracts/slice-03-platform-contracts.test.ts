import {
  JobIdPathSchema,
  JobStatusSchema,
  JobStatusTransportSchema,
  OfflineIntentSchema,
  PlatformEventSchema,
  PositiveBigintDecimalSchema,
  QueueEnvelopeSchema,
  RealtimeInvalidationHintSchema,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const CORRELATION_ID = '33333333-3333-4333-8333-333333333333';
const INTENT_ID = '44444444-4444-4444-8444-444444444444';

const jobStatus = {
  id: JOB_ID,
  type: 'object.verify',
  state: 'running',
  progress: { completed: 1, total: 2, unit: 'items' },
  resultRef: null,
  error: null,
  createdAt: '2026-08-30T12:00:00Z',
  updatedAt: '2026-08-30T12:00:01Z',
} as const;

describe('Slice 03 platform contracts', () => {
  it('locks the strict five-state JobStatus body without a version field', () => {
    expect(JobStatusSchema.parse(jobStatus)).toEqual(jobStatus);
    expect(
      JobStatusSchema.safeParse({ ...jobStatus, state: 'blocked' }).success,
    ).toBe(false);
    expect(
      JobStatusSchema.safeParse({ ...jobStatus, version: '"1"' }).success,
    ).toBe(false);
  });

  it('requires coherent bounded progress and ordered timestamps', () => {
    expect(
      JobStatusSchema.safeParse({
        ...jobStatus,
        progress: { completed: 3, total: 2 },
      }).success,
    ).toBe(false);
    expect(
      JobStatusSchema.safeParse({
        ...jobStatus,
        updatedAt: '2026-08-30T11:59:59Z',
      }).success,
    ).toBe(false);
  });

  it('keeps the strong ETag outside the JobStatus response body', () => {
    expect(
      JobStatusTransportSchema.parse({ data: jobStatus, etag: '"7"' }),
    ).toEqual({ data: jobStatus, etag: '"7"' });
    expect(
      JobStatusTransportSchema.safeParse({ data: jobStatus, etag: '7' })
        .success,
    ).toBe(false);
  });

  it('validates the canonical job path before authorization', () => {
    expect(JobIdPathSchema.parse({ jobId: JOB_ID })).toEqual({ jobId: JOB_ID });
    expect(
      JobIdPathSchema.safeParse({
        jobId: 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',
      }).success,
    ).toBe(false);
  });

  it('locks aggregate versions to positive bigint decimal strings', () => {
    expect(PositiveBigintDecimalSchema.parse('9223372036854775807')).toBe(
      '9223372036854775807',
    );
    expect(
      [0, '0', '01', 1, '9223372036854775808'].map(
        (value) => PositiveBigintDecimalSchema.safeParse(value).success,
      ),
    ).toEqual([false, false, false, false, false]);
  });

  it('locks strict versioned platform events', () => {
    const event = {
      eventId: EVENT_ID,
      eventType: 'job.requested',
      schemaVersion: 1,
      aggregateType: 'job',
      aggregateId: JOB_ID,
      aggregateVersion: '1',
      correlationId: CORRELATION_ID,
      causationId: null,
      actorId: null,
      actingPartyId: null,
      occurredAt: '2026-08-30T12:00:00Z',
      payload: { jobId: JOB_ID, jobType: 'object.verify' },
    } as const;
    expect(PlatformEventSchema.parse(event)).toEqual(event);
    expect(
      PlatformEventSchema.safeParse({ ...event, schemaVersion: 2 }).success,
    ).toBe(false);
    expect(
      PlatformEventSchema.safeParse({
        ...event,
        payload: { ...event.payload, actorRole: 'admin' },
      }).success,
    ).toBe(false);
  });

  it('keeps queue envelopes identifier-only and payload-free', () => {
    const envelope = {
      eventId: EVENT_ID,
      eventType: 'job.requested',
      schemaVersion: 1,
      aggregateType: 'job',
      aggregateId: JOB_ID,
      aggregateVersion: '1',
      correlationId: CORRELATION_ID,
      causationId: null,
    } as const;
    expect(QueueEnvelopeSchema.parse(envelope)).toEqual(envelope);
    expect(
      QueueEnvelopeSchema.safeParse({ envelope, payload: { role: 'admin' } })
        .success,
    ).toBe(false);
  });

  it('persists offline intent metadata as noncanonical local work', () => {
    const intent = {
      intentId: INTENT_ID,
      operation: 'infrastructure.update',
      targetId: JOB_ID,
      localPayloadRef: `local:${INTENT_ID}`,
      payloadHash: `sha256:${'a'.repeat(64)}`,
      expectedVersion: '"1"',
      state: 'queued',
      refusal: null,
      createdAt: '2026-08-30T12:00:00Z',
      updatedAt: '2026-08-30T12:00:00Z',
    } as const;
    expect(OfflineIntentSchema.parse(intent)).toEqual(intent);
    expect(
      OfflineIntentSchema.safeParse({ ...intent, canonical: true }).success,
    ).toBe(false);
    expect(
      OfflineIntentSchema.safeParse({
        ...intent,
        updatedAt: '2026-08-30T11:59:59Z',
      }).success,
    ).toBe(false);
    expect(
      OfflineIntentSchema.safeParse({
        ...intent,
        refusal: {
          code: 'AUTHORITY_REVOKED',
          retryable: false,
          requestId: null,
        },
      }).success,
    ).toBe(false);
    expect(
      OfflineIntentSchema.safeParse({ ...intent, state: 'refused' }).success,
    ).toBe(false);
    expect(
      OfflineIntentSchema.safeParse({
        ...intent,
        state: 'refused',
        refusal: {
          code: 'AUTHORITY_REVOKED',
          retryable: false,
          requestId: null,
        },
      }).success,
    ).toBe(true);
  });

  it('allows entity or event identifier/version realtime invalidation hints', () => {
    const hint = {
      entityId: JOB_ID,
      entityType: 'job',
      hintedVersion: '"2"',
    } as const;
    expect(RealtimeInvalidationHintSchema.parse(hint)).toEqual(hint);
    expect(
      RealtimeInvalidationHintSchema.safeParse({
        ...hint,
        data: jobStatus,
      }).success,
    ).toBe(false);

    const eventHint = {
      eventId: EVENT_ID,
      eventType: 'job.requested',
      schemaVersion: 1,
    } as const;
    expect(RealtimeInvalidationHintSchema.parse(eventHint)).toEqual(eventHint);
    expect(
      RealtimeInvalidationHintSchema.safeParse({
        ...eventHint,
        payload: { role: 'admin' },
      }).success,
    ).toBe(false);
  });
});
