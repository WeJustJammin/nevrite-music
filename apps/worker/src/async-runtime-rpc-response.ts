import {
  AsyncRpcDependencyError,
  AsyncRpcManualReviewError,
  AsyncRpcTransportError,
} from './async-runtime-rpc-errors';

export const responseLength = (
  response: Response,
  maxResponseBytes: number,
): number | null => {
  let value: string | null;
  try {
    value = response.headers.get('content-length');
  } catch {
    throw new AsyncRpcManualReviewError('malformed_response');
  }
  if (value === null) return null;
  if (!/^\d+$/.test(value)) {
    throw new AsyncRpcManualReviewError('invalid_content_length');
  }
  const length = Number(value);
  if (!Number.isSafeInteger(length)) {
    throw new AsyncRpcManualReviewError('invalid_content_length');
  }
  if (length > maxResponseBytes) {
    void response.body?.cancel().catch(() => undefined);
    throw new AsyncRpcManualReviewError('response_too_large');
  }
  return length;
};

export const readBoundedResponse = async (
  response: Response,
  maxResponseBytes: number,
  signal: AbortSignal,
): Promise<Uint8Array> => {
  if (response.body === null) return new Uint8Array();

  let reader: ReadableStreamDefaultReader<Uint8Array>;
  try {
    reader = response.body.getReader();
  } catch {
    throw new AsyncRpcManualReviewError('malformed_response');
  }
  // Keep response storage bounded even when a peer emits many tiny chunks.
  const body = new Uint8Array(maxResponseBytes);
  let total = 0;
  let emptyChunkCount = 0;
  const maxEmptyChunks = 1024;
  let wasAborted = false;
  let rejectAbort: ((reason?: unknown) => void) | undefined;
  const aborted = new Promise<never>((_, reject) => {
    rejectAbort = reject;
  });
  void aborted.catch(() => undefined);

  const onAbort = () => {
    wasAborted = true;
    rejectAbort?.(new AsyncRpcDependencyError('timeout'));
    void reader.cancel().catch(() => undefined);
  };
  signal.addEventListener('abort', onAbort, { once: true });

  try {
    if (signal.aborted) {
      onAbort();
      throw new AsyncRpcDependencyError('timeout');
    }
    while (true) {
      let next: ReadableStreamReadResult<Uint8Array>;
      try {
        next = await Promise.race([reader.read(), aborted]);
      } catch (error) {
        if (wasAborted) throw new AsyncRpcDependencyError('timeout');
        if (error instanceof AsyncRpcTransportError) throw error;
        throw new AsyncRpcDependencyError('body_read_failed');
      }
      if (wasAborted) throw new AsyncRpcDependencyError('timeout');
      if (next.done) break;
      if (!(next.value instanceof Uint8Array)) {
        throw new AsyncRpcManualReviewError('malformed_response');
      }
      if (next.value.byteLength === 0) {
        emptyChunkCount += 1;
        if (emptyChunkCount > maxEmptyChunks) {
          void reader.cancel().catch(() => undefined);
          throw new AsyncRpcManualReviewError('malformed_response');
        }
      } else {
        emptyChunkCount = 0;
      }
      total += next.value.byteLength;
      if (!Number.isSafeInteger(total) || total > maxResponseBytes) {
        void reader.cancel().catch(() => undefined);
        throw new AsyncRpcManualReviewError('response_too_large');
      }
      body.set(next.value, total - next.value.byteLength);
    }
  } finally {
    signal.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }

  return body.subarray(0, total);
};

export const parseResponseBody = (body: Uint8Array): unknown => {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      body,
    );
  } catch {
    throw new AsyncRpcManualReviewError('invalid_utf8');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AsyncRpcManualReviewError('malformed_json');
  }
};
