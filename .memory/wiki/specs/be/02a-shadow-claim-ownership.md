# Shadow Claims & Ownership — Backend Specification

> **IA Source**: [Shard 02 — Profiles, claiming and qualifications](../ia/02-profiles-verification.md)
> **Deep Dives**: [Profiles, claiming and qualifications](../ia/deep-dives/02-profiles-verification.md)
> **Foundation**: [Shard 00 Backend](00-infrastructure.md)
> **Status**: Complete

## Split Group

> **Split origin**: `02-profiles-verification`
> **Companion specs**: [02b Profile, Portfolio & EPK](02b-profile-portfolio-epk.md), [02c Credentials & Trader](02c-credentials-trader.md)
> **Shared entities**: Shard 01 `Party` IDs, `RequestContext`, `AuditEvent`, `OutboxEvent`, and shared `JobStatus`
> **Operation count**: 16 registered HTTP operations and 2 protected non-HTTP commands

## Classification

- **Type**: multi-domain split, shadow/claim/ownership child specification.
- **Owned boundary**: PRF-01 through PRF-09: inert shadow context, advisory matching, invitation policy and dispatch, account-free suppression/correction, claim proof, provisional/full control, contests, transfer and reversal.
- **Canonical ownership**: this spec owns the seven Shard 02 records listed in § Database Schema and the control consequences of a valid proof or Shard 06 outcome. Shard 01 owns every referenced party, person, acting context, mandate and authority record.
- **Excluded boundary**: profile composition/portfolio/EPK (02b); credentials/trader classification (02c); party creation authority, Auth/session/account linking, aliases, mandates, legal identity and identifiers (Shard 01); dispute adjudication/evidence truth (Shard 06); source credits/rights, money, payout, escrow, and media bytes.
- **Source precedence**: the current parent IA, DEC-098, DEC-100, and Shard 06 contract supersede earlier adjudication wording in the deep dive. This spec calls Shard 06 only.

## IA Feature Coverage

The four bullets in IA Shard 02 `§ Features` (lines 24–29) are reconciled across the approved companion split. Each title is retained verbatim and has an operation or explicit bounded disposition.

| IA feature (exact source title) | Owning companion | Operation / command coverage | Disposition |
|---|---|---|---|
| **01.05 Profile Claiming & Ownership Verification** | 02a | PRF-01–PRF-09; PRF-API-01–16; `CreateShadowByReference`, `RecordOwnershipCaseOutcome` | Complete: shadow, proof, provisional/full control, contest, transfer, suppression, and correction are authored with no forced signup. |
| **01.06 Portfolio, Media Reel & EPK** | 02b | PRF-10–PRF-13; PRF-PROF-01–11; PRF-EPK-01–08 | Complete in companion 02b: fixed profile spine, provenance, rights-gated reel, live EPK, and accessible export are explicitly owned there. |
| **01.07 Professional, Union & Credential Verification** | 02c | PRF-14; QUAL-01–QUAL-10; QUAL-JOB-01 | Complete in companion 02c: issuer/method/evidence/expiry-aware qualification state, review, expiry, and revocation are authored. |
| **01.08 Trader vs Private Seller Classification** | 02c | PRF-15–PRF-16; TRD-01–TRD-09 | Complete in companion 02c: situational declaration, mismatch review, jurisdiction rule-pack disclosure, and fail-closed eligibility are authored. |

## Referenced Material Inventory

- [Shard 02 IA](../ia/02-profiles-verification.md): PRF-01–09, claim/contest rules, models, access, events, edge cases and cross-shard contracts.
- [Shard 02 deep dive](../ia/deep-dives/02-profiles-verification.md): field contracts, states, proof evaluation, reversibility, projection privacy, concurrency and release gates.
- [Shard 00 IA and BE](../ia/00-infrastructure.md): platform flows, route registry, strict contracts, four-field errors, middleware, idempotency, ETags, queues, audit and recovery; [00-infrastructure.md](00-infrastructure.md).
- [Shard 01 IA and BE01a–d](../ia/01-identity-authority.md): canonical party/person, Auth bootstrap, acting context, mandate, authority, aliases, identifiers and merge boundaries.
- [Shard 06 IA](../ia/06-trust-safety.md): ownership-case intake and protected `RecordOwnershipCaseOutcome` caller contract.
- [Architecture Design](../2026-08-02-architecture-design.md): REST, commands, authz, transactions, RLS, rate/CSRF, authentication, projections and SLOs.
- [Data Placement Strategy](../data-placement-strategy.md): PostgreSQL/Storage/Auth/Queue ownership, PII boundaries, lifecycle and cross-store consistency.
- [Engineering Standards](../ENGINEERING-STANDARDS.md): endpoint/RLS test floor, API/database budgets, security, recovery and migration gates.
- [Hono backend skill](../../../../.codex/skills/hono/SKILL.md): versioned Hono, middleware order, atomic PostgreSQL use cases, ID-only queue messages and `app.request()` tests.

## IA Source Map

| BE section | Normative source | Exact lines/section |
|---|---|---|
| Boundary and split | IA 02 | 1–29; 71–76 |
| Owned interactions | IA 02 | Acceptance Criteria 33–41; Interactions 50–62 |
| Proof and contest fields | IA 02 and deep dive | IA 78–91; deep dive 43–54, 69–105 |
| Models and access | IA 02 | 115–170 |
| Events and edge cases | IA 02 | 194–231 |
| Cross-shard direction and locked decisions | IA 02, Shard 06 and decisions ledger | IA 260–278; Shard 06 397–411; `decisions.md` DEC-098 1434–1465 and DEC-100 2821–2842 |
| REST/error/auth contract | Architecture and BE00 | Architecture 343–376, 576–624; BE00 46–65, 67–155 |
| Middleware/transaction/idempotency | BE00 | 255–345 |
| Event, retry, error and telemetry | BE00 | 355–460 |
| Placement and privacy | Data Placement | 5–55, 95–148 |
| Test/release floor | Standards | 27–44, 92–138, 149–190 |

Canonical IA-to-backend model mapping:

| Canonical IA model | Backend record |
|---|---|
| `ShadowPartyContext` | `profile_private.shadow_party_contexts` |
| `ShadowSuppression` | `profile_private.shadow_suppressions` |
| `InvitationDispatch` | `profile_private.invitation_dispatches` |
| `ClaimCase` | `profile_private.claim_cases` |
| `ClaimProofAttempt` | `profile_private.claim_proof_attempts` |
| `OwnershipContest` | `profile_private.ownership_contests` |
| `PartyOwnershipPeriod` | `profile_private.party_ownership_periods` |

## Endpoint Completeness Reconciliation

| IA requirement | Concrete operation(s) | Disposition |
|---|---|---|
| PRF-01 Create shadow by reference | Protected command `CreateShadowByReference` | Authored as non-HTTP ingress because DEC-100 requires bounded producer input and the source domain owns the original fact. |
| PRF-02 Match possible duplicate | `POST /api/v1/shadow-party-matches` | Authored; 400 ms advisory response, asynchronous continuation, no merge. |
| PRF-03 Dispatch invitation | `POST /api/v1/shadow-parties/{shadowId}/invitations` | Authored; policy commits first and provider delivery is an async job. |
| PRF-04 Account-free suppress/correct | `POST /api/v1/shadow-remedies` | Authored as one proof-bearing command; no bearer-link control and no public non-user registry. |
| PRF-05 Start/resume claim | `POST /api/v1/party-claims`, `GET /api/v1/party-claims/{claimId}` | Authored; pointer is non-authentication and claim remains resumable. |
| PRF-06 Complete claim proof | `POST /api/v1/party-claims/{claimId}/challenges`, `POST /api/v1/party-claims/{claimId}/proofs` | Authored; challenge issue and proof completion are separate auditable transitions. |
| PRF-07 Convert provisional claim | `POST /api/v1/party-claims/{claimId}/convert` | Authored; window/proof/contest gates are atomic. |
| PRF-08 Contest ownership | Contest create/read/evidence/withdraw routes | Authored; Shard 06 receives the event and owns adjudication. |
| PRF-09 Consensual transfer and reversal | Transfer offer/read/decision/reverse routes | Authored; transfer is represented by a transfer `ClaimCase`, avoiding an eighth domain record. |
| Shard 06 ownership outcome | Protected command `RecordOwnershipCaseOutcome` | Authored as internal command/RPC only; no public or browser route. |

No Shard 00 platform endpoint is duplicated. Job status remains `GET /api/v1/jobs/{jobId}`; provider ingress remains the registered platform webhook route. No public unclaimed-shadow profile endpoint is admitted.

### Authoring boundary

| Authored here | Non-endpoint contract |
|---|---|
| 16 HTTP route registrations, strict request/success/error schemas, auth predicates, version/idempotency, rate/cache/deadline/SLO cells, seven records, RLS/grants, workers, events and tests. | Shard 01 party factory and authority ports; provider proof adapters; notification delivery; Shard 06 case adjudication; source-domain producer ingress; platform Job/Outbox/Audit/Idempotency records. |
| Proof, contest, transfer and reversal state consequences, including protected and public disclosure projections. | No external provider, registry, legal rule pack, or Shard 06 evidence schema is assumed. Each must pass its owner’s setup and enablement gate. |

## Shared Contract Inheritance

