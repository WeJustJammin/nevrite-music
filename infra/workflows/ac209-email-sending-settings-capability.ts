import {
  AC209_EMAIL_SENDING_MAX_WINDOW_MS,
  AC209_EMAIL_SENDING_PAGE_LIMIT,
  AC209_EMAIL_SENDING_REQUIRED_FIELDS,
  Ac209EmailSendingAnalyticsError,
  Ac209EmailSendingCapabilityInputSchema,
  failAc209EmailSendingAnalytics,
  readAc209EmailSendingZoneRecord,
  requestAc209EmailSendingGraphql,
  type Ac209EmailSendingCapabilityInput,
} from './ac209-email-sending-analytics.ts';

/**
 * AC209 Email Sending Settings-node capability gate.
 *
 * The events probe in `ac209-email-sending-analytics.ts` proves the token can
 * read the dataset, and it accepts an empty window because zero events still
 * proves read access. It therefore cannot prove the capabilities the exercise
 * depends on: a disabled dataset and a missing selected field both look like a
 * successful read of zero rows. This module reads the documented
 * `zones(...).settings.emailSendingAdaptive` node and fails closed unless the
 * dataset is enabled, every field the event query selects is available to the
 * requester, and the requester limits cover the 50-row bound and all seven
 * selections.
 *
 * It is read-only, performs no mutation, and reports only closed diagnostic
 * codes: no provider body, path, extension, field value, zone tag, or token can
 * reach its output. The settings-node readers live here and are shared with
 * `ac209-email-diagnostics.ts`, so the enforcing gate and the read-only
 * diagnostic cannot disagree about the same provider payload.
 */

/** The window query selects exactly these fields; this gate compares them. */
export const AC209_EMAIL_SENDING_SETTINGS_REQUIRED_FIELDS =
  AC209_EMAIL_SENDING_REQUIRED_FIELDS;

/**
 * Documented Settings-node shape: `settings` is available for zone scope and
 * exposes each zone dataset as a field with `enabled`, `availableFields`,
 * `maxPageSize`, `maxNumberOfFields`, `notOlderThan`, and `maxDuration`.
 */
export const AC209_EMAIL_SENDING_SETTINGS_QUERY =
  `query Ac209EmailSendingSettings($zoneTag: string!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      settings {
        emailSendingAdaptive {
          enabled
          availableFields
          maxPageSize
          maxNumberOfFields
          notOlderThan
          maxDuration
        }
      }
    }
  }
}` as const;

/** Settings paths may be nested, so a dot-separated path is valid. */
const SETTINGS_FIELD_PATH =
  /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/u;
const MAX_SETTINGS_FIELD_LENGTH = 256;
export const AC209_EMAIL_SENDING_MAX_SETTINGS_FIELDS = 512 as const;

/**
 * The widest span this exercise ever asks the provider for. Every Email Sending
 * request the exercise issues is bounded by the one-hour analytics window, so a
 * requester whose single-request or retention limit is below this cannot serve
 * the exercise at all. Gating both here keeps the read-only diagnostic's report
 * shape unchanged while still failing closed before any queue mutation.
 */
export const AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS =
  AC209_EMAIL_SENDING_MAX_WINDOW_MS / 1_000;

export type Ac209EmailSendingSettingsInput = Ac209EmailSendingCapabilityInput;

/**
 * Bounded, non-PII reading of one provider settings node. Every value is a
 * boolean, a count, or a closed derived verdict, so the diagnostic report and
 * the enforcing gate describe the same payload the same way.
 */
export type Ac209EmailSendingSettingsFacts = Readonly<{
  enabled: boolean;
  availableFieldCount: number;
  requiredFieldsAvailable: boolean;
  requiredFieldsMissing: number;
  maxPageSize: number;
  maxNumberOfFields: number;
  notOlderThanSeconds: number;
  maxDurationSeconds: number;
  supportsPageLimit: boolean;
  supportsRequiredFields: boolean;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const readAc209EmailSendingSettingsCount = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings field is malformed.',
    );
  return value;
};

export const readAc209EmailSendingAvailableFields = (
  value: unknown,
): readonly string[] => {
  if (
    !Array.isArray(value) ||
    value.length > AC209_EMAIL_SENDING_MAX_SETTINGS_FIELDS
  )
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings availableFields is malformed.',
    );
  const fields: string[] = [];
  for (const entry of value) {
    if (
      typeof entry !== 'string' ||
      entry.length > MAX_SETTINGS_FIELD_LENGTH ||
      !SETTINGS_FIELD_PATH.test(entry)
    )
      failAc209EmailSendingAnalytics(
        'provider_response_invalid',
        'settings availableFields is malformed.',
      );
    fields.push(entry);
  }
  return fields;
};

