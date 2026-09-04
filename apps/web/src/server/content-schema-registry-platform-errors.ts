import type { ApiError } from '@wejammin/contracts';

export type ContentSchemaRegistryPlatformErrorKind =
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'invalid_request'
  | 'validation_failed'
  | 'rate_limited'
  | 'dependency_invalid_response'
  | 'dependency_unavailable'
  | 'dependency_deadline_exceeded'
  | 'internal_error'
  | 'unavailable';

/** An upstream result that must not be presented as an empty registry. */
export class ContentSchemaRegistryPlatformError extends Error {
  readonly kind: ContentSchemaRegistryPlatformErrorKind;
  readonly status: number | null;
  /** Bounded, disclosure-safe error data returned by the trusted platform. */
  readonly apiError: ApiError | null;
  readonly retryable: boolean | null;
  readonly retryAfterSeconds: number | null;
  readonly etag: string | null;

  constructor(
    kind: ContentSchemaRegistryPlatformErrorKind,
    status: number | null,
    metadata: Readonly<{
      readonly apiError?: ApiError | null;
      readonly retryable?: boolean | null;
      readonly retryAfterSeconds?: number | null;
      readonly etag?: string | null;
    }> = {},
  ) {
    super(`Content schema registry platform request failed: ${kind}`);
    this.name = 'ContentSchemaRegistryPlatformError';
    this.kind = kind;
    this.status = status;
    this.apiError = metadata.apiError ?? null;
    this.retryable = metadata.retryable ?? null;
    this.retryAfterSeconds = metadata.retryAfterSeconds ?? null;
    this.etag = metadata.etag ?? null;
  }
}

export const isContentSchemaRegistryPlatformError = (
  value: unknown,
): value is ContentSchemaRegistryPlatformError =>
  value instanceof ContentSchemaRegistryPlatformError;
