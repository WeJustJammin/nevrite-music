import { createHash } from 'node:crypto';

import {
  AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS,
  ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema,
  ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema,
  ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema,
  ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema,
  type ContentSchemaRegistryAc265OutageLeaseAcquireResult,
  type ContentSchemaRegistryAc265OutageLeaseConsumeResult,
  type ContentSchemaRegistryAc265OutageLeaseReleaseResult,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-control.ts';
import {
  invokeAc265OutageLeaseRpc,
  type Ac265OutageLeaseRpcOptions,
} from './ac265-outage-lease-transport.ts';

export {
  AC265_OUTAGE_LEASE_HTTP_MAX_RESPONSE_BYTES,
  AC265_OUTAGE_LEASE_HTTP_TIMEOUT_MS,
  Ac265OutageLeaseConflictError,
  isAc265OutageLeaseConflict,
} from './ac265-outage-lease-transport.ts';
export type {
  Ac265OutageLeaseOperation,
  Ac265OutageLeaseRpcOptions,
} from './ac265-outage-lease-transport.ts';

const ACQUIRE_RPC = 'ac265_hosted_outage_lease_acquire';
const CONSUME_RPC = 'ac265_hosted_outage_lease_consume';
const RELEASE_RPC = 'ac265_hosted_outage_lease_release';
const MAX_LEASE_DURATION_MS = AC265_OUTAGE_LEASE_MAX_DURATION_SECONDS * 1_000;
const LEASE_REF_PATTERN =
  /^ac265-lease:\/\/staging\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

const sha256Hex = (value: string): string =>
  createHash('sha256').update(Buffer.from(value, 'utf8')).digest('hex');

const sameControlBinding = (
  request: { readonly authorizationRef: string; readonly targetRef: string },
  response: { readonly authorizationRef: string; readonly targetRef: string },
): boolean =>
  response.authorizationRef === request.authorizationRef &&
  response.targetRef === request.targetRef;

export const acquireAc265HostedOutageLease = (
  options: Ac265OutageLeaseRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265OutageLeaseAcquireResult> =>
  invokeAc265OutageLeaseRpc({
    options,
    operation: 'acquire',
    rpc: ACQUIRE_RPC,
    requestSchema: ContentSchemaRegistryAc265OutageLeaseAcquireRequestSchema,
    responseSchema: ContentSchemaRegistryAc265OutageLeaseAcquireResultSchema,
    untrustedRequest,
    preflight: () => true,
    // The server issues the lease, so the caller can only verify that the
    // returned reference is well formed, that its digest covers it, and that
    // the lease is bound to the requested authorization/target pair for
    // exactly the approved duration and request limit.
    verify: (request, response) =>
      sameControlBinding(request, response) &&
      response.idempotencyRef === request.idempotencyRef &&
      response.leaseSha256 === sha256Hex(response.leaseRef) &&
      Date.parse(response.expiresAt) - Date.parse(response.acquiredAt) ===
        MAX_LEASE_DURATION_MS,
  });

const isBoundLeaseRequest = (request: {
  readonly leaseRef: string;
  readonly leaseSha256: string;
}): boolean =>
  LEASE_REF_PATTERN.test(request.leaseRef) &&
  request.leaseSha256 === sha256Hex(request.leaseRef);

export const consumeAc265HostedOutageLease = (
  options: Ac265OutageLeaseRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265OutageLeaseConsumeResult> =>
  invokeAc265OutageLeaseRpc({
    options,
    operation: 'consume',
    rpc: CONSUME_RPC,
    requestSchema: ContentSchemaRegistryAc265OutageLeaseConsumeRequestSchema,
    responseSchema: ContentSchemaRegistryAc265OutageLeaseConsumeResultSchema,
    untrustedRequest,
    preflight: isBoundLeaseRequest,
    // Only an exact request replay is accepted, so the recorded idempotency
    // reference always equals the one this caller submitted.
    verify: (request, response) =>
      sameControlBinding(request, response) &&
      response.leaseRef === request.leaseRef &&
      response.leaseSha256 === request.leaseSha256 &&
      response.leaseSha256 === sha256Hex(request.leaseRef) &&
      response.idempotencyRef === request.idempotencyRef,
  });

export const releaseAc265HostedOutageLease = (
  options: Ac265OutageLeaseRpcOptions,
  untrustedRequest: unknown,
): Promise<ContentSchemaRegistryAc265OutageLeaseReleaseResult> =>
  invokeAc265OutageLeaseRpc({
    options,
    operation: 'release',
    rpc: RELEASE_RPC,
    requestSchema: ContentSchemaRegistryAc265OutageLeaseReleaseRequestSchema,
    responseSchema: ContentSchemaRegistryAc265OutageLeaseReleaseResultSchema,
    untrustedRequest,
    preflight: isBoundLeaseRequest,
    verify: (request, response) =>
      sameControlBinding(request, response) &&
      response.leaseRef === request.leaseRef &&
      response.leaseSha256 === request.leaseSha256 &&
      response.leaseSha256 === sha256Hex(request.leaseRef) &&
      response.idempotencyRef === request.idempotencyRef,
  });
