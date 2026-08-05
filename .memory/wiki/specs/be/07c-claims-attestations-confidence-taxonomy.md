# Credit claims, attestations, confidence and taxonomy — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]  
**Deep Dive:** [[specs/ia/deep-dives/07-credits-core|Credit deep dive]]  
**Claim Boundary:** [[specs/be/02a-shadow-claim-ownership|Shadow claim ownership]]  
**Case Boundary:** [[specs/be/06a-case-intake-evidence|Trust and safety case intake]]

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

- **Shard split:** 3 of 3; CRD-12 through CRD-18. This contract owns source-marked credit candidates, credit-to-party claims, immutable attestations, categorical provenance derivation, participant contests and role/instrument vocabulary.
- **Boundary:** evidence acquisition and eligibility, identity-vs-contribution separation, private refusal handling, reproducible confidence derivation, case handoff and version-pinned taxonomy resolution.
- **Approval:** Recommended split accepted under standing autonomy.

## Evidence and Taxonomy Invariants

- External candidates retain source, license, raw identifiers and content hash. Resolution is exact only, creates no public credit and never auto-publishes; fuzzy matching may generate a private review suggestion but cannot bind identity or taxonomy.
- Identity proof attaches a claimant to a shell-linked credit; it never proves contribution or raises provenance. The first claimant remains attached during contest; a rejected claim creates a permanent negative assertion for the same evidence basis.
- Eligible attesters are authenticated independent humans who overlap the session and are not the credited party, asserter or members/controllers of the same entity. Active blocks or disputes suppress requests; work, date and another named present party are required.
- One request per credit/attester may receive at most two nudges no earlier than days 7 and 21, subject to recipient rolling limits, mute and dormancy. Concurrent requests collapse without losing requester attribution.
- Attestations are immutable `confirm|refuse|dont_know` edges bound to a claim hash. Refusal identity/reason stay private and publicly resemble unanswered; retraction appends a reason and preserves the original edge.
- Provenance rung is derived solely from current eligible evidence under an immutable algorithm version. Internal score `0..1` cannot promote a rung; collusion/ring analysis may demote edge score only. Failure produces explicit unavailable state and removes stale labels.
- Roles use a DDEX-anchored canonical base plus optional modifier, admitted party types, family, locale labels and fidelity. Instruments use a separate functional hierarchy; make/model is forbidden. Assertions pin role/instrument versions and retained literals forever.

## API Endpoint Matrix

