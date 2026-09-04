# Shadow-party, invitation, and claim-proof runbook

## Scope and owner

Profile-ownership on-call owns PRF-API-01–08: source-reference matching,
invitation dispatch, account-free remedy, claim initiation, challenge issue,
proof submission, and accepted-claim conversion. PRF-API-09–16 and public
portfolio/credential operations remain deferred and must not be activated by
this runbook.

## Access prerequisites

- Read access to redacted Worker request telemetry, release metadata, and job
  status projections.
- Supabase access appropriate to the environment and named `api.profile_*`
  service-role RPCs.
- Permission to pause one affected command or outbox consumer.
- Non-production shadow parties and claims reserved for recovery drills.

Never copy invitation pointers, proof values, contact channels, provider
evidence, cookies, CSRF tokens, idempotency keys, or raw request bodies into an
incident record.

## Detection signals

- Elevated `CONFLICT`, `VERSION_MISMATCH`, `IDEMPOTENCY_MISMATCH`,
  `RATE_LIMITED`, or `DEPENDENCY_UNAVAILABLE` outcomes.
- A proof can be reused, accepted after expiry/exhaustion, or returns success
  without one persisted job and matching audit/outbox evidence.
- Account-free correction requires a session, forwards cookies, or places the
  opaque claim pointer in a URL, redirect, log, or analytics event.
- Shadow source provenance changes, multiple ownership periods overlap, or a
  replay returns a different resource.

## Immediate containment

1. Record environment, release, request ID, operation ID, safe error code, and
   first observed time.
2. Pause only the affected mutation or outbox consumer; keep independent
   disclosure-safe reads and job status available when verified.
3. Do not bypass session/acting-context derivation, CSRF/origin checks,
   idempotency, version fences, RLS, challenge expiry, or attempt limits.
4. Do not expose, manually rewrite, or replay proof and invitation material.
5. If cross-party disclosure is suspected, stop the affected route and escalate
   under the stop conditions.

## Diagnosis

1. Verify Worker readiness, Supabase reachability, and deployment/migration
   versions without printing credentials.
2. Confirm the request entered through the expected Astro facade and that
   protected identity/acting context came from the authenticated server loader.
3. Verify only `service_role` can execute `api.profile_*` wrappers and that the
   private function receives the server-derived request context.
4. Compare canonical claim version, challenge expiry/attempt count, idempotency
   outcome, job, audit event, and outbox event in the same transaction.
5. For account-free remedy, verify no cookie forwarding and reconcile only by
   the opaque pointer returned in the JSON body.
6. Treat Realtime or cached client state as invalidation hints; use canonical
   RPC state for every decision and recovery.

## Recovery and compensation

1. Reconcile ambiguous commands with the original actor, operation, normalized
   request, version, and idempotency key before any retry.
2. Refetch canonical claim state after `VERSION_MISMATCH`; never overwrite a
   newer challenge, proof attempt, remedy, or ownership period.
3. Resume outbox delivery from its canonical pending row; consumers deduplicate
   by event ID and aggregate version.
4. Replace an expired or exhausted challenge only through the governed command;
   never extend or reset it manually.
5. Restore a paused route only after wrong-user, anonymous, replay, expiry,
   attempt-exhaustion, rollback, and pointer-nondisclosure tests pass.

## Stop conditions

Stop and escalate to security/privacy incident response for RLS bypass,
cross-party claim access, reusable proof, leaked invitation/proof material,
overlapping ownership periods, duplicate command effects, or account-free flow
identity disclosure. Stop automatic conversion when accepted proof, job,
audit, outbox, or idempotency evidence cannot be reconciled.

## Evidence capture

Capture redacted timestamps, release and migration hashes, operation/request
IDs, safe outcome codes, hashed aggregate references, versions, challenge
deadline/attempt state, job status, replay result, RPC/RLS verification,
audit/outbox counts, containment action, and post-recovery tests. Store evidence
only in the approved incident system.

## Drill cadence

After profile-ownership data, authorization, or route changes, exercise
wrong-user and concealed-target reads, account-free remedy without cookies,
same-key lost-response replay, request-hash mismatch, stale version, expired and
exhausted proof, duplicate proof, job acceptance rollback, audit/outbox rollback,
two-tab invalidation, 429 recovery, dependency outage, and opaque-pointer
nondisclosure.
