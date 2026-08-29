# Profile, Portfolio & EPK — Backend Specification

> **IA Source**: [Shard 02 — Profiles, claiming and qualifications](../ia/02-profiles-verification.md)
> **Deep Dives**: [Profiles, claiming and qualifications](../ia/deep-dives/02-profiles-verification.md)
> **Status**: Complete

## Classification

- **Type**: multi-domain-split
- **IA Source**: `02-profiles-verification`
- **BE Spec(s) to produce**: `02a-shadow-claim-ownership.md`, `02b-profile-portfolio-epk.md`, `02c-credentials-trader.md`
- **Owned interactions**: PRF-10–PRF-13
- **Boundary**: viewer-safe profile projection, asserted sections, credit-backed portfolio, governed reel, live EPK and accessible snapshot export

## Referenced Material Inventory

| Material | Sections |
|---|---|
| [Shard 02 IA](../ia/02-profiles-verification.md) | Features; Acceptance Criteria; PRF-10–13; Profile/Portfolio/EPK Contracts; Data Models; Access Control; Events; Edge Cases |
| [Shard 02 deep dive](../ia/deep-dives/02-profiles-verification.md) | Profile/EPK Fields; State Machines; Projection Invariants; EPK and Media Rules; Concurrency; Release Gates |
| [Shard 00 IA](../ia/00-infrastructure.md) and [BE00](00-infrastructure.md) | HTTP, cache, validation, errors, idempotency, jobs, objects, events, telemetry and recovery |
| [Shard 01 IA](../ia/01-identity-authority.md) and BE01a–d | Canonical party, aliases, acting context, mandate and disclosure authority |
| Shards 04, 05, 07, 17, 20 and 38 | Governed media, registries, credit/provenance truth, attendance inputs, rights boundaries and campaign-EPK separation |
| Architecture, placement and standards | Runtime, security, PII, storage, cache, performance, accessibility, testing and release constraints |

## IA Source Map

| IA contract | Backend owner in this file | Locked backend result |
|---|---|---|
| PRF-10 / AC-PRF-10 Compose public profile | PRF-PROF-01, PRF-PROF-04–05, PRF-PROF-10 | Fixed `Header → Now → Record → Detail` composition over a version-addressed viewer-safe projection. An unclaimed shadow has no public resource. |
| PRF-11 / AC-PRF-11 Edit asserted profile | PRF-PROF-02–03 | Per-section strong compare-and-swap, immutable author human plus acting party, atomic activation/archive, and structurally safe content. |
| PRF-12 / AC-PRF-12 Curate portfolio/reel | PRF-PROF-04–09, PRF-PROF-11 | Portfolio remains a query; emphasis/unlisting never mutate credit truth. Reel publication requires governed media and a current rights basis. |
| PRF-13 / AC-PRF-13 Generate/share EPK | PRF-EPK-01–08 | Live per-pitch selected projection, explicit per-send private inclusion, revocable high-entropy token, minimal open counter, and optional accessible snapshot. |
| `ProfileSectionRevision` | `profile_section_revisions` | Append-only revisions; one active revision per party/section. |
| `ProfileFactProjection` | `profile_fact_projections` | Derived fact rows keyed by source identity and version; never directly user-edited. |
| `ProfileEmphasis` | `profile_emphases` | Cosmetic ordered preference with durable CAS; latest accepted revision wins. |
| `ReelItem` | `reel_items` | Rights-gated media selection with explicit role, source credit and reversible state. |
| `EpkShare` | `epk_shares` | Token hash, selected facts, consent references, purpose, expiry, revocation and version. |
| `EpkOpenEvent` | `epk_open_events` | Daily coarse timestamp/count only; no recipient identity, IP, fingerprint or cross-site identifier. |
| `profile.projection.invalidated.v1` | Outbox topic | Version-addressed profile/publication rebuild trigger. |
| `profile.epk.material-change.v1` | Outbox topic | Sender notification trigger after selected live material changes. |

### Source precedence and bounded inputs

