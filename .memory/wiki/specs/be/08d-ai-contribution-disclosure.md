# BE 08d — AI contribution disclosure

> **IA Source**: [Shard 08 — Credit reporting, exchange and disclosure](../ia/08-credit-reporting-disclosure.md)
> **Deep Dives**: None; the IA source explicitly records that no deep-dive file is required.
> **Status**: Complete

## Split Group

> **Split origin**: 08-credit-reporting-disclosure
> **Companion specs**: [08a — Portability and DDEX emission](08a-portability-ddex-emission.md), [08b — Union and performer session reporting](08b-union-session-reporting.md), [08c — Gear-credit linkage](08c-gear-credit-linkage.md), this file
> **Shared entities**: All companions consume BE00 request, idempotency, audit and outbox infrastructure. This companion owns only ai_disclosure_version and destination_policy_version; output_request, generated_artifact, emission_record and credit truth remain owned by their source companions.

## Classification

- **Type**: Multi-domain split, AI contribution disclosure and destination-policy evaluation.
- **IA source**: 08-credit-reporting-disclosure.md, interactions CXR-11 through CXR-14.
- **BE specs produced**: 08a, 08b, 08c and 08d. The split is valid because portability/emission, union reporting, gear linkage and AI disclosure have independent routes, persistence sets and authorization predicates.
- **This boundary**: CXR-11 records a contributor-authored structured disclosure; CXR-12 appends an amendment or retraction; CXR-13 evaluates a named destination policy without mutating credit or disclosure; CXR-14 returns an authorization-inherited disclosure projection.
- **Not owned here**: credit truth, provenance rung, rights, splits, AI detection, human-origin inference, export artifact creation, recipient delivery, gear identity or ownership, and union filing.

## Referenced Material Inventory

| Source file | Sections and line range | Material consumed | Application in this spec |
|---|---|---|---|
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Overview and Scope Reconciliation, lines 1-24 | Four-way split, voluntary disclosure boundary, no deep dive | Classification, ownership and explicit non-inference boundary |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Acceptance Criteria, lines 40-55 | CXR-11 through CXR-14 behavior and failure recovery | Route registry, contracts, authorization, errors and tests |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Interactions and Global Rules, lines 59-82 | Input, authorization, idempotency and revision guarantees | Endpoint reconciliation and middleware order |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Contracts, lines 84-117 | AIInvolvementKindV1, RecordAIDisclosure, EvaluateDisclosurePolicy, and standard errors | Request and success schemas, policy result and error codes |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Data Models and AI Disclosure Entry V1, lines 119-147 | Two owned models and exact entry fields and bounds | Persistence fields, JSON entry schema and response projection |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Typed Registry, Access Control and Escalation, lines 149-186 | UUID, version, state, actor and disclosure authorization rules | SQL types, role matrix and 403 versus 404 decisions |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Events, Edge Cases and Coverage Matrix, lines 197-249 | credit.ai-disclosure.changed.v1, stale behavior, absent disclosure and destination gaps | Event contract, state recovery and operation test matrix |
| .memory/wiki/specs/ia/08-credit-reporting-disclosure.md | Cross-Shard Dependencies and Contract Map, lines 251-267 | BE00, BE01, BE07 and 08a direction; no Shard 23 dependency | External seams and dependency direction |
| .memory/wiki/specs/feature-ledger.md | Credits and Attribution row 02.10, line 224 | AI Contribution Disclosure feature, MoSCoW Should | Feature ledger coverage |
| .memory/wiki/specs/2026-08-02-architecture-design.md | Backend Runtime and API Design, lines 343-376 | Hono, REST, Zod 4, idempotency and versioned commands | Runtime boundary and command guarantees |
| .memory/wiki/specs/2026-08-02-architecture-design.md | Error Architecture, lines 576-624 | Four-field error envelope, status map, deadlines and retry semantics | ApiError, HTTP mapping and recovery |
| .memory/wiki/specs/2026-08-02-architecture-design.md | Input Validation and Rate Limits, lines 761-788 | Strict schemas, output allowlists and numeric route limits | Zod, sanitization and route rate limits |
| .memory/wiki/specs/2026-08-02-architecture-design.md | Browser and API Controls, lines 790-797 | Exact-origin CORS, CSRF, CSP and supply-chain controls | Middleware and security policy |
| .memory/wiki/specs/be/00-infrastructure.md | API contracts and endpoint registry, lines 67-165 | BE00 request context, ApiError, deadlines, headers and status semantics | Inherited boundary contract |
| .memory/wiki/specs/be/00-infrastructure.md | Database, grants and transaction flow, lines 206-249 and 260-345 | Private schema, RLS, RPC, audit, idempotency and outbox | Persistence and atomic command behavior |
| .memory/wiki/specs/be/01b-party-identity-aliases.md | Contracts and authority resolution, lines 88-100 and 651-690 | Person, acting-party and purpose-bound authority | Actor resolution and disclosure ownership |
| .memory/wiki/specs/be/07a-credit-assertions-visibility.md | Contribution projection and visibility, lines 24-40 and 323-370 | Authorized contribution read, source version and deny-first visibility | BE07 seam and response filtering |
| .memory/wiki/specs/be/08a-portability-ddex-emission.md | Stale invalidation and emission contracts | Export and emission invalidation after disclosure change | Explicit 08a invalidation seam, not route duplication |

## IA Source Map

### Interaction map

| IA interaction | Stable operation ID | IA source | Backend realization |
|---|---|---|---|
| CXR-11 Add AI involvement entry | CXR-08D-01 | IA Acceptance Criteria line 52; Interactions line 71 | POST contributor-owned structured entries; zero entries mean not disclosed |
| CXR-12 Amend/retract AI disclosure | CXR-08D-02 | IA Acceptance Criteria line 53; Interactions line 72 | POST immutable successor or retraction with expected-version CAS |
| CXR-13 Evaluate destination requirement | CXR-08D-03 | IA Acceptance Criteria line 54; Interactions line 73 | POST named policy evaluation returning destination-scoped pass, block or warning |
| CXR-14 View disclosure | CXR-08D-04 | IA Acceptance Criteria line 55; Interactions line 74 | GET viewer-relative active or authorized historical projection with pagination |

### Model map

| IA model | Owned operation IDs | IA source | Persistence/projection realization |
|---|---|---|---|
| ai_disclosure_version | CXR-08D-01, CXR-08D-02, CXR-08D-04 | Data Models line 132; typed registry line 162 | Append-only version chain keyed by contribution and version; entries are JSON keys, not child entities |
| destination_policy_version | CXR-08D-03 | Data Models line 133; typed registry line 163 | Versioned effective policy with external destination reference and recorded source evidence |

### Event map

| IA event | Produced by | IA source | Payload realization |
|---|---|---|---|
| credit.ai-disclosure.changed.v1 | CXR-08D-01 and CXR-08D-02 | Event Schemas line 206 | Opaque disclosure and contribution references, vocabulary version, state and version; no entries, notes or PII |

## Feature Ledger Coverage

