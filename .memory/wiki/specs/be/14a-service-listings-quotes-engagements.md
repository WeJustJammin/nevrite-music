# Service Listings, Quotes & Engagements — Backend Specification

**Status:** Complete
**IA source:** [Shard 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md)
**Deep-dive source:** [Deep Dive 14 — Services marketplace lifecycle](../ia/deep-dives/14-services-marketplace.md)
**Backend foundation:** [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md)

## Split Group

This split owns service publication, quote-request admission, immutable quote versions, quote acknowledgement, and atomic engagement creation. It contains SRV-01–SRV-04. Requirements, delivery, supply, rights execution, and custody commands remain in the sibling split specifications.

## Classification

- **Type:** multi-domain transactional command split.
- **Boundary:** `service_listing`, `listing_version`, `pricing_model_version`, `quote_request`, `quote_version`, `quote_acknowledgement`, and `engagement` ownership; platform taxonomy and payment effects remain cross-shard seams.
- **Expected operations:** four HTTP operations, one-to-one with IA interactions SRV-01, SRV-02, SRV-03, and SRV-04.
- **Approval:** blanket approval from `/write-be-spec all shards`; delegated decision authority applies.
- **Decision lock:** listing truth is versioned; issued quotes are immutable snapshots; acceptance pins all commercial and recall terms before engagement creation.

### IA Feature Mapping

The following `## Features` bullets are reproduced verbatim from `../ia/14-services-marketplace.md:28-34` and mapped to the owning backend route registries.

