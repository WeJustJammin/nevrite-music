# Shard 33 — Show-day execution and recovery

**Status:** Complete
**Surface:** Responsive web/PWA
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 33 owns show-day setlist/file custody, live schedule execution, crew calls/credentials, date-resolved gear manifest, offline day-sheet delivery, advisory safety/weather decision records and private post-show reporting. It executes the frozen production plan from [[specs/ia/32-show-production-planning|Shard 32]], uses resilient/offline primitives from [[specs/ia/00-infrastructure|Shard 00]], routes abuse/evidence escalation to [[specs/ia/06-trust-safety|Shard 06]], and references synchronized performance media from [[specs/ia/17-realtime-sessions|Shard 17]] without becoming a playback engine.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 25 |
| Child capabilities | 17 |
| Canonical show-day truth | Immutable setlist/run-of-show/roster/manifest versions plus append-only live mutations |
| Media boundary | Generic verified show-file package and manifest; no playback engine or vendor session formats at launch |
| Access boundary | Role-derived advisory credentials; physical venue staff remain final enforcement authority |
| Safety boundary | Track requirement, evidence, date validity, acceptance and decision authority; never certify compliance or make weather calls |
| Post-show boundary | Private factual report and source-correction proposals; no public venue review/intelligence surface |
| Launch exclusions | Vendor-specific playback export, RF coordination, insurance brokerage, automatic weather decisions and inbound safety interpretation |

### Architecture Decisions

| Area | Locked decision |
|---|---|
| Setlist | Tour-scoped plan with immutable versions, structural items and uncertainty. Songs use canonical repertoire references where available; local aliases remain unmatched and cannot emit verified work-level outputs. |
| Performed set | Separate from plan, prefilled and counter-attested. Venue may attest occurrence only; personnel/content require qualified production confirmation. |
| Show files | Platform packages generic files in set order with manifest/checksums and one current version per date. Playback software owns execution. |
| Timing | Run-of-show derives from held production facts. Live slippage is one-tap mutation with cascade preview, explicit staleness and cross-day impacts. |
| Fan timing | Internal schedule never creates a direct fan promise. Only downstream authorized publication may expose coarse/current times with its own material-change policy. |
| Crew | Roles, call times and credential areas derive from schedule/venue plan. Local hiring/contract/payment remains on the existing services rail; this shard consumes engagement result only. |
| Credentials | Advisory digital/pass record; venue door controls access. Role changes re-evaluate access and never silently broaden it. |
| Gear manifest | One date-resolved manifest consumed from the frozen production plan; case-level load-out confirmation and custody events, not a duplicate registry. |
| Day sheet | Rendered from current sources, never authored. Offline read is mandatory; missing facts render as explicit gaps. Advance/day sheets share render/version primitives but distinct schemas. |
| Safety | Requirements derive from venue/jurisdiction declarations; artist/production fulfills. Platform tracks present/valid-for-date/accepted, not legal compliance. |
| Weather | Outdoor-capable event records named decision authority, thresholds and contingency. Forecast informs; authorized human decides and reason/evidence persist. |
| Post-show | One co-edited private report per show, prefilled from known variance, bounded edit window and immutable versions. Capability corrections require independent corroboration through Shard 29/06. |

## Features

