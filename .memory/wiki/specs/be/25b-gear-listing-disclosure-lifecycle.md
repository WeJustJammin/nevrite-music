# Gear listing disclosure, evidence and lifecycle — Backend Specification

**Status:** Complete  
**IA Source:** [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]  
**Deep Dive:** [[specs/ia/deep-dives/25-gear-market-catalog|Gear market catalog deep dive]]

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

- **Shard split:** 2 of 4; 25.08, 25.09, 25.10, 25.11, 25.12, 25.13 and 25.18.
- **Boundary:** versioned condition/originality disclosure, seller media/evidence, listing publication and amendment, append-only lifecycle and public-safe provenance/theft projection.
- **Approval:** Recommended split accepted under standing autonomy.

## Referenced Material Inventory

| Source | Sections consumed |
|---|---|
| Shard 25 IA/deep dive | listing truth assembly, evidence pack, listing state machine and screening projection |
| Shards 04, 23 and 24 | governed media, ownership/theft status and custody/sell grants |

## Listing Truth Invariants

- Grade definitions and component schemas are immutable/versioned. Seller disclosure pins grade, structured flaws, originality vector, evidence and seller attestation under one schema version.
- Grade is deterministically ceilinged by declared flaws. A known contradiction rejects only the attempted disclosure edit; validator outage may publish only with an explicit async-review flag.
- Originality always supports `original|replaced|unknown` per component. Aggregate labels never erase detailed facts or convert unknown into original.
- Material flaws require unit-specific governed evidence. Stock imagery is labelled; metadata and private serial/location are stripped from public renditions.
- Drafting and export remain available in an unsupported payout region, but publication is denied until payout readiness, material evidence, current policy snapshot, sale authority and theft screening pass.
- Published seller content and listing lifecycle are append-only. Amendment creates a successor version; price change with a live offer rejects, and material post-claim changes route to Shard 26 order amendment.
- Registry or matcher outage may leave publication unmatched; confirmed theft holds publication. Screening state never exposes hidden match counts or internal risk facts.
- Public provenance requires current-owner consent and source visibility. Ownership transfer resets owner-end publication consent; absent history renders nothing rather than implying clean history.

## API Endpoint Matrix

All bodies are strict Zod 4 objects and inherit Shard 00 idempotency, expected-version, privacy-classification and rate-limit controls.