| Feature ID | Feature name | Ledger source | BE coverage | Boundary note |
|---|---|---|---|---|
| 02.10 | AI Contribution Disclosure | .memory/wiki/specs/feature-ledger.md, line 224 | 08d CXR-08D-01 through CXR-08D-04 | Complete here; capture is voluntary, destination requirements are scoped to the named destination, and absence never means human origin |

## Endpoint Completeness Reconciliation

| IA interaction | Expected backend surface | Specced operation | Result |
|---|---|---|---|
| CXR-11 Add AI involvement entry | POST /api/v1/credits/{creditId}/ai-disclosures | CXR-08D-01 | Authored with strict request and response contracts |
| CXR-12 Amend/retract AI disclosure | POST /api/v1/credits/{creditId}/ai-disclosures/{disclosureId}/supersede | CXR-08D-02 | Authored with immutable successor, retraction and CAS |
| CXR-13 Evaluate destination requirement | POST /api/v1/credits/{creditId}/ai-disclosures/evaluate-destination | CXR-08D-03 | Authored with effective policy lookup and destination-only result |
| CXR-14 View disclosure | GET /api/v1/credits/{creditId}/ai-disclosures | CXR-08D-04 | Authored with cursor pagination and inherited source authorization |

No CXR-11 through CXR-14 route is deferred. evaluate-destination is registered before the parameterized disclosureId supersede route, and the latter accepts only a UUID path segment, preventing literal-route collision.

## Shared Contract Inheritance

1. BE00 creates and propagates the request ID, authenticated session or registered service principal, acting context, locale, schema version, trace context and exact application deadline. Commands use the 15-second protected-command deadline; the disclosure read uses the 8-second ordinary-read deadline.
2. Every failure uses exactly ApiError { code, message, requestId, details }. details is a bounded JSON object containing allowlisted field paths, opaque IDs, expected/current versions, policy result and retry metadata only.
3. Idempotency-Key is required on CXR-08D-01, CXR-08D-02 and CXR-08D-03. It is bound to actor, operation, normalized request hash and schema version in the BE00 transaction. CXR-08D-04 is a replay-safe read and does not reserve an idempotency record; an optional key is correlation-only and never changes the projection.
4. A command commits domain state, immutable audit, idempotency result and outbox event in one PostgreSQL RPC transaction. A response lost after commit is recovered by replaying the same key or querying the read route.
5. Strong expected versions are required for contributor mutation and policy evaluation. Source contribution version and authorization are rechecked under the transaction; caller-supplied owner, role, destination policy state or human-origin label is never trusted.
6. RLS is defense in depth. The API resolves human, acting party, contribution, author and purpose before invoking a named RPC. No browser client receives direct table privileges or service credentials.

## API Endpoints

### Authoritative Route Registry

| Operation ID | IA interaction | Method and path | Auth and ownership | Request | Success | Errors | Idempotency and rate | Middleware, CORS and error |
|---|---|---|---|---|---|---|---|---|
| CXR-08D-01 | CXR-11 Add AI involvement entry | POST /api/v1/credits/{creditId}/ai-disclosures | Authenticated contributor of the target contribution; disclosure author is resolved from acting context | RecordAIDisclosureRequest | RecordAIDisclosureResponse 201 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429, 503, 504 | Idempotency-Key required; 10/minute/user and 20/minute/contribution | BE00 request ID, deadline and CSRF; exact-origin credentialed CORS policy consumer-authenticated; strict Zod, BE01 actor, BE07 source, rate, RPC audit/outbox and ApiError normalization |
| CXR-08D-02 | CXR-12 Amend/retract AI disclosure | POST /api/v1/credits/{creditId}/ai-disclosures/{disclosureId}/supersede | Original author of the active disclosure only; no admin, Producer, support or worker override | AmendAIDisclosureRequest | AmendAIDisclosureResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429, 503, 504 | Idempotency-Key required; 10/minute/user and 20/minute/contribution | BE00 request ID, deadline and CSRF; exact-origin credentialed CORS policy consumer-authenticated; strict Zod, author check, disclosure CAS, 08a invalidation enqueue, rate and ApiError normalization |
| CXR-08D-03 | CXR-13 Evaluate destination requirement | POST /api/v1/credits/{creditId}/ai-disclosures/evaluate-destination | Registered export or release adapter, or human with named policy-evaluation capability; scope is one destination and authorized contribution set | EvaluateDisclosurePolicyRequest | EvaluateDisclosurePolicyResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 409, 422, 429, 503, 504 | Idempotency-Key required; 60/minute/user or adapter principal and 120/minute/destination | BE00 request ID and deadline; exact-origin credentialed CORS policy consumer-authenticated for humans and non-browser service-adapter CORS policy for adapters; strict Zod, policy/version check, rate and ApiError normalization |
| CXR-08D-04 | CXR-14 View disclosure | GET /api/v1/credits/{creditId}/ai-disclosures | Viewer must be authorized for the underlying contribution; no disclosure-specific widening | ViewAIDisclosureQuery | ViewAIDisclosureResponse 200 | ApiError { code, message, requestId, details }; 400, 401, 403, 404, 429, 503, 504 | No mutation idempotency reservation; replay-safe signed keyset cursor over (version DESC, disclosureId ASC) with disclosureId as the unique tie-break; default limit 25, max 50; fixed sort version_desc_disclosure_id_asc; 300/minute/user and 120/minute/IP unauthenticated | BE00 request ID and read deadline; exact-origin credentialed CORS policy consumer-read or deny-by-default anonymous policy; strict Zod query, BE07 visibility projection, read rate and ApiError normalization |

### Registry invariants

- Each operation has exactly one authoritative route row above and uses the stable operation ID in its contract, authorization, rate, observability and test rows.
- Every operation's error serializer returns exactly ApiError { code, message, requestId, details }; no status, error, provider payload, stack, raw notes or PII is added.
- A visible resource with insufficient capability is 403. A contribution, disclosure, policy or credit hidden by RLS or absent under an existence-safe lookup is 404. CXR-08D-03 returns 404 for a hidden or missing effective policy, never a default pass.
- CXR-08D-01 and CXR-08D-02 never infer AI use, human origin, threshold status or provenance. CXR-08D-03 may block only the named destination and never rewrites credit or disclosure. CXR-08D-04 renders no entries as not_disclosed, not as human.
- evaluate-destination is a fixed literal path registered ahead of the parameterized disclosureId supersede route; the parameter route rejects non-UUID disclosure IDs.

### Operation contract and error matrix

