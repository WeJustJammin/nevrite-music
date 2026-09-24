import { createHash } from 'node:crypto';

import {
  acquireAc265HostedOutageLease,
  consumeAc265HostedOutageLease,
  releaseAc265HostedOutageLease,
} from '../infra/workflows/ac265-outage-lease-rpc.ts';

export const SUPABASE_PROJECT_REF = 'abcdefghijklmnopqrst';
export const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
export const SERVICE_ROLE_KEY = 'sb_secret_ac265-outage-lease-fixture';
export const CRITERION = 'P2-S09-AC-265' as const;
export const SCHEMA_VERSION = 'ac265-hosted-outage-lease-control-v1' as const;
export const AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000001';
export const TARGET_REF =
  'ac265-outage-target://staging/74000000-0000-4000-8000-000000000001';
export const LEASE_REF =
  'ac265-lease://staging/76000000-0000-4000-8000-000000000001';
export const OTHER_LEASE_REF =
  'ac265-lease://staging/76000000-0000-4000-8000-000000000002';
export const ACQUIRE_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000001';
export const CONSUME_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000002';
export const RELEASE_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000003';
export const ACQUIRED_AT = '2026-09-23T10:00:00.000Z';
export const EXPIRES_AT = '2026-09-23T10:01:00.000Z';
export const CONSUMED_AT = '2026-09-23T10:00:15.000Z';
export const RELEASED_AT = '2026-09-23T10:00:30.000Z';

export type Json = Record<string, unknown>;
export type Mutation = (payload: Json) => Json;

export const sha256Hex = (value: string): string =>
  createHash('sha256').update(Buffer.from(value, 'utf8')).digest('hex');
export const LEASE_SHA256 = sha256Hex(LEASE_REF);

export const mutating =
  (key: string, value: unknown): Mutation =>
  (payload) => ({ ...payload, [key]: value });

export const acquireRequest: Json = {
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
  idempotencyRef: ACQUIRE_IDEMPOTENCY_REF,
  leaseDurationSeconds: 60,
  requestLimit: 1,
};

export const leaseRequest = (idempotencyRef: string): Json => ({
  criterion: CRITERION,
  schemaVersion: SCHEMA_VERSION,
  authorizationRef: AUTHORIZATION_REF,
  targetRef: TARGET_REF,
  idempotencyRef,
  leaseRef: LEASE_REF,
  leaseSha256: LEASE_SHA256,
});

export const consumeRequest = leaseRequest(CONSUME_IDEMPOTENCY_REF);
export const releaseRequest = leaseRequest(RELEASE_IDEMPOTENCY_REF);

export const acquireResult: Json = {
  ...acquireRequest,
  leaseRef: LEASE_REF,
  leaseSha256: LEASE_SHA256,
  environment: 'staging',
  state: 'acquired',
  acquiredAt: ACQUIRED_AT,
  expiresAt: EXPIRES_AT,
  redacted: true,
};

export const consumeResult: Json = {
  ...consumeRequest,
  environment: 'staging',
  state: 'consumed',
  requestLimit: 1,
  consumedAt: CONSUMED_AT,
  redacted: true,
};

export const releaseResult: Json = {
  ...releaseRequest,
  environment: 'staging',
  state: 'released',
  releasedAt: RELEASED_AT,
  redacted: true,
};

const OTHER_AUTHORIZATION_REF =
  'ac265-authorization://staging/72000000-0000-4000-8000-000000000009';
const OTHER_TARGET_REF =
  'ac265-outage-target://staging/74000000-0000-4000-8000-000000000009';
const OTHER_IDEMPOTENCY_REF =
  'ac265-idempotency://staging/75000000-0000-4000-8000-000000000009';

const identityMutations: readonly Mutation[] = [
  mutating('authorizationRef', OTHER_AUTHORIZATION_REF),
  mutating('targetRef', OTHER_TARGET_REF),
  mutating('idempotencyRef', OTHER_IDEMPOTENCY_REF),
  mutating('environment', 'production'),
  mutating('redacted', false),
  mutating('criterion', 'P2-S09-AC-266'),
];

export interface Case {
  readonly operation: 'acquire' | 'consume' | 'release';
  readonly rpc: string;
  readonly call: (options: unknown, request: unknown) => Promise<unknown>;
  readonly request: Json;
  readonly result: Json;
  readonly failed: string;
  readonly conflicts: readonly Mutation[];
}

export const cases: readonly Case[] = [
  {
    operation: 'acquire',
    rpc: 'ac265_hosted_outage_lease_acquire',
    call: acquireAc265HostedOutageLease,
    request: acquireRequest,
    result: acquireResult,
    failed: 'AC265 outage lease acquire failed',
    conflicts: [
      ...identityMutations,
      mutating('state', 'consumed'),
      mutating('expiresAt', '2026-09-23T10:01:01.000Z'),
      mutating('expiresAt', '2026-09-23T10:00:59.000Z'),
      mutating('leaseSha256', sha256Hex(OTHER_LEASE_REF)),
      mutating('leaseSha256', 'A'.repeat(64)),
      mutating('leaseRef', 'ac265-lease://staging/not-a-uuid'),
    ],
  },
  {
    operation: 'consume',
    rpc: 'ac265_hosted_outage_lease_consume',
    call: consumeAc265HostedOutageLease,
    request: consumeRequest,
    result: consumeResult,
    failed: 'AC265 outage lease consume failed',
    conflicts: [
      ...identityMutations,
      mutating('state', 'released'),
      mutating('leaseRef', OTHER_LEASE_REF),
      mutating('leaseSha256', sha256Hex(OTHER_LEASE_REF)),
    ],
  },
  {
    operation: 'release',
    rpc: 'ac265_hosted_outage_lease_release',
    call: releaseAc265HostedOutageLease,
    request: releaseRequest,
    result: releaseResult,
    failed: 'AC265 outage lease release failed',
    conflicts: [
      ...identityMutations,
      mutating('state', 'acquired'),
      mutating('leaseRef', OTHER_LEASE_REF),
      mutating('leaseSha256', sha256Hex(OTHER_LEASE_REF)),
    ],
  },
];

export const options = (fetchImpl: typeof fetch) => ({
  supabaseUrl: SUPABASE_URL,
  supabaseProjectRef: SUPABASE_PROJECT_REF,
  serviceRoleKey: SERVICE_ROLE_KEY,
  fetchImpl,
});

export const responseFor = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
