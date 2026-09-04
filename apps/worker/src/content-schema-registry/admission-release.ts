import {
  ReleaseEnvelopeHeadersSchema,
  type ReleaseEnvelopeHeaders,
} from './contracts';
import type {
  ContentSchemaRegistryDependencies,
  ContentSchemaRegistryResult,
  ReleasePrincipal,
  VerifiedReleaseInput,
} from './types';
import { invalid, issues, releaseHeaderNames } from './admission-common';
import { dependencyDeadline } from './admission-deadline';
import { readBytes } from './admission-body';

export const readReleaseAdmission = async (
  request: Request,
  operationId: 'CMS-03A-05' | 'CMS-03A-08',
  dependencies: ContentSchemaRegistryDependencies,
  requestId: string,
  signal: AbortSignal,
): Promise<
  ContentSchemaRegistryResult<
    Readonly<{
      principal: ReleasePrincipal;
      headers: ReleaseEnvelopeHeaders;
      rawBody: Uint8Array;
    }>
  >
> => {
  const bytes = await readBytes(request, signal);
  if (!bytes.ok) return bytes;
  for (const [name] of request.headers) {
    const normalized = name.toLowerCase();
    if (
      (normalized.startsWith('x-wejammin-release-') &&
        !releaseHeaderNames.has(normalized)) ||
      normalized.startsWith('x-release-') ||
      normalized === 'keyid' ||
      normalized === 'issuedat' ||
      normalized === 'nonce' ||
      normalized === 'signature'
    )
      return invalid('The release envelope headers are invalid.');
  }
  const parsedHeaders = ReleaseEnvelopeHeadersSchema.safeParse({
    keyId: request.headers.get('x-wejammin-release-key-id'),
    issuedAt: request.headers.get('x-wejammin-release-issued-at'),
    nonce: request.headers.get('x-wejammin-release-nonce'),
    signature: request.headers.get('x-wejammin-release-signature'),
  });
  if (!parsedHeaders.success)
    return invalid(
      'The release envelope headers are invalid.',
      issues(parsedHeaders.error),
    );
  let verified: ContentSchemaRegistryResult<ReleasePrincipal>;
  try {
    const input: VerifiedReleaseInput = {
      operationId,
      requestId,
      request,
      rawBody: bytes.value,
      headers: parsedHeaders.data,
    };

    verified = await dependencyDeadline(
      (dependencySignal) => dependencies.verifyRelease(input, dependencySignal),
      dependencies.deadlineMs ?? 15_000,
    );
  } catch {
    return {
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      message: 'Release verification is temporarily unavailable.',
      details: { dependencyClass: 'release_verifier', retryable: true },
      retryAfterSeconds: 5,
    };
  }
  if (!verified.ok) {
    if (verified.status === 401)
      return {
        ok: false,
        status: 401,
        code: 'WEBHOOK_REJECTED',
        message: 'The signed release webhook was rejected.',
        details: {},
      };
    return verified;
  }
  return {
    ok: true,
    value: {
      principal: verified.value,
      headers: parsedHeaders.data,
      rawBody: bytes.value,
    },
  };
};