| Endpoint | Zod request / authorization | Zod success response | Typed errors |
|---|---|---|---|
| `POST /api/v1/gear-listings/{id}/disclosures` | grade/schema/flaw/originality vectors/media refs/attestation/expected version/key; seller with sell grant | `201 DisclosureVersionResponse`; grade ceiling/materiality/review state | `403`, `409 VERSION_CONFLICT|DISCLOSURE_CONTRADICTION`, `422 EVIDENCE_REQUIRED`, `429` |
| `POST /api/v1/gear-listings` | seller/storefront/type/unit or stock/model bind/policy/price/media/key; authorized seller | `201 GearListingResponse`; draft/version/publish gaps | `403`, `409 UNIT_ALREADY_LISTED`, `422`, `429` |
| `POST /api/v1/gear-listings/{id}/media` | governed upload refs/kind/alt text or evidence-only classification/expected version/key; seller | `201 ListingMediaResponse`; safe rendition/review state | `403`, `409 VERSION_CONFLICT`, `422 SAFE_RENDITION_REQUIRED|ACCESSIBILITY_METADATA_REQUIRED`, `429` |
| `POST /api/v1/gear-listings/{id}/publication-preflights` | listing/disclosure/policy/payout/grant/screening versions; seller | `ListingPublicationPreflightResponse`; gaps/hash/expiry | `403`, `409 SOURCE_STALE`, `422 PAYOUT_UNSUPPORTED|MATERIAL_EVIDENCE_REQUIRED|THEFT_HOLD`, `429` |
| `POST /api/v1/gear-listings/{id}/publications` | preflight hash/expected draft version/key; seller | `201 GearListingResponse`; active/pinned versions/public URL | `403`, `409 PREFLIGHT_STALE|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-listings/{id}/versions` | changed fields/consequence acknowledgement/expected version/key; seller | `201 GearListingResponse`; successor/offer-or-claim consequence | `403`, `409 LIVE_OFFER_PRICE_LOCK|CLAIM_AMENDMENT_REQUIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `POST /api/v1/gear-listings/{id}/transitions` | from/to/reason/expected version/key; seller or Shard 26 authority | `GearListingResponse`; lifecycle event/current state | `403`, `409 INVALID_TRANSITION|RESERVED_ORDER_REQUIRED|VERSION_CONFLICT`, `422`, `428`, `429` |
| `GET /public/gear-listings/{id}` | public listing ID/as-of | `PublicGearListingResponse`; safe listing/provenance/screening/freshness | `404`, `410`, `429`, `503` |
| `GET /api/v1/gear-listings/{id}/evidence-pack` | purpose/case/order context; seller, claimant or case-bound reviewer | `ListingEvidencePackResponse`; authorized frames/seals/audit | `403`, `404`, `429` |

## Persistence, RLS and Workers

- `disclosure_version`, `evidence_frame`, `evidence_pack`, `listing`, immutable `listing_version`, media bindings, screening projection, lifecycle event and provenance-consent rows pin source, actor and policy versions.
- RLS requires controlling seller plus ownership or confirmed custody with explicit `sell` grant for mutations. Public projection excludes serial, exact location, payout state, originals and internal confidence/risk. Evidence access is purpose- and case-bound.
- Publication, rendition, screening, matching and search-projection workers use transactional outbox events. Privacy/security revocation removes public projection immediately; ordinary projection failure may serve last-known-good safe state with age.

### State Machine Registry

| Entity | Valid transitions | Trigger and blocked behavior |
|---|---|---|
| Disclosure version | `draft → valid|async_review|rejected`; valid/review `→ superseded`; async-review `→ valid|rejected` | Seller structured disclosure/evidence and deterministic grade ceiling trigger. Contradiction rejects attempted edit only; unknown originality never becomes original. |
| Listing media | `uploaded → reviewing → safe|blocked|evidence_only`; safe `→ revoked|stale` | Governed rendition/privacy/accessibility inspection triggers. Material flaw lacks unit evidence or serial/location metadata blocks public use. |
| Gear listing | `draft → active → reserved|paused|sold|withdrawn|expired`; reserved `→ active|sold|cancelled`; any current state may `→ superseded` by allowed version | Publication preflight and seller/Shard 26 transition trigger. Payout/theft/authority/evidence failure blocks; live offer locks price and claimed material change routes order amendment. |
| Public listing projection | `active → stale|revoked|removed`; safe stale may serve last-known-good with age | Listing/privacy/security/source changes trigger. Immediate sensitive revocation removes; no private record fallback. |
| Provenance consent | `active → revoked|expired|reset_on_transfer` | Current owner consent/visibility/ownership transfer triggers. Absent/hidden history renders nothing and hidden counts stay hidden. |

Every unlisted transition returns the typed state/version/listing conflict. Public output omits serial, location, payout, originals and internal risk.

## Failure, Deepening and Ambiguity Gate

Tests cover false-original fallback, grade/flaw contradiction, missing material evidence, payout-blocked drafting, metadata leakage, matcher outage, confirmed-theft hold, live-offer repricing, published deletion, transfer consent carryover and hidden theft counts. Seven passes converge; two implementers receive identical listing truth and lifecycle behavior.

## Changelog

| Date | Change | Workflow |
|---|---|---|
| 2026-08-03 | Listing disclosure and lifecycle contract authored | `/write-be-spec` |

## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear market catalog]]
- [[specs/be/04b-governed-media-renditions|Governed media renditions — Backend Specification]]
- [[specs/be/23b-theft-screening-recovery|Gear theft flags, transfer screening and recovery — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/25-gear-market-catalog|Shard 25 — Gear catalog, listings and market data]]
- [[specs/ia/deep-dives/25-gear-market-catalog|Deep Dive 25 — Gear catalog, listings and market data]]
- [[specs/be/00-infrastructure|Cross-cutting platform foundation — Backend Specification]]
- [[specs/be/04b-governed-media-renditions|Governed media, rights, renditions and takedown — Backend Specification]]
- [[specs/be/23b-theft-screening-recovery|Gear theft flags, transfer screening and recovery — Backend Specification]]
- [[specs/be/24d-custody-cases-manifests|Gear custody, operational cases, manifests and theft handoff — Backend Specification]]
