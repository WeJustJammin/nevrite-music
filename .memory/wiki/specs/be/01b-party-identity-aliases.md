# Shard 01b — Party Identity & Aliases — Backend Specification

> **IA Source**: [Shard 01 — Identity authority and party governance](../ia/01-identity-authority.md)
> **Deep Dives**: [Identity authority deep dive](../ia/deep-dives/01-identity-authority.md)
> **Foundation**: [BE00 — Infrastructure](00-infrastructure.md)
> **Status**: Complete

## Split Group

> **Split origin**: 01-identity-authority
> **Companion specs**: [01a Authentication & Account Linking](01a-auth-account-linking.md), [01c Relationships, Authority & Governance](01c-relationships-authority-governance.md), [01d Identifiers & Legacy](01d-identifiers-legacy.md)
> **Shared interfaces**: the canonical party spine and authenticated user UUID are shared with 01a/01c; request context, idempotency, audit, outbox, error envelope, and observability are supplied by BE00.

This specification is the source of truth for the following product entities and their commands:

| Owned entity or projection | Meaning | Ownership boundary |
|---|---|---|
| PersonParty | One human party linked to at most one active Auth subject | Auth proves the subject; this shard owns the domain row and lifecycle projection |
| RoleFacetAssertion | One versioned assertion for one registered role facet | This shard owns assertion state; the protected facet registry is platform configuration |
| AliasParty | A public-facing party with one owner at a time | This shard owns alias lifecycle and public linkage; profile rendering remains Shard 02 |
| AliasOwnershipPeriod | Dated, non-overlapping alias ownership history | This shard owns the append-only attribution history |
| HandleReservation | Globally unique, confusable-normalized handle history | This shard owns reservation and permanent redirect semantics |
| Acting-context binding | Per-tab/device selected context support record | Support/workflow state, not a new authority grant or product party |
| Acting-context projections | Viewer-relative list and selected-context response | Derived allowlisted read models; organization/representation rows are supplied by 01c |
| LegalIdentityRecord | Protected, effective-dated references to legal identity material | This shard owns metadata and effective periods, never raw credentials or browser-visible PII |
| LegalDisclosureEvent | Append-only proof of a permitted legal-identity disclosure | This shard owns the ledger event; the consuming transaction owns its eligibility |

The following are explicitly not owned here: Supabase Auth provider/session/MFA mechanics; the shared party factory implementation; organizations; memberships; representations; mandates; governance; external identifiers; successor nomination; memorialisation; estates; profile rendering or claiming; payments; disputes; and provider-specific verification. A companion or downstream spec may call this boundary through the named contracts below but may not duplicate or infer its authority.
## Classification

- **Type**: multi-domain-split
- **IA source**: 01-identity-authority, interactions IDA-01 through IDA-05
- **BE target**: person creation/read, facets, aliases/handles, acting-context selection, legal identity metadata, and controlled disclosure
- **Support records**: alias transfer offers and acting-context bindings are workflow/support records. They do not create canonical party kinds, ownership authority, or legal identity.
- **No premature content**: organization, relationship, governance, identifier, and legacy routes remain in 01c/01d. This file does not recreate those deleted or deferred BE surfaces.
## Referenced Material Inventory

- [IA Shard 01](../ia/01-identity-authority.md), §§ Overview, Features, Acceptance Criteria, Interactions, Contracts, Data Models, Access Control, Events, Edge Cases, Cross-Shard Dependencies
- [Identity authority deep dive](../ia/deep-dives/01-identity-authority.md), §§ Resolved Choices, Deterministic Policy Values, Canonical Fields, State Machines, Authority Resolution, Concurrency, Disclosure/Retention, Cross-Shard Contracts, Abuse/Recovery
- [Architecture Design](../2026-08-02-architecture-design.md), §§ authentication separation, API conventions, schema/RPC boundaries, PII registry, validation/rate policy, observability/SLO
- [Data Placement Strategy](../data-placement-strategy.md), §§ stores/security boundaries, PII lifecycle, tenancy, sync protocol, offline restrictions
- [Engineering Standards](../ENGINEERING-STANDARDS.md), §§ contract/authorization coverage, accessibility, security, migration, CI, validation command
- [BE00 — Infrastructure](00-infrastructure.md), §§ endpoint registry, four-field ApiError, request context, RLS/grants, idempotency/ETag, PlatformEvent, telemetry, recovery, test gates
- [IA Shard 02 — Profiles & Verification](../ia/02-profiles-verification.md): consumes public/private identity projections and alias ownership; owns profile rendering and claims
- [IA Shards 03–05](../ia/03-cms-content-modeling.md), [04](../ia/04-cms-delivery-media.md), [05](../ia/05-platform-configuration-admin.md): consume canonical party IDs and capabilities; cannot mint authority
- [IA Shards 06–18](../ia/06-trust-safety.md), [07](../ia/07-credits-core.md), [08](../ia/08-credit-reporting-disclosure.md), [09](../ia/09-projects-collaboration.md), [10](../ia/10-rights-ownership.md), [11](../ia/11-community-graph.md), [12](../ia/12-community-spaces-events.md), [13](../ia/13-opportunities-casting.md), [14](../ia/14-services-marketplace.md), [15](../ia/15-education-delivery.md), [16](../ia/16-education-credentials-institutions.md), [17](../ia/17-realtime-sessions.md), [18](../ia/18-royalty-accounting.md): consume acting-party and authority snapshots only
- [IA Shard 22 — Release & Distribution](../ia/22-release-distribution.md), [30 — Booking & Contracts](../ia/30-booking-contracts.md), [39 — Analytics](../ia/39-analytics-ingestion-reporting.md), and [41 — Career & Finance](../ia/41-career-finance.md): consume canonical principal/party IDs and versioned projections; each owns its transaction, booking, analytics, or payee rules
- [IA Shards 23–25](../ia/23-gear-provenance-registry.md), [27](../ia/27-digital-catalog-delivery.md), [29](../ia/29-venues-spaces.md), and [37](../ia/37-fanbase-direct-to-fan.md): consume viewer-relative identity projections and alias events; they do not receive legal identity values
## IA Source Map

| BE section | Source | Traceability |
|---|---|---|
| Split and ownership boundary | IA Shard 01 | §§ Overview/Features, lines 9–31; split and exclusions reconciled against 01a/01c/01d |
| Endpoint reconciliation | IA Shard 01 | § Acceptance Criteria, lines 33–39; § Interactions, lines 56–62 |
| Person, facet, alias, handle, legal fields | IA Shard 01 | § Data Models, lines 125–156 |
| Authority, role decisions, quotas, expiry | Deep dive | §§ Resolved Choices/Deterministic Policy Values, lines 20–61; Authority Resolution, lines 117–130 |
| API and inherited envelope | Architecture and BE00 | Architecture lines 350–375, 647–668; BE00 contracts/endpoint registry, lines 67–160 |
| DDL, PII, RLS, grants | IA + architecture + data strategy | IA lines 125–182; architecture lines 647–730; data strategy lines 19–56 and 116–135 |
| State machines/concurrency | Deep dive | lines 65–76, 103–149 |
| Disclosure and retention | IA + deep dive + data strategy | IA lines 39, 171–182; deep dive lines 151–162; data strategy lines 95–114 |
| Events and downstream handoff | IA Shard 01 | § Event Schemas, lines 206–219; § Cross-Shard Dependencies, lines 277–293 |
| Error, abuse, partial state | IA + deep dive + BE00 | IA lines 221–246; deep dive lines 179–193; BE00 lines 416–474 |
| Testability and accessibility | IA + standards + BE00 | IA lines 198–204; standards lines 27–43 and 140–165; BE00 lines 476–503 |
## Endpoint Completeness Reconciliation

The deleted historical 01b file supplied only route/section breadcrumbs. The current IA and deep dive are authoritative. Every owned IDA interaction has an authored route; organization, relationship, mandate, identifier, and legacy routes are deferred to their companions with no hidden route.

| IA interaction | Endpoint IDs | Disposition |
|---|---|---|
| IDA-01 Create person | BE01b-01; BE01b-02 | Authored: idempotent create and self identity projection. Auth mechanics remain 01a/BE00. |
| IDA-02 Add/remove facet | BE01b-03; BE01b-04 | Authored: one facet per command, CAS removal, no history deletion. |
| IDA-03 Create/retire/transfer alias | BE01b-05 through BE01b-11 | Authored: create, display/public patch, handle change, retire, offer, accept, decline. Offers are support workflow records. |
| IDA-04 Switch acting context | BE01b-12; BE01b-13 | Authored: derived list and deliberate binding. 01c supplies relationship-backed candidates. |
| IDA-05 Disclose legal identity | BE01b-14 through BE01b-17 | Authored: protected record read/write and disclosure event create/read. |
| Public identity projection | BE01b-18 | Authored as a narrow viewer-relative identity projection; profile content and verification remain Shard 02. |
| Organization/membership/representation/governance | None here | Explicitly deferred to 01c; this file consumes only its accepted-context projection. |
| External identifiers/legacy/estates | None here | Explicitly deferred to 01d; no route or table is recreated. |

## Feature Ledger Coverage

| Feature ID | Feature | Endpoint coverage |
|---|---|---|
| `01.01.01` | Person Record & Multi-Role Facets | BE01b-01 through BE01b-04; AUTH-API-07 is the 01a bootstrap dependency. |
| `01.01.02` | Artist Names, Aliases & Projects | BE01b-05 through BE01b-11 and safe BE01b-18 identity projection; project content remains downstream-owned. |
| `01.01.03` | Acting Context Switcher | BE01b-12 and BE01b-13 with current relationship candidates supplied by 01c. |
| `01.01.04` | Legal Identity vs Public Identity | BE01b-14 through BE01b-18; protected data and public projection remain separate. |

## Contract Conventions Inherited from BE00

All routes use versioned REST under /api/v1 and the fixed BE00 middleware order. The following rules are normative for every endpoint below:

