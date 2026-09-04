import type {
  AuthorizationStart,
  JobStatus,
  LoginMethodsResource,
  MergeCaseResource,
  ProviderCatalog,
} from '@wejammin/contracts';

import type { WorkerBindings } from '../index';

export const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
export const AUTH_USER_ID = '22222222-2222-4222-8222-222222222222';
export const SESSION_ID = '33333333-3333-4333-8333-333333333333';
export const PERSON_ID = '44444444-4444-4444-8444-444444444444';
export const IDENTITY_ID = '55555555-5555-4555-8555-555555555555';
export const MERGE_ID = '66666666-6666-4666-8666-666666666666';
export const JOB_ID = '77777777-7777-4777-8777-777777777777';
export const INTENT_ID = '88888888-8888-4888-8888-888888888888';
export const ORIGIN = 'https://api.example.test';
export const CSRF =
  'slice02-csrf-random.1ee2dc5deb3a71512e7fbd07c44baabae2fcdf0b8e73262a0c4bf9e5aaef77f1';

export const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'phase-02-slice-02-test',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

export const session = {
  authUserId: AUTH_USER_ID,
  sessionId: SESSION_ID,
  accountState: 'active',
  personId: PERSON_ID,
  actingPartyId: PERSON_ID,
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  stepUpAt: new Date(Date.now() - 60_000).toISOString(),
} as const;

export const loginMethods: LoginMethodsResource = {
  methods: [
    {
      id: IDENTITY_ID,
      provider: 'google',
      label: 'Google',
      verifiedAt: '2026-09-01T05:00:00Z',
      lastUsedAt: null,
      removable: true,
    },
  ],
  recoveryBaselinePresent: true,
  version: '7',
};

export const mergeCase: MergeCaseResource = {
  mergeId: MERGE_ID,
  state: 'awaiting_duplicate_proof',
  expiresAt: '2026-09-02T05:00:00Z',
  conflictPlanVersion: null,
  jobId: null,
  version: '1',
};

export const authorization: AuthorizationStart = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  expiresAt: '2026-09-01T05:10:00Z',
  intentId: INTENT_ID,
};

export const providerCatalog: ProviderCatalog = {
  providers: [{ code: 'google', label: 'Google', state: 'enabled' }],
  emailRecoveryEnabled: true,
  version: '1',
};

export const job: JobStatus = {
  id: JOB_ID,
  type: 'identity.account.merge',
  state: 'queued',
  progress: null,
  resultRef: null,
  error: null,
  createdAt: '2026-09-01T05:00:00.000Z',
  updatedAt: '2026-09-01T05:00:00.000Z',
};