Every route is a compile-time registry entry with method/path, operation ID, owner, request, success, error, auth, cache, timeout, rate, SLO, BOLA test and deprecation state. This explicitly inherits [BE00 Route Registry](00-infrastructure.md#route-registry) and [BE00 Route Archetypes](00-infrastructure.md#route-archetype-inheritance).

- REST JSON uses `/api/v1`. Runtime Zod 4 contracts generate TypeScript, OpenAPI and tests. Every object is strict; unknown keys, mass assignment, control characters, invalid UTF-8 and unsafe Unicode identifiers fail before authorization.
- All failures use exactly `ApiError { code, message, requestId, details }`; HTTP status remains on the status line. `details` is allowlisted, max 16 keys/four levels/8 KiB. No RFC 9457 top-level fields are added.
- Malformed JSON/path/header is 400 `INVALID_REQUEST`; unsupported media is 415; valid semantic input failure is 422 `VALIDATION_FAILED`; missing `If-Match` is 400, never 428; stale version is 409.
- Retryable commands require `Idempotency-Key` of 8–128 printable ASCII bytes. The key is hashed and bound to actor, operation, path, normalized body, target, expected version and contract major. Same request replays the committed outcome; different content is 409.
- Mutable resources use one exact strong quoted decimal `If-Match`, for example `"7"`. Weak tags, wildcard, lists, whitespace, leading zero, overflow or malformed quotes are 400.
- Authenticated responses are `Cache-Control: no-store`. Successful responses include `X-Request-Id`; failures include `X-Request-Id`, no-store, and rate headers when limited.
- Cookies require exact first-party origin and session-bound CSRF. Provider callbacks and internal commands never accept browser authority.
- PostgreSQL RPCs revalidate identity, acting context, target, version and idempotency. Provider calls, notification sends and object transfer occur outside the canonical transaction.
- Queue payloads carry IDs, event type/version and correlation/causation only. Consumers are at-least-once, leased, idempotent and DLQ-backed. Realtime is only an authorized ID/version hint.

## API Endpoints
### Route Registry
| ID | Method and path | Request | Auth and ownership | Success | Idempotency/concurrency | Rate/cache/deadline/SLO | Declared errors |
|---|---|---|---|---|---|---|---|
| PRF-API-01 | `POST /api/v1/shadow-party-matches` | `MatchRequest` | Verified session; creator acting party may match its own source reference; no arbitrary party lookup | 200 `MatchResponse` | Key required; source version binds request; no mutable target `If-Match` | 60/min/user, 120/min/party; no-store; 400 ms suggestion budget, 8 s hard deadline; Tier 1 | 400, 401, 403, 404, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-02 | `POST /api/v1/shadow-parties/{shadowId}/invitations` | `InvitationRequest` | Verified creator/acting party with source/contact capability; only target shadow | 202 `JobStatus` plus `Location` | Key and exact shadow `If-Match`; one schedule attempt per unique tuple | 60/min/user, 120/min/party plus creator budget; no-store; 15 s/2 s acceptance; Tier 2/D | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-03 | `POST /api/v1/shadow-remedies` | `RemedyRequest` | Anonymous; route/case proof is evaluated only inside command; no account required | 200 `RemedyResource` | Anonymous key binds pointer digest/action/proof class; suppression uniqueness and version serialize | 5/15 min/IP+pointer; no-store; 15 s; Tier 2 | 400, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-04 | `POST /api/v1/party-claims` | `ClaimCreateRequest` | Verified claimant; claimant person is server-derived; target party must be claimable | 201 `ClaimResource` | Key and target `If-Match`; unique active self claim/person/target | 60/min/user, 120/min/party; no-store; 15 s; Tier 2 | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-05 | `GET /api/v1/party-claims/{claimId}` | UUID path | Claimant, current owner, or minimum eligible attester projection; others concealed | 200 `ClaimResource`; ETag | Safe read; no key or `If-Match` | 300/min/user, 600/min/party; no-store; 8 s; Tier 1 | 400, 401, 404, 429, 503, 504, 500 |
| PRF-API-06 | `POST /api/v1/party-claims/{claimId}/challenges` | `ChallengeRequest` | Claimant or eligible attester for the specific claim; target state rechecked | 201 `ChallengeResource` | Key and claim `If-Match`; one live challenge per claim/method; code hash only | 10/hour/claim and 60/min/user; no-store; 15 s; Tier 2 | 400, 401, 403, 404, 409, 413, 415, 422, 429, 502, 503, 504, 500 |
| PRF-API-07 | `POST /api/v1/party-claims/{claimId}/proofs` | `ProofRequest` | Claimant/eligible attester; recent step-up for control grant; no self/mandated-self evidence | 200 `ClaimResource` | Key and claim `If-Match`; challenge CAS/burn; provider event dedupe | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 502, 503, 504, 500 |
| PRF-API-08 | `POST /api/v1/party-claims/{claimId}/convert` | `ConversionRequest` | Full claimant/current owner with recent step-up; no open contest | 200 `ClaimResource` | Key and claim `If-Match`; ownership-period CAS | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-09 | `POST /api/v1/ownership-contests` | `ContestCreateRequest` | Eligible challenger/incumbent; target and claims resolved server-side | 201 `ContestResource` | Key and target `If-Match`; one open contest/target/person | 10/min/user, three attempts/target/90 days; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-10 | `GET /api/v1/ownership-contests/{contestId}` | UUID path | Contest participant and minimum Shard 06 handoff projection; others concealed | 200 `ContestResource`; ETag | Safe read; no key or `If-Match` | 300/min/user, 600/min/party; no-store; 8 s; Tier 1 | 400, 401, 404, 429, 503, 504, 500 |
| PRF-API-11 | `POST /api/v1/ownership-contests/{contestId}/evidence` | `ContestEvidenceRequest` | Contest party only; evidence references are not returned to the opposite party | 200 `ContestResource` | Key and contest `If-Match`; append-only evidence attempt; state CAS | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-12 | `POST /api/v1/ownership-contests/{contestId}/withdraw` | `WithdrawRequest` | Contestant or incumbent for own side; Shard 06 cannot use this route | 200 `ContestResource` | Key and contest `If-Match`; terminal-state CAS | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-13 | `POST /api/v1/party-ownership-transfers` | `TransferOfferRequest` | Current full owner/mandate; recipient is named, not impersonated | 201 `TransferResource` | Key and target `If-Match`; transfer ClaimCase uniqueness | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-14 | `GET /api/v1/party-ownership-transfers/{transferId}` | UUID path | Current/previous owner or named recipient; concealed to others | 200 `TransferResource`; ETag | Safe read; no key or `If-Match` | 300/min/user, 600/min/party; no-store; 8 s; Tier 1 | 400, 401, 404, 429, 503, 504, 500 |
| PRF-API-15 | `POST /api/v1/party-ownership-transfers/{transferId}/decision` | `TransferDecisionRequest` | Named recipient only; fresh step-up before acceptance | 200 `TransferResource` | Key and transfer `If-Match`; acceptance CAS against ownership version | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-API-16 | `POST /api/v1/party-ownership-transfers/{transferId}/reverse` | `ReverseRequest` | Current owner or named capability operator; recent step-up and reason | 200 `OwnershipResource` | Key and transfer/period `If-Match`; compensating period CAS | 10/min/user; no-store; 15 s; Tier 2/high-risk | 400, 401, 403, 404, 409, 413, 415, 422, 429, 503, 504, 500 |
The registry ID is the OpenAPI `operationId`; every row also inherits BE00 deprecation, BOLA, owner and security-event fields.

### Protected command registry

These are signed, least-privilege service commands, not browser routes. They use the same strict `ApiError`, idempotency digest, version CAS, audit and outbox transaction rules.

| ID / command | Input → success | Caller and concurrency | Errors; rate and observability |
|---|---|---|---|
| CMD-01 `CreateShadowByReference` | `CreateShadowByReferenceRequest` → 201/200 `ShadowResource` | Registered producer/creator capability; source tuple + key; creation is never blocked by end-user quota | 400/403/409/502/503/504/500; producer edge budget; source-capture audit, trace and metric |
| CMD-02 `RecordOwnershipCaseOutcome` | `RecordOwnershipCaseOutcomeRequest` → 200 `OutcomeReceipt` | Shard 06 caller only; case/contest expected version + key; protected ingress | 400/401/403/404/409/502/503/504/500; service budget; 100% outcome audit/trace, no payload logging |
### Endpoint Contract Examples
| Operation | Valid request example | Success example |
|---|---|---|
| PRF-API-01 | `{ "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "sourceDomain":"projects", "sourceEntityId":"work-812", "sourceVersion":"3", "roleCode":"performer" }` | `{ "suggestions":[], "timedOut":false, "continuing":false }` |
| PRF-API-02 | `{ "contactRouteId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d5", "trigger":"initial" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d6", "state":"queued", "attemptNo":1, "jobId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d7", "version":"1" }` |
| PRF-API-03 | `{ "pointerToken":"rM8p2V6q9Yw4aBcDeFgHiJkLmNoPqRsTuVwXyZ1AbCd", "action":"suppress", "scope":"both", "proof":{ "kind":"route_code", "code":"482901" } }` | `{ "accepted":true, "action":"suppress", "scope":"both", "state":"active", "version":"1" }` |
| PRF-API-04 | `{ "targetPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "claimKind":"self" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8", "state":"started", "controlLevel":"none", "windowEndsAt":null, "version":"1" }` |
| PRF-API-05 | Path `claimId=018f0c45-73fe-7dc2-9c09-68f7ecf132d8` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8", "state":"proving", "controlLevel":"none", "windowEndsAt":null, "eligibleMethods":["domain_challenge"], "version":"2" }` |
| PRF-API-06 | `{ "method":"attester_route", "attesterPersonId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d9" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132da", "method":"attester_route", "expiresAt":"2026-08-28T19:00:00Z", "attemptsRemaining":5 }` |
| PRF-API-07 | `{ "kind":"challenge_code", "challengeId":"018f0c45-73fe-7dc2-9c09-68f7ecf132da", "code":"482901", "reasonCode":"claim_proof" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8", "state":"provisional", "controlLevel":"provisional", "windowEndsAt":"2026-09-11T19:00:00Z", "version":"3" }` |
| PRF-API-08 | `{ "reasonCode":"claim_conversion" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132d8", "state":"full", "controlLevel":"full", "windowEndsAt":null, "version":"4" }` |
| PRF-API-09 | `{ "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "challengerClaimId":"018f0c45-73fe-7dc2-9c09-68f7ecf132db", "reasonCode":"ownership_contest" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "state":"open", "responseDueAt":"2026-09-11T19:00:00Z", "resolution":null, "version":"1" }` |
| PRF-API-10 | Path `contestId=018f0c45-73fe-7dc2-9c09-68f7ecf132dc` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "state":"open", "responseDueAt":"2026-09-11T19:00:00Z", "resolution":null, "version":"1" }` |
| PRF-API-11 | `{ "tier":"B", "method":"attester_route", "evidenceRef":"018f0c45-73fe-7dc2-9c09-68f7ecf132dd", "attesterPersonIds":["018f0c45-73fe-7dc2-9c09-68f7ecf132de"], "reasonCode":"contest_evidence" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "state":"open", "responseDueAt":"2026-09-11T19:00:00Z", "resolution":null, "version":"2" }` |
| PRF-API-12 | `{ "reasonCode":"contest_withdrawal" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "state":"withdrawn", "responseDueAt":"2026-09-11T19:00:00Z", "resolution":null, "version":"3" }` |
| PRF-API-13 | `{ "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "recipientPersonId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df", "reasonCode":"ownership_transfer" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132e0", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "recipientPersonId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df", "state":"pending", "reversalEndsAt":null, "version":"1" }` |
| PRF-API-14 | Path `transferId=018f0c45-73fe-7dc2-9c09-68f7ecf132e0` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132e0", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "state":"pending", "recipientPersonId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df", "reversalEndsAt":null, "version":"1" }` |
| PRF-API-15 | `{ "decision":"accept", "reasonCode":"transfer_acceptance" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132e0", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "recipientPersonId":"018f0c45-73fe-7dc2-9c09-68f7ecf132df", "state":"accepted", "reversalEndsAt":"2026-09-27T19:00:00Z", "version":"2" }` |
| PRF-API-16 | `{ "reasonCode":"ownership_correction" }` | `{ "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "controlLevel":"full", "basis":"prior_period_restored", "version":"5" }` |
| CMD-01 | `{ "sourceDomain":"projects", "sourceEntityId":"work-812", "sourceVersion":"3", "creatorPersonId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d9", "actingPartyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "roleCode":"performer", "idempotencyKey":"shadow-create-20260828" }` | `{ "id":"018f0c45-73fe-7dc2-9c09-68f7ecf132e2", "partyId":"018f0c45-73fe-7dc2-9c09-68f7ecf132d4", "state":"created", "sourceDomain":"projects", "sourceEntityId":"work-812", "roleCode":"performer", "instrumentCode":null, "version":"1" }`; replay is identical |
| CMD-02 | `{ "callerShard":"06", "caseId":"018f0c45-73fe-7dc2-9c09-68f7ecf132e1", "contestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "outcomeCode":"uphold", "expectedVersion":"7", "idempotencyKey":"case-outcome-20260828" }` | `{ "contestId":"018f0c45-73fe-7dc2-9c09-68f7ecf132dc", "state":"resolved", "action":"unfreeze", "version":"8", "replayed":false }` |
## Request/Response Contracts

