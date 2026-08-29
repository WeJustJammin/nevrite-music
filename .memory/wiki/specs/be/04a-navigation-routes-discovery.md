# CMS Navigation, Routes & Discovery — Backend Specification

**Status:** Complete
**IA source:** [Shard 04 — CMS navigation, media and delivery](../ia/04-cms-delivery-media.md)
**Deep-dive source:** [Deep Dive 04 — CMS navigation, media and delivery](../ia/deep-dives/04-cms-delivery-media.md)
**Backend foundation:** [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md)

## Split Group

This split owns editable menu trees, complete menu activation, canonical slug/redirect manifests, and policy-constrained discovery metadata. It contains DLV-01–DLV-04. Governed media/renditions (DLV-05–DLV-08) and public delivery/cache/projection workers (DLV-09–DLV-14) remain in sibling splits.

## Classification

- **Type:** CMS navigation and metadata command split.
- **Boundary:** `Menu`, `MenuVersion`, `MenuItemVersion`, `RouteRecord`, `RedirectRecord`, and `DiscoveryMetadataVersion` ownership; publication truth and policy adjudication remain in Shard 03/05 and delivery effects remain in 04c.
- **Expected operations:** four HTTP operations, one-to-one with IA interactions DLV-01, DLV-02, DLV-03, and DLV-04.
- **Approval:** delegated authority for the bounded cross-range assist; 04b is owned by another writer and is not edited.
- **Decision lock:** whole-tree activation, normalized canonical routes, bounded redirect graphs, and policy-last discovery overrides are mandatory.

## IA Feature Coverage

The three bullets in IA Shard 04 `§ Features` (lines 24–29) are reconciled across the approved companion split. Media and delivery features remain explicit companion boundaries rather than unrecorded omissions.

| IA feature (exact source title) | Owning companion | Operation coverage | Disposition |
|---|---|---|---|
| **25.04 Navigation, Routes & Discovery Metadata** | 04a | DLV-01–DLV-04; DLV-NAV-API-01–04 | Complete here: menu trees, route/redirect manifests, slugs, and policy-last discovery metadata are authored. |
| **25.06 Media Library & Asset Governance** | 04b | DLV-05–DLV-08; DLV-MEDIA-API-01–04 | Complete in companion 04b: private ingest, scanning, immutable renditions, accessibility, rights, replacement, archive/takedown, and hold are authored there. |
| **25.09 Content Delivery, Preview & Cache Coherence** | 04c | DLV-09–DLV-14; DLV-DEL-API-01–06 | Complete in companion 04c: render-ready reads, exact-version preview, publication/invalidation, last-known-good delivery, and fail-closed recovery are authored there. |

## Referenced Material Inventory

| Source file | Section / lines | Material used in this specification |
|---|---|---|
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Overview and Features, lines 9–29 | CMS delivery boundary and navigation/route/discovery feature scope. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Interactions, lines 47–65 | DLV-01–DLV-04 preconditions, outcomes, rejection rules, and recovery. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Contracts, lines 74–87 | Named locations, menu limits, target kinds, visibility predicates, reserved routes, and slug/redirect rules. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Contracts, lines 101–109 | Projection/privacy/degraded-delivery constraints consumed by route and discovery records. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Data Models, lines 111–131 | Canonical model names and navigation/route/discovery relationships. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Typed Field and Cardinality Registry, lines 133–152 | UUID/time/version/checksum typing and cardinality/immutability rules. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Access Control and Access Escalation, lines 154–178 | Navigation editor, CMS publisher, public visitor, preview, and delivery-principal authority. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Accessibility, lines 180–188 | Keyboard-equivalent tree editing, labels, focus, current-page state, and truthful unavailable states. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Event Schemas, lines 190–202 | `delivery.menu.activated.v1` and `delivery.route.changed.v1` payload/consumer contracts. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Edge Cases, lines 204–229 | Cycle/orphan/depth, target privacy, slug collisions/loops, SEO policy override, and stale-manifest recovery. |
| `.memory/wiki/specs/ia/04-cms-delivery-media.md` | Cross-Shard Dependencies, lines 254–258 | Shard 03/05 ownership and downstream delivery boundaries. |
| `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md` | Canonical Field Contracts, lines 20–32 | Typed menu, item, route, redirect, and discovery fields. |
| `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md` | State Machines, lines 56–65 | Menu/route/discovery lifecycle and immutable-active rules. |
| `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md` | Route and Menu Compilation, lines 67–74 | Normalization, target resolution, tree validation, redirect graph, policy override, and whole-manifest activation. |
| `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md` | Concurrency and Idempotency, lines 120–129 | Manifest leases, expected versions, idempotency, and stale builder fencing. |
| `.memory/wiki/specs/ia/deep-dives/04-cms-delivery-media.md` | Abuse and Recovery Verification, lines 130–142 | Unsafe targets, leakage, route tampering, accessibility, and recovery controls. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Request/Response Contracts, lines 112–201; Deterministic Protocol Rules, lines 330–353 | Zod 4 wire contracts, global `ApiError`, idempotency, ETag, body limits, and collection limits. |
| `.memory/wiki/specs/be/00-infrastructure.md` | Middleware & Policies, lines 253–298; Event and Consumer Contracts, lines 355–416 | Hono middleware order, CORS, RLS, outbox, and consumer retry behavior. |
| `.memory/wiki/specs/2026-08-02-architecture-design.md` | API Design, lines 359–376; Security Model, lines 709–790 | Hono/Cloudflare boundary, authorization, headers, rate limits, and privacy controls. |

