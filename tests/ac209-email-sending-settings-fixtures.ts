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
 * Synthetic limit values for these fixtures. They are not a retained reading of
 * the live requester: the retained 2026-09-24 diagnostic artifact from run
 * 35846435937 reported `notOlderThanSeconds` and `maxDurationSeconds` both as
 * 2678400, and the distinct 2592000/2678400 pair appears only in this
 * repository's own test fixture for the day-counts diagnostic. They are kept
 * deliberately distinct here so the window gate can never pass by conflating
 * the single-request span with the retention horizon.
 */
export const FIXTURE_MAX_DURATION_SECONDS = 2_592_000;
export const FIXTURE_NOT_OLDER_THAN_SECONDS = 2_678_400;

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
  maxDuration: FIXTURE_MAX_DURATION_SECONDS,
  maxNumberOfFields: 30,
  maxPageSize: 10_000,
  notOlderThan: FIXTURE_NOT_OLDER_THAN_SECONDS,
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
