import type {
  ContentSchemaRegistryError,
  ContentSchemaRegistryResult,
} from './types';

export const dependencyDeadline = async <T>(
  invoke: (signal: AbortSignal) => Promise<ContentSchemaRegistryResult<T>>,
  deadlineMs: number,
): Promise<ContentSchemaRegistryResult<T>> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ContentSchemaRegistryError>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve({
        ok: false,
        status: 504,
        code: 'DEPENDENCY_DEADLINE_EXCEEDED',
        message: 'The CMS registry dependency exceeded its deadline.',
        details: { dependencyClass: 'cms_registry', retryable: true },
        retryAfterSeconds: 5,
      });
    }, deadlineMs);
  });
  try {
    return await Promise.race([invoke(controller.signal), timeout]);
  } catch {
    return {
      ok: false,
      status: 503,
      code: 'DEPENDENCY_UNAVAILABLE',
      message: 'The CMS registry dependency is temporarily unavailable.',
      details: { dependencyClass: 'cms_registry', retryable: true },
      retryAfterSeconds: 5,
    };
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};
