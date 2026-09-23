import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_GRAPHQL_URL,
  AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES,
  AC209_EMAIL_SENDING_PAGE_LIMIT,
  AC209_EMAIL_SENDING_QUERY,
  AC209_EMAIL_SENDING_REQUIRED_FIELDS,
  sha256CanonicalEmail,
} from '../infra/workflows/ac209-email-sending-analytics.ts';
import {
  AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS,
  AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION,
  AC209_EMAIL_SENDING_SETTINGS_QUERY,
  Ac209EmailDiagnosticReportSchema,
  collectAc209EmailDiagnostics,
} from '../infra/workflows/ac209-email-diagnostics.ts';
import { formatAc209EmailDiagnosticSummary } from '../infra/workflows/diagnose-production-ac209-email.ts';

const zoneId = '5bfba340525c623584c47d631116804c';
const sourceRevision = 'c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2';
const token = 'observability-token-that-must-never-be-emitted';
const sender = 'platform.on-call@alerts.wejamm.in';
const recipient = 'admin.wejammin@gmail.com';
const senderSha256 = sha256CanonicalEmail(sender);
const recipientSha256 = sha256CanonicalEmail(recipient);
const subject = '[WeJammin] dlq_nonempty';
const messageId = 'cloudflare-email-message-0001';
const start = '2026-09-22T20:10:00Z';
const end = '2026-09-22T20:50:00Z';
const datetime = '2026-09-22T20:22:04Z';

const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const settings = (overrides: Record<string, unknown> = {}) => ({
  enabled: true,
  availableFields: [...AC209_EMAIL_SENDING_REQUIRED_FIELDS],
  maxDuration: 2_592_000,
  maxNumberOfFields: 30,
  maxPageSize: 10_000,
  notOlderThan: 2_678_400,
  ...overrides,
});

const settingsResponse = (value: unknown = settings()) => ({
  data: { viewer: { zones: [{ settings: { emailSendingAdaptive: value } }] } },
  errors: null,
});

const eventRow = (overrides: Record<string, unknown> = {}) => ({
  datetime,
  from: sender,
  to: recipient,
  subject,
  status: 'delivered',
  messageId,
  isLastEvent: 1,
  ...overrides,
});

const eventsResponse = (rows: unknown[]) => ({
  data: { viewer: { zones: [{ emailSendingAdaptive: rows }] } },
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
  fetchImpl,
});

const collect = async (settingsPayload: unknown, eventsPayload: unknown) => {
  const fetchImpl = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(response(settingsPayload))
    .mockResolvedValueOnce(response(eventsPayload));
  const report = await collectAc209EmailDiagnostics(input(fetchImpl));
  return { fetchImpl, report };
};