The following schemas are the contract shape. Named registry values are loaded from protected versioned registries and may only narrow by release. `JsonValue`, `FieldViolation`, `ApiError`, `JobStatus`, cursor grammar and decimal version grammar inherit BE00 exactly.

~~~ts
const UUID = z.uuid();
const Version = z.string().regex(/^[1-9][0-9]{0,18}$/).refine(v => BigInt(v) <= 9223372036854775807n);
const IdempotencyKey = z.string().min(8).max(128).regex(/^[ -~]+$/).refine(v => v.trim().length > 0);
const RegistryCode = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_.-]*$/);
const SourceEntityId = z.string().trim().min(1).max(128).refine(v => !/[\u0000-\u001F\u007F]/u.test(v));
const OpaqueToken = z.string().min(43).max(2048).regex(/^[A-Za-z0-9._~-]+$/);
const SixDigitCode = z.string().regex(/^[0-9]{6}$/);
const EmptyBody = z.object({}).strict();
const ReasonCode = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_.-]*$/);

const MatchRequest = z.object({
  partyId: UUID, sourceDomain: RegistryCode, sourceEntityId: SourceEntityId,
  sourceVersion: Version, roleCode: RegistryCode.optional(),
  instrumentCode: RegistryCode.optional(),
}).strict().refine(v => Boolean(v.roleCode || v.instrumentCode), { path: ["roleCode"], message: "role_or_instrument_required" });

const InvitationRequest = z.object({
  contactRouteId: UUID,
  trigger: z.enum(["initial", "schedule", "new_attester"]),
  attesterPersonId: UUID.optional(),
}).strict().refine(v => v.trigger !== "new_attester" || Boolean(v.attesterPersonId), { path: ["attesterPersonId"], message: "required_for_new_attester" });

const RemedyProof = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("route_code"), code: SixDigitCode }).strict(),
  z.object({ kind: z.literal("case_reference"), caseId: UUID, evidenceToken: OpaqueToken }).strict(),
]);
const RemedyRequest = z.object({
  pointerToken: OpaqueToken,
  action: z.enum(["suppress", "correct"]),
  scope: z.enum(["outreach", "publication", "both"]),
  proof: RemedyProof,
}).strict();

const ClaimCreateRequest = z.object({
  targetPartyId: UUID,
  claimKind: z.enum(["self", "representation", "transfer"]),
}).strict();

const ChallengeRequest = z.object({
  method: z.enum(["domain_challenge", "business_oauth", "dsp_oauth", "postal", "business_phone", "attester_route"]),
  routeId: UUID.optional(),
  attesterPersonId: UUID.optional(),
}).strict().refine(v => v.method === "attester_route" ? Boolean(v.attesterPersonId) : (["domain_challenge", "postal", "business_phone"].includes(v.method) ? Boolean(v.routeId) : true), { path: ["routeId"], message: "method_reference_required" });

const ProofRequest = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("challenge_code"), challengeId: UUID, code: SixDigitCode, reasonCode: ReasonCode }).strict(),
  z.object({ kind: z.literal("provider_assertion"), challengeId: UUID, providerEventId: SourceEntityId, reasonCode: ReasonCode }).strict(),
  z.object({
    kind: z.literal("attestation"), tier: z.enum(["B", "C"]), evidenceRef: UUID,
    attesterPersonIds: z.array(UUID).min(1).max(8), reasonCode: ReasonCode,
  }).strict(),
]);
const CreateShadowByReferenceRequest = z.object({
  sourceDomain: RegistryCode, sourceEntityId: SourceEntityId, sourceVersion: Version,
  creatorPersonId: UUID, actingPartyId: UUID, roleCode: RegistryCode.optional(),
  instrumentCode: RegistryCode.optional(), contactRouteId: UUID.optional(), idempotencyKey: IdempotencyKey,
}).strict().refine(v => Boolean(v.roleCode || v.instrumentCode), { path: ["roleCode"], message: "role_or_instrument_required" });
const RecordOwnershipCaseOutcomeRequest = z.object({
  callerShard: z.literal("06"), caseId: UUID, contestId: UUID, outcomeCode: RegistryCode,
  expectedVersion: Version, idempotencyKey: IdempotencyKey,
}).strict();
const OutcomeReceipt = z.object({
  contestId: UUID, state: z.enum(["resolved", "frozen"]), action: RegistryCode,
  version: Version, replayed: z.boolean(),
}).strict();
const ConversionRequest = z.object({ reasonCode: ReasonCode }).strict();
const ContestCreateRequest = z.object({
  partyId: UUID, challengerClaimId: UUID, reasonCode: ReasonCode,
}).strict();
const ContestEvidenceRequest = z.object({
  tier: z.enum(["A", "B", "C"]), method: RegistryCode,
  evidenceRef: UUID, attesterPersonIds: z.array(UUID).max(8).default([]), reasonCode: ReasonCode,
}).strict();
const TransferOfferRequest = z.object({
  partyId: UUID, recipientPersonId: UUID, reasonCode: ReasonCode,
}).strict();
const TransferDecisionRequest = z.object({
  decision: z.enum(["accept", "decline"]), reasonCode: ReasonCode,
}).strict();
const WithdrawRequest = z.object({ reasonCode: ReasonCode }).strict();
const ReverseRequest = z.object({ reasonCode: ReasonCode }).strict();

const MatchResponse = z.object({
  suggestions: z.array(z.object({
    partyId: UUID, scoreBand: z.enum(["possible", "likely"]), basisClass: RegistryCode,
  }).strict()).max(20),
  timedOut: z.boolean(), continuing: z.boolean(),
}).strict();
const ShadowResource = z.object({
  id: UUID, partyId: UUID, state: z.enum(["created", "invited", "suppressed", "claimed", "merged"]),
  sourceDomain: RegistryCode, sourceEntityId: SourceEntityId,
  roleCode: RegistryCode.nullable(), instrumentCode: RegistryCode.nullable(), version: Version,
}).strict();
const InvitationResource = z.object({
  id: UUID, state: z.enum(["queued", "sent", "failed_retryable", "stopped"]),
  attemptNo: z.number().int().min(1).max(6), jobId: UUID.nullable(), version: Version,
}).strict();
const RemedyResource = z.object({
  accepted: z.literal(true), action: z.enum(["suppress", "correct"]),
  scope: z.enum(["outreach", "publication", "both"]),
  state: z.enum(["active", "revoked"]), version: Version,
}).strict();
const ClaimResource = z.object({
  id: UUID, state: z.enum(["started", "proving", "provisional", "full", "stalled", "withheld", "contested", "revoked"]),
  targetPartyId: UUID, controlLevel: z.enum(["none", "provisional", "full"]),
  windowEndsAt: z.string().datetime({ offset: true }).nullable(),
  eligibleMethods: z.array(RegistryCode).max(8).optional(),
  version: Version,
}).strict();
const ChallengeResource = z.object({
  id: UUID, method: RegistryCode, expiresAt: z.string().datetime({ offset: true }),
  attemptsRemaining: z.number().int().min(0).max(5),
}).strict();
const ContestResource = z.object({
  id: UUID, partyId: UUID, state: z.enum(["open", "frozen", "resolved", "withdrawn"]),
  responseDueAt: z.string().datetime({ offset: true }), resolution: RegistryCode.nullable(),
  version: Version,
}).strict();
const TransferResource = z.object({
  id: UUID, partyId: UUID, recipientPersonId: UUID, state: z.enum(["pending", "accepted", "declined", "expired", "blocked"]),
  reversalEndsAt: z.string().datetime({ offset: true }).nullable(), version: Version,
}).strict();
const OwnershipResource = z.object({
  partyId: UUID, controlLevel: z.enum(["provisional", "full"]), basis: RegistryCode, version: Version,
}).strict();

