export type BoundedProviderResponseErrorCode =
  | 'aborted'
  | 'invalid_content_length'
  | 'invalid_encoding'
  | 'read_failed'
  | 'timed_out'
  | 'too_large';

export class BoundedProviderResponseError extends Error {
  public readonly code: BoundedProviderResponseErrorCode;

  public constructor(code: BoundedProviderResponseErrorCode) {
    super('bounded provider response read failed');
    this.name = 'BoundedProviderResponseError';
    this.code = code;
  }
}

export type BoundedProviderResponseOptions = Readonly<{
  maxBytes: number;
  timeoutMs: number;
  signal?: AbortSignal;
  onTimeout?: () => void;
}>;

const isBoundedError = (
  error: unknown,
): error is BoundedProviderResponseError =>
  error instanceof BoundedProviderResponseError;

const cancelReader = (
  reader: ReadableStreamDefaultReader<Uint8Array>,
): void => {
  try {
    void reader.cancel().catch(() => undefined);
  } catch {
    // The bounded-response failure remains the safe result.
  }
};

const cancelResponseBody = (response: Response): void => {
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    // The bounded-response failure remains the safe result.
  }
};

const validateOptions = ({
  maxBytes,
  timeoutMs,
}: BoundedProviderResponseOptions): void => {
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 0 ||
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs < 1
  )
    throw new BoundedProviderResponseError('read_failed');
};

const validateContentLength = (response: Response, maxBytes: number): void => {
  const declared = response.headers.get('content-length');
  if (declared === null) return;
  if (!/^\d+$/u.test(declared))
    throw new BoundedProviderResponseError('invalid_content_length');
  const bytes = Number(declared);
  if (!Number.isSafeInteger(bytes))
    throw new BoundedProviderResponseError('invalid_content_length');
  if (bytes > maxBytes) throw new BoundedProviderResponseError('too_large');
};

const waitFor = async <T>(
  operation: Promise<T>,
  options: Pick<
    BoundedProviderResponseOptions,
    'onTimeout' | 'signal' | 'timeoutMs'
  > & {
    deadlineMs: number;
  },
): Promise<T> => {
  if (options.signal?.aborted)
    throw new BoundedProviderResponseError('aborted');
  const remainingMs = options.deadlineMs - Date.now();
  if (remainingMs <= 0) {
    try {
      options.onTimeout?.();
    } catch {
      // Preserve the stable timeout classification.
    }
    throw new BoundedProviderResponseError('timed_out');
  }

  const timedOut = Symbol('timed-out');
  const aborted = Symbol('aborted');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const timeoutPromise = new Promise<typeof timedOut>((_resolve, reject) => {
    timer = setTimeout(() => reject(timedOut), remainingMs);
  });
  const abortPromise =
    options.signal === undefined
      ? undefined
      : new Promise<typeof aborted>((_resolve, reject) => {
          onAbort = () => reject(aborted);
          options.signal?.addEventListener('abort', onAbort, { once: true });
        });
  try {
    const pending = [operation, timeoutPromise];
    if (abortPromise !== undefined) pending.push(abortPromise);
    return await Promise.race(pending);
  } catch (error: unknown) {
    if (error === timedOut) {
      try {
        options.onTimeout?.();
      } catch {
        // Preserve the stable timeout classification.
      }
      throw new BoundedProviderResponseError('timed_out');
    }
    if (error === aborted) throw new BoundedProviderResponseError('aborted');
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    if (onAbort !== undefined)
      options.signal?.removeEventListener('abort', onAbort);
  }
};

const decode = (bytes: Uint8Array): string => {
  try {
    return new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: false,
    }).decode(bytes);
  } catch {
    throw new BoundedProviderResponseError('invalid_encoding');
  }
};

const readStream = async (
  response: Response,
  options: BoundedProviderResponseOptions & { deadlineMs: number },
): Promise<string> => {
  if (
    response.body === null ||
    response.body === undefined ||
    typeof response.body.getReader !== 'function'
  )
    throw new BoundedProviderResponseError('read_failed');

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await waitFor(reader.read(), options);
      if (result.done) break;
      const chunk = result.value;
      if (!(chunk instanceof Uint8Array))
        throw new BoundedProviderResponseError('read_failed');
      total += chunk.byteLength;
      if (total > options.maxBytes)
        throw new BoundedProviderResponseError('too_large');
      chunks.push(chunk);
    }
  } catch (error: unknown) {
    const boundedError = isBoundedError(error)
      ? error
      : new BoundedProviderResponseError('read_failed');
    cancelReader(reader);
    throw boundedError;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader cleanup cannot change the public failure classification.
    }
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return decode(bytes);
};

export const readBoundedProviderResponseText = async (
  response: Response,
  options: BoundedProviderResponseOptions,
): Promise<string> => {
  try {
    validateOptions(options);
    validateContentLength(response, options.maxBytes);
  } catch (error: unknown) {
    cancelResponseBody(response);
    throw error;
  }
  const deadlineMs = Date.now() + options.timeoutMs;
  const boundedOptions = { ...options, deadlineMs };
  return readStream(response, boundedOptions);
};

export type BoundedProviderResponseResult = Readonly<{
  response: Response;
  text: string;
}>;

/**
 * Fetch and consume a provider response under one deadline. The caller's
 * signal cancels the request and its body read; the internal controller also
 * aborts the underlying fetch when the deadline expires.
 */
export const requestBoundedProviderResponseText = async (
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  options: BoundedProviderResponseOptions,
): Promise<BoundedProviderResponseResult> => {
  validateOptions(options);
  if (options.signal?.aborted)
    throw new BoundedProviderResponseError('aborted');

  const deadlineMs = Date.now() + options.timeoutMs;
  const controller = new AbortController();
  let deadlineReached = false;
  let callerAborted = false;
  const onCallerAbort = (): void => {
    callerAborted = true;
    controller.abort();
  };
  options.signal?.addEventListener('abort', onCallerAbort, { once: true });
  const onTimeout = (): void => {
    deadlineReached = true;
    controller.abort();
    try {
      options.onTimeout?.();
    } catch {
      // Preserve the stable timeout classification.
    }
  };
  const timeout = setTimeout(onTimeout, options.timeoutMs);

  try {
    let response: Response;
    try {
      response = await waitFor(
        Promise.resolve(
          fetchImpl(url, {
            ...init,
            signal: controller.signal,
          }),
        ),
        {
          deadlineMs,
          onTimeout,
          signal: options.signal,
          timeoutMs: options.timeoutMs,
        },
      );
    } catch (error: unknown) {
      if (isBoundedError(error)) throw error;
      throw new BoundedProviderResponseError('read_failed');
    }

    const remainingMs = deadlineMs - Date.now();
    if (remainingMs <= 0) {
      onTimeout();
      throw new BoundedProviderResponseError('timed_out');
    }
    const text = await readBoundedProviderResponseText(response, {
      ...options,
      onTimeout,
      signal: controller.signal,
      timeoutMs: remainingMs,
    });
    return { response, text };
  } catch (error: unknown) {
    if (deadlineReached) throw new BoundedProviderResponseError('timed_out');
    if (callerAborted || options.signal?.aborted)
      throw new BoundedProviderResponseError('aborted');
    if (isBoundedError(error)) throw error;
    throw new BoundedProviderResponseError('read_failed');
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', onCallerAbort);
    if (deadlineReached || callerAborted) controller.abort();
  }
};
