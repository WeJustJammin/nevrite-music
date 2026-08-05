# Shard 08 — Credit reporting, exchange and disclosure

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Document Type**: Feature domain
> **Status**: Complete — design and deepening approved under standing owner autonomy

## Overview

Shard 08 converts authorized Shard 07 contribution records into purpose-specific reports, portable files, DDEX RIN packages, gear-credit disclosures and structured AI-involvement statements. It never changes credit truth, provenance rung, rights, ownership, split, payment or union status. Every output is a versioned snapshot with explicit omissions, validation gaps, source versions and stale detection.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 4 |
| Source documents loaded | 4 |
| Child capabilities reconciled | 4 |
| Added or removed feature boundaries | 0 |
| Union reporting | Deferred; data capture remains reusable, but no filing/submission claim ships without approved US institutional/legal contract |
| Gear publication | Owner-selected opt-in; inherited credit confidentiality is a hard ceiling |
| AI disclosure | Voluntary platform capture; recipient-specific export/release requirements may block that destination, never ordinary credit capture |
| Split handling | Medium complexity; no deep-dive file required |

## Features

- **02.07 Union & Performer Session Reporting** — future US AFM/SAG-AFTRA-oriented report assembly from immutable session/credit facts, with human certification and no inferred membership.
- **02.08 Credit Export & DDEX RIN Emission** — frictionless complete portability, validation-aware RIN generation, embargo-safe scope, loss declarations, immutable emission snapshots and stale/re-emit workflow.
- **02.09 Gear ↔ Credit Linkage** — optional contribution-granular equipment references derived as a byproduct, inherited confidentiality and item-following discography.
- **02.10 AI Contribution Disclosure** — self-authored, versioned, structured AI-involvement entries as an orthogonal contribution axis with no platform detection or threshold.

### Delivery Phases

| Phase | Enabled boundary |
|---|---|
| Consumer launch | Complete own-credit portability export; structured AI disclosure capture/export; internal validation and stale-emission records |
| Later domain activation | DDEX RIN emission after identifier/taxonomy/recipient adapter gates; gear linkage after Shard 23 item identity; union report assembly after approved US forms |
| Explicitly disabled | Automated union submission, AI detection, platform-defined AI threshold, gear prompts in session capture and any output that leaks embargoed/confidential credits |

## Acceptance Criteria

