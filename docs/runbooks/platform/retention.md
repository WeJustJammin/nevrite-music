# Operational-event retention

The `operational.events` class has a 30-day hard-delete policy and does not support legal hold in this foundation registry.

1. Verify the registry key and owner before changing any retention job.
2. Test policy changes against deterministic local fixtures only.
3. Require an approved contract change before changing duration or deletion mode.
4. Escalate failed deletion evidence through `platform.on_call`; never export raw event payloads for diagnosis.

## Idempotency records

BE00 idempotency receipts have a 30-day expiry. Expiry does not itself delete or recycle a receipt: an expired key remains bound to its prior result until the audited sweep removes that row. Only then may an exact key receive a new 30-day reservation.

The production Worker runs `platform_api.idempotency_expiry_sweep(p_limit, p_correlation_id)` on its one-minute cron. Each invocation asks for at most 64 rows; the database accepts limits from 1 through 100. The function selects eligible rows in `expires_at`, then UUID order and uses `FOR UPDATE SKIP LOCKED` both while selecting deletions and while checking for more work, so overlapping sweeps do not wait on rows another transaction holds.

A row is eligible when `expires_at` has passed and its claim lease is absent or expired. A live `claim_lease_until` protects the row even after its TTL. `hasMore: true` means the final nonblocking probe found more eligible, unlocked rows; the Worker does not loop in the same invocation, and the next minute's cron continues the backlog. Locked rows and live claims can be reconsidered by a later cron after they become available or their lease expires.

The RPC is `SECURITY DEFINER` with a fixed empty `search_path` and is executable only by `service_role`. Keep production calls on the scheduled Worker path; do not grant direct table deletion or expose this RPC to `anon` or `authenticated` callers.

Each deleted row produces one audit event with action `idempotency.expired`, target type `idempotency_record`, decision `completed`, and reason `TTL_EXPIRED`. The audit row has a null `actor_id`, uses system principal `00000000-0000-0000-0000-000000000001` as `acting_party_id`, and carries the invocation's correlation ID. Use the approved audit access path to correlate cleanup; do not inspect or export raw idempotency keys, request hashes, or response payloads.

For post-deployment verification, inspect the scheduled Worker logs. A successful run emits `idempotency_expiry_sweep.completed` with its correlation ID, `deletedCount`, `hasMore`, and `limit`. Zero deletions with `hasMore: false` is a normal empty sweep. When `hasMore` is true, check the following minute's invocation for continued progress. A failed run emits `idempotency_expiry_sweep.failed` with a safe dependency error code and `retryable: true`; the scheduled event fails so platform retry and failure visibility remain active, while independent scheduled work still runs. Follow `platform.on_call` for repeated failures or a backlog that does not drain. Validate behavior with the repository's migration and deterministic database tests before release; local fixtures alone are not proof of a hosted production sweep.