All bodies are strict Zod 4 objects; unknown keys and unbounded notes fail. Commands inherit Shard 00 request, actor, acting-context, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/admin/credit-imports` | `CreditImportBatchRequest`: source/license/version and rows<=500 with source hashes/raw IDs; import capability/key | `202 CreditImportBatchResponse`; batch ID/counts/review job | `403`, `409 SOURCE_HASH_MISMATCH|BATCH_EXISTS`, `422 LICENSE_OR_ROW_INVALID`, `429`, `503` |
| `GET /api/v1/admin/credit-candidates` | `CreditCandidateQuery`: source/review/exact-match/cursor; reviewer capability | `CreditCandidatePage`; protected source-marked candidates | `403`, `422`, `429`, `503` |
| `POST /api/v1/admin/credit-candidates/{id}/decision` | `CreditCandidateDecisionRequest`: accept/reject/defer, exact party/role/work bindings and reason; reviewer ETag/key | `CreditCandidateDecisionResponse`; private canonical candidate state, never automatic publication | `403`, `409 NEGATIVE_ASSERTION_EXISTS|VERSION_CONFLICT`, `422 FUZZY_BINDING_FORBIDDEN`, `428`, `429` |
| `POST /api/v1/credits/{creditId}/claims` | `CreditClaimRequest`: shell ID, claimant party, identity evidence ref; verified claimant/key | `201 CreditClaimResponse`; attached/pending/witness-needed state | `403`, concealment-safe `404`, `409 CLAIM_CONFLICT|NEGATIVE_ASSERTION_EXISTS`, `422`, `429` |
| `POST /api/v1/credit-claims/{claimId}/witness-requests` | `ClaimWitnessRequest`: eligible witness, canonical claim hash, note<=500; claimant/key | `201 WitnessRequestResponse`; bounded request/cadence | `403 WITNESS_INELIGIBLE`, `409 REQUEST_EXISTS`, `422`, `429` |
| `POST /api/v1/credits/{creditId}/attestation-requests` | `AttestationRequest`: attester, claim hash, context facts, optional note<=500; credited party/session owner/close workflow | `201 AttestationRequestResponse`; collapsed request/requester set/cadence | `403 ATTESTATION_INELIGIBLE|BLOCKED_OR_DISPUTED`, `404`, `409 REQUEST_EXISTS`, `422 CONTEXT_FLOOR_UNMET`, `429` |
| `GET /api/v1/me/credit-attestation-requests` | `AttestationInboxQuery`: state/cursor/limit<=50; recipient | `AttestationInboxPage`; bounded claim/context projection | `404`, `422`, `429`, `503` |
| `POST /api/v1/credit-attestation-requests/{id}/answers` | `AttestationAnswerRequest`: claim hash, answer, optional reason<=500; attester/key | `201 AttestationResponse`; immutable edge and derivation job | `403`, `404`, `409 CLAIM_HASH_STALE|ANSWER_EXISTS`, `422`, `429` |
| `POST /api/v1/credit-attestations/{id}/retractions` | `AttestationRetractionRequest`: reason<=500; original attester/key | `201 AttestationRetractionResponse`; immutable retraction and refresh job | `403`, `404`, `409 RETRACTION_EXISTS`, `422`, `429` |
| `GET /api/v1/credits/{creditId}/provenance` | viewer context; public or authorized participant | `CreditProvenanceResponse`; rung, plain-language evidence classes, algorithm version/availability; never score | concealment-safe `404`, `429`, `503` |
| `POST /internal/v1/credits/{creditId}/derive-provenance` | `DeriveProvenanceCommand`: expected credit/evidence hashes and algorithm version; worker capability/key | `ProvenanceDerivationResponse`; rung/score/explanation or unavailable reason | `403`, `409 EVIDENCE_SET_CHANGED|ALGORITHM_VERSION_INVALID`, `422`, `429`, `503` |
| `POST /api/v1/credits/{creditId}/contests` | `CreditContestRequest`: reason/evidence refs; credited participant/key | `201 CreditContestResponse`; participant marker and Shard 06 case link | `403`, concealment-safe `404`, `409 CONTEST_EXISTS`, `422`, `429` |
| `GET /api/v1/credit-taxonomy/roles` | `RoleResolveQuery`: literal, locale, party type, limit<=5 | `RoleResolveResponse`; exact/alias or visible fuzzy candidates; no auto-selection | `422`, `429`, `503 TAXONOMY_UNAVAILABLE` |
| `GET /api/v1/credit-taxonomy/instruments` | `InstrumentResolveQuery`: literal, locale, limit<=20 | `InstrumentResolveResponse`; functional hierarchy matches | `422`, `429`, `503 TAXONOMY_UNAVAILABLE` |
| `POST /api/v1/credit-taxonomy/pending-role-aliases` | `PendingRoleAliasRequest`: bounded screened literal, locale, requester scope; authenticated actor/key | `201 PendingRoleAliasResponse`; retained literal/hash and candidates | `409 PENDING_ALIAS_EXISTS`, `422 LITERAL_REJECTED`, `429` |
| `POST /api/v1/admin/credit-taxonomy/pending-role-aliases/{id}/decision` | `PendingRoleDecisionRequest`: promote/map/reject, role version and reason; taxonomy-admin ETag/key | `PendingRoleDecisionResponse`; first immutable mapping/version | `403`, `409 ALREADY_RESOLVED|VERSION_CONFLICT`, `422`, `428`, `429` |

Provenance reads are 240/min/person or 120/min/IP; claims and contests 10/day/credit/person; attestation asks 20/day/requester plus recipient outstanding/rolling budgets and exactly two eligible nudges; answers/retractions 60/min; taxonomy reads 120/min/IP; pending terms 20/day/person; imports 4/min/operator. Private/admin responses are no-store and 100% audited. Public projections exclude internal score, ring flags, refusal identity, hidden evidence and embargo existence.

## Persistence, RLS and Workers

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Import batch/candidate | batch `queued → running → review_ready|failed|completed`; candidate `pending → accepted|rejected|deferred|superseded` | Exact source/license/hash worker and reviewer trigger. Fuzzy binding cannot accept; negative assertion blocks replay. |
| Credit claim | `pending → witness_needed|attached|contested|rejected`; witness-needed `→ attached|contested|expired` | Identity proof/witness/case outcome triggers. Identity proof never raises provenance; first claimant remains during contest. |
| Witness/attestation request | `pending → answered|expired|cancelled|suppressed`; pending may record exactly two nudges | Eligible recipient answer/timer/block/dispute triggers. Non-pending rejects answer/nudge; concurrent requests collapse to one. |
| Attestation edge | `active → retracted|invalidated` | Original attester retraction or material credit successor triggers. Original answer remains immutable; non-active edge cannot support rung. |
| Provenance derivation | `queued → running → available|unavailable|stale` | Worker/current evidence-set+algorithm hash triggers. Stale/crashed result removes stale label and never invents rung; score cannot promote rung. |
| Credit contest | `open → resolved|withdrawn|superseded` | Shard 06 case outcome/participant withdrawal/new basis triggers. Open contest suppresses requests/discovery weight but preserves prior eligible public rung per policy. |
| Pending role alias | `pending → promoted|mapped|rejected` | Taxonomy-admin first decision/current role version triggers. Literal screening failure prevents pending row; terminal mapping immutable. |
| Role/instrument version | `draft → active → deprecated|retired`; deprecated may point to one active successor | Protected vocabulary release triggers. Historical assertion stays pinned; terminal key/version never reused. |

Every unlisted transition returns the typed state/version/hash conflict and never rewrites source evidence or publicizes refusal identity.

| Table | Constraints and indexes |
|---|---|
| `credit.external_credit_candidates` / `credit.import_batches` | permanent source/license/hash/raw IDs, exact bindings, review state and negative assertion; unique source/row hash |
| `credit.credit_claims` / `credit.claim_witness_requests` | credit/shell/claimant/identity evidence/state/first claim/case/version and bounded witness cadence |
| `credit.attestation_requests` / `credit.attestations` | unique active credit/attester, claim hash, requester set, context snapshot, cadence/state and immutable answer/retraction chain |
| `credit.provenance_derivations` / `credit.provenance_evidence_edges` | unique credit/evidence-set/algorithm, rung, encrypted internal score, explanation/availability and eligibility decisions |
| `credit.credit_contests` | credit/opener/reason/private evidence/participant state/Shard 06 case/outcome/version; one active contest per basis |
| `credit.role_versions` / `credit.role_aliases` / `credit.pending_role_aliases` | immutable canonical key/base/modifier/family/party types/locale/DDEX fidelity plus scoped bounded literal and first resolution |
| `credit.instrument_versions` | immutable functional parent, locale labels, state/version/deprecation; no make/model fields |

RLS exposes a claim only to claimant, affected credited parties and case-purpose reviewers; refusal identity/reason are attester-only plus narrowly purpose-granted reviewers. Public provenance is a security-definer projection that joins only eligible evidence and effective credit visibility. Taxonomy admins may version vocabulary but cannot edit assertions, evidence or derived outcomes; deprecated versions remain resolvable for historical records.

Import workers preserve raw source truth, exact-resolve known identifiers, create private candidates and stop before canonical/public writes. Derivation workers snapshot the eligible edge set, compute rung and score independently, compare the evidence hash before commit and emit explicit unavailable state on terminal failure. Material credit successor events invalidate supporting attestations; instrument, qualifier and pending-alias completion only trigger a no-rung-change refresh. Case outcomes are allowlisted typed commands: attach/re-point/supersede or leave unchanged; they never rewrite evidence. Events: candidate, claim, attestation, provenance, contest and taxonomy changed; payloads omit refusal identity, internal score, ring flags and private session context.

## Failure, Deepening and Ambiguity Gate

Tests cover duplicate imports, source/license mismatch, fuzzy auto-binding attempts, first-claim races, identity-proof inflation, rejected evidence replay, entity-membership independence, block/dispute suppression, concurrent request collapse, cadence boundaries, refusal non-attribution, retraction chains, stale claim answers, material amendment invalidation, score/rung separation, collusion score-only demotion, derivation crash/unavailable state, contest public invisibility, taxonomy outage, pending-literal screening, first-mapping races and deprecation without history rewrite. Public credit remains at its prior eligible rung during contest while configured discovery weight may become zero. Logs omit protected source rows, evidence, reasons, refusal identity and scores. Seven deepening passes and ambiguity/devil checks converge; two implementers receive identical claim, eligibility, derivation, contest and taxonomy behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Claims, attestations, confidence and taxonomy contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/deep-dives/07-credits-core|Deep Dive 07 — Credit graph, capture and confidence]]
- [[specs/be/02a-shadow-claim-ownership|Shadow parties, claims, contests and ownership transfer — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/07a-credit-assertions-visibility|Credit assertions, visibility and graph — Backend Specification]]
- [[specs/be/07b-session-capture-offline|Session roll, contribution capture and offline merge — Backend Specification]]
