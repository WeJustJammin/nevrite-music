export class UploadBodyLimitExceededError extends Error {
  constructor() {
    super('Upload-intent body exceeds the configured limit.');
    this.name = 'UploadBodyLimitExceededError';
  }
}

export class UploadBodyReadAbortedError extends Error {
  constructor() {
    super('Upload-intent body read was aborted.');
    this.name = 'UploadBodyReadAbortedError';
  }
}

/** Buffers only a bounded request body after enforcing the byte ceiling. */
export const readBoundedUploadIntentBody = async (
  request: Request,
  maxBytes: number,
  signal?: AbortSignal,
): Promise<Uint8Array> => {
  if (request.body === null) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let wasAborted = false;
  let onAbort: (() => void) | undefined;
  let rejectAbort: ((reason?: unknown) => void) | undefined;
  const aborted = signal
    ? new Promise<never>((_, reject) => {
        rejectAbort = reject;
      })
    : undefined;
  void aborted?.catch(() => undefined);
  if (signal !== undefined) {
    onAbort = () => {
      wasAborted = true;
      rejectAbort?.(new UploadBodyReadAbortedError());
      void reader.cancel().catch(() => undefined);
    };
    signal.addEventListener('abort', onAbort, { once: true });
  }
  try {
    if (signal?.aborted) {
      onAbort?.();
      throw new UploadBodyReadAbortedError();
    }
    while (true) {
      const read = await Promise.race(
        aborted === undefined ? [reader.read()] : [reader.read(), aborted],
      );
      if (wasAborted) throw new UploadBodyReadAbortedError();
      if (read.done) break;
      const chunk = read.value;
      if (!(chunk instanceof Uint8Array))
        throw new UploadBodyReadAbortedError();
      total += chunk.byteLength;
      if (!Number.isSafeInteger(total) || total > maxBytes) {
        await reader.cancel();
        throw new UploadBodyLimitExceededError();
      }
      chunks.push(new Uint8Array(chunk));
    }
  } finally {
    if (onAbort !== undefined) signal?.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
};

export const decodeUploadIntentBody = (body: Uint8Array): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      body,
    );
  } catch {
    throw new UploadBodyReadAbortedError();
  }
};
