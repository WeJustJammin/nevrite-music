# Shadow parties, claims, contests and ownership transfer — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]  
**Deep Dive:** [[specs/ia/deep-dives/02-profiles-verification|Profiles verification deep dive]]  
**Dependencies:** [[specs/be/00-infrastructure|Foundation]], [[specs/be/01b-party-identity-aliases|Parties and acting context]]

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

- **Shard split:** 1 of 3; PRF-01 through PRF-09.
- **Boundary:** inert shadow creation, non-blocking matching/invitation, account-free suppression/correction, proof-tier claims, provisional control, contests and consensual ownership transfer.
- **Approval:** Recommended split accepted under standing autonomy.

## Endpoint Reconciliation

| Requirement | Surface |
|---|---|
| shadow create/reuse | internal `profile.resolve_shadow_party` RPC invoked inside qualifying domain command |
| duplicate suggestions | `POST /api/v1/shadow-party-matches` |
| invitation | `POST /api/v1/shadow-parties/{shadowId}/invitations` |
| account-free remedy | `POST /api/v1/shadow-remedies/start`, `POST /api/v1/shadow-remedies/{remedyId}/complete` |
| claim start/resume | `POST /api/v1/party-claims`, `GET /api/v1/party-claims/{claimId}` |
| proof | `POST /api/v1/party-claims/{claimId}/challenges`, `POST /api/v1/party-claims/{claimId}/proofs` |
| conversion/contest | convert command and contest create/read/evidence/withdraw |
| transfer | offer and accept/decline commands |

## Core Contracts

- A shadow is an inert Shard 01 party plus `shadow_party_context`; it is always subject, never agent, has no session/mandate and is absent from public/search/sitemap/social projections.
- Creation key is source domain/entity/role/party reference plus idempotency. Matching is advisory, completes within 400ms or returns no suggestions, and never blocks the source fact or silently merges.
- Known/suspected minor context stores the protected fact but suppresses all outreach pending safeguarding evolution.
- Proof: Tier A independent control grants full; Tier B one independent route designation grants provisional and two independent same-route designations grant full; Tier C confirmations grant provisional only.
- Attester independence rejects claimant equivalence, same organization, mandate relation, same project/session and duplicate human. Attesters must be fully claimed, active and non-provisional.
- Provisional allows reversible profile/spec corrections and servicing committed obligations; denies transfer/retire, payout/payee, signatures/rights, new durable money obligations, authority grants, private evidence/export and unlicensed media publication.

## API Endpoint Matrix

