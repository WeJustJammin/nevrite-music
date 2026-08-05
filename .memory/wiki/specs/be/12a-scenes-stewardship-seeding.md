# Scenes, stewardship and derived place/event seeding — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]  
**Deep Dive:** None required by the approved IA  
**Network Boundary:** [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths and reachability]]

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

- **Shard split:** 1 of 4; SPC-01 through SPC-05. Forums, contests and temporary event participation remain separate contracts.
- **Boundary:** offered/confirmed scene membership, anti-reinference, evidence-based density, bounded stewardship and corroborated non-residential premise/event seeds with forward-only claims.
- **Approval:** Recommended split accepted under standing autonomy.

## Scene and Seed Invariants

- Scene membership is always offered then explicitly confirmed as `resident|visiting`; it is never automatic. Evidence ranks work activity before labelled profile fallback, uses the largest defensible local unit and never derives location from device telemetry.
- Leaving writes a permanent anti-reinference signal for the same scene/evidence class; manual rejoin remains possible. Dismissing an offer suppresses only that offer. Neither action notifies other members.
- Membership grants no ranking boost, stewardship, authority, contact access, event eligibility or complete roster access. Public scene views expose evidence-based density bands, aliveness and bounded non-exhaustive samples only.
- Density uses evidenced collaborations, not member/head counts. Thin/unknown state remains honest; missing graph/metrics never renders zero, no community or fabricated members/events.
- Stewardship requires versioned density/evidence thresholds and grants bounded curation/reporting capabilities only. Stewards cannot remove members, inspect a roster, alter graph evidence or intercept/adjudicate Shard 06 safety cases.
- A seed needs two independent agreeing sources or one first-party fact; residential addresses and seeded person profiles are prohibited. Unclaimed records are provenance-labelled and excluded from search indexing before claim.
- Verified claim gives forward-looking control only. Historical source assertions remain immutable; refresh conflicts notify claimant and never overwrite claimed facts.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 actor, acting-context, request, idempotency and expected-version envelopes.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `GET /api/v1/scenes/offers` | acting party/cursor; professional viewer | `SceneOfferPage`; evidence class, largest defensible region, expiry/version | `403`, `422`, `429`, `503` |
| `POST /api/v1/scenes/{sceneId}/memberships` | `ConfirmSceneMembershipRequest`: offer/evidence hash and resident/visiting; acting party/key | `201 SceneMembershipResponse`; active membership/evidence/expiry/version | `403`, `404`, `409 OFFER_STALE|NEGATIVE_REINFERENCE_ACTIVE`, `422`, `429` |
| `DELETE /api/v1/scenes/{sceneId}/memberships/me` | acting party ETag/key | `204`; left state and permanent anti-reinference record | `403`, `404`, `409 VERSION_CONFLICT`, `428`, `429` |
| `POST /api/v1/scenes/offers/{offerId}/dismissals` | acting party/key | `204`; current offer dismissed silently | `403`, `404`, `409 OFFER_STALE`, `429` |
| `GET /api/v1/scenes/{sceneId}` | public/authorized viewer | `SceneProjectionResponse`; density band/aliveness/bounded samples/freshness, never roster | concealment-safe `404`, `429`, `503` |
| `POST /api/v1/scenes/{sceneId}/stewardship` | `StewardshipRequest`: party/basis evidence/scope/term; governance capability/key | `201 StewardshipResponse`; bounded grant/version | `403`, `409 DENSITY_GATE_UNMET|GRANT_EXISTS`, `422 SCOPE_INVALID`, `429` |
| `POST /api/v1/scenes/{sceneId}/steward-actions` | label/curation/report action and evidence; active steward ETag/key | `201 StewardActionResponse`; audited bounded outcome | `403 MEMBERSHIP_NOT_AUTHORITY`, `409 STEWARDSHIP_EXPIRED`, `422 MEMBER_REMOVAL_FORBIDDEN`, `428`, `429` |
| `POST /internal/v1/community/seed-records` | kind/place/source assertions/corroboration; seed worker/key | `201 SeedRecordResponse`; derived-unclaimed provenance/version | `403`, `409 SOURCE_CONFLICT`, `422 RESIDENTIAL_SEED_PROHIBITED|PERSON_SEED_PROHIBITED`, `429` |
| `POST /api/v1/community/seed-records/{id}/claims` | verified place/operator authority/evidence; claimant/key | `201 SeedClaimResponse`; claimed forward-control version | `403`, `404`, `409 CLAIM_CONFLICT`, `422`, `429` |
| `POST /api/v1/community/seed-records/{id}/objections` | factual objection/evidence; affected party/key | `201 SeedObjectionResponse`; Shard 06-linked review state | `403`, `404`, `409`, `422`, `429` |

Scene reads are 120/min/IP; offers/membership 30/min/person; stewardship 10/hour/scene; seed worker uses bounded queue budgets; claims/objections 10/day/record/person. Membership/evidence responses are no-store. Events/logs omit member lists, residential data and precise inferred location.

## Persistence, RLS and Workers

Tables: `space.scenes`, `scene_membership_offers`, `scene_memberships`, `scene_negative_reinference`, `scene_density_projections`, `scene_stewardships`, `seed_records`, `seed_source_assertions`, `seed_claims` and audit events. Scene partitions remain flat overlapping peers.

RLS exposes own membership and public aggregate projections only; no function returns an enumerable roster. Offer workers use approved non-device evidence, respect permanent negative signals and never auto-join. Density workers consume citable evidence classes and publish bands rather than raw members. Seed workers validate non-residential place class and corroboration before canonical insert; search consumes claimed/index-approved projections only.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Scene membership offer | `offered → accepted|dismissed|expired|stale` | Explicit professional acting-party response, database-time expiry or evidence change triggers. Offer never auto-joins; dismissed suppresses only that offer. |
| Scene membership | `active → dormant|left|expired`; dormant `→ active|left|expired`; left may re-enter only through a new manual offer/confirmation | Explicit confirmation creates active resident/visiting state. Leave writes permanent same-scene/evidence-class anti-reinference; device location, silence or prior activity cannot reactivate. |
| Stewardship | `proposed → active|rejected`; active `→ expired|revoked|superseded` | Governance approval with current density/evidence/scope/term triggers. Unmet threshold, expired grant or member-removal/roster/safety action blocks. |
| Scene density projection | `unknown|thin|active`; any result `→ stale` on source failure/change and stale `→ unknown|thin|active` after rebuild | Versioned citable collaboration fold triggers. Missing graph/metrics yields unknown, never zero/no-community or fabricated samples. |
| Seed record | `derived_unclaimed → claimed|objected|suppressed|retired`; claimed `→ objected|suppressed|retired`; objection resolution appends a successor without rewriting source assertions | Valid corroborated non-residential place sources create seed; verified claim grants forward control only. Person/residential seed, source conflict or unapproved indexing blocks. |

Every unlisted transition returns the typed state/version/evidence conflict. Events carry authorized scene/party state only and never member lists or precise inferred location.

## Failure, Deepening and Ambiguity Gate

Tests cover device-location input, user relocation without auto-removal, permanent leave reinference, thin/unknown density, roster enumeration, stewardship escalation, unavailable graph, residential/person seeds, single weak source, claim/source refresh race and historical overwrite. Seven passes converge; two implementers receive identical membership, density, stewardship and seed behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Scene, stewardship and seed contract authored | `/write-be-spec` |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]
- [[specs/be/11d-collaboration-paths-warm-intros|Collaboration paths, reachability and warm introductions — Backend Specification]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/06a-case-intake-evidence|Trust and safety case intake, routing and evidence — Backend Specification]]
