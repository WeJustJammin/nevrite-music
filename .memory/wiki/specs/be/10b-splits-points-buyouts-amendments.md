# Split capture, producer points, buyouts and amendments — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]  
**Deep Dive:** [[specs/ia/deep-dives/10-rights-ownership|Rights ownership deep dive]]  
**Ledger Boundary:** [[specs/be/10a-rights-objects-ledgers|Rights objects and ledgers]]

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

- **Shard split:** 2 of 5; RGT-05 through RGT-08. Consumer launch captures agreement evidence and consent states; custody, escrow, multi-party payouts and compelled payment remain counsel/provider-gated and absent.
- **Boundary:** non-blocking close-moment split capture, producer-point encumbrances, contribution-scoped work-for-hire/buyout designations and whole-ledger superseding amendments.
- **Approval:** Recommended split accepted under standing autonomy.

## Agreement Lifecycle Invariants

- Shard 09 supplies work, participants and contribution claims, never percentages. Each participant is explicitly `share|fee|present_not_party`; empty/open is first-class debt and session close never waits.
- Share creates a ledger draft; fee creates an engagement/buyout reference. No presence, credit or Producer entry assigns a share. Ensemble contractor binds players only under current Shard 01 agency.
- Producer points are master encumbrances, not ownership. They require named calculation base, exact rate, tier/term, payee, recoupment terms and consent; each base-tier waterfall is at most one.
- Points and work-for-hire fee are mutually exclusive per contribution, not globally per person. Points may transfer only through an explicit title event.
- Buyout/WFH records contribution, payer/designee, beneficiary, consideration and required consents atomically, but never assert legal effectiveness. Credit, performer fact, neighbouring-right potential and NIL survive.
- Amendment is successor-only with one open proposal. It shows exact per-party delta and downstream impact, resets all consents, and leaves current ledger governing until every required current consent succeeds. No admin override or silence semantics exists.
- Unreachable parties block indefinitely; saves remain unlimited but sends are cadence-limited. Cross-ledger master/publishing packages advance atomically or neither. True-up is a separate consented downstream instruction, never compelled payment.

## API Endpoint Matrix