| Endpoint | Request / example | Success | Errors |
|---|---|---|---|
| `POST /api/v1/shadow-party-matches` | `{ displayName, sourceDomain, roleCode?, identifier? }`, strict strings 1–120; key | `200 { suggestions[], timedOut }` within 400ms; suggestions viewer-safe | `401`, `403`, `422`, `429`, `500`; timeout is successful empty result |
| `POST /api/v1/shadow-parties/{id}/invitations` | UUID; `{ routeId }`; ETag/key | `202 JobStatus`; day 0/3/14 plus one per unrelated attester, max six lifetime | `404 SHADOW_NOT_FOUND`, `409 SUPPRESSED|INVITE_LIMIT|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/shadow-remedies/start` | `{ receiptCode, action:"suppress"|"correct" }` | existence-safe `202 { accepted:true }`; fresh route challenge | `422`, `429`, `503`; no party existence leak |
| `POST /api/v1/shadow-remedies/{id}/complete` | six-digit code, max five attempts/15m; key | `200` active outreach/publication suppression or protected correction case | `404 REMEDY_NOT_FOUND`, `409 CHALLENGE_EXPIRED|ATTEMPTS_EXCEEDED`, `422`, `429` |
| `POST /api/v1/party-claims` | `{ targetPartyId, claimKind }`; authenticated; key | `201 ClaimCase`; pointer/link possession never authenticates | `404 PARTY_NOT_FOUND`, `409 CLAIM_ALREADY_ACTIVE|TARGET_FROZEN`, `422`, `429` |
| `GET /api/v1/party-claims/{id}` | claimant/incumbent/operator scope | `200` state, control, eligible healthy proof methods, deadlines, version | concealment-safe `404`, `401`, `429` |
| `POST /api/v1/party-claims/{id}/challenges` | `{ method, routeRef? }`; ETag/key | `201 { challengeId, expiresAt, maskedDestination? }` | `409 METHOD_UNAVAILABLE|CLAIM_STATE_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/party-claims/{id}/proofs` | strict union code/provider event/attestation IDs; ETag/key | `200` provisional/full/stalled claim projection | `409 PROOF_FAILED|INDEPENDENCE_FAILED|CONTEST_OPEN|VERSION_CONFLICT`, `422`, `428`, `429`, `502/503/504` |
| `POST /api/v1/party-claims/{id}/convert` | no body; ETag/key | `200` full when window elapsed or stronger proof exists and no contest | `409 WINDOW_ACTIVE|INDEPENDENT_PROOF_REQUIRED|CONTEST_OPEN`, `428`, `429` |
| `POST /api/v1/ownership-contests` | `{ partyId, challengerClaimId }`; key | `201` open contest, response due exactly 14 days; transfer frozen | `409 CONTEST_ALREADY_OPEN|CONTEST_LIMIT`, `422`, `429` |
| contest read/evidence/withdraw | `GET /ownership-contests/{id}`; `POST .../evidence`; `POST .../withdraw` with ETag/key | current participant-safe case; accepted evidence or withdrawn state | `404`, `403`, `409 STATE|VERSION|EVIDENCE`, `422`, `428`, `429` |
| `POST /api/v1/party-ownership-transfers` | full owner `{ partyId, recipientPersonId }`; step-up, ETag/key | `201` pending offer; blocked by contest | `403 STEP_UP_REQUIRED`, `409 CONTEST_OPEN|TRANSFER_PENDING|VERSION_CONFLICT`, `422`, `429` |
| `POST /api/v1/party-ownership-transfers/{id}/decisions` | recipient `{ decision:"accept"|"decline" }`; step-up, ETag/key | `200`; accepted has 14-day org/30-day person reversal and 30-day public marker | `404`, `409 EXPIRED|STATE|VERSION`, `422`, `428`, `429` |

All JSON errors use Shard 00. Authenticated/private routes are no-store. Commands require idempotency and declared versions. Invitation notices reveal attester, count and instrument/role only—never work title or portfolio.

## State, Persistence and RLS

| Table | Invariants |
|---|---|
| `profile.shadow_party_contexts` | unique source-domain/entity/party binding; structured role/instrument/contact; no public grant |
| `protected.shadow_suppressions` | party or route fingerprint, outreach/publication/both, case/state; never discoverable no-shadow registry |
| `profile.invitation_dispatches` | unique shadow/route/attempt 1..6; queued/sent/retryable/stopped |
| `profile.claim_cases` | target/claimant/kind/state/control/window/version; one active self claim/person/target |
| `profile.claim_proof_attempts` | tier/method/challenge hash/evidence/attesters/independence/state/expiry; append-only |
| `profile.party_ownership_periods` | party/controller/start/end/source claim; exclusion prevents overlap |
| `profile.ownership_contests` | party/incumbent/challenger/state/due/basis/winner/reversal/version; one open per party/person |
| `profile.ownership_transfer_offers` | party/from/to/state/expiry/reversal/version; one pending |

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Shadow party | `created → invited|suppressed|claimed|merged`; `invited → suppressed|claimed`; `claimed → merged` only through explicit duplicate resolution | Invitation/remedy/claim resolution triggers. Suppressed blocks outreach/publication but not protected correction; claimed/merged rejects claim bootstrap. |
| Claim case | `started → proving → provisional|full|stalled|withheld|contested`; `provisional → full|contested|revoked` | Proof threshold/current policy triggers. Missing healthy method stalls; safeguarding withholds; open contest blocks full control. Stale proof cannot overwrite terminal state. |
| Proof attempt | `pending → accepted|rejected|expired|superseded` | Current challenge/evidence/attester evaluation or timer triggers. Duplicate/non-independent attester rejects; non-pending attempt cannot count twice. |
| Ownership contest | `open → resolved|frozen|withdrawn`; `frozen → resolved|withdrawn` only through Shard 24/policy evidence | Evidence/operator decision/withdrawal triggers. Open/frozen blocks transfer and payout/authority changes; resolution is append-only. |
| Ownership transfer offer | `pending → accepted|rejected|expired|blocked_by_contest` | Recipient decision/timer/contest race triggers under lock. Only accepted changes owner; terminal offer rejects replay. |

