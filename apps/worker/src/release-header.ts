import type { WorkerBindings } from './worker-bindings';

const RELEASE_HEADER = 'x-wejammin-release';
const RELEASE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;

/** Apply only the validated deployment release; remove untrusted values. */
export const applyReleaseHeader = (
  response: Response,
  environment: WorkerBindings | undefined,
): void => {
  const release = environment?.APP_RELEASE;
  if (typeof release === 'string' && RELEASE_PATTERN.test(release)) {
    response.headers.set(RELEASE_HEADER, release);
  } else {
    response.headers.delete(RELEASE_HEADER);
  }
};
