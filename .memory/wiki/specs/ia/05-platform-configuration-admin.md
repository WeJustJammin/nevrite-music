# Shard 05 — Platform configuration, admin and quality

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/05-platform-configuration-admin.md](deep-dives/05-platform-configuration-admin.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 05 is the governed operating surface for product variables and platform administration. It owns contract-defined settings and effective-value resolution, risk-controlled changes, release flags/experiments/kill switches, admin task/search/bulk/capability/audit/diagnostic surfaces, CMS portability, accessibility/content-quality gates, and retention/hold/erasure orchestration. It does not turn secrets, authorization, money, rights, legal floors, evidence, migrations, or transactional state machines into ordinary settings.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 3 |
| Child capabilities reconciled | 14 |
| Source documents loaded | 20 |
| Added or removed feature boundaries | 0 |
| Enterprise admin features | Deferred; no SSO/SCIM/directory/policy-console dependency |
| Split handling | Parent IA plus one approved deep dive |

## Features

- **25.07 Settings, Flags & Configuration Governance** — definition registry, allowed scopes/inheritance/effective values, version/approval/rollback, release flags, experiments, kill switches, and strict secrets/runtime/invariant boundary.
- **25.08 Admin Workspace & Operations** — truthful task inbox, capability-filtered search, dry-run bulk commands, scoped/temporary admin grants with step-up, linked content/security audit, notifications, and site-health/config diagnostics.
- **25.10 Portability, Governance & Quality** — mapped/quarantined/dry-run imports, scoped exports and verified restore, accessibility/content-quality release gates, and retention/legal-hold/erasure workflows.

## Acceptance Criteria

- **AC-CFG-01 — Register setting definition:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Code/contract release declares immutable key, owner, type, meaning, sensitivity, allowed scopes, resolution, default source, validation, risk, audit and deprecation, and (6) return Definition artifact/version is deployed and synchronized; admin cannot mint arbitrary keys; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-02 — Resolve effective value:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Load definition then eligible active value versions in its explicit precedence, validating subject/scope/time/cohort and provenance, and (6) return Typed value plus source scope/version/default and evaluation time; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-03 — Propose setting change:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized actor selects permitted scope, enters typed value, sees effective-value/consumer impact, validation and rollback candidate, and (6) return Draft change version; no effect; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-04 — Approve/schedule/activate/rollback:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Freeze value/impact hash, collect risk-required distinct approvals and step-up, preflight at activation, atomically activate and emit outbox. Rollback creates a new version, and (6) return Consumers converge by version; history remains; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-05 — Manage release flag:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Define owner, purpose, environments, cohorts, fallback, dependencies and expiry; evaluate after auth but never as auth/business rule, and (6) return Versioned release state with automatic stale-owner/expiry task; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-06 — Run experiment:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Require hypothesis, eligible non-protected cohort dimensions, consent/analytics contract, allocation, metrics, stop condition and end date, and (6) return Deterministic assignment; experiment cannot alter safety/legal/rights/money/eligibility floors; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-07 — Activate kill switch:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Named incident-capable actor step-ups, selects predeclared switch/scope/fallback/reason, and confirms impact; independent runtime snapshot path applies, and (6) return Immediate bounded safe fallback plus immutable incident/security audit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-08 — Work admin inbox:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Query assigned approvals, failed jobs, schedules, expiring rights/credentials/flags, holds, diagnostics and incidents under current capabilities, and (6) return Counts/items include freshness/partial/unknown; missing card never means no work; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-09 — Search/filter control plane:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Search allowlisted metadata/projections across content/media/navigation/settings/jobs/audit-safe refs; results enforce per-item capability, and (6) return Bounded cursor result; no body/evidence leakage through snippets/counts; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-10 — Preview/run bulk action:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Filter candidates, freeze exact target IDs/versions and command, dry-run eligibility/effects, approve, then process idempotent bounded job, and (6) return Per-target success/failure/retry evidence; no arbitrary database editing; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-11 — Grant/revoke admin capability:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capable administrator grants named scope/actions/term with least privilege; protected/elevated grant requires MFA, reason, distinct approval and notifications, and (6) return Grant becomes current or immediately revoked; sessions/actions recheck; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-12 — Inspect audit/diagnostics:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Read linked editable-history and immutable security/financial audit through minimal projections; run registered diagnostics with freshness/evidence, and (6) return Unknown/stale stays unknown; diagnostic never becomes second truth or auto high-risk repair; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-13 — Import/export/restore:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorize scope, upload privately, map versions/fields/relations/media, dry-run and quarantine; export allowlisted manifest; restore into isolated target and verify, and (6) return Import commits via idempotent batches; export expires; restore proof records integrity; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-CFG-14 — Run quality/retention action:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Execute registered accessibility/content checks; preflight publish; request archive/delete/anonymize/hold/erasure; calculate cross-store manifest and conflicts, and (6) return Eligible action converges with evidence; legal/record conflicts route review and never silently erase obligations; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| CFG-01 | Register setting definition | Code/contract release declares immutable key, owner, type, meaning, sensitivity, allowed scopes, resolution, default source, validation, risk, audit and deprecation. | Definition artifact/version is deployed and synchronized; admin cannot mint arbitrary keys. |
| CFG-02 | Resolve effective value | Load definition then eligible active value versions in its explicit precedence, validating subject/scope/time/cohort and provenance. | Typed value plus source scope/version/default and evaluation time. |
| CFG-03 | Propose setting change | Authorized actor selects permitted scope, enters typed value, sees effective-value/consumer impact, validation and rollback candidate. | Draft change version; no effect. |
| CFG-04 | Approve/schedule/activate/rollback | Freeze value/impact hash, collect risk-required distinct approvals and step-up, preflight at activation, atomically activate and emit outbox. Rollback creates a new version. | Consumers converge by version; history remains. |
| CFG-05 | Manage release flag | Define owner, purpose, environments, cohorts, fallback, dependencies and expiry; evaluate after auth but never as auth/business rule. | Versioned release state with automatic stale-owner/expiry task. |
| CFG-06 | Run experiment | Require hypothesis, eligible non-protected cohort dimensions, consent/analytics contract, allocation, metrics, stop condition and end date. | Deterministic assignment; experiment cannot alter safety/legal/rights/money/eligibility floors. |
| CFG-07 | Activate kill switch | Named incident-capable actor step-ups, selects predeclared switch/scope/fallback/reason, and confirms impact; independent runtime snapshot path applies. | Immediate bounded safe fallback plus immutable incident/security audit. |
| CFG-08 | Work admin inbox | Query assigned approvals, failed jobs, schedules, expiring rights/credentials/flags, holds, diagnostics and incidents under current capabilities. | Counts/items include freshness/partial/unknown; missing card never means no work. |
| CFG-09 | Search/filter control plane | Search allowlisted metadata/projections across content/media/navigation/settings/jobs/audit-safe refs; results enforce per-item capability. | Bounded cursor result; no body/evidence leakage through snippets/counts. |
| CFG-10 | Preview/run bulk action | Filter candidates, freeze exact target IDs/versions and command, dry-run eligibility/effects, approve, then process idempotent bounded job. | Per-target success/failure/retry evidence; no arbitrary database editing. |
| CFG-11 | Grant/revoke admin capability | Capable administrator grants named scope/actions/term with least privilege; protected/elevated grant requires MFA, reason, distinct approval and notifications. | Grant becomes current or immediately revoked; sessions/actions recheck. |
| CFG-12 | Inspect audit/diagnostics | Read linked editable-history and immutable security/financial audit through minimal projections; run registered diagnostics with freshness/evidence. | Unknown/stale stays unknown; diagnostic never becomes second truth or auto high-risk repair. |
| CFG-13 | Import/export/restore | Authorize scope, upload privately, map versions/fields/relations/media, dry-run and quarantine; export allowlisted manifest; restore into isolated target and verify. | Import commits via idempotent batches; export expires; restore proof records integrity. |
| CFG-14 | Run quality/retention action | Execute registered accessibility/content checks; preflight publish; request archive/delete/anonymize/hold/erasure; calculate cross-store manifest and conflicts. | Eligible action converges with evidence; legal/record conflicts route review and never silently erase obligations. |

### Global Interaction Rules

- Anything product-operable is a typed governed setting/definition or explicit code/rule-pack invariant; scattered product literals are prohibited.
- Settings, flags, experiments and kill switches are four distinct contracts. None grants identity, authorization, consent, entitlement, legal status, money, rights, or evidence truth.
- Every administrative count, search result, task and diagnostic is capability-filtered and freshness-labelled; absence never substitutes for failure/unknown.
- Enterprise SSO, directory sync, SCIM, organization policy consoles and enterprise-wide administration remain deferred.

## Contracts

### Setting Definition and Resolution

| Contract | Locked rule |
|---|---|
| Definition identity | Lowercase immutable key/UUID owned by code/contract release; label/help may version; key never reused. |
| Value kinds | `boolean, integer, decimal, short_text, enum, duration, timestamp, json_object, string_list, percentage`; each strict bounded schema. No secret/binary/code/HTML. |
| Allowed scopes | Definition explicitly chooses among `platform, environment, party, site, route, feature, user`; unsupported scope cannot store a value. |
| Resolution | Definition lists exact high→low precedence and merge mode `replace \| append_unique \| object_merge_allowlist`; no universal implicit hierarchy. |
| Provenance | Every resolved value returns definition/value version, source scope/subject, default/inherited flag, effective interval, evaluator version and correlation ID. |
| Protected exclusions | Credentials/secrets, Auth/RLS/capability semantics, legal floors, money/ledger/tax, rights/provenance, transactional state machines, migrations, holds/evidence and security limits cannot be ordinary values. |

### Risk, Flags, and Administration

| Contract | Locked rule |
|---|---|
| Risk classes | `low, medium, high, emergency`; definition fixes class/minimum approvers/MFA/canary/rollback/notification. Ordinary admin cannot lower risk. |
| Flag | Release availability only; owner, environments, cohort key, fallback, start/end/expiry and dependencies mandatory. |
| Experiment | Separate from flag; protected traits/private/special-category data cannot target; assignment hash deterministic; no hidden eligibility or access effect. |
| Kill switch | Predeclared safe fallback, scope and independent signed runtime snapshot. Cannot bypass authorization or create alternate business truth. |
| Bulk operation | Exact command registry + target ID/version snapshot + dry run + maximum protected batch + idempotency; no SQL/expression/arbitrary field mutation. |
| Capability grant | Named actions/resources/scope/term, no wildcard; grantor cannot exceed own authority; revocation immediate; break-glass time-bounded and fully evidenced. |
| Purpose grant | The support form of a capability grant: an `AdminCapabilityGrant` whose `resource_type/id` names exactly one case, order, request or record; whose `actions[]` are drawn only from the registered mechanical-recovery workflow keys; whose `ends` is mandatory and set by the grantor at issue per CFG-11; and which can never carry grant/revoke actions. No wildcard resource or action. Expiry is automatic, revocation immediate, and every use is audited with the stated reason. |

### Portability, Quality, and Retention

| Contract | Locked rule |
|---|---|
| Import | Explicit source/version/mapping/provenance/duplicate strategy; cannot import authority, ownership, consent, verification, money, rights or legal status as truth. |
| Export | Scope and field allowlist, actor/purpose, encryption, expiry/download limits, manifest/hashes; secrets/protected evidence separate or excluded. |
| Restore | Isolated target first; schema/media/reference/count/hash/RLS/render/accessibility validation before any promotion. Backup success without restore proof is failure. |
| Quality gate | Blocking rules: structural/schema/ref errors, required a11y metadata, broken/inaccessible block, privacy/legal/rights blockers; human review remains required. Readability/style warnings do not invent facts. |
| Retention | Record-class policy/rule-pack determines archive/delete/anonymize/hold/erasure; legal hold wins deletion but access is minimized/sealed; numeric periods counsel-gated. |

## Data Models

| Model | Purpose and core fields |
|---|---|
| `SettingDefinitionVersion` | stable key/UUID, type/schema, owner, allowed scopes, precedence/merge, default, risk, consumer registry, lifecycle/version. |
| `SettingValueVersion` | definition, scope/subject/environment, typed value, effective interval, state, author/context, supersedes/version. |
| `ConfigChangeReview` | value/flag/experiment/switch candidate hash, impact manifest, risk, approvals, state/version. |
| `FeatureFlagVersion` | key, purpose, owner, environments/cohort/fallback/dependencies, interval/expiry, state/version. |
| `ExperimentVersion` | key, hypothesis, eligibility dimensions, allocation, metrics, consent ref, stop/end, state/version. |
| `KillSwitchVersion` | key, safe fallback, allowed scopes, runtime snapshot hash, activation state/actor/reason/version. |
| `AdminTaskProjection` | source type/ID/version, task class, assignee capability/person?, due/severity/freshness/state. |
| `AdminCapabilityGrant` | subject person, capability, resource/scope/actions, starts/ends, grantor, approval/evidence, state/version. |
| `BulkOperation` | command, frozen query/target manifest hash/count, dry-run report, state, cursor/result counts/version. |
| `AdminAuditLink` | content revision/change IDs linked to immutable audit/security event IDs without copying protected payload. |
| `DiagnosticDefinitionVersion` | key, owner, inputs, timeout, freshness, evidence schema, severity mapping, runbook, lifecycle. |
| `DiagnosticRun` | definition/version, target, state, started/completed, freshness, evidence/result codes. |
| `ImportJob` | source/object/schema, mappings, duplicate policy, dry-run/quarantine report, cursor/counts/state/version. |
| `ExportArtifact` | scope/field manifest, object ref, hashes/encryption, expires/download count, state/version. |
| `RestoreVerification` | backup/export, isolated target, schema/count/hash/RLS/render/a11y results, reviewer/state. |
| `QualityCheckRun` | checker/version, target/version, findings/severity/evidence, state/time. |
| `DataLifecycleRequest` | request type/scope/subject/stores, verification, hold/conflicts, manifest, decisions, state/version. |

Detailed resolution, activation, runtime snapshot, admin query, bulk, portability and lifecycle algorithms are normative in the deep dive.

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`SettingDefinitionVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: stable key/UUID, type/schema, owner, allowed scopes, precedence/merge, default, risk, consumer registry, lifecycle/version..
- **`SettingValueVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: definition, scope/subject/environment, typed value, effective interval, state, author/context, supersedes/version..
- **`ConfigChangeReview`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: value/flag/experiment/switch candidate hash, impact manifest, risk, approvals, state/version..
- **`FeatureFlagVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: key, purpose, owner, environments/cohort/fallback/dependencies, interval/expiry, state/version..
- **`ExperimentVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: key, hypothesis, eligibility dimensions, allocation, metrics, consent ref, stop/end, state/version..
- **`KillSwitchVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: key, safe fallback, allowed scopes, runtime snapshot hash, activation state/actor/reason/version..
- **`AdminTaskProjection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: source type/ID/version, task class, assignee capability/person?, due/severity/freshness/state..
- **`AdminCapabilityGrant`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: subject person, capability, resource/scope/actions, starts/ends, grantor, approval/evidence, state/version..
- **`BulkOperation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: command, frozen query/target manifest hash/count, dry-run report, state, cursor/result counts/version..
- **`AdminAuditLink`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: content revision/change IDs linked to immutable audit/security event IDs without copying protected payload..
- **`DiagnosticDefinitionVersion`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: key, owner, inputs, timeout, freshness, evidence schema, severity mapping, runbook, lifecycle..
- **`DiagnosticRun`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: definition/version, target, state, started/completed, freshness, evidence/result codes..
- **`ImportJob`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: source/object/schema, mappings, duplicate policy, dry-run/quarantine report, cursor/counts/state/version..
- **`ExportArtifact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: scope/field manifest, object ref, hashes/encryption, expires/download count, state/version..
- **`RestoreVerification`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: backup/export, isolated target, schema/count/hash/RLS/render/a11y results, reviewer/state..
- **`QualityCheckRun`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: checker/version, target/version, findings/severity/evidence, state/time..
- **`DataLifecycleRequest`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: request type/scope/subject/stores, verification, hold/conflicts, manifest, decisions, state/version..

## Access Control

| Capability | Allowed | Explicit denial |
|---|---|---|
| Settings editor | Draft values for assigned definitions/scopes and view safe impact. | Create keys, broaden scope, lower risk, access secrets. |
| Configuration approver | Approve eligible frozen changes after MFA/risk checks. | Self-approve protected change or edit candidate during review. |
| Release manager | Manage release flags/environments and approved canaries. | Use flag as authorization/legal/business rule. |
| Experiment operator | Manage approved hypotheses/cohorts/metrics within consent constraints. | Protected-trait targeting, covert access/price/eligibility discrimination. |
| Incident operator | Activate assigned predeclared kill switch/break-glass under reason/time/audit. | Arbitrary config/database mutation or permanent elevation. |
| Admin operator | Work assigned tasks/search/bulk/diagnostics under named capabilities. | General private browsing, wildcard export, direct database editing. |
| Privacy/legal operator | Review assigned lifecycle/hold/export cases with MFA and sealed evidence. | Ordinary content access beyond case, erase holds/audit/third-party rights. |
| Service principal | Evaluate one setting or run one registered task/check/import/export consumer. | Interactive authority, arbitrary key/command, wildcard data. |
| Support operator | View the minimum support projection for a named case/request, correlate request IDs, and execute named mechanical recovery workflows with a stated reason under a purpose grant. | Content/body access by default, payment/legal evidence, granting or altering any capability, direct database mutation. |

No administrator is a universal tenant. Every protected operation rechecks actor, acting context, named capability, scope, assignment, term, MFA freshness, target/version and RLS/RPC at commit.

### Access Escalation

A denial returns a typed reason and preserves canonical state. Three routes exist and they are not interchangeable.

- (a) A **capability or authority denial** — missing, expired or revoked grant, insufficient scope, stale MFA — escalates to the `grantor` recorded on the actor's `AdminCapabilityGrant`, or to a capable administrator per CFG-11 where no current grantor exists. It never routes to Trust & Safety.
- (b) An **evidence or party-authority dispute about the target of a change** routes to the Shard 06 scoped case path.
- (c) **Mechanical recovery** — a stuck job, a lost artifact, an unresolvable request ID — is performed by a Support operator under a purpose grant naming that single object; a Support operator can never grant, widen or restore a capability.

Counsel, capability and privacy hard gates have no role override by any route. Per-capability routes:

- **Settings editor:** denial for an unassigned definition or out-of-scope value escalates to the grantor via CFG-11. Key creation, scope broadening, risk lowering and secret access are hard denials with no route.
- **Configuration approver:** self-approval of a protected change and editing a candidate during review are separation-of-duties hard gates with no escalation.
- **Release manager:** using a flag as an authorization, legal or business rule is a hard gate with no override. Environment or canary scope denial escalates to the grantor via CFG-11.
- **Experiment operator:** protected-trait targeting and covert access/price/eligibility discrimination are hard gates with no override. Cohort, metric or consent-scope denial escalates to the grantor.
- **Incident operator:** denial of an unassigned kill switch or break-glass escalates to the break-glass grantor and issues under the Capability grant contract with MFA, reason, bounded term, notification and evidence. Arbitrary mutation and permanent elevation are hard denials with no route.
- **Admin operator:** task, search or bulk scope denial escalates to the grantor. A request to reach a party's private data routes to the Shard 06 case path or to a Privacy/legal operator — never to a broader admin grant.
- **Privacy/legal operator:** hold, erasure and third-party-rights conflicts escalate to counsel; the counsel gate has no override. A denied ordinary-content read beyond the case has no escalation route.
- **Service principal:** no human escalation route exists. A denial is a typed refusal to the caller plus an operations task against the registered consumer; a Support operator may not recover a service principal by grant.

## Accessibility

- Admin home, search and diagnostics distinguish loading, stale, partial, unknown, healthy, empty and failed states with text/semantics—not color or missing cards.
- Settings forms expose effective value, source scope/version, inherited/default state, impact, risk, validation and rollback before confirmation.
- Scope/precedence visualizations provide equivalent ordered text/table representation and keyboard navigation.
- Bulk dry-run/result tables expose frozen target count, per-item state, errors, retryability and downloadable accessible report.
- Time-bound grants, flags, experiments, exports and holds announce expiry/timezone; session/step-up interruptions restore context.
- Accessibility checker findings link to exact field/block/route, explain severity/rule, and never claim automation replaces human review.
- Import mapping and compare/restore interfaces provide semantic tables, keyboard mapping/reordering, error summaries and focus restoration.

## Event Schemas

All events use Shard 00 identifier-only envelopes.

| Event type | Payload | Consumer contract |
|---|---|---|
| `config.setting.activated.v1` | `{ definitionId, valueVersionId, scopeType, scopeId? }` | Registered consumers refetch/evaluate exact version. |
| `config.flag.changed.v1` | `{ flagId, flagVersionId }` | Runtime snapshot/compiler and diagnostics refetch. |
| `config.kill-switch.changed.v1` | `{ switchId, switchVersionId, activationId }` | Independent runtime distribution and incident status verify. |
| `admin.capability.changed.v1` | `{ grantId, subjectPersonId }` | Sessions/task/admin queries invalidate immediately. |
| `admin.bulk.changed.v1` | `{ bulkOperationId }` | Task/notification/diagnostic views refetch per-target status. |
| `quality.lifecycle.changed.v1` | `{ lifecycleRequestId }` | Store/processors/purge/export consumers execute exact manifest. |
| `quality.diagnostic.changed.v1` | `{ diagnosticRunId }` | Admin health/task projection refetches freshness/result. |

## Edge Cases

| Case | Required result |
|---|---|
| Admin submits undefined setting key | Reject; no arbitrary production key or implicit schema. |
| Scope not allowed or parent disappears | Reject value or fall to next explicitly defined source; provenance shows change. |
| Two scopes conflict | Definition's exact precedence/merge resolves deterministically or blocks; no ambient hierarchy. |
| Consumer does not recognize activated version | Consumer fails safe/uses prior compatible value and reports diagnostic; no silent coercion. |
| Approval/effective context changes | Invalidate approval; return candidate to review. |
| Flag owner leaves or expiry passes | Safe fallback activates, task/notification generated, stale flag diagnostic opens. |
| Experiment cohort drifts | Freeze/stop per plan; never silently rebalance historical assignment. |
| Database/control plane unavailable during kill event | Last signed runtime snapshot/predeclared fallback applies; incident records reconcile when canonical store returns. |
| Admin task dependency fails | Mark card/aggregate partial or unknown; never show zero/no work. |
| Search count could leak protected case | Suppress/count-bucket or deny query; no side-channel. |
| Bulk targets change after dry run | Version mismatch fails only changed targets; never expands target set. |
| Capability revoked mid-job | New leases/actions deny; completed authorized items remain audited; remaining items stop. |
| Diagnostic unavailable | State unknown/stale, never healthy; runbook/manual check offered. |
| Import row tries to create ownership/authority | Quarantine/reject mapping; may import claim/source note only where contract allows. |
| Export includes protected field unexpectedly | Schema allowlist rejects job; artifact never becomes downloadable. |
| Restore counts pass but RLS/render fails | Restore verification fails; no promotion. |
| Scheduled publish gains new a11y blocker | Block execution and alert owner; last active output remains. |
| Erasure conflicts with hold/shared record | Preserve required minimum, seal access, record exception/reviewer, continue eligible processor deletes. |

## Surface Applicability

- **Primary**: Responsive web/PWA settings/configuration, admin home/tasks/search/bulk/capability/audit/diagnostics, import/export/restore, quality and lifecycle administration.
- **Server**: Hono admin/evaluation APIs, PostgreSQL RLS/RPC/outbox/jobs, Worker runtime snapshot/Queue/schedule consumers, Storage export/import artifacts.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| CFG-01 Register setting definition | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-02 Resolve effective value | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-03 Propose setting change | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-04 Approve/schedule/activate/rollback | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-05 Manage release flag | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-06 Run experiment | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-07 Activate kill switch | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-08 Work admin inbox | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-09 Search/filter control plane | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-10 Preview/run bulk action | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-11 Grant/revoke admin capability | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-12 Inspect audit/diagnostics | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-13 Import/export/restore | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| CFG-14 Run quality/retention action | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** Shard 00 platform contracts, Shard 01 authority, Shard 03 CMS modeling/authoring and Shard 04 delivery/media.
- **Depended on by:** Shard 06 trust and safety.

## Deep Dives Needed

- [Platform configuration, admin and quality deep dive](deep-dives/05-platform-configuration-admin.md) — resolution/activation/runtime, capabilities, bulk, diagnostics, portability and lifecycle algorithms.

### Cross-Shard Section Contract Map

- **Shard 00 — Cross-cutting platform foundation:** consume [Shard 00 — Cross-cutting platform foundation Contracts](00-infrastructure.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 00 — Cross-cutting platform foundation Event Schemas](00-infrastructure.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 01 — Identity authority and party governance:** consume [Shard 01 — Identity authority and party governance Contracts](01-identity-authority.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 01 — Identity authority and party governance Event Schemas](01-identity-authority.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 03 — CMS content modeling and authoring:** consume [Shard 03 — CMS content modeling and authoring Contracts](03-cms-content-modeling.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 03 — CMS content modeling and authoring Event Schemas](03-cms-content-modeling.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 04 — CMS navigation, media and delivery:** consume [Shard 04 — CMS navigation, media and delivery Contracts](04-cms-delivery-media.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 04 — CMS navigation, media and delivery Event Schemas](04-cms-delivery-media.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 06 — Trust and safety:** consume [Shard 06 — Trust and safety Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 06 — Trust and safety Event Schemas](06-trust-safety.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-02 | Authored complete configuration/admin/quality IA from 20 source documents | /write-architecture-spec-design | All |
| 2026-08-02 | Resolved scope, risk, flag/switch, admin, portability, quality and lifecycle variance | /write-architecture-spec-deepen | Contracts, Models, Access, Events, Edge Cases |
| 2026-08-05 | A-29: added the Support operator capability row and the Purpose grant contract, and replaced the eight identical escalation bullets with a three-route common rule plus differentiated per-capability routes | /resolve-ambiguity | Contracts, Access Control |

## Dependency References

- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]

### Constrains

- [[specs/ia/06-trust-safety|Shard 06 — Trust and safety]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/ia/06-trust-safety|Shard 06 — Trust, safety, disputes and evidence]]