1. Untrusted input is parsed as unknown by strict Zod 4 schemas. Unknown body, query, and path fields are rejected before domain code.
2. Every failure serializes exactly ApiError with four fields: code, message, requestId, and details. details is always present, bounded to 16 keys, four nesting levels, and 8 KiB. No RFC-problem fields are added.
3. Request ID, trace/correlation IDs, deadline, content type, origin/CSRF, body limits, and response serialization come from BE00. Protected responses are no-store; public projections alone may be cached.
4. Retryable commands require Idempotency-Key. The key is scoped to authenticated human, operation ID, and request hash. Reuse with a different hash is a conflict; replay returns the original status/body and does not repeat side effects.
5. Existing mutable aggregates require a strong ETag in If-Match. The ETag is the quoted decimal aggregate version, for example "<7>"; weak tags, wildcard, absent preconditions, and malformed tags are refused. Stale tags return CONFLICT with VERSION_MISMATCH.
6. All mutations run one transaction containing authorization snapshot, state/CAS checks, canonical writes, audit, idempotency outcome, and outbox inserts. Audit/outbox failure rolls back the business mutation.
7. RLS is defense in depth. API authorization derives human, acting party, subject, audience, purpose, relationship/mandate source, and versions; no caller-supplied tenant or role claim is trusted.
8. Cursor pagination is opaque, stable by created_at DESC and id DESC, default 25/max 50. This file uses no unbounded collection without that rule.
### Common Zod 4 schemas

The following names are contract-library definitions, not implementation permission to weaken strictness.
~~~ts
const Uuid = z.string().uuid();
const IsoInstant = z.string().datetime({ offset: true });
const IsoDate = z.string().date();
const Version = z.string()
  .regex(/^[1-9][0-9]{0,18}$/)
  .refine((value) => BigInt(value) <= 9223372036854775807n, "version_out_of_range");
const StrictEmpty = z.object({}).strict();
const FacetCode = z.enum([
  "performer", "writer", "producer", "engineer",
  "teacher", "seller", "tech"
]);
const PublicLinkState = z.enum(["private", "public"]);
const Handle = z.string().min(3).max(40).regex(/^[\p{L}\p{N}._-]+$/u);
const PurposeCode = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_.-]{0,63}$/);
const FieldCode = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_.-]{0,63}$/);
const ClientBindingId = z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/);
const IdempotencyKey = z.string().min(8).max(128)
  .regex(/^[\x20-\x7E]+$/)
  .refine((value) => value.trim() === value, "idempotency_key_outer_whitespace");
const StrongIfMatch = z.string()
  .regex(/^"[1-9][0-9]{0,18}"$/)
  .refine((value) => BigInt(value.slice(1, -1)) <= 9223372036854775807n, "version_out_of_range");
~~~
Handle validation then applies the server-versioned Unicode normalization and confusable skeleton. The request may contain display spelling, but the client cannot provide normalized_handle or skeleton. PurposeCode and FieldCode are checked against the current protected registry after syntax parsing.

The inherited failure contract is exact; this shard adds stable domain codes without adding envelope fields:
~~~ts
type ApiError = {
  code: string;       // /^[A-Z][A-Z0-9_]{0,63}$/
  message: string;    // safe, localizable, 1–500 characters
  requestId: string;  // UUID
  details: Readonly<Record<string, JsonValue>>; // always present, bounded by BE00
};
~~~
## API Endpoints

### Route Registry

The registry below is exhaustive for this shard. A route cannot be added in code without adding a row, operation ID, OpenAPI request/success/error references, authorization predicate, rate class, and runbook reference in the generated registry.

| ID / operation | Method and path | Request / success schemas | Authz and ownership predicate | Declared errors | Idempotency / concurrency | Rate, cache, SLO | Observability |
|---|---|---|---|---|---|---|---|
| BE01b-01 identity.create | POST /api/v1/me/identity | CreatePersonRequest / PersonIdentityResponse | verified human with no active PersonParty for resolved Auth subject | INVALID_REQUEST, UNAUTHENTICATED, PERSON_ALREADY_EXISTS, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | required key; party/person factory transaction | account-provisioning overlay 3/hour/IP and 2/day/user; no cache; Tier 2 | identity.person.create |
| BE01b-02 identity.read_self | GET /api/v1/me/identity | no body / PersonIdentityResponse | authenticated human resolves exactly one own person | UNAUTHENTICATED, PERSON_NOT_FOUND, DEPENDENCY_UNAVAILABLE | conditional GET with strong ETag | 300/min/user, 600/min/party; no cache; Tier 1 | identity.person.read |
| BE01b-03 identity.facet_add | POST /api/v1/me/facets | AddFacetRequest / FacetMutationResponse | acting human is subject PersonParty | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, FACET_UNKNOWN, FACET_EXISTS, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key required; person CAS in transaction | 60/min/user and 120/min/party; no cache; Tier 2 | identity.facet.add |
| BE01b-04 identity.facet_remove | DELETE /api/v1/me/facets/{facetCode} | empty body / FacetMutationResponse | acting human is subject and facet is active | INVALID_REQUEST, UNAUTHENTICATED, VERSION_MISMATCH, FACET_NOT_FOUND, FACET_OBLIGATIONS_OPEN, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key and If-Match required; single-facet CAS | 30/min/user; no cache; Tier 2 | identity.facet.remove |
| BE01b-05 identity.alias_create | POST /api/v1/aliases | CreateAliasRequest / AliasResponse | active person owns new alias at creation | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, HANDLE_INVALID, HANDLE_TAKEN, ALIAS_QUOTA_EXCEEDED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key required; serializable handle reservation and quota | 10/min/user plus 5 creations/rolling 30d/person; no cache; Tier 2 | identity.alias.create |
| BE01b-06 identity.alias_patch | PATCH /api/v1/aliases/{aliasId} | PatchAliasRequest / AliasResponse | current owner of open period; alias context alone is insufficient for ownership change | INVALID_REQUEST, UNAUTHENTICATED, VERSION_MISMATCH, ALIAS_NOT_FOUND, FORBIDDEN, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key and If-Match required; version CAS | 30/min/user; no cache; Tier 2 | identity.alias.patch |
| BE01b-07 identity.handle_change | POST /api/v1/aliases/{aliasId}/handle-changes | ChangeHandleRequest / AliasResponse | current owner; alias must not be retired or transfer-pending | INVALID_REQUEST, UNAUTHENTICATED, VERSION_MISMATCH, HANDLE_INVALID, HANDLE_TAKEN, HANDLE_QUOTA_EXCEEDED, ALIAS_NOT_FOUND, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key and If-Match; lock alias and reservation; permanent redirect | 10/min/user plus 2 changes/rolling 12mo/alias; no cache; Tier 2 | identity.handle.change |
| BE01b-08 identity.alias_retire | POST /api/v1/aliases/{aliasId}/retire | empty body / AliasResponse | current owner with no forbidden open obligation | INVALID_REQUEST, UNAUTHENTICATED, VERSION_MISMATCH, ALIAS_NOT_FOUND, OPEN_OBLIGATION, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key and If-Match; terminal CAS | 10/min/user; no cache; Tier 2 | identity.alias.retire |
| BE01b-09 identity.transfer_offer_create | POST /api/v1/aliases/{aliasId}/transfer-offers | CreateTransferOfferRequest / TransferOfferResponse | current owner; recipient is another active person | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, ALIAS_NOT_FOUND, TRANSFER_NOT_ALLOWED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key required; one pending offer per alias; lock on accept | 10/min/user; no cache; Tier 2 | identity.alias.transfer_offer |
| BE01b-10 identity.transfer_accept | POST /api/v1/alias-transfer-offers/{offerId}/accept | empty body / AliasResponse | authenticated recipient person named by offer; both people remain active | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, TRANSFER_NOT_FOUND, TRANSFER_EXPIRED, VERSION_MISMATCH, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key required; serializable lock offer/open period; offer version CAS | 10/min/user; no cache; Tier 2 | identity.alias.transfer_accept |
| BE01b-11 identity.transfer_decline | POST /api/v1/alias-transfer-offers/{offerId}/decline | empty body / TransferOfferResponse | authenticated recipient or offering owner may decline before acceptance | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, TRANSFER_NOT_FOUND, TRANSFER_EXPIRED, VERSION_MISMATCH, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key required; offer CAS; no ownership mutation | 10/min/user; no cache; Tier 2 | identity.alias.transfer_decline |
| BE01b-12 identity.contexts_read | GET /api/v1/me/acting-contexts | no body / ActingContextListResponse | authenticated human; candidates derived from current records | UNAUTHENTICATED, PERSON_NOT_FOUND, DEPENDENCY_UNAVAILABLE | conditional read; projection version | 300/min/user; no cache; Tier 1 | identity.context.list |
| BE01b-13 identity.context_bind | POST /api/v1/me/acting-context-bindings | BindContextRequest / ActingContextBindingResponse | authenticated human currently holds target self/alias/accepted 01c relationship | INVALID_REQUEST, UNAUTHENTICATED, FORBIDDEN, CONTEXT_NOT_FOUND, CONTEXT_REVOKED, CONTEXT_RECONFIRM_REQUIRED, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key required; binding CAS and 12h idle policy | 60/min/user; no cache; Tier 2 | identity.context.bind |
| BE01b-14 identity.legal_read | GET /api/v1/me/legal-identity | no body / LegalIdentityMetadataResponse | subject person only; recent step-up for protected metadata | UNAUTHENTICATED, STEP_UP_REQUIRED, PERSON_NOT_FOUND, LEGAL_IDENTITY_NOT_FOUND, DEPENDENCY_UNAVAILABLE | conditional read; no browser cache | 60/min/user; no cache; Tier 1 | identity.legal.read |
| BE01b-15 identity.legal_upsert | PUT /api/v1/me/legal-identity | PutLegalIdentityRequest / LegalIdentityMetadataResponse | subject person only; recent step-up; effective period valid | INVALID_REQUEST, UNAUTHENTICATED, STEP_UP_REQUIRED, VERSION_MISMATCH, LEGAL_REF_INVALID, EFFECTIVE_PERIOD_CONFLICT, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key and If-Match when replacing; effective-period exclusion | 5/hour/user; no cache; Tier 2 | identity.legal.upsert |
| BE01b-16 identity.legal_disclose | POST /api/v1/legal-identity-disclosures | CreateDisclosureRequest / DisclosureEventResponse | human actor, acting context must be person (never alias), eligible transaction and recipient/purpose allowlist | INVALID_REQUEST, UNAUTHENTICATED, STEP_UP_REQUIRED, FORBIDDEN, DISCLOSURE_TRANSACTION_INELIGIBLE, DISCLOSURE_PURPOSE_NOT_ALLOWED, DISCLOSURE_FIELDS_TOO_BROAD, LEGAL_IDENTITY_NOT_EFFECTIVE, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | key and legal identity If-Match; append-only event | high-risk 10/min/user; no cache; Tier 2 | identity.legal.disclose |
| BE01b-17 identity.disclosure_read | GET /api/v1/legal-identity-disclosures/{disclosureId} | no body / DisclosureEventResponse | event actor, recipient, subject person, or scoped counsel/operator; no alias linkage disclosure | UNAUTHENTICATED, FORBIDDEN, DISCLOSURE_NOT_FOUND, DEPENDENCY_UNAVAILABLE | immutable event; conditional read | 60/min/user; no cache; Tier 1 | identity.legal.disclosure_read |
| BE01b-18 identity.public_projection | GET /api/v1/identity/parties/{partyId}/projection | no body / PublicPartyProjectionResponse | anonymous or authenticated viewer receives publication-approved projection only | INVALID_REQUEST, NOT_FOUND, RATE_LIMITED, DEPENDENCY_UNAVAILABLE | immutable versioned public projection; no command key | 120/min/IP; public cache only after approval; Tier 1 | identity.public_projection |

