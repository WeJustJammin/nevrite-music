# Authentication & Account Linking — Backend Specification

> **IA Source**: [01 Identity & Authority](../ia/01-identity-authority.md)
> **Deep Dives**: [01 Identity & Authority deep dive](../ia/deep-dives/01-identity-authority.md)
> **Foundation**: [00 Infrastructure](00-infrastructure.md)
> **Status**: Complete

## Split Group

> **Split origin**: `01-identity-authority`
> **Companion specs**: [01b Party Identity & Aliases](01b-party-identity-aliases.md), [01c Relationships, Authority & Governance](01c-relationships-authority-governance.md), [01d Identifiers & Legacy](01d-identifiers-legacy.md)
> **Shared entities**: Supabase Auth user UUID, `PersonParty`, authenticated `RequestContext`, `AuditEvent`, `OutboxEvent`, and shared `JobStatus`

## Classification

- **Type**: multi-domain split, auth/account-control child specification.
- **Owned boundary**: Supabase Auth entry and callback flows, passwordless recovery baseline, session establishment/refresh/logout, additive login-method linking/unlinking, duplicate-account proof and merge orchestration, and Auth UUID-to-`PersonParty` bootstrap handoff.
- **Excluded boundary**: party roles/facets, aliases, organizations, memberships, mandates, authority evaluation, identifiers, memorialisation, estate representation, profile rendering, provider API integrations, and credential/token storage.
- **Ownership rule**: Supabase Auth remains credential, provider-identity, MFA, recovery, and session authority. This shard owns the protected application registry, account-control commands, and handoff to the party owner; it never manufactures party authority or trusts provider text/JWT metadata.

## Referenced Material Inventory

- [01 Identity & Authority IA](../ia/01-identity-authority.md): scope, AC-IDA-01, auth/party separation, access roles, events, edge cases, and cross-shard contracts.
- [01 Identity & Authority deep dive](../ia/deep-dives/01-identity-authority.md): `PersonParty`/account states, authority sequencing, concurrency, abuse/recovery, and implementation envelope.
- [Architecture Design](../2026-08-02-architecture-design.md): authentication boundary and providers (267–281, 717–728), REST/API/errors (343–376, 576–624), schema/transactions (645–668), rate/CSRF (770–797), and observability/SLOs (938–966).
- [Data Placement Strategy](../data-placement-strategy.md): tier ownership (5–17), auth/link placement and boundaries (19–55), PII/lifecycle (57–114), tenancy/sync (116–136), and cross-store user creation (138–148).
- [Engineering Standards](../ENGINEERING-STANDARDS.md): contract/auth/RLS tests (27–44), API limits and tiers (92–107), async/recovery (122–138), security (149–164), quality and migration (166–190).
- [00 Infrastructure BE](00-infrastructure.md): route registry, four-field errors, middleware, idempotency/ETag grammar, event envelope, RLS/grants, jobs, observability, and release/recovery conventions.
- [Hono backend skill](../../../../.codex/skills/hono/SKILL.md): Workers/Hono middleware ordering, atomic PostgreSQL use cases, queue payload minimization, and `app.request()` contract testing.

## IA Source Map

| BE section | Normative source | Exact lines/contract |
|---|---|---|
| Boundary and bootstrap | [IA 01](../ia/01-identity-authority.md) | 1–11, 35, 56–63, 121–144 |
| Auth/account states | [Deep Dive 01](../ia/deep-dives/01-identity-authority.md) | 63–76, 103–115, 117–130 |
| Provider/link/merge/recovery | [Architecture Design](../2026-08-02-architecture-design.md) | 267–281, 717–728 |
| HTTP namespace and command shape | [Architecture Design](../2026-08-02-architecture-design.md) | 343–376, 576–624 |
| Shared request/error/idempotency | [BE 00](00-infrastructure.md) | 69–115, 116–155, 253–296, 330–346 |
| Storage and PII | [Data Placement](../data-placement-strategy.md) | 19–55, 57–114, 138–148 |
| Events and downstream handoff | [IA 01](../ia/01-identity-authority.md) | 206–219, 277–293 |
| Security/rate/observability | [Architecture Design](../2026-08-02-architecture-design.md) | 761–797, 938–966 |
| Test and release floor | [Engineering Standards](../ENGINEERING-STANDARDS.md) | 27–44, 92–107, 122–138, 149–190 |

## Endpoint Completeness Reconciliation

| Locked requirement | Concrete operation(s) | Disposition |
|---|---|---|
| Provider availability | `GET /api/v1/auth/providers` | Authored; disabled/unsupported providers are omitted. |
| Passwordless sign-in and recovery | `POST /api/v1/auth/email/start`; `GET /auth/callback` | Authored as one existence-safe intent/callback flow; no duplicate recovery token endpoint. |
| Social sign-in | `POST /api/v1/auth/oauth/start`; `GET /auth/callback` | Authored for `google`, `apple`, `facebook`, conditional `soundcloud`. |
| Session establishment/refresh/status | `GET /api/v1/auth/session`; `POST /api/v1/auth/session/refresh` | Authored; cookies/tokens remain Supabase/Auth boundary. |
| Auth UUID → person handoff | `POST /api/v1/auth/bootstrap` plus callback reuse | Authored; idempotent handoff, no role/authority creation. |
| Logout and revocation | `POST /api/v1/auth/logout` | Authored; current-session invalidation is an exact `session_id` lookup. |
| Additive login methods | `GET /api/v1/account/login-methods`; link intent/callback; unlink | Authored; provider subjects/tokens are never returned. |
| Duplicate-account proof and merge | create/read/prove/confirm account-merge routes and workers | Authored; both-account control and domain conflict registry required. |
| Enterprise SSO/SAML, TikTok, BandLab | No launch operation | Explicitly deferred/disabled by architecture; later `/evolve-feature` and setup gates required. |

No public candidate lookup, email-based auto-merge, support bypass, manual direct Supabase-table write, or party-authority endpoint is admitted.

### Authoring boundary

| Must be authored in this BE spec now | Justified non-endpoint contract (not an extra public route) |
|---|---|
| The 15 registered operations, strict schemas/errors, auth/ownership, rate/cache/deadline/SLO, idempotency/version rules, and callback redirect behavior. | Supabase Auth adapter for passwordless/OAuth/session rotation/revocation; the adapter is provider-boundary infrastructure, not a client API. |
| Bootstrap, link/unlink, logout, merge proof/confirm semantics and their auditable partial-state behavior. | Protected session-index lookup/revocation port keyed by exact `session_id`; Supabase remains session truth and the index is a minimal application authorization fence. |
| Local support-record ownership, RLS/grants, event payloads, workers, conflict-plan handoff, and contract tests. | Party-owner bootstrap port, downstream merge conflict registry, security-notification adapter, setup/provider verification, and Queue reconciliation are required handoffs because their canonical owners are outside 01a. |

## Feature Ledger Coverage

This cross-cutting Auth/account boundary has no standalone Shard 01 ideation row. `01.01.01` is recorded against companion 01b because 01b owns the canonical `PersonParty` create/read contract; AUTH-API-07 is its required verified-Auth bootstrap dependency. No feature row is double-claimed by this file.

## Shared Contract Inheritance