| IA feature bullet (verbatim) | BE coverage and authoritative operations |
|---|---|
| **05.01 Service Listings & Pricing** — curated craft taxonomy, tier/package/add-on templates, shape-specific pricing, private benchmarks, service mode/SLA and fact-derived capacity/liveness. | [14a](14a-service-listings-quotes-engagements.md#route-registry): `SRV-LST-API-01`. |
| **05.02 Quotes, Scope & Contracting** — immutable expiring quotes, structured terms/diffs, NDA/anonymity and union/session contract facts. | [14a](14a-service-listings-quotes-engagements.md#route-registry): `SRV-LST-API-02`–`SRV-LST-API-04`. |
| **05.03 Engagement Lifecycle** — frozen requirements, milestones, revisions/change orders, retainers, cancellation/abandonment and recall. | [14b](14b-requirements-sla-milestones-revisions.md#route-registry): `SRV-REQ-API-01`–`SRV-REQ-API-05`. |
| **05.04 Delivery, QC & Acceptance** — complete artifact delivery, technical QC, previews and explicit source/session handover. | [14c](14c-delivery-acceptance-exit-rights.md#route-registry): `SRV-DEL-API-01`–`SRV-DEL-API-04`. |
| **05.05 Multi-Party Supply** — consented deps, fixers, subcontracting and bundle composition, subject to B3 payout gate. | [14d](14d-substitution-multiparty-supply.md#route-registry): `SRV-SUP-API-01`–`SRV-SUP-API-03`. |
| **05.06 Rights, Warranties & Transfer** — explicit rights postures, points, atomic execution, source/originality and human-performance declarations. | [14c](14c-delivery-acceptance-exit-rights.md#route-registry) and [14d](14d-substitution-multiparty-supply.md#route-registry): `SRV-DEL-API-04`, `SRV-SUP-API-01`–`SRV-SUP-API-03`. |
| **05.07 Custodial & Physical Services** — repair/inspection micro-lifecycles and mutual custody/condition evidence. | [14e](14e-repair-inspection-custody.md#route-registry): `SRV-CUS-API-01`–`SRV-CUS-API-03`. |

## Referenced Material Inventory

| Source file | Section / lines | Material used in this specification |
|---|---|---|
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Overview, Features, lines 9–35 | Marketplace boundary and feature IDs `05.01`–`05.03`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Interactions, lines 58–90 | SRV-01–SRV-04 commands, preconditions, outcomes, and failure states. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Contracts, lines 91–146 | Listing, recall-policy, rights, price, quote, anonymity, and acceptance rules. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Data Models, lines 147–213 | Canonical model names, fields, cardinality, and immutability. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Access Control, lines 214–237 | Seller, buyer, platform, contributor, and acting-context authority. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Event Schemas, lines 247–264 | `service.listing.changed.v1`, `service.quote.changed.v1`, and `service.engagement.changed.v1`. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Edge Cases, lines 265–291 | Version races, stale context, self-acceptance, minors, and privacy failures. |
| `.memory/wiki/specs/ia/14-services-marketplace.md` | Cross-Shard Dependencies, lines 320–336 | Inbound `opportunity.handoff.changed.v1` consumption and idempotent `RecordHandoffOutcome` callback to Shard 13. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Canonical Field Contracts, lines 20–34 | Typed listing, quote, posture, and determining-fact invariants. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | State Machines, lines 35–44 | Listing, quote, and engagement state transitions. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Quote Acceptance and Engagement Creation, lines 45–55 | CAS, payment authorization, acknowledgement, and atomic creation algorithm. |
| `.memory/wiki/specs/ia/deep-dives/14-services-marketplace.md` | Abuse and Recovery Verification, lines 122–138 | Replay, fraud, stale context, and provider recovery requirements. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Request/Response Contracts, lines 112–201; Deterministic Protocol Rules, lines 330–353 | Zod 4 wire conventions, global `ApiError`, idempotency, ETag, and collection limits. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Middleware & Policies, lines 253–298; Events, lines 355–416 | Hono order, CORS, RLS boundary, outbox, and consumer retry behavior. |
| `.memory/wiki/specs/2026-08-02-architecture-design.md` | API Design, lines 359–376; Error Architecture, lines 578–633 | Hono/Cloudflare transport and error propagation. |
| `.memory/wiki/specs/ENGINEERING-STANDARDS.md` | API Response Time, lines 96–120; Security, lines 149–165; Validation Command, lines 208–212 | Performance, security, and verification budgets. |

## IA Source Map

| BE section | IA source / trace |
|---|---|
| Route registry and operation contracts | Shard 14 IA `§ Interactions`, lines 58–90; `§ Contracts`, lines 91–146 |
| Listing and quote persistence | Shard 14 IA `§ Data Models`, lines 147–178; deep dive `§ Canonical Field Contracts`, lines 20–34 |
| Engagement creation and authority | Shard 14 IA `§ Access Control`, lines 214–237; deep dive `§ Quote Acceptance and Engagement Creation`, lines 45–55 |
| Events and failure recovery | Shard 14 IA `§ Event Schemas`, lines 247–264; `§ Edge Cases`, lines 265–291; deep dive `§ Abuse and Recovery Verification`, lines 122–138 |
| Transport, error envelope, idempotency, and outbox | BE00 `§ Request/Response Contracts`, lines 112–201; `§ Deterministic Protocol Rules`, lines 330–353; `§ Event and Consumer Contracts`, lines 355–416 |

## Endpoint Completeness Reconciliation

| IA interaction | BE operation ID | Method and path | Result |
|---|---|---|---|
| SRV-01 Publish service listing | SRV-LST-API-01 | `POST /api/v1/services/listings` | Reconciled: validates craft, price, rights, and recall policy snapshot; publishes a new listing version. |
| SRV-02 Browse/request quote | SRV-LST-API-02 | `POST /api/v1/services/quote-requests` | Reconciled: admits a scoped request against a published listing version and returns a request projection. |
| SRV-03 Issue/reissue quote | SRV-LST-API-03 | `POST /api/v1/services/quote-requests/{quoteRequestId}/quotes` | Reconciled: creates immutable quote version with bounded expiry and pinned recall terms. |
| SRV-04 Accept quote | SRV-LST-API-04 | `POST /api/v1/services/quotes/{quoteId}/accept` | Reconciled: exact-version acknowledgement, payment authorization, and engagement creation are one transaction. |

No operation is inherited without an operation ID. BE00 supplies only shared transport, error, outbox, and idempotency behavior; it does not add a domain endpoint here.

## API Endpoints

### Route Registry

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| SRV-LST-API-01 | POST | `/api/v1/services/listings` | SRV-01 | Authenticated seller or authorized agency acting for seller; craft and listing ownership checked | `201` listing/version projection |
| SRV-LST-API-02 | POST | `/api/v1/services/quote-requests` | SRV-02 | Authenticated buyer/requesting party; published listing is public but request is protected | `201` quote-request projection |
| SRV-LST-API-03 | POST | `/api/v1/services/quote-requests/{quoteRequestId}/quotes` | SRV-03 | Seller or authorized representative owning request target | `201` immutable quote version |
| SRV-LST-API-04 | POST | `/api/v1/services/quotes/{quoteId}/accept` | SRV-04 | Buyer/eligible approver on request; same human cannot represent both parties | `201` engagement projection |

### Transport Invariants

All routes use HTTPS, JSON UTF-8, `Content-Type: application/json`, `X-Request-Id`, `Idempotency-Key`, and `If-Match` where `expected_version` is supplied. Hono rejects unknown JSON keys through strict Zod 4 schemas, body size over 256 KiB, malformed UUIDs, and unsupported media types. Responses include `X-Request-Id`, `ETag: "v<version>"`, and the BE00 envelope. Public listing fields never include private request text, payment credentials, protected commercial values, or evidence bytes.

### External Seams

| Seam | Exact request | Exact response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---|---:|---|---|
| Shard 07 taxonomy gate | `{ craftId: uuid, taxonomyVersion: string }` | `{ craftId: uuid, active: boolean, roleClass: string, version: string }` | 300 ms | 2 retries at 50 ms, 100 ms; only read/idempotent | Open after 5 failures/30 s; `LISTING_GATE_FAILED` is fail-closed; probe restores publication. |
| Shard 01 party/mandate check | `{ actorPersonId: uuid, actingPartyId: uuid, actingContextVersion: string, capability: string }` | `{ allowed: boolean, principalPartyId: uuid, contextVersion: string }` | 500 ms | 2 retries at 75 ms, 150 ms | Open 30 s; stale or unknown result is `ACTING_CONTEXT_STALE`, never authorization success. |
| BE00 payment authorization (SRV-LST-API-04) | `{ engagementKey: uuid, buyerPartyId: uuid, amountMinor: int64, currency: string, idempotencyKey: string }` | `{ authorizationId: uuid, status: 'authorized'|'pending'|'declined', providerReference: string }` | 2,000 ms | 2 retries at 250 ms, 500 ms; same idempotency key | Open 60 s; pending is reconciled by BE00 job, and no engagement is exposed until authorized. |
| Shard 10 rights posture validation (SRV-LST-API-01) | `{ tierId: uuid, master: MasterPosture, composition: CompositionPosture, determiningFacts: object }` | `{ valid: boolean, validationId: uuid, reasonCode?: string }` | 800 ms | 2 retries at 100 ms, 250 ms; deterministic request | Open 45 s; `RIGHTS_EXECUTION_FAILED`/`LISTING_GATE_FAILED` is returned and no live version is written. |
| Shard 13 `RecordHandoffOutcome` callback | `{ handoffId: uuid, handoffMode: string, engagementId: uuid, terminalState: string, expectedVersion: int, idempotencyKey: string }` | `{ handoffId: uuid, state: string, downstreamIds: uuid[], version: int }` | 800 ms | 2 retries at 150 ms, 400 ms; callback key is idempotent | Open 45 s; durable retry/escalation preserves Shard 13 facts and returns `DEPENDENCY_UNAVAILABLE` only when no callback result is known. |

## Request/Response Contracts

All schemas below are Zod 4 schemas. Every failure uses the BE00/global error envelope exactly: `ApiError { code, message, requestId, details }`.

### Shared and operation schemas

```ts
type BE00JsonValue = string | number | boolean | null | BE00JsonValue[] | { [key: string]: BE00JsonValue };
const BE00JsonPrimitive = z.union([z.string().max(2048), z.number().finite(), z.boolean(), z.null()]);
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([BE00JsonPrimitive, z.array(BE00JsonValueSchema).max(64), z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema)]));
const RightsParameters = z.object({ territory: z.string().length(2).regex(/^[A-Z]{2}$/).optional(), termDays: z.number().int().min(1).max(3650).optional(), mediaUse: z.enum(["stream", "download", "broadcast", "sync", "live"]).optional(), exclusivity: z.enum(["none", "non_exclusive", "exclusive"]).optional(), deliveryFormat: z.enum(["stereo", "stems", "multitrack", "score"]).optional() }).strict();
const QuoteScope = z.object({ territory: z.string().length(2).regex(/^[A-Z]{2}$/).optional(), deliverableIds: z.array(z.string().uuid()).max(128).optional(), usage: z.array(z.enum(["stream", "download", "broadcast", "sync", "live"])).min(1).max(16).optional(), start: z.string().datetime({ offset: true }).optional(), end: z.string().datetime({ offset: true }).optional() }).strict().refine(v => Object.keys(v).length > 0);
const CommandContext = z.object({
  actor_person_id: z.string().uuid(),
  acting_party_id: z.string().uuid(),
  acting_context_version: z.string().min(1).max(128),
  idempotency_key: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  request_id: z.string().uuid(),
  expected_version: z.number().int().positive().optional(),
}).strict();

const MasterPosture = z.enum(['assignment', 'licence', 'co_ownership', 'points']);
const CompositionPosture = z.enum(['creates_none', 'assignment', 'co_ownership', 'licence']);
const PricingShape = z.enum(['flat', 'per_unit', 'hourly', 'day_halfday', 'tiered_volume', 'minimum_plus', 'points', 'hybrid']);
const ApiErrorSchema = z.object({
  code: z.string().min(1), message: z.string().min(1), requestId: z.string().uuid(), details: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/), BE00JsonValueSchema),
}).strict(); // ApiError { code, message, requestId, details }

const PublishListingRequest = CommandContext.extend({
  primary_craft_id: z.string().uuid(),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(5000),
  facets: z.array(z.string().trim().min(1).max(64)).max(32),
  pricing: z.object({ shape: PricingShape, currency: z.string().regex(/^[A-Z]{3}$/), minimum_amount: z.number().nonnegative(), tiers: z.array(z.object({ threshold: z.number().int().positive(), amount: z.number().nonnegative() }).strict()).max(32) }).strict(),
  exclusions: z.array(z.string().trim().min(1).max(240)).max(32),
  add_ons: z.array(z.object({ code: z.string().regex(/^[a-z0-9_-]{1,48}$/), price: z.number().nonnegative() }).strict()).max(32),
  rights_postures: z.array(z.object({ tier_id: z.string().uuid(), master: MasterPosture, composition: CompositionPosture, parameters: RightsParameters.default({}) }).strict()).min(1).max(16),
  recall_policy_version_id: z.string().uuid().optional(),
}).strict();
const PublishListingSuccess = z.object({ listing_id: z.string().uuid(), listing_version_id: z.string().uuid(), version: z.number().int().positive(), state: z.literal('published'), event_id: z.string().uuid() }).strict();

const QuoteRequestRequest = CommandContext.extend({
  listing_id: z.string().uuid(), listing_version: z.number().int().positive(),
  scope: QuoteScope, desired_start: z.string().datetime().optional(), desired_end: z.string().datetime().optional(),
  requester_note: z.string().trim().max(4000).optional(), anonymity_level: z.enum(['open', 'delayed', 'aliased', 'sealed']).default('open'),
}).strict();
const QuoteRequestSuccess = z.object({ quote_request_id: z.string().uuid(), listing_id: z.string().uuid(), listing_version: z.number().int().positive(), state: z.literal('pending'), event_id: z.string().uuid() }).strict();

const IssueQuoteRequest = CommandContext.extend({
  quote_request_id: z.string().uuid(), expires_at: z.string().datetime(), scope: QuoteScope,
  price: z.object({ currency: z.string().regex(/^[A-Z]{3}$/), amount: z.number().nonnegative(), line_items: z.array(z.object({ code: z.string().min(1).max(64), amount: z.number().nonnegative() }).strict()).min(1).max(64) }).strict(),
  recall_terms: z.object({ policy_version_id: z.string().uuid(), origin: z.enum(['craft_seed', 'seller_override']), author_party_id: z.string().uuid(), count: z.number().int().min(0).max(5), window_days: z.number().int().min(0).max(90) }).strict(),
  rights_postures: z.array(z.object({ tier_id: z.string().uuid(), master: MasterPosture, composition: CompositionPosture, parameters: RightsParameters.default({}) }).strict()).min(1).max(16),
}).strict().superRefine((v, ctx) => { if ((v.recall_terms.count === 0) !== (v.recall_terms.window_days === 0)) ctx.addIssue({ code: 'custom', path: ['recall_terms'], message: 'window_days is zero iff count is zero' }); if (v.recall_terms.count > 0 && (v.recall_terms.window_days < 7 || v.recall_terms.window_days > 90)) ctx.addIssue({ code: 'custom', path: ['recall_terms','window_days'], message: 'positive window is 7..90 days' }); });
const IssueQuoteSuccess = z.object({ quote_id: z.string().uuid(), quote_version: z.number().int().positive(), expires_at: z.string().datetime(), terms_hash: z.string().regex(/^[a-f0-9]{64}$/), state: z.literal('issued'), event_id: z.string().uuid() }).strict();

const AcceptQuoteRequest = CommandContext.extend({
  quote_id: z.string().uuid(), quote_version: z.number().int().positive(), terms_hash: z.string().regex(/^[a-f0-9]{64}$/),
  recall_acknowledged: z.literal(true), payment_method_token: z.string().min(16).max(256), buyer_confirmed_scope: z.literal(true),
}).strict();
const AcceptQuoteSuccess = z.object({ engagement_id: z.string().uuid(), engagement_version: z.literal(1), state: z.literal('requirements'), payment_authorization_id: z.string().uuid(), event_id: z.string().uuid() }).strict();
const ErrorResponse = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error schema/status |
|---|---|---|---|
| SRV-LST-API-01 | `PublishListingRequest` | `PublishListingSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,409,422,429,503` |
| SRV-LST-API-02 | `QuoteRequestRequest` | `QuoteRequestSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-LST-API-03 | `IssueQuoteRequest` | `IssueQuoteSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| SRV-LST-API-04 | `AcceptQuoteRequest` | `AcceptQuoteSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation | Required validation and invariant |
|---|---|
| SRV-LST-API-01 | Exactly one active primary craft; currency is ISO-4217 uppercase; pricing shape is closed; at least one tier has both rights postures; all posture parameters are shape-checked; recall policy is an existing platform version; live craft fields are immutable after publish. |
| SRV-LST-API-02 | Listing/version must be published and readable; desired interval is ordered; scope is structured and bounded; requester note is private; anonymity failures retain the more restrictive level. |
| SRV-LST-API-03 | Seller owns request target; expiry is future and bounded by 30 days; quote terms are a complete immutable snapshot; recall count is 0..5 and positive window 7..90; seller override can only reduce or explicitly change the allowance with a material diff. |
| SRV-LST-API-04 | Exact quote version/hash and unexpired quote; material recall acknowledgement; payment authorization; no same-human two-sided representation; minors require verified guardian co-signatory; CAS on quote and request state. |

### Error, authorization, idempotency, rate, and observability matrix

| Operation | Status/code matrix (all bodies are `ApiError { code, message, requestId, details }`) | Authorization and 403/404 rule | Idempotency / rate / observability |
|---|---|---|---|
| SRV-LST-API-01 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `409 VERSION_CONFLICT` or `IDEMPOTENCY_MISMATCH`; `422 LISTING_GATE_FAILED`/`RIGHTS_EXECUTION_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 403 when authenticated seller lacks capability or mandate; 404 only if listing target is intentionally undiscoverable (no existence oracle) | 24h key + canonical request hash; 30 writes/min/party; log `operationId`, requestId, listingId, actorPartyId, resultCode, version; never log description or prices. |
| SRV-LST-API-02 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 LISTING_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 LISTING_GATE_FAILED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for unpublished/unknown listing projection; 403 only for known listing with a denied requester capability | 24h key; 60 requests/min/requester; trace listing version and policy decision; redact requester note. |
| SRV-LST-API-03 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 QUOTE_REQUEST_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 RECALL_TERMS_INVALID`/`QUOTE_EXPIRED`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 hides another seller's request; 403 for authenticated seller lacking mandate on an otherwise visible request | 24h key; 20 quote writes/min/seller; trace quoteRequestId, listingVersion, policyVersion, termsHash; never log protected amounts. |
| SRV-LST-API-04 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 SELF_ACCEPTANCE_FORBIDDEN`/`FORBIDDEN`; `404 QUOTE_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 QUOTE_EXPIRED`/`PAYMENT_AUTH_FAILED`/`ACTING_CONTEXT_STALE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 404 for quote not visible to buyer; 403 for visible quote where buyer lacks approval or is seller-side; self-dealing is explicit 403 | 24h key bound to quote/version/hash; 10 accepts/hour/buyer; trace quoteId, paymentAuthorizationId, engagementId; credentials and exact protected values excluded. |

## Database Schema

### PostgreSQL model registry

All tables live in the service domain schema and use UUID primary keys. `created_at`/`updated_at` are `timestamptz NOT NULL`; `version` is `integer NOT NULL CHECK (version > 0)`. JSON fields are validated at the command boundary and constrained to object/array shapes in database checks.

| Canonical model | Typed fields, nullability, constraints, foreign keys, and indexes |
|---|---|
| `service_listing` | `id uuid PK`; `seller_party_id uuid NOT NULL FK party.id`; `primary_craft_id uuid NOT NULL FK taxonomy_craft.id`; `state text NOT NULL CHECK (state IN ('draft','published','paused','retired'))`; `current_version integer NOT NULL CHECK (>0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Indexes: `(seller_party_id,state)`, partial `(primary_craft_id) WHERE state='published'`. RLS: seller/mandate owner and public published projection. |
| `listing_version` | `id uuid PK`; `listing_id uuid NOT NULL FK service_listing.id ON DELETE RESTRICT`; `version integer NOT NULL CHECK (>0)`; `title varchar(140) NOT NULL`; `description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 5000)`; `facets jsonb NOT NULL CHECK (jsonb_typeof(facets)='array')`; `rights_postures jsonb NOT NULL CHECK (jsonb_typeof(rights_postures)='array')`; `pricing_model_version_id uuid NOT NULL FK pricing_model_version.id`; `recall_policy_version_id uuid NULL FK recall_policy_version.id`; `immutable_at timestamptz NOT NULL`; `terms_hash bytea NOT NULL CHECK (octet_length(terms_hash)=32)`. Unique `(listing_id,version)`; index `(listing_id,version DESC)`. RLS: owner writes only while draft; published projection read. |
| `pricing_model_version` | `id uuid PK`; `listing_version_id uuid NOT NULL FK listing_version.id`; `shape text NOT NULL CHECK (shape IN ('flat','per_unit','hourly','day_halfday','tiered_volume','minimum_plus','points','hybrid'))`; `currency char(3) NOT NULL CHECK (currency ~ '^[A-Z]{3}$')`; `minimum_amount numeric(12,2) NOT NULL CHECK (minimum_amount>=0)`; `tiers jsonb NOT NULL`; `tax_mode text NOT NULL CHECK (tax_mode IN ('included','added','not_applicable'))`; `valid_from timestamptz NOT NULL`; `terms_hash bytea NOT NULL CHECK (octet_length(terms_hash)=32)`. Unique `(listing_version_id)`; index `(currency,valid_from DESC)`. RLS: owner insert/read; no update/delete after referenced. |
| `quote_request` | `id uuid PK`; `requester_party_id uuid NOT NULL FK party.id`; `seller_party_id uuid NOT NULL FK party.id`; `listing_id uuid NOT NULL FK service_listing.id`; `listing_version_id uuid NOT NULL FK listing_version.id`; `scope jsonb NOT NULL CHECK (jsonb_typeof(scope)='object')`; `requester_note text NULL CHECK (char_length(requester_note)<=4000)`; `anonymity_level text NOT NULL CHECK (anonymity_level IN ('open','delayed','aliased','sealed'))`; `state text NOT NULL CHECK (state IN ('pending','quoted','withdrawn','expired','accepted'))`; `version integer NOT NULL CHECK (>0)`; `idempotency_key varchar(128) NOT NULL`; `created_at timestamptz NOT NULL`. Unique `(requester_party_id,idempotency_key)`; indexes `(seller_party_id,state)`, `(listing_id,created_at DESC)`. RLS: requester and target seller only; note never public. |
| `quote_version` | `id uuid PK`; `quote_request_id uuid NOT NULL FK quote_request.id`; `quote_number integer NOT NULL CHECK (>0)`; `pricing_model_version_id uuid NOT NULL FK pricing_model_version.id`; `scope jsonb NOT NULL`; `price_currency char(3) NOT NULL`; `price_amount numeric(12,2) NOT NULL CHECK (price_amount>=0)`; `line_items jsonb NOT NULL`; `expires_at timestamptz NOT NULL CHECK (expires_at>created_at)`; `recall_policy_version_id uuid NULL FK recall_policy_version.id`; `recall_origin text NULL CHECK (recall_origin IN ('craft_seed','seller_override'))`; `recall_author_party_id uuid NULL FK party.id`; `recall_count smallint NOT NULL CHECK (recall_count BETWEEN 0 AND 5)`; `recall_window_days smallint NOT NULL CHECK (recall_window_days BETWEEN 0 AND 90)`; `terms_hash bytea NOT NULL CHECK (octet_length(terms_hash)=32)`; `state text NOT NULL CHECK (state IN ('issued','expired','accepted','replaced'))`; `created_at timestamptz NOT NULL`. Unique `(quote_request_id,quote_number)` and `terms_hash`; indexes `(quote_request_id,created_at DESC)`, `(expires_at) WHERE state='issued'`. RLS: buyer and seller parties; no anonymous reads. |
| `quote_acknowledgement` | `id uuid PK`; `quote_version_id uuid NOT NULL FK quote_version.id`; `buyer_party_id uuid NOT NULL FK party.id`; `terms_hash bytea NOT NULL CHECK (octet_length(terms_hash)=32)`; `recall_acknowledged boolean NOT NULL CHECK (recall_acknowledged)`; `acting_context_version varchar(128) NOT NULL`; `acknowledged_at timestamptz NOT NULL`; `created_at timestamptz NOT NULL`. Unique `(quote_version_id,buyer_party_id)`; index `(buyer_party_id,acknowledged_at DESC)`. RLS: buyer and service worker; direct client grants none. |
| `engagement` | `id uuid PK`; `quote_version_id uuid NOT NULL UNIQUE FK quote_version.id`; `buyer_party_id uuid NOT NULL FK party.id`; `seller_party_id uuid NOT NULL FK party.id`; `listing_version_id uuid NOT NULL FK listing_version.id`; `state text NOT NULL CHECK (state IN ('requirements','active','buyer_wait','seller_work','delivered','revision','accepted','auto_accepted','cancelled','abandoned','mutually_released','closed'))`; `pinned_scope jsonb NOT NULL`; `pinned_recall_policy_version_id uuid NULL FK recall_policy_version.id`; `pinned_recall_origin text NULL`; `pinned_recall_author_party_id uuid NULL FK party.id`; `pinned_recall_count smallint NOT NULL CHECK (pinned_recall_count BETWEEN 0 AND 5)`; `pinned_recall_window_days smallint NOT NULL CHECK (pinned_recall_window_days BETWEEN 0 AND 90)`; `payment_authorization_id uuid NOT NULL`; `due_at timestamptz NULL`; `version integer NOT NULL CHECK (>0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Indexes `(buyer_party_id,state)`, `(seller_party_id,state)`, `(state,due_at)`. RLS: both parties for safe projection; protected terms only service role/party capability. |

### State and transaction rules

`PublishListing` writes `service_listing`, `listing_version`, and `pricing_model_version` in one transaction after taxonomy and rights gates; it never updates an issued `quote_version`. `IssueQuote` inserts a new immutable `quote_version` and moves the request with a compare-and-swap on `quote_request.version`. `AcceptQuote` verifies exact quote version/hash, inserts `quote_acknowledgement`, authorizes payment, and inserts `engagement` while moving quote/request state under one serializable transaction. A provider timeout leaves an internal pending effect for BE00 reconciliation and does not expose a partial engagement. Retries with the same key return the stored result; key reuse with a different canonical hash is `IDEMPOTENCY_MISMATCH`.

### Grants and RLS

Anonymous clients receive only a published listing safe projection. Authenticated clients receive their own party projection through database functions; direct table grants are denied. Service workers use narrowly scoped command functions and cannot bypass party/mandate checks. RLS predicates require `auth.uid()` mapped to the actor person and the effective party; seller notes, buyer notes, payment references, protected prices, and determining facts are excluded from public projections. `service_role` is reserved for migrations and worker execution and is never exposed to browsers.

## Middleware & Policies

### Authorization matrix

| Operation | Allowed authority | 403 condition | 404 condition |
|---|---|---|---|
| SRV-LST-API-01 | Seller or disclosed agency mandate with listing capability; platform taxonomy gate | Authenticated actor lacks seller capability, mandate, or rights gate | No listing target is supplied; no resource lookup is needed |
| SRV-LST-API-02 | Buyer/requester on authenticated command; public listing projection read | Known policy blocks requester or age/guardian gate fails | Listing/version is unpublished, retired, or not visible |
| SRV-LST-API-03 | Seller/mandate owner of the request target | Target seller known but actor lacks mandate | Request belongs to a different seller or is not discoverable |
| SRV-LST-API-04 | Buyer/eligible approver for the quote request | Seller-side actor, same-human two-sided attempt, or failed guardian/capability check | Quote is outside buyer visibility scope |

### Per-operation middleware and CORS

The ordered chain is `requestId → strictCors(registered web origins; credentials only for same-site, no wildcard) → securityHeaders → bodyLimit → contentType → rateLimit → auth → actingContext → zod → capability/ownership → policy/evidence gates → idempotency → If-Match/CAS → handler → audit/outbox`. Each operation has an explicit chain:

| Operation | Middleware, including named CORS policy |
|---|---|
| SRV-LST-API-01 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(256KiB) → contentType(json) → rateLimit(listing-publish) → auth → actingContext → zod(PublishListingRequest) → seller-mandate → taxonomy+rights gate → idempotency → If-Match → handler → audit/outbox`. |
| SRV-LST-API-02 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(64KiB) → contentType(json) → rateLimit(quote-request) → auth → actingContext → zod(QuoteRequestRequest) → listing-publication+age gate → idempotency → handler → audit/outbox`. |
| SRV-LST-API-03 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(quote-issue) → auth → actingContext → zod(IssueQuoteRequest) → seller-ownership+policy gate → idempotency → If-Match → handler → audit/outbox`. |
| SRV-LST-API-04 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(quote-accept) → auth → actingContext → zod(AcceptQuoteRequest) → buyer-ownership+self-dealing+guardian gates → idempotency → If-Match/CAS → payment authorization → handler → audit/outbox`. |

### Rate, abuse, privacy, and security policy

Rate keys are effective party plus actor person plus route; failed authentication uses IP and account buckets. Listing and quote text is length-limited and HTML-escaped; no user-supplied URL is fetched server-side. Payment tokens are accepted only as opaque provider tokens and are never persisted. Repeated quote reissue, policy override, self-dealing, or cross-party probing emits a redacted security audit event and may quarantine the actor. Sealed anonymity suppresses public credit while retaining protected audit facts. Known under-18 professional transactions require a verified guardian co-signatory; absence blocks the command.

## Data Flow

1. Hono binds request ID, CORS, auth, acting context, strict Zod schema, rate bucket, and idempotency record.
2. Handler loads only the requested version under RLS, calls the applicable taxonomy/mandate/rights seam, and evaluates closed vocabularies and age policy.
3. A serializable Supabase transaction writes the owning model rows and an outbox event; transaction commit is the publication point.
4. BE00 outbox delivers the event with at-least-once semantics. Consumers use `(event_type,event_id)` dedupe and immutable version projections.
5. Provider uncertainty is represented as pending internal effect; reconciliation either commits the stored result or compensates without changing a published quote/listing snapshot.

## Events and Consumer Contracts

| Event type | Producer and trigger | Versioned payload and exclusions | Consumers / delivery |
|---|---|---|---|
| `service.listing.changed.v1` | `SRV-LST-API-01` after listing/version commit | `{ eventId, occurredAt, listingId, sellerPartyId, primaryCraftId, state, listingVersion, termsHash, schemaVersion }`; excludes description, private notes, exact protected prices, credentials, and media bytes | Browse/search, benchmarks, and policy caches; outbox retry 5 times with 1/5/30/300/900 s backoff then dead-letter. |
| `service.quote.changed.v1` | `SRV-LST-API-02`/`03`/`04` after request, issue, replacement, or acceptance | `{ eventId, occurredAt, quoteId, quoteRequestId, buyerPartyId, sellerPartyId, state, expiresAt, recallPolicyVersionId, recallOrigin, recallAuthorPartyId, recallCount, recallWindowDays, quoteVersion, termsHash, schemaVersion }`; excludes free text, payment credentials, and exact protected amounts | Buyer/seller projections, notifications, and engagement worker; consumer dedupe by event ID and quote version. |
| `service.engagement.changed.v1` | `SRV-LST-API-04` after atomic engagement creation | `{ eventId, occurredAt, engagementId, buyerPartyId, sellerPartyId, state, dueAt, paymentGate: 'authorized', version, schemaVersion }`; excludes payment credentials and protected terms | Parties, requirements/tasks, downstream Shards 07/10/18; unknown event version is quarantined, not applied. |
| `opportunity.handoff.changed.v1` | Inbound Shard 13 handoff fact; it can seed context for a quote/request but never creates authority or an engagement by itself | `{ eventId, handoffId, opportunityId, targetPartyId, state, handoffMode, version, schemaVersion }`; excludes private pitch/evidence and unrestricted PII | SRV-LST-API-02/04 may consume the immutable fact; this split calls Shard 13 `RecordHandoffOutcome` only after its own engagement result, with 2 retries at 150 ms/400 ms, then durable retry/escalation. |

All events use the BE00 lossless envelope, an outbox row in the same transaction, `aggregate_version`, and a redacted payload hash. Consumers never treat a listing template as engagement truth; they read the pinned quote/engagement projection.

## Error Handling and Failure Recovery

| Failure | Deterministic response and recovery |
|---|---|
| Malformed/unknown field | `400 VALIDATION_FAILED`; no database or provider call; details identify field paths without echoing secrets. |
| Stale acting context or ETag | `422 ACTING_CONTEXT_STALE` or `409 VERSION_CONFLICT`; reload is required; no write occurs. |
| Listing/craft/rights gate unavailable or invalid | `422 LISTING_GATE_FAILED` or `RIGHTS_EXECUTION_FAILED`; fail closed; retry after circuit recovery. |
| Quote expiry or changed terms | `422 QUOTE_EXPIRED` or `409 VERSION_CONFLICT`; buyer must acknowledge a newly issued version. |
| Same-human self-acceptance | `403 SELF_ACCEPTANCE_FORBIDDEN`; audit event records actor and parties, no state change. |
| Payment timeout/decline | `422 PAYMENT_AUTH_FAILED` for definitive decline; timeout remains pending in BE00 reconciliation and leaves quote issued. |
| Duplicate idempotency key | Stored response returned byte-for-byte for same hash; `409 IDEMPOTENCY_MISMATCH` for different hash. |
| Outbox delivery failure | Transaction remains committed; worker retries with exponential backoff, then dead-letters and pages; replay is safe by event ID. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract and handler tests | Authorization/RLS and failure tests |
|---|---|---|
| SRV-LST-API-01 | PublishListing schema, taxonomy/rights gate, immutable listing version, price/posture hash, idempotent replay | Seller/mandate/age matrix, public projection redaction, 403/404, provider timeout and outbox replay |
| SRV-LST-API-02 | QuoteRequest schema, published-version pin, interval validation, anonymity policy, idempotent replay | Buyer/listing visibility matrix, 403/404, rate bucket, private note redaction, stale listing recovery |
| SRV-LST-API-03 | IssueQuote schema, expiry/recall invariant, immutable version/reissue diff, CAS and idempotent replay | Seller mandate/target visibility, 403/404, policy gate failure, protected price telemetry |
| SRV-LST-API-04 | AcceptQuote schema, exact version/hash, acknowledgement, payment/engagement atomicity, self-dealing and expiry | Buyer/guardian/two-sided matrix, 403/404, payment timeout/decline, duplicate provider callback |

Cross-operation test-level matrix:

| Level | Required tests |
|---|---|
| Contract | Zod 4 accepts each valid request and rejects unknown keys, invalid UUIDs, malformed currency, out-of-range recall windows, missing rights parameters, and false acknowledgement. Snapshot success and `ApiError { code, message, requestId, details }` envelopes. |
| Handler | Four operation IDs each return documented status/body; listing version immutability, quote expiry, exact hash acknowledgement, reissue diff, and atomic engagement creation are covered. |
| Authorization / RLS | Seller, buyer, mandate, contributor, guardian, anonymous, and same-human two-sided matrices; verify 403 versus 404 and no protected-field projection. |
| Persistence / concurrency | Unique version and idempotency constraints; concurrent issue/accept CAS; payment timeout compensation; outbox atomicity; RLS direct-table denial. |
| Property / abuse | Price arithmetic never sums cash and rights; recall count/window invariant; canonical idempotency hash; rate buckets; payload redaction; fuzz JSON limits. |
| Integration | Taxonomy, Shard 01, Shard 10, and BE00 seams use exact timeout/retry/breaker profiles; provider duplicate callbacks do not duplicate engagement. |
| Observability | Every operation emits requestId/operationId/actor/party/resource/version/result metrics and trace spans; secrets, notes, and protected amounts are absent. |

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** closed enums, UUIDs, currency, amount precision, recall count/window, terms hash, and guardian gate are schema-enforced.
- **Pass 2 — macro contract:** all four IA interactions map to one stable route; quote acceptance is the only engagement creation path in this split; downstream ownership remains explicit.
- **Pass 3 — race/recovery:** CAS, idempotency hash, payment pending state, outbox dedupe, and circuit recovery are specified.
- **Pass 4 — privacy/security:** RLS, protected projections, sealed anonymity, mandate checks, CORS, body limits, and redacted telemetry are specified per route.

## Ambiguity Gate

**PASS.** Four IA interactions are reconciled one-to-one with stable operation IDs and routes. Each operation has strict Zod 4 request/success/error contracts, explicit CORS/auth/rate/validation middleware, 403-vs-404 behavior, idempotency, persistence constraints, event consumers, and recovery behavior. Listing, quote, and engagement states and every cross-shard seam have deterministic ownership and failure outcomes; no product or architecture decision remains for implementation.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored the listings, quote-request, quote-version, acknowledgement, and engagement backend split from IA Shard 14. | `/write-be-spec` | All |
| 2026-08-28 | Added per-operation route, Zod 4, CORS, authorization, persistence, event, and recovery contracts. | `/write-be-spec-write` | API, Database, Middleware, Events, Tests |

## Dependency References

- [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md): global `ApiError`, request IDs, idempotency, Hono middleware order, Supabase transaction/RLS, outbox, and provider recovery.
- [IA Shard 14 — Services marketplace lifecycle](../ia/14-services-marketplace.md): source interaction, contract, model, access, event, and edge-case truth.
- [IA Deep Dive 14 — Services marketplace lifecycle](../ia/deep-dives/14-services-marketplace.md): canonical fields, state machines, quote acceptance algorithm, and abuse recovery.
- Shards 01, 07, and 10: party/mandate, taxonomy, and rights posture validation seams named in `External Seams`.