## IA Source Map

| BE section | IA source / trace |
|---|---|
| Route registry and commands | Shard 04 IA `§ Interactions`, lines 47–65; `§ Contracts`, lines 74–87 |
| Menu, route, redirect, and discovery persistence | Shard 04 IA `§ Data Models`, lines 111–129; `§ Typed Field and Cardinality Registry`, lines 133–142 |
| Lifecycle and compiler algorithms | Deep Dive 04 `§ State Machines`, lines 56–65; `§ Route and Menu Compilation`, lines 67–74 |
| Roles, privacy, accessibility, and edge handling | Shard 04 IA `§ Access Control`, lines 154–178; `§ Accessibility`, lines 180–188; `§ Edge Cases`, lines 204–229 |
| Menu/route events | Shard 04 IA `§ Event Schemas`, lines 190–202 |
| Shared transport and reliability | BE00 `§ Request/Response Contracts`, lines 112–201; `§ Deterministic Protocol Rules`, lines 330–353; `§ Event and Consumer Contracts`, lines 355–416 |

## Endpoint Completeness Reconciliation

| IA interaction | BE operation ID | Method and path | Result |
|---|---|---|---|
| DLV-01 Create/edit menu tree | DLV-NAV-API-01 | `POST /api/v1/cms/menus/{menuId}/versions` | Reconciled: validates a bounded typed tree and writes a versioned draft while the active tree remains unchanged. |
| DLV-02 Publish menu version | DLV-NAV-API-02 | `POST /api/v1/cms/menus/{menuId}/versions/{menuVersionId}/publish` | Reconciled: checks approval, complete tree/hash/audiences, expected active manifest, and whole-location activation. |
| DLV-03 Create/change slug | DLV-NAV-API-03 | `POST /api/v1/cms/publications/{publicationId}/routes/slugs` | Reconciled: normalizes path, preserves canonical history, and commits reservation plus redirect atomically. |
| DLV-04 Configure discovery metadata | DLV-NAV-API-04 | `POST /api/v1/cms/publications/{publicationId}/discovery-metadata` | Reconciled: stores bounded metadata and applies privacy, suppression, embargo, legal, archive, and authorization overrides last. |

No operation is inherited without an operation ID. BE00 supplies transport, error, idempotency, RLS, and outbox behavior; it does not add a CMS navigation endpoint.

## API Endpoints

### Route Registry

| Operation ID | Method | Path | IA interaction | Auth / ownership | Success |
|---|---|---|---|---|---|
| DLV-NAV-API-01 | POST | `/api/v1/cms/menus/{menuId}/versions` | DLV-01 | Navigation editor for assigned menu/location; target publication/route ownership is checked | `201` draft menu version |
| DLV-NAV-API-02 | POST | `/api/v1/cms/menus/{menuId}/versions/{menuVersionId}/publish` | DLV-02 | CMS publisher with assigned location capability | `200` active menu/route manifest projection |
| DLV-NAV-API-03 | POST | `/api/v1/cms/publications/{publicationId}/routes/slugs` | DLV-03 | Navigation editor for target publication/locale | `200` route/redirect manifest projection |
| DLV-NAV-API-04 | POST | `/api/v1/cms/publications/{publicationId}/discovery-metadata` | DLV-04 | Navigation editor for target publication/locale | `200` discovery metadata version |

### Transport and external seams

All routes use HTTPS JSON, `X-Request-Id`, `Idempotency-Key`, `If-Match`, strict body limits, and BE00 error/outbox conventions. Unknown JSON keys, unsupported media types, malformed UUIDs, and oversized trees are rejected before database or provider effects.

