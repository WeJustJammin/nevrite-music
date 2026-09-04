# Identity authority, organization, membership, alias, and acting-context runbook

## Scope and owner

Identity on-call owns person bootstrap/read failures, role-facet mutations, alias and handle lifecycle, alias transfers, acting-context projection/binding, public identity projection, and the active ORG-01/02, TYPE-01/02, and MEM-01 through MEM-06 organization and membership-tenure boundaries. Legal-identity routes BE01b-14 through BE01b-17 and the remaining BE01c representation, governance, treasury, mandate, and lifecycle operations remain contract-registered but are not runtime-activated by Slice 04.

## Access prerequisites

- Read access to redacted Worker request telemetry and release metadata.
- Supabase access appropriate to the environment and named `platform_api` RPCs.
- Permission to pause an affected identity operation or projection consumer.
- Non-production people, aliases, and transfer offers reserved for recovery drills.

Never copy Auth subjects, emails, raw display names or handles, cookies, CSRF values, idempotency keys, relationship or mandate evidence, legal data, request bodies, or protected projections into incident records.

## Detection signals

- Elevated `DEPENDENCY_UNAVAILABLE`, `VERSION_MISMATCH`, `IDEMPOTENCY_MISMATCH`, `HANDLE_TAKEN`, `CONTEXT_REVOKED`, or `RATE_LIMITED` outcomes.
- Alias ownership periods overlap, a retired handle is reusable, or more than one command wins a CAS race.
- Acting-context revocation does not force canonical refetch and self fallback across tabs.
- Audit/outbox counts diverge from committed mutation counts.
- Public projections include owner, relationship, mandate, Auth, private facet, or legal fields.
- Organization versions advance without a matching type-assignment or membership transition, invitation acceptance succeeds against a stale governance-terms hash, or a replay returns a different resource shape.

## Immediate containment

1. Record environment, release, request ID, operation ID, safe error code, and first observed time.
2. Pause only the affected mutation or projection consumer; retain self-context reads where their independent checks remain green.
3. Do not bypass CSRF, session resolution, per-tab binding, idempotency, `If-Match`, RLS, ownership-period locks, or deliberate confirmation.
4. Do not manually reuse handles, rewrite ownership history, accept expired offers, or select an acting party from URL/client state.
5. If disclosure leakage is suspected, disable public projection caching and escalate under the stop conditions.

## Diagnosis

1. Verify Worker readiness, Supabase reachability, and the current deployment/migration versions without printing credentials.
2. Resolve the human, person, and acting context only through canonical server-side bindings. Treat session `actingPartyId`, deep links, and client binding IDs as hints, never authority.
3. Verify forced RLS, revoked direct grants, fixed empty `search_path`, and named security-definer RPC access.
4. For mutations, compare canonical aggregate version, idempotency outcome, audit row, and outbox event in the same transaction.
5. For aliases, verify normalized handle reservation, immutable redirect/history, one open ownership period, offer participants, and exact seven-day expiry.
6. For context failures, verify the source ownership/relationship version, 12-hour idle window, revocation event, projection version, and self fallback.
7. Confirm public response fields against the allowlist; absence and authorization must not reveal owner or private relationship evidence.
8. For organization and membership commands, verify the server-derived actor/session/acting-party context, current owner/admin/capability grant, exact organization or tenure version, opaque assignment ID, governance mode and terms hash, idempotency request hash, canonical reread, and matching audit/outbox transaction.

## Recovery and compensation

1. Retry ambiguous mutations only with the original actor, operation, normalized request, conditional version, binding, and idempotency key after status reconciliation.
2. Refetch the canonical projection before retrying `VERSION_MISMATCH`; never overwrite a newer aggregate.
3. Expire stale transfer offers and context bindings through their governed transition; do not edit deadlines manually.
4. Resume outbox delivery from the canonical pending row. Consumers deduplicate by event ID and aggregate version and must not reverse source state.
5. Restore public caching only after redaction, ETag/version, anonymous, wrong-user, and retired/private projection tests pass.
6. For an ambiguous organization or membership mutation, reconcile through the resource-specific read RPC with the original operation, idempotency key, request hash, actor context, and target ID. Never substitute a type code for an assignment ID or accept new governance terms during replay.

## Stop conditions

Stop and escalate to security/privacy incident response for RLS bypass, cross-person access, forged acting context, owner discovery, reusable retired handles, overlapping ownership periods, duplicate mutation effects, exposed Auth/relationship/legal data, or public-cache disclosure. Stop automatic transfer processing if recipient, expiry, or version evidence cannot be reconciled.

## Evidence capture

Capture redacted timestamps, release and migration hashes, operation IDs, safe outcome codes, affected aggregate IDs or hashes, versions, rate/deadline state, idempotent replay result, RLS/RPC verification, audit/outbox counts, containment action, and post-recovery tests. Store evidence only in the approved incident system.

## Drill cadence

After identity data, authorization, or projection changes, exercise duplicate person creation, facet add/remove CAS, Unicode/confusable handle collision, permanent old-handle reservation, concurrent transfer accept/decline, exact expiry, two-tab binding isolation, revocation/self fallback, stale/duplicate Realtime hints, organization friction limits, concurrent type add/remove by assignment ID, stale organization CAS, invitation terms-hash mismatch, retroactive membership counterpart confirmation, capacity-period overlap, public-projection redaction, audit/outbox rollback, and same-key lost-response recovery.
