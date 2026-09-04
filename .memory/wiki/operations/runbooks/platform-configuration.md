# Platform configuration and settings runtime runbook

## Scope and owner

Platform-configuration on-call owns the Slice 07 implementation of
`CFG-05A-01` through `CFG-05A-04` and the Slice 08 admin-workspace operations
listed below. The canonical stores are the private configuration tables and
their `platform_api` RPC wrappers. Flags, experiments, kill switches,
portability, and quality/lifecycle actions remain outside these slices and must
not be activated by this runbook.

## Access prerequisites

- Read access to redacted Worker request telemetry, release metadata, and
  configuration operation outcomes.
- Environment-appropriate Supabase access to the named `platform_api`
  configuration RPC wrappers and migration/type evidence.
- Permission to pause the affected configuration writer, resolver consumer, or
  outbox consumer through the approved operational control.
- Non-production definitions, effective-value contexts, change reviews, and
  consumer fixtures reserved for recovery drills.

Never copy service credentials, release signatures, session or step-up tokens,
CSRF values, idempotency keys, raw setting values, secret material, or raw
request/response bodies into incident evidence.

## Active route and authority map

| Operation    | Route                                                   | Authority and budget                                                                                     |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `CFG-05A-01` | `POST /api/v1/internal/config/definitions`              | Release service principal; idempotency required; 15 seconds; never a browser route                       |
| `CFG-05A-02` | `GET /api/v1/config/:key/effective`                     | Authenticated human or verified service consumer; no idempotency; 8 seconds; private no-store response   |
| `CFG-05A-03` | `POST /api/v1/admin/settings/:definitionId/changes`     | Authenticated session, server-derived acting party, risk-based step-up; idempotency required; 15 seconds |
| `CFG-05A-04` | `POST /api/v1/admin/settings/changes/:reviewId/actions` | Authenticated session, server-derived acting party, fresh step-up; idempotency required; 15 seconds      |
| `CFG-05B-01` | `GET /api/v1/admin/inbox`                               | Authenticated operator with a current named task capability; 8 seconds; truthful freshness only          |
| `CFG-05B-04` | `POST /api/v1/admin/capability-grants/actions`          | Server-derived actor/party, bounded delegation, fresh authority, idempotency and CAS; 15 seconds          |
| `CFG-05B-05` | `POST /api/v1/admin/audit-diagnostics/actions`          | Active only for `read_audit`; disclosure-safe lookup and freshness; `run_diagnostic` remains deferred    |

`CFG-05B-02` (`/api/v1/admin/search`) and `CFG-05B-03`
(`/api/v1/admin/bulk-operations`) are deferred and unmounted. The
`run_diagnostic` action of `CFG-05B-05` is also deferred and unmounted. Do not
infer availability from the complete schemas for these forward contracts.

Release-principal and service-consumer verification are deployment-supplied
authority seams. A syntactically valid header is not authentication; missing,
invalid, stale, or unverifiable credentials fail closed.

The current `PLATFORM_API` Cloudflare binding is fetch-only and emits no
configuration capability metadata. Therefore the standard Slice 07 admin
projection remains verified read-only until Slice 08 wires a trusted server-only
capability resolver or equivalent Worker-emitted metadata. Never forward or
honor browser-supplied role, provider-role, or capability headers to enable that
projection; missing trusted capability authority must stay read-only or hidden.

## Detection signals

- Elevated `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_REQUEST`, `VERSION_MISMATCH`,
  `IDEMPOTENCY_MISMATCH`, `RATE_LIMITED`, `DEPENDENCY_TIMEOUT`, or
  `DEPENDENCY_UNAVAILABLE` outcomes on the four active operations.
- An effective-value response is stale, falls back without explicit provenance,
  returns an unsupported version, or exposes a value outside the caller's
  permitted context.
- A definition is registered from a browser/admin session, a candidate changes
  after its impact hash is frozen, or an approver is not distinct from the
  proposer.
- A replay creates a second definition, review, value version, snapshot intent,
  audit record, or outbox event.
- A response, browser bundle, log, audit payload, or runtime snapshot contains
  secret material or unredacted private configuration data.

## Immediate containment

1. Record environment, release and migration identifiers, request/correlation
   ID, operation ID, safe outcome code, and first observed time.
2. Pause only the affected registration, proposal/action path, resolver
   consumer, or outbox delivery. Keep independently verified reads available
   only when their provenance and disclosure boundary remain truthful.
3. Do not bypass server-derived actor/acting-party context, release or service
   verification, origin/CSRF checks, capability and RLS checks, step-up
   freshness, idempotency, candidate hashes, version fences, rate limits, or
   deadlines.
4. If a credential or secret crossed a response, log, audit, bundle, or runtime
   boundary, stop the affected route, preserve redacted evidence, and escalate
   under the stop conditions. Rotate through the approved secret/provider path;
   never edit configuration rows manually to compensate.
5. Keep the current known-good value serving while a failed proposal or
   activation remains pending review. Do not promote a client-side or cached
   value during containment.