| Seam | Exact request | Exact response | Timeout | Retry / backoff | Circuit breaker and recovery |
|---|---|---|---:|---|---|
| Shard 03 publication/route resolver | `{ publicationId: uuid, publicationVersion: bigint, locale: string, targetKind: string, targetId: uuid }` | `{ active: boolean, approved: boolean, visible: boolean, version: bigint, routeClass: string }` | 500 ms | 2 retries at 75 ms, 150 ms; read-safe | Open after 5 failures/30 s; unknown target fails closed with `TARGET_NOT_ELIGIBLE`; probe restores validation. |
| Shard 05 policy projection | `{ publicationId: uuid, locale: string, policyVersion: bigint, fields: string[] }` | `{ noindex: boolean, excludeSitemap: boolean, redactFields: string[], blockerCode: string|null, version: bigint }` | 500 ms | 2 retries at 75 ms, 150 ms; deterministic read | Open 30 s; unavailable policy forces noindex/exclusion and records a blocker, never editor values. |
| BE00 route compiler worker | `{ menuVersionId: uuid, manifestVersion: bigint, locale: string, audienceClass: string, treeHash: string }` | `{ routeManifestVersionId: uuid, state: 'ready'|'blocked'|'failed_retryable', routeHash: string, errorCode: string|null }` | 1,000 ms | 3 retries at 100 ms, 250 ms, 500 ms; lease/idempotency key | Open 45 s; stale builder cannot switch pointer; failed build keeps prior active manifest. |
| BE00 outbox/event registry | `{ aggregateId: uuid, aggregateVersion: bigint, eventType: string, payloadHash: string, idempotencyKey: string }` | `{ eventId: uuid, state: 'committed'|'pending'|'dead_lettered' }` | 500 ms | 3 retries at 100 ms, 250 ms, 500 ms | Open 60 s; committed domain rows remain authoritative and replay is keyed by event ID. |

## Request/Response Contracts

All schemas below are Zod 4 schemas. Every failure uses the BE00/global error envelope exactly: `ApiError { code, message, requestId, details }`.

### Shared and operation schemas

```ts
const CommandContext = z.object({
  actor_person_id: z.string().uuid(),
  acting_party_id: z.string().uuid(),
  acting_context_version: z.string().min(1).max(128),
  idempotency_key: z.string().regex(/^[A-Za-z0-9._:-]{16,128}$/),
  request_id: z.string().uuid(),
  expected_version: z.bigint().positive().optional(),
}).strict();

const LocationKey = z.enum(['primary', 'utility', 'footer', 'legal', 'account']);
const TargetKind = z.enum(['publication', 'internal_route', 'external_https']);
const VisibilityPredicate = z.enum(['always', 'anonymous', 'authenticated', 'locale', 'capability', 'entitlement', 'feature_available']);
const MenuTarget = z.object({
  target_kind: TargetKind, target_ref: z.string().trim().min(1).max(512),
  visibility: z.array(VisibilityPredicate).max(8),
}).strict();
const MenuItemInput = z.object({
  item_id: z.string().uuid(), parent_item_id: z.string().uuid().nullable(), position: z.number().int().min(0).max(199),
  label: z.string().trim().min(1).max(120), description: z.string().trim().max(500).optional(), icon_key: z.string().regex(/^[a-z0-9._-]{1,64}$/).optional(), target: MenuTarget,
}).strict();
const ApiErrorSchema = z.object({
  code: z.string().min(1), message: z.string().min(1), requestId: z.string().uuid(), details: z.record(z.string(), z.json()),
}).strict(); // ApiError { code, message, requestId, details }

const CreateMenuVersionRequest = CommandContext.extend({
  menu_id: z.string().uuid(), location_key: LocationKey, locale: z.string().regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})?$/), audience_class: z.string().regex(/^[a-z0-9_-]{1,48}$/),
  items: z.array(MenuItemInput).max(200), tree_hash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict().superRefine((v, ctx) => { const byId = new Set(v.items.map(i => i.item_id)); const children = new Map(); for (const i of v.items) { if (i.parent_item_id && !byId.has(i.parent_item_id)) ctx.addIssue({ code: 'custom', path: ['items'], message: 'parent must be in same candidate tree' }); children.set(i.parent_item_id ?? 'root', (children.get(i.parent_item_id ?? 'root') ?? 0) + 1); } if ([...children.values()].some(n => n > 50)) ctx.addIssue({ code: 'custom', path: ['items'], message: 'sibling limit exceeded' }); });
const CreateMenuVersionSuccess = z.object({ menu_id: z.string().uuid(), menu_version_id: z.string().uuid(), version: z.bigint().positive(), state: z.literal('draft'), tree_hash: z.string().regex(/^[a-f0-9]{64}$/), event_id: z.string().uuid() }).strict();

const PublishMenuVersionRequest = CommandContext.extend({
  menu_id: z.string().uuid(), menu_version_id: z.string().uuid(), expected_active_manifest_version: z.bigint().positive(), preview_tree_hash: z.string().regex(/^[a-f0-9]{64}$/), audiences: z.array(z.string().regex(/^[a-z0-9_-]{1,48}$/)).min(1).max(16),
}).strict();
const PublishMenuVersionSuccess = z.object({ menu_id: z.string().uuid(), menu_version_id: z.string().uuid(), route_manifest_version_id: z.string().uuid(), state: z.literal('active'), version: z.bigint().positive(), event_id: z.string().uuid() }).strict();

const SlugRequest = CommandContext.extend({
  publication_id: z.string().uuid(), locale: z.string().regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})?$/), current_path: z.string().regex(/^\/[a-z0-9][a-z0-9\/_-]{0,511}$/).optional(), proposed_path: z.string().min(2).max(512), target_version: z.bigint().positive(), redirect_status: z.union([z.literal(301), z.literal(308)]),
}).strict();
const SlugSuccess = z.object({ route_id: z.string().uuid(), route_manifest_version_id: z.string().uuid(), normalized_path: z.string().regex(/^\/[a-z0-9][a-z0-9\/_-]{0,511}$/), redirect_id: z.string().uuid().nullable(), state: z.literal('active'), version: z.bigint().positive(), event_id: z.string().uuid() }).strict();

const DiscoveryMetadataRequest = CommandContext.extend({
  publication_id: z.string().uuid(), locale: z.string().regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})?$/), title: z.string().trim().min(1).max(160), description: z.string().trim().max(320), canonical_url: z.string().url().max(2048), noindex: z.boolean(), social_asset_id: z.string().uuid().nullable(), breadcrumb: z.array(z.object({ label: z.string().trim().min(1).max(120), route_id: z.string().uuid() }).strict()).max(32), structured_data: z.record(z.string(), z.json()), policy_overrides: z.array(z.string().regex(/^[a-z0-9_-]{1,64}$/)).max(32),
}).strict();
const DiscoveryMetadataSuccess = z.object({ discovery_metadata_version_id: z.string().uuid(), publication_id: z.string().uuid(), locale: z.string().regex(/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{2,8})?$/), noindex: z.boolean(), sitemap_excluded: z.boolean(), blocker_code: z.string().regex(/^[a-z0-9_-]{1,64}$/).nullable(), version: z.bigint().positive(), event_id: z.string().uuid() }).strict();
const ErrorResponse = ApiErrorSchema;
```

