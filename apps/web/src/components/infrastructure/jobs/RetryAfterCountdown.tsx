import { useEffect, useRef, useState } from 'react';

export interface RetryAfterCountdownProps {
  /** Seconds supplied by the server's Retry-After response header. */
  readonly retryAfterSeconds: number | null;
  readonly onReady?: () => void;
}

export const normalizeRetryAfterSeconds = (value: number | null): number =>
  value !== null && Number.isSafeInteger(value) && value > 0 ? value : 0;

const countdownMessage = (remainingSeconds: number): string =>
  remainingSeconds > 0
    ? `Retry available in ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}.`
    : 'Retry available now.';

/**
 * Shows a server-requested wait. The countdown never invokes a retry; the
 * caller remains responsible for an explicit, reconciled action.
 */
export function RetryAfterCountdown({
  retryAfterSeconds,
  onReady,
}: RetryAfterCountdownProps) {
  const initialSeconds = normalizeRetryAfterSeconds(retryAfterSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => initialSeconds,
  );
  const readyReported = useRef(initialSeconds === 0);

  useEffect(() => {
    if (remainingSeconds === 0) return undefined;
    const timer = window.setTimeout(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearTimeout(timer);
  }, [remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds !== 0 || initialSeconds === 0 || readyReported.current)
      return;
    readyReported.current = true;
    onReady?.();
  }, [initialSeconds, onReady, remainingSeconds]);

  return (
    <p
      className="infra-job-retry-after"
      data-remaining-seconds={remainingSeconds}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {countdownMessage(remainingSeconds)}
    </p>
  );
}

export default RetryAfterCountdown;
