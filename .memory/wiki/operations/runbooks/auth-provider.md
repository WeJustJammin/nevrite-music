# Authentication provider and account-merge runbook

## Scope and owner

Identity on-call owns provider sign-in/link failures, login-method unlink conflicts, duplicate-account proof failures, and queued account-merge reconciliation. This runbook does not authorize enabling a provider; launch configuration remains governed by the provider registry and infrastructure verification.

## Access prerequisites

- Read access to redacted Worker logs and deployment metadata.
- Supabase dashboard access appropriate to the environment.
- Permission to disable a provider through the approved configuration path.
- A non-production test identity with at least two recovery methods for unlink drills.

Never copy access tokens, refresh tokens, provider subjects, email addresses, OAuth codes, state, nonce, PKCE verifier, cookie values, or raw request bodies into incident evidence.

## Detection signals

- Elevated typed `DEPENDENCY_UNAVAILABLE`, `DEPENDENCY_TIMEOUT`, or `DEPENDENCY_INVALID_RESPONSE` outcomes for `AUTH-API-09` through `AUTH-API-15`.
- A rise in merge cases remaining in `analyzing`, `queued`, `running`, or `manual_review`.
- Provider link starts succeed but callbacks fail state, nonce, PKCE, identity, or expiry checks.
- Repeated `CONFLICT` outcomes for stale `If-Match`, final recovery-method protection, or unresolved merge plans.

## Immediate containment

1. Record environment, release, request ID, correlation ID, operation ID, safe outcome code, and first observed time.
2. If one provider is failing or returning invalid success payloads, disable only that provider through the approved registry/configuration path.
3. Keep email recovery and unaffected providers available only when their independent checks remain green.
4. Do not bypass recent step-up, CSRF, idempotency, conditional version, survivor ownership, or duplicate-proof controls.
5. Do not manually repoint identities or delete login methods in canonical tables.

## Diagnosis

1. Confirm Worker readiness and Supabase reachability without printing credentials.
2. Compare failure classes:
   - `502`: provider or RPC returned an invalid success payload.
   - `503`: dependency unavailable or provider disabled.
   - `504`: deadline exceeded; outcome may require reconciliation.
   - `409`: safe domain/CAS conflict; refresh the canonical projection before retrying.
3. For merge cases, read the bounded survivor projection through `AUTH-API-13`; never search for a candidate account by email or provider subject.
4. Verify audit/outbox/idempotency evidence by safe identifiers. A replay with the original idempotency key and request hash must return the canonical result without a second effect.
5. Verify forced RLS, revoked direct grants, fixed empty `search_path`, and named `platform_api` RPC access before treating a database response as authoritative.

## Recovery and compensation

1. Restore the provider only after a non-production sign-in, link-intent, callback, and disclosure-safety drill passes.
2. Retry an ambiguous command with the original idempotency key, original body, and current required conditional version.
3. For an expired or stale merge case, start a new case; do not mutate expiry or version fields manually.
4. For `manual_review`, preserve the case and conflict plan, assign the approved operator workflow, and keep automatic confirmation closed.
5. If a queued merge job failed, reconcile from the canonical job/outbox state. Never enqueue a second merge solely because a client timed out.

## Stop conditions

Stop and escalate to security/privacy incident response if logs or responses expose secrets, email, provider subjects, tokens, OAuth material, candidate identity, or cross-account data. Stop automatic merge processing if survivor/candidate inversion, proof replay, RLS bypass, duplicate effects, or stale-plan acceptance is observed.

## Evidence capture

Capture redacted timestamps, release hashes, operation IDs, safe outcome codes, affected provider code, merge state counts, idempotent replay result, RLS/RPC verification result, rollback or provider-disable action, and post-recovery test results. Store evidence in the approved incident system.

## Drill cadence

Before enabling any provider and after relevant auth/data changes, exercise: provider invalid-2xx handling, provider timeout, link CSRF rejection, final-method unlink rejection, duplicate proof replay, stale merge confirmation, concealed non-owner read, and same-key reconciliation without duplicate effects.