### Operation Contract Matrix

| Operation ID | Request schema | Success schema/status | Error schema/status |
|---|---|---|---|
| DLV-NAV-API-01 | `CreateMenuVersionRequest` | `CreateMenuVersionSuccess` / `201` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| DLV-NAV-API-02 | `PublishMenuVersionRequest` | `PublishMenuVersionSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| DLV-NAV-API-03 | `SlugRequest` | `SlugSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |
| DLV-NAV-API-04 | `DiscoveryMetadataRequest` | `DiscoveryMetadataSuccess` / `200` | `ErrorResponse` (`ApiError { code, message, requestId, details }`) / `400,401,403,404,409,422,429,503` |

### Field Validation Matrix

| Operation | Required validation and invariant |
|---|---|
| DLV-NAV-API-01 | Location is one of `primary`, `utility`, `footer`, `legal`, `account`; tree depth is at most 3, item count at most 200, siblings at most 50; targets are active publications, approved internal routes, or allowlisted HTTPS URLs; visibility is bounded AND predicates; cycles/orphans, preview/admin/private targets, active schemes, sensitive client predicates, and missing keyboard-equivalent labels reject. |
| DLV-NAV-API-02 | Candidate is approved/complete; tree hash matches previewed responsive variants and each audience; expected active manifest version matches; target eligibility is rechecked; only a whole location activates; active versions are immutable and stale builders cannot switch the pointer. |
| DLV-NAV-API-03 | Path is Unicode NFC, locale-lowercase, slash-delimited safe segments; reserved `/api`, `/admin`, `/auth`, `/_astro`, `/.well-known`, `/health`, `/preview`, and code-declared prefixes reject; canonical collision, locale ambiguity, self-loop, cycle, and redirect chain over five hops reject; reservation and redirect commit together. |
| DLV-NAV-API-04 | Title/description/canonical/card/breadcrumb/structured-data values are bounded; publication policy resolves before commit; privacy, suppression, unclaimed, embargo, archive, legal, safety, and authorization policy overrides editor values; blocked facts force noindex/sitemap exclusion with a blocker and no protected existence leak. |

### Error, authorization, idempotency, rate, and observability matrix