All route responses include X-Request-ID. The no-cache rule means Cache-Control: no-store and a private response is never placed in a shared browser, CDN, or service-worker cache. BE01b-18 may return ETag and public max-age only for an approved projection version; it never includes owner_person_id, legal_identity_id, private facets, or disclosure history.
## Request/Response Contracts
### Request field matrix

| Endpoint | Field | Required / shape | Constraints and stable violation code |
|---|---|---|---|
| BE01b-01 | body | StrictEmpty | no body fields; any key is INVALID_REQUEST / unknown_field |
| BE01b-03 | facetCode | FacetCode | exactly one registered launch facet; invalid enum is facet_code_invalid; registry miss is FACET_UNKNOWN |
| BE01b-03 | source | literal self_asserted | client cannot select curation or operator source; source_invalid |
| BE01b-04 | path facetCode | FacetCode | one path value only; malformed/unknown value is facet_code_invalid |
| BE01b-05 | displayName | string 1–120 Unicode scalars | trim outer whitespace, reject controls/format smuggling, preserve approved display spelling; display_name_invalid |
| BE01b-05 | handle | Handle | normalize server-side; reject control/space, invalid punctuation, fewer than 3 or more than 40 code points; HANDLE_INVALID |
| BE01b-05 | publicLinkState | private or public | public requires the same actor-owned alias and publication projection; public_link_state_invalid |
| BE01b-06 | displayName | optional string 1–120 | at least one patch field; same display_name_invalid rule |
| BE01b-06 | publicLinkState | optional enum | at least one patch field; cannot change owner or handle; public_link_state_invalid |
| BE01b-07 | handle | Handle | normalized candidate only; no client normalized value; HANDLE_INVALID |
| BE01b-09 | recipientPersonId | UUID | active PersonParty, not current owner, no self-transfer; recipient_person_invalid |
| BE01b-13 | contextId | opaque UUID | must be in current derived candidate set; caller cannot construct an organization/relationship grant; context_id_invalid |
| BE01b-13 | deliberateConfirmation | literal true | one explicit tap/submit; deep-link preselection cannot supply it; deliberate_confirmation_required |
| BE01b-13 | clientBindingId | ClientBindingId | per-tab/device opaque identifier; never a device fingerprint or authority token; binding_id_invalid |
| BE01b-15 | protectedFieldRefs | strict object | legalNameRef and addressRef required UUID references; taxRef/kycRef optional UUID references; refs must resolve to approved encrypted vault records; LEGAL_REF_INVALID |
| BE01b-15 | effectiveFrom/effectiveTo | ISO date, end optional | effectiveTo strictly after effectiveFrom; no overlap for one person; effective_period_invalid |
| BE01b-16 | legalIdentityId | UUID | identity belongs to subject person and covers transaction instant; legal_identity_id_invalid |
| BE01b-16 | transactionId | UUID | consuming domain must prove an eligible transaction; transaction_id_invalid |
| BE01b-16 | recipientPartyId | UUID | explicit audience, never inferred from alias owner; recipient_invalid |
| BE01b-16 | purposeCode | PurposeCode | current allowlist only; marketing/profile/owner-linkage are denied; DISCLOSURE_PURPOSE_NOT_ALLOWED |
| BE01b-16 | fieldCodes | unique array 1–8 of FieldCode | exact minimum projection for purpose; over-broad or unknown set is DISCLOSURE_FIELDS_TOO_BROAD |
| BE01b-18 | path partyId | UUID | one canonical party ID; malformed value is party_id_invalid |
| all commands | Idempotency-Key header | IdempotencyKey | required where registry says key; same actor/op/hash only; idempotency_key_invalid |
| all CAS commands | If-Match header | StrongIfMatch | exact quoted current aggregate version; missing is INVALID_REQUEST with detail violation IF_MATCH_REQUIRED; stale is VERSION_MISMATCH |
### Zod 4 request definitions

The contract package uses strict objects and parses all external values as unknown before mapping to domain types.
~~~ts
const CreatePersonRequest = StrictEmpty;
const AddFacetRequest = z.object({
  facetCode: FacetCode,
  source: z.literal("self_asserted")
}).strict();
const CreateAliasRequest = z.object({
  displayName: z.string().trim().min(1).max(120),
  handle: Handle,
  publicLinkState: PublicLinkState
}).strict();
const PatchAliasRequest = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  publicLinkState: PublicLinkState.optional()
}).strict().refine(value => Object.keys(value).length > 0, "patch_empty");
const ChangeHandleRequest = z.object({ handle: Handle }).strict();
const CreateTransferOfferRequest = z.object({ recipientPersonId: Uuid }).strict();
const BindContextRequest = z.object({
  contextId: Uuid,
  deliberateConfirmation: z.literal(true),
  clientBindingId: ClientBindingId
}).strict();
const PutLegalIdentityRequest = z.object({
  protectedFieldRefs: z.object({
    legalNameRef: Uuid,
    addressRef: Uuid,
    taxRef: Uuid.optional(),
    kycRef: Uuid.optional()
  }).strict(),
  effectiveFrom: IsoDate,
  effectiveTo: IsoDate.optional()
}).strict();
const CreateDisclosureRequest = z.object({
  legalIdentityId: Uuid,
  transactionId: Uuid,
  recipientPartyId: Uuid,
  purposeCode: PurposeCode,
  fieldCodes: z.array(FieldCode).min(1).max(8)
    .refine(values => new Set(values).size === values.length, "field_codes_unique")
}).strict();
~~~
The actual contract library adds inherited header/query schemas, max body size, UTF-8 validity, JSON depth, array limits, and output allowlists. A parser must not use coercion for UUIDs, dates, booleans, or versions.
### Success schemas and examples

All response objects are strict and output allowlisted. The examples use representative UUIDs and do not imply that legal values are returned.

| Endpoint | Success schema | Example request / response |
|---|---|---|
| BE01b-01 | PersonIdentityResponse | Empty request with Idempotency-Key; response includes personId, partyKind person, accountState active, version 1, empty facets and aliases |
| BE01b-02 | PersonIdentityResponse | GET response is the same self projection, with ETag "<1>"; no Auth provider payload |
| BE01b-03 | FacetMutationResponse | Request facetCode performer and source self_asserted; response personId, facetCode performer, state active, version 2 |
| BE01b-04 | FacetMutationResponse | DELETE performer with If-Match "<2>"; response state removed and version 3; history remains |
| BE01b-05 | AliasResponse | Request displayName Neon Harbor, handle neon.harbor, publicLinkState public; response alias ID, display name, handle, active lifecycle, public state, version 1 |
| BE01b-06 | AliasResponse | Request displayName Neon Harbor Live with If-Match; response has new display name and incremented version, never owner linkage |
| BE01b-07 | AliasResponse | Request handle neon-harbor with If-Match; response contains new handle and owner-only redirect metadata; old handle remains permanently reserved |
| BE01b-08 | AliasResponse | Empty request with If-Match; response lifecycle retired, public link private, and permanent redirect/history metadata |
| BE01b-09 | TransferOfferResponse | Request recipientPersonId another active person; response offer ID, state pending, expiresAt exactly seven days after offer, alias ID, version 1 |
| BE01b-10 | AliasResponse | Empty request by recipient inside seven days; response closes old period, opens new period, and increments alias version |
| BE01b-11 | TransferOfferResponse | Empty request by recipient/owner; response state declined and no ownership change |
| BE01b-12 | ActingContextListResponse | Response projectionVersion plus CursorPage fields: bounded items with contextId, partyId, kind, label, avatarRef, selectable, authorityFreshUntil; nextCursor; hasMore |
| BE01b-13 | ActingContextBindingResponse | Request contextId, deliberateConfirmation true, clientBindingId tab-a; response bindingId, selectedPartyId, expiresAt, projectionVersion |
| BE01b-14 | LegalIdentityMetadataResponse | Response legalIdentityId, state active, effective period, field-code presence, and version; no field values or vault refs |
| BE01b-15 | LegalIdentityMetadataResponse | Request protected refs and dates; response only ID, effective period, allowlisted field-code presence, and version |
| BE01b-16 | DisclosureEventResponse | Request transaction, recipient, purpose, minimum fields; response event ID, legal identity/version, recipient, purpose, field codes, occurredAt |
| BE01b-17 | DisclosureEventResponse | GET returns immutable ledger metadata to an authorized event participant; never raw legal fields or alias owner linkage |
| BE01b-18 | PublicPartyProjectionResponse | Anonymous response contains party ID, kind alias, approved display/handle, public state, lifecycle, version; person facets are public-approved only |
### Response schema field matrix

