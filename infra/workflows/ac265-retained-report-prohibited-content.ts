const FAILURE = 'AC265 retained report redaction failed.';

// Markers are matched against *decoded* strings and object member names, so an
// escape sequence in the published bytes cannot hide them. Markers exist to
// catch material that a structural class alone cannot: header forms, credential
// and session-storage vocabulary, tokens, and retained binary/observation
// payload indicators. They are one layer of the redaction boundary, not a
// substitute for the field-aware and provenance-bound checks that reject any
// value outside its trusted slot.
const PROHIBITED_MARKERS = [
  'bearer',
  'basic ',
  'authorization',
  'oauth',
  'set-cookie',
  'httponly',
  'samesite',
  'cookie',
  'localstorage',
  'sessionstorage',
  'indexeddb',
  'storage-state',
  'storage_state',
  'storagestate',
  'user-data-dir',
  'session-state',
  'session_state',
  'token',
  'access-token',
  'accesstoken',
  'access_token',
  'refresh-token',
  'refreshtoken',
  'refresh_token',
  'id-token',
  'idtoken',
  'jwt',
  'client-secret',
  'clientsecret',
  'api-key',
  'apikey',
  'private key',
  'privatekey',
  'password',
  'passwd',
  'credential',
  'secretkey',
  'secret-key',
  'secret_key',
  'eyj',
  'data:image',
  'data:video',
  'data:audio',
  'data:application',
  'data:text',
  'trace.zip',
  '.har',
  'screenshot',
  'video.webm',
  'playwright-report',
  '@',
] as const;

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}/u;

// `@` alone is prohibited because the retained report never legitimately needs
// it: origins, digests, references, identifiers, and timestamps all exclude it,
// and it is the single character that makes a person-identifying address.
const hasProhibitedMarker = (value: string): boolean => {
  const normalized = value.toLowerCase();
  if (EMAIL_PATTERN.test(value)) return true;
  return PROHIBITED_MARKERS.some((marker) => normalized.includes(marker));
};

const fail = (): never => {
  throw new Error(FAILURE);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// Walks every object member name and every string leaf of the decoded value.
export const assertAc265RetainedReportProhibitedContentAbsent = (
  value: unknown,
): void => {
  const pending: unknown[] = [value];
  let visited = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    visited += 1;
    if (visited > 10_000) return fail();
    if (typeof current === 'string') {
      if (hasProhibitedMarker(current)) return fail();
      continue;
    }
    if (Array.isArray(current)) {
      for (const entry of current) pending.push(entry);
      continue;
    }
    if (isRecord(current))
      for (const [key, entry] of Object.entries(current)) {
        if (hasProhibitedMarker(key)) return fail();
        pending.push(entry);
      }
  }
};

export const AC265_RETAINED_REPORT_FAILURE = FAILURE;