- **18.06 Setlist & Show Files** — [ideation source](../ideation/18-show-production-touring/18.06-setlist-show-files/18.06-setlist-show-files-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.07 Show Day Schedule & Timing** — [ideation source](../ideation/18-show-production-touring/18.07-show-day-schedule/18.07-show-day-schedule-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.08 Crew, Call Times & Credentials** — [ideation source](../ideation/18-show-production-touring/18.08-crew-credentials/18.08-crew-credentials-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.09 Backline & Gear Manifest** — [ideation source](../ideation/18-show-production-touring/18.09-backline-gear-manifest/18.09-backline-gear-manifest-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.10 Day Sheet Generation & Distribution** — [ideation source](../ideation/18-show-production-touring/18.10-day-sheet.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.16 Show Safety, Permits & Insurance Certificates** — [ideation source](../ideation/18-show-production-touring/18.16-show-safety-permits-insurance.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.17 Weather Monitoring & Contingency** — [ideation source](../ideation/18-show-production-touring/18.17-weather-contingency.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **18.18 Post-Show Report & Notes** — [ideation source](../ideation/18-show-production-touring/18.18-post-show-report.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-33.01 — Version planned setlist:** Given Authorized act/TM; expected version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Version planned setlist, and (6) return Ordered songs/structures/durations and uncertainty snapshot append; if the flow cannot complete, Concurrent same-row/order changes require explicit merge.
- **AC-33.02 — Export stage-ready set:** Given Current version selected, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Export stage-ready set, and (6) return Print-first render and secondary device view issue; if the flow cannot complete, Missing timing/work refs show explicit warnings.
- **AC-33.03 — Package show files:** Given Authorized current files and set order, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Package show files, and (6) return Generic package, manifest, checksums and current-date pointer issue; if the flow cannot complete, Checksum mismatch blocks current designation.
- **AC-33.04 — Capture performed set:** Given Show occurred; prefilled plan available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capture performed set, and (6) return Separate performed order, deltas, personnel and attestations append; if the flow cannot complete, Uncaptured fallback remains plan marked unconfirmed.
- **AC-33.05 — Generate run of show:** Given Frozen plan/bill/calls/constraints available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Generate run of show, and (6) return Owned timeline items and uncertainty derive; if the flow cannot complete, Missing source creates gap, never invented time.
- **AC-33.06 — Apply live slippage:** Given Authorized timeline owner; current version, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply live slippage, and (6) return Cascade preview accepted and affected times version append; if the flow cannot complete, Stale client replays against current timeline.
- **AC-33.07 — Evaluate curfew margin:** Given Venue constraints and duration ranges available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate curfew margin, and (6) return `breach; if the flow cannot complete, tight.
- **AC-33.08 — Build crew roster/calls:** Given Engaged people/roles and schedule available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Build crew roster/calls, and (6) return Per-role call times and conflicts derive; if the flow cannot complete, One person/multiple roles conflict is named.
- **AC-33.09 — Issue credential:** Given Roster role and venue area map current, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Issue credential, and (6) return Advisory access level/pass version issues; if the flow cannot complete, Role/area change invalidates/supersedes prior pass.
- **AC-33.10 — Attach local crew engagement:** Given External services engagement accepted, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Attach local crew engagement, and (6) return Person/role/call/payment reference enters roster; if the flow cannot complete, No duplicate hiring/payment lifecycle.
- **AC-33.11 — Resolve date gear manifest:** Given Frozen plan/rig/rental allocations available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Resolve date gear manifest, and (6) return Per-person/case/date source and custody projection creates; if the flow cannot complete, Unresolved source remains shortfall.
- **AC-33.12 — Confirm load-out:** Given Authorized person; case scope known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Confirm load-out, and (6) return Bulk case present/missing/damaged state and custody event append; if the flow cannot complete, Single allegation never mutates supplier reputation.
- **AC-33.13 — Render/distribute day sheet:** Given Recipient projection/current sources available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Render/distribute day sheet, and (6) return Versioned live link, accessible artifact and offline bundle issue; if the flow cannot complete, Old link announces supersession; gaps remain explicit.
- **AC-33.14 — Record safety requirement/evidence:** Given Event/venue/jurisdiction source and date known, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record safety requirement/evidence, and (6) return Presence, date validity, acceptance and responsible role track; if the flow cannot complete, Platform never emits “compliant”.
- **AC-33.15 — Monitor weather contingency:** Given Outdoor posture and decision chain configured, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Monitor weather contingency, and (6) return Advisory condition updates and threshold alerts reach named authority; if the flow cannot complete, Provider outage marks forecast unknown.
- **AC-33.16 — Record weather/safety decision:** Given Authorized human; decision/reason/evidence supplied, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Record weather/safety decision, and (6) return Proceed/modify/pause/cancel record and notifications append; if the flow cannot complete, System cannot decide or fabricate acceptance.
- **AC-33.17 — File post-show report:** Given Production party; known variance prefill available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) File post-show report, and (6) return Private factual/judgement report version files; if the flow cannot complete, Edit window expiry locks; correction appends new governed path.
- **AC-33.18 — Route venue/gear correction:** Given Qualified report item/evidence available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Route venue/gear correction, and (6) return Shard-29/32 provenance suggestion created; if the flow cannot complete, No single report directly changes source truth.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 33.01 | Version planned setlist | Authorized act/TM; expected version | Ordered songs/structures/durations and uncertainty snapshot append | Concurrent same-row/order changes require explicit merge |
| 33.02 | Export stage-ready set | Current version selected | Print-first render and secondary device view issue | Missing timing/work refs show explicit warnings |
| 33.03 | Package show files | Authorized current files and set order | Generic package, manifest, checksums and current-date pointer issue | Checksum mismatch blocks current designation |
| 33.04 | Capture performed set | Show occurred; prefilled plan available | Separate performed order, deltas, personnel and attestations append | Uncaptured fallback remains plan marked unconfirmed |
| 33.05 | Generate run of show | Frozen plan/bill/calls/constraints available | Owned timeline items and uncertainty derive | Missing source creates gap, never invented time |
| 33.06 | Apply live slippage | Authorized timeline owner; current version | Cascade preview accepted and affected times version append | Stale client replays against current timeline |
| 33.07 | Evaluate curfew margin | Venue constraints and duration ranges available | `breach|tight|clear` range with uncertainty/provenance renders | Unknown/stale constraint returns unknown risk |
| 33.08 | Build crew roster/calls | Engaged people/roles and schedule available | Per-role call times and conflicts derive | One person/multiple roles conflict is named |
| 33.09 | Issue credential | Roster role and venue area map current | Advisory access level/pass version issues | Role/area change invalidates/supersedes prior pass |
| 33.10 | Attach local crew engagement | External services engagement accepted | Person/role/call/payment reference enters roster | No duplicate hiring/payment lifecycle |
| 33.11 | Resolve date gear manifest | Frozen plan/rig/rental allocations available | Per-person/case/date source and custody projection creates | Unresolved source remains shortfall |
| 33.12 | Confirm load-out | Authorized person; case scope known | Bulk case present/missing/damaged state and custody event append | Single allegation never mutates supplier reputation |
| 33.13 | Render/distribute day sheet | Recipient projection/current sources available | Versioned live link, accessible artifact and offline bundle issue | Old link announces supersession; gaps remain explicit |
| 33.14 | Record safety requirement/evidence | Event/venue/jurisdiction source and date known | Presence, date validity, acceptance and responsible role track | Platform never emits “compliant” |
| 33.15 | Monitor weather contingency | Outdoor posture and decision chain configured | Advisory condition updates and threshold alerts reach named authority | Provider outage marks forecast unknown |
| 33.16 | Record weather/safety decision | Authorized human; decision/reason/evidence supplied | Proceed/modify/pause/cancel record and notifications append | System cannot decide or fabricate acceptance |
| 33.17 | File post-show report | Production party; known variance prefill available | Private factual/judgement report version files | Edit window expiry locks; correction appends new governed path |
| 33.18 | Route venue/gear correction | Qualified report item/evidence available | Shard-29/32 provenance suggestion created | No single report directly changes source truth |

## Contracts

| Command | Required input | Output | Explicit errors |
|---|---|---|---|
| `VersionSetlist` | tour/date, parent, rows/order, durations, expected version | setlist version | `ROW_CONFLICT`, `ORDER_CONFLICT`, `WORK_REF_INVALID`, `STALE_VERSION` |
| `PackageShowFiles` | date/setlist version, file refs, checksums, idempotency key | package/manifest | `FILE_UNAVAILABLE`, `CHECKSUM_MISMATCH`, `ORDER_MISMATCH` |
| `CapturePerformedSet` | event, plan version, deltas, personnel, attestations | performed set | `OCCURRENCE_UNATTESTED`, `ATTESTATION_CONFLICT`, `EVENT_INELIGIBLE` |
| `ApplyTimelineMutation` | timeline, changed item, actual/estimate, expected version | successor/cascade | `OWNER_REQUIRED`, `CURFEW_BREACH_UNACKNOWLEDGED`, `STALE_VERSION` |
| `IssueCredential` | event/person/role/areas, source versions | credential | `ROSTER_REQUIRED`, `AREA_FORBIDDEN`, `ROLE_STALE` |
| `ConfirmManifestCase` | event/case/items, state, evidence, expected version | custody/load-out event | `CASE_SCOPE_INVALID`, `CUSTODY_CONFLICT`, `STALE_VERSION` |
| `RenderDaySheet` | event/version, recipient role, offline posture | artifact/link/bundle | `PROJECTION_FORBIDDEN`, `SOURCE_VERSION_MISSING` |
| `RecordSafetyDecision` | requirement/contingency, authority, decision, reason, evidence | decision record | `DECIDER_UNAUTHORIZED`, `REASON_REQUIRED`, `EVIDENCE_POLICY_FAILED` |
| `FilePostShowReport` | event, report version, factual/judgement items | report version | `EDIT_WINDOW_CLOSED`, `SOURCE_FORBIDDEN`, `STALE_VERSION` |

- Show-day commands require stable idempotency keys; same key/different payload fails.
- Shard 32 remains authoritative for frozen rider/plot/advance facts; show-day mutations append operational versions.
- Safety/insurance records are declarations/evidence and never platform certification or brokerage.
- External service, ticket, venue and gear systems remain authoritative for their own contracts; this shard stores references/projections.

## Data Models

| Aggregate | Key invariants |
|---|---|
| `SetlistVersion` | Tour/date, ordered song/structure rows, duration ranges, work/local refs and immutable parent |
| `ShowFilePackage` | Date/setlist version, ordered files, hashes, manifest and current/superseded state |
| `PerformedSet` | Event/plan refs, actual rows/personnel, occurrence/content attestations and capture times |
| `RunOfShow` | Derived owned timeline, constraints, duration uncertainty and append-only live mutations |
| `CrewAssignment` | Person, roles, source engagement, per-role calls and credential posture |
| `Credential` | Role/area-derived access, venue/event/version, expiry and advisory state |
| `DateGearManifest` | Frozen plan/rig/rental refs, person/case grouping, source/custody and load-out state |
| `DaySheetVersion` | Source snapshot, recipient projection, render hash, live link, offline bundle and supersession |
| `SafetyRequirement` | Source/jurisdiction/venue, requirement class, due/show validity and responsible party |
| `SafetyEvidence` | Requirement, document/declaration ref, date validity, submitter and human acceptance |
| `ContingencyPlan` | Event/weather/hazard thresholds, actions, named decider, contacts and effective version |
| `OperationalDecision` | Trigger, authority, proceed/modify/pause/cancel, reason/evidence and notification state |
| `PostShowReport` | Event, co-editors, known variance, factual/judgement items, edit window and versions |

- Performed set never overwrites planned set.
- Timeline mutation records old/new values, uncertainty and cascade; client clock never determines order.
- Credentials do not grant physical access outside venue enforcement.
- Safety evidence validity is evaluated against show date.
- All thresholds, bands, edit windows, staleness and alert cadences use versioned settings.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Key invariants.
- **`SetlistVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Tour/date, ordered song/structure rows, duration ranges, work/local refs and immutable parent.
- **`ShowFilePackage`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Date/setlist version, ordered files, hashes, manifest and current/superseded state.
- **`PerformedSet`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event/plan refs, actual rows/personnel, occurrence/content attestations and capture times.
- **`RunOfShow`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Derived owned timeline, constraints, duration uncertainty and append-only live mutations.
- **`CrewAssignment`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Person, roles, source engagement, per-role calls and credential posture.
- **`Credential`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Role/area-derived access, venue/event/version, expiry and advisory state.
- **`DateGearManifest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Frozen plan/rig/rental refs, person/case grouping, source/custody and load-out state.
- **`DaySheetVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source snapshot, recipient projection, render hash, live link, offline bundle and supersession.
- **`SafetyRequirement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source/jurisdiction/venue, requirement class, due/show validity and responsible party.
- **`SafetyEvidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Requirement, document/declaration ref, date validity, submitter and human acceptance.
- **`ContingencyPlan`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event/weather/hazard thresholds, actions, named decider, contacts and effective version.
- **`OperationalDecision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Trigger, authority, proceed/modify/pause/cancel, reason/evidence and notification state.
- **`PostShowReport`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Event, co-editors, known variance, factual/judgement items, edit window and versions.

## Access Control

| Actor | Allowed | Denied |
|---|---|---|
| Act/TM | Setlist/files, own crew, manifest, timeline items, performed-set content | Venue-only safety acceptance, other acts' private files |
| Show/production manager | Shared timeline, bill calls, pooled credentials, day sheet and decisions | Act-private setlist/show files unless shared |
| Venue staff | Assigned timeline/credentials/safety acceptance and occurrence attestation | Setlist content, act personnel claims or private post-show notes |
| Crew member | Own calls/credential/offline day-sheet projection and acknowledgments | Full roster/private contacts beyond operational need |
| Named safety/weather decider | Decision and reason/evidence within event scope | Platform-wide compliance determination |
| Moderator/adjudicator | Escalated loss/damage/safety/report evidence | Make weather call, alter performed content or issue pass |
| System worker | Derive/render/check/alert/retry | Decide safety, infer legal compliance or publish private report |

- Contact, credential, show-file and safety projections use least privilege and expire after operational need under approved retention.
- Off-platform recipients use scoped expiring capabilities and cannot browse event data.
- Same-human multi-role conflicts and self-attestation are disclosed.

### Access Escalation

- **Act/TM:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Show/production manager:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Venue staff:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Crew member:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Named safety/weather decider:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator/adjudicator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Print-first setlist/day sheet also provide accessible HTML with headings, tables, text gaps and high-contrast print CSS.
- Offline bundle supports keyboard, screen readers and 200% zoom without network.
- Live timing update is one-tap/one-control but offers confirmation, cascade summary and undo-by-successor.
- Timeline has chronological list alternative; curfew bands include minute ranges and uncertainty text.
- Credentials/area maps have textual area lists and non-QR lookup fallback.
- Safety/weather alerts identify source, time, threshold, named decider and required action without color/sound alone.
- Post-show report distinguishes facts, assertions and judgement in labels.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `showday.setlist.versioned` | setlist/version, date/tour, duration range | timing, package |
| `showday.performed_set.recorded` | event/plan, actual rows, attestation states | credits/reporting |
| `showday.timeline.changed` | timeline/version, mutation, cascade, curfew margin | crew, day sheet, downstream |
| `showday.credential.changed` | event/person/role/areas, state | door projection, audit |
| `showday.manifest.case_changed` | event/case, state, custody/evidence refs | gear provenance, report |
| `showday.day_sheet.versioned` | event/version, projection/artifact/offline refs | recipients |
| `showday.safety.evidence_changed` | requirement/evidence, date-validity/acceptance | responsible parties |
| `showday.operational_decision.recorded` | event/trigger/decider, decision, reason refs | all operational parties |
| `showday.post_report.versioned` | event/report, changed item refs, lock time | correction workflows |

Events carry references, not private contacts, files, certificates or report narratives. Consumers dedupe and order by aggregate version.

## Edge Cases

| Scenario | Required behavior |
|---|---|
| Concurrent setlist row/order edits | Merge independent rows; conflicting row/order creates explicit sibling resolution |
| File package corrupted after download | Checksum identifies failure; prior verified package remains available |
| Offline performed-set capture syncs late | Preserve device and server times; content still needs counter-attestation |
| Live slippage crosses curfew | Show cascade/margin and require responsible acknowledgment; no silent truncate |
| One person has overlapping calls | Name roles/items and require manager resolution |
| Pass screenshot reused | Door can lookup current credential state; superseded/revoked pass fails |
| Load-out case missing | Record case-level incident/custody; no automatic blame/reputation mutation |
| Day-sheet source changes offline | Bundle shows captured-at/version; reconnect announces successor |
| Certificate valid at upload but expired at show | Mark invalid-for-date, never compliant |
| Weather provider unavailable | Forecast unknown; contingency/authority remains and human records decision |
| Safety decision made by phone/off-platform | Authorized actor records attributed transcription/evidence after fact |
| Single adverse venue report | Private evidence routes suggestion; source listing unchanged pending corroboration |
| Scheduled outage on show day | Offline sheets/manifests remain readable; queued writes preserve local time and reconcile by server version |

## Surface Applicability

Responsive web/PWA is the sole launch surface. Offline read of current day sheet, setlist, calls, credentials lookup data and manifest is mandatory; offline writes queue as drafts and require server reconciliation. Normal-web reads target p95 ≤2 seconds; show-day read paths operate continuously except scheduled outages and remain available from last verified bundle.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 33.01 Version planned setlist | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.02 Export stage-ready set | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.03 Package show files | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.04 Capture performed set | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.05 Generate run of show | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.06 Apply live slippage | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.07 Evaluate curfew margin | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.08 Build crew roster/calls | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.09 Issue credential | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.10 Attach local crew engagement | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.11 Resolve date gear manifest | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.12 Confirm load-out | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.13 Render/distribute day sheet | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.14 Record safety requirement/evidence | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.15 Monitor weather contingency | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.16 Record weather/safety decision | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.17 File post-show report | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 33.18 Route venue/gear correction | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [[specs/ia/00-infrastructure|Shard 00]], [[specs/ia/06-trust-safety|Shard 06]], [[specs/ia/17-realtime-sessions|Shard 17]], [[specs/ia/32-show-production-planning|Shard 32]]
- **Depended on by:** [[specs/ia/34-event-ticketing|Shard 34]], [[specs/ia/36-live-reporting|Shard 36]]


### Cross-Shard Section Contract Map

- **Shard 00:** consume [Shard 00 Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 17:** consume [Shard 17 Contracts](17-realtime-sessions.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 17 Event Schemas](17-realtime-sessions.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 32:** consume [Shard 32 Contracts](32-show-production-planning.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 32 Event Schemas](32-show-production-planning.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 34:** consume [Shard 34 Contracts](34-event-ticketing.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 34 Event Schemas](34-event-ticketing.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.
- **Shard 36:** consume [Shard 36 Contracts](36-live-reporting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 36 Event Schemas](36-live-reporting.md#event-schemas). Canonical ownership stays with the producer; typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | `/decompose-architecture-structure` | All |
| 2026-08-03 | Authored and deepened complete IA contract | `/write-architecture-spec` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
- [[specs/ia/17-realtime-sessions|Shard 17 — Real-time jamming and remote sessions]]
