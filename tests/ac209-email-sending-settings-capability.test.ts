import { describe, expect, it, vi } from 'vitest';

import {
  AC209_EMAIL_SENDING_QUERY,
  AC209_EMAIL_SENDING_REQUIRED_FIELDS,
  Ac209EmailSendingAnalyticsError,
} from '../infra/workflows/ac209-email-sending-analytics.ts';
import {
  AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS,
  AC209_EMAIL_SENDING_SETTINGS_REQUIRED_FIELDS,
  AC209_EMAIL_SENDING_SETTINGS_QUERY,
  verifyAc209EmailSendingSettings,
} from '../infra/workflows/ac209-email-sending-settings-capability.ts';
import { AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS } from '../infra/workflows/ac209-email-diagnostics.ts';
import {
  FIXTURE_MAX_DURATION_SECONDS,
  FIXTURE_NOT_OLDER_THAN_SECONDS,
  response,
  SETTINGS_FIELDS,
  settingsNode,
  settingsResponse,
  TOKEN as token,
  ZONE_ID as zoneId,
} from './ac209-email-sending-settings-fixtures.ts';

const verify = (fetchImpl: typeof fetch) =>
  verifyAc209EmailSendingSettings({ zoneId, token, fetchImpl });

describe('AC209 Email Sending settings capability preflight', () => {
  it('reads only the exact zone settings node through the shared bounded request boundary', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(settingsResponse()));

    await expect(verify(fetchImpl)).resolves.toBeUndefined();

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://api.cloudflare.com/client/v4/graphql');
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.headers).toEqual({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init?.body))).toEqual({
      query: AC209_EMAIL_SENDING_SETTINGS_QUERY,
      variables: { zoneTag: zoneId },
    });
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toContain('settings {');
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toMatch(
      /^\s*emailSendingAdaptive\s*\{$/mu,
    );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toContain(
      'zones(filter: { zoneTag: $zoneTag })',
    );
    for (const field of SETTINGS_FIELDS)
      expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).toMatch(
        new RegExp(`^\\s*${field}\\s*$`, 'mu'),
      );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).not.toMatch(
      /\b(?:from|to|subject|messageId|datetime|recipient|errorDetail)\b/iu,
    );
    expect(AC209_EMAIL_SENDING_SETTINGS_QUERY).not.toContain(
      'emailSendingAdaptiveGroups',
    );
    expect(String(init?.body)).not.toContain(token);
  });

  it('gates on exactly the fields the event query selects', async () => {
    // This gate and the read-only diagnostic must describe the same payload the
    // same way, and both must track the event query's own selections, so a
    // future selection change cannot leave either signal behind.
    expect(AC209_EMAIL_SENDING_SETTINGS_REQUIRED_FIELDS).toEqual(
      AC209_EMAIL_SENDING_REQUIRED_FIELDS,
    );
    expect(AC209_EMAIL_DIAGNOSTIC_REQUIRED_SETTINGS_FIELDS).toEqual(
      AC209_EMAIL_SENDING_REQUIRED_FIELDS,
    );
    expect(AC209_EMAIL_SENDING_REQUIRED_FIELDS).toHaveLength(7);
    for (const field of AC209_EMAIL_SENDING_SETTINGS_REQUIRED_FIELDS)
      expect(AC209_EMAIL_SENDING_QUERY).toMatch(
        new RegExp(`^\\s*${field}\\s*$`, 'mu'),
      );
  });

  it('accepts exactly the exercise window bound and rejects one second less', async () => {
    // The bound is the exercise's own one-hour analytics window, so the exact
    // value must pass and the first shortfall must fail closed.
    const accepted = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        settingsResponse(
          settingsNode({
            maxDuration: AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS,
            notOlderThan: AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS,
          }),
        ),
      ),
    );
    await expect(verify(accepted)).resolves.toBeUndefined();

    const rejected = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        settingsResponse(
          settingsNode({
            maxDuration: FIXTURE_MAX_DURATION_SECONDS,
            notOlderThan: AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS - 1,
          }),
        ),
      ),
    );
    await expect(verify(rejected)).rejects.toMatchObject({
      code: 'provider_resource_unavailable',
    });
  });

  it('accepts either an equal limit pair or a distinct single-request span', async () => {
    // The retained 2026-09-24 diagnostic artifact (run 35846435937) reported
    // notOlderThanSeconds and maxDurationSeconds as the same 2678400 value, so
    // the gate must not depend on the two differing. The fixtures keep them
    // distinct so the one-hour bound can never pass by reading one field twice.
    expect(FIXTURE_MAX_DURATION_SECONDS).not.toBe(
      FIXTURE_NOT_OLDER_THAN_SECONDS,
    );
    for (const seconds of [
      FIXTURE_MAX_DURATION_SECONDS,
      FIXTURE_NOT_OLDER_THAN_SECONDS,
    ])
      expect(seconds).toBeGreaterThan(
        AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS,
      );

    const retained = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        settingsResponse(
          settingsNode({
            maxDuration: FIXTURE_NOT_OLDER_THAN_SECONDS,
            notOlderThan: FIXTURE_NOT_OLDER_THAN_SECONDS,
          }),
        ),
      ),
    );
    await expect(verify(retained)).resolves.toBeUndefined();

    const distinct = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(settingsResponse()));
    await expect(verify(distinct)).resolves.toBeUndefined();
  });

  it('accepts a nested available-field path for every selected field', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        settingsResponse(
          settingsNode({
            availableFields: AC209_EMAIL_SENDING_REQUIRED_FIELDS.map(
              (field) => `dimensions.${field}`,
            ),
          }),
        ),
      ),
    );

    await expect(verify(fetchImpl)).resolves.toBeUndefined();
  });

  it('accepts a repeated available-field entry because it changes no capability', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        settingsResponse(
          settingsNode({
            availableFields: [
              ...AC209_EMAIL_SENDING_REQUIRED_FIELDS,
              AC209_EMAIL_SENDING_REQUIRED_FIELDS[0],
            ],
          }),
        ),
      ),
    );

    // A repeated entry neither withholds a selected field nor reduces a
    // requester limit, and the read-only diagnostic reports the same payload as
    // available. Rejecting it here would make the enforcing gate and the
    // diagnostic disagree about one provider payload.
    await expect(verify(fetchImpl)).resolves.toBeUndefined();
  });

  it('reports a permission denial without provider detail, the token, or the zone', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        errors: [{ message: `token ${token} cannot access ${zoneId}` }],
      }),
    );
    let captured: unknown;
    try {
      await verify(fetchImpl);
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Ac209EmailSendingAnalyticsError);
    if (!(captured instanceof Ac209EmailSendingAnalyticsError))
      throw new Error('expected an Email Sending analytics error');
    expect(captured.code).toBe('provider_permission_denied');
    expect(captured.message).not.toContain(token);
    expect(captured.message).not.toContain(zoneId);
  });
});
