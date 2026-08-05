# Authentication, additive login methods and account merge — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]  
**Deep Dive:** [[specs/ia/deep-dives/01-identity-authority|Identity authority deep dive]]  
**Foundation:** [[specs/be/00-infrastructure|Cross-cutting platform foundation]]

**Error Architecture:** Every endpoint uses [[specs/2026-08-02-architecture-design#error-architecture|Architecture Design § Error Architecture]] with `{ code, message, details, requestId }`; `code` is the application enum listed by the endpoint, never an HTTP-status string.  
**Error Recovery:** For every endpoint code, `400|401|403|404|415|422` is non-retryable without corrected input/authority; `409|412|428` requires refetch or prerequisite repair; `429` retries only after `Retry-After`; `502|503|504` retries idempotent reads and committed-key mutations with jitter after status reconciliation; `500` is never blindly retried.  
**Endpoint Security:** Every endpoint rejects unknown fields through strict Zod validation at middleware stage 8, normalizes bounded text and rejects control/format smuggling before domain execution. Response serialization allowlists only the named success/error schema and excludes secrets, tokens, raw provider payloads, SQL, stack traces, private policy predicates, restricted evidence and PII not explicitly named in that response.  
**Endpoint Middleware:** The route's request/authorization cell selects exactly one non-implicit profile: public/cacheable read `120/min/IP`; authenticated read `300/min/user` and `600/min/party`; search `60/min/user` or `30/min/IP`, max 50; ordinary mutation `60/min/user` and `120/min/party`; high-risk command `10/min/user`; admin read/command `120/10 per min/user`; signed provider/webhook `300/min/provider`; internal worker `300/min/service principal`. All run the fixed Shard 00 middleware order. Browser `/api/v1` permits credentialed exact first-party origins only with documented methods/headers and 10-minute-max preflight; `/internal/v1` and worker/provider routes deny browser CORS. `429` includes `Retry-After` and RateLimit headers.  
**Concurrency and Collections:** Every retryable `POST` reserves `Idempotency-Key`; internal/event writes additionally enforce the named producer/event uniqueness key. `PUT|PATCH|DELETE` require `If-Match`/expected version and return `428` when absent and `409 VERSION_CONFLICT` when stale; named allocator, claim, close or lease operations use the stronger serializable/row-lock/unique-key rule stated in the endpoint invariants. Every unbounded collection uses opaque cursor pagination with default `25`, maximum `50`, stable `(created_at DESC, id DESC)` order, only the filters/sorts named in its request cell, and `nextCursor: null` at exhaustion. Explicit bounded embedded arrays/registries return the complete allowlisted set with maximum 50 and no pagination.  
**External Seam:** When an endpoint names a provider/adapter, its outbound request is the strict allowlisted adapter DTO derived from that endpoint's request cell and its response is reduced to the named success fields before domain use; raw payloads never cross the adapter. Synchronous calls have a `5,000 ms` deadline. Idempotent reads retry at most twice with jittered `250 ms` then `1,000 ms` backoff; mutations do not retry after an ambiguous outcome and enter the named reconciliation state. The circuit opens after five consecutive retryable failures for 60 seconds, then admits one probe; exhausted work returns `502|503|504` or the explicit queued/unknown state.  
**IA Traceability:** Every endpoint/worker below implements only the interaction IDs allocated in `## Classification`; its domain request and success tokens are exact projections of the cited IA shard `## Contracts` and `## Data Model`, while transport-only `requestId`, idempotency, version, cursor and error fields derive from [[specs/be/00-infrastructure|Shard 00]]. No endpoint or field may be inferred outside those cited sections; a new field requires contract evolution.  
**Schema Grammar:** Every request/response token expands through [[specs/be/00-infrastructure#normative-schema-grammar|Shard 00 § Normative Schema Grammar]] into an exact strict Zod 4 and PostgreSQL type; local constraints only narrow it. Optionality/nullability must be written, and an unresolved token blocks implementation rather than becoming `any`, `unknown` or free text.  
**Persistence Grammar:** Every locally named table/record expands through [[specs/be/00-infrastructure#normative-persistence-grammar|Shard 00 § Normative Persistence Grammar]] for exact types, non-null defaults, FK/delete actions, uniqueness, query-matched indexes, RLS/grants and atomic audit/outbox behavior. A missing local field, relationship, state or query blocks implementation.  

## Classification

- **Shard classification:** Multi-domain backend split, 4 specifications.
- **This boundary:** Supabase human authentication, server session establishment, additive login identities, unlinking, recovery baseline, idempotent person provisioning and duplicate-account merge orchestration.
- **Split rationale:** Provider callbacks and account-control proof have materially different threats, persistence and release gates from party/alias, mandate/governance and identifier/legacy aggregates. Keeping them separate prevents auth-provider state from becoming party authority.
- **Approval:** Recommended four-spec split accepted under the owner's standing autonomy delegation.

## Referenced Material Inventory

| Material | Backend use |
|---|---|
| [[specs/2026-08-02-architecture-design|Architecture Design]] authentication 267–281 and 717–729 | Confirmed providers, additive linking, unlink/merge, cookies, MFA and setup gates |
| [[specs/ia/01-identity-authority|IA Shard 01]] IDA-01, global interaction and access rules | Idempotent person binding and strict separation of identity from authority |
| [[specs/ia/deep-dives/01-identity-authority|Identity deep dive]] party fields, account states, authority order, counsel gates | Auth UUID mapping, lifecycle and no-minor launch boundary |
| [[specs/be/00-infrastructure|BE Shard 00]] | Error envelope, middleware, idempotency, rate limits, audit/outbox, jobs and observability |

## Endpoint Reconciliation

| Requirement | Endpoint / worker | Disposition |
|---|---|---|
| Provider availability | `GET /api/v1/auth/providers` | Authored |
| Passwordless baseline | `POST /api/v1/auth/email/start` | Authored |
| Social login start | `POST /api/v1/auth/oauth/start` | Authored |
| OAuth/email callback and person provisioning | `GET /auth/callback` | Authored as first-party server route |
| Logout/session invalidation | `POST /api/v1/auth/logout` | Authored |
| List additive methods | `GET /api/v1/account/login-methods` | Authored |
| Link provider | `POST /api/v1/account/login-methods/{provider}/link-intents` plus callback | Authored |
| Unlink provider | `DELETE /api/v1/account/login-methods/{identityId}` | Authored |
| Merge duplicate accounts | create, prove duplicate, confirm and merge job | Authored |
| Enterprise SSO/SAML | none | Explicitly deferred until consumer launch readiness via `/evolve-feature` |
| TikTok | registry-disabled | Lower-priority post-launch custom provider |
| BandLab | registry-unsupported | No endpoint activation absent official stable OAuth/OIDC integration |

## Provider Registry

| Provider code | Launch state | Adapter | Allowed login scope | Notes |
|---|---|---|---|---|
| `email` | enabled | Supabase passwordless OTP/magic link | email authentication only | Required recovery baseline |
| `google` | enabled after setup verification | Supabase built-in | OIDC identity minimum | Additive |
| `apple` | enabled after setup verification | Supabase built-in | identity minimum | Additive; relay email is not canonical identity |
| `facebook` | enabled after setup verification | Supabase built-in | identity minimum | User-facing label may say Meta/Facebook |
| `soundcloud` | conditional launch | custom OAuth2 | stable subject + minimum profile | Enable only after app review and callback tests |
| `tiktok` | disabled | future custom OAuth2 | none at launch | Post-launch evolution |
| `bandlab` | unsupported | none | none | Enable only with official stable subject and acceptable terms |

Registry values include `state`, user label, setup verification version, exact callback origins, scope allowlist, subject claim mapping and incident kill switch. CMS/settings roles cannot enable a provider, expand scope or alter callback origins.

## API Endpoints

### `GET /api/v1/auth/providers`

No body/query. `200` returns `{ providers: [{ code, label, state: "enabled"|"temporarily_unavailable" }], emailRecoveryEnabled: true, version }`; disabled/unsupported providers are omitted, preventing a promise of availability. Public cache 60 seconds with ETag. Errors: `429 RATE_LIMITED`, `503 AUTH_CONFIGURATION_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/auth/email/start`

Body `{ email, intent, returnTo }`: normalized email 3–254 characters; `intent: "sign_in"|"recovery"`; `returnTo` is a relative first-party path 1–512 characters and cannot contain a scheme, authority, control character or backslash. Example `{ "email":"artist@example.com", "intent":"sign_in", "returnTo":"/app" }`.

`202` always returns `{ accepted: true }` for syntactically valid requests whether or not the address exists. Supabase receives only the normalized email, intent and exact allowlisted callback. Errors: `422 EMAIL_INVALID|RETURN_TARGET_INVALID|VALIDATION_FAILED`, `429 RATE_LIMITED`, `502 AUTH_PROVIDER_RESPONSE_INVALID`, `503 AUTH_PROVIDER_UNAVAILABLE`, `504 AUTH_PROVIDER_DEADLINE_EXCEEDED`, `500 INTERNAL_ERROR`.

### `POST /api/v1/auth/oauth/start`

Body `{ provider, intent, returnTo, mergeId? }`; provider must be currently enabled; intent is `sign_in|link|prove_merge`; `link` requires an authenticated fresh session, `prove_merge` requires an active merge UUID, and other cross-combinations fail. Example `{ "provider":"google", "intent":"sign_in", "returnTo":"/app" }`.

`201` returns `{ authorizationUrl, expiresAt }`; URL contains server-created opaque state, PKCE challenge and nonce and is `no-store`/forbidden from logs. Errors: `401 UNAUTHENTICATED` for protected intents, `403 STEP_UP_REQUIRED`, `404 MERGE_NOT_FOUND`, `409 PROVIDER_ALREADY_LINKED|MERGE_STATE_CONFLICT`, `422 PROVIDER_NOT_AVAILABLE|RETURN_TARGET_INVALID|VALIDATION_FAILED`, `429 RATE_LIMITED`, `503 AUTH_PROVIDER_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `GET /auth/callback`

Query is the provider/email callback contract: exactly one authorization `code` or provider-declared error, plus opaque `state`; each 1–2048 characters. The server consumes state once, validates intent/provider/nonce/PKCE/expiry/origin, exchanges the code through Supabase, verifies issuer/audience/expiry and rotates the secure session cookie.

On sign-in, one transaction binds `auth.users.id` to at most one application person; absent binding creates person/self context idempotently and emits `identity.person.created.v1`. Matching email/name/provider text never merges. On link, the callback verifies the initiating user is still the returned canonical user and records the immutable provider subject. On merge proof, it records control of the duplicate account without switching the survivor session.

Success is `303` to the exact state-bound relative return path; auth tokens/codes never enter the redirect. Failure is `303` to `/auth/result?outcome=<allowlisted-code>&requestId=<uuid>` with no provider text. Direct JSON errors are used only when redirect state is invalid: `400 AUTH_CALLBACK_INVALID`, `409 LOGIN_IDENTITY_CONFLICT`, `502 AUTH_PROVIDER_RESPONSE_INVALID`, `503 AUTH_PROVIDER_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/auth/logout`

Optional body `{ scope: "current"|"all" }`, default `current`; `all` requires recent step-up. Required `Idempotency-Key`. `204` clears server cookies, acting-context cache and applicable Supabase sessions; `all` also emits a security notification. Errors: `401 UNAUTHENTICATED`, `403 STEP_UP_REQUIRED`, `409 IDEMPOTENCY_CONFLICT`, `422 VALIDATION_FAILED`, `429 RATE_LIMITED`, `503 AUTH_PROVIDER_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `GET /api/v1/account/login-methods`

Authenticated self only. `200` returns `{ methods: [{ id, provider, label, verifiedAt, lastUsedAt, removable }], recoveryBaselinePresent, version }`; provider subjects, tokens and provider profile payloads are never returned. Private/no-store with ETag. Errors: `401 UNAUTHENTICATED`, `404 ACCOUNT_NOT_FOUND`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `POST /api/v1/account/login-methods/{provider}/link-intents`

Path provider must be enabled and not already linked. Body `{ returnTo }`; required `Idempotency-Key`, `If-Match`, and recent step-up. `201` returns the same authorization contract as OAuth start and reserves a 10-minute single-use link intent. Errors: `401 UNAUTHENTICATED`, `403 STEP_UP_REQUIRED`, `409 VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|PROVIDER_ALREADY_LINKED|LOGIN_IDENTITY_CONFLICT`, `422 PROVIDER_NOT_AVAILABLE|RETURN_TARGET_INVALID`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `503 AUTH_PROVIDER_UNAVAILABLE`, `500 INTERNAL_ERROR`.

### `DELETE /api/v1/account/login-methods/{identityId}`

UUID identity ID; required `If-Match`, `Idempotency-Key`, recent step-up and body `{ reason: "user_request"|"provider_compromise" }`. `200` returns updated login-method projection. The transaction proves another verified login/recovery method remains, unlinks through Supabase, records audit/security event, revokes relevant sessions/provider token references and emits notification/outbox. Errors: `401 UNAUTHENTICATED`, concealment-safe `404 LOGIN_METHOD_NOT_FOUND`, `403 STEP_UP_REQUIRED`, `409 FINAL_LOGIN_METHOD|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT|MERGE_IN_PROGRESS`, `422 VALIDATION_FAILED`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `502 AUTH_PROVIDER_RESPONSE_INVALID`, `503 AUTH_PROVIDER_UNAVAILABLE`, `504 AUTH_PROVIDER_DEADLINE_EXCEEDED`, `500 INTERNAL_ERROR`.

### `POST /api/v1/account-merges`

Authenticated fresh session only. Body `{ survivorUserId, returnTo }`; `survivorUserId` must equal the session user UUID, and return target follows the shared rule. Required `Idempotency-Key` and step-up. `201` returns `{ mergeId, state: "awaiting_duplicate_proof", expiresAt, version }`, expiring in 30 minutes. No email-based candidate lookup exists. Errors: `401 UNAUTHENTICATED`, `403 STEP_UP_REQUIRED`, `409 MERGE_ALREADY_ACTIVE|IDEMPOTENCY_CONFLICT`, `422 VALIDATION_FAILED`, `429 RATE_LIMITED`, `500 INTERNAL_ERROR`.

### `POST /api/v1/account-merges/{mergeId}/prove-duplicate`

UUID merge ID; body `{ provider, returnTo }`; required survivor session, step-up, `If-Match`, and idempotency. `201` returns a state-bound OAuth/email proof authorization. Callback must authenticate a different active Supabase UUID and cannot use a provider subject already linked to the survivor. Success advances to `analyzing`; same-account proof conflicts. Errors: `401`, `403 STEP_UP_REQUIRED`, concealment-safe `404 MERGE_NOT_FOUND`, `409 SAME_ACCOUNT|MERGE_STATE_CONFLICT|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 PROVIDER_NOT_AVAILABLE|VALIDATION_FAILED`, `428`, `429`, `503`, `500` using the common envelope.

### `POST /api/v1/account-merges/{mergeId}/confirm`

UUID merge ID; required survivor session, step-up, `If-Match`, `Idempotency-Key`; body `{ conflictPlanVersion, acknowledgements: [registered code...] }`. Confirmation is accepted only after both-account control, merge analysis completion and explicit resolution of every domain conflict. `202` returns `JobStatus` for an irreversible protected merge job.

The job locks both application users, rejects new sessions/commands for the duplicate, runs registered domain migration functions in dependency order, preserves old IDs/redirects/audit, rebinds approved Supabase identities, verifies counts/authority/RLS, then retires the duplicate. It never chooses a survivor by email and never merges legal identity, money, rights, disputes or evidence without that domain's explicit merge rule.

Errors: `401 UNAUTHENTICATED`, `403 STEP_UP_REQUIRED`, `404 MERGE_NOT_FOUND`, `409 MERGE_STATE_CONFLICT|MERGE_CONFLICTS_UNRESOLVED|MERGE_PLAN_STALE|VERSION_CONFLICT|IDEMPOTENCY_CONFLICT`, `422 VALIDATION_FAILED`, `428 PRECONDITION_REQUIRED`, `429 RATE_LIMITED`, `503 DEPENDENCY_UNAVAILABLE`, `500 INTERNAL_ERROR`.

## Validation Matrix

| Field | Constraint | Status / code |
|---|---|---|
| `email` | normalized valid address, 3–254; never used as canonical merge key | `422 EMAIL_INVALID` |
| `provider` | exact enabled registry code for the requested intent | `422 PROVIDER_NOT_AVAILABLE` |
| `returnTo` | relative allowlisted first-party path, <=512 | `422 RETURN_TARGET_INVALID` |
| OAuth `state` | random 256-bit opaque, single-use, <=10 minutes, intent/session bound | `400 AUTH_CALLBACK_INVALID` |
| PKCE/nonce | exact state-bound value | `400 AUTH_CALLBACK_INVALID` |
| callback `code` | string 1–2048, consumed once | `400 AUTH_CALLBACK_INVALID` |
| identity/merge IDs | UUID | `422 VALIDATION_FAILED` |
| merge acknowledgement | active conflict-plan code, no unknown values | `422 VALIDATION_FAILED` |
| unknown key / mass assignment | strict Zod object rejects | `422 VALIDATION_FAILED` |

## Authorization and Abuse Matrix

| Surface | Anonymous | Authenticated self | Other user/operator | Controls |
|---|---|---|---|---|
| provider list | allow | allow | allow | public-read limit |
| email start | allow | allow | no distinction | 5/15 min IP+identifier, 20/day identifier, existence-safe |
| sign-in OAuth start/callback | allow | allow | no party authority granted | 10 failures/15 min IP+account; progressive challenge |
| link/unlink | deny | self only with step-up | support cannot link/unlink for user | 5/hour identity changes; notification and session revocation |
| login-method read | deny | self only | minimum recovery case projection only | private/no-store; no subjects/tokens |
| merge | deny | survivor with proof of both accounts | identity operator can review blocked case, not bypass proof | 2 starts/day/user, one active; MFA, immutable audit |

Known under-18 registration is blocked. User-editable JWT metadata, provider email/name, deep links and provider scopes never create party authority or merge eligibility.

## Persistence and Supabase Boundary

| Record | Core fields / invariants |
|---|---|
| `identity.auth_user_bindings` | `auth_user_id` unique, `person_id` unique active, state/version; one active person per Auth UUID |
| `identity.login_identity_registry` | app identity UUID, Auth UUID, provider, provider-subject digest, verified/linked/unlinked times, state/version; unique active provider+subject; no access token |
| `identity.auth_intents` | digest of opaque state, intent/provider/session/return path/PKCE+nonce references, expiry, consumed time; single-use, <=10 minutes |
| `identity.account_merge_cases` | survivor/duplicate Auth and person IDs, state, proof times, conflict-plan version, expiry, job, version |
| `identity.account_merge_conflicts` | merge, domain, code, safe summary, resolution state/version; no protected domain payload |
| `identity.account_redirects` | retired user/person ID to survivor, merge/audit reference, permanent; server-only resolution |
| `identity.security_events` | append-only link/unlink/login/logout/merge outcome with provider class, actor, request/correlation, time; no token/raw subject |

Supabase `auth.users` and `auth.identities` remain credential truth. Application migrations do not edit Supabase internal tables directly. Supported Admin/Auth APIs perform provider identity changes; application RPCs reserve intent, enforce invariants, persist audit/outbox and reconcile the resulting Auth state. Manual identity linking is a launch blocker unless setup verification proves production support and rollback behavior.

RLS permits self-safe projections only; mutation is through narrowly granted RPCs. Security-definer callback/finalization functions use empty `search_path`, schema-qualified objects, revoked public execution and named server grants. Merge jobs use a dedicated least-privilege principal and per-domain functions, never arbitrary table updates.

## Transactions and Workers

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Auth intent | `pending → consumed|failed|expired` | Callback consumes once after state/nonce/PKCE verification. Non-pending intent rejects replay and cannot mint session, link or merge proof. |
| Login identity | `link_pending → linked|failed`; `linked → reconciling → unlinked|linked` | Verified callback links; unlink ambiguity enters reconciling; reconciler proves final state. Final-method or merge-active identity blocks unlink. |
| Account merge | `awaiting_duplicate_proof → analyzing → awaiting_confirmation → queued → running → completed|manual_review`; any pre-queue state may become `expired` | Proof starts analysis; resolved plan confirmation queues execution. Stale plan, protected-domain conflict, expiry or wrong account blocks advancement. Completed/expired is terminal. |
| Auth user binding | `active → suspended|memorialised|erasure_processing → retired` only through its owning lifecycle contract | Auth enforces but never invents transitions. Non-active binding blocks new session/link/merge and cannot reactivate by callback. |

Every unlisted transition returns `409 *_STATE_CONFLICT`; external ambiguity never advances to success.

| Operation | Atomic/local guarantee | External failure behavior |
|---|---|---|
| person provision | Auth UUID binding, person party, self context, audit, outbox | duplicate callback returns existing binding |
| link finalize | consume intent, verify current Auth identity, registry/audit/outbox | mismatch leaves intent failed; no partial authority |
| unlink | reserve command, verify final-method invariant, request Supabase change, reconcile registry | ambiguous provider outcome enters `reconciling`; method remains shown until verified |
| merge analyze | prove both UUIDs, snapshot domain registry versions, create conflict plan | stale domain registry invalidates plan |
| merge execute | protected job + per-domain idempotent migration functions | failure pauses in `manual_review`; never deletes duplicate evidence or retries irreversible step blindly |

Workers: `auth-state-reconciler` verifies ambiguous link/unlink state; `account-merge-analyzer` gathers registered domain conflicts; `account-merge-executor` performs the protected migration; `security-notifier` sends link/unlink/all-session/merge notices. Queue envelopes carry IDs only.

## Endpoint Policy and Observability

| Route class | Idempotency/concurrency | Rate / cache | Required telemetry |
|---|---|---|---|
| provider read | ETag | 120/min/IP; public 60s | availability, duration, cache, config version |
| auth start/callback | state single-use; no client idempotency | architecture auth limits; no-store | provider class, intent, outcome, duration; never email/code/token/URL |
| logout | key; session snapshot | 60/min/user; no-store | scope/outcome/session revocation count |
| login-method read | ETag | 300/min/user; no-store | count/provider classes/outcome |
| link/unlink | key + version + step-up | 5/hour/user; no-store | decision, provider class, version, external-call span, audit |
| merge routes | key + version + step-up | 2 starts/day; 10 commands/min | state/conflict count/job/decision; 100% trace and audit |

All endpoints inherit Shard 00's four-field error envelope and middleware. Auth callback and starts register Tier 0 p95 `<500ms` excluding provider completion; protected identity commands register Tier 2. Sentry captures exceptions with `sendDefaultPii: false`; no session replay.

## Failure and Recovery Rules

- Provider identity already belongs to another UUID: return `LOGIN_IDENTITY_CONFLICT`; start explicit merge only after authenticating both accounts.
- Same email across accounts/providers: do nothing automatically and reveal no candidate account.
- Callback replay/state expiry/origin mismatch: consume/fail state, create no session/link/proof and return generic outcome.
- Link callback succeeds at provider but local finalization fails: reconcile current Supabase Auth state before retry; never attach based on callback claims alone.
- Unlink provider times out: retain login method as `reconciling`, prevent duplicate unlink and verify before declaring removal.
- Final method removal: hard conflict even for support/admin; replacement must be verified first.
- Merge conflict in money/rights/legal/evidence: block final confirmation until owning domain supplies an explicit safe resolution.
- Merge job partial completion: preserve checkpoint/audit, freeze duplicate account commands, run only idempotent remaining domain steps and require manual review on invariant mismatch.
- Memorialised/suspended/erasure-processing account: sign-in and merge follow lifecycle-specific denial; authentication cannot reactivate it.

## Contract Test Plan

1. Provider registry tests prove only Google, Apple, Facebook and verified SoundCloud can enable at launch; TikTok/BandLab remain absent.
2. Email start is existence-safe in body, timing class, logs and rate behavior.
3. OAuth tests cover state, nonce, PKCE, one-time use, expiry, exact return origin/path, arbitrary 2xx token responses and sanitized provider failures.
4. Provisioning races create one person for one Auth UUID and never merge by email/name/provider profile.
5. Link/unlink tests cover stale step-up, wrong user, duplicate subject, final method, session revocation, notification and ambiguous provider response.
6. Merge tests prove both-account control, survivor binding, stale conflict plan, unresolved domain blockers, job idempotency, permanent redirects and no destructive evidence rewrite.
7. RLS/BOLA tests deny other users' methods/intents/merge cases and block support/operator bypass.
8. Telemetry snapshots reject emails, provider subjects, tokens, codes, state, authorization URLs and raw provider responses.
9. Setup verification exercises every enabled provider in preview/staging, key rotation, kill switch, callback rollback and Supabase manual-linking production behavior.

## Deepening and Ambiguity Gate

| Pass | Result |
|---|---|
| Consistency | One provider registry and callback state machine serves sign-in, link and merge proof without conflating intent. |
| Concurrency | Single-use state, unique subjects, versioned methods and checkpointed merge jobs resolve races. |
| Cascades | Provider/local split-brain enters reconciliation; merge partial state freezes and resumes safely. |
| Authorization | Public, self, support/operator and merge-job principals have explicit allow/deny boundaries. |
| Observability | Route metrics, audit, security notifications and scrubbed traces are specified. |
| Abuse | Enumeration, return-target injection, callback replay, link takeover, merge takeover and provider-scope creep are bounded. |
| Partial state | Reconcile rather than guess; never silently merge, unlink, reactivate or grant party authority. |

Two implementers receive the same endpoint set, provider states, schemas, status/errors, proof workflow, persistence and tests. Provider-specific endpoint/header values are setup-stage adapter configuration, not unresolved product behavior.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-03 | Four-spec identity split classified and auth/account contract authored | `/write-be-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/deep-dives/01-identity-authority|Deep Dive 01 — Identity authority and party governance]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