| Operation ID | Request to success contract | Error outcomes, HTTP status and retry behavior |
|---|---|---|
| CXR-08D-01 | RecordAIDisclosureRequest validates one target contribution, versioned vocabulary and zero to 64 entries. RecordAIDisclosureResponse returns immutable disclosure ID, contributor author, entries, vocabulary version, active state, version and not-disclosed projection flag. | INVALID_REQUEST 400 for malformed path, header or JSON and INVALID_REQUEST field details; UNAUTHENTICATED 401; FORBIDDEN 403 for another contributor; CONTRIBUTION_NOT_FOUND 404 when source is hidden; VERSION_CONFLICT 409 for source or idempotency race; VALIDATION_FAILED 422 for vocabulary or entry bounds; RATE_LIMITED 429 with retry headers; DEPENDENCY_UNAVAILABLE 503 or DEADLINE_EXCEEDED 504 after bounded read retry. Retry only with same idempotency key after reconciliation. |
| CXR-08D-02 | AmendAIDisclosureRequest supplies original disclosure, action, reason and expected version. AmendAIDisclosureResponse returns the new immutable active or retracted version, supersedes reference and stale-invalidation status. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for non-author or acting-party mismatch; DISCLOSURE_NOT_FOUND 404 when RLS hides the chain; VERSION_CONFLICT 409 for moved version or idempotency mismatch; VALIDATION_FAILED 422 for missing reason, invalid action or entries; RATE_LIMITED 429; DEPENDENCY_UNAVAILABLE 503 or DEADLINE_EXCEEDED 504. Same-key replay is safe; ambiguous 08a enqueue is reconciled by event ID. |
| CXR-08D-03 | EvaluateDisclosurePolicyRequest names destination policy version and authorized contributions with expected disclosure versions. EvaluateDisclosurePolicyResponse returns policy version, pass, block or warning, typed destination gaps and evaluated timestamp without mutation. | INVALID_REQUEST 400; UNAUTHENTICATED 401; FORBIDDEN 403 for an unregistered adapter or out-of-scope human; CONTRIBUTION_OR_POLICY_NOT_FOUND 404 when RLS hides either; VERSION_CONFLICT 409 when a disclosure version moves; RECIPIENT_REQUIREMENT_UNMET 422 for destination-only block; PROFILE_UNAVAILABLE 503 when the registry has no effective policy or is unavailable; DEADLINE_EXCEEDED 504. Retry read/evaluation with same key after reconciliation; never default pass. |
| CXR-08D-04 | ViewAIDisclosureQuery validates cursor, limit and history choice. ViewAIDisclosureResponse returns only authorized entries and source metadata, with notDisclosed true for zero entries, cursor state and projection version. | INVALID_REQUEST 400 for cursor or limit; UNAUTHENTICATED 401 when a session is required; FORBIDDEN 403 when the viewer cannot see the underlying contribution; CREDIT_NOT_FOUND 404 when RLS hides the credit; RATE_LIMITED 429; DEPENDENCY_UNAVAILABLE 503 or DEADLINE_EXCEEDED 504. GET may retry with the same cursor; dependency failure never becomes an empty successful page. |

### Route field validation matrix

| Operation ID | Field-by-field validation | Success assertion |
|---|---|---|
| CXR-08D-01 | creditId, contributionId, actingContextVersion, expectedContributionVersion and expectedVersion are UUID or positive integer types. vocabularyVersion is 1 to 80 printable characters. entries is an array of 0 to 64 strict objects. kind uses the loaded versioned enum; scope is whole or partial; scopeDetail is required only for partial and is 1 to 280 plain-text characters; tool and model fields are optional plain text up to 120 characters; links, markup and control characters fail with VALIDATION_FAILED. reason is optional plain text up to 500 characters. | Contributor is proven by BE01 and source contribution is read at the exact expected version. One immutable version is committed; empty entries project as not disclosed and no human-origin assertion. |
| CXR-08D-02 | creditId and disclosureId are UUIDs. action is amend or retract. entries is 1 to 64 for amend and exactly an empty array for retract. reason is required plain text 1 to 500 characters. expectedVersion and actingContextVersion are positive integers. | Only the original author can append a successor. Prior version remains queryable under authorized history; new version drives active projection and one stale invalidation event is queued. |
| CXR-08D-03 | creditId is UUID. destinationRef is opaque plain text 1 to 160 characters. policyId is UUID and policyVersion is positive integer. contributionIds has 1 to 500 unique UUIDs. expectedDisclosureVersions has one entry per contribution with positive version. mode is export or release. | Effective policy and every requested source disclosure are authorized at one read snapshot. The result is destination-scoped and lists missing data as a typed gap, never as proof of human origin. |
| CXR-08D-04 | includeHistory is boolean default false. cursor is an opaque base64url token max 512 characters bound to credit, audience, acting context and the fixed sort. limit is integer 1 to 50 default 25. sort is the exact literal version_desc_disclosure_id_asc, ordering version descending with disclosureId ascending as the unique tie-break. Path creditId is UUID. | One permission-aware snapshot supplies items and cursor. Hidden rows are excluded before count or pagination; a source outage returns an error rather than an empty disclosure. |

## Request/Response Contracts (Zod 4 schemas)

~~~ts
import { z } from "zod";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ]),
);

export const ApiError = z.strictObject({
  code: z.string().regex(/^[A-Z][A-Z0-9_]{0,63}$/),
  message: z.string().min(1).max(500),
  requestId: z.uuid(),
  details: z.record(z.string(), JsonValueSchema),
});

const Id = z.uuid();
const Version = z.number().int().positive();
const DateTime = z.iso.datetime({ offset: true });
const PlainText = (max: number) =>
  z.string().trim().min(1).max(max).refine(
    (value) => !/[<>\u0000-\u001f]/.test(value) && !/\b(?:https?:\/\/|www\.)/i.test(value),
    "plain text without markup, links or control characters",
  );
const Kind = z.enum(["generation", "assistance", "modelling", "separation", "correction"]);

const DisclosureEntry = z.discriminatedUnion("scope", [
  z.strictObject({
    kind: Kind,
    scope: z.literal("whole"),
    scopeDetail: z.never().optional(),
    toolName: PlainText(120).optional(),
    toolVersion: PlainText(120).optional(),
    modelName: PlainText(120).optional(),
    subjectIsOwnModel: z.boolean().default(false),
  }),
  z.strictObject({
    kind: Kind,
    scope: z.literal("partial"),
    scopeDetail: PlainText(280),
    toolName: PlainText(120).optional(),
    toolVersion: PlainText(120).optional(),
    modelName: PlainText(120).optional(),
    subjectIsOwnModel: z.boolean().default(false),
  }),
]);

const DisclosureVersionProjection = z.strictObject({
  disclosureId: Id,
  creditId: Id,
  contributionId: Id,
  authorPartyId: Id,
  vocabularyVersion: z.string().trim().min(1).max(80),
  entries: z.array(DisclosureEntry).max(64),
  reason: PlainText(500).optional(),
  state: z.enum(["active", "superseded", "retracted"]),
  version: Version,
  supersedesId: Id.optional(),
  notDisclosed: z.boolean(),
  createdAt: DateTime,
  updatedAt: DateTime,
});

export const RecordAIDisclosureRequest = z.strictObject({
  creditId: Id,
  contributionId: Id,
  vocabularyVersion: z.string().trim().min(1).max(80),
  entries: z.array(DisclosureEntry).max(64),
  reason: PlainText(500).optional(),
  expectedContributionVersion: Version,
  actingContextVersion: Version,
  expectedVersion: Version,
});

export const RecordAIDisclosureResponse = z.strictObject({
  disclosure: DisclosureVersionProjection,
  staleInvalidationQueued: z.boolean(),
  requestId: Id,
  schemaVersion: z.literal("v1"),
});

