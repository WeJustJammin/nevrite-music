# Request security and interaction

Trigger: a request, retry, offline intent, multi-tab update, or operator check
does not match the server-derived security and interaction contract.

## Scope and invariants

This runbook covers the request boundary shared by public reads, authenticated
reads, protected commands, offline reconnect, multi-tab invalidation, and
operator diagnostics. It is provider-neutral and local-verification only.

The trusted sequence is:

1. Match the registered route and establish UUID request and correlation IDs.
2. Apply transport limits, method/content-type checks, and structural request
   validation before looking up identity, resources, or policy.
3. Resolve identity and acting party from the server-side session and current
   membership/mandate. Ignore caller-supplied user IDs, party IDs, roles, and
   capabilities.
4. Evaluate the named capability, ownership, visibility, mandate, step-up, and
   resource predicates. A denial never escalates automatically.
5. For a mutation, canonicalize the validated data, compute the request digest,
   require the exact current version where the resource is mutable, and reserve
   idempotency inside the owning transaction.
6. Commit canonical state, append-only audit evidence, and outbox intent
   atomically. A provider, Queue, or browser response is never canonical.
7. Return the registered response/error shape and emit only sanitized
   structured telemetry.

Validation-before-auth prevents malformed input from reaching lookup or policy
code. It does not authorize a request: identity, acting context, capability,
version, and idempotency remain server decisions.

## Cache and response policy

| Request class              | Cache policy                                                                                                                 | Required authority                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Public projection          | Cache only when the route registry marks the projection and response safe; no credentials, private rows, or caller authority | No session, acting context, `Idempotency-Key`, or `If-Match`           |
| Authenticated/private read | `Cache-Control: no-store` at the API and browser boundary                                                                    | Fresh server session, resolved acting party, and RLS-visible authority |
| Operator/evidence read     | `Cache-Control: no-store`; never place evidence in URL or browser-global state                                               | Named capability plus fresh step-up where required                     |
| Protected mutation         | Never treat a cached response as a commit; preserve the server response and version                                          | Server-derived authority, exact version, and idempotency binding       |

Every API failure is JSON with the locked four-field `ApiError` envelope,
`X-Request-Id`, and `Cache-Control: no-store`. Do not add RFC problem fields,
provider names, policy predicates, secrets, or protected payloads.

## Idempotency and version reconciliation

Canonicalize the parsed Zod output before hashing: sort object keys, preserve
absent optionals, normalize strings to Unicode NFC, use UTC RFC 3339 dates,
lowercase UUIDs, and reject non-finite values and negative zero. Bind the digest
to the operation, server-derived actor/acting party, exact route parameters,
target, expected version, and contract major version.

For a retryable mutation:

1. Require an `Idempotency-Key` of 8–128 printable ASCII bytes.
2. Store only its SHA-256 digest with the canonical request digest.
3. Return the original committed result for the same actor/operation/key/digest.
4. Return `409 CONFLICT` for the same key with a different digest; do not
   replace or execute the original request.
5. Require the exact quoted current `If-Match` version for mutable resources.
6. Return a sanitized version conflict for stale values; never overwrite the
   newer canonical state.

If the client loses the response after commit, retry the identical request with
the identical key and body, then reconcile the returned canonical result. Do not
generate a new key until the original operation has been resolved.

## Retry rules

Safe reads may retry at most twice after 250 ms and 750 ms when the boundary
declares the failure retryable. A `429 RATE_LIMITED` response waits for its
server-provided `Retry-After` and matching rate headers; do not substitute a
client delay.

Mutations reconcile first. Query the canonical operation/resource by its
server-issued ID or idempotency binding before retrying. An unknown mutation
outcome is `pending` or `manual_review`, never success and never permission to
blindly resend. A provider or Queue retry must preserve the original intent,
version, correlation ID, and idempotency binding.

## Offline and multi-tab behavior

Offline data is a scoped, temporary draft. It is not canonical and must not
contain authority, secrets, private media, or unrestricted records. On reconnect:

1. Reauthenticate when needed.
2. Resolve the current acting party and capabilities server-side.
3. Refresh contract/settings and fetch the current resource version.
4. Submit the preserved draft with its operation ID, exact version, and
   idempotency binding.