| Schema | Required fields and constraints | Redaction rule |
|---|---|---|
| PersonIdentityResponse | personId UUID; partyKind literal person; accountState person lifecycle; version positive integer; facets array of facetCode/state/version; aliases array of AliasResponse summaries | no Auth provider subject, email, legal values, or relationship evidence |
| FacetMutationResponse | personId UUID; facetCode launch enum; state active/removed; version positive integer | no open-obligation evidence except the typed conflict details allowed by IA |
| AliasResponse | aliasId UUID; displayName 1–120; handle 3–40 display code points; lifecycle; publicLinkState; version; redirect metadata only for authorized owner | public viewers never receive owner_person_id or private history |
| TransferOfferResponse | offerId UUID; aliasId UUID; state; offeredAt; expiresAt; version | offering/recipient IDs are returned only to the two named people; no owner discovery to others |
| ActingContextListResponse | projectionVersion lossless positive decimal string; items max 50; each item contextId/partyId UUID, kind enum, text label, avatarRef allowlisted, selectable boolean, authorityFreshUntil; nextCursor nullable opaque string; hasMore boolean | relationship/mandate details and owner linkage are omitted |
| ActingContextBindingResponse | bindingId UUID; selectedPartyId UUID; expiresAt ISO instant; projectionVersion positive integer; version positive integer | clientBindingId is never echoed; no grant or mandate is returned |
| LegalIdentityMetadataResponse | legalIdentityId UUID; state; effectiveFrom date; effectiveTo nullable date; fieldCodes allowlisted; version | protected field refs and raw legal values never leave the protected boundary |
| DisclosureEventResponse | eventId UUID; legalIdentityId UUID; legalIdentityVersion positive integer; transactionId UUID only for authorized participant; recipientPartyId UUID; purposeCode; fieldCodes; occurredAt ISO instant | no values, vault refs, owner linkage, or provider evidence |
| PublicPartyProjectionResponse | partyId UUID; kind person/alias; approved display/handle/profile reference; publicLinkState; lifecycle; version; approved facet labels only | no legal/private fields, owner person, relationship, mandate, or disclosure history |

Invalid examples are deterministic: a facet request with source operator returns 400 INVALID_REQUEST with violation source_invalid; handle a b returns 422 HANDLE_INVALID with path /handle and code handle_whitespace; a non-UUID recipientPartyId returns 400 recipient_party_id_invalid; eight broad disclosure fields including phone, email, passport, and bank return 422 DISCLOSURE_FIELDS_TOO_BROAD; an unknown body key always returns 400 unknown_field.
### Error response matrix

Every row below is an ApiError response with Content-Type application/json, X-Request-ID, Cache-Control no-store, and a bounded details object. The route registry's error list is the complete per-route declaration.

| Error class | Status | ApiError code examples | details shape and client action |
|---|---:|---|---|
| JSON/content/field validation | 400 | INVALID_REQUEST | violations array with JSON Pointer path, stable lowercase code, and safe message; fix only named fields |
| Semantic validation | 422 | HANDLE_INVALID, FACET_UNKNOWN, LEGAL_REF_INVALID, DISCLOSURE_FIELDS_TOO_BROAD | same violations shape; no mutation occurred |
| Missing/invalid session | 401 | UNAUTHENTICATED | recoveryAction reauthenticate; never reveal whether a person exists |
| Recent step-up missing | 401 | STEP_UP_REQUIRED | recoveryAction step_up and configured allowedMethods; no legal read/disclosure |
| Capability or audience denied | 403 | FORBIDDEN, CONTEXT_REVOKED, DISCLOSURE_PURPOSE_NOT_ALLOWED | reasonCode and optional recoveryAction; do not disclose owner or policy evidence |
| Safe resource absence | 404 | PERSON_NOT_FOUND, ALIAS_NOT_FOUND, TRANSFER_NOT_FOUND, DISCLOSURE_NOT_FOUND | empty details; use 404 where existence would leak |
| Missing If-Match | 400 | INVALID_REQUEST | field If-Match; violation IF_MATCH_REQUIRED; recoveryAction refetch_and_retry; no mutation |
| Version/state/idempotency conflict | 409 | VERSION_MISMATCH, IDEMPOTENCY_MISMATCH, HANDLE_TAKEN, FACET_OBLIGATIONS_OPEN, TRANSFER_EXPIRED | BE00 conflict details with conflict kind, versions where safe, and recoveryAction |
| Rate/abuse limit | 429 | RATE_LIMITED, ALIAS_QUOTA_EXCEEDED, HANDLE_QUOTA_EXCEEDED | retryAfterSeconds and limitClass; Retry-After and RateLimit headers |
| Dependency cascade | 502/503/504 | DEPENDENCY_UNAVAILABLE | dependencyClass and retryable boolean; no partial commit |
| Unknown internal failure | 500 | INTERNAL_ERROR | empty details; safe request ID only; scrubbed alert |

Specific error code invariants:

- PERSON_ALREADY_EXISTS is 409 and is returned only after the authenticated subject is known; matching email, name, or provider text is never used to merge.
- HANDLE_TAKEN is 409 without revealing the current owner. A display name collision is allowed.
- FACET_OBLIGATIONS_OPEN is 409 and includes only closed obligation codes permitted by the IA contract.
- TRANSFER_EXPIRED is 409; it never silently accepts or changes ownership.
- DISCLOSURE_TRANSACTION_INELIGIBLE, DISCLOSURE_PURPOSE_NOT_ALLOWED, and DISCLOSURE_FIELDS_TOO_BROAD occur before disclosure-event insertion.
- Wrong valid user, wrong acting party, expired/revoked context, stale version, and over-broad disclosure each have explicit tests; 404 versus 403 follows the existence-leak rule above.
## Database Schema
### Ownership and shared table contract

The 01a/01c companion specs own the implementation of the canonical party factory, Auth subject/session mapping, organizations, relationships, mandates, and governance. This file consumes platform_private.party through a named RPC and enforces kind checks at every insert. No companion may add a second person, alias, or handle table. All tables below live in non-exposed platform_private.
### Types and tables
~~~sql
create type platform_private.person_account_state as enum
  ('shadow', 'claimed', 'active', 'suspended', 'memorialised', 'erasure_processing');
create type platform_private.facet_state as enum ('active', 'removed');
create type platform_private.facet_source as enum ('self_asserted', 'curation_approved');
create type platform_private.alias_lifecycle as enum
  ('active', 'transfer_pending', 'transferred', 'retired');
create type platform_private.public_link_state as enum ('private', 'public');
create type platform_private.handle_state as enum ('active', 'redirect', 'retired');
create type platform_private.transfer_offer_state as enum
  ('pending', 'accepted', 'declined', 'expired', 'cancelled');
create type platform_private.context_binding_state as enum
  ('active', 'revoked', 'expired');
create type platform_private.legal_identity_state as enum
  ('active', 'superseded', 'withdrawn');
create table platform_private.person_party (
  party_id uuid primary key references platform_private.party(id) on delete restrict,
  auth_user_id uuid unique,
  account_state platform_private.person_account_state not null default 'shadow',
  public_profile_id uuid,
  legal_identity_id uuid,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((account_state = 'shadow' and auth_user_id is null)
      or account_state <> 'shadow'),
  check (account_state <> 'active' or auth_user_id is not null)
);
create unique index person_one_live_auth_user
  on platform_private.person_party(auth_user_id)
  where auth_user_id is not null
    and account_state not in ('erasure_processing');
create table platform_private.role_facet_assertion (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  facet_code text not null,
  state platform_private.facet_state not null,
  source platform_private.facet_source not null,
  asserted_at timestamptz not null,
  removed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (facet_code = lower(facet_code) and facet_code ~ '^[a-z][a-z0-9_]{0,31}$'),
  check ((state = 'active' and removed_at is null)
      or (state = 'removed' and removed_at is not null)),
  check (removed_at is null or removed_at >= asserted_at)
);
create unique index facet_one_active_per_person
  on platform_private.role_facet_assertion(person_id, facet_code)
  where state = 'active';
create index facet_person_history
  on platform_private.role_facet_assertion(person_id, asserted_at desc, id desc);
create table platform_private.handle_reservation (
  id uuid primary key default gen_random_uuid(),
  normalized_handle text not null,
  display_handle text not null,
  party_id uuid not null references platform_private.party(id) on delete restrict,
  state platform_private.handle_state not null default 'active',
  successor_handle_id uuid references platform_private.handle_reservation(id) on delete restrict,
  first_used_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  retired_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_handle),
  check (normalized_handle = lower(normalized_handle)),
  check (char_length(normalized_handle) between 3 and 40),
  check (normalized_handle !~ '[[:space:][:cntrl:]]'),
  check ((state = 'active' and retired_at is null)
      or (state in ('redirect', 'retired') and retired_at is not null))
);
create index handle_party_state on platform_private.handle_reservation(party_id, state);
create index handle_successor on platform_private.handle_reservation(successor_handle_id)
  where successor_handle_id is not null;
create table platform_private.alias_party (
  party_id uuid primary key references platform_private.party(id) on delete restrict,
  display_name text not null,
  current_handle_id uuid not null references platform_private.handle_reservation(id) on delete restrict,
  lifecycle platform_private.alias_lifecycle not null default 'active',
  public_link_state platform_private.public_link_state not null default 'private',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(display_name) between 1 and 120)
);
create index alias_public_lookup
  on platform_private.alias_party(current_handle_id, lifecycle, public_link_state);