describe('AC209 redacted Email Sending diagnostic', () => {
  it('queries the documented settings node and the exact old exercise window', async () => {
    const { fetchImpl, report } = await collect(
      settingsResponse(),
      eventsResponse([eventRow()]),
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    for (const [url, init] of fetchImpl.mock.calls) {
      expect(url).toBe(AC209_EMAIL_SENDING_GRAPHQL_URL);
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      });
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }

    const settingsBody = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(settingsBody).toEqual({
      query: AC209_EMAIL_SENDING_SETTINGS_QUERY,
      variables: { zoneTag: zoneId },
    });
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toContain('settings {');
    for (const field of [
      'enabled',
      'availableFields',
      'maxPageSize',
      'maxNumberOfFields',
      'notOlderThan',
      'maxDuration',
    ])
      expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toMatch(
        new RegExp(`^\\s*${field}\\s*$`, 'mu'),
      );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toMatch(
      /^\s*emailSendingAdaptive\s*\{$/mu,
    );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toContain(
      'zones(filter: { zoneTag: $zoneTag })',
    );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).not.toMatch(
      /\b(?:from|to|subject|messageId|datetime|sender|recipient|errorDetail)\b/iu,
    );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).not.toContain(
      'emailSendingAdaptiveGroups',
    );

    const eventsBody = JSON.parse(String(fetchImpl.mock.calls[1]?.[1]?.body));
    expect(eventsBody).toEqual({
      query: AC209_EMAIL_SENDING_QUERY,
      variables: { zoneTag: zoneId, start, end },
    });
    expect(report.window).toEqual({ start, end });
    expect(report.settings).toMatchObject({
      status: 'available',
      enabled: true,
      requiredFieldsAvailable: true,
      requiredFieldsMissing: 0,
      maxPageSize: 10_000,
      maxNumberOfFields: 30,
      maxDurationSeconds: 2_592_000,
      notOlderThanSeconds: 2_678_400,
      supportsPageLimit: true,
      supportsRequiredFields: true,
    });
  });

  it('compares every event field selected by the window query against availableFields', async () => {
    expect(AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS).toEqual(
      AC209_EMAIL_SENDING_REQUIRED_FIELDS,
    );
    const { report } = await collect(
      settingsResponse(
        settings({
          availableFields: ['datetime', 'from', 'to', 'subject', 'status'],
          maxPageSize: 1,
          maxNumberOfFields: 3,
        }),
      ),
      eventsResponse([eventRow()]),
    );

    expect(report.settings).toMatchObject({
      status: 'available',
      requiredFieldsAvailable: false,
      requiredFieldsMissing: 2,
      supportsPageLimit: false,
      supportsRequiredFields: false,
    });
  });

  it('accepts a nested available-field path for a selected field', async () => {
    const { report } = await collect(
      settingsResponse(
        settings({
          availableFields: AC209_EMAIL_SENDING_REQUIRED_FIELDS.map(
            (field) => `dimensions.${field}`,
          ),
        }),
      ),
      eventsResponse([eventRow()]),
    );

    expect(report.settings).toMatchObject({
      requiredFieldsAvailable: true,
      requiredFieldsMissing: 0,
    });
  });

  it('reports an empty window as zero rows rather than a match mismatch', async () => {
    const { report } = await collect(settingsResponse(), eventsResponse([]));

    expect(report.windowQuery).toEqual({
      status: 'available',
      rowsReturned: 0,
      uniqueReturnedMessageIds: 0,
      withinWindowRows: 0,
      outsideWindowRows: 0,
      senderMatches: 0,
      recipientMatches: 0,
      subjectMatches: 0,
      identityMatches: 0,
      deliveredCount: 0,
      terminalCount: 0,
      matchedRows: 0,
      uniqueMatchedMessageIds: 0,
      duplicateMessageIds: 0,
      pageFull: false,
      pageTruncated: false,
      classification: 'zero_rows',
    });
  });

  it('reports an identity mismatch when rows exist for another identity', async () => {
    const { report } = await collect(
      settingsResponse(),
      eventsResponse([
        eventRow({ from: 'other@example.com' }),
        eventRow({ to: 'other@example.com' }),
        eventRow(),
      ]),
    );

    expect(report.windowQuery).toMatchObject({
      rowsReturned: 3,
      withinWindowRows: 3,
      senderMatches: 2,
      recipientMatches: 2,
      subjectMatches: 3,
      identityMatches: 1,
      deliveredCount: 3,
      terminalCount: 3,
      matchedRows: 1,
      uniqueMatchedMessageIds: 1,
      duplicateMessageIds: 0,
      classification: 'unique_match',
    });

    const mismatch = await collect(
      settingsResponse(),
      eventsResponse([
        eventRow({ from: 'other@example.com' }),
        eventRow({ subject: '[WeJammin] other' }),
      ]),
    );
    expect(mismatch.report.windowQuery).toMatchObject({
      identityMatches: 0,
      classification: 'identity_mismatch',
    });
  });

  it('reports a terminal-status mismatch when identity matches without a delivered final event', async () => {
    const nonTerminal = await collect(
      settingsResponse(),
      eventsResponse([eventRow({ isLastEvent: 0 })]),
    );
    expect(nonTerminal.report.windowQuery).toMatchObject({
      identityMatches: 1,
      deliveredCount: 1,
      terminalCount: 0,
      matchedRows: 0,
      uniqueMatchedMessageIds: 0,
      classification: 'terminal_status_mismatch',
    });

    const undelivered = await collect(
      settingsResponse(),
      eventsResponse([eventRow({ status: 'deliveryFailed' })]),
    );
    expect(undelivered.report.windowQuery).toMatchObject({
      identityMatches: 1,
      deliveredCount: 0,
      terminalCount: 1,
      matchedRows: 0,
      uniqueMatchedMessageIds: 0,
      classification: 'terminal_status_mismatch',
    });
  });

  it('reports a truncated page instead of inferring an absent event', async () => {
    const rows = Array.from(
      { length: AC209_EMAIL_SENDING_PAGE_LIMIT },
      (_unused, index) =>
        eventRow({ messageId: `cloudflare-email-message-${index}` }),
    );
    const { report } = await collect(settingsResponse(), eventsResponse(rows));

    expect(report.windowQuery).toMatchObject({
      rowsReturned: AC209_EMAIL_SENDING_PAGE_LIMIT,
      uniqueReturnedMessageIds: AC209_EMAIL_SENDING_PAGE_LIMIT,
      matchedRows: AC209_EMAIL_SENDING_PAGE_LIMIT,
      uniqueMatchedMessageIds: AC209_EMAIL_SENDING_PAGE_LIMIT,
      duplicateMessageIds: 0,
      pageFull: true,
      pageTruncated: true,
      classification: 'page_truncated',
    });
  });

  it('distinguishes multiple matching events from a unique match', async () => {
    const { report } = await collect(
      settingsResponse(),
      eventsResponse([
        eventRow({ messageId: 'cloudflare-email-message-0001' }),
        eventRow({ messageId: 'cloudflare-email-message-0002' }),
      ]),
    );

    expect(report.windowQuery).toMatchObject({
      uniqueReturnedMessageIds: 2,
      matchedRows: 2,
      uniqueMatchedMessageIds: 2,
      duplicateMessageIds: 0,
      classification: 'multiple_matches',
    });
  });

  it('classifies a duplicated delivered-terminal message identifier as a duplicate', async () => {
    const { report } = await collect(
      settingsResponse(),
      eventsResponse([eventRow(), eventRow()]),
    );

    expect(report.windowQuery).toMatchObject({
      rowsReturned: 2,
      uniqueReturnedMessageIds: 1,
      matchedRows: 2,
      uniqueMatchedMessageIds: 1,
      duplicateMessageIds: 1,
      classification: 'duplicate_matches',
    });
  });

  it('counts only in-window rows for every identity and status counter', async () => {
    const { report } = await collect(
      settingsResponse(),
      eventsResponse([
        eventRow({
          datetime: '2026-09-22T20:09:59Z',
          messageId: 'cloudflare-email-message-before',
          status: 'queued',
          isLastEvent: 0,
        }),
        eventRow({
          datetime: '2026-09-22T20:50:01Z',
          messageId: 'cloudflare-email-message-after',
          from: 'other@example.com',
        }),
        eventRow(),
      ]),
    );

    expect(report.windowQuery).toMatchObject({
      rowsReturned: 3,
      withinWindowRows: 1,
      outsideWindowRows: 2,
      senderMatches: 1,
      recipientMatches: 1,
      subjectMatches: 1,
      identityMatches: 1,
      deliveredCount: 1,
      terminalCount: 1,
      matchedRows: 1,
      classification: 'unique_match',
    });
  });

  it('counts events returned outside the requested window separately', async () => {
    const { report } = await collect(
      settingsResponse(),
      eventsResponse([
        eventRow({ datetime: '2026-09-22T20:09:59Z' }),
        eventRow(),
      ]),
    );

    expect(report.windowQuery).toMatchObject({
      rowsReturned: 2,
      withinWindowRows: 1,
      outsideWindowRows: 1,
      identityMatches: 1,
      deliveredCount: 1,
      terminalCount: 1,
      classification: 'unique_match',
    });
  });

  it('records settings unavailability without aborting the window query', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response({ data: null, errors: [{ message: 'Permission denied' }] }),
      )
      .mockResolvedValueOnce(response(eventsResponse([eventRow()])));

    const report = await collectAc209EmailDiagnostics(input(fetchImpl));

    expect(report.settings).toEqual({
      status: 'unavailable',
      code: 'provider_permission_denied',
    });
    expect(report.windowQuery).toMatchObject({
      status: 'available',
      classification: 'unique_match',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('records window-query unavailability without discarding settings evidence', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(settingsResponse()))
      .mockResolvedValueOnce(response({ data: { viewer: {} }, errors: null }));

    const report = await collectAc209EmailDiagnostics(input(fetchImpl));

    expect(report.settings).toMatchObject({ status: 'available' });
    expect(report.windowQuery).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });
  });

  it('reports a disabled dataset without inferring a delivery outcome', async () => {
    const { report } = await collect(
      settingsResponse(settings({ enabled: false })),
      eventsResponse([]),
    );

    expect(report.settings).toMatchObject({
      status: 'available',
      enabled: false,
    });
    expect(report.windowQuery).toMatchObject({ classification: 'zero_rows' });
  });

  it('never emits raw addresses, subjects, message identifiers, or the token', async () => {
    const { report } = await collect(
      settingsResponse(),
      eventsResponse([eventRow({ errorDetail: 'provider-private-detail' })]),
    );

    const serialized = JSON.stringify(report);
    for (const forbidden of [
      sender,
      recipient,
      subject,
      messageId,
      token,
      'provider-private-detail',
      zoneId,
    ])
      expect(serialized).not.toContain(forbidden);
    expect(report.schemaVersion).toBe(AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION);
    expect(report.environment).toBe('production');
    expect(report.diagnosticOnly).toBe(true);
    expect(report.sourceRevision).toBe(sourceRevision);
  });

  it.each([
    [
      'documented permission error',
      { data: null, errors: [{ message: 'not authorized for that account' }] },
      'provider_permission_denied',
    ],
    [
      'documented query error',
      { data: null, errors: [{ message: 'unknown field "settings"' }] },
      'provider_query_invalid',
    ],
    [
      'documented temporary error',
      {
        data: null,
        errors: [
          { message: 'unable to execute query, please try again later' },
        ],
      },
      'provider_temporarily_unavailable',
    ],
    [
      'unavailable zone',
      { data: { viewer: { zones: [] } }, errors: null },
      'provider_resource_unavailable',
    ],
    [
      'malformed settings',
      { data: { viewer: { zones: [{ settings: {} }] } }, errors: null },
      'provider_response_invalid',
    ],
    [
      'unexpected settings field',
      settingsResponse(settings({ availableFields: [recipient] })),
      'provider_response_invalid',
    ],
  ])('classifies a %s into a bounded code', async (_label, payload, code) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(payload))
      .mockResolvedValueOnce(response(eventsResponse([])));

    const report = await collectAc209EmailDiagnostics(input(fetchImpl));

    expect(report.settings).toEqual({ status: 'unavailable', code });
  });

  it('keeps provider detail and credentials out of errors and stacks', async () => {
    const privateDetail = 'private-provider-diagnostic-detail';
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        {
          data: null,
          errors: [
            {
              message: `${privateDetail} ${token}`,
              extensions: { body: privateDetail, responseId: privateDetail },
            },
          ],
        },
        403,
      ),
    );

    const report = await collectAc209EmailDiagnostics(input(fetchImpl));
    expect(report.settings).toEqual({
      status: 'unavailable',
      code: 'provider_permission_denied',
    });
    expect(report.windowQuery).toEqual({
      status: 'unavailable',
      code: 'provider_permission_denied',
    });

    const serialized = JSON.stringify(report);
    for (const forbidden of [privateDetail, token, zoneId])
      expect(serialized).not.toContain(forbidden);
  });

  it.each([
    ['zone ID', { zoneId: 'not-a-zone' }],
    ['source revision', { sourceRevision: 'not-a-sha' }],
    ['sender hash', { expectedSenderSha256: 'not-a-hash' }],
    ['recipient hash', { expectedRecipientSha256: 'not-a-hash' }],
    ['empty subject', { expectedSubject: '' }],
    ['reversed window', { start: end, end: start }],
    [
      'wide window',
      { start: '2026-09-22T00:00:00Z', end: '2026-09-23T00:00:01Z' },
    ],
    ['whitespace token', { token: 'token with whitespace' }],
  ])(
    'rejects invalid %s input without a provider request',
    async (_label, overrides) => {
      const fetchImpl = vi.fn<typeof fetch>();
      await expect(
        collectAc209EmailDiagnostics({ ...input(fetchImpl), ...overrides }),
      ).rejects.toMatchObject({ code: 'invalid_configuration' });
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('rejects oversized and unreadable provider responses', async () => {
    const oversized = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-length': String(AC209_EMAIL_SENDING_MAX_RESPONSE_BYTES + 1),
      }),
      text: vi.fn(async () => '{}'),
    } as unknown as Response);
    const oversizedReport = await collectAc209EmailDiagnostics(
      input(oversized),
    );
    expect(oversizedReport.settings).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });
    expect(oversizedReport.windowQuery).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });

    const notJson = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('not-json', { status: 200 }));
    const notJsonReport = await collectAc209EmailDiagnostics(input(notJson));
    expect(notJsonReport.settings).toEqual({
      status: 'unavailable',
      code: 'provider_response_invalid',
    });
  });

  it('rejects an unknown report field', () => {
    expect(() =>
      Ac209EmailDiagnosticReportSchema.parse({
        schemaVersion: AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        window: { start, end },
        settings: { status: 'unavailable', code: 'provider_request_failed' },
        windowQuery: { status: 'unavailable', code: 'provider_request_failed' },
        unexpected: 'nope',
      }),
    ).toThrow();
  });

  it('canonicalizes email addresses exactly as the delivery gate does', () => {
    expect(sha256CanonicalEmail('  PLATFORM.ON-CALL@ALERTS.WEJAMM.IN ')).toBe(
      createHash('sha256')
        .update('platform.on-call@alerts.wejamm.in')
        .digest('hex'),
    );
  });
});