Every unlisted transition returns the typed state-conflict code. Existing obligations continue under operate-only custody; no new obligations, payout changes or custom escrow arise from contested/frozen state.

RLS gives claim participants minimum projections, never proof/evidence of the other side. Support handles mechanical purpose grants only; credible two-sided contests freeze rather than let an identity operator guess.

## Transactions, Workers and Events

- Source-domain RPC atomically creates/reuses party/context with the source fact; invitation/matching failure cannot roll back the fact.
- Challenge hashes are single-use; success, expiry or five failed attempts burns them. Provider callbacks dedupe and revalidate current claim/party version.
- Grant locks party/claim/ownership period and writes audit, notifications, projection invalidation, idempotency and `profile.claim.changed.v1`.
- At 14 days, strong uncontested Tier A/full Tier B challenger evidence may win reversibly; weak/Tier C/credible conflict freezes and emits `profile.contest.changed.v1` for Shard 24.
- Reversal uses a compensating ownership-period command; attributed actions and evidence are never deleted or reattributed.
- Matching, invitation, challenge delivery and contest deadline workers carry IDs only and honor suppression/current state.

## Authorization, Limits and Observability

| Surface | Principal | Limit / telemetry |
|---|---|---|
| matching/shadow resolution | qualifying domain actor/service | 60/min/user; match duration/suggestion count only |
| invitation | creator standing + route authority | creator budget, six lifetime; attempts/suppression/provider outcome |
| account-free remedy | verified contacted route or protected case | 5/15m route+IP; existence-safe outcomes, protected audit |
| claim/proof | claimant self; eligible independent attesters | 10 challenges/hour/claim; proof tier/method/independence result, no code/evidence |
| contest | incumbent/challenger; Shard 24 assigned reviewer | three attempts/target/90d; 100% audit/trace |
| transfer | current full owner and recipient self | 5/hour; step-up, security notifications, 100% audit |

## Failure and Test Gate

- Delivery failure queues bounded retry; suppression/claim/new unrelated attester recalculates future schedule.
- Provider proof outage hides Tier A method and preserves Tier B/C; no false denial/full grant.
- Contest opens during proof/transfer: commit loses on version/state and performs no ownership change.
- Public unclaimed projection remains impossible even when matching, invitation or claim jobs fail.
- Tests cover shadow idempotency, 400ms timeout, minor suppression, invitation cadence/cap, six-digit challenge attempts/expiry, every Tier/independence combination, provisional denials, contest windows/freeze/reversal, transfer races, RLS/BOLA and telemetry redaction.

## Deepening and Ambiguity Gate

Seven mandatory passes converge: route consistency; claim/contest/transfer races; provider/delivery cascades; role/ownership completeness; logs/metrics/audit/spans; enumeration/collusion/rate abuse; and partial-state hygiene. Two implementers receive identical proof math, windows, endpoints, states and denials. Provider adapters are registered capabilities, not assumed dependencies.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Claim ownership contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/01b-party-identity-aliases|Person, facets, aliases, acting context and legal disclosure — Backend Specification]]