All bodies are strict Zod 4 objects using reduced rational contracts from 10a. Commands inherit Shard 00 actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/split-captures` | `CreateSplitCaptureRequest`: Shard 09 session/moment/source versions, work, participant designations without default shares; authorized participant/key | `201 SplitCaptureResponse`; draft/debt/version, session unaffected | `403`, `409 SOURCE_STALE|CAPTURE_EXISTS`, `422 PREFILL_PERCENTAGE_FORBIDDEN`, `429` |
| `PATCH /api/v1/split-captures/{id}` | `UpdateSplitCaptureRequest`: explicit designations/share draft/fee refs; authorized editor ETag/key | `SplitCaptureResponse`; new draft/debt/ledger refs | `403`, `404`, `409 VERSION_CONFLICT`, `422 DESIGNATION_INVALID`, `428`, `429` |
| `POST /api/v1/contributions/{contributionId}/producer-points` | `ProducerPointsRequest`: named base, reduced rate, tier/term/payee/recoupment/evidence; required parties/key | `201 EncumbranceResponse`; proposed/consented encumbrance version | `403`, `404`, `409 WFH_CONFLICT|BASE_TIER_OVERALLOCATED`, `422`, `429` |
| `POST /api/v1/contributions/{contributionId}/buyout-designations` | `BuyoutDesignationRequest`: payer/designee/beneficiary/consideration/engagement evidence; authorized parties/key | `201 BuyoutDesignationResponse`; evidence/consent/gap state with legal disclaimer | `403`, `404`, `409 POINTS_CONFLICT|DESIGNATION_EXISTS`, `422 CONSIDERATION_OR_PARTY_INVALID`, `429` |
| `POST /api/v1/buyout-designations/{id}/consents` | exact designation hash, consent/refuse, actor basis/evidence; required party/key | `201 BuyoutConsentResponse`; immutable consent/aggregate evidence state | `403`, `404`, `409 CONSENT_STALE|CONSENT_EXISTS`, `422`, `429` |
| `POST /api/v1/rights/ledgers/{ledgerId}/amendments` | `LedgerAmendmentRequest`: proposed full successor or delta, reason, cross-ledger refs, true-up proposal; prior/current standing party/key | `201 LedgerAmendmentResponse`; frozen delta/impact/required consents | `403 STANDING_REQUIRED`, `404`, `409 AMENDMENT_OPEN|SOURCE_STALE`, `422`, `429` |
| `GET /api/v1/rights/ledger-amendments/{id}` | affected named party/authorized reviewer | `LedgerAmendmentResponse`; before/after exact values, impacts, consent state | `403`, `404`, `429`, `503` |
| `POST /api/v1/rights/ledger-amendments/{id}/consents` | exact amendment/hash and decision; affected party/key | `201 AmendmentConsentResponse`; successor/blocked/disputed state | `403`, `404`, `409 CONSENT_STALE|CONSENT_EXISTS|REBASE_REQUIRED`, `422`, `429` |
| `POST /api/v1/rights/ledger-amendments/{id}/resends` | recipient and delivery channel; coordinator/key | `202 ConsentDeliveryResponse`; bounded delivery attempt | `403`, `404`, `409 RESEND_BUDGET_EXHAUSTED`, `422`, `429` |

Capture writes are 60/min/session and 20/hour/person; points/buyout 20/hour/contribution; amendments 10/hour/ledger; consent 20/min/person; resends at most three per recipient per rolling seven days through governed cadence. Private responses are no-store and every consequential action is audited.

## Persistence, RLS and Workers

| Table | Constraints and indexes |
|---|---|
| `rights.split_captures` / `split_capture_participants` | work/session/moment/source versions/state/debt/payout-basis term and explicit party designation/share-or-fee refs |
| `rights.encumbrances` / `encumbrance_consents` | master/contribution/base/tier/rate/term/payee/recoupment/assignability/state/version and exact consent evidence |
| `rights.buyout_designations` / `buyout_consents` | contribution/payer/designee/beneficiary/consideration/engagement evidence/disclaimer/state/version and required-party decisions |
| `rights.ledger_amendments` / `amendment_consents` | current/proposed versions/delta/impact/standing/cross-ledger package/true-up/state/version and exact consent evidence |

RLS grants capture rows to session participants and agreement records to named parties/current mandate only. System/support cannot manufacture or override agreement. Serializable RPCs enforce per-contribution points/WFH exclusivity, exact tier ceilings and one open amendment. Workers issue bounded consent tasks, mark downstream artifacts stale only after a successor consents and emit true-up instructions without initiating custody/payment.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Split capture | `draft ↔ debt`; `draft|debt → proposed|abandoned` | Authorized designation/share-or-fee edits derive debt. Explicit proposal or abandonment triggers; session close, presence and silence never advance it. |
| Producer-points encumbrance | `draft → proposed → consented|refused|blocked`; any frozen outcome `→ superseded` by an explicit successor | Valid base/tier/rate/term proposal and complete named-party decisions trigger. WFH conflict, tier over-allocation, missing party or silence blocks consent. |
| Buyout/WFH designation | `draft → proposed → consented|refused|blocked`; any frozen outcome `→ superseded` by an explicit successor | Complete payer/designee/beneficiary/consideration evidence and required-party decisions trigger. Consent records evidence only and never changes legal-effect wording. |
| Ledger amendment | `draft → open → consented|refused|blocked|disputed`; consented `→ applied`; any non-draft outcome `→ superseded` by rebase or successor | Opening freezes exact delta/impact/consent set. Atomic successor application alone yields applied; stale base, partial cross-ledger package or incomplete consent blocks application. |
| True-up instruction | `proposed → consented|refused|blocked`; consented `→ emitted → acknowledged|failed|unknown` | Separate required-party consent and downstream adapter evidence trigger. It never initiates custody/payment, and unknown/failed acknowledgment cannot be presented as payment. |

Every unlisted transition returns the typed state/version/hash conflict. The current ledger remains authoritative until the successor amendment reaches applied atomically.

## Failure, Deepening and Ambiguity Gate

Tests cover prefilled-percentage rejection, skipped capture, present-not-party, unauthorized contractor, points base/tier overflow, contribution-scoped points/WFH conflict, missing beneficiary/consideration, legal-effect wording, one-open amendment races, consent reset, share-decrease exact acknowledgment, unreachable party, resend limits, queued rebase, cross-ledger atomicity and attempted true-up payment. Logs omit economics/evidence. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical capture, encumbrance, buyout and amendment behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Split, points, buyout and amendment contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/deep-dives/10-rights-ownership|Deep Dive 10 — Rights and ownership]]
- [[specs/be/10a-rights-objects-ledgers|Rights objects, ownership ledgers and consent — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/09d-sessions-delivery-readiness|Project sessions, delivery, QC and readiness — Backend Specification]]