describe('AC209 email diagnostic entrypoint', () => {
  const entrypointUrl = new URL(
    '../infra/workflows/diagnose-production-ac209-email.ts',
    import.meta.url,
  );

  it('logs only closed codes and never a raw provider response', () => {
    expect(
      formatAc209EmailDiagnosticSummary({
        schemaVersion: AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        window: { start, end },
        settings: { status: 'available' } as never,
        windowQuery: {
          status: 'available',
          classification: 'unique_match',
        } as never,
      }),
    ).toBe('AC209_EMAIL_DIAGNOSTIC settings=available window=unique_match');
    expect(
      formatAc209EmailDiagnosticSummary({
        schemaVersion: AC209_EMAIL_DIAGNOSTIC_SCHEMA_VERSION,
        diagnosticOnly: true,
        environment: 'production',
        sourceRevision,
        window: { start, end },
        settings: { status: 'unavailable', code: 'provider_permission_denied' },
        windowQuery: {
          status: 'unavailable',
          code: 'provider_response_invalid',
        },
      }),
    ).toBe(
      'AC209_EMAIL_DIAGNOSTIC settings=unavailable(provider_permission_denied) window=unavailable(provider_response_invalid)',
    );
  });

  it('exits non-zero with a bounded code when required input is missing', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-diagnostic-'));
    try {
      const probe = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointUrl.pathname],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            CLOUDFLARE_EMAIL_ZONE_ID: '',
            CLOUDFLARE_OBSERVABILITY_API_TOKEN: '',
            SOURCE_REVISION: '',
            AC209_DIAGNOSTIC_WINDOW_START: '',
            AC209_DIAGNOSTIC_WINDOW_END: '',
          },
        },
      );

      expect(probe.status).toBe(1);
      expect(probe.stdout).toBe('');
      expect(probe.stderr).toContain(
        'AC209_EMAIL_DIAGNOSTIC failed code=invalid_configuration',
      );
      expect(readdirSync(workspace)).toEqual([]);
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });

  it('loads its full import graph under the strip-only Node runtime used in production', () => {
    const probe = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        `await import(${JSON.stringify(entrypointUrl.href)}); process.stdout.write('AC209_DIAGNOSTIC_STRIP_IMPORT_OK\\n');`,
      ],
      { encoding: 'utf8' },
    );

    expect({
      status: probe.status,
      signal: probe.signal,
      stdout: probe.stdout,
    }).toEqual({
      status: 0,
      signal: null,
      stdout: 'AC209_DIAGNOSTIC_STRIP_IMPORT_OK\n',
    });
    expect(probe.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('writes provider evidence only inside the workspace', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'ac209-diagnostic-'));
    try {
      const probe = spawnSync(
        process.execPath,
        ['--experimental-strip-types', entrypointUrl.pathname],
        {
          cwd: workspace,
          encoding: 'utf8',
          env: {
            ...process.env,
            GITHUB_WORKSPACE: workspace,
            AC209_DIAGNOSTIC_OUTPUT_PATH: '../../escaped.json',
          },
        },
      );

      expect(probe.status).toBe(1);
      expect(probe.stderr).toContain('AC209_EMAIL_DIAGNOSTIC failed');
      expect(readdirSync(workspace)).toEqual([]);
      expect(existsSync(join(workspace, '..', '..', 'escaped.json'))).toBe(
        false,
      );
    } finally {
      rmSync(workspace, { force: true, recursive: true });
    }
  });
});