| Operation | Status/code matrix (all bodies are `ApiError { code, message, requestId, details }`) | Authorization and 403/404 rule | Idempotency / rate / observability |
|---|---|---|---|
| DLV-NAV-API-01 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 MENU_NOT_FOUND` or target-safe not-found; `409 VERSION_CONFLICT` or `IDEMPOTENCY_MISMATCH`; `422 TARGET_NOT_ELIGIBLE`/`TREE_INVALID`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 403 for known assigned menu without editor capability; 404 for a menu outside actor projection or undiscoverable target | 24h key per menu/tree hash; 30 drafts/min/editor; trace operationId/menuVersionId/treeHash/result; never log labels, private target refs, or URLs. |
| DLV-NAV-API-02 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 MENU_VERSION_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 PUBLISH_BLOCKED`/`TREE_HASH_MISMATCH`/`TARGET_NOT_ELIGIBLE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 403 for visible candidate without publisher capability; 404 hides a candidate outside publisher scope | 24h key per candidate/hash/manifest version; 10 publishes/hour/location; trace manifest/version/readiness/error consumer; no draft fields. |
| DLV-NAV-API-03 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 PUBLICATION_NOT_FOUND`; `409 ROUTE_CONFLICT`/`VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 REDIRECT_GRAPH_INVALID`/`TARGET_NOT_ELIGIBLE`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 403 for visible publication without editor capability; 404 for an undiscoverable publication/target | 24h key per publication/path/version; 30 slug writes/hour/editor; trace normalized path hash/manifest/version; do not log raw paths for protected publications. |
| DLV-NAV-API-04 | `400 VALIDATION_FAILED`; `401 UNAUTHENTICATED`; `403 FORBIDDEN`; `404 PUBLICATION_NOT_FOUND`; `409 VERSION_CONFLICT`/`IDEMPOTENCY_MISMATCH`; `422 DISCOVERY_POLICY_BLOCKED`/`CANONICAL_INVALID`; `429 RATE_LIMITED`; `503 DEPENDENCY_UNAVAILABLE` | 403 for visible publication without locale editor capability; 404 hides suppressed/private publication | 24h key per publication/locale/content hash; 60 writes/hour/editor; trace policy version/noindex/blocker/version; never log descriptions or structured data. |

## Database Schema

### PostgreSQL model registry