- **AC-CXR-01 — Export own credit history:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authenticated party selects authorized scope and machine-readable/human-readable formats; every visible own credit is included regardless of tier, and (6) return Immutable export snapshot plus manifest/hash generated; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-02 — Preflight RIN package:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generator validates party/work/recording identifiers, role mapping, credit tier, embargo, recipient profile and disclosure requirements without mutating source, and (6) return Gap list groups blocking, warning and lossy conditions; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-03 — Generate RIN package:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User confirms exact snapshot and explicit low-tier overrides; only authorized, non-confidential records emit, and (6) return Package, validation report and source-version manifest sealed; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-04 — Review stale emission:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Amendment/retraction makes matching emission stale; exporter sees changed credits and may create a new package, and (6) return New emission supersedes internally; external acceptance remains recipient-owned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-05 — Generate portability receipt:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User receives format/version, scope, omissions, degradation notes, checksums and generated-at metadata, and (6) return Receipt remains downloadable with export audit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-06 — Prepare union session report:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Eligible user maps captured facts to an approved US form profile, fills missing declarations and reviews every derived value, and (6) return Draft report only until feature/institution gate enabled; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-07 — Certify union report:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Human signer confirms membership, jurisdiction, rates/fields and consequence disclosure; platform never certifies correctness, and (6) return Signed report version and evidence retained; no silent submission; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-08 — Link gear to contribution:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Credited party/authorized Producer selects registered item or saved chain after contribution exists; no session-close prompt, and (6) return Optional link records source, author and inherited visibility; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-09 — Publish gear discography line:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Item owner chooses opt-in public display; projection includes only links whose source credit is public and still visible, and (6) return Viewer-safe item projection generated; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-10 — Transfer registered gear:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Ownership changes in Shard 23; credit links remain with item while prior owner's private session access does not transfer, and (6) return New owner sees public/authorized item history only; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-11 — Add AI involvement entry:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contributor describes only own contribution using versioned kind/scope/tool/model fields; no threshold question or binary “AI” label, and (6) return Immutable disclosure version linked to contribution; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-12 — Amend/retract AI disclosure:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Contributor supersedes own entry with reason; history remains and affected exports become stale, and (6) return New active version and audit event committed; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-13 — Evaluate destination requirement:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Export/release adapter applies named recipient policy to structured disclosure; missing data is a gap, never proof of human origin, and (6) return Destination-specific pass/block/warning with policy version; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CXR-14 — View disclosure:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized viewer sees factual entries and source; provenance rung remains separate and never warrants human-only performance, and (6) return Accessible disclosure projection rendered; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| CXR-01 | Export own credit history | Authenticated party selects authorized scope and machine-readable/human-readable formats; every visible own credit is included regardless of tier. | Immutable export snapshot plus manifest/hash generated. |
| CXR-02 | Preflight RIN package | Generator validates party/work/recording identifiers, role mapping, credit tier, embargo, recipient profile and disclosure requirements without mutating source. | Gap list groups blocking, warning and lossy conditions. |
| CXR-03 | Generate RIN package | User confirms exact snapshot and explicit low-tier overrides; only authorized, non-confidential records emit. | Package, validation report and source-version manifest sealed. |
| CXR-04 | Review stale emission | Amendment/retraction makes matching emission stale; exporter sees changed credits and may create a new package. | New emission supersedes internally; external acceptance remains recipient-owned. |
| CXR-05 | Generate portability receipt | User receives format/version, scope, omissions, degradation notes, checksums and generated-at metadata. | Receipt remains downloadable with export audit. |
| CXR-06 | Prepare union session report | Eligible user maps captured facts to an approved US form profile, fills missing declarations and reviews every derived value. | Draft report only until feature/institution gate enabled. |
| CXR-07 | Certify union report | Human signer confirms membership, jurisdiction, rates/fields and consequence disclosure; platform never certifies correctness. | Signed report version and evidence retained; no silent submission. |
| CXR-08 | Link gear to contribution | Credited party/authorized Producer selects registered item or saved chain after contribution exists; no session-close prompt. | Optional link records source, author and inherited visibility. |
| CXR-09 | Publish gear discography line | Item owner chooses opt-in public display; projection includes only links whose source credit is public and still visible. | Viewer-safe item projection generated. |
| CXR-10 | Transfer registered gear | Ownership changes in Shard 23; credit links remain with item while prior owner's private session access does not transfer. | New owner sees public/authorized item history only. |
| CXR-11 | Add AI involvement entry | Contributor describes only own contribution using versioned kind/scope/tool/model fields; no threshold question or binary “AI” label. | Immutable disclosure version linked to contribution. |
| CXR-12 | Amend/retract AI disclosure | Contributor supersedes own entry with reason; history remains and affected exports become stale. | New active version and audit event committed. |
| CXR-13 | Evaluate destination requirement | Export/release adapter applies named recipient policy to structured disclosure; missing data is a gap, never proof of human origin. | Destination-specific pass/block/warning with policy version. |
| CXR-14 | View disclosure | Authorized viewer sees factual entries and source; provenance rung remains separate and never warrants human-only performance. | Accessible disclosure projection rendered. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id?`, `acting_context_version`, `idempotency_key`, `expected_version?`, `request_id` and exact source snapshot version.
- Output generation reads authorized Shard 07 projections, never direct unrestricted graph tables.
- Every generated artifact declares schema/profile version, source versions, omissions, validation outcome, degradation and checksum.
- Confidentiality is applied before selection, counts and artifact assembly. A missing hidden credit is not listed as omitted.
- Output status distinguishes `draft`, `validated`, `generated`, `emitted`, `stale`, `superseded` and `failed`; file creation is not external acceptance.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `OutputKind` | `portability_json | portability_csv | portability_pdf | ddex_rin | union_report | gear_discography | disclosure_projection` |
| `ArtifactState` | `draft | validating | blocked | generated | emitted | stale | superseded | failed` |
| `GapSeverity` | `blocking | warning | lossy` |
| `AIInvolvementKindV1` | `generation | assistance | modelling | separation | correction`; open/additive only through new vocabulary version |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, SOURCE_STALE, EMBARGOED_NOT_FOUND, PROFILE_UNAVAILABLE, RECIPIENT_REQUIREMENT_UNMET, ARTIFACT_GENERATION_FAILED` |