/**
 * The event query selects bare field names while availableFields may report a
 * nested path such as `dimensions.status`, so a selected field counts as
 * available when any reported path names it as its last segment.
 */
export const isAc209EmailSendingFieldAvailable = (
  field: string,
  availableFields: readonly string[],
): boolean =>
  availableFields.some(
    (candidate) => candidate === field || candidate.endsWith(`.${field}`),
  );

export const readAc209EmailSendingSettingsFacts = (
  payload: unknown,
): Ac209EmailSendingSettingsFacts => {
  const zone = readAc209EmailSendingZoneRecord(payload);
  const settings = zone.settings;
  if (!isRecord(settings))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings result is malformed.',
    );
  const node = settings.emailSendingAdaptive;
  if (!isRecord(node))
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings dataset is malformed.',
    );
  if (typeof node.enabled !== 'boolean')
    failAc209EmailSendingAnalytics(
      'provider_response_invalid',
      'settings enabled flag is malformed.',
    );
  const availableFields = readAc209EmailSendingAvailableFields(
    node.availableFields,
  );
  const maxPageSize = readAc209EmailSendingSettingsCount(node.maxPageSize);
  const maxNumberOfFields = readAc209EmailSendingSettingsCount(
    node.maxNumberOfFields,
  );
  const notOlderThanSeconds = readAc209EmailSendingSettingsCount(
    node.notOlderThan,
  );
  const maxDurationSeconds = readAc209EmailSendingSettingsCount(
    node.maxDuration,
  );
  const missing = AC209_EMAIL_SENDING_SETTINGS_REQUIRED_FIELDS.filter(
    (field) => !isAc209EmailSendingFieldAvailable(field, availableFields),
  );
  return {
    enabled: node.enabled,
    availableFieldCount: availableFields.length,
    requiredFieldsAvailable: missing.length === 0,
    requiredFieldsMissing: missing.length,
    maxPageSize,
    maxNumberOfFields,
    notOlderThanSeconds,
    maxDurationSeconds,
    supportsPageLimit: maxPageSize >= AC209_EMAIL_SENDING_PAGE_LIMIT,
    supportsRequiredFields:
      maxNumberOfFields >= AC209_EMAIL_SENDING_SETTINGS_REQUIRED_FIELDS.length,
  };
};

/**
 * Fails closed unless the exact zone's dataset is enabled, every selected field
 * is available to this requester, and the requester limits cover the exercise's
 * 50-row bound, all seven selections, and its own one-hour analytics window. A
 * disabled dataset, an unavailable field, and insufficient limits report
 * `provider_resource_unavailable` because all three are provider capability
 * shortfalls rather than malformed responses; a payload that violates the
 * documented settings shape reports `provider_response_invalid`.
 */
export const verifyAc209EmailSendingSettings = async (
  input: Ac209EmailSendingSettingsInput,
): Promise<void> => {
  let configurationValidated = false;
  try {
    const { fetchImpl, ...configuration } = input;
    const parsed = Ac209EmailSendingCapabilityInputSchema.parse(configuration);
    configurationValidated = true;
    const facts = readAc209EmailSendingSettingsFacts(
      await requestAc209EmailSendingGraphql(fetchImpl ?? fetch, parsed.token, {
        query: AC209_EMAIL_SENDING_SETTINGS_QUERY,
        variables: { zoneTag: parsed.zoneId },
      }),
    );
    if (!facts.enabled)
      failAc209EmailSendingAnalytics(
        'provider_resource_unavailable',
        'provider dataset is disabled.',
      );
    if (!facts.requiredFieldsAvailable)
      failAc209EmailSendingAnalytics(
        'provider_resource_unavailable',
        'provider field is unavailable.',
      );
    if (!facts.supportsPageLimit || !facts.supportsRequiredFields)
      failAc209EmailSendingAnalytics(
        'provider_resource_unavailable',
        'provider limits are insufficient.',
      );
    // A single-request span or retention horizon below the exercise's own
    // bounded window would abort the run at the evidence stage, after the queue
    // boundary has already opened and the marker has been pushed.
    if (
      facts.maxDurationSeconds < AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS ||
      facts.notOlderThanSeconds < AC209_EMAIL_SENDING_REQUIRED_WINDOW_SECONDS
    )
      failAc209EmailSendingAnalytics(
        'provider_resource_unavailable',
        'provider window limits are insufficient.',
      );
  } catch (error: unknown) {
    if (error instanceof Ac209EmailSendingAnalyticsError) throw error;
    failAc209EmailSendingAnalytics(
      configurationValidated ? 'unexpected_failure' : 'invalid_configuration',
    );
  }
};