| Canonical model | Typed fields, nullability, constraints, foreign keys, indexes, RLS, and grants |
|---|---|
| `Menu` | `id uuid PK`; `owner_id uuid NOT NULL FK party.id`; `key varchar(64) NOT NULL UNIQUE`; `location_key text NOT NULL CHECK (location_key IN ('primary','utility','footer','legal','account'))`; `state text NOT NULL CHECK (state IN ('draft','review','approved','active','superseded','revoked'))`; `version bigint NOT NULL CHECK (version>0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Indexes `(owner_id,state)`, `(location_key,state)`. RLS: owner/mandate rows; browser direct table grants none; service worker uses scoped functions. |
| `MenuVersion` | `id uuid PK`; `menu_id uuid NOT NULL FK Menu.id ON DELETE RESTRICT`; `owner_id uuid NOT NULL FK party.id`; `version_no bigint NOT NULL CHECK (version_no>0)`; `locale varchar(16) NOT NULL`; `audience_class varchar(48) NOT NULL`; `tree_hash text NOT NULL CHECK (tree_hash ~ '^[a-f0-9]{64}$')`; `state text NOT NULL CHECK (state IN ('draft','review','approved','active','superseded','revoked'))`; `approved_by_person_id uuid NULL FK person.id`; `approved_at timestamptz NULL`; `publication_version bigint NULL`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Unique `(menu_id,version_no,locale,audience_class)`; indexes `(menu_id,locale,audience_class,state)`, `(tree_hash)`. RLS: assigned editors read drafts, publishers activate, public receives active projection only. |
| `MenuItemVersion` | `id uuid PK`; `menu_version_id uuid NOT NULL FK MenuVersion.id ON DELETE CASCADE`; `item_id uuid NOT NULL`; `parent_item_id uuid NULL FK MenuItemVersion.id`; `position smallint NOT NULL CHECK (position BETWEEN 0 AND 199)`; `label varchar(120) NOT NULL`; `description varchar(500) NULL`; `icon_key varchar(64) NULL`; `target_kind text NOT NULL CHECK (target_kind IN ('publication','internal_route','external_https'))`; `target_ref text NOT NULL CHECK (char_length(target_ref) BETWEEN 1 AND 512)`; `visibility jsonb NOT NULL CHECK (jsonb_typeof(visibility)='array')`; `accessibility_metadata jsonb NOT NULL CHECK (jsonb_typeof(accessibility_metadata)='object')`; `created_at timestamptz NOT NULL`. Unique `(menu_version_id,item_id)`, `(menu_version_id,parent_item_id,position)`; indexes `(menu_version_id,parent_item_id,position)`, `(target_kind,target_ref)`. RLS: inherited menu owner/editor; parent must be same version; no direct client grants. |
| `RouteRecord` | `id uuid PK`; `manifest_version_id uuid NOT NULL FK delivery.route_manifest_version.id`; `route_id uuid NOT NULL`; `normalized_path text NOT NULL`; `locale varchar(16) NOT NULL`; `target_kind text NOT NULL CHECK (target_kind IN ('publication','internal_route','external_https'))`; `target_id uuid NOT NULL`; `target_version bigint NOT NULL CHECK (target_version>0)`; `canonical boolean NOT NULL`; `state text NOT NULL CHECK (state IN ('draft','review','approved','active','superseded','revoked'))`; `version bigint NOT NULL CHECK (version>0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Unique `(manifest_version_id,normalized_path,locale)`; indexes `(target_id,target_version)`, `(locale,normalized_path)`. RLS: editor/publisher for assigned publication; public active route projection only; direct grants none. |
| `RedirectRecord` | `id uuid PK`; `manifest_version_id uuid NOT NULL FK delivery.route_manifest_version.id`; `source_path text NOT NULL`; `destination_path text NULL`; `destination_route_id uuid NULL FK RouteRecord.id`; `status smallint NOT NULL CHECK (status IN (301,308))`; `reason text NOT NULL CHECK (reason IN ('slug_change','canonical_merge','migration'))`; `active_from timestamptz NOT NULL`; `active_to timestamptz NULL`; `hop_count smallint NOT NULL CHECK (hop_count BETWEEN 1 AND 5)`; `state text NOT NULL CHECK (state IN ('draft','active','superseded','revoked'))`; `version bigint NOT NULL CHECK (version>0)`; `created_at timestamptz NOT NULL`. Unique `(manifest_version_id,source_path)`; indexes `(source_path,state)`, `(destination_route_id)`. RLS: publication editor/publisher; graph validation forbids cycles/self-loops; direct client grants none. |
| `DiscoveryMetadataVersion` | `id uuid PK`; `publication_id uuid NOT NULL FK publication.id`; `locale varchar(16) NOT NULL`; `title varchar(160) NOT NULL`; `description varchar(320) NOT NULL`; `canonical_url text NOT NULL`; `noindex boolean NOT NULL`; `social_asset_id uuid NULL FK AssetRecord.id`; `breadcrumb jsonb NOT NULL CHECK (jsonb_typeof(breadcrumb)='array')`; `structured_data jsonb NOT NULL CHECK (jsonb_typeof(structured_data)='object')`; `policy_overrides jsonb NOT NULL CHECK (jsonb_typeof(policy_overrides)='array')`; `metadata_hash text NOT NULL CHECK (metadata_hash ~ '^[a-f0-9]{64}$')`; `state text NOT NULL CHECK (state IN ('draft','review','approved','active','superseded','revoked'))`; `version bigint NOT NULL CHECK (version>0)`; `created_at timestamptz NOT NULL`; `updated_at timestamptz NOT NULL`. Unique `(publication_id,locale,version)`; indexes `(publication_id,locale,state)`, `(canonical_url)`. RLS: publication owner/editor and policy worker; public safe projection only; direct client grants none. |

### State machines and transaction rules

`Menu`, `MenuVersion`, `RouteRecord`, `RedirectRecord`, and `DiscoveryMetadataVersion` use `draft → review → approved → active → superseded or revoked`; active versions are immutable. DLV-NAV-API-01 writes only a draft. DLV-NAV-API-02 locks the candidate and expected manifest, validates targets/tree hash/audiences, writes route/redirect projections, and switches the whole location atomically. DLV-NAV-API-03 reserves the normalized path and its redirect source in one serializable transaction; a failed graph leaves the prior active manifest. DLV-NAV-API-04 stores the authored version, then applies policy overrides as the effective projection; blocked policy state is explicit and safe.

The idempotency record is keyed by actor, effective party, route operation, and canonical body hash for 24 hours. `expected_version` and `If-Match` use compare-and-swap; a stale builder cannot replace a newer pointer. Outbox rows and audit records commit with domain rows. Provider timeout creates a pending compile/effect record; it never activates a partial tree or policy-unsafe metadata.

### Grants and RLS

Anonymous clients read only active public route/menu/discovery projections after independent target authorization. Editors see assigned drafts; publishers see assigned approved candidates; delivery workers see the exact manifest lease. Policy and private publication values are service-only. `service_role` is restricted to migrations/workers, browser direct table grants are denied, and all writes pass party/capability checks. Redirects never disclose a private target; a safe 404 is returned when an existence-sensitive lookup is denied.

## Middleware & Policies

### Authorization matrix

| Operation | Allowed authority | 403 condition | 404 condition |
|---|---|---|---|
| DLV-NAV-API-01 | Navigation editor for assigned menu/location and target scope | Known menu is visible but actor lacks editor capability or target mandate | Menu/target is outside actor projection or intentionally undiscoverable |
| DLV-NAV-API-02 | CMS publisher for assigned location and approved candidate | Candidate is visible but actor lacks publisher capability | Candidate is outside publisher scope or does not exist in safe projection |
| DLV-NAV-API-03 | Navigation editor for target publication/locale | Publication is visible but actor lacks route-edit capability | Publication is private/suppressed or outside actor projection |
| DLV-NAV-API-04 | Navigation editor for target publication/locale | Publication is visible but actor lacks discovery-edit capability | Suppressed/private publication is not discoverable |

### Per-operation middleware and CORS

The ordered chain is `requestId → strictCors(registered web origins; credentials only for same-site, no wildcard) → securityHeaders → bodyLimit → contentType → rateLimit → auth → actingContext → zod → capability/ownership → policy/target gate → idempotency → If-Match/CAS → handler → audit/outbox`. Every operation has a named CORS policy:

| Operation | Middleware and CORS policy |
|---|---|
| DLV-NAV-API-01 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(256KiB) → contentType(json) → rateLimit(menu-draft) → auth → actingContext → zod(CreateMenuVersionRequest) → editor+menu ownership → target/visibility/tree gate → idempotency → If-Match → handler → audit/outbox`. |
| DLV-NAV-API-02 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(menu-publish) → auth → actingContext → zod(PublishMenuVersionRequest) → publisher capability → approval/hash/target preflight → idempotency → If-Match/CAS → compiler seam → handler → audit/outbox`. |
| DLV-NAV-API-03 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(32KiB) → contentType(json) → rateLimit(route-slug) → auth → actingContext → zod(SlugRequest) → editor+publication ownership → normalization/reserved/graph gate → idempotency → If-Match/CAS → handler → audit/outbox`. |
| DLV-NAV-API-04 | `requestId → strictCors(registered web origins; credentials only for same-site) → securityHeaders → bodyLimit(128KiB) → contentType(json) → rateLimit(discovery) → auth → actingContext → zod(DiscoveryMetadataRequest) → editor+publication ownership → policy/privacy/legal gate → idempotency → If-Match/CAS → handler → audit/outbox`. |

### Rate, abuse, privacy, and security policy

Rate keys are effective party plus actor person plus route; unauthenticated failures use IP/account buckets. Labels, metadata, paths, and external URLs are length-limited and normalized; server-side URL fetching is never performed. External targets require HTTPS and an allowlist; `javascript:`, `data:`, credentials/userinfo, open redirects, preview/admin/private targets, and arbitrary visibility expressions reject. Policy overrides are applied last and a refusal reveals neither suppressed content nor target existence. Audit logs store hashes and IDs, not private labels, descriptions, route paths, or structured data. CSRF protection applies to credentialed browser commands; CSP/security headers and MIME/content limits are inherited from BE00.

## Data Flow

1. Hono binds request ID, strict CORS, headers, body/content limits, auth, acting context, rate bucket, and the operation’s Zod 4 schema.
2. The handler loads the assigned aggregate under RLS, checks capability/ownership, normalizes/validates the tree/path/metadata, and calls Shard 03/05 gates as applicable.
3. A serializable Supabase transaction writes immutable version rows, reservations/redirects, policy-safe metadata, audit, and an outbox event. Menu publish also records the compiler lease and expected manifest version.
4. The compiler/outbox worker builds only the exact version. Whole-location activation occurs after readiness; otherwise the prior active pointer remains and the failed consumer/error is recorded.
5. Consumers dedupe `(event_type,event_id)` and load the exact version. Public projections exclude drafts/private fields; stale or unsafe results become explicit blocked/unavailable states.

## Events and Consumer Contracts

| Event type | Producer and trigger | Versioned payload and exclusions | Consumers / delivery |
|---|---|---|---|
| `delivery.menu.activated.v1` | DLV-NAV-API-02 after complete location activation | `{ eventId, occurredAt, menuId, menuVersionId, locationKey, locale, audienceClass, treeHash, version, schemaVersion }`; excludes private labels, target refs, drafts, and policy evidence | Route/render/cache consumers load the exact complete tree; BE00 outbox retries five times with 1/5/30/300/900 s backoff then dead-letters. |
| `delivery.route.changed.v1` | DLV-NAV-API-02 or DLV-NAV-API-03 after route manifest commit | `{ eventId, occurredAt, routeId, routeManifestVersionId, normalizedPathHash, locale, canonical, version, schemaVersion }`; protected paths and private publication identifiers are redacted | Edge/router/sitemap/redirect consumers refetch the manifest; event/version dedupe prevents stale replacement. |

Events use BE00 identifier-only envelopes, aggregate version, and payload hash. Discovery metadata is versioned in its owning table and included in the next ready projection; this split does not invent a separate event type. Consumers never treat a draft or predicate as authorization and never fetch an external URL from an event.

## Error Handling and Failure Recovery

| Failure | Deterministic response and recovery |
|---|---|
| Tree cycle/orphan/depth/sibling/item overflow | `422 TREE_INVALID`; candidate is discarded and active tree remains. |
| Unsafe or unresolved target | `422 TARGET_NOT_ELIGIBLE`; no target lookup result or private existence is exposed. |
| Stale editor/publisher version or hash | `409 VERSION_CONFLICT`/`TREE_HASH_MISMATCH`; reload exact version; no activation. |
| Reserved/colliding slug or redirect graph issue | `409 ROUTE_CONFLICT`/`422 REDIRECT_GRAPH_INVALID`; reservation and redirect transaction rolls back. |
| Policy service unavailable or blocking | `503 DEPENDENCY_UNAVAILABLE` or `422 DISCOVERY_POLICY_BLOCKED`; noindex/sitemap exclusion and blocker preserve safety; editor metadata is not published. |
| Compiler timeout/failure | Prior active complete pointer remains; pending lease retries with bounded backoff; stale builder is fenced by manifest version. |
| Idempotency replay/mismatch | Same canonical hash returns stored result; different hash returns `409 IDEMPOTENCY_MISMATCH`; no duplicate version/pointer/event. |
| Outbox delivery failure | Domain rows remain committed; outbox retries, dead-letters, and pages; consumers replay by event ID and refetch exact version. |

## Verification and Test Strategy

### Operation Test Matrix

| Operation ID | Contract and handler tests | Authorization/RLS and failure tests |
|---|---|---|
| DLV-NAV-API-01 | Zod tree bounds, target/visibility closure, cycle/depth checks, draft immutability, hash/idempotent replay | Editor/menu/target scope, 403/404, unsafe URL, private target, RLS projection, provider timeout |
| DLV-NAV-API-02 | Approval/hash/audience preflight, whole-location activation, compiler lease, stale pointer fencing, event dedupe | Publisher scope, 403/404, removed target, partial tree failure, prior-pointer preservation |
| DLV-NAV-API-03 | Unicode NFC/lowercase normalization, reserved/collision/loop/hop graph, atomic reservation/redirect, CAS | Publication/locale scope, 403/404, protected path redaction, concurrent slug race |
| DLV-NAV-API-04 | Bounded metadata/structured data, policy-last override, noindex/blocker, canonical validation, version replay | Locale editor scope, 403/404, suppressed publication safety, policy outage, private field redaction |

Cross-operation test-level matrix:

| Level | Required tests |
|---|---|
| Contract | Zod 4 accepts each valid request and rejects unknown keys, invalid UUIDs, unsafe paths, oversized trees, arbitrary predicates, malformed URLs, and missing required metadata. Snapshot `ApiError { code, message, requestId, details }`. |
| Persistence/concurrency | Unique menu/version/path/redirect constraints, serializable whole-tree activation, manifest CAS, redirect graph invariants, idempotency hash, RLS direct-table denial, and outbox atomicity. |
| Security/privacy | Capability/mandate matrix, 403 versus 404, reserved routes, open-redirect prevention, target-independent authorization, policy override, CSP/CSRF/CORS, and protected-field redaction. |
| Accessibility | Keyboard-equivalent reorder/expand, labels/current-page state, focus/skip links, mobile disclosure, normalized route preview, and truthful blocked/unavailable states. |
| Integration/observability | Shard 03 resolver, Shard 05 policy, BE00 compiler/outbox seams honor exact timeout/retry/breaker profiles; every operation emits requestId/operationId/resource/version/result metrics without private values. |

## Deepening Passes and Ambiguity Gate

- **Pass 1 — micro contract:** closed locations/targets/predicates/states, UUID/time/version/checksum types, tree/path/metadata limits, and route graph bounds are schema- and database-enforced.
- **Pass 2 — macro contract:** DLV-01–DLV-04 map one-to-one to stable routes; menu, route, redirect, and discovery ownership is separated from media and public delivery.
- **Pass 3 — race/recovery:** serializable activation, manifest leases, CAS, idempotency, compiler fencing, outbox replay, and prior-pointer preservation are explicit.
- **Pass 4 — security/privacy/accessibility:** RLS, CORS, auth, 403/404, safe target handling, policy-last disclosure, keyboard parity, and redacted telemetry are specified per operation.

## Ambiguity Gate

**PASS.** DLV-01–DLV-04 are reconciled one-to-one with stable routes and operation IDs. Menu limits, target and predicate vocabularies, whole-tree publish, normalized slug/redirect graph, policy-last discovery metadata, ownership/403-vs-404 behavior, typed persistence, CORS/auth/rate/error contracts, external seams, events, tests, and recovery are deterministic. No implementation decision remains open.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored the navigation/routes/discovery backend split for DLV-01–DLV-04. | `/write-be-spec` | All |
| 2026-08-28 | Added per-operation Zod 4, CORS, target/policy gates, typed persistence, event, and recovery contracts. | `/write-be-spec-write` | API, Database, Middleware, Events, Tests |

## Dependency References

- [BE00 — Cross-cutting Platform Foundation](00-infrastructure.md): global `ApiError`, request IDs, idempotency, ETag/CAS, Hono middleware, RLS, outbox, and worker recovery.
- [IA Shard 04 — CMS navigation, media and delivery](../ia/04-cms-delivery-media.md) and [Deep Dive 04](../ia/deep-dives/04-cms-delivery-media.md): canonical interactions, contracts, models, state machines, events, accessibility, and algorithms.
- Shard 03: publication/schema/template/route target authority and version resolver.
- Shard 05: governed policy definitions; policy state overrides authored discovery values.
- 04b/04c sibling BE splits: media/rendition and public delivery/cache projections consume immutable menu/route/discovery versions; this file does not duplicate their endpoints.
