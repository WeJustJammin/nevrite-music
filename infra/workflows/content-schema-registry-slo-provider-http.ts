import {
  ContentSchemaRegistrySloProviderError,
  fail,
  type JsonRecord,
} from './content-schema-registry-slo-provider-types.ts';

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  onTimeout: () => void,
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      onTimeout();
      reject(
        new ContentSchemaRegistrySloProviderError(
          'request_timeout',
          'provider request timed out',
        ),
      );
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

const readResponseBytes = async (
  response: Response,
  maxResponseBytes: number,
  timeoutMs: number,
  onTimeout: () => void,
): Promise<Uint8Array> => {
  if (
    response.body !== null &&
    response.body !== undefined &&
    typeof response.body.getReader === 'function'
  ) {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const result = await withTimeout(reader.read(), timeoutMs, onTimeout);
        if (result.done) break;
        const chunk = result.value;
        if (chunk === undefined) continue;
        total += chunk.byteLength;
        if (total > maxResponseBytes) {
          void reader.cancel().catch(() => undefined);
          fail('response_too_large', 'provider response exceeds 2 MiB');
        }
        chunks.push(chunk);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return bytes;
  }

  if (typeof response.arrayBuffer === 'function') {
    const bytes = await withTimeout(
      response.arrayBuffer(),
      timeoutMs,
      onTimeout,
    );
    if (bytes.byteLength > maxResponseBytes)
      fail('response_too_large', 'provider response exceeds 2 MiB');
    return new Uint8Array(bytes);
  }

  if (typeof response.text === 'function') {
    const body = await withTimeout(response.text(), timeoutMs, onTimeout);
    const bytes = new TextEncoder().encode(body);
    if (bytes.byteLength > maxResponseBytes)
      fail('response_too_large', 'provider response exceeds 2 MiB');
    return bytes;
  }

  fail('malformed_json', 'malformed JSON response');
};

const readResponseJson = async (
  response: Response,
  maxResponseBytes: number,
  timeoutMs: number,
  onTimeout: () => void,
  timedOut: () => boolean,
): Promise<unknown> => {
  const contentLength = response.headers.get('content-length');
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes)
      fail('response_too_large', 'provider response exceeds 2 MiB');
  }

  try {
    if (
      (response.body !== null && response.body !== undefined) ||
      typeof response.arrayBuffer === 'function' ||
      typeof response.text === 'function'
    ) {
      const bytes = await readResponseBytes(
        response,
        maxResponseBytes,
        timeoutMs,
        onTimeout,
      );
      const body = new TextDecoder().decode(bytes);
      try {
        return JSON.parse(body) as unknown;
      } catch {
        fail('malformed_json', 'malformed JSON response');
      }
    }

    if (typeof response.json === 'function') {
      const payload = await withTimeout(response.json(), timeoutMs, onTimeout);
      const encoded = JSON.stringify(payload);
      if (encoded === undefined)
        fail('malformed_json', 'malformed JSON response');
      if (new TextEncoder().encode(encoded).byteLength > maxResponseBytes)
        fail('response_too_large', 'provider response exceeds 2 MiB');
      return payload as unknown;
    }
  } catch (error) {
    if (error instanceof ContentSchemaRegistrySloProviderError) throw error;
    if (timedOut()) fail('request_timeout', 'provider request timed out');
    fail('malformed_json', 'malformed JSON response');
  }

  fail('malformed_json', 'malformed JSON response');
};

export const requestJson = async (
  fetchImpl: typeof fetch,
  url: string,
  token: string,
  body: Readonly<JsonRecord>,
  timeoutMs: number,
  maxResponseBytes: number,
): Promise<unknown> => {
  const controller = new AbortController();
  let timedOut = false;
  let response: Response;
  try {
    response = await withTimeout(
      fetchImpl(url, {
        body: JSON.stringify(body),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: controller.signal,
      }),
      timeoutMs,
      () => {
        timedOut = true;
        controller.abort();
      },
    );
  } catch (error) {
    if (error instanceof ContentSchemaRegistrySloProviderError) throw error;
    if (timedOut) fail('request_timeout', 'provider request timed out');
    fail('request_failed', 'provider request failed');
  }

  if (!response.ok) fail('http_response_error', 'HTTP response error');
  return readResponseJson(
    response,
    maxResponseBytes,
    timeoutMs,
    () => {
      timedOut = true;
      controller.abort();
    },
    () => timedOut,
  );
};
