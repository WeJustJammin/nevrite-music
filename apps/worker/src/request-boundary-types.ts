import {
  PublicReadRequestSchema,
  type InfrastructureCommand,
  type ProtectedCommandHeaders,
  type RequestId,
  type JsonValue,
} from '@wejammin/contracts';

export const MAX_JSON_BODY_BYTES = 256 * 1024;

export type BoundaryErrorCode =
  | 'INVALID_REQUEST'
  | 'VALIDATION_FAILED'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE';

export type RequestBoundaryError = Readonly<{
  code: BoundaryErrorCode;
  status: 400 | 413 | 415 | 422;
  message: string;
  details: Readonly<Record<string, JsonValue>>;
}>;

export type RequestBoundaryResult<T> =
  | Readonly<{
      ok: true;
      requestId: RequestId;
      value: T;
    }>
  | Readonly<{
      ok: false;
      requestId: RequestId;
      error: RequestBoundaryError;
    }>;

export type ProtectedCommandRequest = Readonly<{
  command: InfrastructureCommand;
  headers: ProtectedCommandHeaders;
}>;

export type PublicReadRequest = ReturnType<
  typeof PublicReadRequestSchema.parse
>;
