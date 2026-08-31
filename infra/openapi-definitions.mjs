export const EMPTY_REQUEST_SCHEMA = 'EmptyRequestSchema';

export const routeDefinitions = {
  healthRead: {
    responses: [
      { status: '200', description: 'Process is healthy', schema: 'success' },
    ],
  },
  readinessRead: {
    responses: [
      { status: '200', description: 'Service is ready', schema: 'success' },
      {
        status: '503',
        description: 'Service is not ready',
        schema: 'success',
      },
    ],
  },
  diagnosticsRead: {
    responses: [
      {
        status: '200',
        description: 'Authorized diagnostic summary',
        schema: 'success',
      },
      {
        status: '400',
        description: 'A bounded diagnostic reason is required',
        schema: 'error',
      },
      {
        status: '401',
        description: 'Authentication or step-up required',
        schema: 'error',
      },
      {
        status: '403',
        description: 'Named capability required',
        schema: 'error',
      },
      {
        status: '503',
        description: 'Diagnostic composition unavailable',
        schema: 'error',
      },
    ],
  },
  jobStatusRead: {
    responses: [
      {
        status: '200',
        description: 'Authorized current job status',
        schema: 'success',
        headers: 'entity',
      },
      {
        status: '304',
        description: 'Authorized status has not changed',
        headers: 'entity',
      },
      {
        status: '400',
        description: 'Job identifier is invalid',
        schema: 'error',
      },
      {
        status: '401',
        description: 'Authentication is required',
        schema: 'error',
      },
      {
        status: '404',
        description: 'Job is absent or not visible',
        schema: 'error',
      },
      {
        status: '429',
        description: 'Job read rate limit exceeded',
        schema: 'error',
        headers: 'rate',
      },
      {
        status: '500',
        description: 'Job status composition failed',
        schema: 'error',
      },
      {
        status: '503',
        description: 'Job status dependency unavailable',
        schema: 'error',
      },
    ],
  },
  uploadIntentCreate: {
    responses: [
      {
        status: '201',
        description: 'Authorized upload intent created',
        schema: 'success',
        headers: 'mutation',
      },
      {
        status: '400',
        description: 'Upload-admission request is malformed',
        schema: 'error',
      },
      {
        status: '401',
        description: 'Authentication is required',
        schema: 'error',
      },
      {
        status: '403',
        description: 'Visible upload target is forbidden',
        schema: 'error',
      },
      {
        status: '404',
        description: 'Upload target is absent or concealed',
        schema: 'error',
      },
      {
        status: '409',
        description: 'Version or idempotency binding conflicts',
        schema: 'error',
      },
      {
        status: '413',
        description: 'Declared upload exceeds the route or target limit',
        schema: 'error',
      },
      {
        status: '415',
        description: 'Request media type is unsupported',
        schema: 'error',
      },
      {
        status: '422',
        description: 'Upload-admission fields fail semantic validation',
        schema: 'error',
      },
      {
        status: '429',
        description: 'Upload-admission rate or concurrency limit exceeded',
        schema: 'error',
        headers: 'rate',
      },
      {
        status: '500',
        description: 'Upload-admission composition failed',
        schema: 'error',
      },
      {
        status: '503',
        description: 'Upload-admission dependency unavailable',
        schema: 'error',
      },
    ],
  },
  uploadIntentComplete: {
    responses: [
      {
        status: '202',
        description: 'Upload accepted for asynchronous verification',
        schema: 'success',
        headers: 'mutation',
      },
      {
        status: '400',
        description: 'Upload-completion request is malformed',
        schema: 'error',
      },
      {
        status: '401',
        description: 'Authentication is required',
        schema: 'error',
      },
      {
        status: '403',
        description: 'Live upload intent or target is forbidden',
        schema: 'error',
      },
      {
        status: '404',
        description: 'Upload intent is absent or concealed',
        schema: 'error',
      },
      {
        status: '409',
        description: 'Version or idempotency binding conflicts',
        schema: 'error',
      },
      {
        status: '415',
        description: 'Request media type is unsupported',
        schema: 'error',
      },
      {
        status: '422',
        description: 'Completion evidence fails semantic validation',
        schema: 'error',
      },
      {
        status: '429',
        description: 'Completion rate or concurrency limit exceeded',
        schema: 'error',
        headers: 'rate',
      },
      {
        status: '500',
        description: 'Upload-completion composition failed',
        schema: 'error',
      },
      {
        status: '503',
        description: 'Upload-completion dependency unavailable',
        schema: 'error',
      },
    ],
  },
};

const integerHeader = (description) => ({
  description,
  schema: { type: 'integer', minimum: 0 },
});

const rateHeaders = {
  'RateLimit-Limit': integerHeader('Maximum reads permitted in the window.'),
  'RateLimit-Remaining': integerHeader('Reads remaining in the window.'),
  'RateLimit-Reset': integerHeader('UTC epoch second when the window resets.'),
};

export const entityHeaders = {
  ETag: {
    description: 'Strong validator for the authorized job representation.',
    schema: { type: 'string' },
  },
  ...rateHeaders,
};

export const mutationHeaders = {
  ETag: {
    description: 'Strong validator for the canonical affected object.',
    schema: { type: 'string' },
  },
  Location: {
    description: 'Canonical URL of the created or accepted resource.',
    schema: { type: 'string', format: 'uri-reference' },
  },
  ...rateHeaders,
};

export const retryHeaders = {
  ...rateHeaders,
  'Retry-After': integerHeader('Seconds until another read may be attempted.'),
};
