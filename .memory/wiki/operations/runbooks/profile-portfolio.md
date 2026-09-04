# Public profile and credit-backed portfolio runbook

## Scope and owner

Profile/Portfolio on-call owns active `PRF-PROF-01` through `PRF-PROF-11`,
public projection composition, asserted-section revision history, governed
emphasis, rights-backed portfolio/reel curation, and fact-observation ingress.
`PRF-EPK-01` through `PRF-EPK-08`, share links, and PDF generation remain
deferred and must stay unmounted.

## Access prerequisites

- Read access to redacted Worker request telemetry, release metadata, and
  profile projection versions.
- Supabase access appropriate to the environment and named service-role
  profile/portfolio RPC wrappers.
- Permission to pause one affected mutation, projection-ingress producer, or
  outbox consumer.
- Non-production parties, credits, media, and rights records reserved for
  recovery drills.

Never copy cookies, CSRF tokens, idempotency keys, private evidence, raw
provider payloads, unlisted media URLs, or service-role credentials into an
incident record.

## Detection signals

- Elevated `VERSION_MISMATCH`, `INVALID_CURSOR`, `RATE_LIMITED`,
  `DEPENDENCY_TIMEOUT`, or `DEPENDENCY_UNAVAILABLE` outcomes.
- A public projection includes private, embargoed, disputed, unlisted,
  revoked, or provenance-ineligible facts.
- Revoked credit/media/rights evidence remains in portfolio or reel output.
- A replay produces a second revision, audit event, outbox event, or different
  resource.
- Deferred `PRF-EPK-*` paths return anything other than the unmounted 404
  boundary.

## Immediate containment

1. Record environment, release, request ID, operation ID, safe error code,
   party hash, projection version, and first observed time.
2. Pause only the affected mutation or ingress producer. Keep independently
   verified public reads available only when the cached projection is known
   viewer-safe.
3. Do not bypass server-derived authority, CSRF/origin checks, capability/RLS,
   idempotency, version fences, rights/provenance checks, or rate/deadline
   policy.
4. Purge a suspect public cache entry and fail closed to degraded or 404 rather
   than reconstructing a projection from client state.
5. If private or governed evidence crossed the public boundary, stop the route
   and escalate under the stop conditions.

## Diagnosis

1. Verify Worker readiness, Supabase reachability, release, migration set, and
   generated database-type identity without printing credentials.
2. Confirm the request entered through the expected public or same-origin Astro
   facade and that authenticated actor/acting context came from the server.
3. Compare canonical profile head, section revision, emphasis version,
   portfolio/reel listing state, and observation source version.
4. Trace each public fact to current visibility, embargo, dispute, party
   lifecycle, provenance, credit, media, and rights evidence.
5. Compare the mutation, idempotency outcome, audit event, and outbox event in
   the same transaction. Treat browser cache, service worker state, Realtime,
   and `BroadcastChannel` messages as hints only.
6. Verify deferred EPK tables, RPCs, Worker routes, API facades, and UI controls
   remain absent.

## Recovery and compensation

1. Reconcile an ambiguous command with the original actor, operation,
   normalized request hash, expected version, and idempotency key before retry.
2. Refetch canonical state after a version conflict; preserve the local draft
   for explicit review or discard and never overwrite a newer revision.
3. Re-run projection ingress only from the authoritative observation and its
   exact source version. Stale or duplicate observations must be no-ops.
4. Resume outbox delivery from the canonical pending row; consumers deduplicate
   by event ID and aggregate version.
5. Restore public traffic only after viewer-safety, revocation cascade,
   stale-observation, wrong-party, replay, outage, 429, offline-cache, and
   deferred-EPK tests pass.

## Stop conditions

Stop and escalate to security/privacy incident response for cross-party or
private evidence disclosure, RLS bypass, stale governed media publication,
revocation failure, duplicate effects, corrupted version history, or any
mounted `PRF-EPK-*` runtime. Stop automatic recovery when canonical profile,
audit, outbox, and idempotency evidence cannot be reconciled.

## Evidence capture

Capture redacted timestamps, release/migration hashes, operation/request IDs,
safe outcome codes, hashed aggregate references, profile and source versions,
visibility/rights/provenance decisions, cache state, replay result, RPC/RLS
verification, audit/outbox counts, containment action, and post-recovery tests.

## Drill cadence

After profile, portfolio, rights, projection-ingress, or cache changes, exercise
wrong-party and concealed-target reads, private/embargoed/disputed exclusion,
credit/media/rights revocation, stale and duplicate observations, same-key
lost-response replay, request-hash mismatch, stale versions, cross-tab
invalidation, 429 recovery, dependency timeout/outage, safe offline fallback,
and deferred EPK route/UI absence.