const AmendBody = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("amend"),
    entries: z.array(DisclosureEntry).min(1).max(64),
    reason: PlainText(500),
  }),
  z.strictObject({
    action: z.literal("retract"),
    entries: z.array(DisclosureEntry).length(0),
    reason: PlainText(500),
  }),
]);

export const AmendAIDisclosureRequest = z.strictObject({
  creditId: Id,
  disclosureId: Id,
  expectedVersion: Version,
  actingContextVersion: Version,
  amendment: AmendBody,
});

export const AmendAIDisclosureResponse = z.strictObject({
  disclosure: DisclosureVersionProjection,
  supersedesId: Id,
  staleInvalidationQueued: z.boolean(),
  requestId: Id,
  schemaVersion: z.literal("v1"),
});

const ExpectedDisclosureVersion = z.strictObject({
  contributionId: Id,
  version: Version,
});

const PolicyGap = z.strictObject({
  contributionId: Id,
  code: z.enum(["DISCLOSURE_MISSING", "FIELD_REQUIRED", "IDENTIFIER_MISSING", "TIER_UNSUPPORTED"]),
  severity: z.enum(["blocking", "warning", "lossy"]),
  field: z.string().trim().min(1).max(120).optional(),
  message: z.string().trim().min(1).max(500),
});

export const EvaluateDisclosurePolicyRequest = z.strictObject({
  creditId: Id,
  destinationRef: PlainText(160),
  policyId: Id,
  policyVersion: Version,
  contributionIds: z.array(Id).min(1).max(500).superRefine((ids, ctx) => {
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "contributionIds must be unique" });
  }),
  expectedDisclosureVersions: z.array(ExpectedDisclosureVersion).min(1).max(500),
  mode: z.enum(["export", "release"]),
  actingContextVersion: Version,
  expectedVersion: Version,
});

export const EvaluateDisclosurePolicyResponse = z.strictObject({
  creditId: Id,
  destinationRef: PlainText(160),
  policyId: Id,
  policyVersion: Version,
  result: z.enum(["pass", "block", "warning"]),
  gaps: z.array(PolicyGap).max(500),
  evaluatedAt: DateTime,
  requestId: Id,
  schemaVersion: z.literal("v1"),
});

export const ViewAIDisclosureQuery = z.strictObject({
  includeHistory: z.boolean().default(false),
  cursor: z.string().regex(/^[A-Za-z0-9_-]{1,512}$/).optional(),
  limit: z.number().int().min(1).max(50).default(25),
  sort: z.literal("version_desc_disclosure_id_asc").default("version_desc_disclosure_id_asc"),
});

export const ViewAIDisclosurePath = z.strictObject({ creditId: Id });

export const ViewAIDisclosureResponse = z.strictObject({
  creditId: Id,
  items: z.array(DisclosureVersionProjection).max(50),
  nextCursor: z.string().regex(/^[A-Za-z0-9_-]{1,512}$/).nullable(),
  hasMore: z.boolean(),
  projectionVersion: Version,
  requestId: Id,
  schemaVersion: z.literal("v1"),
});
~~~

All API path, query, header and body objects are parsed with strict Zod 4 schemas before the use case. creditId in the path and body must match; the handler never trusts a body owner or author. scopeDetail is absent for whole and required for partial. entries: [] is valid for CXR-08D-01 and means not disclosed; it is valid only with retract for CXR-08D-02. ApiError is the BE00/global envelope with exactly four top-level fields.

### Contract field traceability

| Contract element | IA source field or rule | IA line | Constraint carried forward |
|---|---|---:|---|
| DisclosureEntry.kind | AI Disclosure Entry V1 kind | 142 | Open vocabulary members generation, assistance, modelling, separation and correction; new members require a parent vocabulary version |
| DisclosureEntry.scope | AI Disclosure Entry V1 scope | 143 | Closed whole or partial enum |
| DisclosureEntry.scopeDetail | AI Disclosure Entry V1 scope_detail | 144 | Optional only for partial, plain text, max 280 characters |
| DisclosureEntry.toolName and toolVersion | AI Disclosure Entry V1 tool fields | 145 | Optional plain text, max 120 characters each |
| DisclosureEntry.modelName | AI Disclosure Entry V1 model_name | 146 | Optional factual contributor-supplied identifier, max 120 characters |
| DisclosureEntry.subjectIsOwnModel | AI Disclosure Entry V1 subject_is_own_model | 147 | Optional boolean default false; fact only, no adjudication |
| RecordAIDisclosureRequest target, vocabulary, entries and expected versions | RecordAIDisclosure and contribution source rule | 115 and 52 | Own contribution only, versioned vocabulary, zero or more entries and exact source revision |
| AmendAIDisclosureRequest action, reason and expected version | CXR-12 and ai_disclosure_version reason/supersedes/version | 53 and 132 | Stated reason, immutable successor or retraction, CAS and retained history |
| EvaluateDisclosurePolicyRequest destination, policy version and expected disclosure versions | EvaluateDisclosurePolicy and destination policy model | 116 and 133 | Named effective policy, source evidence, no credit or disclosure rewrite |
| ViewAIDisclosureQuery cursor and limit | Authorized projection and global pagination rule | 55, 73 and architecture lines 363-368 | Cursor bound to audience and context, default 25, max 50 |
| Response disclosure identity, state, version and timestamps | ai_disclosure_version typed registry | 132 and 162 | UUID, closed state, positive bigint version and timestamptz fields |
| ApiError | StandardError and global error architecture | 94 and architecture lines 578-598 | Exact code, message, requestId, details envelope with allowlisted JSON details |

The IA field registry is preserved literally: scope_detail?, tool_name?, tool_version?, model_name? and subject_is_own_model? are JSON keys in an entry, not rows or entities. Their question marks denote optionality; no core owner, state, id or version is added to an entry.

## Database Schema

The two rows below are the complete 08d persistence set. Entries remain JSON keys inside ai_disclosure_version.entries; there is no entry table, entry identity, entry owner, entry state or entry version. Contribution, credit, party and evidence references are opaque cross-shard IDs so this shard cannot become a second source of truth.

### Canonical records and fields