create table platform_private.alias_transfer_offer (
  id uuid primary key default gen_random_uuid(),
  alias_id uuid not null references platform_private.alias_party(party_id) on delete restrict,
  offering_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  recipient_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  state platform_private.transfer_offer_state not null default 'pending',
  offered_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  declined_at timestamptz,
  closed_at timestamptz,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offering_person_id <> recipient_person_id),
  check (expires_at > offered_at),
  check ((state = 'pending' and accepted_at is null and declined_at is null and closed_at is null)
      or (state = 'accepted' and accepted_at is not null and closed_at is not null)
      or (state in ('declined', 'expired', 'cancelled') and closed_at is not null))
);
create unique index one_pending_alias_transfer
  on platform_private.alias_transfer_offer(alias_id)
  where state = 'pending';
create index transfer_recipient_pending
  on platform_private.alias_transfer_offer(recipient_person_id, expires_at)
  where state = 'pending';
create table platform_private.alias_ownership_period (
  id uuid primary key default gen_random_uuid(),
  alias_id uuid not null references platform_private.alias_party(party_id) on delete restrict,
  owner_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz,
  transfer_id uuid references platform_private.alias_transfer_offer(id) on delete restrict,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
alter table platform_private.alias_ownership_period
  add constraint alias_periods_do_not_overlap
  exclude using gist (
    alias_id with =,
    tstzrange(starts_at, coalesce(ends_at, 'infinity'::timestamptz), '[)') with &&
  );
create unique index alias_one_current_owner
  on platform_private.alias_ownership_period(alias_id)
  where ends_at is null;
create index alias_owner_history
  on platform_private.alias_ownership_period(owner_person_id, starts_at desc, id desc);
create table platform_private.legal_identity_record (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  state platform_private.legal_identity_state not null default 'active',
  effective_from date not null,
  effective_to date,
  protected_field_refs jsonb not null,
  verification_ref uuid,
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from),
  check (jsonb_typeof(protected_field_refs) = 'object'),
  check (protected_field_refs ? 'legalNameRef'),
  check (protected_field_refs ? 'addressRef')
);
alter table platform_private.person_party
  add constraint person_legal_identity_fk
  foreign key (legal_identity_id)
  references platform_private.legal_identity_record(id)
  on delete restrict;
alter table platform_private.legal_identity_record
  add constraint legal_periods_do_not_overlap
  exclude using gist (
    person_id with =,
    daterange(effective_from, coalesce(effective_to, 'infinity'::date), '[)') with &&
  );
create index legal_identity_current
  on platform_private.legal_identity_record(person_id, effective_from desc)
  where state = 'active';
create table platform_private.legal_disclosure_event (
  id uuid primary key default gen_random_uuid(),
  legal_identity_id uuid not null references platform_private.legal_identity_record(id) on delete restrict,
  legal_identity_version bigint not null check (legal_identity_version > 0),
  transaction_id uuid not null,
  recipient_party_id uuid not null references platform_private.party(id) on delete restrict,
  purpose_code text not null,
  field_codes text[] not null,
  actor_person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  acting_party_id uuid not null references platform_private.party(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  check (purpose_code ~ '^[a-z][a-z0-9_.-]{0,63}$'),
  check (cardinality(field_codes) between 1 and 8),
  check (field_codes <@ array['legal_name','address','tax_id','kyc_status']::text[]),
  check (acting_party_id = actor_person_id)
);
create index disclosure_recipient_time
  on platform_private.legal_disclosure_event(recipient_party_id, occurred_at desc, id desc);
create index disclosure_subject_time
  on platform_private.legal_disclosure_event(actor_person_id, occurred_at desc, id desc);
create table platform_private.acting_context_binding (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references platform_private.person_party(party_id) on delete restrict,
  acting_party_id uuid not null references platform_private.party(id) on delete restrict,
  context_kind text not null check (context_kind in ('person','alias','organization','representation')),
  source_relationship_id uuid,
  client_binding_id text not null,
  state platform_private.context_binding_state not null default 'active',
  selected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  projection_version bigint not null check (projection_version > 0),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > selected_at),
  check (char_length(client_binding_id) between 1 and 128)
);
create unique index one_active_context_binding_per_client
  on platform_private.acting_context_binding(person_id, client_binding_id)
  where state = 'active';
create index context_binding_person
  on platform_private.acting_context_binding(person_id, state, last_seen_at desc);
-- Derived security-invoker views; they are not canonical entities.
create view platform_private.identity_self_projection
  with (security_invoker = true) as
  select p.party_id as person_id, p.account_state, p.version,
         p.public_profile_id, p.legal_identity_id
  from platform_private.person_party p;
create view platform_private.identity_public_projection
  with (security_invoker = true) as
  select a.party_id, 'alias'::text as kind, a.display_name,
         h.display_handle as handle, a.public_link_state,
         a.lifecycle, a.version
  from platform_private.alias_party a
  join platform_private.handle_reservation h
    on h.id = a.current_handle_id
   and h.state = 'active'
  where a.public_link_state = 'public'
    and a.lifecycle in ('active', 'transferred');
create view platform_private.identity_public_person_projection
  with (security_invoker = true) as
  select p.party_id, 'person'::text as kind,
         p.public_profile_id, p.account_state, p.version
  from platform_private.person_party p
  where p.account_state in ('claimed', 'active');
-- A guarded RPC joins 01c's accepted relationship projection to self/alias
-- candidates. No view exposes owner_person_id, legal_identity_id, or mandates.
~~~
DDL invariants:

- Migration prerequisites are the approved UUID generator and btree_gist for exclusion constraints. The normalizer is a versioned, server-owned function; clients never write normalized handles.
- Party kind checks, current handle ownership, alias owner-period alignment, public projection publication approval, effective legal identity, and protected-field-reference validity are enforced by the guarded RPC/trigger in the same transaction. Direct table writes are impossible to API roles.
- A handle row is never updated to belong to a different party and never deleted. A handle change closes the old reservation as redirect and inserts a new reservation; retirement marks the active reservation retired or redirect according to the permanent-link policy.
- Facet removal updates state and timestamps; it never deletes an assertion. Re-adding creates a new assertion/version after the obligation gate.
- LegalIdentityRecord stores references and metadata only. Raw names, addresses, tax material, KYC evidence, provider secrets, and encryption keys live behind the approved protected store and are never returned by these routes.
- Alias transfer acceptance closes one ownership range, creates exactly one new range, updates alias lifecycle/version, and records the offer ID. It cannot be performed for a mandated/delegated alias; 01c authority is not a shortcut for ownership transfer.
### Index, RLS, and grants matrix

