import { AC209_EMAIL_SENDING_REQUIRED_FIELDS } from '../infra/workflows/ac209-email-sending-analytics.ts';

export const ZONE_ID = '5bfba340525c623584c47d631116804c';
export const TOKEN = 'observability-token-that-must-never-be-emitted';

/** Every field the settings query selects, in documented order. */
export const SETTINGS_FIELDS = [
  'enabled',
  'availableFields',
  'maxPageSize',
  'maxNumberOfFields',
  'notOlderThan',
  'maxDuration',
] as const;

/**
 * The live requester limits the 2026-09-24 diagnostic runs reported: a 30-day
 * single-request span and a 31-day retention horizon, deliberately distinct so a
 * test cannot pass by conflating them.
 */
export const LIVE_MAX_DURATION_SECONDS = 2_592_000;
export const LIVE_NOT_OLDER_THAN_SECONDS = 2_678_400;

export const response = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const settingsNode = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  enabled: true,
  availableFields: [...AC209_EMAIL_SENDING_REQUIRED_FIELDS],
  maxDuration: LIVE_MAX_DURATION_SECONDS,
  maxNumberOfFields: 30,
  maxPageSize: 10_000,
  notOlderThan: LIVE_NOT_OLDER_THAN_SECONDS,
  ...overrides,
});

export const withoutSettingsField = (
  field: string,
): Record<string, unknown> => {
  const node = settingsNode();
  delete node[field];
  return node;
};

export const settingsResponse = (node: unknown = settingsNode()) => ({
  data: { viewer: { zones: [{ settings: { emailSendingAdaptive: node } }] } },
  errors: null,
});
