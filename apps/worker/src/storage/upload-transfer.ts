export const UPLOAD_INACTIVITY_TIMEOUT_MS = 30_000;

export class UploadInactivityTimeoutError extends Error {
  constructor() {
    super('Upload transfer received no bytes within the inactivity window.');
    this.name = 'UploadInactivityTimeoutError';
  }
}

/**
 * Wraps a direct-upload stream without buffering it. The timer starts before
 * the first read and is reset only after a non-empty chunk is transferred.
 */
export const enforceUploadInactivity = (
  source: ReadableStream<Uint8Array>,
  options: Readonly<{
    inactivityMs?: number;
    signal?: AbortSignal;
  }> = {},
): ReadableStream<Uint8Array> => {
  const inactivityMs = options.inactivityMs ?? UPLOAD_INACTIVITY_TIMEOUT_MS;
  if (!Number.isSafeInteger(inactivityMs) || inactivityMs < 1)
    throw new Error('Upload inactivity window is invalid.');
  const reader = source.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ended = false;
  let outputController: ReadableStreamDefaultController<Uint8Array> | undefined;
  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const abort = () => {
    if (ended) return;
    ended = true;
    clearTimer();
    const error = new UploadInactivityTimeoutError();
    outputController?.error(error);
    void reader.cancel(error).catch(() => undefined);
  };
  const armTimer = () => {
    clearTimer();
    timer = setTimeout(abort, inactivityMs);
  };
  const output = new ReadableStream<Uint8Array>({
    start(controller) {
      outputController = controller;
      if (options.signal?.aborted) {
        abort();
        return;
      }
      options.signal?.addEventListener('abort', abort, { once: true });
      armTimer();
    },
    async pull(controller) {
      /* c8 ignore next -- Web Streams stop pulling after this stream errors. */
      if (ended) return;
      try {
        const result = await reader.read();
        if (result.done) {
          ended = true;
          clearTimer();
          options.signal?.removeEventListener('abort', abort);
          controller.close();
          return;
        }
        if (result.value.byteLength > 0) armTimer();
        controller.enqueue(result.value);
      } catch (error) {
        ended = true;
        clearTimer();
        options.signal?.removeEventListener('abort', abort);
        controller.error(error);
      }
    },
    async cancel(reason) {
      ended = true;
      clearTimer();
      options.signal?.removeEventListener('abort', abort);
      await reader.cancel(reason);
    },
  });
  return output;
};
