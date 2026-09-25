import { describe, expect, it, vi } from 'vitest';

import { AC209_EMAIL_SENDING_REQUIRED_FIELDS } from '../infra/workflows/ac209-email-sending-analytics.ts';
import {
  AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS,
  verifyAc209EmailSendingSettings,
} from '../infra/workflows/ac209-email-sending-settings-capability.ts';
import {
  response,
  settingsNode,
  settingsResponse,
  TOKEN as token,
  withoutSettingsField,
  ZONE_ID as zoneId,
} from './ac209-email-sending-settings-fixtures.ts';

const verify = (fetchImpl: typeof fetch) =>
  verifyAc209EmailSendingSettings({ zoneId, token, fetchImpl });

/**
 * Every rejection path of the settings gate. A payload that violates the
 * documented settings shape reports `provider_response_invalid`; an otherwise
 * well-formed payload that withholds the capability the exercise needs - a
 * disabled dataset, a selected field the requester cannot see, or a limit too
 * small for the run - reports `provider_resource_unavailable`. Both fail closed
 * before the queue boundary opens.
 */
describe('AC209 Email Sending settings gate fail-closed shapes', () => {
  it('fails closed when the settings wrapper is absent', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        data: { viewer: { zones: [{}] } },
        errors: null,
      }),
    );

    await expect(verify(fetchImpl)).rejects.toMatchObject({
      code: 'provider_response_invalid',
    });
  });

  it.each([
    [
      'a disabled dataset',
      settingsNode({ enabled: false }),
      'provider_resource_unavailable',
    ],
    [
      'a non-boolean enabled flag',
      settingsNode({ enabled: 'true' }),
      'provider_response_invalid',
    ],
    [
      'a missing enabled flag',
      withoutSettingsField('enabled'),
      'provider_response_invalid',
    ],
    ['a missing settings node', null, 'provider_response_invalid'],
    [
      'a non-list availableFields',
      settingsNode({ availableFields: 'datetime' }),
      'provider_response_invalid',
    ],
    [
      'a non-string availableFields entry',
      settingsNode({ availableFields: ['datetime', 3] }),
      'provider_response_invalid',
    ],
    [
      'an empty availableFields entry',
      settingsNode({ availableFields: ['datetime', ''] }),
      'provider_response_invalid',
    ],
    [
      'an over-long availableFields entry',
      settingsNode({ availableFields: ['x'.repeat(300)] }),
      'provider_response_invalid',
    ],
    [
      'a malformed availableFields path',
      settingsNode({ availableFields: ['datetime', 'not a path'] }),
      'provider_response_invalid',
    ],
    [
      'an unbounded availableFields list',
      settingsNode({
        availableFields: [
          ...AC209_EMAIL_SENDING_REQUIRED_FIELDS,
          ...Array.from(
            { length: 506 },
            (_unused, index) => `extra_${String(index)}`,
          ),
        ],
      }),
      'provider_response_invalid',
    ],
    [
      'a missing selected field',
      settingsNode({
        availableFields: AC209_EMAIL_SENDING_REQUIRED_FIELDS.filter(
          (field) => field !== 'status',
        ),
      }),
      'provider_resource_unavailable',
    ],
    [
      'a nested path naming a different field',
      settingsNode({
        availableFields: AC209_EMAIL_SENDING_REQUIRED_FIELDS.map((field) =>
          field === 'status' ? 'dimensions.delivery_status' : field,
        ),
      }),
      'provider_resource_unavailable',
    ],
    [
      'a maxPageSize below the 50-row bound',
      settingsNode({ maxPageSize: 49 }),
      'provider_resource_unavailable',
    ],
    [
      'a maxNumberOfFields below the seven selections',
      settingsNode({ maxNumberOfFields: 6 }),
      'provider_resource_unavailable',
    ],
    [
      'a maxDuration below the exercise window',
      settingsNode({
        maxDuration: AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS - 1,
      }),
      'provider_resource_unavailable',
    ],
    [
      'a notOlderThan horizon below the exercise window',
      settingsNode({
        notOlderThan: AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS - 1,
      }),
      'provider_resource_unavailable',
    ],
    [
      'a missing maxDuration',
      withoutSettingsField('maxDuration'),
      'provider_response_invalid',
    ],
    [
      'a missing notOlderThan horizon',
      withoutSettingsField('notOlderThan'),
      'provider_response_invalid',
    ],
    [
      'a non-numeric maxDuration',
      settingsNode({ maxDuration: '2592000' }),
      'provider_response_invalid',
    ],
    [
      'a non-numeric notOlderThan horizon',
      settingsNode({ notOlderThan: '2678400' }),
      'provider_response_invalid',
    ],
    [
      'a negative maxDuration',
      settingsNode({ maxDuration: -1 }),
      'provider_response_invalid',
    ],
    [
      'a negative notOlderThan horizon',
      settingsNode({ notOlderThan: -1 }),
      'provider_response_invalid',
    ],
    [
      'a non-integer maxPageSize',
      settingsNode({ maxPageSize: 50.5 }),
      'provider_response_invalid',
    ],
    [
      'a negative maxPageSize',
      settingsNode({ maxPageSize: -1 }),
      'provider_response_invalid',
    ],
    [
      'a missing maxNumberOfFields',
      withoutSettingsField('maxNumberOfFields'),
      'provider_response_invalid',
    ],
    [
      'a non-numeric maxNumberOfFields',
      settingsNode({ maxNumberOfFields: '30' }),
      'provider_response_invalid',
    ],
  ])('fails closed for %s', async (_label, node, code) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(settingsResponse(node)));

    await expect(verify(fetchImpl)).rejects.toMatchObject({ code });
  });

  it('fails closed when the exact zone is unavailable', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        response({ data: { viewer: { zones: [] } }, errors: null }),
      );

    await expect(verify(fetchImpl)).rejects.toMatchObject({
      code: 'provider_resource_unavailable',
    });
  });

  it('fails closed when the zone result is not unique', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      response({
        data: {
          viewer: {
            zones: [
              { settings: { emailSendingAdaptive: settingsNode() } },
              { settings: { emailSendingAdaptive: settingsNode() } },
            ],
          },
        },
        errors: null,
      }),
    );

    await expect(verify(fetchImpl)).rejects.toMatchObject({
      code: 'provider_response_invalid',
    });
  });

  it.each([
    [401, 'provider_permission_denied'],
    [403, 'provider_permission_denied'],
    [500, 'provider_request_failed'],
  ] as const)('fails closed on HTTP %i', async (status, code) => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response({ ok: false }, status));

    await expect(verify(fetchImpl)).rejects.toMatchObject({ code });
  });

  it('rejects invalid input without a provider request', async () => {
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(
      verifyAc209EmailSendingSettings({
        zoneId: 'not-a-zone',
        token,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      verifyAc209EmailSendingSettings({ zoneId, token: 'short', fetchImpl }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    await expect(
      verifyAc209EmailSendingSettings({
        zoneId,
        token: 'token with whitespace',
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: 'invalid_configuration' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not misclassify an unexpected internal fault as a provider verdict', async () => {
    const privateDetail = 'secret-token unexpected settings detail';
    // The fault fires after the configuration is validated but before any
    // provider verdict is reached, which is the shape of an internal fault
    // rather than a configuration or provider result.
    const faultingResponse = {} as Response;
    Object.defineProperty(faultingResponse, 'status', {
      get() {
        throw new Error(privateDetail);
      },
    });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(faultingResponse);
    let captured: unknown;

    try {
      await verify(fetchImpl);
    } catch (error: unknown) {
      captured = error;
    }

    expect(captured).toBeInstanceOf(Error);
    if (!(captured instanceof Error))
      throw new Error('expected a settings gate error');
    expect(captured).toMatchObject({ code: 'unexpected_failure' });
    expect(captured.message).not.toContain(privateDetail);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