const JsonValueSchema = z.lazy(() => z.union([
  z.null(), z.boolean(), z.number().finite(), z.string(),
  z.array(JsonValueSchema), z.record(z.string(), JsonValueSchema),
]));

const ApiError = z.object({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: UUID,
  details: z.record(z.string(), JsonValueSchema),
}).strict();
~~~
No challenge hash, route identifier, attester identity, case evidence, legal identity, contact address or provider payload appears in a response. `maskedDestination` is deliberately omitted; method availability is sufficient.

### Field Validation Matrix
| Scope | Field/header | Constraint | Failure |
|---|---|---|---|
| All requests | Content-Type/body | JSON; body ≤256 KiB; strict object; no control/invalid UTF-8 | 400 `INVALID_REQUEST`, 413 `PAYLOAD_TOO_LARGE`, 415 `UNSUPPORTED_MEDIA_TYPE` |
| All requests | `X-Request-Id` | UUID or server replacement; never authority | 400 only when unrecoverably malformed |
| Retryable commands | `Idempotency-Key` | 8–128 printable ASCII bytes, byte exact, hashed only | 400 `INVALID_REQUEST`; 409 `CONFLICT/IDEMPOTENCY_MISMATCH` |
| Mutable commands | `If-Match` | One strong quoted positive decimal, no weak/wildcard/list/leading zero/overflow | 400 `INVALID_REQUEST`; stale 409 `CONFLICT/VERSION_MISMATCH` |
| High-risk commands | `reasonCode` | Lowercase registered reason, 1–64 chars; required for proof, conversion, contest, transfer and reversal mutations | 422 `reason_invalid` |
| PRF-API-01 | `partyId` | UUID; caller-owned source context after shape validation | 422 `party_id_invalid`; safe 404/403 |
| PRF-API-01 | `sourceDomain` | Lowercase registered producer domain; 1–64 chars | 422 `source_domain_invalid` |
| PRF-API-01 | `sourceEntityId` | NFC, trimmed, 1–128; controls rejected | 422 `source_entity_invalid` |
| PRF-API-01 | `sourceVersion` | Positive bigint decimal | 422 `version_invalid` |
| PRF-API-01/CMD-01 | role/instrument code | Registered structured code; at least one is required; no free-text identity | 422 `registry_code_invalid`/`role_or_instrument_required` |
| PRF-API-02 | path `shadowId` | UUID; lookup only after structural validation | 400 malformed; concealed 404 |
| PRF-API-02 | `contactRouteId` | UUID; route belongs to source context and is not suppressed | 422 `route_invalid`; 409 transition |
| PRF-API-02 | `trigger` | `initial`, `schedule` or `new_attester`; new attester requires person ID | 422 `trigger_invalid` |
| PRF-API-02 | `attesterPersonId` | UUID; independent eligible human; only for new attester | 422 `attester_invalid`; 409 `CONFLICT/INVALID_TRANSITION` |
| PRF-API-03 | `pointerToken` | Opaque 128-bit-or-greater token; not a session or authority | 422 `pointer_invalid`; safe 404 |
| PRF-API-03 | `action/scope` | Closed enums; scope cannot exceed remedy policy; `correct` retains a protected remedy reference | 422 `action_invalid`/`scope_invalid` |
| PRF-API-03 | route proof | Exactly six digits; one use; max five attempts; 15-minute expiry | 422 `proof_format_invalid`; 409 invalid/expired/overattempted |
| PRF-API-03 | case proof | UUID case plus opaque evidence token; Shard 06 evidence policy checks it | 422 `case_reference_invalid`; 403/409 safe refusal |
| PRF-API-04 | `targetPartyId` | UUID; party kind/lifecycle/suppression checked after validation | 422 `target_invalid`; concealed 404 |
| PRF-API-04 | `claimKind` | Closed `self`, `representation`, `transfer`; claimant is server-derived | 422 `claim_kind_invalid` |
| PRF-API-05/06/07/08 | path `claimId` | UUID; claim participant lookup after shape validation | 400 malformed; concealed 404 |
| PRF-API-06 | `method` | Healthy configured Tier A/B/C method only; unavailable methods are not exposed | 422 `method_invalid`; 409 `CONFLICT/INVALID_TRANSITION` |
| PRF-API-06 | route/attester reference | UUID required for route/attester methods; no raw destination | 422 `method_reference_invalid` |
| PRF-API-07 | challenge proof | Challenge UUID plus six-digit code; challenge bound to claim and actor | 422 format; 409 invalid/expired/attempts |
| PRF-API-07 | provider proof | Challenge UUID plus non-empty provider event reference; raw response prohibited | 422 `provider_event_invalid`; 502/503/504 |
| PRF-API-07 | attestation proof | Tier B/C, UUID evidence, 1–8 attesters; claimant equivalence and independence rechecked | 422 `attestation_invalid`; 409 `CONFLICT/INVALID_TRANSITION` |
| PRF-API-09 | `partyId/challengerClaimId` | UUIDs; claim must target party and be eligible | 422 `contest_reference_invalid`; safe 404/403 |
| PRF-API-10/11/12 | path `contestId` | UUID; participant/handoff visibility after validation | 400 malformed; concealed 404 |
| PRF-API-11 | evidence fields | Tier A/B/C, registered method, UUID evidence, max 8 attesters | 422 `evidence_invalid`; 409 state/version |
| PRF-API-13 | `partyId/recipientPersonId` | UUIDs; owner full, recipient distinct active person, no live contest | 422 `transfer_reference_invalid`; 409 state/version |
| PRF-API-14/15/16 | path `transferId` | UUID; transfer ClaimCase participant/capability check | 400 malformed; concealed 404 |
| PRF-API-15 | `decision` | Closed `accept`/`decline`; only named recipient may accept | 422 `decision_invalid`; 403/409 |

## Error Handling
All endpoint error responses use the same strict four-field envelope. The following details are the complete allowlist.

| Top-level code/status | Exact details |
|---|---|
| `INVALID_REQUEST` 400 | `{ violations?: FieldViolation[] }`; malformed JSON/header may use `{}`. |
| `UNAUTHENTICATED` 401 | `{ recoveryAction: "reauthenticate" }`. |
| `STEP_UP_REQUIRED` 401 | `{ recoveryAction: "step_up", allowedMethods: string[] }`; no factor detail. |
| `FORBIDDEN` 403 | `{ reasonCode: string, recoveryAction?: string }`; no policy predicate or existence. |
| `NOT_FOUND` 404 | `{}`, except explicitly safe public projection; all private BOLA denials collapse here. |
| `CONFLICT` 409 | `{ conflict: "VERSION_MISMATCH"\|"IDEMPOTENCY_MISMATCH"\|"INVALID_TRANSITION", expectedVersion?: string, currentVersion?: string, recoveryAction: string }`. |
| `PAYLOAD_TOO_LARGE` 413 | `{ maxBytes: number }` only when safe. |
| `UNSUPPORTED_MEDIA_TYPE` 415 | `{ allowedMediaTypes: ["application/json"] }`. |
| `VALIDATION_FAILED` 422 | `{ violations: FieldViolation[] }`; one row per field × constraint. |
| `RATE_LIMITED` 429 | `{ retryAfterSeconds: number, limit: number, resetAt: string }`; matches headers. |
| `DEPENDENCY_UNAVAILABLE` 502/503/504 | `{ dependencyClass: string, retryable: true, retryAfterSeconds?: number }`; no provider name/payload. |
| `INTERNAL_ERROR` 500 | `{}` only. |

Domain conditions use `CONFLICT` with `INVALID_TRANSITION` and a safe `recoveryAction`: `shadow_suppressed`, `invitation_limit`, `claim_already_active`, `target_frozen`, `challenge_expired`, `attempts_exceeded`, `attester_not_independent`, `contest_open`, `contest_limit`, `window_active`, `transfer_pending`, `transfer_expired`, `reversal_window_closed`, or `case_outcome_stale`. These values never disclose an absent target or opposing evidence.

### Endpoint Error Matrix

| Operation | 400/401/403/404 | 409 | 413/415/422 | 429 | 5xx |
|---|---|---|---|---|---|
| PRF-API-01 | request, auth, source capability, concealed source | idempotency only | body/media/field validation | user/party limit | 503/504/500 |
| PRF-API-02 | request, auth, route capability, concealed shadow | version, suppressed, limit, invalid state, idempotency | body/media/field validation | user/party/creator budget | 503/504/500 |
| PRF-API-03 | request, safe missing pointer | invalid/expired proof or already suppressed | body/media/field validation | IP/pointer limit | 503/504/500 |
| PRF-API-04 | request, auth, target policy, concealed target | version, active claim, frozen/suppressed/merged, idempotency | body/media/field validation | user/party limit | 503/504/500 |
| PRF-API-05 | request, auth, concealed claim | none | none | user/party limit | 503/504/500 |
| PRF-API-06 | request, auth, claim capability/concealment | version, method unavailable, state, idempotency | body/media/field validation | claim/user limit | 502/503/504/500 |
| PRF-API-07 | request, auth/step-up, evidence capability/concealment | version, challenge, independence, contest, state, idempotency | body/media/field validation | user/claim limit | 502/503/504/500 |
| PRF-API-08 | request, auth/step-up, claim concealment | version, window, contest, proof, state, idempotency | body/media/field validation | user limit | 503/504/500 |
| PRF-API-09 | request, auth, contest eligibility/concealment | version, open contest, three/90-day limit, state, idempotency | body/media/field validation | user/target limit | 503/504/500 |
| PRF-API-10 | request, auth, concealed contest | none | none | user/party limit | 503/504/500 |
| PRF-API-11 | request, auth, contest capability/concealment | version, state, evidence, idempotency | body/media/field validation | user/contest limit | 503/504/500 |
| PRF-API-12 | request, auth, contest capability/concealment | version, terminal state, idempotency | body/media/field validation | user/contest limit | 503/504/500 |
| PRF-API-13 | request, auth/step-up, target concealment | version, contest, transfer pending, invalid state, idempotency | body/media/field validation | user/target limit | 503/504/500 |
| PRF-API-14 | request, auth, concealed transfer | none | none | user/party limit | 503/504/500 |
| PRF-API-15 | request, auth/step-up, recipient concealment | version, expired/declined/contest, idempotency | body/media/field validation | user/transfer limit | 503/504/500 |
| PRF-API-16 | request, auth/step-up/capability, transfer concealment | version, reversal window, terminal state, idempotency | body/media/field validation | user/transfer limit | 503/504/500 |