| Table and IA model | Typed fields with nullability and constraints | Foreign keys and query indexes | RLS and grants |
|---|---|---|---|
| ai_disclosure_version | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; contribution_ref uuid NOT NULL; author_ref uuid NOT NULL; vocabulary_version text NOT NULL CHECK char_length between 1 and 80; entries jsonb NOT NULL CHECK jsonb_typeof(entries) = array; reason text NULL CHECK reason is null or char_length between 1 and 500; state text NOT NULL CHECK state in active, superseded, retracted; supersedes_ref uuid NULL; version bigint NOT NULL DEFAULT 1 CHECK version > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; a trigger validates every JSON entry against the vocabulary-specific strict schema and its field bounds | supersedes_ref FK to ai_disclosure_version.id ON DELETE RESTRICT; owner, contribution and author refs intentionally have no cross-domain FK because BE01 and BE07 own their lifecycles; unique contribution_ref, version; partial unique contribution_ref where state = active; indexes contribution_ref, state, version DESC; author_ref, created_at DESC; owner_id, updated_at DESC; supersedes_ref | RLS enabled and forced. No anon or authenticated table grant. Named RPC permits insert only for the resolved contributor and permits select through an authorized contribution projection; only svc_credit_disclosure may append successors and audit/outbox rows. Author and entries are returned through purpose-filtered views; service role is never exposed to browsers |
| destination_policy_version | id uuid NOT NULL PRIMARY KEY; owner_id uuid NOT NULL; destination_ref text NOT NULL CHECK char_length between 1 and 160; required_disclosures jsonb NOT NULL CHECK jsonb_typeof(required_disclosures) = array; required_identifiers jsonb NOT NULL CHECK jsonb_typeof(required_identifiers) = array; required_tiers jsonb NOT NULL CHECK jsonb_typeof(required_tiers) = array; effective_from timestamptz NOT NULL; effective_until timestamptz NULL CHECK effective_until is null or effective_until > effective_from; source_evidence_ref uuid NOT NULL; state text NOT NULL CHECK state in draft, effective, retired; version bigint NOT NULL DEFAULT 1 CHECK version > 0; created_at timestamptz NOT NULL; updated_at timestamptz NOT NULL; JSON arrays are validated against the registered destination-policy schema before effective state | No FK for destination_ref because destination is an external adapter identifier; no FK for source_evidence_ref because BE00 owns evidence; unique destination_ref, version; exclusion constraint prevents overlapping effective tstzrange versions for one destination; indexes destination_ref, state, effective_from DESC; destination_ref, effective_from, effective_until; owner_id, updated_at DESC; source_evidence_ref | RLS enabled and forced. No client table grant. svc_policy_registry may insert a new version and retire an old one through a reviewed RPC; svc_credit_disclosure may read only one effective version for a requested destination; reporting administrators receive a redacted policy projection with capability and purpose audit; draft policy and source evidence remain private |

### Persistence invariants

- ai_disclosure_version is append-only. A successor points to the prior version; no update or delete may remove history. The partial unique active index ensures one active version per contribution.
- owner_id and author_ref are resolved from the authenticated contributor and BE01 acting context. They are not accepted as authority claims from request JSON.
- A retracted version carries an empty entries array, remains in the chain, and projects as not disclosed. No absent or empty disclosure produces a human-origin badge.
- A vocabulary member is additive only through a new vocabulary_version. Existing rows are interpreted against their stored version and are never re-parsed with a later member set.
- destination_policy_version can be effective only when its source evidence and required arrays pass the registered policy schema. No effective overlap exists for one destination.
- The policy evaluator reads one effective policy and one authorized disclosure snapshot. If any expected source version changes, the RPC rolls back and returns VERSION_CONFLICT.
- Disclosure mutation emits one outbox event and one audit event in the same transaction. A stale invalidation is a queued consequence and never changes credit truth.
- Erasure or legal hold uses BE00 retention and tombstone rules. Private entry values may be redacted under an approved erasure command while the non-PII audit chain and version relationship remain.

## Middleware & Policies

### Hono middleware order

1. Enforce HTTPS, method, content type, request URL length, header length and JSON body ceiling of 256 KiB. CXR-08D-04 has no body and rejects a body if present.
2. Select the operation CORS policy: consumer-authenticated or consumer-read allows exact configured first-party origins with credentials; service-adapter allows no browser origin and requires the registered adapter principal; anonymous origins are denied by default. No policy uses wildcard credentials. Preflight permits only documented methods and headers and caches at most 600 seconds.
3. Create or validate request ID and trace context, then enforce the 15-second command or 8-second read deadline.
4. Authenticate the Supabase session or registered service principal. Cookie-authenticated mutation routes require same-origin and a session-bound CSRF token; adapter routes do not use browser cookies.
5. Parse path, query, headers and JSON with strict Zod 4. Reject unknown keys, malformed UUIDs, mismatched path/body IDs, unsupported schema version and oversized plain text before a domain read.
6. Resolve BE01 human and acting party. For CXR-08D-01 and CXR-08D-02, resolve the contributor/author relation. For CXR-08D-03, resolve the named adapter capability or scoped human capability. For CXR-08D-04, resolve viewer purpose.
7. Resolve BE07 contribution visibility and source version under RLS. Existence-safe lookup maps hidden source to 404; a visible source with insufficient capability maps to 403.
8. Reserve BE00 idempotency for commands, enforce route-specific rate counters, and bind the normalized request hash. CXR-08D-04 uses authenticated-read or public-read counters and cursor binding.
9. Invoke one PostgreSQL RPC for mutation, CAS, policy snapshot, audit and outbox. Never perform sequential application calls that simulate a transaction.
10. Serialize the allowlisted success projection, issue Cache-Control: no-store on protected responses, and return standard rate-limit headers. CXR-08D-04 may use a short private cache only when its audience/context hash is in the ETag.
11. Normalize all failures to ApiError { code, message, requestId, details }; structured logs and spans receive scrubbed identifiers only.

### Per-operation authorization matrix

| Operation ID | Actor and capability | Ownership and scope checks | Lock and recheck | 403 versus 404 |
|---|---|---|---|---|
| CXR-08D-01 | Authenticated contributor with credit.ai_disclosure.write | Acting party must equal the contributor who owns the target contribution; one disclosure author only; Producer, admin and worker capabilities do not satisfy this row | Lock contribution/disclosure aggregate; recheck BE07 source version, BE01 author and active disclosure key before insert | Hidden credit or contribution is 404; visible contribution owned by another contributor or stale acting context is 403 |
| CXR-08D-02 | Original disclosure author with credit.ai_disclosure.write | Disclosure author and target contributor must equal resolved acting party; reason and expected version bind the successor | Lock active disclosure by contribution; compare expected version; insert successor and outbox atomically | Hidden disclosure chain is 404; visible chain with another actor, admin or Producer is 403 |
| CXR-08D-03 | Registered export/release adapter or named human policy evaluator | Policy scope is one destination and only contributions the principal can read; adapter cannot query graph or mutate policy; human cannot evaluate another party's hidden contribution | Lock policy version selection and read source/disclosure versions at one snapshot; compare expected versions | Hidden credit, contribution or policy is 404; visible resources with missing capability or wrong destination scope are 403 |
| CXR-08D-04 | Viewer authorized to see underlying contribution | Disclosure projection inherits BE07 source authorization; history requires the same capability and purpose; provenance rung is not an input | Read one RLS snapshot; recheck viewer/context at projection boundary; bind cursor to audience and context | Hidden underlying contribution is 404; visible contribution with viewer denial is 403; empty entries are 200 not disclosed |

### Security and abuse controls

