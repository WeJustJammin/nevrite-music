export const SETTINGS_FLAGS_RUNTIME_ERROR_CODES = [
  'APPROVAL_INVALID',
  'CONSENT_REQUIRED',
  'CONTROL_PLANE_UNAVAILABLE',
  'DEFINITION_NOT_FOUND',
  'EXPERIMENT_NOT_FOUND',
  'FLAG_INVALID',
  'FLAG_NOT_FOUND',
  'FORBIDDEN',
  'IDEMPOTENCY_CONFLICT',
  'INVALID_DEFINITION',
  'INVALID_REQUEST',
  'NOT_FOUND',
  'RATE_LIMITED',
  'REVIEW_NOT_FOUND',
  'SNAPSHOT_UNAVAILABLE',
  'STALE_DEFINITION',
  'STEP_UP_REQUIRED',
  'SWITCH_INVALID',
  'SWITCH_NOT_FOUND',
  'UNAUTHENTICATED',
  'UPSTREAM_TIMEOUT',
  'VALUE_INVALID',
  'VALUE_UNAVAILABLE',
  'VERSION_CONFLICT',
] as const;

export const SETTINGS_FLAGS_RUNTIME_BOUNDARY = Object.freeze({
  operationPrefix: 'CFG-05A',
  operationIds: ['CFG-05A-02', 'CFG-05A-03', 'CFG-05A-04'],
  serviceOnlyOperation: 'CFG-05A-01',
  state: 'active',
  security: 'security-only fields never serialize to browser props',
});

/** Keyboard behavior remains stable across the server and lazy client entry. */
export const SETTINGS_FLAGS_RUNTIME_INTERACTION_CONTRACT = Object.freeze({
  openKey: 'Enter',
  closeKey: 'Escape',
  focus: 'return-to-trigger',
  views: ['list', 'detail'],
  selected: true,
  errorCodes: SETTINGS_FLAGS_RUNTIME_ERROR_CODES,
  errorCodeLabels: SETTINGS_FLAGS_RUNTIME_ERROR_CODES.join(', '),
});