### Per-endpoint observability cells

Every cell emits the BE00 scrubbed request/trace/correlation IDs, duration, outcome and dependency class; audit is immutable for commands and reads never log protected payloads.

| ID | Audit event | Metric/trace label and redaction |
|---|---|---|
| PRF-API-01 | `shadow.match.requested` | `profile_match`; source class/count only |
| PRF-API-02 | `shadow.invitation.requested` | `profile_invitation`; route/provider class only |
| PRF-API-03 | `shadow.remedy.submitted` | `profile_remedy`; proof outcome, no pointer/code |
| PRF-API-04 | `claim.started` | `profile_claim_start`; target class, no identity |
| PRF-API-05 | `claim.read` | `profile_claim_read`; visibility decision only |
| PRF-API-06 | `claim.challenge.issued` | `profile_challenge`; method class, no hash/destination |
| PRF-API-07 | `claim.proof.evaluated` | `profile_proof`; tier/method/outcome only |
| PRF-API-08 | `claim.converted` | `profile_conversion`; basis/window class only |
| PRF-API-09 | `ownership.contest.opened` | `profile_contest`; target class and quota result |
| PRF-API-10 | `ownership.contest.read` | `profile_contest_read`; participant visibility only |
| PRF-API-11 | `ownership.contest.evidence_added` | `profile_contest_evidence`; evidence class only |
| PRF-API-12 | `ownership.contest.withdrawn` | `profile_contest_withdraw`; actor class/reason code |
| PRF-API-13 | `ownership.transfer.offered` | `profile_transfer`; owner/recipient classes only |
| PRF-API-14 | `ownership.transfer.read` | `profile_transfer_read`; participant visibility only |
| PRF-API-15 | `ownership.transfer.decided` | `profile_transfer_decision`; decision/reason class |
| PRF-API-16 | `ownership.transfer.reversed` | `profile_transfer_reversal`; period/version only |
| CMD-01/02 | `shadow.created` / `ownership.outcome.recorded` | `profile_protected_command`; caller/outcome class, no source/evidence payload |

Example 409:

~~~json
{
  "code": "CONFLICT",
  "message": "The ownership state changed. Refresh and retry.",
  "requestId": "018f0c45-73fe-7dc2-9c09-68f7ecf132d4",
  "details": {
    "conflict": "VERSION_MISMATCH",
    "expectedVersion": "7",
    "currentVersion": "8",
    "recoveryAction": "refetch_and_retry"
  }
}
~~~

Example 422:

~~~json
{
  "code": "VALIDATION_FAILED",
  "message": "Check the highlighted fields.",
  "requestId": "018f0c45-73fe-7dc2-9c09-68f7ecf132d4",
  "details": {
    "violations": [
      { "path": "/proof/code", "code": "six_digit_code", "message": "Enter six digits." }
    ]
  }
}
~~~

## Database Schema

### Canonical boundary

All seven domain records live in non-exposed `profile_private`. Browser roles receive no table grants. Hono uses narrowly granted invoker RPCs and security-invoker views in an allowlisted API schema. Shard 01 party/person/authority tables are referenced through its exported contract and never read directly by this shard. `anon` has no private grants. Any security-definer function has an empty fixed `search_path`, fully qualified names, revoked `PUBLIC` execution, named grants, and positive/negative authorization tests. Every record carries the IA-required common core (`id uuid`, non-null server-derived `owner_id uuid`, closed `state` enum, positive `version bigint`, `created_at timestamptz`, `updated_at timestamptz`); each row below states the exact aggregate-to-owner mapping.

### Table and state definitions