- The parent IA and approved deep dive are authoritative. BE00 governs transport, error, idempotency, object, job, event and telemetry envelopes.
- [DEC-100](../../decisions.md#dec-100-shard-02-accepts-bounded-inbound-evidence-and-policy-commands-without-upward-store-reads-2026-08-28) forbids upward reads. Shards 04, 07, 17 and 20 retain canonical media, credit, attendance and consent truth and deliver bounded, versioned observations through PRF-PROF-10 or the equivalent signed queue adapter.
- Shard 01 retains party, alias, acting-context and mandate truth. Shard 02 stores only authorization snapshots needed to explain a committed revision or share.
- Shard 38 owns campaign-scoped immutable EPK versions and asset packs. This file owns the profile-scoped live EPK share and optional timestamped PDF derived from it.
- Shard 05 may operate generic governed publication infrastructure; this file owns profile composition, projection eligibility and EPK selection semantics.

## Endpoint Completeness Reconciliation

| IA interaction | Route/command | Resolution |
|---|---|---|
| PRF-10 Compose public profile | `GET /api/v1/profiles/{partyId}` | Public, stable composition with explicit fixed-layer readiness states and no hidden-set side channels. |
| PRF-10 Compose public profile | `POST /internal/v1/profile-fact-observations` | Protected producer ingress for bounded, versioned source observations; no higher-shard reads. |
| PRF-11 Edit asserted profile | `GET /api/v1/profiles/{partyId}/sections/{sectionCode}/revisions`; `PUT /api/v1/profiles/{partyId}/sections/{sectionCode}` | Protected history plus atomic section upsert/activation. |
| PRF-12 Curate portfolio/reel | GET and PUT `/api/v1/profiles/{partyId}/emphasis`; `GET /api/v1/profiles/{partyId}/portfolio` | Protected current-preference read supplies the positive ETag; cosmetic curation and derived public query remain separate from credit truth. |
| PRF-12 Curate portfolio/reel | `GET /api/v1/profiles/{partyId}/reel`; `POST /api/v1/profiles/{partyId}/reel-items`; PUT and DELETE `/api/v1/reel-items/{reelItemId}` | Full rights-gated reel lifecycle; DELETE is a state transition, never evidence erasure. |
| PRF-13 Generate/share EPK | POST and GET `/api/v1/profiles/{partyId}/epk-shares`; GET, PUT and DELETE `/api/v1/epk-shares/{shareId}` | Owner/mandate share lifecycle and current selection. |
| PRF-13 Generate/share EPK | `GET /epk/{token}` | Account-free live view; token is a viewing capability, not authentication. |
| PRF-13 Generate/share EPK | `POST /api/v1/epk-shares/{shareId}/pdf-jobs`; `GET /api/v1/epk-shares/{shareId}/pdf-snapshots/{snapshotId}` | Accessible immutable snapshot generation and owner retrieval. |

All PRF-10–13 acceptance criteria have an owning operation, contract, persistence rule, failure mode and test below. No create/update/delete behavior is implied outside this registry.

## API Endpoints

### Authoritative Route Registry

| Operation ID | Method and path | Request schema | Success | Authorization | Concurrency/idempotency | Limit, cache, SLO, telemetry |
|---|---|---|---|---|---|---|
| PRF-PROF-01 | `GET /api/v1/profiles/{partyId}` | `PublicProfileQuery` | 200 `PublicProfileResponse`; ETag | Public only when party has a public projection; unclaimed shadow is concealed as 404 | Safe read; no key or `If-Match` | 300/min/IP, 600/min/session; public 60 s + stale-if-error 300 s by projection version; 800 ms p95; Tier 1 |
| PRF-PROF-02 | `GET /api/v1/profiles/{partyId}/sections/{sectionCode}/revisions` | `SectionRevisionListQuery` | 200 `SectionRevisionListResponse`; section-head ETag | Subject or current `profile.edit` mandate; human author detail audit-only | Safe cursor read | 120/min/actor; no-store; 800 ms p95; Tier 1 |
| PRF-PROF-03 | `PUT /api/v1/profiles/{partyId}/sections/{sectionCode}` | `SectionPutRequest` | 200 `SectionRevisionResponse`; ETag | Subject or current scoped mandate; actor human and acting party server-derived | Key and positive current section-head `If-Match` required; heads are initialized before editing | 30/min/actor and 60/min/party; no-store; 2 s p95; Tier 2 |
| PRF-PROF-04 | `PUT /api/v1/profiles/{partyId}/emphasis` | `EmphasisPutRequest` | 200 `EmphasisResponse`; ETag | Subject or `profile.curate` mandate | Key and positive current emphasis `If-Match`; empty preferences are initialized with the profile | 30/min/actor; no-store; 2 s p95; Tier 2 |
| PRF-PROF-05 | `GET /api/v1/profiles/{partyId}/portfolio` | `PortfolioListQuery` | 200 `PortfolioListResponse`; ETag | Public projection only; protected facts never enter candidate set | Opaque cursor binds filter and projection version | 120/min/IP, 300/min/session; public 60 s; 1 s p95; Tier 1 |
| PRF-PROF-06 | `GET /api/v1/profiles/{partyId}/reel` | `ReelListQuery` | 200 `ReelListResponse`; ETag | Public sees active items only; controller may request `includeInactive=true` | Opaque cursor; controller view no-store | 120/min/IP; public 60 s; 1 s p95; Tier 1 |
| PRF-PROF-07 | `POST /api/v1/profiles/{partyId}/reel-items` | `ReelCreateRequest` | 201 `ReelItemResponse`; ETag | Subject or `profile.curate` mandate; media/credit observations must name same party | Key and profile aggregate `If-Match` required | 20/min/actor; no-store; 2 s acceptance; Tier 2 |
| PRF-PROF-08 | `PUT /api/v1/reel-items/{reelItemId}` | `ReelPutRequest` | 200 `ReelItemResponse`; ETag | Same controller; cannot forge rights or source role | Key and item `If-Match` required | 30/min/actor; no-store; 2 s p95; Tier 2 |
| PRF-PROF-09 | `DELETE /api/v1/reel-items/{reelItemId}` | `ReelRemoveRequest` | 200 `ReelItemResponse`; ETag | Controller may unlist; rights/takedown processor may force `takedown` | Key and item `If-Match`; terminal evidence retained | 30/min/actor; no-store; 2 s p95; Tier 2 |
| PRF-PROF-10 | `POST /internal/v1/profile-fact-observations` | `ProfileFactObservationRequest` | 202 BE00 `JobStatus`; Location | mTLS/signed Worker binding plus registered producer and message schema | Key; unique producer/source/version; stale source versions acknowledge without overwrite | Producer budget 600/min; no-store; 2 s acceptance; Tier 2/D |
| PRF-PROF-11 | `GET /api/v1/profiles/{partyId}/emphasis` | `EmphasisGetQuery` | 200 `EmphasisResponse`; ETag | Subject or `profile.curate` mandate; raw ordered refs are protected | Safe read; no key or `If-Match` | 120/min/actor; no-store; 800 ms p95; Tier 1 |
| PRF-EPK-01 | `POST /api/v1/profiles/{partyId}/epk-shares` | `EpkShareCreateRequest` | 201 `EpkShareResponse` plus one-time raw token | Subject or current `epk.share` mandate; step-up if private alias/member facts selected | Key and profile aggregate `If-Match` required | 20/hour/party; no-store; 2 s p95; Tier 2/high-risk |
| PRF-EPK-02 | `GET /api/v1/profiles/{partyId}/epk-shares` | `EpkShareListQuery` | 200 `EpkShareListResponse` | Same controller; raw tokens never returned | Safe cursor read | 120/min/actor; no-store; 800 ms p95; Tier 1 |
| PRF-EPK-03 | `GET /api/v1/epk-shares/{shareId}` | UUID path | 200 `EpkShareResponse`; ETag | Same controller; raw token never returned after creation | Safe read | 120/min/actor; no-store; 800 ms p95; Tier 1 |
| PRF-EPK-04 | `PUT /api/v1/epk-shares/{shareId}` | `EpkSharePutRequest` | 200 `EpkShareResponse`; ETag | Same controller; renewed private inclusions require current explicit consent | Key and share `If-Match` required; token is unchanged | 30/min/actor; no-store; 2 s p95; Tier 2/high-risk |
| PRF-EPK-05 | `DELETE /api/v1/epk-shares/{shareId}` | `EpkShareRevokeRequest` | 200 `EpkShareResponse`; ETag | Same controller; support has no silent override | Key and share `If-Match`; repeated same key replays result | 30/min/actor; no-store; 2 s p95; Tier 2 |
| PRF-EPK-06 | `GET /epk/{token}` | `EpkTokenPath` | 200 `LiveEpkResponse` | Account-free possession; selected live projection only; recipient label is not an ACL | Safe read; token hash constant-time lookup | 120/min/IP and 1,000/day/share; private, no-store; 1 s p95; Tier 1 privacy-minimal |
| PRF-EPK-07 | `POST /api/v1/epk-shares/{shareId}/pdf-jobs` | `EpkPdfJobRequest` | 202 BE00 `JobStatus`; Location | Same controller; current share must be active | Key and share `If-Match`; same projection digest reuses completed snapshot | 10/hour/share; no-store; 2 s acceptance; Tier 2/D |
| PRF-EPK-08 | `GET /api/v1/epk-shares/{shareId}/pdf-snapshots/{snapshotId}` | UUID paths | 200 `EpkPdfSnapshotResponse` | Same controller; snapshot survives share expiry/revocation | Safe read; BE00 object policy issues at most a 60-second read capability | 120/min/actor; no-store; 800 ms p95; Tier 1 |

### Transport invariants

- JSON request and response media type is `application/json`. Mutating JSON routes reject missing/wrong media type with 415 and bodies over their declared limit with 413.
- Every object is `z.strictObject`; unknown keys fail with 422 `VALIDATION_FAILED`. Identifiers are canonical UUIDs. Timestamps are UTC RFC 3339 with millisecond precision.
- Strong ETags are quoted positive base-10 bigint versions in `1..9223372036854775807`, for example `"12"`. Version zero, weak tags, wildcards, lists, signs, leading zeros, overflow and whitespace inside quotes are invalid. A missing or malformed required `If-Match` is 400 `INVALID_REQUEST`; a stale well-formed tag is 409 `VERSION_CONFLICT`.
- `Idempotency-Key` is 8–128 printable ASCII characters. Reuse with a different actor, acting party, operation, canonical body or precondition returns 409 `IDEMPOTENCY_CONFLICT`.
- All envelopes include `meta.requestId`. Errors use BE00's exact four-field `ApiError = { code, message, requestId, details }`.

## Request/Response Contracts

### Zod 4 source contracts

```ts
import { z } from 'zod';

const Uuid = z.uuid();
const Version = z.string().superRefine((value, ctx) => {
  if (!/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9_223_372_036_854_775_807n) {
    ctx.addIssue({ code: 'custom', message: 'positive bigint version required' });
  }
});
const Instant = z.iso.datetime({ offset: true, precision: 3 });
const DateOnly = z.iso.date();
const Cursor = z.string().min(16).max(512);
const PageSize = z.coerce.number().int().min(1).max(50).default(25);
const SafeText = z.string().trim().min(1).max(2_000)
  .refine(v => !/<[^>]*>|(?:https?:\/\/|javascript:|data:)/iu.test(v), 'active markup and URLs are forbidden');
const SafeShortText = z.string().trim().min(1).max(160)
  .refine(v => !/<[^>]*>|(?:https?:\/\/|javascript:|data:)/iu.test(v), 'active markup and URLs are forbidden');
type JsonValue = null | boolean | number | string | JsonValue[] | { readonly [key: string]: JsonValue };
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() => z.union([
  z.null(), z.boolean(), z.number().finite(), z.string().max(65_536),
  z.array(JsonValueSchema).max(1_000),
  z.record(z.string().min(1).max(256), JsonValueSchema),
]));
const jsonDepth = (value: JsonValue): number => {
  if (value === null || typeof value !== 'object') return 0;
  const children = Array.isArray(value) ? value : Object.values(value);
  return 1 + children.reduce((max, child) => Math.max(max, jsonDepth(child)), 0);
};
const ErrorDetails = z.record(z.string().min(1).max(64), JsonValueSchema).superRefine((value, ctx) => {
  if (Object.keys(value).length > 16) ctx.addIssue({ code: 'custom', message: 'at most 16 detail keys' });
  if (jsonDepth(value) > 4) ctx.addIssue({ code: 'custom', message: 'details depth exceeds four' });
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 8_192) {
    ctx.addIssue({ code: 'custom', message: 'details exceed 8 KiB' });
  }
});
const RequestMeta = z.strictObject({ requestId: Uuid });
const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: Uuid,
  details: ErrorDetails,
});
const FactRef = z.strictObject({
  sourceType: z.enum(['credit', 'attendance', 'party', 'media', 'consent', 'asserted_section']),
  sourceId: Uuid,
  sourceVersion: Version,
});
const StructuredBlock = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('paragraph'), text: SafeText }),
  z.strictObject({ kind: z.literal('heading'), level: z.enum(['2', '3']), text: SafeShortText }),
  z.strictObject({ kind: z.literal('list'), items: z.array(SafeShortText).min(1).max(20) }),
]);
const SectionCode = z.enum(['now', 'biography', 'services', 'availability']);

export const PublicProfileQuery = z.strictObject({ locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en') });
export const SectionRevisionListQuery = z.strictObject({ cursor: Cursor.optional(), limit: PageSize });
export const SectionPutRequest = z.strictObject({
  state: z.enum(['draft', 'active']),
  blocks: z.array(StructuredBlock).max(40),
  clientReason: z.string().trim().min(1).max(240),
});
export const EmphasisPutRequest = z.strictObject({
  surface: z.enum(['public', 'epk']),
  defaultFilter: z.strictObject({ roleCodes: z.array(z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/)).max(20) }).nullable(),
  orderedRefs: z.array(FactRef).max(100),
});
export const EmphasisGetQuery = z.strictObject({ surface: z.enum(['public', 'epk']) });
export const PortfolioListQuery = z.strictObject({
  cursor: Cursor.optional(), limit: PageSize,
  roleCode: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/).optional(),
  from: DateOnly.optional(), to: DateOnly.optional(),
}).superRefine((v, ctx) => { if (v.from && v.to && v.from > v.to) ctx.addIssue({ code: 'custom', path: ['to'], message: 'to precedes from' }); });
export const ReelListQuery = z.strictObject({
  cursor: Cursor.optional(), limit: PageSize,
  includeInactive: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
});
const CreditFactRef = FactRef.extend({ sourceType: z.literal('credit') });
const MediaFactRef = FactRef.extend({ sourceType: z.literal('media') });
const RightsFactRef = FactRef.extend({ sourceType: z.enum(['media', 'consent']) });
const ConsentFactRef = FactRef.extend({ sourceType: z.literal('consent') });
export const ReelCreateRequest = z.strictObject({
  creditRef: CreditFactRef, mediaRef: MediaFactRef,
  roleCode: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),
  rightsBasis: z.enum(['ownership', 'licence', 'provider_publication']),
  rightsRef: RightsFactRef, order: z.number().int().min(0).max(999),
});
export const ReelPutRequest = z.strictObject({
  roleCode: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),
  rightsBasis: z.enum(['ownership', 'licence', 'provider_publication']),
  rightsRef: RightsFactRef, order: z.number().int().min(0).max(999),
  desiredState: z.enum(['draft', 'verifying_rights']),
});
export const ReelRemoveRequest = z.strictObject({ reasonCode: z.enum(['controller_unlisted', 'rights_revoked', 'takedown']), note: z.string().trim().max(500).optional() });
export const ProfileFactObservationRequest = z.strictObject({
  messageId: Uuid, producer: z.enum(['shard01', 'shard04', 'shard07', 'shard17', 'shard20']),
  partyId: Uuid, fact: FactRef,
  provenanceState: z.enum(['asserted', 'attested', 'confirmed_assertion', 'creator_asserted', 'disputed']),
  evidenceClass: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/), evidenceCount: z.number().int().min(0).max(10_000),
  visibility: z.enum(['public', 'protected', 'private']), embargoUntil: Instant.nullable(),
  listingState: z.enum(['listed', 'unlisted', 'ineligible']), disputeState: z.enum(['clear', 'disputed', 'withheld']),
  occurredOn: DateOnly.nullable(), roleCodes: z.array(z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/)).max(32),
payload: z.record(z.string(), z.json()), observedAt: Instant,
});
const EpkSelection = z.strictObject({
  publicFactRefs: z.array(FactRef).min(1).max(200),
  privateAliasInclusions: z.array(z.strictObject({ aliasId: Uuid, consentRef: ConsentFactRef, forwardabilityConfirmed: z.literal(true) })).max(20),
  memberCreditInclusions: z.array(z.strictObject({ creditRef: CreditFactRef, consentRef: ConsentFactRef })).max(100),
  approvedContactRefs: z.array(FactRef).max(10),
  approvedRateRefs: z.array(FactRef).max(10),
});
export const EpkShareCreateRequest = z.strictObject({
  recipientLabel: SafeShortText, purposeCode: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),
  selection: EpkSelection, expiresAt: Instant.optional(),
});
export const EpkSharePutRequest = z.strictObject({ selection: EpkSelection, expiresAt: Instant });
export const EpkShareRevokeRequest = z.strictObject({ reasonCode: z.enum(['sender_revoked', 'consent_withdrawn', 'rights_revoked', 'security']) });
export const EpkShareListQuery = z.strictObject({ cursor: Cursor.optional(), limit: PageSize, state: z.enum(['active', 'expired', 'revoked']).optional() });
export const EpkTokenPath = z.strictObject({ token: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/) });
export const EpkPdfJobRequest = z.strictObject({ locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en'), paper: z.enum(['a4', 'letter']).default('letter') });
```

The server never accepts author IDs, acting-party IDs, provenance badges, attestation states, rights-verification outcomes, open counts, token hashes, projection versions, PDF object references or timestamps from a public caller. The BE00 cursor verifier authenticates every cursor, expires it within 24 hours, and binds route, normalized filters, sort, deterministic unique tie-breaker, audience, user/acting context and contract version; tamper or cross-context reuse returns 400 without decoded details.

### Resource shapes

| Schema | Required shape |
|---|---|
| `PublicProfileResponse` | `{ data: { partyId, projectionVersion, cacheKey, layers: [{ code, state, facts? }], generatedAt }, meta: RequestMeta }`; code is one of header/now/record/detail and state is one of ready/empty/denied/unavailable. An empty slot remains readiness metadata and MUST NOT render a section; denied/unavailable renders its explicit safe state. Facts include source/version and provenance class/count, never attester identity. |
| `SectionRevisionResponse` | `{ data: { id, partyId, sectionCode, blocks, authorPersonId, actingPartyId, state, version, createdAt, activatedAt? }, meta }`. Public composition substitutes party authorship; protected history retains the human author. |
| `SectionRevisionListResponse` | `{ data: SectionRevision[], meta: RequestMeta & { nextCursor? } }`; maximum 50. |
| `EmphasisResponse` | `{ data: { partyId, surface, defaultFilter, orderedRefs, version, updatedAt }, meta }`. Missing/ineligible references are ignored at render time, not leaked. |
| `PortfolioListResponse` | `{ data: { items: PortfolioFact[], visibleTotals, filters, projectionVersion }, meta: RequestMeta & { nextCursor? } }`; all aggregates derive after visibility filtering. |
| `ReelItemResponse` | `{ data: { id, partyId, creditRef, mediaRef, roleCode, rightsBasis, rightsRef, state, order, version, createdAt, updatedAt }, meta }`. |
| `ReelListResponse` | `{ data: ReelItem[], meta: RequestMeta & { nextCursor?, projectionVersion } }`. Public rows are active only. |
| `EpkShareResponse` | `{ data: { id, partyId, recipientLabel, purposeCode, selection, state, expiresAt, revokedAt?, version, createdAt, materialChangeCount, latestSnapshot? }, meta }`; only PRF-EPK-01 additionally returns `shareToken` once. |
| `EpkShareListResponse` | Redacted `EpkShareResponse.data[]`, no raw token/token hash/consent evidence; cursor maximum 50. |
| `LiveEpkResponse` | `{ data: { shareId, partyId, purposeCode, layers, selectedSourceVersions, currentAsOf, materialChangesPresent }, meta }`; omits no-longer-eligible selected facts and never substitutes a hidden value. |
| `EpkPdfSnapshotResponse` | `{ data: { snapshotId, shareId, projectionDigest, currentAsOf, sourceVersions, objectAccess, accessibilityReport, createdAt }, meta }`; object access expires in at most 60 seconds. |
| BE00 `JobStatus` | Exact `{ id, type, state, progress, resultRef, error, createdAt, updatedAt }`; state is queued/running/succeeded/failed/cancelled, progress/result/error are nullable, and the job URL is carried by `Location`, not the body. |

### Field validation and typed failures

| Field/rule | Validation | Failure |
|---|---|---|
| `partyId`, row IDs, fact IDs | Canonical UUID; route/body party agreement | 422 `VALIDATION_FAILED`; concealed foreign target 404 |
| `sectionCode` | Closed asserted-section enum only | 422 `SECTION_NOT_ASSERTED` |
| Section blocks | ≤40 blocks; text limits; no HTML, CSS, script, active URL, badge glyph or reserved verification styling | 422 `CONTENT_NOT_ALLOWED` |
| Section activation | Expected section version; exactly one active revision after transaction | 409 `VERSION_CONFLICT` or 409 `SECTION_STATE_CONFLICT` |
| Emphasis refs | ≤100 unique refs, same party/surface; cosmetic only | 422 `INVALID_EMPHASIS` |
| Portfolio cursor | Signed, unexpired, binds route/party/filter/sort/tie-breaker/audience/context/contract and projection version | 400 `INVALID_REQUEST`; changed projection 409 `CURSOR_STALE` |
| Reel credit/media/rights | Current bounded observations; party relationship; governed media ready; rights basis/ref current | 422 `RIGHTS_BASIS_REQUIRED`, 409 `MEDIA_NOT_READY`, or 409 `RIGHTS_REVOKED` |
| Reel `active` transition | Only verifier may complete `verifying_rights → active` | 403 `FORBIDDEN` or 409 `INVALID_STATE_TRANSITION` |
| EPK expiry | Default now + 90 days; after now; maximum now + 365 days | 422 `INVALID_EXPIRY` |
| Private alias inclusion | Current alias consent, same party, explicit per-send `forwardabilityConfirmed=true` | 422 `CONSENT_REQUIRED` |
| Member credit inclusion | Active consent names band, credit and EPK use | 422 `CONSENT_REQUIRED` |
| Approved contact/rate | Reference already approved for this party/use; raw values forbidden | 422 `UNAPPROVED_DISCLOSURE` |
| Share token | 32 random bytes minimum, base64url; SHA-256/HMAC digest stored; constant-time compare | Unknown token 404 `RESOURCE_NOT_FOUND`; expired/revoked 410 `SHARE_UNAVAILABLE` |
| Source observation | Registered producer owns source type; monotonic source version; payload schema/version allowlisted | 401 `PRODUCER_AUTH_FAILED`, 422 `EVENT_SCHEMA_INVALID`; older version acknowledged/no overwrite |
| PDF snapshot | Active share at acceptance; live selection revalidated; WCAG report passes | 409 `SHARE_UNAVAILABLE`, 422 `CONSENT_REQUIRED`, or terminal job `ACCESSIBILITY_VALIDATION_FAILED` |

### Per-operation examples

These executable TypeScript fixtures contain no shorthand values. Contract tests parse every request, success and error object through the named schema.

```ts
const EX = {
  party: '00000000-0000-4000-8000-000000000001',
  person: '00000000-0000-4000-8000-000000000002',
  section: '00000000-0000-4000-8000-000000000003',
  fact: '00000000-0000-4000-8000-000000000004',
  media: '00000000-0000-4000-8000-000000000005',
  rights: '00000000-0000-4000-8000-000000000006',
  reel: '00000000-0000-4000-8000-000000000007',
  share: '00000000-0000-4000-8000-000000000008',
  snapshot: '00000000-0000-4000-8000-000000000009',
  message: '00000000-0000-4000-8000-00000000000a',
  job: '00000000-0000-4000-8000-00000000000b',
  request: '00000000-0000-4000-8000-00000000000c',
  time: '2026-08-28T12:00:00.000Z',
} as const;
const meta = { requestId: EX.request };
const creditRef = { sourceType: 'credit', sourceId: EX.fact, sourceVersion: '7' };
const publicFact = {
  sourceType: 'credit', sourceId: EX.fact, sourceVersion: '7',
  provenanceState: 'attested', evidenceClass: 'issuer', evidenceCount: 1,
};
const mediaRef = { sourceType: 'media', sourceId: EX.media, sourceVersion: '4' };
const rightsRef = { sourceType: 'media', sourceId: EX.rights, sourceVersion: '2' };
const selection = {
  publicFactRefs: [creditRef],
  privateAliasInclusions: [],
  memberCreditInclusions: [],
  approvedContactRefs: [],
  approvedRateRefs: [],
};
const revision = {
  id: EX.section, partyId: EX.party, sectionCode: 'biography',
  blocks: [{ kind: 'paragraph', text: 'Touring bassist.' }],
  authorPersonId: EX.person, actingPartyId: EX.party, state: 'active',
  version: '4', createdAt: EX.time, activatedAt: EX.time,
};
const emphasis = {
  partyId: EX.party, surface: 'public', defaultFilter: null,
  orderedRefs: [creditRef], version: '2', updatedAt: EX.time,
};
const reelItem = {
  id: EX.reel, partyId: EX.party, creditRef, mediaRef, roleCode: 'bass',
  rightsBasis: 'licence', rightsRef, state: 'verifying_rights',
  order: 0, version: '1', createdAt: EX.time, updatedAt: EX.time,
};
const activeReelItem = { ...reelItem, state: 'active', version: '2' };
const share = {
  id: EX.share, partyId: EX.party, recipientLabel: 'Venue booker',
  purposeCode: 'booking', selection, state: 'active',
  expiresAt: '2026-11-26T12:00:00.000Z', version: '1',
  createdAt: EX.time, materialChangeCount: 0, latestSnapshot: null,
};
const job = {
  id: EX.job, type: 'profile_projection_apply', state: 'queued',
  progress: null, resultRef: null, error: null,
  createdAt: EX.time, updatedAt: EX.time,
};
const error = (code: string, message: string, details: Record<string, JsonValue> = {}) => ({
  code, message, requestId: EX.request, details,
});

export const operationExamples = {
  'PRF-PROF-01': {
    request: { method: 'GET', path: `/api/v1/profiles/${EX.party}`, query: { locale: 'en' } },
    success: { status: 200, headers: { ETag: '"42"' }, body: { data: { partyId: EX.party, projectionVersion: '42', cacheKey: 'profile:42:en', layers: [{ code: 'header', state: 'ready', facts: [publicFact] }], generatedAt: EX.time }, meta } },
    failure: { status: 404, body: error('RESOURCE_NOT_FOUND', 'Profile not found') },
  },
  'PRF-PROF-02': {
    request: { method: 'GET', path: `/api/v1/profiles/${EX.party}/sections/biography/revisions`, query: { limit: 20 } },
    success: { status: 200, headers: { ETag: '"4"' }, body: { data: [revision], meta: { requestId: EX.request, nextCursor: null } } },
    failure: { status: 403, body: error('FORBIDDEN', 'Profile edit authority required') },
  },
  'PRF-PROF-03': {
    request: { method: 'PUT', path: `/api/v1/profiles/${EX.party}/sections/biography`, headers: { 'If-Match': '"3"', 'Idempotency-Key': 'section-0001' }, body: { state: 'active', blocks: revision.blocks, clientReason: 'Update biography' } },
    success: { status: 200, headers: { ETag: '"4"' }, body: { data: revision, meta } },
    failure: { status: 409, body: error('VERSION_CONFLICT', 'Section changed', { currentVersion: '4' }) },
  },
  'PRF-PROF-04': {
    request: { method: 'PUT', path: `/api/v1/profiles/${EX.party}/emphasis`, headers: { 'If-Match': '"1"', 'Idempotency-Key': 'emphasis-001' }, body: { surface: 'public', defaultFilter: null, orderedRefs: [creditRef] } },
    success: { status: 200, headers: { ETag: '"2"' }, body: { data: emphasis, meta } },
    failure: { status: 422, body: error('INVALID_EMPHASIS', 'Reference is outside this party') },
  },
  'PRF-PROF-05': {
    request: { method: 'GET', path: `/api/v1/profiles/${EX.party}/portfolio`, query: { roleCode: 'bass', limit: 20 } },
    success: { status: 200, body: { data: { items: [publicFact], visibleTotals: { items: 1 }, filters: { roleCodes: ['bass'] }, projectionVersion: '42' }, meta: { requestId: EX.request, nextCursor: null } } },
    failure: { status: 409, body: error('CURSOR_STALE', 'Projection changed') },
  },
  'PRF-PROF-06': {
    request: { method: 'GET', path: `/api/v1/profiles/${EX.party}/reel`, query: { limit: 20, includeInactive: 'false' } },
    success: { status: 200, body: { data: [activeReelItem], meta: { requestId: EX.request, nextCursor: null, projectionVersion: '42' } } },
    failure: { status: 404, body: error('RESOURCE_NOT_FOUND', 'Profile not found') },
  },
  'PRF-PROF-07': {
    request: { method: 'POST', path: `/api/v1/profiles/${EX.party}/reel-items`, headers: { 'If-Match': '"42"', 'Idempotency-Key': 'reel-create-01' }, body: { creditRef, mediaRef, roleCode: 'bass', rightsBasis: 'licence', rightsRef, order: 0 } },
    success: { status: 201, headers: { ETag: '"1"' }, body: { data: reelItem, meta } },
    failure: { status: 422, body: error('RIGHTS_BASIS_REQUIRED', 'Current media rights are required') },
  },
  'PRF-PROF-08': {
    request: { method: 'PUT', path: `/api/v1/reel-items/${EX.reel}`, headers: { 'If-Match': '"1"', 'Idempotency-Key': 'reel-update-01' }, body: { roleCode: 'bass', rightsBasis: 'licence', rightsRef, order: 1, desiredState: 'verifying_rights' } },
    success: { status: 200, headers: { ETag: '"2"' }, body: { data: { ...reelItem, order: 1, version: '2' }, meta } },
    failure: { status: 409, body: error('INVALID_STATE_TRANSITION', 'Reel transition is not allowed') },
  },
  'PRF-PROF-09': {
    request: { method: 'DELETE', path: `/api/v1/reel-items/${EX.reel}`, headers: { 'If-Match': '"2"', 'Idempotency-Key': 'reel-remove-01' }, body: { reasonCode: 'controller_unlisted' } },
    success: { status: 200, headers: { ETag: '"3"' }, body: { data: { ...reelItem, state: 'takedown', version: '3' }, meta } },
    failure: { status: 409, body: error('VERSION_CONFLICT', 'Reel item changed', { currentVersion: '3' }) },
  },
  'PRF-PROF-10': {
    request: { method: 'POST', path: '/internal/v1/profile-fact-observations', headers: { 'Idempotency-Key': 'observation-01' }, body: { messageId: EX.message, producer: 'shard07', partyId: EX.party, fact: creditRef, provenanceState: 'attested', evidenceClass: 'issuer', evidenceCount: 1, visibility: 'public', embargoUntil: null, listingState: 'listed', disputeState: 'clear', occurredOn: '2026-08-01', roleCodes: ['bass'], payload: { title: 'Session credit' }, observedAt: EX.time } },
    success: { status: 202, headers: { Location: `/api/v1/jobs/${EX.job}` }, body: job },
    failure: { status: 422, body: error('EVENT_SCHEMA_INVALID', 'Observation contract failed') },
  },
  'PRF-PROF-11': {
    request: { method: 'GET', path: `/api/v1/profiles/${EX.party}/emphasis`, query: { surface: 'public' } },
    success: { status: 200, headers: { ETag: '"2"' }, body: { data: emphasis, meta } },
    failure: { status: 403, body: error('FORBIDDEN', 'Profile curation authority required') },
  },
  'PRF-EPK-01': {
    request: { method: 'POST', path: `/api/v1/profiles/${EX.party}/epk-shares`, headers: { 'If-Match': '"42"', 'Idempotency-Key': 'epk-create-001' }, body: { recipientLabel: 'Venue booker', purposeCode: 'booking', selection } },
    success: { status: 201, body: { data: { ...share, shareToken: 'u9Q2Fj7M_l0sZ4xW6cV8bN1pR3tY5kH7dS9aG2mJ4qE' }, meta } },
    failure: { status: 422, body: error('CONSENT_REQUIRED', 'Private inclusion lacks current consent') },
  },
  'PRF-EPK-02': {
    request: { method: 'GET', path: `/api/v1/profiles/${EX.party}/epk-shares`, query: { state: 'active', limit: 20 } },
    success: { status: 200, body: { data: [share], meta: { requestId: EX.request, nextCursor: null } } },
    failure: { status: 403, body: error('FORBIDDEN', 'EPK authority required') },
  },
  'PRF-EPK-03': {
    request: { method: 'GET', path: `/api/v1/epk-shares/${EX.share}` },
    success: { status: 200, headers: { ETag: '"1"' }, body: { data: share, meta } },
    failure: { status: 404, body: error('RESOURCE_NOT_FOUND', 'Share not found') },
  },
  'PRF-EPK-04': {
    request: { method: 'PUT', path: `/api/v1/epk-shares/${EX.share}`, headers: { 'If-Match': '"1"', 'Idempotency-Key': 'epk-update-001' }, body: { selection, expiresAt: '2026-11-26T12:00:00.000Z' } },
    success: { status: 200, headers: { ETag: '"2"' }, body: { data: { ...share, version: '2' }, meta } },
    failure: { status: 422, body: error('INVALID_EXPIRY', 'Expiry exceeds 365 days') },
  },
  'PRF-EPK-05': {
    request: { method: 'DELETE', path: `/api/v1/epk-shares/${EX.share}`, headers: { 'If-Match': '"2"', 'Idempotency-Key': 'epk-revoke-001' }, body: { reasonCode: 'sender_revoked' } },
    success: { status: 200, headers: { ETag: '"3"' }, body: { data: { ...share, state: 'revoked', revokedAt: EX.time, version: '3' }, meta } },
    failure: { status: 409, body: error('VERSION_CONFLICT', 'Share changed', { currentVersion: '3' }) },
  },
  'PRF-EPK-06': {
    request: { method: 'GET', path: '/epk/u9Q2Fj7M_l0sZ4xW6cV8bN1pR3tY5kH7dS9aG2mJ4qE' },
    success: { status: 200, body: { data: { shareId: EX.share, partyId: EX.party, purposeCode: 'booking', layers: [{ code: 'record', state: 'ready', facts: [publicFact] }], selectedSourceVersions: [creditRef], currentAsOf: EX.time, materialChangesPresent: false }, meta } },
    failure: { status: 410, body: error('SHARE_UNAVAILABLE', 'Share is unavailable') },
  },
  'PRF-EPK-07': {
    request: { method: 'POST', path: `/api/v1/epk-shares/${EX.share}/pdf-jobs`, headers: { 'If-Match': '"2"', 'Idempotency-Key': 'epk-pdf-0001' }, body: { locale: 'en', paper: 'letter' } },
    success: { status: 202, headers: { Location: `/api/v1/jobs/${EX.job}` }, body: { ...job, type: 'epk_pdf_render' } },
    failure: { status: 422, body: error('CONSENT_REQUIRED', 'Live selection is no longer eligible') },
  },
  'PRF-EPK-08': {
    request: { method: 'GET', path: `/api/v1/epk-shares/${EX.share}/pdf-snapshots/${EX.snapshot}` },
    success: { status: 200, body: { data: { snapshotId: EX.snapshot, shareId: EX.share, projectionDigest: 'b'.repeat(64), currentAsOf: EX.time, sourceVersions: [creditRef], objectAccess: { url: 'https://objects.invalid/epk.pdf', expiresAt: '2026-08-28T12:01:00.000Z' }, accessibilityReport: { status: 'passed' }, createdAt: EX.time }, meta } },
    failure: { status: 409, body: error('PDF_NOT_READY', 'Snapshot is not ready') },
  },
} as const;
```

## Database Schema

### PostgreSQL DDL

```sql
create schema if not exists profiles;

create table profiles.profile_section_revisions (
  id uuid primary key,
  party_id uuid not null,
  section_code text not null check (section_code in ('now','biography','services','availability')),
  blocks jsonb not null check (jsonb_typeof(blocks) = 'array'),
  author_person_id uuid not null,
  acting_party_id uuid not null,
  state text not null check (state in ('draft','active','archived')),
  version bigint not null check (version > 0),
  client_reason text not null check (char_length(client_reason) between 1 and 240),
  created_at timestamptz not null,
  activated_at timestamptz,
  archived_at timestamptz,
  check (
    (state = 'draft' and activated_at is null and archived_at is null)
    or (state = 'active' and activated_at is not null and archived_at is null)
    or (state = 'archived' and activated_at is not null and archived_at is not null)
  ),
  unique (party_id, section_code, version)
);
create unique index profile_section_one_active
  on profiles.profile_section_revisions (party_id, section_code)
  where state = 'active';
create index profile_section_history
  on profiles.profile_section_revisions (party_id, section_code, version desc);

create table profiles.profile_section_heads (
  party_id uuid not null,
  section_code text not null check (section_code in ('now','biography','services','availability')),
  active_revision_id uuid references profiles.profile_section_revisions(id),
  latest_revision_id uuid references profiles.profile_section_revisions(id),
  version bigint not null check (version > 0),
  updated_at timestamptz not null,
  primary key (party_id, section_code)
);

create table profiles.profile_fact_projections (
  party_id uuid not null,
  source_type text not null,
  source_id uuid not null,
  source_version bigint not null check (source_version > 0),
  producer text not null check (producer in ('shard01','shard04','shard07','shard17','shard20')),
  provenance_state text not null check (provenance_state in ('asserted','attested','confirmed_assertion','creator_asserted','disputed')),
  evidence_class text not null,
  evidence_count integer not null check (evidence_count between 0 and 10000),
  visibility text not null check (visibility in ('public','protected','private')),
  embargo_until timestamptz,
  listing_state text not null check (listing_state in ('listed','unlisted','ineligible')),
  dispute_state text not null check (dispute_state in ('clear','disputed','withheld')),
  party_lifecycle text not null check (party_lifecycle in ('active','restricted','closed','shadow_unclaimed')),
  occurred_on date,
  role_codes text[] not null default '{}',
  projection_payload jsonb not null,
  payload_schema_version integer not null check (payload_schema_version > 0),
  observed_at timestamptz not null,
  applied_at timestamptz not null,
  primary key (party_id, source_type, source_id)
);
create index profile_fact_public_record
  on profiles.profile_fact_projections (party_id, occurred_on desc, source_id)
  where visibility = 'public' and listing_state = 'listed' and dispute_state <> 'withheld';
create index profile_fact_source_version
  on profiles.profile_fact_projections (producer, source_type, source_id, source_version desc);

create table profiles.profile_projection_inbox (
  message_id uuid primary key,
  producer text not null,
  source_type text not null,
  source_id uuid not null,
  source_version bigint not null,
  payload jsonb not null,
  payload_hash bytea not null,
  received_at timestamptz not null,
  processed_at timestamptz,
  failure_code text,
  unique (producer, source_type, source_id, source_version)
);

create table profiles.profile_emphases (
  party_id uuid not null,
  surface text not null check (surface in ('public','epk')),
  default_filter jsonb,
  ordered_refs jsonb not null check (jsonb_typeof(ordered_refs) = 'array'),
  actor_person_id uuid not null,
  acting_party_id uuid not null,
  version bigint not null check (version > 0),
  updated_at timestamptz not null,
  primary key (party_id, surface)
);

create table profiles.reel_items (
  id uuid primary key,
  party_id uuid not null,
  credit_source_type text not null,
  credit_id uuid not null,
  credit_version bigint not null check (credit_version > 0),
  media_source_type text not null,
  media_id uuid not null,
  media_version bigint not null check (media_version > 0),
  role_code text not null,
  rights_basis text not null check (rights_basis in ('ownership','licence','provider_publication')),
  rights_source_type text not null,
  rights_id uuid not null,
  rights_version bigint not null check (rights_version > 0),
  display_order integer not null check (display_order between 0 and 999),
  state text not null check (state in ('draft','verifying_rights','active','rejected','takedown')),
  state_reason text,
  actor_person_id uuid not null,
  acting_party_id uuid not null,
  version bigint not null check (version > 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (party_id, credit_id, media_id)
);
create index reel_public_order on profiles.reel_items (party_id, display_order, id) where state = 'active';
create index reel_rights_lookup on profiles.reel_items (rights_source_type, rights_id) where state in ('verifying_rights','active');

create table profiles.epk_shares (
  id uuid primary key,
  party_id uuid not null,
  creator_person_id uuid not null,
  acting_party_id uuid not null,
  token_hash bytea not null unique,
  token_key_version smallint not null check (token_key_version > 0),
  recipient_label_ciphertext bytea not null,
  recipient_label_hash bytea not null,
  purpose_code text not null,
  selected_fact_refs jsonb not null check (jsonb_typeof(selected_fact_refs) = 'array'),
  consent_refs jsonb not null check (jsonb_typeof(consent_refs) = 'array'),
  approved_disclosure_refs jsonb not null check (jsonb_typeof(approved_disclosure_refs) = 'array'),
  selection_digest bytea not null,
  state text not null check (state in ('active','expired','revoked')),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revocation_reason text,
  version bigint not null check (version > 0),
  material_change_count integer not null default 0 check (material_change_count >= 0),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  check (expires_at > created_at and expires_at <= created_at + interval '365 days'),
  check ((state = 'revoked') = (revoked_at is not null))
);
create index epk_owner_state on profiles.epk_shares (party_id, state, created_at desc, id);
create index epk_expiry_due on profiles.epk_shares (expires_at, id) where state = 'active';

create table profiles.epk_open_events (
  epk_share_id uuid not null references profiles.epk_shares(id),
  opened_day date not null,
  first_opened_at timestamptz not null,
  last_opened_at timestamptz not null,
  open_count integer not null check (open_count > 0),
  primary key (epk_share_id, opened_day),
  check (date_trunc('day', first_opened_at at time zone 'UTC')::date = opened_day),
  check (date_trunc('hour', first_opened_at) = first_opened_at),
  check (date_trunc('hour', last_opened_at) = last_opened_at),
  check (last_opened_at >= first_opened_at)
);

create table profiles.epk_pdf_snapshots (
  id uuid primary key,
  epk_share_id uuid not null references profiles.epk_shares(id),
  projection_digest bytea not null,
  source_versions jsonb not null check (jsonb_typeof(source_versions) = 'array'),
  object_id uuid,
  state text not null check (state in ('queued','rendering','ready','failed')),
  accessibility_report jsonb,
  current_as_of timestamptz not null,
  created_at timestamptz not null,
  completed_at timestamptz,
  failure_code text,
  unique (epk_share_id, projection_digest)
);
create index epk_snapshot_owner on profiles.epk_pdf_snapshots (epk_share_id, created_at desc);

create view profiles.public_profile_facts
with (security_invoker = true) as
select party_id, source_type, source_id, source_version, provenance_state,
       evidence_class, evidence_count, occurred_on, role_codes, projection_payload
from profiles.profile_fact_projections
where visibility = 'public'
  and listing_state = 'listed'
  and dispute_state <> 'withheld'
  and party_lifecycle = 'active'
  and (embargo_until is null or embargo_until <= transaction_timestamp());
```

All JSONB writes also run the matching Zod schema before SQL. Database checks are defense in depth, not the primary semantic validator. IDs and timestamps are server-generated. Token hashes use a rotating keyed digest; raw share tokens exist only in the creation response and request path.

### Transaction and immutability rules

1. Profile initialization creates four `profile_section_heads` and two empty `profile_emphases` rows at positive version 1. Section activation locks its head, validates that positive ETag, inserts the new immutable content revision, archives the prior active row, advances the head and appends `profile.projection.invalidated.v1` in one transaction. A trigger rejects changes to revision blocks, authors or creation time after insert.
2. Emphasis uses one initialized row per party/surface. “Last write wins” means the highest successfully committed version determines rendering; it does not permit blind writes. Stale writers receive 409.
3. Projection ingress inserts the inbox row first. The worker applies only a source version greater than the stored version, recomputes viewer eligibility, stores the new fact projection and appends invalidation in one transaction. Equal versions replay; lower versions are acknowledged as stale.
4. Reel creation commits `verifying_rights`; a verifier locks the item and current bounded observations before activating. Rights revocation/takedown commits `takedown` plus invalidation atomically. Credit truth remains untouched.
5. EPK creation validates all selected source/consent versions under a party lock, generates 32 random bytes, stores only the digest, commits share plus idempotency record, and returns the raw token exactly once.
6. Every live EPK read re-evaluates the stored selection against current local observations. Lost eligibility omits the fact, never substitutes data, and schedules one material-change event per share/source/current version. The share remains `active` until expiry/revocation.
7. Open counting performs a single daily upsert after a successful render. It receives only share ID and server time. Request headers, account, address, user agent and referrer are neither parameters nor columns.
8. PDF generation freezes a validated live projection digest, source-version list and `current_as_of`; the object is immutable. Share expiry/revocation blocks new live renders but does not delete an already delivered snapshot.
9. Durable mutation, idempotency result and outbox event commit together. Provider, queue and PDF effects occur after commit.

### RLS, grants and direct-access posture

| Relation | Anonymous | Authenticated controller | Internal projection/PDF worker | Operations |
|---|---|---|---|---|
| Base tables | No direct grants; public request is mediated by Worker | Least-privilege route transaction plus RLS scoped by actor/acting party | Named no-login role for owned jobs only | Break-glass purpose grant, reason and audit |
| `public_profile_facts` security-invoker view | Worker public-reader role selects eligible rows under forced RLS | Same public rows; protected controller reads use route contract | Rebuild/verify | Audit |
| Section history/emphasis | None | SELECT/mutate only when current party control or scoped mandate predicate passes | Invalidation only | Audit-only human author access |
| Reel items | Active public projection through API/view only | Own party rows under mandate predicate | Rights/takedown state transition only | Audit |
| EPK shares/snapshots | None; token route uses dedicated capability lookup | Own party rows; token hash never selected | Expiry/material-change/PDF jobs | Audit |
| Open events | None | Aggregate count through redacted owner response only | Daily counter upsert | Privacy audit |

- RLS is enabled and forced on every base table. PostgREST `anon` and `authenticated` receive no direct Shard 02 relation grants; all privileges are revoked from `public`.
- The Worker assumes a named no-login `profile_public_reader` role for public reads. That role receives the minimum underlying SELECT privilege required by PostgreSQL `security_invoker` plus a forced-RLS policy limited to eligible public rows; it has no mutation or protected-row policy. Any exceptional `SECURITY DEFINER` helper must set `search_path = ''`, schema-qualify every object, be non-owner-callable by default and receive explicit EXECUTE only for its named Worker role.
- User-facing Worker requests never use the Supabase service-role credential. Internal roles cannot be selected through a caller-controlled producer, party, schema or function name.
- RLS predicates consume server-set transaction claims for actor person, acting party, capabilities and mandate version; bodies cannot set those claims.

## Middleware & Policies

### Ordered middleware

1. Resolve/generate request ID; normalize method, path, locale and content type.
2. Enforce body-size and media-type limits before parsing.
3. Parse path/query/header/body with the operation's strict Zod schema; redact parse values from logs.
4. Apply public-IP or authenticated actor/party rate policy. The EPK token route hashes the token before limit lookup and never logs it.
5. For protected routes, verify Supabase session, recent MFA where named, human actor, acting party, mandate/capability and party lifecycle. For PRF-PROF-10, verify the registered service binding and producer ownership.
6. Resolve target under concealment rules: unauthorized or non-public targets usually return 404; an already-known actor-owned target may return 403.
7. Validate `Idempotency-Key` and `If-Match` before domain validation; lock the owning aggregate and recheck authority/source versions inside the transaction.
8. Commit domain row, idempotency response and outbox record together.
9. Shape through an explicit response schema, attach ETag/cache headers and structured telemetry, then remove all non-schema properties.

### Authorization matrix

| Actor | Allowed | Explicitly forbidden |
|---|---|---|
| Public profile viewer | Read a claimed/public profile, visible portfolio, active reel and active token share | Infer unclaimed shadow, private alias, denied source identity, attester, legal identity, trader address or hidden aggregate delta |
| Subject/controller | Edit asserted sections, curate emphasis/reel, create/revoke EPK, view own revisions/snapshots | Alter attested facts, fixed layer order, provenance style, canonical credit, rights result, consent or open telemetry |
| Mandated representative | Same operation only while mandate scope/version is current | Act outside party/surface/purpose/time scope; substitute own human identity |
| Source producer | Submit bounded versioned facts for its registered source types | Read profile stores, choose public styling, mint authority, mutate other producers' source rows |
| Rights/takedown worker | Verify/reject/takedown named reel item from Shard 04 observation | Grant rights, edit credit, restore item without a newer valid rights observation |
| PDF worker | Read one frozen, already-authorized snapshot payload and write one object | Fetch higher-shard stores, expand selection, retain token or bypass accessibility gate |
| Support/operations | Mechanical retry under expiring purpose grant; inspect redacted telemetry | Silent content/consent/rights override or export private evidence |

### Privacy, cache and content policy

- Candidate facts pass source version, provenance, visibility, embargo, listing, dispute and party lifecycle checks before composition. Private aliases are removed before totals, collaborators, ranges, filters, cursors, counts and cache keys are computed.
- Fixed layers always report a state. `empty` is emitted only after an authorized successful query returns no facts. Timeout, denial and source error use `unavailable` or `denied`; the response does not reveal which hidden record caused it.
- Legal identity, trader address, attester identity, evidence reference, consent artifact, token hash and raw contact/rate values are absent from the public projection schema.
- Asserted content is stored as structured text blocks and rendered escaped. It cannot contain HTML, CSS, scripts, active URLs, badge glyphs or reserved verification presentation.
- Public profile/portfolio/reel cache keys include public projection version, locale and normalized visible filters. Protected, controller, token and signed-object responses are `private, no-store`.
- CSP denies inline script/style and unapproved frames. Reel embed hosts are a build-time allowlist; URLs are constructed from verified provider IDs, never caller-supplied markup.
- EPK forwarding is expected and disclosed before creation. Token possession grants only the selected live view. Recipient labels are informational and are stored encrypted/redacted plus a lookup-safe hash.
- Logs contain stable opaque IDs, operation ID, outcome, version and duration. They exclude profile text, alias/contact/rate values, raw token, consent/evidence payload, IP on EPK-open telemetry and signed object URLs.

### State machines

| Aggregate | Allowed transitions | Rejected behavior |
|---|---|---|
| Profile section revision | `draft → active → archived` | Direct `draft → archived`; archived reactivation; two active rows |
| Reel item | `draft → verifying_rights → active` or `rejected` or `takedown`; `active → takedown` | Controller self-verification, active-rights replacement in place, takedown restoration without a new item/versioned rights review, physical deletion |
| EPK share | `active → expired` by deterministic clock job or `active → revoked` by command | Expired/revoked reactivation, token rotation that silently changes existing link, source change changing state |
| PDF snapshot | `queued → rendering → ready` or `failed` | Publish before accessibility/object verification, mutate a ready snapshot |

### Per-operation middleware, error envelope, limits, telemetry, and test matrix

Every row below is keyed to the authoritative operation ID. Route Registry cells remain the single source for exact route-specific auth, rate, idempotency, and success/error status values; this matrix adds the boundary execution policy and makes each operation explicit.

| Operation ID | Auth and ownership | Rate limit | Input validation | CORS policy | Global error envelope | Error and retry guidance | Pagination and limits | Idempotency and concurrency | Observability | Test oracle |
|---|---|---|---|---|---|---|---|---|---|---|
| PRF-PROF-01 | The authoritative Route Registry PRF-PROF-01 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-01 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-01 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-01 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-01; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-02 | The authoritative Route Registry PRF-PROF-02 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-02 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-02 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Opaque cursor; default 25 and maximum 50; deterministic created_at DESC then id DESC; only the operation declared allowlisted filters; offset and unknown filters rejected. | The authoritative Route Registry PRF-PROF-02 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-02; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-03 | The authoritative Route Registry PRF-PROF-03 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-03 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-03 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-03 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-03; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-04 | The authoritative Route Registry PRF-PROF-04 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-04 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-04 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-04 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-04; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-05 | The authoritative Route Registry PRF-PROF-05 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-05 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-05 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Opaque cursor; default 25 and maximum 50; deterministic created_at DESC then id DESC; only the operation declared allowlisted filters; offset and unknown filters rejected. | The authoritative Route Registry PRF-PROF-05 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-05; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-06 | The authoritative Route Registry PRF-PROF-06 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-06 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-06 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Opaque cursor; default 25 and maximum 50; deterministic created_at DESC then id DESC; only the operation declared allowlisted filters; offset and unknown filters rejected. | The authoritative Route Registry PRF-PROF-06 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-06; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-07 | The authoritative Route Registry PRF-PROF-07 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-07 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-07 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-07 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-07; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-08 | The authoritative Route Registry PRF-PROF-08 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-08 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-08 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-08 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-08; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-09 | The authoritative Route Registry PRF-PROF-09 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-09 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-09 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-09 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-09; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-10 | The authoritative Route Registry PRF-PROF-10 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-10 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-10 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy non-browser service; browser origins denied; signed producer principal only. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-10 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-10; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-PROF-11 | The authoritative Route Registry PRF-PROF-11 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-PROF-11 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-PROF-11 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-PROF-11 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-PROF-11; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-01 | The authoritative Route Registry PRF-EPK-01 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-01 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-01 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-01 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-01; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-02 | The authoritative Route Registry PRF-EPK-02 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-02 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-02 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Opaque cursor; default 25 and maximum 50; deterministic created_at DESC then id DESC; only the operation declared allowlisted filters; offset and unknown filters rejected. | The authoritative Route Registry PRF-EPK-02 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-02; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-03 | The authoritative Route Registry PRF-EPK-03 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-03 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-03 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-03 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-03; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-04 | The authoritative Route Registry PRF-EPK-04 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-04 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-04 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-04 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-04; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-05 | The authoritative Route Registry PRF-EPK-05 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-05 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-05 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-05 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-05; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-06 | The authoritative Route Registry PRF-EPK-06 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-06 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-06 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy public-read allowlist; credentials=false; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-06 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-06; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-07 | The authoritative Route Registry PRF-EPK-07 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-07 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-07 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-07 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-07; assert exact ApiError envelope and no unauthorized side effect. |
| PRF-EPK-08 | The authoritative Route Registry PRF-EPK-08 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry PRF-EPK-08 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for PRF-EPK-08 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry PRF-EPK-08 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for PRF-EPK-08; assert exact ApiError envelope and no unauthorized side effect. |
## Data Flow

### Public profile and portfolio

1. Shard 01/04/07/17/20 commits canonical truth and its outbox record.
2. A registered adapter maps only the approved bounded observation and invokes PRF-PROF-10 or the equivalent queue consumer.
3. Inbox dedupe and monotonic source-version checks run before projection mutation.
4. The projection worker filters visibility and stores the current local fact; it emits `profile.projection.invalidated.v1`.
5. The publication job rebuilds a version-addressed projection. Alias visibility is applied before every aggregate, filter and cache key.
6. PRF-PROF-01/05 composes fixed layers/read model from that projection. No request-time higher-shard store read occurs.
7. If a source slot fails, the response keeps its explicit non-empty state and serves stale eligible data only within BE00's bounded stale policy.

### Section edit

1. Middleware resolves the human actor, acting party and current mandate.
2. The route validates asserted section and safe structured blocks, then checks the strong section version.
3. The transaction locks party/section, archives the prior active row when the new revision activates, inserts the revision with both actor identities and appends invalidation.
4. A replay returns the stored response. A concurrent loser receives the current version without losing content.

### Reel curation and takedown

1. Creation checks current bounded credit, media and rights observations, records their exact versions as `draft`, and submits that exact version for verification in the same command.
2. The accepted item commits as `verifying_rights`; the response never implies publication. A controller may reorder without changing an active item's verified source tuple; replacing rights or media requires a new item and takedown of the old one.
3. The rights worker rechecks the same facts and moves to active or rejected.
4. A later rights/takedown observation atomically moves affected active items to `takedown`, invalidates the profile and queues controller notice.
5. Credit and co-contributor projections remain unchanged.

### Live EPK and snapshot

1. Creation discloses forwardability and exact selected categories. The controller explicitly selects each private alias/member credit and supplies current consent references.
2. The transaction revalidates party control, projection/consent versions and expiry, commits the share and returns a one-time token.
3. Token read resolves the digest, verifies active/expiry state and recomputes only selected facts from local observations.
4. Lost consent, rights or visibility omits the affected fact. The live share stays active; a deduped `profile.epk.material-change.v1` notifies the sender.
5. After a successful response, the daily coarse open counter increments without request-derived identity.
6. Optional PDF acceptance revalidates the live selection. The worker renders semantic tagged content, canonical live link, source/version list and “current as of” timestamp; accessibility/object verification must pass before ready.
7. Revocation/expiry stops token rendering. Existing snapshot bytes remain an explicitly dated historical export under their original access policy.

### External seam contracts and circuit state

Every source, rights, media, renderer, object, or notification adapter below has a strict request and response DTO. Requests carry `requestId`, operation id, source or projection version, and idempotency binding where a command can create work. Adapter payloads are normalized to the local response schemas; timeouts never activate a profile, publish a reel, or create a ready snapshot.

| Operations | Seam and owner | Exact request | Exact response | Timeout | Retry policy | Circuit, open state, and recovery |
|---|---|---|---|---:|---|---|
| PRF-PROF-10 | Registered Shard 01, 04, 07, 17, or 20 observation producer | `messageId`, `producer`, `partyId`, `fact`, `provenanceState`, `evidenceClass`, `evidenceCount`, `visibility`, `listingState`, `disputeState`, `occurredOn`, `roleCodes`, bounded `payload`, `observedAt`, `sourceVersion`, `requestId` | `observationId`, `accepted`, `dedupeState`, `projectionVersion`, `invalidationEventId` | 2,000 ms | Three queue deliveries at 15, 60, and 300 seconds; duplicate message IDs replay the durable result | Five admission failures in 60 seconds open for 60 seconds; producer receives 503 or quarantine, no projection mutation occurs, and the inbox reconciles by message and source version |
| PRF-PROF-07, PRF-PROF-08, PRF-PROF-09 | Shard 04 media and rights observation adapter | `reelItemId`, `partyId`, `creditRef`, `mediaRef`, `rightsBasis`, `rightsRef`, `sourceVersions`, `expectedItemVersion`, `requestId` | `rightsState`, `mediaState`, `observationVersion`, `decision`, `observedAt` | 2,000 ms | Three attempts at 15, 60, and 300 seconds through the verifier queue; stale results are acknowledged as no-ops | Five failures in 60 seconds open for 60 seconds; reel remains `verifying_rights`, no active publication is allowed, and the item is reconciled by version |
| PRF-PROF-01, PRF-PROF-05, PRF-PROF-06, PRF-EPK-06 | Shard 01, 04, 07, 17, and 20 authorized projections | `partyId`, `surface`, `normalizedFilters`, `cursor`, `audienceContextHash`, `requestedSourceVersions`, `purposeCode`, `requestId` | `projectionVersion`, fixed layer states, allowlisted facts, `sourceVersions`, `generatedAt` | 2,000 ms | Two safe reads at 250 ms and 750 ms; serve only bounded eligible stale data under the declared stale policy | Five failures in 60 seconds open for 60 seconds; affected layer is `unavailable` or `denied`, never `empty`, and publication rebuild retries from the outbox |
| PRF-EPK-07, PRF-EPK-08 | PDF renderer, object store, and accessibility verifier | `shareId`, `projectionDigest`, `locale`, `paper`, `sourceVersions`, `expectedByteLimit`, `retentionUntil`, `requestId` | `snapshotId`, `objectReceipt`, `checksum`, `byteSize`, `accessibilityState`, `objectAccessExpiresAt` | 10,000 ms | Two attempts at 1,000 ms and 5,000 ms for safe render/object stages; a partial object is quarantined | Three failures in 60 seconds open for 60 seconds; job becomes `failed`, object remains quarantined, and no ready snapshot or access URL is issued; retry starts from the last verified stage |
| PRF-EPK-07 and profile material-change workers | Notification delivery adapter | `shareId`, `partyId`, `materialChangeDigest`, `recipientRef`, `eventId`, `requestId` | `deliveryAttemptId`, `deliveryState`, `providerReference`, `acceptedAt` | 5,000 ms | Three attempts at 15, 60, and 300 seconds using the same event ID; unknown acceptance is reconciled before a new send | Five failures in 60 seconds open for 60 seconds; outbox remains pending or DLQ, live share state is unchanged, and replay uses the same event ID |

### Jobs, schedules and ownership

| Job | Trigger and owner | Retry/dedupe | Terminal handling |
|---|---|---|---|
| `profile-projection-apply` | Protected observation; Shard 02 projection worker | At-least-once; `producer/source/id/version` unique | Schema/auth failure quarantined; repeated poison message to DLQ and alert |
| `profile-publication-rebuild` | `profile.projection.invalidated.v1`; Shard 02 | Party plus source version; newer version supersedes older | Preserve last known eligible projection, mark layer unavailable, alert after retry budget |
| `reel-rights-verify` | Reel create/update or rights observation; Shard 02 with Shard 04 adapter | Item/version unique; stale result ignored | Reject/leave non-public; never default active |
| `epk-material-change` | Projection/consent change; Shard 02 | Share/source/current-version unique | Live omission still applies; notification retries independently and DLQs |
| `epk-pdf-render` | PRF-EPK-07; Shard 02 PDF worker | Share/projection digest unique | Snapshot `failed` with typed code; no partial object published |
| `epk-expire` | Minute schedule over indexed due rows; Shard 02 | Share/version CAS; repeated run no-op | Alert on oldest overdue active share; token read also enforces time synchronously |
| `outbox-publish` | Every committed mutation; BE00 | Outbox ID and consumer inbox unique | Exponential retry with jitter; DLQ plus operational replay, never manual data patch |

### Event schemas

```ts
const EventEnvelope = z.strictObject({
  eventId: Uuid,
  eventType: z.string().regex(/^[a-z][a-z0-9_.-]{1,127}$/),
  eventVersion: z.literal(1),
  aggregateId: Uuid,
  aggregateVersion: Version,
  occurredAt: Instant,
  correlationId: z.string().min(16).max(128),
  causationId: z.string().min(16).max(128),
payload: z.json(),
});

export const ProfileProjectionInvalidatedV1 = EventEnvelope.extend({
  eventType: z.literal('profile.projection.invalidated.v1'),
  payload: z.strictObject({
    partyId: Uuid,
    sourceType: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),
    sourceId: Uuid,
    sourceVersion: Version,
    reason: z.enum(['source_changed', 'section_changed', 'emphasis_changed', 'reel_changed', 'party_lifecycle_changed']),
  }),
}).strict();

export const ProfileEpkMaterialChangeV1 = EventEnvelope.extend({
  eventType: z.literal('profile.epk.material-change.v1'),
  payload: z.strictObject({
    epkShareId: Uuid,
    partyId: Uuid,
    sourceType: z.string().regex(/^[a-z][a-z0-9_.-]{1,63}$/),
    sourceId: Uuid,
    previousDigest: z.string().regex(/^[a-f0-9]{64}$/),
    currentDigest: z.string().regex(/^[a-f0-9]{64}$/),
    changedCategories: z.array(z.enum(['fact_removed', 'fact_changed', 'consent_revoked', 'rights_revoked', 'visibility_changed'])).min(1).max(5),
  }),
}).strict();
```

Consumers validate the whole envelope before side effects. Delivery is at least once; consumer inbox records `eventId`, handler version and result. An unknown event version is quarantined, not coerced.

### Failure recovery

| Failure | Client-visible result | Durable state and recovery |
|---|---|---|
| Projection dependency unavailable before mutation | 503 `DEPENDENCY_UNAVAILABLE` or explicit layer `unavailable` on a safe read | No invented empty result; bounded last-known eligible projection may serve under versioned stale policy |
| Queue unavailable after domain commit | Success/accepted response remains valid | Outbox row stays pending; publisher retries and alerts by age |
| Source version arrives out of order | 202 replay/no-op | Stored newer projection remains; stale inbox result records reason |
| Two section/emphasis/share writers race | One commit; loser 409 `VERSION_CONFLICT` | Winner plus outbox is atomic; loser receives current ETag |
| Media/rights service outage | Reel stays `verifying_rights`; 202/409 typed state | Retry verifier; item never publishes by timeout |
| Consent or rights revoked while EPK is viewed | Affected fact omitted; remaining selected view renders | Material-change event/notice retries; share token/state unchanged |
| Token brute-force/abuse | 404/429 with uniform small response | Per-IP/share digest limits; no token logging; security alert without open-event enrichment |
| PDF render/object/accessibility failure | Job becomes failed; snapshot route 409/404 as applicable | Quarantine partial object; retry only safe stages; no ready row until all gates pass |
| Expiry scheduler delayed | Public token read still returns 410 after `expiresAt` | Repair job CAS-transitions row to expired and emits audit event |

## Error Handling

### Error catalogue

| Code | HTTP | Meaning and safe details |
|---|---:|---|
| `INVALID_REQUEST` | 400 | Missing/malformed required header, invalid JSON or mutually inconsistent request shape; field/header names only |
| `UNAUTHENTICATED` | 401 | Protected route lacks a valid session; step-up uses BE00 `STEP_UP_REQUIRED` |
| `PRODUCER_AUTH_FAILED` | 401 | Internal producer binding/signature invalid |
| `FORBIDDEN` | 403 | Known owned target but capability/mandate insufficient |
| `RESOURCE_NOT_FOUND` | 404 | Unknown, concealed, non-public or foreign target |
| `SHARE_UNAVAILABLE` | 410 | Known share token expired/revoked; no reason distinction to public viewer |
| `VERSION_CONFLICT` | 409 | Strong expected version stale; protected details may include current version |
| `IDEMPOTENCY_CONFLICT` | 409 | Key reused with a different canonical request |
| `SECTION_STATE_CONFLICT` | 409 | Requested section transition cannot serialize |
| `CURSOR_STALE` | 409 | Projection version changed during pagination |
| `MEDIA_NOT_READY` | 409 | Governed media has no ready local observation |
| `RIGHTS_REVOKED` | 409 | Selected rights observation no longer current |
| `INVALID_STATE_TRANSITION` | 409 | Aggregate transition not permitted |
| `PDF_NOT_READY` | 409 | Snapshot exists but is not ready |
| `VALIDATION_FAILED` | 422 | Strict schema/field validation; safe issue paths only |
| `SECTION_NOT_ASSERTED` | 422 | Caller tried to edit an attested/reserved section |
| `CONTENT_NOT_ALLOWED` | 422 | Active content or reserved presentation attempted |
| `INVALID_EMPHASIS` | 422 | Duplicate, foreign or excessive curation reference |
| `RIGHTS_BASIS_REQUIRED` | 422 | Clip lacks current governed rights basis |
| `CONSENT_REQUIRED` | 422 | Private/member inclusion lacks current named consent |
| `UNAPPROVED_DISCLOSURE` | 422 | Contact/rate value was not selected by approved reference |
| `INVALID_EXPIRY` | 422 | EPK expiry outside now through 365-day bound |
| `EVENT_SCHEMA_INVALID` | 422 | Protected observation/event version or payload invalid |
| `RATE_LIMITED` | 429 | Named bucket exhausted; safe `Retry-After` |
| `DEPENDENCY_UNAVAILABLE` | 503 | Required local adapter/job dependency unavailable |
| `TIMEOUT` | 504 | Deadline exceeded without claiming success |
| `INTERNAL_ERROR` | 500 | Unexpected failure; request ID only |

All failures use the same four-field `ApiError`. Stack traces, SQL/provider messages, tokens, signed URLs, content, consent/evidence and hidden identifiers never enter the response or logs.

### Endpoint error coverage

| Operations | Required statuses |
|---|---|
| PRF-PROF-01, 05, 06 | 400, 404, 409 cursor where applicable, 429, 503, 504, 500 |
| PRF-PROF-02, 11 | 400, 401, 403/404 concealment, 429, 503, 504, 500 |
| PRF-PROF-03, 04, 08, 09 | 400, 401, 403/404, 409, 413, 415, 422, 429, 503, 504, 500 |
| PRF-PROF-07 | Same mutation set plus 409 media state and 422 rights basis |
| PRF-PROF-10 | 400, 401, 409 idempotency, 413, 415, 422, 429, 503, 504, 500 |
| PRF-EPK-01, 04, 05, 07 | 400, 401, 403/404, 409, 413, 415, 422 consent/expiry, 429, 503, 504, 500 |
| PRF-EPK-02, 03, 08 | 400, 401, 403/404, 409 snapshot where applicable, 429, 503, 504, 500 |
| PRF-EPK-06 | 400, 404, 410, 429, 503, 504, 500; never 401 because token is not account auth |

## Verification and Test Strategy

### Contract and behavior tests

| Area | Mandatory tests |
|---|---|
| Strict transport | Every operation accepts its valid example; rejects unknown keys, malformed UUID/time/cursor/version, missing/wrong media type, oversize body and non-four-field error |
| Concurrency | Missing `If-Match` is 400, malformed is 400, stale is 409; two valid concurrent section activations/emphasis/share mutations produce one winner; replay returns byte-equivalent stored response |
| Public composition | Fixed layer order; truly empty versus denied/unavailable differ; unclaimed shadow is 404; legal/trader fields structurally impossible; no viewer-adaptive order |
| Alias non-interference | Property tests generate hidden aliases and prove identical totals, collaborators, ranges, filters, cursors, counts, cache keys and serialized public body |
| Section safety | HTML/CSS/script/URL/badge/provenance spoof corpus fails; attested/reserved sections fail; prior active revision archives atomically; both author identities persist |
| Portfolio semantics | Unlisting/emphasis changes this page only; source credit/co-contributor results unchanged; no completeness, density or aggregate provenance score fields exist |
| Reel rights | Credit without rights fails; unready media stays non-public; controller cannot self-activate; rights revocation/takedown removes public item while preserving credit/audit |
| EPK selection | Default public-only; every private alias confirmation and member consent is per-send/current; forwarding reveals only selection; raw token returned once and absent from logs/storage |
| EPK live change | Source/consent/rights loss omits fact, keeps active share, increments deduped material-change count and notifies sender; expired/revoked route stops rendering |
| Minimal opens | Successful render increments only daily share counter; schema/log scans prove no account, IP, user agent, fingerprint, email beacon, referrer or cross-site identifier |
| PDF | Snapshot contains canonical live link, source/version list, current-as-of, tagged order, alt text and WCAG 2.2 AA report; failed accessibility gate never publishes; prior PDF persists after share expiry/revocation |
| Inbound observations | Registered source/type matrix, signature/schema/version validation, equal-version replay, stale-version no-op, poison-message quarantine and no upward database read |
| RLS/grants | Anonymous cannot select base tables; controller sees only owned protected rows; cross-party/expired mandate tests fail; workers cannot widen source/surface; security-invoker view obeys base RLS |
| Events/jobs | Transactional outbox atomicity, duplicate delivery, reordering, stale result, retry exhaustion, DLQ replay and unknown event-version quarantine |
| Performance | Profile/profile portfolio p95 ≤1 s at declared page bounds; mutation acceptance ≤2 s; no N+1; query plans use listed indexes; 50-row page and 200-fact EPK remain within Worker CPU/memory budgets |
| Accessibility/security | Automated PDF/HTML accessibility plus manual screen-reader/keyboard sample; token entropy/constant-time lookup, rate abuse, XSS/CSP, SQL injection, IDOR, cache separation and log-redaction suites |

Unit and property tests cover schema/domain functions. PostgreSQL integration tests run real RLS roles, constraints, concurrent transactions and query plans. Worker integration tests exercise Hono middleware order, Supabase JWT claims, queue/outbox and storage capabilities. Playwright covers public profile, keyboard portfolio filtering, reel controls, forwarded EPK, revoke/expiry and accessible PDF download. Release requires 100% operation-to-contract coverage and no unwaived critical/high security finding.

### Ambiguity and deepening gates

| Pass | Result | Evidence |
|---:|---|---|
| 1. Endpoint inventory | PASS | PRF-10–13 reconcile to 19 unique operations; no implied CRUD remains. |
| 2. Request/success/error schemas | PASS | Strict Zod, resource shapes, examples and BE00 error envelope named per operation. |
| 3. Validation and status semantics | PASS | Header, field, state, consent, rights, token and cursor rules map to typed failures. |
| 4. Authn/authz/privacy | PASS | Actor/acting party/mandate, public concealment, producer boundary and minimal-open policy explicit. |
| 5. Persistence and concurrency | PASS | Tables, constraints, indexes, RLS/grants, immutable fields, locks, CAS and transactions explicit. |
| 6. Data flow and failure | PASS | Local bounded observations, no upward reads, jobs, retries, DLQs and recovery states explicit. |
| 7. Event semantics | PASS | Two locked event schemas, envelope, dedupe, ordering and unknown-version handling explicit. |
| 8. Security/accessibility/performance | PASS | Content/token/object/cache/log rules and measurable release tests explicit. |
| 9. Cross-shard ownership | PASS | Shards 01/04/05/07/17/20/38 ownership and inbound boundary do not duplicate canonical truth. |
| 10. Two-implementer test | PASS | Routes, schemas, examples, DDL, transitions, errors and test oracles determine equivalent observable behavior. |

### Release gates

- Public-unclaimed profile/search/sitemap/social/portfolio/object projection remains disabled. No configuration flag can enable it without a new originating-stage decision and downstream propagation.
- Third-party master or user-media reel publication requires the Shard 04 governed-media contract, current ownership/licence/provider-publication basis and takedown path. Otherwise only an approved provider link/embed may be selected.
- Private alias and member-credit EPK disclosure fails closed without current per-send confirmation/consent. A missing source never broadens selection.
- Public embed host allowlist, token key rotation, queue/DLQ, PDF accessibility validator, object quarantine, sender notification and privacy-log controls must exist before the related operation is enabled.
- RLS/grant integration, concurrency, alias non-interference, IDOR, XSS/CSP, token-abuse and log-redaction suites must pass in CI and staging.

## Ambiguity Gate

**PASS.** Implementer simulation and devil's-advocate review covered PRF-PROF-01 through PRF-PROF-11 and PRF-EPK-01 through PRF-EPK-08, strict request and success schemas, per-operation middleware and CORS, BE00 ApiError envelopes, authorization concealment, idempotency and concurrency, typed persistence, state recovery, integration boundaries, observability, tests, and source reconciliation. No unresolved implementation ambiguity remains; open questions are none.

## Open Questions

None for implementation. The user delegated the remaining bounded product and architecture choices, and the choices above preserve the locked IA.

External enablement gates remain visible rather than guessed: Shard 01 authority inputs; Shard 04 media/rights/takedown adapter; Shard 07 credit projection; Shard 17 attendance vocabulary; Shard 20 consent/clearance input; Shard 38 campaign EPK boundary; approved embed providers; PDF renderer/accessibility verifier; notification delivery; and counsel/privacy approval for any future public-unclaimed behavior. An unavailable dependency returns its declared typed state and does not weaken a gate.

## Changelog

| Date | Change | Workflow | Scope |
|---|---|---|---|
| 2026-08-28 | Classified Shard 02 as an approved three-file backend split and assigned PRF-10–13 to 02b | `/write-be-spec-classify` | Classification, inventory, source map |
| 2026-08-28 | Authored complete profile, portfolio, reel, live EPK and accessible snapshot contracts | `/write-be-spec-write` | Routes, schemas, persistence, policies, flows, errors, tests |
| 2026-08-28 | Locked DEC-100 bounded producer ingress, profile/EPK cross-shard ownership and fail-closed privacy/consent/rights decisions | Delegated decision authority | Cross-shard contracts and release gates |
| 2026-08-28 | Completed ten deepening passes and two-implementer ambiguity gate | `/write-be-spec-write` | All |

## Dependency References

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [BE01a — Authentication and account linking](01a-auth-account-linking.md)
- [BE01b — Party identity and aliases](01b-party-identity-aliases.md)
- [BE01c — Relationships, authority and governance](01c-relationships-authority-governance.md)
- [BE02a — Shadow, claim and ownership](02a-shadow-claim-ownership.md)
- [BE02c — Credentials and trader classification](02c-credentials-trader.md)
- [Shard 02 IA](../ia/02-profiles-verification.md)
- [Shard 02 deep dive](../ia/deep-dives/02-profiles-verification.md)
- [Shard 04 — CMS delivery and media](../ia/04-cms-delivery-media.md)
- [Shard 05 — Platform configuration and admin](../ia/05-platform-configuration-admin.md)
- [Shard 07 — Credits core](../ia/07-credits-core.md)
- [Shard 17 — Real-time sessions](../ia/17-realtime-sessions.md)
- [Shard 20 — Licensing core](../ia/20-licensing-core.md)
- [Shard 38 — Promotion and marketing](../ia/38-promotion-marketing.md)
- [Architecture design](../2026-08-02-architecture-design.md)
- [Engineering standards](../ENGINEERING-STANDARDS.md)
- [Data placement strategy](../data-placement-strategy.md)


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]

### References
- [[specs/ia/deep-dives/02-profiles-verification|Deep Dive 02 — Profiles, claiming and qualifications]]
- [[specs/ia/02-profiles-verification|Shard 02 — Profiles, claiming and qualifications]]