### Export and Emission

| Contract | Invariant |
|---|---|
| `CreatePortabilityExport` | Includes all credits visible to requesting party, including imported/self-asserted/contested and embargoed own credits, with their actual states; never a support-gated path. |
| `PreflightRIN` | Uses exact DDEX/profile version; unresolved identifiers/roles and confidentiality are blocking; representational loss is explicit. |
| `GenerateRIN` | Low-tier credits excluded by default and listed as gaps; explicit per-credit override allowed with warning and audit. Provenance rung may be included as extension/receipt but DDEX loss remains declared. |
| `RecordEmission` | Snapshots recipient, timestamp, schema/profile, credit IDs and per-credit versions, package hash and delivery evidence. |
| `MarkEmissionStale` | Credit amendment, retraction or disclosure change stales matching active emissions; score-only collusion demotion does not. |
| `ReemitArtifact` | Creates a new immutable artifact linked to prior emission. It cannot claim recipient supersession unless adapter returns evidence. |

### Union, Gear and AI Disclosure

| Contract | Invariant |
|---|---|
| `BuildUnionReport` | US form profile maps session/performer facts only; union membership, rates, classifications and declarations require human input/confirmation. |
| `CertifyUnionReport` | Exact rendered artifact, signer authority, source versions and consequence disclosure are signed. Automated submission remains disabled until provider/legal gate. |
| `LinkGearCredit` | Link targets one contribution credit and one Shard 23 item/version; session-level link forbidden. Author and source method required. |
| `ProjectGearDiscography` | Public only when item owner opted in and source credit is public; confidentiality changes purge projection. Link follows item, not prior owner. |
| `RecordAIDisclosure` | Actor may disclose own contribution only. Zero or more structured entries; absence means “not disclosed,” never “human.” |
| `EvaluateDisclosurePolicy` | Applies named external policy/version without rewriting disclosure or credit; destination may block while core credit remains valid. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `output_request` | Kind, requester/context, purpose, source scope/hash, profile/version, state, idempotency, version. |
| `output_gap` | Request, source object/version, code, severity, safe message, remediation route; hidden records never represented. |
| `generated_artifact` | Request, storage locator, media type, schema/profile, checksum, manifest hash, generated-at, retention, state. |
| `artifact_credit_snapshot` | Artifact, credit ID/version, disclosure version?, inclusion/override reason; unique pair. |
| `emission_record` | Artifact, recipient/profile, emitted-at, delivery state/evidence, stale-at/reasons, supersedes/superseded-by. |
| `union_form_profile` | US organization/form/version, field mappings, required declarations, effective interval, approval/gate state. |
| `union_report` | Session, profile, performer mappings, signer/authority, artifact, certification and submission state. |
| `gear_credit_link` | Credit/contribution, item/version, author, source method, visibility opt-in, state, version. |
| `gear_discography_projection` | Item, public credit references, projection version/hash and purge state; derived only. |
| `ai_disclosure_version` | Contribution, author, vocabulary version, entries JSON, reason, state, supersedes, created-at, version. |
| `destination_policy_version` | Destination, disclosure/identifier/tier requirements, effective interval and source evidence. |
| `output_audit_event` | Actor/context/action/artifact/source/recipient/before-after/request hashes; immutable. |

### AI Disclosure Entry V1