- The only writable disclosure actor is the contributor whose contribution is resolved by BE01 and BE07. No admin, Producer, support grant, worker or destination adapter can attest another person's AI involvement.
- owner_id, author_ref, source visibility, policy state and vocabulary membership are server-derived. Mass assignment of these fields is impossible because they do not exist in request schemas.
- Plain-text fields reject markup, links and control characters. Responses escape all text and expose no rendered HTML, provider payload, model prompt, secret, email, name, precise location or private evidence.
- The policy evaluator receives opaque IDs and allowlisted disclosure facts. It does not call an AI detector, create a binary AI label, infer human origin, or copy destination policy into canonical credit.
- Public or unauthenticated reads are deny-by-default for protected contributions. A projection may expose only the exact contributor entries that the underlying BE07 projection permits.
- CSP, X-Content-Type-Options: nosniff, X-Frame-Options: DENY, HSTS and no-store headers are inherited from BE00. CORS never permits credentialed wildcard origins.
- Repeated invalid vocabulary, author probing, idempotency mismatch and cursor enumeration are counted separately. Cloudflare edge burst controls combine with durable domain counters; response timing is normalized for hidden records.

## Data Flow

### Transaction and external seams

| Operations | Seam | Exact request | Exact response | Timeout and retry | Circuit and failure handling |
|---|---|---|---|---|---|
| CXR-08D-01, CXR-08D-02, CXR-08D-04 | BE07 authorized contribution projection | creditId, contributionId, requested source version, viewer or actor context hash, purpose and requestId | creditId, contributionId, source version, contribution visibility, contributor party ref, projection version and allowed fields | 2,000 ms; one read retry after 250 ms with jitter; no mutation retry outside the RPC | Circuit opens after 5 consecutive retryable failures for 60 seconds. Open circuit returns DEPENDENCY_UNAVAILABLE 503; never returns an empty contribution or disclosure |
| CXR-08D-01, CXR-08D-02 | BE01 acting-context and author authority | actorRef, actingPartyRef, contributionId, required capability, context version and requestId | resolved human ref, acting party ref, author-of-contribution boolean, capability decision and current context version | 2,000 ms; one retry after 250 ms only for idempotent authority read | Five retryable failures open a 60-second circuit. Missing or stale context returns ACTING_CONTEXT_STALE 409 or FORBIDDEN 403 according to visibility |
| CXR-08D-01 | Versioned AI vocabulary registry | vocabularyVersion, requested member values, schemaVersion and requestId | vocabulary version, allowed kinds, entry field constraints and registry state | 1,000 ms; two reads at 100 ms and 250 ms with jitter | Circuit opens after 5 failures for 60 seconds. Unavailable registry returns PROFILE_UNAVAILABLE 503; no default vocabulary is substituted |
| CXR-08D-03 | Destination policy registry | policyId, destinationRef, policyVersion, mode and requestId | exact policy ID/version, destination ref, required disclosure/identifier/tier arrays, effective interval, state and source evidence ref | 2,000 ms; one retry after 250 ms for read; policy result is not cached past effective interval | Five retryable failures open 60-second circuit. Missing effective policy returns PROFILE_UNAVAILABLE 503; invalid response fails closed |
| CXR-08D-02 | 08a portability and emission stale invalidation | eventId, contributionId, changed disclosure version, prior disclosure version, reason ai_disclosure_changed, requestId and schemaVersion | accepted event ID, matched emission count bucket, queued invalidation IDs and consumer state | Queue admission 2,000 ms; no synchronous provider retry; dispatcher retries 3 times at 1s, 5s and 25s | Queue circuit opens after 5 send failures for 60 seconds; local disclosure commit remains authoritative and stale work stays pending or dead-lettered for replay |

All external requests and responses are strict typed adapter contracts. Provider or registry payloads are never passed through to callers. Any timeout after a local command commit is reconciled using idempotency binding and event ID before retry.

### Command transaction sequence

1. The Worker validates headers, path, body, acting context, CORS policy and rate quota.
2. A named RPC resolves the contributor and source contribution through BE01 and BE07, then reserves or replays the BE00 idempotency binding.
3. CXR-08D-01 validates the vocabulary and entry schema, locks the contribution aggregate and inserts one active ai_disclosure_version. CXR-08D-02 locks the active row and inserts one successor with supersedes_ref; retract inserts an empty-entry retracted successor.
4. CXR-08D-03 reads one effective destination policy and one authorized disclosure snapshot and returns a pure evaluation result. It never writes credit or disclosure rows.
5. The same mutation transaction appends output_audit_event through BE00 and emits credit.ai-disclosure.changed.v1 for CXR-08D-01 or CXR-08D-02. CXR-08D-03 may append an evaluation audit row in the BE00 audit store but produces no canonical disclosure-change event.
6. Queue dispatch happens after commit. 08a consumes the disclosure-change event and marks matching exports or emissions stale by source version. Event delivery does not change source credit truth.
7. The response serializer reads only the committed version and allowlisted fields. A lost response is recovered by idempotency replay, never by an unguarded second insert.

### State machines and concurrency

| Entity or command | States | Valid transitions and trigger | Concurrency strategy | Blocked transitions |
|---|---|---|---|---|
| ai_disclosure_version | active, superseded, retracted | New CXR-08D-01 row starts active. CXR-08D-02 transitions prior active to superseded and successor to active, or creates retracted successor. | PostgreSQL transaction locks the contribution aggregate; unique active index and expected version CAS; idempotency key deduplicates retries | No update from superseded or retracted; no delete; no worker or adapter transition; only original author may append |
| destination_policy_version | draft, effective, retired | Reviewed registry creates draft, activates one non-overlapping effective version, retires prior version after effective interval | Policy registry RPC uses destination advisory lock, exclusion constraint and expected version | Draft cannot be evaluated; retired cannot be selected; overlapping effective versions are rejected |
| CXR-08D-03 evaluation | pass, warning, block result only | Pure result from named effective policy and authorized snapshot | Snapshot consistency plus expected disclosure versions; idempotency replays exact result | Missing policy never passes; destination block never changes core credit, disclosure or other destinations |
| CXR-08D-04 projection | active entries, not disclosed, unavailable | Active version with entries returns entries; zero entries or retraction returns not disclosed; dependency failure returns unavailable error | Cursor and audience binding; one permission-aware read snapshot | No fallback to empty success on dependency outage; no projection for hidden source |

### Failure recovery

- A vocabulary or policy timeout before commit rolls back the command or returns 503. No disclosure, audit, idempotency result or event is asserted as successful.
- A database disconnect before commit rolls back all writes. A disconnect after commit is reconciled by the same idempotency key and contribution/version query; no second active row can pass the unique index.
- A disclosure-change queue send failure leaves the committed disclosure and audit intact, keeps the outbox undispatched, and retries at 1s, 5s and 25s before a dead-letter state with operator replay. 08a marks stale only after it validates event version.
- If 08a is unavailable, exports remain valid only at their prior snapshot until stale invalidation is reconciled; the disclosure itself remains canonical. The response says staleInvalidationQueued false only when durable outbox insertion failed, which maps to a typed dependency error rather than a false success.
- A stale source or acting context is a 409 conflict and carries safe current-version metadata. The client must reload authorized state and resubmit with a new idempotency key only when the intended change is still valid.
- An erasure request never deletes the audit relationship or reclassifies absence as human origin. It follows BE00 legal hold and retention policy and emits the approved tombstone event.

## Event Schemas

### Payload contract