## Diagnosis

1. Verify Worker readiness, deployment configuration, Supabase reachability,
   migration identity, and generated database-type identity without printing
   credentials. Confirm release-principal and service-consumer verifiers are
   injected in the deployment where those routes are enabled.
2. Confirm the request used the expected same-origin Worker route or Astro
   facade. `CFG-05A-01` must remain excluded from browser forwarding; browser
   callers must not supply actor, acting party, scope, precedence, or
   capability authority.
3. Verify the `platform_api` wrappers call the private RPCs and that direct
   authenticated table access is not being used. Compare the request actor,
   acting party, permitted scope, definition/review ID, expected version,
   candidate hash, and fresh step-up result with server-derived evidence.
4. Compare the canonical definition/value/review/approval/snapshot rows with
   the idempotency outcome, audit decision, and outbox event in the same
   transaction. A response timeout is an unknown outcome until this evidence
   is reconciled.
5. For `CFG-05A-02`, verify the resolver considered only explicitly allowed
   scopes and returned source scope, source version, compatibility state,
   evaluation time, and correlation ID. Missing defaults, stale candidates,
   and unsupported versions stay diagnostic; they never become guessed zero,
   empty, or coerced values.
6. Scan response serialization, browser source/build output, structured logs,
   audit payloads, and snapshot material for secret or private-value leakage.
   Treat Realtime, browser cache, and client drafts as invalidation hints only.

## Recovery and compensation

1. Reconcile an ambiguous command using the original operation, normalized
   request hash, expected version, actor context, and idempotency key. Replay
   only the original request after canonical state confirms it is safe.
2. After `VERSION_MISMATCH`, refetch the current definition/review/value and
   preserve the local draft for explicit review. Never overwrite a newer
   version or reuse an approval against a changed candidate or impact hash.
3. Keep stale, unavailable, or incompatible consumers on their prior
   compatible value or explicit contract fallback. Record a diagnostic and
   retry only after the dependency and version fence are healthy.
4. Perform rollback only through `CFG-05A-04` with a fresh step-up and the
   required candidate/approval/version checks. Rollback creates a new forward
   value version and preserves the prior review, approval, audit, and outbox
   history; do not delete or rewrite rows.
5. Resume outbox delivery from the canonical pending event. Consumers must
   deduplicate by event ID and aggregate/version identity; never blind-resend
   a timed-out activation.
6. Restore a paused route or consumer only after the non-production drill
   covers forged release/service headers, wrong actor/party, stale step-up,
   capability/scope denial, candidate-hash drift, version conflict, replay,
   rollback, outbox duplication, dependency outage, and no-secret output.

## Stop conditions

Stop and escalate to security/privacy incident response for secret or private
configuration disclosure, forged release/service acceptance, actor or acting
party impersonation, capability/RLS bypass, stale step-up acceptance, duplicate
activation, changed-candidate approval, rollback history loss, or any route
that treats an unverifiable credential as authenticated. Stop automatic
recovery when canonical value, review, idempotency, audit, snapshot, or outbox
evidence cannot be reconciled.

## Evidence capture

Capture redacted timestamps, release/migration hashes, operation/request and
correlation IDs, safe outcome codes, hashed definition/review/value references,
scope and version decisions, candidate/impact hash comparison, step-up
freshness result, idempotent replay result, RPC/RLS verification, snapshot and
outbox counts, containment action, and post-recovery test results. Store
evidence only in the approved incident system; never include setting values
when their sensitivity is not explicitly public.

## Local verification commands

Run database reset and verification commands only against the local synthetic
environment. Do not run `db:reset` against hosted or production data.

```bash
pnpm db:verify
pnpm exec vitest run \
  packages/contracts/src/platform-configuration \
  tests/contracts/phase-02-slice-07-contracts.test.ts \
  tests/contracts/phase-02-slice-07-telemetry.test.ts \
  tests/contracts/slice-07-acceptance-traceability.test.ts \
  apps/worker/src/platform-configuration \
  apps/web/src/components/platform-configuration \
  apps/web/src/server/platform-configuration-context.test.ts
pnpm exec playwright test tests/e2e/phase-02-slice-07-behavior.spec.ts
pnpm build
pnpm bundle:check
pnpm progress:check
```

These commands produce validation evidence; they do not by themselves prove
staging or production readiness. `/verify-infrastructure` must record the
release, database, secret-boundary, rollback, and recovery drills before any
dependent production capability is enabled.

## Drill cadence

After configuration contracts, Worker routes, migrations, wrappers, or
consumer changes, exercise release-only registration, unknown-field rejection,
wrong-user/party and forged-header denial, service-verifier absence, stale
step-up, scope/capability denial, same-key lost-response replay,
request-hash mismatch, version conflict, frozen candidate/impact drift,
distinct approval, scheduled activation, forward-only rollback, outbox replay,
unsupported-version fallback, dependency timeout/outage, rate-limit recovery,
browser-route exclusion, and secret-free response/log/audit/build scans.
