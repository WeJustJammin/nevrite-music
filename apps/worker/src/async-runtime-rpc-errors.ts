export type AsyncRpcTransportFailureReason =
  | 'timeout'
  | 'request_failed'
  | 'http_error'
  | 'invalid_content_length'
  | 'response_too_large'
  | 'body_read_failed'
  | 'invalid_utf8'
  | 'malformed_json'
  | 'malformed_response';

export type AsyncRpcTransportFailureCode =
  'DEPENDENCY_UNAVAILABLE' | 'MANUAL_REVIEW';

/**
 * Safe, typed failure from the Supabase RPC transport. The reason is
 * diagnostic-only; no dependency payload or response bytes are retained.
 */
export class AsyncRpcTransportError extends Error {
  readonly code: AsyncRpcTransportFailureCode;
  readonly errorCode: AsyncRpcTransportFailureCode;
  readonly retryable: boolean;
  readonly disposition: 'dependency_unavailable' | 'manual_review';

  constructor(
    readonly reason: AsyncRpcTransportFailureReason,
    disposition: 'dependency_unavailable' | 'manual_review',
  ) {
    super(
      disposition === 'manual_review'
        ? 'Supabase RPC response requires manual review.'
        : 'Supabase RPC dependency is unavailable.',
    );
    this.name = 'AsyncRpcTransportError';
    this.code =
      disposition === 'manual_review'
        ? 'MANUAL_REVIEW'
        : 'DEPENDENCY_UNAVAILABLE';
    this.errorCode = this.code;
    this.retryable = disposition === 'dependency_unavailable';
    this.disposition = disposition;
  }
}

export class AsyncRpcDependencyError extends AsyncRpcTransportError {
  constructor(reason: AsyncRpcTransportFailureReason) {
    super(reason, 'dependency_unavailable');
    this.name = 'AsyncRpcDependencyError';
  }
}

export class AsyncRpcManualReviewError extends AsyncRpcTransportError {
  constructor(reason: AsyncRpcTransportFailureReason) {
    super(reason, 'manual_review');
    this.name = 'AsyncRpcManualReviewError';
  }
}