Every operation below is a compile-time route-registry entry with method/path, operation ID, auth class, owner, request/success/error schemas, cache, timeout, rate, SLO tier, BOLA declaration, and deprecation state. It inherits [BE 00 route archetypes and middleware](00-infrastructure.md#route-archetype-inheritance) and the exact four-field `ApiError`; inheritance is explicit in each registry row, never implied.

- JSON objects are strict Zod 4 objects; unknown keys, mass assignment, control characters, invalid UTF-8, non-finite numbers, and unsafe redirects fail before use-case execution. JSON requests are `application/json`; malformed JSON is 400, unsupported media type is 415, semantic validation is 422.
- `X-Request-Id` is a valid UUID or replaced. `traceparent`, correlation, and causation are server-propagated. Cookie mutations require exact first-party origin and session-bound CSRF. Auth callback uses one-time state/nonce/PKCE and its exact state-bound return path.
- Protected retryable commands require `Idempotency-Key` (8–128 printable ASCII bytes); the key is SHA-256 persisted and bound to actor, operation, path, normalized Zod input, expected version, and contract major. Same binding replays the committed response; a different hash returns 409 `CONFLICT` with `conflict: "IDEMPOTENCY_MISMATCH"`.
- Mutable account/login/merge resources expose a strong quoted decimal ETag, for example `ETag: "7"`. Required `If-Match` is one exact strong quoted decimal; missing or malformed is 400 `INVALID_REQUEST` (BE00 deliberately does not add 428), stale is 409 `CONFLICT` with `conflict: "VERSION_MISMATCH"`.
- Private/authenticated responses are `Cache-Control: no-store`. Limited responses include `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After`. Successful API responses carry `X-Request-Id`; callback redirects carry a request ID only in the safe result path.
- No access/refresh token, OAuth code/state/nonce/verifier, provider raw response, email, provider subject, cookie, authorization URL, IP, or private profile enters logs, traces, Queue payloads, error messages, or analytics.

## Provider Registry

| Code | Launch state | Adapter/scope | Required setup gate |
|---|---|---|---|
| `email` | enabled | Supabase passwordless OTP/magic link; email authentication only | delivery/recovery sandbox and enumeration-safe timing test |
| `google` | enabled after setup verification | Supabase built-in; minimum OIDC identity scope | callback, key rotation, consent and rollback test |
| `apple` | enabled after setup verification | Supabase built-in; minimum identity scope | relay-email and callback/rotation test |
| `facebook` | enabled after setup verification | Supabase built-in; minimum identity scope | Meta/Facebook callback and scope review |
| `soundcloud` | conditional | Supabase custom OAuth2; stable subject/minimum profile only | app review, endpoint, arbitrary-2xx token exchange, and rollback test |
| `tiktok` | disabled | future custom OAuth2 | post-launch decision; absent from enabled catalog |
| `bandlab` | unsupported | none | official stable OAuth/OIDC subject and acceptable terms |

The protected provider registry contains code, state, user label, setup-verification version, exact callback origin, scope allowlist, subject-claim mapping, token endpoint adapter, replay/clock policy, and kill switch. CMS/settings roles cannot enable a provider, expand scopes, or alter origins. Provider API/catalog/social-graph access is a separate consented integration, never a login side effect.

## API Endpoints

### Route Registry

| ID | Method and path | Request | Auth/ownership | Success | Idempotency/concurrency | Rate/cache/timeout/SLO | Declared errors |
|---|---|---|---|---|---|---|---|
| AUTH-API-01 | `GET /api/v1/auth/providers` | none | anonymous public catalog; no authority | `200 ProviderCatalog`; `ETag` | safe read; no key/If-Match | 120/min/IP, public 60s, 8s, Tier 1 ≤150ms p95 | 429; 503; 504; 500 |
| AUTH-API-02 | `POST /api/v1/auth/email/start` | `EmailStartRequest` | anonymous or authenticated; existence-safe | `202 AuthStartAccepted` | state is single-use; no client key | 5/15m/IP+identifier, 20/day/identifier, no-store, 8s, auth/session p95 <500ms excluding provider | 400; 413; 415; 422; 429; 502; 503; 504; 500 |
| AUTH-API-03 | `POST /api/v1/auth/oauth/start` | `OAuthStartRequest` | sign-in public; link/prove self only, fresh/step-up | `201 AuthorizationStart` | state/nonce/PKCE single-use; no client key | login limits, no-store, 8s, auth/session p95 <500ms excluding provider | 401; 403; 413; 415; 409; 422; 429; 502; 503; 504; 500 |
| AUTH-API-04 | `GET /auth/callback` | strict callback query | provider state plus returned Supabase user; no browser authority before exchange | `303` exact state-bound path; safe result redirect on failure | state consume CAS; no client key | 10 failed/15m/IP+account, no-store, provider deadline ≤5s, auth/session p95 <500ms excluding provider | 400; 409; 502; 503; 504; 500 |
| AUTH-API-05 | `GET /api/v1/auth/session` | none | verified session; self binding only | `200 SessionResource` | safe read; no key/If-Match | 300/min/user, no-store, 8s, Tier 1 | 401; 429; 503; 504; 500 |
| AUTH-API-06 | `POST /api/v1/auth/session/refresh` | empty strict body | valid refresh cookie; current session index | `200 SessionResource`; rotated cookies | provider rotation; no client key | 60/min/IP+session, no-store, 8s, Tier 2; auth/session p95 <500ms excluding provider | 400; 401; 415; 429; 502; 503; 504; 500 |
| AUTH-API-07 | `POST /api/v1/auth/bootstrap` | empty strict body | verified active Auth UUID; one self person handoff | `201` new or `200` existing `PersonBootstrapResource` | key required; binding unique on Auth UUID/person | 10/min/user, no-store, 15s, Tier 2 | 400; 401; 403; 409; 413; 415; 429; 503; 504; 500 |
| AUTH-API-08 | `POST /api/v1/auth/logout` | `LogoutRequest` | self; `current` uses exact verified `session_id`; `all` step-up | `204` empty | key required; local revocation commits before provider effect | 60/min/user; `all` 10/min; no-store, 15s, Tier 2; auth/session p95 <500ms | 400; 401; 403; 409; 413; 415; 429; 503; 504; 500 |
| AUTH-API-09 | `GET /api/v1/account/login-methods` | none | self only; no operator broad read | `200 LoginMethodsResource`; `ETag` | safe read | 300/min/user, no-store, 8s, Tier 1 | 401; 429; 503; 504; 500 |
| AUTH-API-10 | `POST /api/v1/account/login-methods/{provider}/link-intents` | `LinkIntentRequest` | self, active account, recent step-up | `201 AuthorizationStart` | key + account `If-Match`; 10m intent | 5/hour/user, no-store, 15s, Tier 2 | 400; 401; 403; 409; 413; 415; 422; 429; 502; 503; 504; 500 |
| AUTH-API-11 | `DELETE /api/v1/account/login-methods/{identityId}` | `UnlinkRequest` | self, identity ownership, recent step-up | `200 LoginMethodsResource`; `ETag` | key + methods `If-Match`; provider ambiguity reconciles | 5/hour/user, no-store, 15s, Tier 2 | 400; 401; 403; 404; 409; 413; 415; 422; 429; 502; 503; 504; 500 |
| AUTH-API-12 | `POST /api/v1/account-merges` | `MergeCreateRequest` | survivor is current self; no candidate lookup | `201 MergeCaseResource` | key + account `If-Match`; one active case | 2/day/user, no-store, 15s, Tier 2 | 400; 401; 403; 409; 413; 415; 422; 429; 503; 504; 500 |
| AUTH-API-13 | `GET /api/v1/account-merges/{mergeId}` | UUID path | survivor self; concealed to others | `200 MergeCaseResource`; `ETag` | safe read | 300/min/user, no-store, 8s, Tier 1 | 400; 401; 404; 429; 503; 504; 500 |
| AUTH-API-14 | `POST /api/v1/account-merges/{mergeId}/prove-duplicate` | `MergeProofRequest` | survivor self, step-up; callback must prove different Auth UUID | `201 AuthorizationStart` | key + merge `If-Match`; proof state single-use | 5/hour/user, no-store, 15s, Tier 2 | 400; 401; 403; 404; 409; 413; 415; 422; 429; 503; 504; 500 |
| AUTH-API-15 | `POST /api/v1/account-merges/{mergeId}/confirm` | `MergeConfirmRequest` | survivor self, step-up, resolved plan | `202 JobStatus` + `Location` | key + merge `If-Match`; protected job lease/CAS | 10/min/user, no-store, 15s, Tier 2; job acceptance p95 ≤500ms/p99 ≤1s | 400; 401; 403; 404; 409; 413; 415; 422; 429; 503; 504; 500 |

`AUTH-API-04` is the deliberate browser callback exception to the JSON `/api/v1` namespace: it is a registered first-party Astro/Hono route, returns only redirects, and never exposes an OAuth token. All other first-party API operations use `/api/v1`.

### Endpoint Contracts and Examples

#### AUTH-API-01 — provider catalog

No body, query, cookie, or caller-selected provider. `200` is strict `{ providers: [{ code, label, state: "enabled" | "temporarily_unavailable" }], emailRecoveryEnabled: true, version }`; disabled/unsupported entries are omitted. Example: `{"providers":[{"code":"google","label":"Google","state":"enabled"}],"emailRecoveryEnabled":true,"version":"7"}`. `503` means protected registry/config unavailable; `500` is unknown failure. No provider existence or secret detail is disclosed.

#### AUTH-API-02 — passwordless sign-in/recovery start

| Field | Constraint and field error |
|---|---|
| `email` | normalized NFC address, 3–254 characters, valid email syntax; `email_invalid` |
| `intent` | exact `sign_in` or `recovery`; `intent_invalid` |
| `returnTo` | 1–512-character relative first-party path; no scheme, authority, backslash, control character, or ambiguous encoding; `return_target_invalid` |

Example: `{"email":"artist@example.com","intent":"recovery","returnTo":"/account/recover"}`. `202` is always `{ "accepted": true }` for structurally valid input, whether the address exists, is unbound, suspended, or unknown; delivery timing and body are existence-safe. Supabase receives normalized email, intent, and exact callback only. No email is stored in application logs or error details. Field validation is 422; malformed body/oversize/media are 400/413/415; Supabase invalid response/unavailable/deadline are 502/503/504; rate rejection is 429.

#### AUTH-API-03 — OAuth start

| Field | Constraint and field error |
|---|---|
| `provider` | enabled registry code for the requested intent; `provider_not_available` |
| `intent` | exact `sign_in`, `link`, or `prove_merge`; cross-field authorization is checked after shape validation; `intent_invalid` |
| `returnTo` | same relative first-party rule as AUTH-API-02; `return_target_invalid` |
| `mergeId` | absent for sign-in/link; required UUID for `prove_merge`; `merge_id_invalid` |

Example: `{"provider":"google","intent":"sign_in","returnTo":"/app"}`. `201` is `{ "authorizationUrl": "https://provider.example/authorize?...", "expiresAt": "2026-08-28T18:00:00Z" }`; the URL is returned once, `no-store`, and never logged. The server creates opaque state, nonce, and PKCE values, stores only their digests, and binds them to provider, intent, return path, session/user where applicable, and 10-minute expiry. Link/proof requires verified self, fresh session and step-up. Provider-disabled is 422; already-linked or active merge is 409; provider configuration failures are 502/503/504.

#### AUTH-API-04 — callback and recovery completion

The strict query accepts `state` (1–2048 opaque characters) and exactly one of `code` (1–2048 opaque characters) or provider-declared error fields. Error descriptions are parsed only to classify outcome, then discarded. State is consumed by CAS before a session/link/proof effect; replay, expiry, nonce/PKCE mismatch, wrong provider/intent, origin mismatch, malformed query, and callback error all produce no session/link/proof and map to safe `400` result. The code exchange adapter accepts every HTTP `2xx` token response, validates the response schema plus issuer/audience/expiry, and rejects invalid upstream shapes as 502; 503 is unavailable/circuit-open and 504 is the 5-second deadline.

On sign-in or recovery, one transaction resolves the returned Auth UUID, invokes the bootstrap handoff if needed, registers the verified session index, and rotates secure `HttpOnly; SameSite=Lax` cookies. On link, the returned Auth UUID must equal the initiating user and the provider subject must be unused. On merge proof, the returned Auth UUID must differ from the survivor and the proof is recorded without switching the survivor session. Success redirects `303` to the exact state-bound relative path with no token/code. Failure redirects `303` to an allowlisted result such as `/auth/result?outcome=AUTH_CALLBACK_INVALID&requestId=018f0c45-73fe-7dc2-9c09-68f7ecf132d4`; if state cannot be safely resolved, return the JSON four-field 400 response instead. Matching email/name/provider profile never merges users.

#### AUTH-API-05/06 — session status and refresh

`GET` has no body and returns strict `SessionResource`: `{ authenticated: true, accountState: "claimed"|"active"|"suspended"|"memorialised"|"erasure_processing"|null, bootstrapState: "complete"|"required"|"blocked", personId: string|null, actingPartyId: string|null, sessionExpiresAt: string }`. Example: `{"authenticated":true,"accountState":"active","bootstrapState":"complete","personId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","actingPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","sessionExpiresAt":"2026-08-28T18:00:00Z"}`. It never returns an Auth UUID, session token, refresh token, provider subject, email, or JWT claims. `bootstrapState: required` is a transient valid Auth session with no binding; it cannot access party data. The server verifies signature/issuer/audience/expiry, then looks up the exact verified `session_id` in `identity.auth_session_index`.

`POST refresh` accepts only an empty strict body and the HttpOnly refresh cookie; Supabase rotates the session and the local index is updated by the returned `session_id`. Example request: `POST /api/v1/auth/session/refresh` with the browser cookie and `{}`. Invalid/revoked/expired refresh is 401 and cannot create a new index row. Success rotates cookies and returns the same `SessionResource`; no token appears in JSON. A Supabase invalid response/unavailable/deadline maps to 502/503/504. Repeated refresh is safe provider rotation behavior, not application idempotency.

#### AUTH-API-07 — Auth UUID-to-person bootstrap

Empty strict body; `Idempotency-Key` required. Example request: `POST /api/v1/auth/bootstrap` with `{}` and `Idempotency-Key: boot-20260828-01`. The server derives `authUserId` only from the verified session, never from body, headers, or JWT metadata. The handoff transaction locks the Auth UUID binding and calls the exported party-owner bootstrap contract to create/retrieve exactly one `PersonParty` and self context. `201` is new, `200` is already bound; same-key replay preserves the original status/resource. `PersonBootstrapResource` is `{ personId, actingPartyId, contextKind: "self", accountState: "claimed"|"active", bindingVersion }`, for example `{"personId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","actingPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","contextKind":"self","accountState":"active","bindingVersion":"3"}`. It creates no role facet, alias, organization, relationship, mandate, or authority projection. Suspended/memorialised/erasure-processing accounts are 403 `account_not_eligible`; an existing Auth UUID bound to a different person is 409 `account_binding_conflict` and never auto-merges.

#### AUTH-API-08 — logout

`LogoutRequest` is strict `{ scope?: "current" | "all" }`, default `current`; unknown keys fail. Example current request: `{"scope":"current"}` with `Idempotency-Key: logout-20260828-01`; example all request: `{"scope":"all"}` with recent step-up. `current` resolves `session_id` from the verified Supabase session and updates only that row. It must not mark all sessions by user ID. `all` requires recent step-up, derives the Auth UUID server-side, locks all active index rows for that user, and schedules Supabase global revocation. Both scopes locally revoke application access, clear cookies/acting-context cache, write audit/security evidence, and enqueue provider revocation; `204` has an empty body. Local revocation is authoritative when provider logout is unavailable; reconciliation retries the provider operation. Same-key replay returns 204 without a second effect. `scope_invalid`, missing/expired session, step-up, idempotency mismatch, rate, persistence, and provider-reconciliation errors map to the registry statuses; no logout failure exposes session IDs.

#### AUTH-API-09 — login-method read

No body/query. `200 LoginMethodsResource` is `{ methods: [{ id, provider, label, verifiedAt, lastUsedAt, removable }], recoveryBaselinePresent: boolean, version }`; example: `{"methods":[{"id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","provider":"google","label":"Google","verifiedAt":"2026-08-28T17:00:00Z","lastUsedAt":null,"removable":true}],"recoveryBaselinePresent":true,"version":"7"}`. `id` is an application identity UUID. Provider subject, email, access/refresh token, raw profile, device, IP, or revocation reason is excluded. `removable` is computed server-side: false for the final verified login/recovery method. `ETag` is the account security version. Self only; another valid user/party is concealed as 404 only if a resource-specific ID is present (this collection has no user selector). Normal read errors are 401/429/503/500.

#### AUTH-API-10 — link intent

Path `provider` is an exact registry code. Body is strict `{ returnTo }` with the relative first-party constraint. Example: `POST /api/v1/account/login-methods/google/link-intents` with `{"returnTo":"/settings/security"}`. Required headers are CSRF, fresh step-up, `Idempotency-Key`, and current account `If-Match`. The server verifies the provider is not already linked, the account is active, and the provider subject cannot be linked to another Auth UUID. `201 AuthorizationStart` is the AUTH-API-03 response plus `intentId` and 10-minute expiry; callback uses `intent=link`. The intent transaction writes audit/idempotency/outbox before any provider callback. A callback returned to a different Auth UUID fails and leaves the intent failed; a provider/local split-brain enters `reconciling`, never partial authority. Any security-session revocation enumerates and updates exact `session_id` rows from the index; it never broad-updates by user ID unless the explicit `all` logout scope is requested.

#### AUTH-API-11 — unlink

Path `identityId` is a UUID. Body is strict `{ reason: "user_request" | "provider_compromise" }`; example: `DELETE /api/v1/account/login-methods/018f0c45-73fe-7dc2-9c09-68f7ecf132d4` with `{"reason":"provider_compromise"}`. Required CSRF, fresh step-up, `Idempotency-Key`, and strong `If-Match` for the login-method list. The transaction locks the identity and proves another verified login or recovery method remains; final-method removal is 409 `final_login_method`, even for support/admin. Supabase identity removal is an external effect after local intent/audit/outbox commit. Confirmed removal marks the local identity unlinked, revokes relevant sessions/provider-token references by exact `session_id` lookup, sends a security notification, and returns the updated list. Timeout/ambiguous response leaves `reconciling`, keeps the method visible, blocks duplicate unlink, and schedules `auth-state-reconciler`; no blind resend.

#### AUTH-API-12/13 — merge case create/read

Create body is strict `{ returnTo }`; example: `POST /api/v1/account-merges` with `{"returnTo":"/settings/security"}`. Survivor is always the current Auth UUID/person, never a caller-supplied candidate. Required CSRF, step-up, `Idempotency-Key`, and current account `If-Match`; one active case per survivor is enforced by a partial unique index. `201 MergeCaseResource` is `{ mergeId, state: "awaiting_duplicate_proof"|"analyzing"|"awaiting_confirmation"|"queued"|"running"|"completed"|"manual_review"|"expired", expiresAt, conflictPlanVersion: string|null, jobId: string|null, version }`. No email/name/provider search or existence disclosure exists. Read example: `GET /api/v1/account-merges/018f0c45-73fe-7dc2-9c09-68f7ecf132d4` returns that resource with `ETag: "4"`. Read is survivor-only, `no-store`, ETag-bearing, and conceals another user's case as 404.

#### AUTH-API-14 — prove duplicate

Path `mergeId` is UUID; body is strict `{ provider, returnTo }`; example: `POST /api/v1/account-merges/018f0c45-73fe-7dc2-9c09-68f7ecf132d4/prove-duplicate` with `{"provider":"email","returnTo":"/settings/security"}`. The provider must be enabled; the case must be `awaiting_duplicate_proof`, unexpired, owned by the current survivor, and step-up fresh. Required CSRF, `Idempotency-Key`, and merge `If-Match`. `201 AuthorizationStart` creates an intent with `prove_merge`; callback authenticates a different active Auth UUID, records duplicate control, and advances to `analyzing`. Same-account proof is 409 `same_account`; a provider subject already linked to the survivor is 409 `login_identity_conflict`. The survivor cookie/session never switches to the duplicate.

#### AUTH-API-15 — confirm merge

Path `mergeId` is UUID. Body is strict `{ conflictPlanVersion, acknowledgements: string[] }`; example: `{"conflictPlanVersion":"4","acknowledgements":["profiles.safe_repoint","aliases.reviewed"]}`. Plan version is a positive decimal string and acknowledgements are non-empty registered conflict codes with no duplicates or unknown values. Required CSRF, step-up, `Idempotency-Key`, and merge `If-Match`. Confirmation requires both-account proof, completed analysis, current plan version, and every conflict explicitly resolved by its owning domain. `202` returns shared `JobStatus` plus `Location: /api/v1/jobs/{jobId}`. The job locks both account bindings, freezes duplicate commands/sessions, invokes registered domain merge functions in dependency order, preserves redirects/audit/provenance, verifies counts/RLS/authority, then retires the duplicate. Money, rights, legal identity, disputes, evidence, or provider integrations never merge without an owning-domain rule. Partial execution checkpoints and enters `manual_review`; only idempotent remaining steps may resume.

## Request/Response Contracts (strict Zod 4)

The contract package is the source for TypeScript, Hono validation, OpenAPI, factories, and tests. Representative schemas below are normative; every object uses `.strict()` and every omitted optional member remains omitted in the canonical request hash.

```ts
const ProviderCode = z.enum(["email", "google", "apple", "facebook", "soundcloud"]);
const ReturnTo = z.string().min(1).max(512).refine(isRelativeFirstPartyPath, "return_target_invalid");
const EmailStartRequest = z.object({
  email: z.string().trim().min(3).max(254).email(),
  intent: z.enum(["sign_in", "recovery"]), returnTo: ReturnTo,
}).strict();
const OAuthStartRequest = z.object({
  provider: ProviderCode, intent: z.enum(["sign_in", "link", "prove_merge"]),
  returnTo: ReturnTo, mergeId: z.uuid().optional(),
}).strict();
const LogoutRequest = z.object({ scope: z.enum(["current", "all"]).optional() }).strict();
const LinkIntentRequest = z.object({ returnTo: ReturnTo }).strict();
const UnlinkRequest = z.object({ reason: z.enum(["user_request", "provider_compromise"]) }).strict();
const MergeCreateRequest = z.object({ returnTo: ReturnTo }).strict();
const MergeProofRequest = z.object({ provider: ProviderCode, returnTo: ReturnTo }).strict();
const MergeConfirmRequest = z.object({
  conflictPlanVersion: z.string().regex(/^[1-9][0-9]*$/),
  acknowledgements: z.array(z.string().min(1).max(64)).min(1).max(50),
}).strict();
const CallbackQuery = z.object({
  state: z.string().min(1).max(2048), code: z.string().min(1).max(2048).optional(),
  error: z.string().min(1).max(128).optional(),
  error_code: z.string().min(1).max(128).optional(),
  error_description: z.string().min(1).max(2048).optional(),
}).strict().superRefine(exactlyCodeOrProviderError);
const ApiError = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500), requestId: z.uuid(), details: z.record(z.string(), JsonValue),
}).strict();
const IsoTime = z.string().refine(isRfc3339Utc, "datetime_invalid");
const DecimalVersion = z.string()
  .regex(/^[1-9][0-9]{0,18}$/, "version_invalid")
  .refine((value) => BigInt(value) <= 9223372036854775807n, "version_out_of_range");
const ProviderCatalog = z.object({
  providers: z.array(z.object({ code: ProviderCode, label: z.string().min(1).max(80),
    state: z.enum(["enabled", "temporarily_unavailable"]) }).strict()).max(5),
  emailRecoveryEnabled: z.literal(true), version: DecimalVersion,
}).strict();
const AuthorizationStart = z.object({ authorizationUrl: z.url(), expiresAt: IsoTime,
  intentId: z.uuid().optional() }).strict();
const AuthStartAccepted = z.object({ accepted: z.literal(true) }).strict();
const SessionResource = z.object({ authenticated: z.literal(true),
  accountState: z.enum(["claimed", "active", "suspended", "memorialised", "erasure_processing"]).nullable(),
  bootstrapState: z.enum(["complete", "required", "blocked"]), personId: z.uuid().nullable(),
  actingPartyId: z.uuid().nullable(), sessionExpiresAt: IsoTime }).strict();
const PersonBootstrapResource = z.object({ personId: z.uuid(), actingPartyId: z.uuid(),
  contextKind: z.literal("self"), accountState: z.enum(["claimed", "active"]),
  bindingVersion: DecimalVersion }).strict();
const LoginMethodsResource = z.object({ methods: z.array(z.object({ id: z.uuid(), provider: ProviderCode,
  label: z.string().min(1).max(80), verifiedAt: IsoTime, lastUsedAt: IsoTime.nullable(),
  removable: z.boolean() }).strict()).max(10), recoveryBaselinePresent: z.boolean(),
  version: DecimalVersion }).strict();
const MergeCaseResource = z.object({ mergeId: z.uuid(),
  state: z.enum(["awaiting_duplicate_proof", "analyzing", "awaiting_confirmation", "queued",
    "running", "completed", "manual_review", "expired"]), expiresAt: IsoTime,
  conflictPlanVersion: DecimalVersion.nullable(), jobId: z.uuid().nullable(), version: DecimalVersion,
}).strict();
```

`JsonValue` and `FieldViolation` inherit BE00 lines 118–136. Error examples always have exactly four top-level members, e.g. `{"code":"VALIDATION_FAILED","message":"Check the highlighted fields.","requestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4","details":{"violations":[{"path":"/email","code":"email_invalid","message":"Enter a valid email address."}]}}`. Success resources are strict and response serializers are separate from database/provider types.

### Field Validation Matrix

| Endpoint/location | Field or header | Constraint | Error |
|---|---|---|---|
| all JSON commands | `Content-Type`, body size | `application/json`; decoded body ≤256 KiB; empty-body routes accept only strict `{}`/zero body as declared | 415 `UNSUPPORTED_MEDIA_TYPE`; 413 `PAYLOAD_TOO_LARGE`; 400 `INVALID_REQUEST` |
| all requests | `X-Request-Id` | UUID or server replacement; never authority | 400 only when malformed values are not replaceable |
| protected commands | `Idempotency-Key` | 8–128 printable ASCII bytes; byte-exact, hashed, actor/operation/request bound | 400 `INVALID_REQUEST`; 409 `IDEMPOTENCY_MISMATCH` |
| versioned commands | `If-Match` | one strong quoted positive decimal, no weak/wildcard/list/leading zero/overflow | 400 `INVALID_REQUEST`; stale 409 `VERSION_MISMATCH` |
| cookie mutations | CSRF/origin | exact first-party same-origin and session-bound CSRF token | 401/403 `UNAUTHENTICATED`/`FORBIDDEN` |
| AUTH-API-02 | `email` | NFC normalized, 3–254, valid email; never canonical merge key | 422 `email_invalid` |
| AUTH-API-02/03/10/12/14 | `returnTo` | relative allowlisted path, 1–512; no scheme/authority/backslash/control/ambiguous encoding | 422 `return_target_invalid` |
| AUTH-API-02/03 | `intent` | closed enum and route cross-field combination | 422 `intent_invalid`; 403 when protected intent lacks self/step-up |
| AUTH-API-03/14 | `provider` | enabled provider registry code for intent | 422 `provider_not_available` |
| AUTH-API-03/14 | `mergeId` | absent except `prove_merge`, then UUID and survivor-owned active case | 422 `merge_id_invalid`; 404 concealed case |
| AUTH-API-04 | `state`, `code`/error | opaque bounded values; exactly code or provider-error branch; state single-use/10m/intent-bound | 400 `AUTH_CALLBACK_INVALID` |
| AUTH-API-06/07 | empty body | no request fields; no caller Auth UUID/session claims | 400 `INVALID_REQUEST` |
| AUTH-API-08 | `scope` | optional closed `current|all`, default current | 422 `scope_invalid`; 401/403 for session/step-up |
| AUTH-API-10 | path `provider` | exact enabled registry code and not already linked | 422 `provider_not_available`; 409 `provider_already_linked` |
| AUTH-API-11 | path `identityId` | UUID owned by current user after structural validation | 400 malformed; 404 concealed |
| AUTH-API-11 | `reason` | exact `user_request|provider_compromise` | 422 `reason_invalid` |
| AUTH-API-12/13/14/15 | path `mergeId` | UUID; survivor ownership checked after shape validation | 400 malformed; 404 concealed |
| AUTH-API-15 | `conflictPlanVersion` | positive decimal matching current plan | 422 `version_invalid`; 409 `merge_plan_stale` |
| AUTH-API-15 | `acknowledgements` | 1–50 unique registered codes, each 1–64 chars; all open conflicts resolved | 422 `acknowledgement_unknown`; 409 `merge_conflicts_unresolved` |

### Error Response Matrix

| Top-level code/status | Exact details shape and auth-specific reason codes |
|---|---|
| `INVALID_REQUEST` 400 | `{ violations?: FieldViolation[] }`; malformed JSON/query/header or missing/malformed required `If-Match`; callback state-shape failures use `{}`. |
| `UNAUTHENTICATED` 401 | `{ recoveryAction: "reauthenticate" }`; missing, expired, revoked, or ambiguous session. |
| `STEP_UP_REQUIRED` 401 | `{ recoveryAction: "step_up", allowedMethods: string[] }`; no factor/provider detail. |
| `FORBIDDEN` 403 | `{ reasonCode, recoveryAction? }`; `account_not_eligible`, `not_survivor`, `support_bypass_denied`, or stale/insufficient step-up; no policy graph. |
| `NOT_FOUND` 404 | `{}`; concealed login identity/merge case. No candidate/account existence is disclosed. |
| `CONFLICT` 409 | `{ conflict: "VERSION_MISMATCH"|"IDEMPOTENCY_MISMATCH"|"INVALID_TRANSITION", reasonCode, expectedVersion?, currentVersion?, recoveryAction }`; reasons include `account_binding_conflict`, `provider_already_linked`, `login_identity_conflict`, `final_login_method`, `merge_already_active`, `same_account`, `merge_state_conflict`, `merge_conflicts_unresolved`, `merge_plan_stale`, `idempotency_mismatch`. |
| `PAYLOAD_TOO_LARGE` 413 | `{ maxBytes: number }` only when safe; global JSON ceiling is 256 KiB. |
| `UNSUPPORTED_MEDIA_TYPE` 415 | `{ allowedMediaTypes: ["application/json"] }`. |
| `VALIDATION_FAILED` 422 | `{ violations: FieldViolation[] }`, one row per `(field × constraint)`; codes include `email_invalid`, `intent_invalid`, `provider_not_available`, `return_target_invalid`, `merge_id_invalid`, `scope_invalid`, `acknowledgement_unknown`. |
| `RATE_LIMITED` 429 | `{ retryAfterSeconds, limit, resetAt }`, matching headers. |
| `DEPENDENCY_UNAVAILABLE` 502/503/504 | `{ dependencyClass, retryable: true, retryAfterSeconds? }`; 502 invalid Auth/provider shape, 503 unavailable/circuit/DB maintenance, 504 registered deadline. |
| `INTERNAL_ERROR` 500 | `{}` only. |

The route registry is the complete per-operation error matrix. A route returns only the listed statuses; each status serializes the corresponding strict row above. All errors have `Content-Type: application/json`, `Cache-Control: no-store`, and `X-Request-Id`; 429 adds all rate headers. Callback redirect failures carry only an allowlisted outcome code and request ID, never an `ApiError` payload in a URL.

## Database Schema, Support Records, and Grants

### Canonical boundary

Supabase `auth.users`, `auth.identities`, MFA, recovery, and sessions remain credential truth; application migrations never write Supabase internal tables directly. `identity` is a protected PostgreSQL schema, absent from exposed Data API schemas. Hono calls named RPCs/views; `anon` has no private grants, and security-definer functions use empty fixed `search_path`, fully qualified names, revoked `PUBLIC`, named server/worker grants, and positive/negative RLS tests.

| Record | Fields and invariants |
|---|---|
| `identity.auth_user_bindings` | `id uuid PK`; `auth_user_id uuid NOT NULL UNIQUE`; `person_id uuid NOT NULL UNIQUE`; `state claimed\|active\|suspended\|memorialised\|erasure_processing\|retired`; `version bigint >0`; `created_at/updated_at`; one active binding per Auth UUID/person; party-owner FK is `RESTRICT`. |
| `identity.auth_session_index` | `session_id uuid PK`; `auth_user_id uuid NOT NULL`; `binding_id uuid NULL`; `state active\|revoked\|expired`; `issued_at`, `last_seen_at`, `revoked_at?`, `revocation_reason?`, `version bigint >0`; index `(auth_user_id,state)` and `(state,last_seen_at)`; stores no access/refresh token. Current logout authorizes/revokes by exact `session_id` lookup. |
| `identity.login_identity_registry` | `id uuid PK`; `auth_user_id uuid`; `provider` closed registry code; `provider_subject_digest bytea CHECK octet_length=32`; `state link_pending\|linked\|reconciling\|unlinked\|failed`; `verified_at?`, `linked_at?`, `unlinked_at?`, `version bigint`; unique active `(provider,provider_subject_digest)`; no token/raw provider payload. |
| `identity.auth_intents` | `id uuid PK`; `state_digest bytea32 UNIQUE`; `intent sign_in\|recovery\|link\|prove_merge`; provider; `auth_user_id?`, `session_id?`, `merge_id?`; exact relative `return_path`; nonce/PKCE digests; `expires_at <= created_at+10m`; `state pending\|consumed\|failed\|expired`; consumed/failure time; version. Code/state/verifier raw values are never persisted. |
| `identity.account_merge_cases` | `id uuid PK`; survivor/duplicate Auth UUIDs and person IDs (protected); `state awaiting_duplicate_proof\|analyzing\|awaiting_confirmation\|queued\|running\|completed\|manual_review\|expired`; proof times; `conflict_plan_version?`; `expires_at <= created_at+30m`; `job_id?`; `version`; survivor/active partial unique index. |
| `identity.account_merge_conflicts` | `id uuid PK`; `merge_id FK`; owning `domain`; registered `code`; safe summary; `state open\|resolved\|blocked`; resolution reference/time; version; unique `(merge_id,domain,code)`; no protected domain payload. |
| `identity.account_redirects` | retired Auth/person ID to survivor Auth/person ID, merge/audit IDs, `permanent true`, created time; server-only resolution; no public lookup. |
| `identity.security_events` | append-only `id`, action, actor Auth UUID, session/provider class, safe outcome/reason, request/correlation IDs, occurred time; no email, token, raw subject, URL, body, or provider payload. UPDATE/DELETE revoked. |

`platform_private.idempotency_records`, `outbox_events`, `provider_operations`, `jobs`, and `audit_private.audit_events` are the BE00 records used by this shard; they are not duplicated. Auth link/unlink/logout provider effects use registered `ProviderOperation` types and Queue envelopes containing IDs/version/correlation only.

### Index, RLS, and retention inventory

- Indexes: unique Auth UUID/person binding; active session lookup by `(session_id,state)` and `(auth_user_id,state)`; active provider subject; intent digest/expiry; active merge survivor; merge conflict; redirect source; security event actor/time and correlation. Query plans use these indexes; no request-time unbounded scan.
- `auth_user_bindings`, session index, login identities, intents, merge cases/conflicts, and redirects: anonymous deny; self may read only safe projections through invoker views; mutations only named RPCs. Wrong user, wrong party, forged Auth UUID, stale step-up, and service-role misuse are denied and tested.
- Support/identity operators may review only assigned recovery/merge metadata with MFA, named capability, reason, and audit; they cannot bypass proof, unlink the final method, or browse general private identity. Queue consumers update only their registered state/lease. Supabase Auth Admin APIs are called through an environment-scoped least-privilege adapter.
- Auth intents expire at 10 minutes; merge cases at 30 minutes; ordinary idempotency is 30 days; operational logs/security telemetry default to 30 days. Account erasure coordinates Auth, bindings, sessions, provider copies, redirects, audit/hold manifests; legal hold overrides eligible purge. Provider copies are deleted/suppressed only under their contract.

### Field-level SQL type and relationship ledger

The following ledger closes the persistence typing boundary for every 01a-owned table. Every field has an SQL type and nullability, every relationship names its target or records the intentional opaque boundary, and each row names query indexes plus the forced-RLS and grant posture. The BE00 platform tables used by this shard retain their authoritative typed definitions in BE00 and are not duplicated here.

| Table | Typed fields, nullability, and constraints | Foreign keys and relationship boundary | Query indexes and uniqueness | RLS and grants |
|---|---|---|---|---|
| identity.auth_user_bindings | id uuid NOT NULL PK; auth_user_id uuid NOT NULL UNIQUE; person_id uuid NOT NULL UNIQUE; state identity.account_state NOT NULL CHECK state IN (claimed, active, suspended, memorialised, erasure_processing, retired); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | auth_user_id REFERENCES auth.users(id) ON DELETE RESTRICT; person_id REFERENCES platform_private.party(id) ON DELETE RESTRICT | PK; unique auth_user_id; unique person_id; index state, updated_at DESC | forced RLS; anon and authenticated have no table grants; named bootstrap/link RPC only |
| identity.auth_session_index | session_id uuid NOT NULL PK; auth_user_id uuid NOT NULL; binding_id uuid NULL; state identity.session_state NOT NULL CHECK state IN (active, revoked, expired); issued_at timestamptz NOT NULL; last_seen_at timestamptz NOT NULL; revoked_at timestamptz NULL; revocation_reason text NULL CHECK char_length <= 160; version bigint NOT NULL CHECK >0 | auth_user_id REFERENCES auth.users(id) ON DELETE RESTRICT; binding_id REFERENCES identity.auth_user_bindings(id) ON DELETE RESTRICT | PK session_id; index auth_user_id, state; index state, last_seen_at DESC | forced RLS; only exact-session status/revoke RPC; no token columns or direct grants |
| identity.login_identity_registry | id uuid NOT NULL PK; auth_user_id uuid NOT NULL; provider text NOT NULL CHECK provider IN (email, google, apple, facebook, soundcloud); provider_subject_digest bytea NOT NULL CHECK octet_length = 32; state identity.login_identity_state NOT NULL CHECK state IN (link_pending, linked, reconciling, unlinked, failed); verified_at timestamptz NULL; linked_at timestamptz NULL; unlinked_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | auth_user_id REFERENCES auth.users(id) ON DELETE RESTRICT; provider subject is a keyed digest, never a raw provider FK | PK; partial unique provider, provider_subject_digest WHERE state IN (link_pending, linked, reconciling); index auth_user_id, state; index state, updated_at DESC | forced RLS; subject hidden from all client roles; named link/unlink and reconciler RPCs only |
| identity.auth_intents | id uuid NOT NULL PK; state_digest bytea NOT NULL UNIQUE CHECK octet_length = 32; intent text NOT NULL CHECK intent IN (sign_in, recovery, link, prove_merge); provider text NULL; auth_user_id uuid NULL; session_id uuid NULL; merge_id uuid NULL; return_path text NOT NULL CHECK relative allowlist; nonce_digest bytea NOT NULL CHECK octet_length = 32; pkce_verifier_digest bytea NULL CHECK octet_length = 32; expires_at timestamptz NOT NULL; state identity.auth_intent_state NOT NULL CHECK state IN (pending, consumed, failed, expired); consumed_at timestamptz NULL; failed_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | provider is a registry code; auth_user_id REFERENCES auth.users(id) ON DELETE RESTRICT; session_id REFERENCES identity.auth_session_index(session_id) ON DELETE RESTRICT; merge_id REFERENCES identity.account_merge_cases(id) ON DELETE RESTRICT | PK and unique state_digest; index state, expires_at; index auth_user_id, created_at DESC; index merge_id | forced RLS; anonymous start receives no row; callback consumes only through state-CAS RPC |
| identity.account_merge_cases | id uuid NOT NULL PK; survivor_auth_user_id uuid NOT NULL; duplicate_auth_user_id uuid NOT NULL; survivor_person_id uuid NOT NULL; duplicate_person_id uuid NOT NULL; state identity.merge_state NOT NULL CHECK state IN (awaiting_duplicate_proof, analyzing, awaiting_confirmation, queued, running, completed, manual_review, expired); proof_at timestamptz NULL; conflict_plan_version bigint NULL CHECK >0; expires_at timestamptz NOT NULL; job_id uuid NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | both Auth IDs REFERENCES auth.users(id) ON DELETE RESTRICT; person IDs REFERENCES platform_private.party(id) ON DELETE RESTRICT; job_id REFERENCES platform_private.jobs(id) ON DELETE RESTRICT | PK; partial unique survivor_auth_user_id WHERE state NOT IN (completed, expired); index state, expires_at; index survivor_person_id | forced RLS; survivor-only projection; operator requires assignment, MFA, purpose, reason and audit |
| identity.account_merge_conflicts | id uuid NOT NULL PK; merge_id uuid NOT NULL; domain text NOT NULL CHECK length 1..64; code text NOT NULL CHECK uppercase registry code; safe_summary text NOT NULL CHECK char_length <= 500; state identity.merge_conflict_state NOT NULL CHECK state IN (open, resolved, blocked); resolution_ref text NULL; resolved_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | merge_id REFERENCES identity.account_merge_cases(id) ON DELETE RESTRICT; domain payload remains an opaque owner-domain reference | PK; unique merge_id, domain, code; index merge_id, state; index state, updated_at DESC | forced RLS; survivor and assigned operator scoped projections only; no domain payload grants |
| identity.account_redirects | id uuid NOT NULL PK; retired_auth_user_id uuid NOT NULL; survivor_auth_user_id uuid NOT NULL; retired_person_id uuid NOT NULL; survivor_person_id uuid NOT NULL; merge_id uuid NOT NULL; audit_id uuid NOT NULL; permanent boolean NOT NULL CHECK permanent = true; created_at timestamptz NOT NULL | Auth and person IDs reference their owning boundaries with ON DELETE RESTRICT; merge_id REFERENCES identity.account_merge_cases(id); audit_id REFERENCES audit_private.audit_events(id) | PK; unique retired_auth_user_id; unique retired_person_id; index survivor_auth_user_id; index merge_id | forced RLS; server redirect resolver only; no public enumeration or direct client grant |
| identity.security_events | id uuid NOT NULL PK; action text NOT NULL CHECK char_length between 1 and 96; actor_auth_user_id uuid NULL; session_id uuid NULL; provider text NULL; safe_outcome text NOT NULL; reason_code text NOT NULL; request_id uuid NOT NULL; correlation_id uuid NOT NULL; occurred_at timestamptz NOT NULL; created_at timestamptz NOT NULL | actor_auth_user_id REFERENCES auth.users(id) ON DELETE RESTRICT; session_id REFERENCES identity.auth_session_index(session_id) ON DELETE RESTRICT; request_id and correlation_id are BE00 opaque request identifiers | PK; index actor_auth_user_id, occurred_at DESC; index session_id, occurred_at DESC; index correlation_id; append-only | forced RLS; append through named security RPC; UPDATE and DELETE revoked for every application role |

## Middleware & Policies

BE00 order is executable: (1) route registry/request context, (2) TLS/CORS/security headers/body/deadline/content/CSRF, (3) raw branch only for signed webhooks (not these routes), (4) server-side Supabase authentication, (5) acting-context resolution, (6) strict Zod boundary validation, (7) ownership/step-up/state authorization, (8) exact `If-Match`/idempotency reservation, (9) one bounded use case/RPC, (10) success/error normalization, (11) one sanitized observability completion. Public auth starts omit only authenticated acting-context steps by declared route profile; callback uses a provider-state authentication branch before session issuance.

| Principal | Allow | Explicit deny |
|---|---|---|
| Anonymous | provider catalog, email sign-in/recovery start, sign-in OAuth start, callback | session, bootstrap, link/unlink, merge, account methods, party data |
| Authenticated self | own session/refresh/logout, bootstrap, methods, link/unlink, survivor merge with proof/step-up | another user's methods/case, arbitrary Auth UUID, party roles/authority, support bypass |
| Other valid user/party | none for this shard's private resources | all self/account operations; conceal resource existence where applicable |
| Support operator | minimum assigned recovery/merge projection and request correlation with purpose grant | link/unlink/merge proof/confirm, final-method removal, direct DB/Auth table edits, universal tenant access |
| Platform identity operator | assigned collision/recovery/merge review after MFA/reason/audit | bypassing both-account proof, authority adjudication, arbitrary merge or session impersonation |
| Queue/service principal | named reconciler/notifier/analyzer/executor operation with lease and current version | interactive auth, wildcard party access, trusting queue/provider claims as authority |
| Supabase/provider adapter | exact registered Auth/provider call and normalized response | raw payload propagation, provider API scopes, canonical party/authority writes |

Account status gates all protected commands: `active` or eligible `claimed` only; `suspended`, `memorialised`, and `erasure_processing` fail closed and cannot be reactivated by callback. No JWT user metadata, provider email/name, return path, deep link, session header, or client-selected acting party grants authority.

### Per-operation middleware, error envelope, limits, telemetry, and test matrix

Every row below is keyed to the authoritative operation ID. Route Registry cells remain the single source for exact route-specific auth, rate, idempotency, and success/error status values; this matrix adds the boundary execution policy and makes each operation explicit.

| Operation ID | Auth and ownership | Rate limit | Input validation | CORS policy | Global error envelope | Error and retry guidance | Pagination and limits | Idempotency and concurrency | Observability | Test oracle |
|---|---|---|---|---|---|---|---|---|---|---|
| AUTH-API-01 | The authoritative Route Registry AUTH-API-01 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-01 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-01 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy public-read allowlist; credentials=false; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Fixed bounded catalog; no pagination parameters accepted; response maximum 50 and deterministic provider or method order. | The authoritative Route Registry AUTH-API-01 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-01; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-02 | The authoritative Route Registry AUTH-API-02 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-02 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-02 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-02 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-02; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-03 | The authoritative Route Registry AUTH-API-03 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-03 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-03 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-03 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-03; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-04 | The authoritative Route Registry AUTH-API-04 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-04 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-04 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy same-origin redirect; no reflected origins; no credentialed JSON. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-04 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-04; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-05 | The authoritative Route Registry AUTH-API-05 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-05 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-05 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-05 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-05; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-06 | The authoritative Route Registry AUTH-API-06 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-06 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-06 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-06 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-06; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-07 | The authoritative Route Registry AUTH-API-07 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-07 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-07 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-07 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-07; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-08 | The authoritative Route Registry AUTH-API-08 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-08 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-08 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-08 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-08; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-09 | The authoritative Route Registry AUTH-API-09 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-09 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-09 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Fixed bounded catalog; no pagination parameters accepted; response maximum 50 and deterministic provider or method order. | The authoritative Route Registry AUTH-API-09 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-09; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-10 | The authoritative Route Registry AUTH-API-10 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-10 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-10 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-10 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-10; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-11 | The authoritative Route Registry AUTH-API-11 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-11 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-11 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-11 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-11; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-12 | The authoritative Route Registry AUTH-API-12 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-12 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-12 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-12 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-12; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-13 | The authoritative Route Registry AUTH-API-13 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-13 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-13 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-13 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-13; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-14 | The authoritative Route Registry AUTH-API-14 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-14 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-14 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-14 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-14; assert exact ApiError envelope and no unauthorized side effect. |
| AUTH-API-15 | The authoritative Route Registry AUTH-API-15 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry AUTH-API-15 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for AUTH-API-15 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry AUTH-API-15 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for AUTH-API-15; assert exact ApiError envelope and no unauthorized side effect. |
## Data Flow, Transactions, and State

1. **Start:** validate allowlisted provider/intent/return path; enforce route rate; create one expiring state/nonce/PKCE intent and redirect. No provider token is retained.
2. **Callback:** verify and consume intent once; exchange code via adapter accepting any 2xx token response; validate issuer/audience/expiry and returned identity; then perform the intent-specific local transaction. Provider network calls never occur inside the PostgreSQL transaction.
3. **Bootstrap:** lock Auth UUID binding; create/retrieve one party-owned `PersonParty` self context, binding, audit, idempotency result, and `identity.person.bootstrap.completed.v1` outbox event atomically. Concurrent same UUID callers serialize to one binding; matching text never merges.
4. **Session:** verify token claims server-side, then exact `session_id` lookup; re-resolve account lifecycle/current context on every protected request. Logout current updates only that row; all scope enumerates rows only after authenticated self + step-up.
5. **Link/unlink:** reserve local intent/operation with version and audit; callback or reconciler verifies current Auth identity/provider subject. Link success is `link_pending → linked`; unlink success is `linked → unlinked`; ambiguous provider outcome is `reconciling` and remains visible.
6. **Merge:** create survivor case; prove a different Auth UUID; analyzer snapshots registered domain versions/conflicts; confirm enqueues protected job. Executor freezes duplicate sessions/commands, applies only registered idempotent domain functions, preserves redirects/history/audit, and retires duplicate only after verification.

| State machine | Allowed transitions and guard |
|---|---|
| Auth intent | `pending → consumed\|failed\|expired`; replay/non-pending cannot mint anything. |
| Session index | `active → revoked\|expired`; revoked/expired cannot authenticate; no reactivation by refresh. |
| Login identity | `link_pending → linked\|failed`; `linked → reconciling → unlinked\|linked`; final method and merge-active blocks. |
| Merge case | `awaiting_duplicate_proof → analyzing → awaiting_confirmation → queued → running → completed\|manual_review`; pre-queue states may expire; terminal states do not reopen. |
| Auth binding | lifecycle transitions belong to party/identity owner; this shard enforces current state and never invents reactivation. |

All local mutations write idempotency, immutable audit/security evidence, and outbox atomically. Outbox dispatch is at-least-once; consumers use IDs/version/CAS and current-state rereads. `identity.auth-state-reconciler`, `account-merge-analyzer`, `account-merge-executor`, and `security-notifier` are registered consumers; Queue payloads contain no PII, token, provider payload, or proof data.

### External seam contracts and circuit state

Provider and notification adapters are the only non-local effects in this companion. Raw tokens, authorization codes, provider claims, and provider response bodies remain in bounded Worker memory only. Each seam uses a strict normalized DTO with `requestId`, operation id, and provider-operation id; an ambiguous response is reconciled before another attempt.

| Operations | Seam and owner | Exact request | Exact response | Timeout | Retry policy | Circuit, open state, and recovery |
|---|---|---|---|---:|---|---|
| AUTH-API-02, AUTH-API-03, AUTH-API-04 | Supabase Auth and registered OAuth adapter | `providerCodeHash`, `stateId`, `pkceVerifier`, `redirectUri`, provider code, `requestId`; code and verifier are memory-only | `providerSubject`, `normalizedIdentity`, `sessionReceipt`, `providerOperationId`, `expiresAt`, `responseClass` | 5,000 ms | Two pre-effect attempts at 250 ms and 750 ms; any post-send ambiguity stays `reconciling` and is polled by operation id | Five retryable failures in 60 seconds open for 60 seconds; return 503 `DEPENDENCY_UNAVAILABLE`, consume no new session/link effect, and reconcile the intent before retry |
| AUTH-API-05, AUTH-API-06, AUTH-API-07, AUTH-API-08, AUTH-API-11 | Supabase session, identity-link, and revocation adapter | `sessionId` or `providerIdentityRef`, local operation id, expected local version, revocation reason, `requestId` | `sessionState`, `providerIdentityState`, `providerOperationId`, `revokedAt`, `normalizedVersion` | 5,000 ms | One safe status read at 250 ms, then one retry at 750 ms; mutation retries require status reconciliation and the same idempotency binding | Five failures in 60 seconds open for 60 seconds; local revoke or reconciling state remains fail-closed, and no new login/session is issued until status converges |
| AUTH-API-11, AUTH-API-15 | Security notification provider | `notificationId`, `eventType`, `recipientClass`, `operationId`, `safeTemplateCode`, `requestId` | `deliveryAttemptId`, `deliveryState`, `providerReference`, `acceptedAt` | 5,000 ms | Three queue attempts at 15, 60, and 300 seconds with the same notification id | Five failures in 60 seconds open for 60 seconds; outbox remains pending or DLQ, access is never restored, and replay uses the same notification id |

## Error Handling and Partial-State Matrix

Boundary validation precedes ownership lookup. Wrong-user/resource decisions are 403 or concealment-safe 404 as the route registry states. PostgreSQL/RLS, Supabase adapters, and workers translate typed internal failures; Hono emits only the matrix above. Unknown failures are 500 `{}` and logged once. Client retry is limited to safe reads or a committed idempotency replay; ambiguous mutation first reconciles by intent/operation/session status.

| Boundary/failure | Before commit | After commit / recovery |
|---|---|---|
| Malformed/invalid input, CSRF, rate | no intent/idempotency/audit/domain mutation | sanitized security telemetry only |
| Supabase session/Auth unavailable | no protected mutation; 401/503/504 | existing local state unchanged; retry after reauthentication/reconciliation |
| OAuth token endpoint invalid 2xx shape | callback state failed; no session/link/proof | none; 502, provider raw response discarded |
| Provider timeout after send | local operation remains pending/reconciling | provider idempotency/webhook/poll resolves; never blind resend |
| PostgreSQL commit/response disconnect | rollback means no reservation; post-commit response loss is safe | same idempotency key or status read returns original result |
| Link callback local finalization failure | intent failed/reconciling; no authority | reconciler reads Supabase state then links or leaves unlinked; no claims-only attach |
| Unlink external ambiguity | identity remains linked/reconciling; duplicate unlink blocked | reconciler confirms removal or returns linked; notification only after confirmed outcome |
| Logout provider failure | local session row is revoked only if local commit succeeds | Queue retries provider revocation; app access stays revoked; no session-wide guess for current scope |
| Merge domain conflict/worker crash | confirm refuses unresolved/stale plan | checkpoint/manual review; duplicate remains frozen; only idempotent remaining steps resume |
| Queue/outbox/notification failure | committed canonical result remains authoritative | outbox/consumer retry/DLQ; notification loss is monitored, not a reason to restore access |
| Audit append failure | command transaction rolls back | no canonical auth/account mutation without required audit |

## Events and Cross-Shard Handoff

All events use BE00 `PlatformEvent`; payloads are identifiers only, `aggregateVersion` is a decimal string, and each outbox row is immutable. Auth-specific event types:

| Event | Payload | Consumer rule |
|---|---|---|
| `identity.person.bootstrap.completed.v1` | `{ personId, bindingId }` | downstream refetches canonical person/authority contract; never creates a second person |
| `identity.login-method.changed.v1` | `{ loginIdentityId, authBindingId }` | settings/security projections refetch; provider subject remains private |
| `identity.session.revoked.v1` | `{ sessionIndexId, authBindingId }` | purge protected caches/acting context; every command still revalidates |
| `identity.account-merge.changed.v1` | `{ mergeId, survivorPersonId, duplicatePersonId }` | registered domain analyzers/executor use current versions and conflict rules |
| `identity.security-notification.requested.v1` | `{ securityEventId, authBindingId }` | notifier sends an approved generic notice; no email/body in Queue |

The bootstrap response handoff is `{ authUserId, personId, actingPartyId: personId, contextKind: "self", bindingVersion }` inside the trusted application boundary only. Downstream shards store canonical `personId`/acting party and authority-source versions; they never receive or persist Auth credentials and never infer party authority from provider identity.

## Observability and Abuse Controls

Each route registers owner `identity-auth`, exact service tier/criticality, measurement label, alert route, and one operation ID. `@wejammin/observability` emits one scrubbed NDJSON event with route/operation, request/correlation/causation/trace IDs, actor/acting-context class, safe entity/version, outcome/error, duration, dependency, retryability, and job/attempt. Direct IDs are hashed/omitted. Required route telemetry:

| Operation family | Audit/security | Metrics/traces |
|---|---|---|
| catalog/start/callback | auth outcome and rate/security signal; no email/code/URL | provider class, intent, state outcome, callback latency; 100% errors, 10% auth success |
| session/refresh/logout | session class, scope, revocation outcome; no raw `session_id` | exact lookup hit/revoked count, refresh failures, cache purge, auth/session latency |
| bootstrap | completed/denied binding decision | binding race/conflict, account state, outbox lag, Tier 2 latency |
| methods/link/unlink | immutable link/unlink decision, reason, step-up, provider class | version conflicts, final-method denials, external call/reconcile latency, 100% high-risk traces |
| merge | proof/plan/conflict/confirm/job decisions and every checkpoint | case state, conflict count, job age/retry/DLQ, 100% traces |

Forbidden telemetry includes auth/cookie headers, tokens, codes/state/nonce, provider subjects/raw responses, email/phone, request bodies, authorization URLs, IP beyond bounded security telemetry, evidence, and policy predicates. Rate/abuse controls inherit architecture: login failures 10/15m/IP+account with progressive 15m lock/challenge; email 5/15m IP+identifier and 20/day identifier; link/unlink 5/hour; merge create 2/day; all limited responses expose standard headers. Provider circuits open after five retryable failures for 60 seconds. No public enumeration or timing oracle is permitted.

## Contract, Security, and Recovery Tests

- Route/OpenAPI registry equality: all 15 operations have exact method/path/operation/auth/rate/cache/timeout/SLO/request/success/error/BOLA entries; no duplicate or stale route.
- Zod/HTTP: every field × constraint, unknown key, malformed JSON, empty body, 256 KiB ceiling, 415, control/Unicode/redirect smuggling, UUID/version/idempotency parsing, exact callback discriminant, and four-field error details.
- Auth/provider: catalog kill switch; email recovery/sign-in existence-safe body/timing/rate; Google/Apple/Facebook/SoundCloud setup; arbitrary token endpoint 200–299; issuer/audience/expiry; state/nonce/PKCE one-use/replay/expiry; exact return path; no token/log/provider payload leakage.
- Bootstrap races: 100 concurrent same Auth UUIDs produce one binding/person/self context; same key exact replay; different hash conflict; matching email/name/provider profile never merges; suspended/memorialised paths fail closed.
- Session/logout: valid/expired/revoked token; exact `session_id` current logout leaves other sessions active; `all` requires step-up and revokes all; provider outage retains local revocation; refresh never reactivates revoked index; cache/acting-context purge.
- Link/unlink: wrong user/party, stale step-up, duplicate provider subject, stale version, final method, provider 2xx/invalid/timeout, local/provider split-brain, reconciliation, notification, audit, and session/provider-token revocation.
- Merge: both-account proof, same-account rejection, survivor binding, active-case uniqueness, stale/expired plan, every unresolved domain conflict, idempotent queued job, worker lease/CAS/retry/DLQ, redirect/audit preservation, duplicate freeze/retirement, no money/rights/legal/evidence rewrite without owner rule.
- PostgreSQL/RLS: anonymous, correct self, wrong valid user, wrong party, forged Auth UUID/JWT metadata, revoked account, stale `If-Match`, missing step-up, support/operator bypass, service-role misuse, exposed-schema grants, security-definer search path, unique/index/state/retention/audit immutability.
- Observability/security: redaction sentinels for email/token/code/state/provider subject/body/URL; one owning-boundary event; metrics and SLO registration; no session replay/default PII. Recovery tests cover outbox duplicate, Queue replay, provider ambiguity, DLQ/manual review, PITR restore fence, and erasure/hold manifests.
- Performance gates: auth/session callback p95 `<500ms` excluding provider completion and error `<0.5%` excluding invalid credentials/provider rejection; Tier 1 `<750ms`; Tier 2 `<1,200ms`; job acceptance `<500ms`; outbox undispatched p95 `≤2s`; Queue first attempt `≤60s`.

## Deepening Passes and Ambiguity Gate

| Pass | Concrete result | Status |
|---:|---|---|
| 1 consistency | One provider registry/state/intent contract serves sign-in, recovery, link, and merge proof; route matrices and schemas agree. | PASS |
| 2 concurrency | Auth UUID, provider subject, intent digest, session ID, active merge, idempotency key, ETag, and worker leases are unique/CAS serialization points. | PASS |
| 3 failure cascade | Provider 2xx-invalid, timeout, local commit loss, outbox/Queue loss, notification loss, and merge partial state each reconcile without guessing. | PASS |
| 4 authorization | Anonymous/self/other/support/operator/queue/provider rows explicitly allow/deny; current session invalidation uses exact `session_id`. | PASS |
| 5 observability | Per-operation audit, scrubbed logs, metrics, traces, SLO/owner/alert registration, and forbidden-field tests are concrete. | PASS |
| 6 rate/abuse | Enumeration, return-target injection, callback replay, provider scope creep, link takeover, merge takeover, brute-force and circuit controls are bounded. | PASS |
| 7 partial state | Local Auth/account truth remains authoritative; ambiguous external outcomes are pending/reconciling/manual review, never silent success. | PASS |
| 8 source contradictions | Current BE00 wins: four-field errors, missing `If-Match` 400/no 428, strict route registry, queue ID-only payloads, and no duplicated platform records. | PASS |
| 9 two-implementer convergence | Two implementers can select the same routes, fields, statuses, auth predicates, transaction boundaries, states, workers, and tests. | PASS |
| 10 adversarial scan | Hostile callback, wrong human, forged UUID/role, final-method, provider split-brain, partial merge, and telemetry-leak review introduced no unresolved contract. | PASS |

### Quality Gate

- Endpoint reconciliation covers every owned flow; all deferred flows have explicit reasons.
- Every endpoint has request fields/constraints/examples, strict success response, complete declared error classes, field×constraint codes, auth/ownership, idempotency/concurrency, rate/cache/timeout/SLO, audit/log/metric/trace behavior.
- Supabase/Auth, PostgreSQL binding/session/link/merge support records, indexes, RLS/grants, lifecycle, and retention are explicit; party roles/authority remain excluded.
- Middleware order, provider 2xx behavior, transactions, workers, events, idempotency, session-ID invalidation, and every external partial state are executable contracts.
- Contract, RLS, authz/BOLA, provider, recovery, observability, performance, and accessibility handoff tests are named.
- Passes 1–10 and micro/macro/two-implementer/devil's-advocate ambiguity gates pass.

## Source Gaps and Dependency Gates

These are setup/provider or downstream contract gates, not unresolved behavior in this spec:

| Gap | Required gate before enablement |
|---|---|
| Supabase project IDs, exact first-party callback origins, secrets, cookie names, and environment bindings are not architecture-time values | `/setup-workspace` validates environment schemas, isolated credentials, callback origin allowlist, cookie flags, rotation, and rollback. |
| Supabase manual identity-linking capability is beta; SoundCloud is custom/conditional | `/verify-infrastructure` exercises production-shaped link/unlink, any-2xx token exchange, key rotation, kill switch, provider outage, and rollback before provider enablement. |
| Domain-specific merge conflict rules are owned by 01b/01c/01d and downstream rights/money/legal shards | Each owning shard registers conflict codes, version snapshot, idempotent merge function, RLS tests, retention/hold behavior, and manual-review runbook before `awaiting_confirmation` can complete. |
| Exact notification delivery provider/config is setup-owned | Security notification adapter supplies strict normalized DTO, provider operation/idempotency, redaction, retry/DLQ, and suppression tests; notification failure never restores access. |

No product or architecture question remains open. Provider configuration and domain merge registrations are explicit dependency gates; they do not authorize a weaker implementation or silent fallback.

## Ambiguity Gate

**PASS.** Implementer simulation and devil's-advocate review covered AUTH-API-01 through AUTH-API-15, strict request and success schemas, per-operation middleware and CORS, BE00 ApiError envelopes, authorization concealment, idempotency and concurrency, typed persistence, state recovery, integration boundaries, observability, tests, and source reconciliation. No unresolved implementation ambiguity remains; open questions are none.

## Open Questions

None. The only non-endpoint contracts intentionally authored here are the protected Auth adapter, session-index lookup/revocation port, bootstrap handoff, merge conflict registry, reconciliation workers, event payloads, and setup/verification gates required to make the endpoints safe.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Expanded approved Shard 01a split into complete backend contract; reconciled historical route breadcrumb to current IA, architecture, standards, and BE00 conventions; added session-ID invalidation, bootstrap, recovery, provider 2xx, merge orchestration, RLS, workers, tests, passes, and source gates. | `/write-be-spec-write` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
