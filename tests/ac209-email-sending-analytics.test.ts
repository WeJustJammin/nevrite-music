import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  AC209_EMAIL_SENDING_QUERY,
  Ac209EmailSendingAnalyticsReportSchema,
  collectAc209EmailSendingAnalytics,
  sha256CanonicalEmail,
} from '../infra/workflows/ac209-email-sending-analytics.ts';

const zoneId = 'c82fdacb63fe415d96d71b64ef9bbca1';
const sourceRevision = '7f72272c4ca46c738cc8e7941573af08cad33169';
const token = 'email-analytics-token-that-must-never-be-emitted';
const sender = 'platform.on-call@alerts.wejamm.in';
const recipient = 'admin.wejammin@gmail.com';
const senderSha256 = sha256CanonicalEmail(sender);
const recipientSha256 = sha256CanonicalEmail(recipient);
const subject = '[WeJammin] dlq_nonempty';
const messageId = 'cloudflare-email-message-0001';
const start = '2026-09-10T18:00:00Z';
const end = '2026-09-10T18:05:00Z';
const datetime = '2026-09-10T18:01:02Z';

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const row = (overrides: Record<string, unknown> = {}) => ({
  datetime,
  from: sender,
  to: recipient,
  subject,
  status: 'delivered',
  isLastEvent: 1,
  eventType: 'newEmail',
  sendingDomain: 'alerts.wejamm.in',
  messageId,
  ...overrides,
});

const graphqlResponse = (rows: unknown[]) => ({
  data: {
    viewer: {
      zones: [{ emailSendingAdaptive: rows }],
    },
  },
  errors: null,
});

const input = (fetchImpl: typeof fetch) => ({
  zoneId,
  token,
  sourceRevision,
  start,
  end,
  expectedSenderSha256: senderSha256,
  expectedRecipientSha256: recipientSha256,
  expectedSubject: subject,
  expectedMessageId: messageId,
  fetchImpl,
});

