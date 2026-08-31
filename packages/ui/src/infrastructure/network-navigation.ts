export type NetworkOperation = 'read' | 'mutation';
export type NetworkCondition =
  'slow' | 'rate_limited' | 'dependency_error' | 'offline';

export interface NetworkActionInput {
  readonly operation: NetworkOperation;
  readonly condition: NetworkCondition;
  readonly retryAt?: string;
  readonly lastKnownGoodAllowed?: boolean;
  readonly verifiedAt?: string;
  readonly safeRetryDeclared?: boolean;
  readonly attempt?: number;
}

export type NetworkActionPlan = Readonly<Record<string, unknown>>;

const isRfc3339Timestamp = (value: string): boolean => {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/,
  );
  if (match === null) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];
  return (
    daysInMonth !== undefined &&
    day >= 1 &&
    day <= daysInMonth &&
    !Number.isNaN(Date.parse(value))
  );
};

export function planNetworkAction(
  input: NetworkActionInput,
): NetworkActionPlan {
  if (input.condition === 'slow') {
    return { showLoadingAfterMs: 250, preserveSafePriorContent: true };
  }
  if (input.condition === 'rate_limited') {
    const retryAt =
      input.retryAt !== undefined && isRfc3339Timestamp(input.retryAt)
        ? { retryAt: input.retryAt }
        : {};
    return { preserveInput: true, ...retryAt, automaticRetry: false };
  }
  if (input.condition === 'dependency_error') {
    if (input.operation === 'mutation') {
      return { reconcileFirst: true, automaticRetry: false };
    }
    const retryAllowed =
      input.safeRetryDeclared === true && (input.attempt ?? 0) < 2;
    return retryAllowed
      ? { retryDelaysMs: [250, 750], maximumRetries: 2 }
      : { retryDelaysMs: [], maximumRetries: 0, automaticRetry: false };
  }
  const freshness =
    input.lastKnownGoodAllowed === true && input.verifiedAt !== undefined
      ? { freshness: input.verifiedAt }
      : {};
  return {
    route: '/system/degraded',
    lastKnownGoodAllowed: input.lastKnownGoodAllowed === true,
    ...freshness,
  };
}