~~~ts
export const AIDisclosureChangedEvent = z.strictObject({
  eventId: z.uuid(),
  eventType: z.literal("credit.ai-disclosure.changed.v1"),
  schemaVersion: z.literal(1),
  occurredAt: DateTime,
  requestId: z.uuid(),
  correlationId: z.uuid(),
  causationId: z.uuid().nullable(),
  disclosureId: Id,
  contributionId: Id,
  creditId: Id,
  vocabularyVersion: z.string().trim().min(1).max(80),
  state: z.enum(["active", "superseded", "retracted"]),
  version: Version,
  supersedesId: Id.nullable(),
  reasonCode: z.enum(["created", "amended", "retracted"]),
});
~~~

| Event | Producer operation | Consumers | Delivery and payload boundary |
|---|---|---|---|
| credit.ai-disclosure.changed.v1 | CXR-08D-01 created or CXR-08D-02 amended/retracted | 08a stale monitor, authorized provenance-adjacent UI, export/release policy evaluator | At-least-once transactional outbox. Consumers validate event type/version, deduplicate event ID, refetch authorized state and never trust event payload as disclosure content |

The event contains opaque IDs, version and reason code only. It omits entry text, tool/model names, notes, embargoed titles, names, emails, union identifiers, hidden counts, provenance rung, provider data and unrestricted PII. Queue messages carry no client credentials. A duplicate or out-of-order event is acknowledged only after current version comparison and never regresses canonical state.

## Error Handling

### Boundary mapping

| Boundary | HTTP status and code | Safe response details | Recovery |
|---|---|---|---|
| Path, header, JSON or strict schema parse | 400 INVALID_REQUEST | Field JSON pointers and bounded reason codes | Correct request; do not retry unchanged payload |
| Semantically invalid entry, vocabulary, action or policy | 422 VALIDATION_FAILED or RECIPIENT_REQUIREMENT_UNMET | Field, vocabulary version, destination and gap code | Correct fields or destination policy; core credit remains unchanged |
| Missing session or invalid service principal | 401 UNAUTHENTICATED | Empty details or documentation code | Authenticate; no resource existence disclosure |
| Visible resource without capability | 403 FORBIDDEN | Opaque capability reason only | Use the correct contributor, adapter or viewer context; no role override |
| Hidden or absent resource or policy | 404 CONTRIBUTION_NOT_FOUND, DISCLOSURE_NOT_FOUND, CREDIT_NOT_FOUND or CONTRIBUTION_OR_POLICY_NOT_FOUND | Opaque resource kind only | Reload through an authorized context; no enumeration |
| Stale source, disclosure, policy or idempotency hash | 409 VERSION_CONFLICT or IDEMPOTENCY_MISMATCH | Expected/current version or recovery action | Reconcile status; same key and same hash replays |
| Durable route quota | 429 RATE_LIMITED | Retry-After and rate reset values | Wait for reset; repeated probing may receive edge challenge |
| Registry, BE01, BE07, 08a or database unavailable | 503 DEPENDENCY_UNAVAILABLE | Dependency class and retryable boolean | Bounded retry with same idempotency key; never fabricate a pass or empty result |
| Application deadline exceeded | 504 DEADLINE_EXCEEDED | Deadline class and retryable boolean | Reconcile idempotency or event status before retry |
| Unknown exception | 500 INTERNAL_ERROR | Empty details | Keep requestId for support; server logs scrubbed stack at owning boundary |

### Operation error coverage

| Operation ID | 4xx and authorization matrix | 5xx, retryability and partial-state rule |
|---|---|---|
| CXR-08D-01 | 400 INVALID_REQUEST, 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 CONTRIBUTION_NOT_FOUND, 409 VERSION_CONFLICT or IDEMPOTENCY_MISMATCH, 422 VALIDATION_FAILED, 429 RATE_LIMITED. Visible wrong contributor is 403; hidden source is 404. | 503 DEPENDENCY_UNAVAILABLE or 504 DEADLINE_EXCEEDED. Before commit no state exists; after commit same-key replay returns the immutable result and outbox retry owns stale propagation |
| CXR-08D-02 | 400 INVALID_REQUEST, 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 DISCLOSURE_NOT_FOUND, 409 VERSION_CONFLICT or IDEMPOTENCY_MISMATCH, 422 VALIDATION_FAILED, 429 RATE_LIMITED. Visible non-author is 403; hidden chain is 404. | 503 or 504 after bounded BE01, BE07 or queue boundary. Disclosure successor is all-or-nothing; queue ambiguity is reconciled by event ID and never deletes prior history |
| CXR-08D-03 | 400 INVALID_REQUEST, 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 CONTRIBUTION_OR_POLICY_NOT_FOUND, 409 VERSION_CONFLICT or IDEMPOTENCY_MISMATCH, 422 RECIPIENT_REQUIREMENT_UNMET, 429 RATE_LIMITED. Hidden source or policy is 404; visible out-of-scope principal is 403. | 503 PROFILE_UNAVAILABLE or DEPENDENCY_UNAVAILABLE, 504 DEADLINE_EXCEEDED. No policy result is cached as pass during outage; core credit and disclosure are untouched |
| CXR-08D-04 | 400 INVALID_REQUEST, 401 UNAUTHENTICATED when required, 403 FORBIDDEN, 404 CREDIT_NOT_FOUND, 429 RATE_LIMITED. Hidden source is 404; visible viewer denial is 403. | 503 DEPENDENCY_UNAVAILABLE or 504 DEADLINE_EXCEEDED. No empty success fallback; safe stale data may be shown only by a downstream UI label, not fabricated by this API |

Every error row serializes the BE00/global ApiError { code, message, requestId, details } shape. Messages are localized-safe and contain no policy predicate, private entry, provider response, SQL, stack or PII.

## Observability

Every operation creates one structured span and one sanitized completion or failure record with requestId, traceId, stable operation ID, outcome, HTTP status, latencyMs, actor type, purpose class, source version, policy version where applicable and hashed opaque aggregate refs. Logs use the typed @wejammin/observability logger; no ambient console calls, request bodies or disclosure text are emitted. Sentry receives sampled exception fingerprints and circuit state only.

| Operation ID | Audit event and metrics | Safe trace fields and alerts |
|---|---|---|
| CXR-08D-01 | credit.ai-disclosure.changed.v1 with action created; counters for accepted, not-disclosed, validation denied, author denied, vocabulary unavailable and idempotency replay | contribution hash, disclosure hash, vocabulary version, entry count bucket, state and source version. Alert on author-denial spikes, vocabulary circuit open or duplicate active conflicts |
| CXR-08D-02 | credit.ai-disclosure.changed.v1 with action amended or retracted; counters for supersede, retract, stale enqueue, CAS conflict and replay | contribution hash, prior/new version, action, reason code and queue state; never reason text. Alert on outbox age over 60 seconds, repeated CAS conflict or dead-letter growth |
| CXR-08D-03 | credit.ai-disclosure.policy.evaluated audit record; counters for pass, warning, block, missing field, policy unavailable and version conflict | destination hash, policy version, mode, gap severity counts and source version buckets. Alert on policy fallback attempts, effective-policy overlap rejection or block-rate anomaly by destination |
| CXR-08D-04 | credit.ai-disclosure.viewed access audit where required; counters for authorized reads, hidden 404, visible 403, not disclosed, pagination and dependency errors | credit hash, viewer tier, item count bucket, projection version and cursor age; alert on enumeration pattern, timing divergence or unauthorized history probes |