| Surface | Index/constraint coverage | RLS and grant rule |
|---|---|---|
| PersonParty | unique Auth subject; party FK; lifecycle/version checks | authenticated API RPC sees only resolved actor person; no direct table grant |
| Facets | active partial unique person/facet; history by person/time | actor person for add/remove; downstream capability projection is read-only |
| AliasParty/handles | current handle FK; normalized global unique; owner history/exclusion; public lookup | owner RPC for private mutation; public projection only for approved public state |
| Transfer support | one pending alias; recipient/time index; offer state checks | offering owner and named recipient see only their offer; no public enumeration |
| Legal identity | effective-period exclusion; current-person index | subject plus recent step-up; no anon/authenticated table grant; counsel/operator named read only |
| Disclosure event | recipient/subject time indexes; field/purpose checks | actor/recipient/subject scoped event read; counsel/operator reason-scoped; never alias owner discovery |
| Context binding | one active client binding; person/state/time index | only owning human can select/revoke own binding; relationship candidates are rechecked through 01c |
| Derived public view | lifecycle/public-state predicate | anon may execute a named allowlisted projection RPC; no base table access; CDN only approved version |
~~~sql
alter table platform_private.person_party enable row level security;
alter table platform_private.person_party force row level security;
alter table platform_private.role_facet_assertion enable row level security;
alter table platform_private.role_facet_assertion force row level security;
alter table platform_private.alias_party enable row level security;
alter table platform_private.alias_party force row level security;
alter table platform_private.handle_reservation enable row level security;
alter table platform_private.handle_reservation force row level security;
alter table platform_private.alias_transfer_offer enable row level security;
alter table platform_private.alias_transfer_offer force row level security;
alter table platform_private.alias_ownership_period enable row level security;
alter table platform_private.alias_ownership_period force row level security;
alter table platform_private.legal_identity_record enable row level security;
alter table platform_private.legal_identity_record force row level security;
alter table platform_private.legal_disclosure_event enable row level security;
alter table platform_private.legal_disclosure_event force row level security;
alter table platform_private.acting_context_binding enable row level security;
alter table platform_private.acting_context_binding force row level security;
revoke all on schema platform_private from public, anon, authenticated;
revoke all on all tables in schema platform_private from public, anon, authenticated;
revoke all on all sequences in schema platform_private from public, anon, authenticated;
revoke all on all functions in schema platform_private from public, anon, authenticated;
revoke all on schema platform_api from public;
revoke all on all functions in schema platform_api from public;
create policy person_self_row on platform_private.person_party
  for select to authenticated
  using (party_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
create policy facet_self_rows on platform_private.role_facet_assertion
  for select to authenticated
  using (person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
create policy alias_owner_rows on platform_private.alias_party
  for select to authenticated
  using (exists (
    select 1 from platform_private.alias_ownership_period p
    where p.alias_id = party_id
      and p.owner_person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid
      and p.ends_at is null
  ));
create policy transfer_participant_rows on platform_private.alias_transfer_offer
  for select to authenticated
  using (offering_person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid
      or recipient_person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
create policy alias_period_owner_rows on platform_private.alias_ownership_period
  for select to authenticated
  using (owner_person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
create policy legal_subject_rows on platform_private.legal_identity_record
  for select to authenticated
  using (person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
create policy disclosure_participant_rows on platform_private.legal_disclosure_event
  for select to authenticated
  using (actor_person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid
      or recipient_party_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
create policy context_owner_rows on platform_private.acting_context_binding
  for select to authenticated
  using (person_id = nullif(current_setting('app.actor_person_id', true), '')::uuid);
-- API RPCs are the only write surface. The public projection function is the
-- exceptional security-definer surface: fixed search_path, qualified names,
-- revoked PUBLIC execute, and a projection-only return type are mandatory.
grant usage on schema platform_api to anon, authenticated;
grant execute on function platform_api.get_public_party_projection(uuid)
  to anon, authenticated;
grant execute on function platform_api.identity_create()
  to authenticated;
grant execute on function platform_api.identity_facet_add(text)
  to authenticated;
grant execute on function platform_api.identity_facet_remove(text, bigint)
  to authenticated;
~~~
Every mutable/private table has RLS enabled and forced. anon has no table, sequence, or schema privilege and only the named public projection RPC; authenticated has no direct platform_private privilege. Hono uses named security-invoker views and narrowly granted RPCs in the API schema. Any exceptional security-definer function has an empty fixed search_path, fully qualified object names, revoked PUBLIC defaults, named role grants, and a negative privilege test. Service role is not an authorization decision.
## State Machines

| Aggregate | States | Allowed transitions and guards |
|---|---|---|
| PersonParty | shadow → claimed → active → suspended or erasure_processing; memorialised is terminal policy state | Auth/linking companion proves claim; this shard creates/reads the person and never merges by text. No active mutation after suspension/erasure. Memorial/estate transitions are 01d-owned. |
| RoleFacetAssertion | absent → active → removed → active | Add exactly one registered facet, self_asserted. Remove requires If-Match and closed-obligation proof; history remains. Curation source is operator workflow only. |
| AliasParty | active → transfer_pending → active or transferred; active/transferred → retired | Create only for active person and unique handle. Offer does not change owner. Accept inside seven days under serializable lock closes old period and starts new one. Retired never reactivates under another owner. |
| HandleReservation | active → redirect → retired | Old normalized handle is permanently reserved. No active row can reuse a normalized value; a redirect may point only to a successor handle created in the same transaction. |
| AliasTransferOffer | pending → accepted, declined, cancelled, or expired | Seven-day expiry is an immutable deadline; expiry job marks it expired. Accept requires named recipient, active parties, owner-period lock, and current offer version. |
| Acting-context binding | active → revoked or expired | Selected per tab/device. Alias context is valid only while owner period is current. Organization/representation freshness and 12-hour inactivity are evaluated from 01c projection. Expiry reverts to self; it grants no authority. |
| LegalIdentityRecord | active → superseded or withdrawn | Effective periods do not overlap. New version records new protected refs; old metadata remains auditable under retention/hold policy. |
| LegalDisclosureEvent | append-only | Insert only after transaction eligibility, allowlist, minimum-field, effective-period, actor, and recent step-up checks. No update/delete; retention/hold workflow is counsel-gated. |
### Deterministic authority resolution

1. BE00/01a verifies an active Supabase session and resolves the human UUID; this file never parses provider claims or selects an Auth identity.
2. The server resolves the person and requested acting party from canonical rows; caller-supplied tenant, owner, role, or membership metadata is ignored.
3. Self context binds directly to the person. Alias context requires the current open AliasOwnershipPeriod owned by that person. Organization/representation candidates require an active accepted 01c projection.
4. The policy engine checks the operation, audience, purpose, resource lifecycle, relationship/mandate source and version. A stale/revoked/expired source fails closed.
5. For legal disclosure, the acting party must be the person; alias context can create neither legal identity nor disclosure. The transaction recipient, purpose, minimum field set, and current effective legal record are revalidated in the same transaction.
6. The command writes the authorization snapshot, audit row, idempotency outcome, and allowed outbox event atomically. A downstream domain consumes the snapshot; it may not infer authority from a party ID alone.
## Middleware and Policies
### Fixed middleware order

BE00 order applies: request/correlation ID → deadline/body/content/origin/CSRF checks → session authentication via 01a boundary → human/person resolution → strict path/query/body parse → rate/abuse class → acting-context resolution → capability/audience/purpose policy → RLS/RPC transaction → idempotency/CAS → audit/outbox → allowlisted response. Validation and authorization refusal occur before domain mutation. Legal routes additionally require recent step-up from 01a.
### Role and endpoint authorization matrix

| Endpoint group | Anonymous viewer | Subject human | Alias-context human | Named transfer recipient | Counsel/operator | Service/downstream principal | Wrong valid human |
|---|---|---|---|---|---|---|---|
| BE01b-18 public projection | allow published allowlist; no owner/legal/facet-private data | same viewer-relative allowlist | same; cannot reveal owner | same | same; operator is not universal tenant | allow only registered projection consumer | same public allowlist, never private |
| BE01b-01/02 person | deny or 401/404 | create/read own resolved person only | deny alias creation; read person only through self resolution | deny | deny direct impersonation | no interactive create; read named projection only | 403/404 without existence leak |
| BE01b-03/04 facets | deny | add/remove own person, one facet, obligation gate | deny; alias label never becomes facet subject | deny | no arbitrary mutation; curation RPC only | read projection only | 403 with no mutation |
| BE01b-05/06/07/08 alias | deny mutation | current owner period only; no mandated transfer | may act only if request explicitly resolves owner and operation permits; alias cannot expose owner | deny except offer acceptance | reason-scoped recovery/collision operation only | consume events/projection only | 403/404, no owner disclosure |
| BE01b-09 offer create | deny | current owner and active recipient | no delegation shortcut | deny create | no forced transfer | deny | 403/404 |
| BE01b-10/11 offer decision | deny | offering owner may decline | alias context cannot accept as owner | named active recipient may accept/decline | no arbitrary acceptance | deny | 403/404 |
| BE01b-12/13 contexts | deny list/bind | self, current alias, and accepted 01c contexts only; explicit deliberate confirmation | may select itself only while owner period is current | own accepted context only | may inspect assigned recovery scope, never impersonate | read version hints only | deny and revert to self |
| BE01b-14/15 legal record | deny | own person, recent step-up, protected refs only | deny even when owner | deny | counsel-gated scope only; no role override | no raw record; approved purpose worker only | 403/404 |
| BE01b-16/17 disclosure | deny | person actor, eligible transaction, explicit recipient/purpose/minimum fields | deny alias actor | recipient reads own event only | scoped counsel/operator read with reason, no disclosure by role | registered transaction consumer receives event metadata only | 403/404 and no event |

Every protected operation has contract tests for anonymous, wrong valid user/party/resource, expired/revoked authority, stale version, and over-disclosure. Operators cannot browse legal data or impersonate a party. A service principal receives only a named projection/event and cannot submit an interactive command.
### Disclosure policy

The purpose registry, field registry, eligible-transaction adapter, and step-up freshness are configuration and companion contracts, not client inputs to trust. The policy evaluates:

- explicit recipient party and declared purpose;
- a consuming-domain transaction ID with current eligibility and audience;
- an effective LegalIdentityRecord version;
- the exact minimum field set for that purpose;
- recent step-up for the human actor;
- person acting context, not alias context;
- no minor/private/legal-hold/counsel block.

Missing step-up, unknown purpose, ineligible transaction, expired legal period, alias acting context, or extra fields refuses before event insertion. Legal values are delivered only through the consuming protected channel; these endpoints return event metadata. Browser cache headers are no-store and response bodies never contain raw protected values.
### Per-operation middleware, error envelope, limits, telemetry, and test matrix

Every row below is keyed to the authoritative operation ID. Route Registry cells remain the single source for exact route-specific auth, rate, idempotency, and success/error status values; this matrix adds the boundary execution policy and makes each operation explicit.

| Operation ID | Auth and ownership | Rate limit | Input validation | CORS policy | Global error envelope | Error and retry guidance | Pagination and limits | Idempotency and concurrency | Observability | Test oracle |
|---|---|---|---|---|---|---|---|---|---|---|
| BE01b-01 | The authoritative Route Registry BE01b-01 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-01 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-01 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-01 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-01; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-02 | The authoritative Route Registry BE01b-02 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-02 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-02 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-02 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-02; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-03 | The authoritative Route Registry BE01b-03 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-03 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-03 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-03 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-03; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-04 | The authoritative Route Registry BE01b-04 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-04 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-04 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-04 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-04; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-05 | The authoritative Route Registry BE01b-05 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-05 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-05 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-05 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-05; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-06 | The authoritative Route Registry BE01b-06 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-06 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-06 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-06 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-06; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-07 | The authoritative Route Registry BE01b-07 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-07 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-07 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-07 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-07; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-08 | The authoritative Route Registry BE01b-08 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-08 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-08 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-08 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-08; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-09 | The authoritative Route Registry BE01b-09 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-09 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-09 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-09 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-09; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-10 | The authoritative Route Registry BE01b-10 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-10 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-10 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-10 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-10; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-11 | The authoritative Route Registry BE01b-11 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-11 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-11 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-11 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-11; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-12 | The authoritative Route Registry BE01b-12 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-12 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-12 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Opaque cursor; default 25 and maximum 50; deterministic created_at DESC then id DESC; only the operation declared allowlisted filters; offset and unknown filters rejected. | The authoritative Route Registry BE01b-12 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-12; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-13 | The authoritative Route Registry BE01b-13 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-13 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-13 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-13 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-13; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-14 | The authoritative Route Registry BE01b-14 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-14 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-14 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-14 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-14; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-15 | The authoritative Route Registry BE01b-15 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-15 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-15 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-15 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-15; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-16 | The authoritative Route Registry BE01b-16 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-16 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-16 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-16 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-16; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-17 | The authoritative Route Registry BE01b-17 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-17 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-17 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy first-party-auth allowlist; credentials only for same-site; wildcard and reflected origins denied; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-17 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-17; assert exact ApiError envelope and no unauthorized side effect. |
| BE01b-18 | The authoritative Route Registry BE01b-18 auth and ownership predicate applies; actor and acting party are server-derived; known visible target without capability is 403 and concealed or unreadable target is 404. | The authoritative Route Registry BE01b-18 bucket applies; emit RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset and Retry-After on 429; caller input cannot widen the bucket. | Strict Zod 4 request schema for BE01b-18 runs at the Hono boundary before authorization and RPC; unknown keys, malformed path, query, header or body are rejected; signed raw bytes are verified before parsing where this operation has a webhook branch. | CORS policy public-read allowlist; credentials=false; Vary: Origin. | BE00 ApiError { code, message, requestId, details }; code is the application enum, message is safe and localizable, and details is a bounded allowlist. | Operation-declared HTTP statuses and application codes remain authoritative; 4xx is not auto-retried, 429 honors Retry-After, and 502/503/504 retry at most twice after 250 ms and 750 ms with the same idempotency binding after status reconciliation; unknown mutation outcome stays pending or manual review. | Not a list endpoint; pagination parameters are rejected and the operation returns one bounded resource, job, redirect, or fixed projection. | The authoritative Route Registry BE01b-18 idempotency and CAS rule applies; mutation replay requires the same normalized request and expected version, while reads perform no mutation reservation. | Emit requestId, operationId, status, duration, rate, authorization, conflict, idempotency and retry outcomes; retain IDs or hashes only and never request payloads or PII. | Contract, authz, RLS, 403/404, rate, replay, conflict, timeout and redaction tests are required for BE01b-18; assert exact ApiError envelope and no unauthorized side effect. |
## Data Flow and Cross-Shard Contracts
### Commands

| Flow | Transaction sequence | Commit/async rule |
|---|---|---|
| Create person | resolve Auth subject → idempotency reserve → call 01a party-spine factory → insert PersonParty and self context projection → audit/outbox → replay result | all canonical rows commit together; duplicate Auth binding is typed 409; no text merge |
| Facet add/remove | resolve self → parse one facet → registry/obligation check → lock person/version → insert assertion or mark removed → audit/outbox facet event | one facet CAS; obligation timeout rolls back; curation petition is a separate operations queue and never activates a facet |
| Alias create | resolve active person → normalize/skeleton handle → check quota → reserve unique handle → insert AliasParty and open period → implied performer projection → audit/outbox alias event | serializable/unique conflict returns HANDLE_TAKEN; quota friction never transfers or reissues |
| Alias patch/handle/retire | owner resolution → lock alias/period/handle → validate state and If-Match → update display/public state or close old reservation/create redirect or terminally retire → audit/outbox | handle change has no period owner change; old handle is permanently reserved |
| Transfer | owner creates one pending seven-day offer → recipient accepts with own session → lock offer/open period/alias → close old period/open new period/update lifecycle → audit/outbox | offer expiry/lock race returns typed conflict; no partial ownership change |
| Context list/bind | resolve human → derive self/alias/01c candidates and freshness → on deliberate bind lock candidate and write per-tab/device support row → return projection | selection never grants authority; stale/revoked submission reverts self and explains |
| Legal identity | step-up → validate protected refs/effective period → insert new metadata version and supersede prior record | vault/ref failure or exclusion conflict rolls back; no raw PII enters request/DB |
| Legal disclosure | step-up → re-resolve person context → verify transaction/audience/purpose/minimum fields/effective identity → insert append-only event and audit | no event on any failed gate; consuming transaction remains source of eligibility |
### Platform events

Events use the BE00 PlatformEvent envelope: eventId, type, version, occurredAt, producer, aggregateId, aggregateVersion, correlationId, causationId, and identifier-only payload. Outbox insertion is in the same transaction as the source mutation; Queue delivery is at-least-once and consumers are idempotent.

| Event | Payload | Emission and consumer contract |
|---|---|---|
| identity.facet.changed.v1 | personId, facetCode | emit on add/removal; no legal/private fields. Shards 02–18 refresh capability/projection by canonical IDs |
| identity.alias.changed.v1 | aliasId | emit create/display/handle/retire/transfer; consumers refetch viewer-relative projection and preserve historical attribution |
| identity.acting-context.revoked.v1 | personId, partyId, relationshipId nullable for self/alias | emit explicit revocation only; no event for ordinary 12-hour expiry. 01c relationship revocations use its relationship ID |
| legal disclosure audit | no PlatformEvent required | immutable local LegalDisclosureEvent plus BE00 audit; consuming transaction receives only approved event metadata through its named boundary |

Downstream commands must store actingPartyId, actingHumanId, source relationship/mandate ID when applicable, source version, and the resolved authority snapshot. Shard 22 owns distribution mandate; Shard 30 owns announce_waive purpose capability and P-07; generic identity never implies either. Shard 02 owns profile rendering/claims. Shard 39 consumes identity events without receiving legal values.
### Partial-state and external dependency matrix

| Dependency/failure | Before commit | After source commit | Recovery |
|---|---|---|---|
| Auth/session or 01a human resolution unavailable | no mutation | none | 401 or 503; retry with same idempotency key |
| Party factory/RPC unavailable | idempotency reservation is rolled back | none | 503; no orphan PersonParty |
| Facet registry/obligation projection unavailable | command is refused | none | 503; never assume obligations closed |
| Handle normalizer/unique allocator conflict | alias transaction is rolled back | none | 409 or 503; old handle remains |
| 01c context projection unavailable | list may return explicit unavailable state; bind refuses | none | 503; self remains selected |
| Vault/protected-ref provider unavailable | legal transaction is rolled back | none | 503; no raw fallback or partial record |
| Eligibility/allowlist adapter unavailable | disclosure refuses | none | 503; no event and no delivery |
| Audit/outbox insert failure | transaction rolls back | none | 503/internal alert; retry is idempotent |
| Queue/projection consumer failure | source remains canonical | source committed | outbox retry/DLQ and reconciliation; never reverse source or resurrect retired data |
| Context idle/revocation job race | command rechecks row lock and current source | none | typed conflict; revert to self |
### External seam contracts and circuit state

These are the only non-local effects used by this companion. Every adapter uses a strict request and response DTO, carries `requestId` and the operation id, and maps failure to the BE00 `ApiError { code, message, requestId, details }` envelope. A circuit-open result never grants authority or fabricates a successful identity value.

| Operations | Seam and owner | Exact request | Exact response | Timeout | Retry policy | Circuit, open state, and recovery |
|---|---|---|---|---:|---|---|
| BE01b-01, BE01b-02 | 01a party-spine and human resolver | `authSubjectRef`, `requestId`, `contractVersion`, `idempotencyKey`, `expectedPersonVersion` when present | `humanId`, `personId`, `personVersion`, `resolutionState`, `authoritySnapshotVersion` | 5,000 ms | Two attempts at 250 ms and 750 ms only before a domain effect; a timed-out command reconciles the same key before retry | Five failures in 60 seconds open for 60 seconds; return `DEPENDENCY_UNAVAILABLE` 503, roll back reservations, and retry only after key/status reconciliation |
| BE01b-12, BE01b-13 | 01c acting-context projection | `humanId`, `requestedPartyId`, `relationshipId` when present, `sourceVersion`, `purposeCode`, `requestId` | `candidatePartyId`, `contextState`, `relationshipVersion`, `capabilityClasses`, `expiresAt` | 2,000 ms | Two safe reads at 250 ms and 750 ms; binding mutation is never blindly replayed | Five failures in 60 seconds open for 60 seconds; list returns a typed unavailable state and bind returns 503 while self context remains selected; reconcile before retry |
| BE01b-15, BE01b-16 | Protected vault or reference service | `protectedRefIds`, `purposeCode`, `audiencePartyId`, `legalRecordVersion`, `requestId` | `referenceReceiptIds`, `readinessState`, `effectiveUntil`, `retentionClass`; no raw value | 5,000 ms | Two attempts at 500 ms and 1,500 ms for readiness reads; mutation outcome is reconciled by key | Five failures in 60 seconds open for 60 seconds; roll back legal identity or disclosure work and return 503, with no raw fallback or partial record |
| BE01b-16 | Transaction eligibility and allowlist adapter | `transactionId`, `subjectPersonId`, `recipientPartyId`, `purposeCode`, `requestedFieldCodes`, `legalRecordVersion`, `requestId` | `eligibilityState`, `audienceState`, `minimumFieldCodes`, `expiresAt`, `policyVersion` | 2,000 ms | Two reads at 250 ms and 750 ms; no event is emitted until a fresh result is obtained | Five failures in 60 seconds open for 60 seconds; return 503 `DEPENDENCY_UNAVAILABLE`, insert no disclosure event, and retry through the same idempotency key |
| BE01b-01 through BE01b-18 | BE00 outbox and projection delivery | `eventId`, `eventType`, `aggregateId`, `aggregateVersion`, `correlationId`, identifier-only payload | `accepted`, `deliveryAttemptId`, `inboxState` | 2,000 ms per dispatch | Three queue deliveries at 15, 60, and 300 seconds, then DLQ; consumers dedupe by event ID and version | Five dispatch failures in 60 seconds open for 60 seconds; source transaction remains canonical, row stays pending, and sweeper reconciliation resumes delivery without reversing state |
## Error Handling

The error response matrix above is exhaustive. Missing or malformed `If-Match` is 400 `INVALID_REQUEST`; this project does not add the unapproved historical 428 code. Stale strong tags remain 409 `VERSION_MISMATCH`. Every refusal preserves the four-field `ApiError`, concealment policy, and no-partial-state guarantees inherited from BE00.

### Rate and Abuse Controls

- Handle input is normalized with the pinned server algorithm and confusable skeleton; collisions return no owner information. Display names are not unique.
- Alias creation uses both operational throttling and the IA business quota of five creations per person per rolling 30 days. Handle changes use two per alias per rolling 12 months. Quota exhaustion may require friction/review but never auto-transfers ownership or reissues a handle.
- Account provisioning has a stricter abuse overlay; repeated idempotency mismatches, invalid step-up, disclosure probing, transfer enumeration, and public projection scraping are separately counted and may be challenged without changing canonical state.
- Mass assignment is prevented by strict schemas and output allowlists. No request can set owner, lifecycle, version, normalized handle, legal identity ID, audit actor, role, or relationship.
- Rate-limit keys combine route class, IP where anonymous, authenticated human, party, and recipient as appropriate. 429 has Retry-After plus RateLimit-Limit/Remaining/Reset. Security controls may tighten a class but cannot weaken the IA quotas.
### Observability

Every route emits an operation span and bounded metrics for request count, status class, latency, rate rejection, validation rejection, authorization denial, conflict type, idempotency replay/mismatch, and dependency retry. Logs use BE00 allowlisted fields only: request/correlation/trace IDs, operation, safe route, actor class, acting-party class, aggregate ID hash/version, outcome, error code, duration, dependency, retryable. Raw handles, display names, Auth claims, legal refs, field values, transaction payloads, cookies, tokens, and policy evidence are forbidden. Sentry keeps sendDefaultPii false and session replay off.

SLO targets follow BE00: Tier 1 reads p95 under 750 ms with query p95 under 200 ms; Tier 2 commands p95 under 1,200 ms with RPC p95 under 300 ms. Alias normalization, row locks, and allowlist checks count toward the command budget. Timeouts surface 503/504 and never imply success.
## Contract, Database, Security, and E2E Tests

Tests are normative acceptance criteria, not implementation suggestions.

| Test family | Required cases |
|---|---|
| Route registry/OpenAPI | all 18 operation IDs appear once; method/path/auth/cache/timeout/rate/SLO/criticality/errors match this file; no undocumented route or schema drift |
| Zod contracts | every request/success/error schema; unknown keys; malformed JSON; wrong scalar types; UTF-8/control/format smuggling; max lengths/depth/arrays; all field-matrix violation codes |
| Person/idempotency | create with zero facets; repeated same key replays one person/self context; same key different hash is conflict; duplicate Auth UUID is typed refusal; email/name/provider text never merges |
| Facets | all seven registry values; one facet per command; unknown/curation input rejected; remove CAS; open obligation codes; concurrent add/remove loser gets VERSION_MISMATCH; history retained |
| Handles/aliases | Unicode case/confusable property tests; display collision allowed; normalized collision rejected without owner leak; five/30d and two/12mo quotas; handle never reissued; public/private projection allowlist |
| Alias transfer | offer exactly seven days; recipient-only accept; owner-period lock race; stale offer/version; decline/expiry; mandated alias refusal; one old and one new non-overlapping period; retired alias cannot reactivate |
| Context | candidate derivation from current records; deliberateConfirmation required; deep link cannot bind; per-tab/device isolation; alias owner-period recheck; 12-hour inactivity/revert; revoked/expired display then submit fail closed; first attested/monetary action reconfirm gate |
| Legal identity/disclosure | protected refs only; effective periods exclusion; recent step-up; person not alias actor; transaction/purpose/audience allowlist; minimum field projection; no event on every failed gate; no browser cache/raw value; immutable ledger read scope |
| Authorization/RLS | anonymous, wrong valid user/party/resource, revoked/expired, stale, operator overreach, service principal, BOLA/tenant injection, forged JWT metadata; direct table grants denied |
| Idempotency/concurrency | concurrent same key returns one result; mismatch conflict; rollback permits retry; ETag strong exact; missing/stale preconditions; serializable handle/transfer/period races |
| Events/partial state | transactional outbox; duplicate consumer replay; queue retry/DLQ; dependency timeout leaves no orphan/partial disclosure; projection lag never changes source truth; retired handle not resurrected |
| Performance/accessibility | Tier 1/Tier 2 SLO tests, query budgets, bounded list max 50; API supports text+avatar labels, explicit context/recipient/purpose/effect/reversibility, announced errors, no loading-as-empty |
| Build/security | migration from empty and representative latest schema; generated types diff; every RLS/grant/index/check tested; coverage follows standards (90% global, 95% changed, 100% contracts/authz/idempotency/RLS); dependency/secret/SAST/ZAP gates |
## Deepening Passes 1–10

| Pass | Result |
|---:|---|
| 1 Cross-endpoint consistency | PASS — shared person/alias/version/idempotency/error vocabulary is consistent |
| 2 Sequencing/concurrency | PASS — CAS, serializable handle/transfer ranges, offer expiry, and effective-period exclusions are explicit |
| 3 Failure cascade | PASS — each external dependency has rollback, retry, queue, or explicit refusal |
| 4 Authorization completeness | PASS — role × endpoint matrix includes ownership, audience, 403/404 policy, operator and service boundaries |
| 5 Observability | PASS — every endpoint has operation, metrics, audit/outbox, trace, and forbidden-field rules |
| 6 Rate/abuse | PASS — anonymous/authenticated keys, bursts, quotas, enumeration, normalization, and mass-assignment controls are named |
| 7 Partial state | PASS — no external failure can create an orphan, disclosure event, ownership split, or authority grant |
| 8 Cross-shard convergence | PASS — 01a/01c/01d ownership and downstream consumers have explicit handoff contracts |
| 9 Two-implementer test | PASS — two implementers can derive routes, fields, states, errors, RLS, and tests without product decisions |
| 10 Devil's-advocate/ambiguity | PASS — no unresolved ambiguity in owned scope; excluded decisions are named gates, not unresolved states |

The passes are specification gates. Runtime implementation remains subject to the command and CI gates listed below; this document does not claim that code or infrastructure already exists.
## Ambiguity and Boundary Gates

- **Micro ambiguity**: no untyped field, unstated default, unspecified error class, unbounded collection, owner predicate, cache policy, or state transition remains for an owned endpoint.
- **Macro ambiguity**: canonical party IDs, Auth subject proof, 01c relationship authority, downstream transaction eligibility, and protected vault refs each have one source of truth.
- **Two-implementer check**: route cards plus schemas/DDL/policies produce the same externally visible contract; where an adapter is required, its input/output and failure behavior are stated.
- **Devil's advocate**: duplicate identity, homoglyph capture, alias-manager capture, stale context, deep-link switching, mandated transfer, open obligations, over-disclosure, legal-period race, RLS/BOLA, queue replay, and projection anti-resurrection all fail closed.
- **Source gaps**: no current IA source gap blocks 01b. Provider mechanics, organization/relationship fields, identifiers/legacy, profile content, transaction eligibility, and vault implementation remain companion/domain-owned interfaces and are not silently invented here.
## Verification Commands

Run from the repository root after any source edit:
~~~sh
git diff --check -- .memory/wiki/specs/be/01b-party-identity-aliases.md
node .memory/pipeline/lint.mjs
node .memory/pipeline/compile.mjs
~~~
Protocol 8 requires the full compile/memory graph refresh and tracker/index verification by the orchestrating agent. This shard intentionally does not edit index.md, spec-pipeline.md, feature-ledger.md, or generated schema files. pnpm validate remains an environment gate when package.json/Corepack/lockfiles are absent; do not report it as passed without those inputs.

## Ambiguity Gate

**PASS.** Implementer simulation and devil's-advocate review covered BE01b-01 through BE01b-18, strict request and success schemas, per-operation middleware and CORS, BE00 ApiError envelopes, authorization concealment, idempotency and concurrency, typed persistence, state recovery, integration boundaries, observability, tests, and source reconciliation. No unresolved implementation ambiguity remains; open questions are none.

## Open Questions

None. Provider mechanics, organization/relationship fields, identifiers/legacy, profile content, transaction eligibility, and protected-vault implementation are explicit companion or downstream interfaces, not unresolved behavior in this specification.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Replaced classification stub with complete Shard 01b backend contract; reconciled IDA-01–05, deep-dive decisions, BE00 envelope, DDL/RLS, events, tests, and ambiguity gates | /write-be-spec-write | All |
## Explicit Companion Boundary

- Upstream: [IA Shard 01](../ia/01-identity-authority.md), [identity deep dive](../ia/deep-dives/01-identity-authority.md), [BE00](00-infrastructure.md)
- Siblings: [BE01a](01a-auth-account-linking.md), [BE01c](01c-relationships-authority-governance.md), [BE01d](01d-identifiers-legacy.md)
- Primary consumers: [IA Shard 02](../ia/02-profiles-verification.md), [IA Shard 22](../ia/22-release-distribution.md), [IA Shard 30](../ia/30-booking-contracts.md), [IA Shard 39](../ia/39-analytics-ingestion-reporting.md), and [IA Shard 41](../ia/41-career-finance.md)
| PersonParty | One human party linked to at most one active Auth subject | Auth proves the subject; this shard owns the domain row and lifecycle projection |
| RoleFacetAssertion | One versioned assertion for one registered role facet | This shard owns assertion state; the protected facet registry is platform configuration |
| AliasParty | A public-facing party with one owner at a time | This shard owns alias lifecycle and public linkage; profile rendering remains Shard 02 |
| AliasOwnershipPeriod | Dated, non-overlapping alias ownership history | This shard owns the append-only attribution history |
| HandleReservation | Globally unique, confusable-normalized handle history | This shard owns reservation and permanent redirect semantics |
| Acting-context binding | Per-tab/device selected context support record | Support/workflow state, not a new authority grant or product party |
| Acting-context projections | Viewer-relative list and selected-context response | Derived allowlisted read models; organization/representation rows are supplied by 01c |
| LegalIdentityRecord | Protected, effective-dated references to legal identity material | This shard owns metadata and effective periods, never raw credentials or browser-visible PII |
| LegalDisclosureEvent | Append-only proof of a permitted legal-identity disclosure | This shard owns the ledger event; the consuming transaction owns its eligibility |

The following are explicitly not owned here: Supabase Auth provider/session/MFA mechanics; the shared party factory implementation; organizations; memberships; representations; mandates; governance; external identifiers; successor nomination; memorialisation; estates; profile rendering or claiming; payments; disputes; and provider-specific verification. A companion or downstream spec may call this boundary through the named contracts below but may not duplicate or infer its authority.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
