const DEFAULT_PROVIDER_TIMEOUT_MS = 15_000;
const MAX_PROVIDER_BYTES = 2_000_000;

class OperationalProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationalProviderError';
  }
}

type ProviderBodyResult =
  | Readonly<{ kind: 'aborted' }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{ bytes: Uint8Array; kind: 'ok' }>
  | Readonly<{ kind: 'too-large' }>;

type ProviderChunkResult =
  | Readonly<{ kind: 'aborted' }>
  | Readonly<{ kind: 'invalid' }>
  | Readonly<{
      kind: 'read';
      value: ReadableStreamReadResult<Uint8Array>;
    }>;

const cancelProviderReader = (
  reader: ReadableStreamDefaultReader<Uint8Array>,
): void => {
  try {
    void Promise.resolve(reader.cancel()).catch(() => undefined);
  } catch {
    // Ignore a secondary provider stream cancellation failure.
  }
};

const cancelProviderResponse = (response: Response): void => {
  try {
    void response.body?.cancel().catch(() => undefined);
  } catch {
    // Ignore a secondary provider stream cancellation failure.
  }
};

const readProviderChunk = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): Promise<ProviderChunkResult> => {
  if (signal.aborted) return { kind: 'aborted' };
  let removeAbortListener = (): void => undefined;
  const abort = new Promise<Readonly<{ kind: 'aborted' }>>((resolve) => {
    const onAbort = (): void => resolve({ kind: 'aborted' });
    signal.addEventListener('abort', onAbort, { once: true });
    removeAbortListener = (): void => {
      signal.removeEventListener('abort', onAbort);
    };
    if (signal.aborted) onAbort();
  });
  try {
    return await Promise.race([
      reader
        .read()
        .then((value): ProviderChunkResult => ({ kind: 'read', value }))
        .catch((): ProviderChunkResult => ({ kind: 'invalid' })),
      abort,
    ]);
  } finally {
    removeAbortListener();
  }
};

const readBoundedProviderBody = async (
  response: Response,
  signal: AbortSignal,
): Promise<ProviderBodyResult> => {
  if (response.body === null) return { bytes: new Uint8Array(), kind: 'ok' };
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await readProviderChunk(reader, signal);
      if (next.kind === 'aborted') {
        cancelProviderReader(reader);
        return { kind: 'aborted' };
      }
      if (next.kind === 'invalid') {
        cancelProviderReader(reader);
        return { kind: 'invalid' };
      }
      if (next.value.done) break;
      if (!(next.value.value instanceof Uint8Array)) {
        cancelProviderReader(reader);
        return { kind: 'invalid' };
      }
      if (next.value.value.byteLength > MAX_PROVIDER_BYTES - total) {
        cancelProviderReader(reader);
        return { kind: 'too-large' };
      }
      total += next.value.value.byteLength;
      chunks.push(next.value.value);
    }
  } catch {
    cancelProviderReader(reader);
    return { kind: 'invalid' };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader cleanup cannot change the redacted provider result.
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { bytes, kind: 'ok' };
};

const boundedJson = async (
  response: Response,
  signal: AbortSignal,
): Promise<unknown> => {
  if (!response.ok) {
    cancelProviderResponse(response);
    throw new OperationalProviderError(
      `Operational provider request failed (HTTP ${response.status})`,
    );
  }
  const declared = response.headers.get('content-length');
  if (declared !== null) {
    const declaredBytes = Number(declared);
    if (!/^[0-9]+$/u.test(declared) || !Number.isSafeInteger(declaredBytes)) {
      cancelProviderResponse(response);
      throw new OperationalProviderError(
        'Invalid operational provider response',
      );
    }
    if (declaredBytes > MAX_PROVIDER_BYTES) {
      cancelProviderResponse(response);
      throw new OperationalProviderError(
        'Operational provider response too large',
      );
    }
  }
  const body = await readBoundedProviderBody(response, signal);
  if (body.kind === 'aborted')
    throw new OperationalProviderError(
      'Operational provider request timed out',
    );
  if (body.kind === 'too-large')
    throw new OperationalProviderError(
      'Operational provider response too large',
    );
  if (body.kind === 'invalid')
    throw new OperationalProviderError('Invalid operational provider response');
  try {
    const text = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: false,
    }).decode(body.bytes);
    return JSON.parse(text) as unknown;
  } catch {
    throw new OperationalProviderError('Invalid operational provider response');
  }
};

export const postOperationalProviderJson = async (
  fetchImpl: typeof fetch,
  url: string,
  headers: Readonly<Record<string, string>>,
  body: unknown,
  timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS,
): Promise<unknown> => {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(
        new OperationalProviderError('Operational provider request timed out'),
      );
    }, timeoutMs);
  });
  try {
    const response = await Promise.race([
      fetchImpl(url, {
        body: JSON.stringify(body),
        headers: {
          Accept: 'application/json',
          'content-type': 'application/json',
          ...headers,
        },
        method: 'POST',
        signal: controller.signal,
      }),
      timeout,
    ]);
    const result = await boundedJson(response, controller.signal);
    if (timedOut)
      throw new OperationalProviderError(
        'Operational provider request timed out',
      );
    return result;
  } catch (error) {
    if (timedOut)
      throw new OperationalProviderError(
        'Operational provider request timed out',
      );
    if (error instanceof OperationalProviderError) throw error;
    throw new OperationalProviderError('Operational provider request failed');
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};