| Record | Required fields and constraints | State/immutability |
|---|---|---|
| `profile_private.shadow_party_contexts` | `id uuid PK`; `owner_id uuid NOT NULL` = `party_id` (the represented target party); `party_id uuid NOT NULL`; creator person/acting-party UUIDs; `source_domain` registered lowercase code; `source_entity_id` bounded NFC text; optional role/instrument/contact route UUIDs; `state closed enum (created, invited, suppressed, claimed, merged)`; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`; unique `(source_domain, source_entity_id, party_id)`. | `created → invited/suppressed/claimed/merged`; context and source reference are immutable; shadow never becomes an agent. |
| `profile_private.shadow_suppressions` | `id uuid PK`; `owner_id uuid NOT NULL` = protected `shadow_party_contexts.id` resolved by the pointer (the suppression aggregate; `party_id` remains nullable for route-only remedies); nullable party UUID; `route_fingerprint bytea CHECK octet_length=32`; `remedy_action suppress/correct`; `scope outreach/publication/both`; `state closed enum (active, revoked)`; protected case/evidence UUID refs; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`; partial unique active lookup by party/route/scope. | Protected lookup only; never a public name registry. Revocation is compensating and retains evidence. |
| `profile_private.invitation_dispatches` | `id uuid PK`; `owner_id uuid NOT NULL` = `shadow_id` (`shadow_party_contexts.id`, the invitation's shadow aggregate); shadow/route UUIDs; `attempt_no integer 1..6`; trigger enum; `state closed enum (queued, sent, failed_retryable, stopped)`; schedule/send timestamps; provider reference digest/ref; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`. Unique `(shadow_id, route_id, attempt_no)`. | `queued → sent/failed_retryable/stopped`; no send after suppression, claim, not-you or cap. |
| `profile_private.claim_cases` | `id uuid PK`; `owner_id uuid NOT NULL` = `target_party_id` (the party whose control is claimed); target party and claimant person UUIDs; `claim_kind self/representation/transfer`; optional recipient person UUID for transfer; `state closed enum (started, proving, provisional, full, stalled, withheld, contested, revoked)`; `control_level none/provisional/full`; proof/window timestamps; transfer decision/expiry where applicable; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`. Partial unique active self claim `(target_party_id, claimant_person_id)`. | Claim states from deep dive; proof/ownership history append-only. Transfer offer is a transfer ClaimCase, not a new domain entity. |
| `profile_private.claim_proof_attempts` | `id uuid PK`; `owner_id uuid NOT NULL` = parent `claim_cases.target_party_id` (the target party, never the attester); `claim_id uuid NOT NULL`; tier A/B/C; registered method; nullable `challenge_hash bytea32`; evidence ref; bounded attester UUID array; independence result; `state closed enum (pending, accepted, rejected, expired, superseded)`; attempts used 0..5; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`; `expires_at timestamptz` nullable. | `pending → accepted/rejected/expired/superseded`; hash and evidence refs immutable; successful/expired/overattempted challenge burns. |
| `profile_private.ownership_contests` | `id uuid PK`; `owner_id uuid NOT NULL` = `party_id` (the target party whose ownership is contested); `party_id uuid NOT NULL`; incumbent/challenger claim UUIDs; `state closed enum (open, frozen, resolved, withdrawn)`; `response_due_at`; resolution basis/winner; Shard 06 `case_id`; reversal end; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`. One open contest per target/person and three-attempt counter per rolling 90 days. | `open → resolved/frozen/withdrawn`; frozen resolves only from policy/Shard 06 command; no local adjudication. |
| `profile_private.party_ownership_periods` | `id uuid PK`; `owner_id uuid NOT NULL` = `party_id` (the subject party/period aggregate, not the current `owner_person_id`); `party_id uuid NOT NULL`; owner person UUID; basis claim/transfer and basis UUID; starts/ends; `control_level provisional/full`; `state closed enum (active, ended, superseded, reversed)`; case refs; `version bigint >0`; `created_at timestamptz`; `updated_at timestamptz`. Exclusion/transaction rule forbids overlapping live control periods. | Periods are immutable historical evidence; correction/reversal inserts compensating period and ends the superseded period. |

No table stores raw challenge codes, contact addresses, provider payloads, legal identity, private evidence bytes or payment data. The platform `IdempotencyRecord`, `OutboxEvent`, `Job`, `ProviderOperation` and `AuditEvent` are inherited and not duplicated.

### Index inventory

| Table | Required indexes | Purpose |
|---|---|---|
| shadow contexts | unique source tuple; `(party_id,state,updated_at)`; `(creator_person_id,created_at)` | idempotent reuse, owner reads, source capture |
| suppressions | partial active `(party_id,route_fingerprint,scope)` with nulls normalized; `(route_fingerprint,state)`; `(case_id)` | protected remedy lookup and revocation |
| invitations | unique shadow/route/attempt; `(state,scheduled_at)`; `(shadow_id,created_at desc)` | cap, scheduler and audit |
| claims | partial active self uniqueness; `(claimant_person_id,state)`; `(target_party_id,state,version)`; `(recipient_person_id,state)` | claim status, races, transfer recipient |
| proof attempts | `(claim_id,created_at desc)`; partial live challenge; `(state,expires_at)`; `(evidence_ref)` | one-use challenge, expiry and review |
| contests | partial open target/person uniqueness; `(party_id,state)`; `(response_due_at,state)`; `(case_id)` | contest cap, deadline and handoff |
| ownership periods | `(party_id,starts_at desc)`; `(owner_person_id,starts_at desc)`; basis lookup; GiST live-period exclusion support | current owner and compensating history |

### RLS and grant matrix

| Principal | Allowed | Explicit denial |
|---|---|---|
| Anonymous | Submit proof-bearing remedy; no private read; public claim pointer only through safe entry | Shadow existence, contact route, party name, claim/evidence/attester identity |
| Claimant | Own claim status, healthy method list, own proof submission and permitted contest/transfer role | Another claimant’s evidence, raw challenge, opposing attester, legal/private data |
| Current full owner/mandate | Own target claim/contest/transfer projections and eligible ownership commands | Attested evidence, Shard 06 adjudication, another party’s private data |
| Provisional owner | Reversible asserted operation and own claim status | Transfer, payout, signing, rights, durable obligations, private export or authority grants |
| Eligible attester | Specific response route and minimum claim notice | Self-attestation, other attesters, claimant evidence or legal identity |
| Shard 06 service | Call `RecordOwnershipCaseOutcome` through named protected RPC | Read/write Shard 02 tables directly; adjudicate or reopen |
| Queue/schedule | Registered invitation/matching/deadline consumer with lease and current version | Interactive user access, arbitrary party lookup, raw provider payload |
| Operator/maintenance | Assigned case/mechanical recovery projection with MFA, capability, reason and audit | Bypass proof, guess owner, change source fact, direct table mutation |

RLS is enabled and forced on every table; grants and RLS are both required. Views use `security_invoker=true`. Server-derived actor/acting party, not a caller-supplied party ID or JWT metadata, drives predicates. Tests cover anonymous, correct/wrong user, wrong party, forged IDs, revoked mandate, stale version, missing step-up, service credential misuse and over-disclosure.

### Per-operation middleware, error envelope, limits, telemetry, and test matrix

Every row below is keyed to the authoritative operation ID. Route Registry cells remain the single source for exact route-specific auth, rate, idempotency, and success/error status values; this matrix adds the boundary execution policy and makes each operation explicit.

| Operation ID | Auth and ownership | Rate limit | Input validation | CORS policy | Global error envelope | Error and retry guidance | Pagination and limits | Idempotency and concurrency | Observability | Test oracle |
|---|---|---|---|---|---|---|---|---|---|---|
| PRF-API-01 | The authoritative Route Registry PRF-API-01 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-01 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-01 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-01 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-01; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-02 | The authoritative Route Registry PRF-API-02 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-02 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-02 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-02 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-02; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-03 | The authoritative Route Registry PRF-API-03 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-03 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-03 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-03 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-03; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-04 | The authoritative Route Registry PRF-API-04 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-04 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-04 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-04 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-04; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-05 | The authoritative Route Registry PRF-API-05 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-05 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-05 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-05 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-05; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-06 | The authoritative Route Registry PRF-API-06 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-06 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-06 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-06 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-06; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-07 | The authoritative Route Registry PRF-API-07 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-07 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-07 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-07 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-07; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-08 | The authoritative Route Registry PRF-API-08 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-08 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-08 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-08 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-08; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-09 | The authoritative Route Registry PRF-API-09 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-09 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-09 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-09 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-09; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-10 | The authoritative Route Registry PRF-API-10 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-10 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-10 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-10 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-10; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-11 | The authoritative Route Registry PRF-API-11 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-11 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-11 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-11 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-11; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-12 | The authoritative Route Registry PRF-API-12 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-12 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-12 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-12 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-12; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-13 | The authoritative Route Registry PRF-API-13 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-13 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-13 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-13 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-13; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-14 | The authoritative Route Registry PRF-API-14 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-14 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-14 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-14 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-14; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-15 | The authoritative Route Registry PRF-API-15 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-15 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-15 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-15 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-15; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-API-16 | The authoritative Route Registry PRF-API-16 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-API-16 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-API-16 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-API-16 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-API-16; assert exact ApiError envelope and no unauthorized side effect. |
### Field-level SQL type and relationship ledger

The seven 02a domain records are listed with complete SQL typing, nullability, checks, owner relationships, query indexes, and access posture. Cross-shard party, evidence, and case identifiers remain opaque references because their canonical tables belong to Shards 01, 00, and 06.

| Table | Typed fields, nullability, and constraints | Foreign keys and relationship boundary | Query indexes and uniqueness | RLS and grants |
|---|---|---|---|---|
| profile_private.shadow_party_contexts | id uuid NOT NULL PK; owner_id uuid NOT NULL; party_id uuid NOT NULL; creator_person_id uuid NOT NULL; creator_acting_party_id uuid NOT NULL; source_domain text NOT NULL CHECK lowercase registry code; source_entity_id text NOT NULL CHECK NFC and length 1..256; role_code text NULL; instrument_ref uuid NULL; contact_route_id uuid NULL; state profile.shadow_state NOT NULL CHECK IN (created, invited, suppressed, claimed, merged); version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | owner_id and party_id are Shard 01 party opaque refs; creator IDs are Shard 01 person/context opaque refs; instrument_ref and contact_route_id are source-domain opaque refs | PK; unique source_domain, source_entity_id, party_id; index party_id, state, updated_at DESC; index creator_person_id, created_at DESC | forced RLS; creator/target scoped RPC projections; anon has no private read and no table grant |
| profile_private.shadow_suppressions | id uuid NOT NULL PK; owner_id uuid NOT NULL; party_id uuid NULL; route_fingerprint bytea NOT NULL CHECK octet_length = 32; remedy_action text NOT NULL CHECK IN (suppress, correct); scope text NOT NULL CHECK IN (outreach, publication, both); state profile.suppression_state NOT NULL CHECK IN (active, revoked); case_id uuid NULL; evidence_ref uuid NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | owner_id REFERENCES profile_private.shadow_party_contexts(id) ON DELETE RESTRICT; party_id is Shard 01 opaque; case_id is Shard 06 opaque; evidence_ref REFERENCES platform_private.object_records(id) through BE00 object RPC | PK; partial unique party_id, route_fingerprint, scope WHERE state = active; index route_fingerprint, state; index case_id | forced RLS; pointer-proof command and assigned review projection only; direct client grants denied |
| profile_private.invitation_dispatches | id uuid NOT NULL PK; owner_id uuid NOT NULL; shadow_id uuid NOT NULL; route_id uuid NOT NULL; attempt_no integer NOT NULL CHECK BETWEEN 1 AND 6; trigger text NOT NULL CHECK registry code; state profile.invitation_state NOT NULL CHECK IN (queued, sent, failed_retryable, stopped); scheduled_at timestamptz NOT NULL; sent_at timestamptz NULL; provider_ref text NULL; provider_digest bytea NULL CHECK octet_length = 32; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | owner_id and shadow_id REFERENCES profile_private.shadow_party_contexts(id) ON DELETE RESTRICT; route_id is a protected contact-route opaque ref; provider ref is BE00 operation evidence | PK; unique shadow_id, route_id, attempt_no; index state, scheduled_at; index shadow_id, created_at DESC | forced RLS; named scheduler lease and creator status RPC only; provider payload never granted |
| profile_private.claim_cases | id uuid NOT NULL PK; owner_id uuid NOT NULL; target_party_id uuid NOT NULL; claimant_person_id uuid NOT NULL; claim_kind text NOT NULL CHECK IN (self, representation, transfer); recipient_person_id uuid NULL; state profile.claim_state NOT NULL CHECK IN (started, proving, provisional, full, stalled, withheld, contested, revoked); control_level text NOT NULL CHECK IN (none, provisional, full); proof_started_at timestamptz NULL; proof_completed_at timestamptz NULL; window_expires_at timestamptz NULL; transfer_decision text NULL; transfer_expires_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | owner_id and target_party_id are Shard 01 party opaque refs; claimant and recipient IDs are Shard 01 person opaque refs; Shard 06 case refs remain opaque | PK; partial unique target_party_id, claimant_person_id WHERE state NOT IN (revoked, stalled); index claimant_person_id, state; index target_party_id, state, version; index recipient_person_id, state | forced RLS; claimant/target scoped projection; transfer and contest RPCs verify current Shard 01/06 authority before write |
| profile_private.claim_proof_attempts | id uuid NOT NULL PK; owner_id uuid NOT NULL; claim_id uuid NOT NULL; tier text NOT NULL CHECK registry tier; method text NOT NULL CHECK registry method; challenge_hash bytea NULL CHECK octet_length = 32; evidence_ref uuid NULL; attester_ids uuid[] NOT NULL CHECK cardinality <= 8; independence_result text NOT NULL CHECK registry result; state profile.proof_state NOT NULL CHECK IN (pending, accepted, rejected, expired, superseded); attempts_used integer NOT NULL CHECK BETWEEN 0 AND 5; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; expires_at timestamptz NULL | owner_id is target-party opaque ref; claim_id REFERENCES profile_private.claim_cases(id) ON DELETE RESTRICT; evidence_ref is BE00 object opaque; attester IDs are Shard 01 opaque person refs | PK; index claim_id, created_at DESC; partial index state, expires_at WHERE state = pending; index evidence_ref; unique claim_id, id, version | forced RLS; claimant or assigned attester/reviewer projection only; raw challenge/evidence bytes have no grant |
| profile_private.ownership_contests | id uuid NOT NULL PK; owner_id uuid NOT NULL; party_id uuid NOT NULL; incumbent_claim_id uuid NOT NULL; challenger_claim_id uuid NOT NULL; state profile.contest_state NOT NULL CHECK IN (open, frozen, resolved, withdrawn); response_due_at timestamptz NOT NULL; resolution_basis text NULL; winner_claim_id uuid NULL; shard06_case_id uuid NULL; reversal_end_at timestamptz NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | owner_id and party_id are Shard 01 party opaque refs; claim IDs REFERENCES profile_private.claim_cases(id) ON DELETE RESTRICT; shard06_case_id is a Shard 06 case opaque ref | PK; partial unique party_id, challenger_claim_id WHERE state = open; index party_id, state; index response_due_at, state; index shard06_case_id | forced RLS; contest participants see own projection; Shard 06 receives named outcome RPC only |
| profile_private.party_ownership_periods | id uuid NOT NULL PK; owner_id uuid NOT NULL; party_id uuid NOT NULL; owner_person_id uuid NOT NULL; basis_kind text NOT NULL CHECK IN (claim, transfer, reversal); basis_id uuid NOT NULL; starts_at timestamptz NOT NULL; ends_at timestamptz NULL CHECK ends_at > starts_at; control_level text NOT NULL CHECK IN (provisional, full); state profile.ownership_period_state NOT NULL CHECK IN (active, ended, superseded, reversed); case_id uuid NULL; version bigint NOT NULL CHECK >0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL | owner_id and party_id are Shard 01 party opaque refs; owner_person_id is Shard 01 opaque; basis_id is a typed claim/transfer ref resolved by basis_kind; case_id is Shard 06 opaque | PK; index party_id, starts_at DESC; index owner_person_id, starts_at DESC; GiST exclusion for overlapping live control periods; index basis_kind, basis_id | forced RLS; current owner projection and named transition RPC only; historical rows append-only and direct grants denied |

## Middleware & Policies

BE00 order is executable: route/context → transport/security/CSRF → webhook branch where applicable → Supabase session verification → Shard 01 acting-context resolution → strict Zod validation → capability/ownership/contest policy → idempotency and exact version → one RPC/use case → response/error normalization → one scrubbed observability event.

| Route class | Required principal and predicate | Special policy |
|---|---|---|
| Match | Session actor plus source creator/acting-party capability for the submitted source reference | Candidate suggestions are advisory; no caller-selected arbitrary target query. |
| Invitation | Creator/acting party owns the source context and route; source and shadow versions current | Creator standing budget, suppression, minor and six-attempt rules checked before job. |
| Remedy | No session; pointer proof and route/case evidence must verify inside one command | Safe response is identical for absent/invalid pointer where possible; no link authority. |
| Claim | Authenticated claimant person resolved by Shard 01; target lifecycle/suppression/freeze checked | One active self claim per person/target; merge redirect re-runs checks. |
| Proof | Claimant or eligible attester; step-up for control grant; independent-human checks | Healthy adapter only; no method details beyond allowlisted class. |
| Contest | Eligible contestant owns the claim/target relationship | Three attempts/90 days, no fee, 14-day response, no default winner. |
| Transfer | Current full owner creates; named recipient alone accepts with step-up | Live contest/provisional owner blocks; stale acceptance conflicts. |
| Reverse | Current owner or named capability operator with step-up, reason and target authority | Only within applicable reversal window; compensating history, never delete evidence. |

An unclaimed shadow has no public page, portfolio, search document, sitemap entry, social preview or public object URL. A shadow is a subject, never an agent. Public output never contains legal identity or trader address.

## Data Flow

### Protected command transaction

1. A route validates input and produces server-derived `RequestContext`; higher-numbered producers arrive only through asynchronous outbox-driven protected ingress with bounded source identity/version DTOs per DEC-100, never a store read.
2. `CreateShadowByReference` accepts only a registered source domain/entity/version, creator human and acting-party references. It calls the Shard 01 party-factory contract to atomically create/reuse an inert party and writes `ShadowPartyContext`; the source fact is not rolled back if matching or invitation later fails.
3. The RPC reserves idempotency, locks target/source version, writes domain state, audit, zero/one job, outbox events and the idempotency result in one transaction. No provider call occurs inside it.
4. A matching worker reads canonical context and returns advisory suggestions; it never creates authority or merges parties. Invitation workers re-read suppression, claim and minor state immediately before sending.
5. Claim start locks the target and claimant uniqueness row. Proof challenge issue stores only a hash and expiry. Proof completion burns the challenge, evaluates Tier A/B/C and independence, writes an ownership period, audit, projection invalidation and claim event atomically.
6. Conversion locks claim, contest and current ownership period. It requires an elapsed 14-day organization/30-day person window or stronger independent Tier A/full Tier B proof and no open contest.
7. Contest creation/evidence/withdrawal uses contest CAS. At deadline, full-grade independent challenger evidence with no incumbent response may resolve reversibly; weaker or two-sided evidence freezes ownership and emits `profile.contest.changed.v1`, and Shard 06 opens the ownership case. No transfer or payout mutation occurs while open/frozen.
8. Transfer creates a transfer `ClaimCase`. Recipient acceptance locks target and expected ownership version, then creates a new dated period and 30-day public changed-hands marker. Reversal inserts a compensating period and preserves all evidence/actions.
9. Shard 06 calls `RecordOwnershipCaseOutcome` with its own case ID and TSE-13 outcome. This shard verifies caller identity/case/contest/version/idempotency, applies only uphold/transfer/unfreeze, emits state/projection events and never adjudicates.

### State machine registry

| Aggregate | Allowed transitions | Guard/recovery |
|---|---|---|
| Shadow | `created → invited/suppressed/claimed/merged` | Suppressed remains protected; claimed/merged redirects or rejects new claim; no public unclaimed state. |
| Invitation | `queued → sent/failed_retryable/stopped` | Suppression, not-you, completed claim or attempt six stops future sends. |
| Claim | `started → proving → provisional/full/stalled/withheld/contested`; provisional → full/contested/revoked | Stalled resumes; withheld never silently denies; contests freeze control. |
| Proof | `pending → accepted/rejected/expired/superseded` | One challenge/use; invalid independence rejects evidence, not the whole claim. |
| Contest | `open → resolved/frozen/withdrawn`; frozen → resolved | Frozen resolution is policy or Shard 06 only; transfer stays blocked and withdrawal is refused. |
| Transfer ClaimCase | `started → pending → accepted/declined/expired/blocked` | Recipient step-up and current version required; accepted period is reversible only in window. |
| Ownership period | active period ends only through authoritative transition or compensating reversal | No overlapping live periods; history never deleted. |

### Idempotency, concurrency and external effects

- Source tuple and client key are separate serialization points. Matching is never uniqueness.
- Challenge issue/consume, proof, grant, conversion, contest, transfer, reversal and case outcome require expected target/claim/contest/period versions.
- Provider callbacks dedupe by registered provider event/reference and revalidate current state. Ambiguous provider send remains pending/reconciling; it never grants control.
- Same key/same normalized request replays the first response. Same key/different request is 409. Transaction rollback leaves no reservation.
- Projection rebuilds are version-addressed and idempotent. Stale events cannot overwrite newer ownership/publication state.

### External seam contracts and circuit state

Claim and ownership state is canonical here; provider, matcher, party, notification, and trust-safety responses are advisory or normalized inputs. No seam can grant control without the local CAS and authority transaction. Requests contain opaque references and hashes only, never contact values, evidence payloads, or provider tokens.

| Operations | Seam and owner | Exact request | Exact response | Timeout | Retry policy | Circuit, open state, and recovery |
|---|---|---|---|---:|---|---|
| PRF-API-01, PRF-API-02, PRF-API-03, PRF-API-04 | Shard 01 party and authority projection | `shadowPartyId`, `claimCaseId`, `actorRef`, `requestedVersion`, `purposeCode`, `requestId` | `partyState`, `authorityState`, `claimantRef`, `sourceVersion`, `capabilityState` | 2,000 ms | Two safe reads at 250 ms and 750 ms; mutation result is reconciled by source tuple and idempotency key | Five failures in 60 seconds open for 60 seconds; command returns 503 or safe refusal, no party or authority row is created, and retry re-resolves current state |
| PRF-API-05, PRF-API-06, PRF-API-07, PRF-API-08, PRF-API-09 | Provider proof and evidence adapter | `claimId`, `claimVersion`, `challengeId`, `proofMethod`, `evidenceRefIds`, `attemptId`, `requestId` | `attemptId`, `verificationState`, `normalizedResultCode`, `providerEventId`, `observedAt`, `sourceVersion` | 5,000 ms | Three worker attempts at 15, 60, and 300 seconds; post-send unknown results reconcile by `attemptId` or signed callback before retry | Five failures in 60 seconds open for 60 seconds; claim remains `pending` or `reconciling`, max four deliveries route to DLQ/manual review, and no control grant is inferred |
| PRF-API-10, PRF-API-11, PRF-API-12, PRF-API-13, PRF-API-14, PRF-API-15, PRF-API-16 | Shard 06 case/outcome and notification boundaries | `contestId` or `claimCaseId`, subject/actor hashes, expected source version, outcome or notice code, `requestId` | `caseVersion`, `outcomeState`, `accepted`, `deliveryAttemptId`, `projectionVersion` | 2,000 ms | Two safe reads at 250 ms and 750 ms; writes use one idempotent command and status reconciliation | Five failures in 60 seconds open for 60 seconds; local claim/contest remains frozen or pending, no downgrade/upgrade occurs, and queue reconciliation resumes after recovery |

## Events and Async Consumers

All events use the BE00 lossless envelope, decimal `aggregateVersion`, correlation/causation IDs and identifier-only payloads.

| Event | Payload | Consumer/guarantee |
|---|---|---|
| `profile.shadow.created.v1` | `{ shadowPartyId, contextId }` | Matching/invitation consumers refetch current context and suppression. |
| `profile.claim.changed.v1` | `{ claimCaseId, partyId }` | Ownership and profile consumers refetch current claim/period state. |
| `profile.contest.changed.v1` | `{ contestId, partyId }` | Shard 06 TSE-01 opens/updates `CaseKind=ownership`; no direct store read. |
| `profile.projection.invalidated.v1` | `{ partyId, sourceType, sourceId }` | 02b/profile consumers rebuild viewer-safe projection; producer ownership is fixed at integration. |

Consumers:

| Consumer | Queue/effect | Retry and terminal behavior |
|---|---|---|
| `profile.match` | Advisory duplicate suggestions | 400 ms response budget; stale/slow match is empty advisory result; unknown schema DLQ. |
| `profile.invitation` | Schedule/send bounded notice | At-least-once, provider idempotency, three retries, then retryable job/DLQ; suppression is checked before every send. |
| `profile.claim-deadline` | Window/expiry notification and conversion eligibility | Lease/CAS; duplicate timer is a no-op; terminal claim never reopens. |
| `profile.proof-reconcile` | Provider proof callback normalization | Deduplicate event, re-read claim/version, pending on ambiguity, manual review on conflict. |

Queue messages contain no codes, email/phone, contact route, evidence, legal identity, provider payload, media URL or request body. Queue acknowledgement never removes canonical audit/job/outbox evidence.

## Failure Cascade and Partial-State Matrix

| Boundary | Before commit | After commit / recovery |
|---|---|---|
| Validation/auth/CSRF/rate | No idempotency reservation, domain state or provider effect | Scrubbed security telemetry only. |
| Shard 01 party factory | Source command refuses or remains retryable; no orphan context | Reconcile by source tuple/idempotency; no second party or authority. |
| Matching | Source fact/context remains committed | Empty advisory result or queued continuation; no rollback or silent merge. |
| Invitation provider | Dispatch record/job commits before send | Retry only with provider idempotency; suppression/claim stops future attempt; failed send remains retryable. |
| Remedy proof | No suppression mutation | Invalid/expired proof grants nothing; protected case evidence remains with owning case. |
| Claim challenge/provider | No grant | Challenge burns on success/expiry/overattempt; provider ambiguity remains pending; no downgrade or false full control. |
| PostgreSQL response loss | Transaction rollback or committed result hidden | Same key/status read returns result; no duplicate period/event. |
| Contest conflict | No ownership mutation | Open/frozen preserves prior operational access and committed obligations; no new obligation/payout. |
| Shard 06 outcome | No local control change | Verify caller/case/version; apply one outcome exactly once; stale/unknown outcome remains safe refusal/manual review. |
| Queue/outbox | Canonical state remains authoritative | Lease/sweep/DLQ retries; duplicate delivery is idempotent. |
| Projection/cache | No canonical impact | Rebuild by version; last-known-good only where privacy/rights/takedown does not require purge. |
| Deletion/revocation | No new access | Tombstone/hold evidence and queue dependent invalidation; no orphaned public projection or control. |

Frozen parties service existing committed obligations only through operate-only custody. No payout destination change, signing, rights assignment, durable money/right obligation or custom escrow is created.

## Observability, Rate and Abuse Controls

Each route registers service tier, criticality, owner `profiles-claims`, measurement label and alert route. `@wejammin/observability` emits one scrubbed NDJSON event with route/operation, request/correlation/causation/trace IDs, actor/acting-context class, safe entity/version, outcome/error, duration, dependency, retryability and job/attempt.

| Family | Rate/abuse control | Audit/metrics/traces |
|---|---|---|
| Match | 60/min user, 120/min party; bounded source and candidate count; no arbitrary search | source class, duration, suggestion count/timed-out; no names or scores that reveal identity |
| Invitation | Creator standing budget, schedule day 0/3/14, extra per unrelated attester, max six; minor/suppression stop | dispatch decision, attempt/state/provider class, queue age and bounce; no route/contact |
| Remedy | 5/15 min per IP+pointer digest; proof max five attempts; generic safe response | suppression decision, proof class/outcome and security signal; no code/evidence/token |
| Claim/proof | 60/min ordinary claim, 10/min high-risk proof, 10 challenges/hour/claim; independence and provider circuits | claim/proof state, tier/method class, challenge outcome, adapter latency; 100% high-risk traces |
| Contest | Three attempts/target/rolling 90 days; no fee; one open target/person | 100% contest/transfer audit and trace, response deadline, freeze/case handoff |
| Transfer/reversal | 10/min user; recipient step-up; reversal window and capability | owner/recipient classes, decision, version/reversal outcome; no private evidence |

Required telemetry fields and forbidden fields inherit BE00. Forbidden: auth/cookie headers, tokens/codes, contact addresses, raw request/response, names/search text, provider payload, evidence, legal identity, media URLs/content, payment data, unrestricted IP/user agent. Structured diagnostics record unexpected errors and all high-risk failures with allowlisted fields only; audit remains PostgreSQL truth.

## Contract, Security and Recovery Tests

- Route/OpenAPI registry equality for all 16 operations: exact method/path/operation ID, request/success/error/auth/cache/rate/timeout/SLO/BOLA cells; no duplicate/discovered route.
- Every field × constraint row, strict unknown-key rejection, malformed JSON, 256 KiB boundary, header/path limits, Unicode/control input, UUID/version/idempotency grammar, body/media errors and exact four-field envelope.
- Anonymous remedy: pointer enumeration, invalid/mistyped route, valid/expired/replayed code, five failures, case-proof scope, no account, no bearer-link control, no public non-user registry.
- Shadow: source tuple replay, concurrent source producers, inert party reuse, abusive/mixed-script structured input, matching timeout, no silent merge, source fact survives invitation failure.
- Invitation: day 0/3/14, unrelated-attester extra, six cap, suppression/not-you/claim/minor, creator quota, duplicate worker, provider timeout, retry/DLQ and no contact leakage.
- Claim/proof: one active self claim, merged target redirect, suspended/frozen/suppressed target, challenge hash/expiry/attempt burn, Tier A full, Tier B one provisional/two full, Tier C provisional ceiling, same-human/org/mandate/project/session rejection, provider unavailable.
- Conversion/contest: 14/30-day windows, stronger-proof path, open contest freeze, three/90-day limit, fourth attempt handoff, 14-day response, weak/credible conflict, no default winner, Shard 06 event and protected outcome.
- Transfer/reversal: full owner only, recipient-only step-up acceptance, stale race, live contest, provisional denial, 14/30-day reversal, 30-day marker, compensating period and immutable evidence.
- RLS/grants: anonymous, correct/wrong user, wrong party, forged target/acting party, revoked mandate, expired session, missing step-up, case operator scope, Shard 06 caller identity, service-role misuse, security-invoker views and definer search path.
- Async/recovery: strict envelope, unknown-version DLQ, leases/heartbeat/CAS, duplicate/out-of-order delivery, provider idempotency, ambiguous pending, outbox sweep, terminal no-reopen, restore epoch fence, deletion/hold anti-resurrection.
- Performance: match suggestion budget 400 ms; Tier 1 API p95 ≤750 ms; Tier 2 command p95 ≤1,200 ms; job acceptance p95 ≤500 ms; outbox undispatched p95 ≤2 s; first queue attempt p95 ≤60 s; dead letters <0.1% daily.
- Accessibility handoff: stable JSON Pointer validation paths; explicit absent/forbidden/blocked/conflict/unknown states; no backend response hides failure as empty profile.

## Deepening Passes and Ambiguity Gate

| Pass | Result | Status |
|---:|---|---|
| 1. Cross-endpoint consistency | 16 route cells, schemas, state transitions and error matrix agree; PRF-01 and Shard 06 are explicitly non-HTTP commands. | PASS |
| 2. Concurrency | Source tuple, active claim, challenge, contest, transfer, period, idempotency and worker leases are explicit serialization points. | PASS |
| 3. Failure cascade | Party factory, providers, notifications, Queue, projection and PostgreSQL disconnects preserve one canonical truth. | PASS |
| 4. Authorization | Anonymous remedy, claimant, attester, owner, operator, Shard 06 and queue principals have explicit allow/deny predicates and concealment. | PASS |
| 5. Observability | Every route/family has audit, scrubbed logs, metrics, traces, SLO and alert ownership. | PASS |
| 6. Rate/abuse | Enumeration, collusion, brute force, invitation spam, contest DoS, bearer-link takeover and mass assignment are bounded. | PASS |
| 7. Partial state | All retries are idempotent; ambiguous effects are pending/manual review; frozen operation and compensating history are concrete. | PASS |
| 8. Source contradiction | Current IA/DEC-098/Shard 06 selects Shard 06 adjudication; superseded deep-dive wording is not used. | PASS |
| 9. Two-implementer convergence | Independent implementers select identical routes, schemas, states, auth predicates, transaction boundaries and tests. | PASS |
| 10. Adversarial scan | Hostile source, claimant, attester, contest, transfer, provider and operator paths produced no new product decision. | PASS |

### Quality Gate

- Every PRF-01–09 requirement is authored or explicitly assigned to a protected non-HTTP boundary.
- Every HTTP operation has request fields/examples, success schema/example, complete declared errors, field validation, auth/ownership, idempotency/version, rate/cache/deadline/SLO and observability.
- ApiError remains the exact four-field BE00 contract; missing If-Match is 400, never 428; versions are quoted decimal strings.
- Seven canonical records have fields, states, indexes, RLS/grants, retention/immutability and transaction ownership without a duplicate platform record.
- Shard 01 party/authority, Shard 06 adjudication, DEC-100 ingress, provider adapters and notification effects remain explicit boundaries.
- Contract, RLS/BOLA, provider, async, recovery, security, performance and accessibility tests cover success and refusal paths.
- Passes 1–10, two-implementer and devil's-advocate gates pass.

## Source Gaps and Dependency Gates

These are external enablement gates, not unresolved product behavior in this spec.

| Gate | Required before enablement |
|---|---|
| Shard 01 party factory | Named RPC must create/reuse an inert party, return canonical party/version, enforce source caller and RLS, and support merge redirect without direct table access. |
| DEC-100 producer ingress | Each higher-numbered producer must register bounded source domain/entity/version DTO, signed/least-privilege caller, event dedupe, retry/DLQ, and source-fact correlation. |
| Proof adapters | Provider registry must define method health, callback/event ID, signature/replay, normalized result, timeout, token handling, retention and kill switch. Tier A is absent unless healthy. |
| Shard 06 TSE-13 | Shard 06 must publish the exact outcome enum and caller authentication contract for `RecordOwnershipCaseOutcome`; local mapping is limited to uphold/transfer/unfreeze. |
| Account-free remedy | Notification/case owner must provide route-control and protected-evidence proof adapters without bearer-link authority, existence oracle, or public registry. |
| Notification/integration | Delivery adapter must provide normalized recipient-safe DTO, provider idempotency, suppression check, retry/DLQ and redaction. |
| Minor/safeguarding | Known/suspected minor shadow outreach remains disabled until the safeguarding gate is approved. |
| Public unclaimed profiles | Remain disabled; no public projection/index/search/sitemap route may be enabled without notice, remedy, retention and counsel approval. |
| Reversal/public marker | 02b must consume the ownership/projection invalidation event and define the viewer-safe changed-hands projection without exposing private evidence. |

## Ambiguity Gate

**PASS.** Implementer simulation and devil's-advocate review covered PRF-API-01 through PRF-API-16, strict request and success schemas, per-operation middleware and CORS, BE00 ApiError envelopes, authorization concealment, idempotency and concurrency, typed persistence, state recovery, integration boundaries, observability, tests, and source reconciliation. No unresolved implementation ambiguity remains; open questions are none.

## Open Questions

None. The adjudication-source conflict is resolved by current IA/DEC-098/Shard 06 precedence. Provider, producer-ingress, party-factory, notification and counsel/safeguarding items remain explicit dependency gates.

## Changelog

| Date | Change | Workflow | Sections |
|---|---|---|---|
| 2026-08-28 | Expanded approved Shard 02a split into complete backend contract; reconciled current IA/DEC-098/DEC-100 and BE00, added 16 routes, seven records, strict schemas/errors, protected commands, RLS, workers, events, tests, gates and passes 1–10. | `/write-be-spec-write` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]

### References
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/be/00-infrastructure|Cross-cutting Platform Foundation — Backend Specification]]