describe('AC209 Email Sending analytics collector', () => {
  it('queries the exact GraphQL endpoint with a bounded zone/time request', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(graphqlResponse([row()])));

    const report = await collectAc209EmailSendingAnalytics(input(fetchImpl));

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      query: AC209_EMAIL_SENDING_QUERY,
      variables: { zoneTag: zoneId, start, end },
    });
    expect(AC209_EMAIL_SENDING_QUERY).toContain('emailSendingAdaptive');
    expect(AC209_EMAIL_SENDING_QUERY).toContain('datetime_geq: $start');
    expect(AC209_EMAIL_SENDING_QUERY).toContain('datetime_leq: $end');
    expect(AC209_EMAIL_SENDING_QUERY).toContain('isLastEvent');
    expect(report.event).toEqual({
      senderSha256,
      recipientSha256,
      subject,
      messageId,
      datetime,
      status: 'delivered',
    });
  });

  it('discovers the unique delivered Message-ID when no expected ID is supplied', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(graphqlResponse([row()])));

    const report = await collectAc209EmailSendingAnalytics({
      ...input(fetchImpl),
      expectedMessageId: undefined,
    });

    expect(report.event.messageId).toBe(messageId);
  });

  it('canonicalizes email addresses before hashing', () => {
    expect(sha256CanonicalEmail('  PLATFORM.ON-CALL@ALERTS.WEJAMM.IN ')).toBe(
      createHash('sha256')
        .update('platform.on-call@alerts.wejamm.in')
        .digest('hex'),
    );
  });

  it('rejects a full page rather than silently treating it as complete', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(graphqlResponse(Array.from({ length: 50 }, row))),
      );

    await expect(
      collectAc209EmailSendingAnalytics(input(fetchImpl)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
  });

  it('returns a redacted report and never returns raw addresses or provider detail', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        graphqlResponse([
          row({
            errorDetail: 'provider-private-detail',
            body: 'private-body',
          }),
        ]),
      ),
    );

    const report = await collectAc209EmailSendingAnalytics(input(fetchImpl));
    const serialized = JSON.stringify(report);

    expect(serialized).not.toContain(sender);
    expect(serialized).not.toContain(recipient);
    expect(serialized).not.toContain('provider-private-detail');
    expect(serialized).not.toContain('private-body');
    expect(serialized).not.toContain(token);
    expect(report).toEqual({
      schemaVersion: 'ac209-email-sending-analytics-v1',
      sourceRevision,
      environment: 'production',
      zoneId,
      window: { start, end },
      event: {
        senderSha256,
        recipientSha256,
        subject,
        messageId,
        datetime,
        status: 'delivered',
      },
    });
  });

  it.each([
    ['sender hash', { from: 'other@example.com' }],
    ['recipient hash', { to: 'other@example.com' }],
    ['subject', { subject: '[WeJammin] other' }],
    ['message ID', { messageId: 'cloudflare-email-message-other' }],
    ['status', { status: 'queued' }],
    ['terminal lifecycle marker', { isLastEvent: 0 }],
    ['datetime before window', { datetime: '2026-09-10T17:59:59Z' }],
    ['datetime after window', { datetime: '2026-09-10T18:05:01Z' }],
  ])('rejects an event with a mismatched %s', async (_label, overrides) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(graphqlResponse([row(overrides)])));

    await expect(
      collectAc209EmailSendingAnalytics(input(fetchImpl)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
  });

  it('requires exactly one matching event', async () => {
    for (const rows of [[], [row(), row()]]) {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(response(graphqlResponse(rows)));
      await expect(
        collectAc209EmailSendingAnalytics(input(fetchImpl)),
      ).rejects.toThrow('AC209 Email Sending analytics query failed.');
    }
  });

  it('accepts one terminal delivered event after non-terminal lifecycle events', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(
          graphqlResponse([
            row({ status: 'submitted', isLastEvent: 0 }),
            row({ status: 'deferred', isLastEvent: 0 }),
            row(),
          ]),
        ),
      );

    await expect(
      collectAc209EmailSendingAnalytics(input(fetchImpl)),
    ).resolves.toMatchObject({ event: { messageId, status: 'delivered' } });
  });

  it.each([
    [
      'GraphQL errors',
      { data: graphqlResponse([row()]).data, errors: [{ message: token }] },
    ],
    ['missing data', { errors: null }],
    ['missing viewer', { data: { viewer: {} }, errors: null }],
    ['zero zones', { data: { viewer: { zones: [] } }, errors: null }],
    [
      'multiple zones',
      {
        data: {
          viewer: {
            zones: [
              { emailSendingAdaptive: [row()] },
              { emailSendingAdaptive: [] },
            ],
          },
        },
        errors: null,
      },
    ],
  ])('fails closed for %s', async (_label, payload) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(payload));
    await expect(
      collectAc209EmailSendingAnalytics(input(fetchImpl)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
  });

  it('fails closed for HTTP and malformed JSON provider responses', async () => {
    const httpFailure = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({}, 403));
    await expect(
      collectAc209EmailSendingAnalytics(input(httpFailure)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');

    const malformed = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('not-json', { status: 200 }));
    await expect(
      collectAc209EmailSendingAnalytics(input(malformed)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
  });

  it('rejects oversized provider responses before parsing them', async () => {
    const text = vi.fn(async () => '{}');
    const declaredOversize = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-length': String(AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES + 1),
      }),
      text,
    } as Response);

    await expect(
      collectAc209EmailSendingAnalytics(input(declaredOversize)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
    expect(text).not.toHaveBeenCalled();

    const oversizedBody = JSON.stringify({
      ...graphqlResponse([row()]),
      padding: 'x'.repeat(AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES),
    });
    const actualOversize = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(oversizedBody, { status: 200 }));
    await expect(
      collectAc209EmailSendingAnalytics(input(actualOversize)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
  });

  it('cancels an unknown-length oversized response without draining its stream', async () => {
    const reader = {
      cancel: vi.fn(async () => undefined),
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new Uint8Array(AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES),
        })
        .mockResolvedValueOnce({ done: false, value: new Uint8Array([0]) })
        .mockResolvedValueOnce({ done: true, value: undefined }),
      releaseLock: vi.fn(),
    };
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue({
      body: { getReader: () => reader },
      headers: new Headers(),
      ok: true,
    } as unknown as Response);

    await expect(
      collectAc209EmailSendingAnalytics(input(fetchImpl)),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
    expect(reader.cancel).toHaveBeenCalledOnce();
    expect(reader.read).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['zone ID', { zoneId: 'not-a-zone' }],
    ['source revision', { sourceRevision: 'not-a-sha' }],
    ['sender hash', { expectedSenderSha256: 'not-a-hash' }],
    ['recipient hash', { expectedRecipientSha256: 'not-a-hash' }],
    ['message ID', { expectedMessageId: 'message id with spaces' }],
    ['reversed window', { start: end, end: start }],
    [
      'wide window',
      { start: '2026-09-10T00:00:00Z', end: '2026-09-11T00:00:01Z' },
    ],
  ])('rejects invalid %s input', async (_label, overrides) => {
    const fetchImpl = vi.fn<typeof fetch>();
    await expect(
      collectAc209EmailSendingAnalytics({ ...input(fetchImpl), ...overrides }),
    ).rejects.toThrow('AC209 Email Sending analytics query failed.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects unknown report fields', () => {
    expect(() =>
      Ac209EmailSendingAnalyticsReportSchema.parse({
        schemaVersion: 'ac209-email-sending-analytics-v1',
        sourceRevision,
        environment: 'production',
        zoneId,
        window: { start, end },
        event: {
          senderSha256,
          recipientSha256,
          subject,
          messageId,
          datetime,
          status: 'delivered',
          unknown: 'nope',
        },
      }),
    ).toThrow();
  });
});