5. Commit, show an explicit conflict, or keep the draft visible and retryable.

Multi-tab events are invalidation hints only. They carry an authorized entity or
event ID and version hint, never authority or protected payload truth. Coalesce
duplicates, refetch canonical state, preserve focus and an allowed draft, and
never apply a mutation from a tab event.

## Operator diagnostics

Operator checks are fail-closed. The server must resolve the actor, acting party,
named `diagnostics.read` capability, and fresh step-up state; a role label or
forged header is not authority. Require a reason through the dedicated
`X-Diagnostic-Reason` header only, reject query-string reasons and control/C1
characters, and bound the reason to the registered UTF-8 limit.

Record allow and deny decisions in append-only audit evidence with request and
correlation IDs, actor/acting-party identifiers when approved, target, decision,
and reason. Never store diagnostic payloads, credentials, session data, or raw
provider responses. Missing capability, missing/expired step-up, invalid reason,
and audit failure must fail closed with the registered safe error.

## Abuse and telemetry handling

Record only allowlisted structured fields: route/operation, request/correlation/
causation IDs, actor class, acting-context class, outcome, status/error code,
duration, dependency class, retryability, and approved hashed identifiers.

Scrub or drop cookies, authorization headers, tokens, secrets, request/response
bodies, emails, phone numbers, addresses, unrestricted IP/user-agent data,
private content, evidence, media URLs, payment/KYC data, and provider payloads.
Structured encoding must prevent newline or log-field injection. Telemetry loss
does not roll back committed business truth; an audit-write failure does block
an audit-required mutation.

## Local verification

Run from the repository root. These commands use committed contracts and local
fixtures only; do not link a cloud project, deploy, create a provider account,
rotate a live secret, or enable a paid monitoring service.

```sh
pnpm contracts:check
pnpm --filter @wejammin/worker type-check
pnpm exec vitest run apps/worker/src/index.test.ts apps/worker/src/diagnostics.test.ts
pnpm format:check
pnpm lint
pnpm type-check
```

When the local database harness is already running, also run:

```sh
pnpm db:lint
pnpm db:test
pnpm db:types:check
```

## Incident decision table

| Symptom                                                                | Decision                                | Safe action                                                                                                                         |
| ---------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Malformed path, headers, media, or body                                | Reject before lookup/mutation           | Return the registered 400/413/415/422 envelope; retain no request content                                                           |
| Missing or expired session/acting authority                            | Fail closed                             | Return reauthentication or capability recovery; do not broaden access                                                               |
| Public response contains private data or private response is cacheable | Security incident                       | Stop promotion, disable the affected cache class, preserve request IDs, and purge only through an approved local/platform procedure |
| Same idempotency key has a different digest                            | Conflict                                | Return 409; preserve the original result and do not execute the new body                                                            |
| Stale exact version                                                    | Conflict                                | Refetch canonical state; show current version beside the preserved draft; never overwrite                                           |
| Read receives retryable 502/503/504                                    | Safe retry permitted only when declared | Retry at 250/750 ms, then show bounded degraded state with request ID                                                               |
| Read receives 429                                                      | Server pacing required                  | Honor `Retry-After` and preserve filters/input                                                                                      |
| Mutation response is lost or provider outcome is ambiguous             | Reconcile before retry                  | Query canonical operation/status using the original binding; keep pending/manual review; never blind resend                         |
| Offline draft or multi-tab event is stale                              | Local state is non-authoritative        | Reauthenticate, refresh authority/version, refetch, and submit explicitly                                                           |
| Operator request lacks named capability, fresh step-up, or safe reason | Deny and audit                          | Return the registered safe error; expose no diagnostic topology or policy detail                                                    |
| Logger/telemetry rejects or loses an event                             | Business truth remains canonical        | Scrub/drop the event, raise a sanitized blind-spot signal, and continue unless the audit write itself failed                        |

Escalate with UTC time, release, route/operation, status/error code, and request/
correlation IDs only. Do not attach credentials, payloads, screenshots of
private evidence, or instructions for paid/provider-side changes.
