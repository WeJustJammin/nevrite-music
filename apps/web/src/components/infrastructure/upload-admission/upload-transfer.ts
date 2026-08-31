export const UPLOAD_INACTIVITY_TIMEOUT_MS = 30_000;

export interface UploadTransferTimers {
  readonly setTimeout: (callback: () => void, delayMs: number) => unknown;
  readonly clearTimeout: (handle: unknown) => void;
}

export interface UploadInactivityWatch {
  readonly start: () => void;
  readonly noteByteTransferred: () => void;
  readonly cancel: () => void;
}

const browserTimers: UploadTransferTimers = {
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) =>
    clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Tracks transfer inactivity only. It never marks an object uploaded or ready;
 * canonical completion remains the server completion and verification flow.
 */
export const createUploadInactivityWatch = (input: {
  readonly onAbort: () => void;
  readonly timers?: UploadTransferTimers;
}): UploadInactivityWatch => {
  const timers = input.timers ?? browserTimers;
  let timer: unknown = null;
  let active = false;

  const arm = () => {
    timer = timers.setTimeout(() => {
      timer = null;
      active = false;
      input.onAbort();
    }, UPLOAD_INACTIVITY_TIMEOUT_MS);
  };

  return {
    start: () => {
      if (active) return;
      active = true;
      arm();
    },
    noteByteTransferred: () => {
      if (!active) return;
      if (timer !== null) timers.clearTimeout(timer);
      arm();
    },
    cancel: () => {
      active = false;
      if (timer !== null) timers.clearTimeout(timer);
      timer = null;
    },
  };
};
