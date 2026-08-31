import {
  type JobRateLimitDecision,
  type JobRateLimitInput,
} from './job-status-types';

type Bucket = { startedAtMs: number; count: number };

const WINDOW_MS = 60_000;

/**
 * Explicit local/test limiter for harnesses. The production route must
 * receive a shared edge limiter and never calls this factory implicitly.
 */
export const createJobReadRateLimiter = () => {
  const buckets = new Map<string, Bucket>();

  return (input: JobRateLimitInput): JobRateLimitDecision => {
    const entries: Array<{
      key: string;
      limit: number;
      scope: 'user' | 'party';
    }> = [
      { key: `user:${input.userId}`, limit: input.userLimit, scope: 'user' },
    ];
    if (input.actingPartyId !== null) {
      entries.push({
        key: `party:${input.actingPartyId}`,
        limit: input.partyLimit,
        scope: 'party',
      });
    }

    const states = entries.map((entry) => {
      const existing = buckets.get(entry.key);
      const expired =
        existing === undefined ||
        input.nowMs - existing.startedAtMs >= WINDOW_MS;
      const state = expired ? { startedAtMs: input.nowMs, count: 0 } : existing;
      buckets.set(entry.key, state);
      return { entry, state };
    });

    const exceeded = states.find(
      ({ entry, state }) => state.count >= entry.limit,
    );
    if (exceeded !== undefined) {
      return {
        allowed: false,
        limit: exceeded.entry.limit,
        remaining: 0,
        resetAt: Math.ceil((exceeded.state.startedAtMs + WINDOW_MS) / 1_000),
        scope: exceeded.entry.scope,
      };
    }

    for (const { state } of states) state.count += 1;
    const selected = states.reduce((best, current) => {
      const bestRemaining = best.entry.limit - best.state.count;
      const currentRemaining = current.entry.limit - current.state.count;
      return currentRemaining < bestRemaining ? current : best;
    });
    return {
      allowed: true,
      limit: selected.entry.limit,
      remaining: selected.entry.limit - selected.state.count,
      resetAt: Math.ceil((selected.state.startedAtMs + WINDOW_MS) / 1_000),
      scope: selected.entry.scope,
    };
  };
};
