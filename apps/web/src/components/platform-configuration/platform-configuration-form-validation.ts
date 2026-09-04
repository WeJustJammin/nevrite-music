import type { PlatformConfigurationError } from './platform-configuration-workbench-types';

const FIELD_IDS = new Set([
  'scopeType',
  'scopeId',
  'environment',
  'typedValue',
  'effectiveFrom',
  'effectiveTo',
  'impactManifest',
  'rollbackCandidate',
  'consumerKeys',
  'reason',
  'action',
  'approvalReason',
  'stepUpToken',
  'scheduledFor',
  'rollbackValue',
]);

const POINTER_FIELD_ALIASES: Readonly<Record<string, string>> = {
  interval: 'effectiveFrom',
  'interval.effectiveFrom': 'effectiveFrom',
  'interval.effectiveTo': 'effectiveTo',
};

const decodePointerSegment = (segment: string): string =>
  segment.replaceAll('~1', '/').replaceAll('~0', '~');

const pointerSegments = (path: string): readonly string[] => {
  const value = path.trim();
  if (value === '' || value === '/') return [];
  const pointer = value.startsWith('/') ? value.slice(1) : value;
  return pointer
    .split('/')
    .map(decodePointerSegment)
    .filter((segment) => segment.length > 0);
};

/** Map a server JSON Pointer to the id of a visible form control, if known. */
export const normalizeValidationPath = (path: string): string | null => {
  const segments = pointerSegments(path);
  if (segments.length === 0) return null;

  const dotted = segments.join('.');
  const aliased = POINTER_FIELD_ALIASES[dotted];
  if (aliased !== undefined) return aliased;

  const first = segments[0];
  if (first !== undefined && FIELD_IDS.has(first)) return first;

  // Some request-boundary envelopes prefix the actual field path.  Only
  // return known control ids; never turn an arbitrary server path into a DOM
  // selector.
  const last = segments.at(-1);
  return last !== undefined && FIELD_IDS.has(last) ? last : null;
};

export const fieldViolation = (
  field: string,
  error?: PlatformConfigurationError,
) =>
  error?.details?.violations?.find(
    (item) => normalizeValidationPath(item.path) === field,
  );

export const invalidProps = (
  field: string,
  error?: PlatformConfigurationError,
  helpId?: string,
) => {
  const violation = fieldViolation(field, error);
  return violation === undefined
    ? helpId === undefined
      ? {}
      : { 'aria-describedby': helpId }
    : {
        'aria-invalid': true,
        'aria-describedby': [
          helpId,
          `${field}-error`,
          'platform-configuration-validation-summary',
        ]
          .filter((value): value is string => value !== undefined)
          .join(' '),
      };
};
