import type { ContentSchemaRegistryResult } from './types';
import type { ProductionConfiguration } from './production-types';
import {
  deadlineExceeded,
  invalidResponse,
  isAbortError,
  unavailable,
} from './production-errors';

type FetchRace =
  | Readonly<{ kind: 'response'; response: Response }>
  | Readonly<{ kind: 'error'; error: unknown }>
  | Readonly<{ kind: 'deadline' }>
  | Readonly<{ kind: 'aborted' }>;

export const fetchWithDeadline = async (
  configuration: ProductionConfiguration,
  url: string,
  init: RequestInit,
  signal: AbortSignal,
): Promise<ContentSchemaRegistryResult<Response>> => {
  if (signal.aborted) return deadlineExceeded();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settleAbort = (): void => {
    controller.abort();
  };
  signal.addEventListener('abort', settleAbort, { once: true });
  const requestPromise = configuration.auth
    .fetchImpl(url, { ...init, signal: controller.signal })
    .then((response): FetchRace => ({ kind: 'response', response }))
    .catch((error): FetchRace => ({ kind: 'error', error }));
  const timeoutPromise = new Promise<FetchRace>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({ kind: 'deadline' });
    }, configuration.deadlineMs);
  });
  const abortPromise = new Promise<FetchRace>((resolve) => {
    if (signal.aborted) {
      resolve({ kind: 'aborted' });
      return;
    }
    signal.addEventListener('abort', () => resolve({ kind: 'aborted' }), {
      once: true,
    });
  });
  const outcome = await Promise.race([
    requestPromise,
    timeoutPromise,
    abortPromise,
  ]);
  if (timer !== undefined) clearTimeout(timer);
  signal.removeEventListener('abort', settleAbort);
  if (outcome.kind === 'response') return { ok: true, value: outcome.response };
  if (outcome.kind === 'deadline' || outcome.kind === 'aborted')
    return deadlineExceeded();
  if (isAbortError(outcome.error)) return deadlineExceeded();
  return unavailable();
};

export const readBoundedResponse = async (
  response: Response,
  maxResponseBytes: number,
  signal?: AbortSignal,
): Promise<Uint8Array | null> => {
  if (response.body === null) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        return null;
      }
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > maxResponseBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(next.value);
    }
  } catch {
    try {
      await reader.cancel();
    } catch {
      // Ignore a secondary stream cancellation failure.
    }
    return null;
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
};

export const parseJsonResponse = async (
  response: Response,
  maxResponseBytes: number,
  signal?: AbortSignal,
): Promise<ContentSchemaRegistryResult<unknown>> => {
  const contentType = response.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== 'application/json') return invalidResponse();
  const declaredLength = response.headers.get('content-length');
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (
      !Number.isSafeInteger(parsedLength) ||
      parsedLength < 0 ||
      parsedLength > maxResponseBytes
    )
      return invalidResponse();
  }
  const bytes = await readBoundedResponse(response, maxResponseBytes, signal);
  if (bytes === null) return invalidResponse();
  let body: string;
  try {
    body = new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
      bytes,
    );
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return invalidResponse();
  }
};

export const readRpcError = async (
  response: Response,
  maxResponseBytes: number,
  signal?: AbortSignal,
): Promise<unknown> => {
  const parsed = await parseJsonResponse(response, maxResponseBytes, signal);
  return parsed.ok ? parsed.value : null;
};