| Field | Constraint |
|---|---|
| `kind` | One of V1 kinds; new kind requires new vocabulary version |
| `scope` | Bounded contribution-local description such as full, section, element or process |
| `tool_name` / `tool_version?` | Plain text, length-limited, no links/markup |
| `model_name?` | Optional factual identifier supplied by contributor |
| `subject_is_own_model?` | Optional boolean only where modelling applies |
| `note?` | Optional bounded plain text; not used for policy evaluation |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`output_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Kind, requester/context, purpose, source scope/hash, profile/version, state, idempotency, version..
- **`output_gap`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Request, source object/version, code, severity, safe message, remediation route; hidden records never represented..
- **`generated_artifact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Request, storage locator, media type, schema/profile, checksum, manifest hash, generated-at, retention, state..
- **`artifact_credit_snapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Artifact, credit ID/version, disclosure version?, inclusion/override reason; unique pair..
- **`emission_record`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Artifact, recipient/profile, emitted-at, delivery state/evidence, stale-at/reasons, supersedes/superseded-by..
- **`union_form_profile`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: US organization/form/version, field mappings, required declarations, effective interval, approval/gate state..
- **`union_report`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Session, profile, performer mappings, signer/authority, artifact, certification and submission state..
- **`gear_credit_link`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Credit/contribution, item/version, author, source method, visibility opt-in, state, version..
- **`gear_discography_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Item, public credit references, projection version/hash and purge state; derived only..
- **`ai_disclosure_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Contribution, author, vocabulary version, entries JSON, reason, state, supersedes, created-at, version..
- **`destination_policy_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Destination, disclosure/identifier/tier requirements, effective interval and source evidence..
- **`output_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Actor/context/action/artifact/source/recipient/before-after/request hashes; immutable..
- **`Field`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Constraint.
- **`kind`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: One of V1 kinds; new kind requires new vocabulary version.
- **`scope`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Bounded contribution-local description such as full, section, element or process.
- **`tool_name`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Plain text, length-limited, no links/markup.
- **`tool_version?`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Plain text, length-limited, no links/markup.
- **`model_name?`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Optional factual identifier supplied by contributor.
- **`subject_is_own_model?`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Optional boolean only where modelling applies.
- **`note?`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Optional bounded plain text; not used for policy evaluation.

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Credited party | Complete own export, own AI disclosure, authorized RIN scope and own gear links | Export another party's hidden records or disclose AI for another contributor |
| Producer/session owner | Authorized session/work export, draft union report, contribution gear links where mandate allows | Invent membership, attest another person's AI use or bypass confidentiality |
| Operator/room | Approved room/session facts for report draft and registered room gear links | Certify performer status/contribution or publish participant secrets |
| Item owner | Opt in item discography and view authorized item history | Receive prior owner's private session access or edit historical credit |
| Recipient adapter | Receive exact generated package through scoped delivery | Query graph, request broader scope or mutate canonical data |
| Reporting admin | Manage approved profiles/policies and inspect safe failures | Edit source credits, silently patch artifacts or enable unapproved union submission |
| System worker | Validate, generate, mark stale, purge projections and deliver idempotently | Infer union status, AI use, rights, ownership or external acceptance |

### Access Escalation

- **Credited party:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Producer/session owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Operator/room:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Item owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Recipient adapter:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Reporting admin:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Export/report preflight groups blocking, warning and lossy gaps with semantic headings, counts and direct remediation links.
- Generated-artifact progress and stale status are announced without relying on color; retry does not lose selected scope.
- Tables support keyboard sorting/filtering and linear mobile alternatives; artifact manifests remain readable at 200% zoom.
- AI disclosure language states “not disclosed” rather than implying human origin and keeps provenance evidence visibly separate.
- Gear opt-in consequences and union certification statements appear before commitment, are screen-reader labeled and require explicit unchecked confirmation.
- Download controls expose format, size, checksum availability and expiration; failures provide a persistent accessible retry route.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `credit.output.generated.v1` | Request/artifact/kind/profile/source hash/checksum/state | Download projector, audit, delivery adapter |
| `credit.output.emitted.v1` | Emission/artifact/recipient/profile/delivery evidence | Stale monitor, receipt projector |
| `credit.output.stale.v1` | Emission/changed credit versions/reasons/detected-at | Exporter task/notification |
| `credit.union-report.changed.v1` | Report/session/profile/state/artifact/version | Authorized reporting workspace only |
| `credit.gear-link.changed.v1` | Link/credit/item/state/visibility/version | Shard 23 projection and purge worker |
| `credit.ai-disclosure.changed.v1` | Disclosure/contribution/vocabulary/state/version | Provenance-adjacent UI, export/release policy evaluators |

Events omit embargoed identities/titles, hidden counts, union identifiers, artifact contents, AI notes and unrestricted PII. Consumers fetch authorized projections by opaque ID.

## Edge Cases

| Case | Required result |
|---|---|
| Source credit changes during generation | Expected snapshot fails with `SOURCE_STALE`; no mixed-version artifact emitted. |
| Portability contains embargoed own credit | Include with actual confidentiality state for owner; artifact remains private and non-share-default. |
| RIN cannot represent provenance | Emit explicit loss declaration/receipt; never flatten silently or invent recipient understanding. |
| Low-tier override selected | Per-credit warning and audit; no bulk “include all low confidence” shortcut. |
| Recipient rejects re-emission | New artifact remains generated/emitted-attempted; prior external copy not claimed superseded. |
| Union profile/rate changed | Existing report immutable; new draft/profile required before certification. |
| Union adapter unavailable | Downloadable certified artifact may exist; no “submitted” status without evidence. |
| Gear changes owner | Link remains item history; previous owner's private source context stays hidden. |
| Credit becomes embargoed | Gear/public output purge within Shard 07 restrictive visibility SLA; stale artifacts flagged where tracked. |
| AI disclosure absent | Render “not disclosed”; no human-origin badge, export claim or detection attempt. |
| AI disclosure amended | Prior output stale; historical disclosure remains in audit, new version drives projections. |
| Destination requires unknown AI field | Destination preflight blocks/warns per policy; core credit and portability export remain available. |
| Artifact worker fails after storage write | Unreferenced blob quarantined/cleaned; canonical state remains failed until idempotent retry seals manifest. |

## Surface Applicability

Responsive web/PWA only. Human-readable reports and receipts are server-renderable; machine artifacts download through short-lived authorized URLs. No enterprise SSO or native client dependency.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| CXR-01 Export own credit history | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-02 Preflight RIN package | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-03 Generate RIN package | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-04 Review stale emission | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-05 Generate portability receipt | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-06 Prepare union session report | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-07 Certify union report | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-08 Link gear to contribution | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-09 Publish gear discography line | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-10 Transfer registered gear | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-11 Add AI involvement entry | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-12 Amend/retract AI disclosure | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-13 Evaluate destination requirement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CXR-14 View disclosure | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for request/error/storage/queue/audit contracts; [Shard 01](01-identity-authority.md) for parties, authority and identifiers; [Shard 07](07-credits-core.md) for credit/session/provenance/taxonomy/visibility truth.
- **Adjacent consumers:** Shard 22 may own release-recipient delivery metadata, and Shard 23 owns registered gear identity/ownership. Shard 08 owns only output snapshots, disclosure and linkage.
- **Depended on by:** None in the current decomposition; future adapters consume versioned artifacts/events, never internal tables.

## Deep Dives Needed

- None. Medium-complexity workflows converge within this shard.

### Cross-Shard Section Contract Map

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 07 — Credit graph, capture and confidence:** consume [Shard 07 — Credit graph, capture and confidence Contracts](07-credits-core.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 07 — Credit graph, capture and confidence Event Schemas](07-credits-core.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 22 — Release and distribution:** consume [Shard 22 — Release and distribution Contracts](22-release-distribution.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 22 — Release and distribution Event Schemas](22-release-distribution.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 23 — Gear provenance registry:** consume [Shard 23 — Gear provenance registry Contracts](23-gear-provenance-registry.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 23 — Gear provenance registry Event Schemas](23-gear-provenance-registry.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Locked reporting, portability, RIN, gear and AI-disclosure contracts under standing autonomy | /write-architecture-spec | All |

## Dependency References

- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear provenance registry]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/07-credits-core|Shard 07 — Credit graph, capture and confidence]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/23-gear-provenance-registry|Shard 23 — Gear identity, provenance and recovery]]
