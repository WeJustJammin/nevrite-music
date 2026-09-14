import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_CAPABILITY_QUERY,
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  AC209_EMAIL_SENDING_QUERY,
  AC209_EMAIL_SENDING_REQUIRED_FIELDS,
  Ac209EmailSendingAnalyticsReportSchema,
  collectAc209EmailSendingAnalytics,
  sha256CanonicalEmail,
  verifyAc209EmailSendingCapability,
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

const capabilityResponse = (events: unknown[] = [{ status: 'delivered' }]) => ({
  data: {
    viewer: {
      zones: [{ emailSendingAdaptive: events }],
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
  it('probes the event dataset with one bounded UTC row and status only', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T23:59:59-04:00'));
    try {
      const fetchImpl = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          response(capabilityResponse([{ status: 'delivered' }])),
        );

      await expect(
        verifyAc209EmailSendingCapability({ zoneId, token, fetchImpl }),
      ).resolves.toBeUndefined();

      const [, init] = fetchImpl.mock.calls[0];
      expect(JSON.parse(String(init?.body))).toEqual({
        query: AC209_EMAIL_SENDING_CAPABILITY_QUERY,
        variables: {
          zoneTag: zoneId,
          start: '2026-09-15T02:59:59.000Z',
          end: '2026-09-15T03:59:59.000Z',
        },
      });
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).toContain(
        'emailSendingAdaptive(',
      );
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).toContain(
        'datetime_geq: $start',
      );
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).toContain(
        'datetime_leq: $end',
      );
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).toContain('limit: 1');
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).toMatch(
        /emailSendingAdaptive\([\s\S]*\)\s*\{\s*status\s*\}/u,
      );
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).not.toContain('settings');
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).not.toContain(
        'emailSendingAdaptiveGroups',
      );
      expect(AC209_EMAIL_SENDING_CAPABILITY_QUERY).not.toMatch(
        /\b(?:from|to|subject|messageId|datetime|sender|recipient|errorCause)\b/iu,
      );
      expect(AC209_EMAIL_SENDING_QUERY).toContain('emailSendingAdaptive(');
      for (const field of AC209_EMAIL_SENDING_REQUIRED_FIELDS)
        expect(AC209_EMAIL_SENDING_QUERY).toMatch(
          new RegExp(`^\\s*${field}\\s*$`, 'mu'),
        );
    } finally {
      vi.useRealTimers();
    }
  });

  it('accepts an empty event window because zero events still proves read access', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(capabilityResponse([])));

    await expect(
      verifyAc209EmailSendingCapability({ zoneId, token, fetchImpl }),
    ).resolves.toBeUndefined();
  });

  it.each([
    [
      'GraphQL permission error',
      { data: null, errors: [{ message: 'Permission denied' }] },
      'provider_permission_denied',
    ],
    [
      'unavailable zone',
      { data: { viewer: { zones: [] } }, errors: null },
      'provider_resource_unavailable',
    ],
    [
      'missing event rows',
      { data: { viewer: { zones: [{}] } }, errors: null },
      'provider_response_invalid',
    ],
    [
      'malformed event row',
      capabilityResponse([{}]),
      'provider_response_invalid',
    ],
    [
      'malformed event status',
      capabilityResponse([{ status: 3 }]),
      'provider_response_invalid',
    ],
    [
      'event status is empty',
      capabilityResponse([{ status: '' }]),
      'provider_response_invalid',
    ],
    [
      'multiple rows despite limit',
      capabilityResponse([{ status: 'queued' }, { status: 'delivered' }]),
      'provider_response_invalid',
    ],
    [
      'unexpected PII in the response',
      capabilityResponse([{ status: 'delivered', to: recipient }]),
      'provider_response_invalid',
    ],
  ])('fails the capability preflight for %s', async (_label, payload, code) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(payload));

    await expect(
      verifyAc209EmailSendingCapability({ zoneId, token, fetchImpl }),
    ).rejects.toMatchObject({ code });
  });

  it('rejects invalid capability input without a provider request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      verifyAc209EmailSendingCapability({
        zoneId: 'not-a-zone',
        token,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

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
    expect(AC209_EMAIL_SENDING_QUERY).not.toContain('status: "delivered"');
    expect(AC209_EMAIL_SENDING_QUERY).not.toContain('isLastEvent: 1');
    expect(AC209_EMAIL_SENDING_QUERY).toContain('status');
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
      ).rejects.toMatchObject({ code: 'event_not_unique' });
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

  it.each([
    [
      'documented unauthorized response',
      'Unauthorized',
      'provider_permission_denied',
    ],
    [
      'documented account authorization response',
      'not authorized for that account',
      'provider_permission_denied',
    ],
    [
      'documented zone authorization response',
      'zones [zone-one, zone-two] are not authorized',
      'provider_permission_denied',
    ],
    [
      'documented path authorization response',
      'token does not have access to the path /zones/zone-one/analytics',
      'provider_permission_denied',
    ],
    [
      'documented argument parsing response',
      'error parsing args: invalid argument',
      'provider_query_invalid',
    ],
    [
      'documented scalar selection response',
      'scalar fields must have no selections',
      'provider_query_invalid',
    ],
    [
      'documented object selection response',
      'object field must have selections',
      'provider_query_invalid',
    ],
    [
      'documented unknown field response',
      'unknown field "emailSendingAdaptive"',
      'provider_query_invalid',
    ],
    [
      'documented query validation response',
      'query contains error, please review it and retry',
      'provider_query_invalid',
    ],
    [
      'documented service unavailability response',
      'unable to execute query, please try again later',
      'provider_temporarily_unavailable',
    ],
    [
      'documented concurrent query response',
      'too many queries in progress, please try again later',
      'provider_temporarily_unavailable',
    ],
    [
      'permission-like wording',
      'zones [redacted] are not authorized',
      'provider_permission_denied',
    ],
    [
      'authentication wording',
      'Authentication error',
      'provider_permission_denied',
    ],
    [
      'resource-like wording',
      'requested resource does not exist',
      'provider_resource_unavailable',
    ],
    [
      'schema wording',
      'Cannot query field "emailSendingAdaptive" on type "Zone"',
      'provider_resource_unavailable',
    ],
    [
      'other execution failure',
      'secret-token provider execution failed',
      'provider_graphql_error',
    ],
    [
      'schema wording containing a permission-like field name',
      'unknown field "permission"',
      'provider_query_invalid',
    ],
    [
      'schema wording containing an authorization keyword',
      'Cannot query field "forbidden" on type "Zone"',
      'provider_resource_unavailable',
    ],
    ['long message', 'x'.repeat(5_000), 'provider_graphql_error'],
  ])(
    'classifies a safe GraphQL %s without exposing provider detail',
    async (_label, message, code) => {
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        response({
          data: graphqlResponse([row()]).data,
          errors: [{ message, path: ['viewer', 'zones', 0] }],
        }),
      );
      let captured: unknown;

      try {
        await collectAc209EmailSendingAnalytics(input(fetchImpl));
      } catch (error: unknown) {
        captured = error;
      }

      expect(captured).toMatchObject({ code });
      expect(captured).toBeInstanceOf(Error);
      if (!(captured instanceof Error)) throw new Error('expected an error');
      expect(captured.message).toBe(
        'AC209 Email Sending analytics query failed.',
      );
      expect(captured.message).not.toContain(message);
      expect(captured.message).not.toContain(token);
    },
  );

  it.each([
    [
      'query parsing failures',
      400,
      'error parsing args: invalid argument',
      'provider_query_invalid',
    ],
    [
      'temporary service failures',
      503,
      'unable to execute query, please try again later',
      'provider_temporarily_unavailable',
    ],
  ])(
    'classifies documented %s returned with its HTTP status without exposing the body',
    async (_label, status, message, code) => {
      const privateResponseId = 'cf-ray-private-response-id';
      const privateResponseBody = 'private-provider-response-body';
      const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
        response(
          {
            data: null,
            errors: [
              {
                message,
                path: ['viewer', 'zones', 0],
                extensions: {
                  responseId: privateResponseId,
                  zoneId,
                  body: privateResponseBody,
                  token,
                },
              },
            ],
          },
          status,
        ),
      );

      let captured: unknown;
      try {
        await collectAc209EmailSendingAnalytics(input(fetchImpl));
      } catch (error: unknown) {
        captured = error;
      }

      expect(captured).toMatchObject({ code });
      expect(captured).toBeInstanceOf(Error);
      if (!(captured instanceof Error)) throw new Error('expected an error');
      expect(captured.message).toBe(
        'AC209 Email Sending analytics query failed.',
      );
      expect(captured.message).not.toContain(message);
      expect(captured.message).not.toContain(privateResponseId);
      expect(captured.message).not.toContain(privateResponseBody);
      expect(captured.message).not.toContain(zoneId);
      expect(captured.message).not.toContain(token);
      expect(captured.stack).not.toContain(privateResponseId);
      expect(captured.stack).not.toContain(privateResponseBody);
      expect(captured.stack).not.toContain(zoneId);
      expect(captured.stack).not.toContain(token);
      expect(JSON.stringify(captured)).not.toContain(privateResponseId);
      expect(JSON.stringify(captured)).not.toContain(privateResponseBody);
      expect(JSON.stringify(captured)).not.toContain(zoneId);
      expect(JSON.stringify(captured)).not.toContain(token);
    },
  );

  it('keeps mixed GraphQL error classes generic and provider details private', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        data: graphqlResponse([row()]).data,
        errors: [
          { message: 'Permission denied' },
          { message: `provider execution failed for ${token}` },
        ],
      }),
    );
    let captured: unknown;

    try {
      await collectAc209EmailSendingAnalytics(input(fetchImpl));
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toMatchObject({ code: 'provider_graphql_error' });
    expect(captured).toBeInstanceOf(Error);
    if (!(captured instanceof Error)) throw new Error('expected an error');
    expect(captured.message).toBe(
      'AC209 Email Sending analytics query failed.',
    );
    expect(captured.message).not.toContain(token);
  });

  it('distinguishes unavailable zone access and a truncated result page', async () => {
    const unavailable = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response({ data: { viewer: { zones: [] } }, errors: null }),
      );
    await expect(
      collectAc209EmailSendingAnalytics(input(unavailable)),
    ).rejects.toMatchObject({ code: 'provider_resource_unavailable' });

    const truncated = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response(graphqlResponse(Array.from({ length: 50 }, () => row()))),
      );
    await expect(
      collectAc209EmailSendingAnalytics(input(truncated)),
    ).rejects.toMatchObject({ code: 'provider_result_truncated' });
  });

  it('classifies HTTP authorization and other request failures', async () => {
    const permissionFailure = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({}, 403));
    await expect(
      collectAc209EmailSendingAnalytics(input(permissionFailure)),
    ).rejects.toMatchObject({ code: 'provider_permission_denied' });

    const requestFailure = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({}, 503));
    await expect(
      collectAc209EmailSendingAnalytics(input(requestFailure)),
    ).rejects.toMatchObject({ code: 'provider_request_failed' });
  });

  it('fails closed for malformed JSON provider responses', async () => {
    const malformed = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('not-json', { status: 200 }));
    await expect(
      collectAc209EmailSendingAnalytics(input(malformed)),
    ).rejects.toMatchObject({ code: 'provider_response_invalid' });
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
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not misclassify an unexpected collector fault as invalid configuration', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const privateDetail = 'secret-token unexpected runtime detail';
    const parse = vi.spyOn(Date, 'parse').mockImplementationOnce(() => {
      throw new Error(privateDetail);
    });
    let captured: unknown;

    try {
      try {
        await collectAc209EmailSendingAnalytics(input(fetchImpl));
      } catch (error: unknown) {
        captured = error;
      }
    } finally {
      parse.mockRestore();
    }

    expect(captured).toBeInstanceOf(Error);
    if (!(captured instanceof Error))
      throw new Error('expected an Email Sending analytics error');
    expect(captured).toMatchObject({ code: 'unexpected_failure' });
    expect(captured.message).toBe(
      'AC209 Email Sending analytics query failed.',
    );
    expect(captured.message).not.toContain(privateDetail);
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