Audit retains actor, acting context, operation, decision, target hash, expected/current version and request hash under BE00 retention. Disclosure entry text, model names, tool names, source titles and private notes are excluded from logs, events and metric labels.

## Testing Strategy

### Contract and route tests

| Operation ID | Required contract, authorization and failure tests |
|---|---|
| CXR-08D-01 | Zod accepts each AIInvolvementKindV1 member, whole and partial scope, optional tool/version/model fields, own-model false default and empty entries; rejects unknown keys, partial without scopeDetail, whole with scopeDetail, links, markup, control characters and bounds over 120 or 280. Test contributor-only authority, wrong visible contributor 403, hidden source 404, stale version 409, same-key replay and same-key different-body mismatch. Assert exact ApiError and credit.ai-disclosure.changed.v1 payload without entries |
| CXR-08D-02 | Test amend requires at least one entry, retract requires empty entries, reason and expected version. Assert original author only, admin/Producer/worker denial, hidden chain 404, moved version 409, append-only history, stale invalidation enqueue and duplicate event deduplication |
| CXR-08D-03 | Validate unique contribution IDs, one expected version per contribution, effective policy state, destination and export/release mode. Test adapter capability, human scope, hidden source/policy 404, visible out-of-scope 403, missing field as destination block, no-policy 503 and no rewrite of canonical rows |
| CXR-08D-04 | Test cursor binding to credit, audience and acting context, default 25 and max 50, active versus history projection, hidden rows excluded before pagination, not disclosed rendering, visible denial 403, hidden source 404 and dependency unavailable not converted to empty success |

### Persistence, concurrency and recovery tests

- Migration tests assert both named tables, every SQL type, nullability, check, unique or exclusion constraint, FK or documented opaque reference, query index, forced RLS policy and grant denial.
- Concurrent CXR-08D-01 requests with the same key and body create one active version and one event; the same key with a changed hash returns 409 and creates no row. Concurrent amendments serialize by contribution lock and one expected version wins.
- A database failure before commit leaves no domain row, idempotency reservation, audit or outbox. A response disconnect after commit replays the stored result. A queue failure preserves outbox state and follows exactly three retries at 1s, 5s and 25s before dead letter.
- Vocabulary, BE01, BE07, policy and 08a adapter tests assert exact request and response contracts, 1,000 or 2,000 ms timeout, retry count and backoff, five-failure 60-second circuit behavior, and fail-closed result.
- Property tests assert no entry schema can produce a human-origin label, no policy result mutates credit or disclosure, hidden rows never affect counts, and superseded versions cannot become active.
- Performance tests target p95 under 300 ms for local protected commands and reads with warm projections; registry or queue work remains bounded by the 15-second request deadline and returns durable state.

### Accessibility and privacy handoff tests

The response supplies factual, plain-text entries and explicit not-disclosed state so the FE can render semantic labels, keyboard-accessible history, non-color state and screen-reader descriptions. No UI may turn absence into a human badge. Contract fixtures include no PII, model prompt, secret, provider payload or private source content.

## Deepening Passes

| Pass | Focus | Evidence and result |
|---:|---|---|
| 1 | Cross-endpoint consistency | Four operations share strict schema version, exact ApiError, source-version semantics and stable IDs. PASS |
| 2 | Sequencing and concurrency | Contribution aggregate locks, unique active index, expected-version CAS and cursor binding prevent duplicate or regressive state. PASS |
| 3 | Failure cascade | BE01, BE07, vocabulary, policy registry, 08a queue and database failures have timeout, retry, circuit and partial-state outcomes. PASS |
| 4 | Authorization completeness | Contributor, original author, adapter, policy evaluator, viewer, admin and worker allow/deny paths have explicit predicates and 403 versus 404. PASS |
| 5 | Observability completeness | Every operation has audit, structured log, span, metrics, safe labels and alert thresholds; disclosure text is excluded. PASS |
| 6 | Rate and abuse controls | Numeric user, party, destination and IP limits, idempotency mismatch counters, cursor binding and enumeration controls are explicit. PASS |
| 7 | Partial-state hygiene | Domain, idempotency, audit and outbox commit atomically; event and stale work reconcile by ID and version; no fallback pass or empty disclosure. PASS |
| 8 | Source contradiction review | IA says disclosure is voluntary, additive and non-inferential; this spec preserves that boundary and does not add detection or human-origin semantics. PASS |
| 9 | Two-implementer simulation | An Hono/PostgreSQL implementer can build routes, schemas, tables, RPCs, adapters and tests without choosing missing values. PASS |
| 10 | Devil's-advocate review | Tested route-literal collision, author spoofing, policy fallback, stale queue, hidden counts, retraction, zero-entry and registry overlap; each has deterministic behavior. PASS |

## Ambiguity Gate

PASS. Micro gate: every CXR-11 through CXR-14 field, enum, bound, error code, status, role, ownership predicate, rate, CORS policy, idempotency rule, external timeout/retry/circuit, persistence constraint, index, RLS grant, state transition and test assertion is explicit. Macro gate: FE and implementation phases can consume four stable operation IDs and exact Zod 4 contracts without inferring an AI threshold, human-origin claim, contributor authority, destination fallback, stale behavior or history policy. The sole canonical IA source is 08-credit-reporting-disclosure.md; no deep-dive file is required. No decision proposal remains.

## Open Questions

None.

## Changelog

| Date | Change | Workflow | Sections affected |
|---|---|---|---|
| 2026-08-28 | Authored the AI disclosure companion from the approved Shard 08 multi-domain split; mapped CXR-11 through CXR-14, typed both persistence models, sealed destination evaluation and non-inference boundaries | /write-be-spec classify and write | All |
| 2026-08-28 | Added strict Zod 4 contracts, exact-origin CORS matrices, contributor-only authorization, append-only versioning, 08a stale invalidation, event payload and deepening evidence | /write-be-spec-write | API, Contracts, Database, Middleware, Data Flow, Events, Errors, Tests |

## Dependency References

### Constrained by

- [BE00 — Cross-cutting platform foundation](00-infrastructure.md)
- [BE01b — Party identity and acting context](01b-party-identity-aliases.md)
- [BE07a — Credit assertions and visibility](07a-credit-assertions-visibility.md)
- [BE08a — Portability and DDEX emission](08a-portability-ddex-emission.md)
- [IA Shard 08 — Credit reporting, exchange and disclosure](../ia/08-credit-reporting-disclosure.md)

### Constrains

- 08a stale monitor consumes credit.ai-disclosure.changed.v1 and marks matching export or emission snapshots stale without changing credit truth.
- Future export or release adapters consume EvaluateDisclosurePolicyResponse; they cannot use a missing disclosure as evidence of human origin or bypass the named policy.


<!-- spec-graph: auto-generated -->
## Related Specs

### Derives from
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]

### References
- [[specs/ia/08-credit-reporting-disclosure|Shard 08 — Credit reporting, exchange and disclosure]]
