# Shard 11 — Social graph and collaborator network

> **Architecture Source**: [2026-08-02-architecture-design.md](../2026-08-02-architecture-design.md)
> **Decomposition Source**: [decomposition-plan.md](decomposition-plan.md)
> **Deep Dive**: [deep-dives/11-community-graph.md](deep-dives/11-community-graph.md)
> **Document Type**: Feature domain
> **Status**: Complete — design approved under standing owner autonomy; deepening converged

## Overview

Shard 11 owns entity follows, supplementary professional connections, evidence-based endorsements, actionable activity feed, collaborator discovery, derived/citable two-hop collaboration paths, double-opt-in introductions and a strictly private personal rolodex. Social edges never grant contact consent, project access, authority, rights or trust. Private CRM records never influence shared ranking, recommendations or other users' experiences.

### Scope Reconciliation

| Check | Result |
|---|---|
| Source boundaries loaded | 5 |
| In-scope source documents loaded | 27 |
| Child capabilities reconciled | 18 |
| Added or removed feature boundaries | 0 |
| Consumer-launch follow posture | Browser-local follows may remain local; durable alerts require verified email and explicit consent (B4) |
| CRM counsel gate | Notes prohibit special-category data and unverified allegations until narrower policy is counsel-approved (B5) |
| Enterprise features | Deferred; no shared team CRM, contact enrichment, sales automation or enterprise directory |
| Split handling | Parent IA plus one approved high-complexity deep dive |

## Features

- **03.01 Connections, Follows & Endorsements** — acting-entity follows, contextual professional requests and evidence-based/hideable endorsements.
- **03.02 Activity Feed & Ranking** — typed domain events, actionability-first/evidence-first ranking, explicit controls and subordinate native posts/reactions.
- **03.03 Collaborator Discovery & Matchmaking** — evidence-ranked search, explainable fit, expiring role-specific appetite and term-explicit collaboration calls.
- **03.04 Warm Intros & Collaboration Graph** — derived citable paths, broker-first double opt-in, evidenced referrals and density-aware reachability.
- **03.05 Private Rolodex & CRM** — owner-isolated shadow contacts, private notes/tags/lists and author-only reminders.

## Acceptance Criteria

- **AC-COM-01 — Follow/unfollow entity:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Explicit acting entity follows without approval; bounded alert scope; unfollow never notifies and follow gives no contact consent, and (6) return Edge version/local state and safe counts update; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-02 — Request professional connection:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Non-Fan actor sends context-specific note under reachability/rate rules; acceptance never auto-follows, and (6) return Request/edge state and neutral expiry commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-03 — Endorse collaborator:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Actor selects skill/reliability claim backed by eligible verified collaboration; basis is displayed; endorsee may hide, and (6) return Endorsement/basis/visibility version commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-04 — Read activity feed:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Viewer receives typed eligible events ranked for actionability, evidence, proximity and geography; alert events bypass rank, and (6) return Cursor/source versions and reason labels returned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-05 — Mute/reduce feed source:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Viewer silently mutes entity/type/domain or adjusts controls; muted party never learns, and (6) return Viewer-private preference version applies; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-06 — Publish/react to native post:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Professional persona authors bounded post; Fan may read/react only; structured events outrank posts, and (6) return Post/reaction state with moderation linkage commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-07 — Search collaborators:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Query includes role, evidence needs, remote/in-room, geography and feasibility; results explain match and degrade honestly, and (6) return Bounded authorized result/cursor plus reasons; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-08 — Set open-to status:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) User opts into one or more role-specific appetite signals with expiry and scope; silence is default, and (6) return Signal/version/expiry task commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-09 — Publish collaboration call:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner provides role, scope, split/unpaid/credit-only terms, unused-submission handling and expiry, and (6) return Moderated call version publishes; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-10 — Accept call responder:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Authorized owner accepts one response and initiates typed Shard 09 project/Shard 10 split setup; submission itself transfers no rights, and (6) return Acceptance command set and audit commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-11 — Find intro path:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Actor asks ego-rooted path to target; system returns citable ≤2-hop path or unknown/no-path-within-range, and (6) return Fresh path-evidence snapshot returned; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-12 — Suppress graph edge:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Either human endpoint silently makes derived edge non-traversable; evidence/history remains private, and (6) return Suppression version immediately affects paths; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-13 — Request warm intro:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Requester states specific ask to eligible broker; target is not contacted until broker consents, and (6) return Broker request with expiry/rate budget commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-14 — Broker introduction:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Broker accepts/declines silently; on accept opens scoped channel with optional note; no pitch forwarding obligation, and (6) return Channel invitation and disclosure evidence commit; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-15 — Evaluate reachability:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Sender-target policy resolves direct, intro-required or unavailable using density/compliance/block context, and (6) return Safe route returned without exposing refusal reason; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-16 — Create/reconcile shadow contact:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner records off-platform person privately and may later confirm reconciliation; never automatic or subject-visible, and (6) return Owner-scoped record/merge provenance commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-17 — Add private note/tag/list:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner stores bounded private relationship context; prohibited content validation applies; no shared computation reads it, and (6) return Encrypted owner-only version commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.
- **AC-COM-18 — Schedule follow-up:** Given a valid request with current identity, authority, source state and required inputs, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Owner creates private reminder tied to contact; reconciliation moves reference; only author is notified, and (6) return Reminder state/delivery evidence commits; if the flow cannot complete, invalid input, stale authority, revision conflict or dependency failure returns a typed refusal and no contradictory canonical mutation.

## Interactions

| ID | Interaction | Required behavior | Completion |
|---|---|---|---|
| COM-01 | Follow/unfollow entity | Explicit acting entity follows without approval; bounded alert scope; unfollow never notifies and follow gives no contact consent. | Edge version/local state and safe counts update. |
| COM-02 | Request professional connection | Non-Fan actor sends context-specific note under reachability/rate rules; acceptance never auto-follows. | Request/edge state and neutral expiry commit. |
| COM-03 | Endorse collaborator | Actor selects skill/reliability claim backed by eligible verified collaboration; basis is displayed; endorsee may hide. | Endorsement/basis/visibility version commits. |
| COM-04 | Read activity feed | Viewer receives typed eligible events ranked for actionability, evidence, proximity and geography; alert events bypass rank. | Cursor/source versions and reason labels returned. |
| COM-05 | Mute/reduce feed source | Viewer silently mutes entity/type/domain or adjusts controls; muted party never learns. | Viewer-private preference version applies. |
| COM-06 | Publish/react to native post | Professional persona authors bounded post; Fan may read/react only; structured events outrank posts. | Post/reaction state with moderation linkage commits. |
| COM-07 | Search collaborators | Query includes role, evidence needs, remote/in-room, geography and feasibility; results explain match and degrade honestly. | Bounded authorized result/cursor plus reasons. |
| COM-08 | Set open-to status | User opts into one or more role-specific appetite signals with expiry and scope; silence is default. | Signal/version/expiry task commits. |
| COM-09 | Publish collaboration call | Owner provides role, scope, split/unpaid/credit-only terms, unused-submission handling and expiry. | Moderated call version publishes. |
| COM-10 | Accept call responder | Authorized owner accepts one response and initiates typed Shard 09 project/Shard 10 split setup; submission itself transfers no rights. | Acceptance command set and audit commit. |
| COM-11 | Find intro path | Actor asks ego-rooted path to target; system returns citable ≤2-hop path or unknown/no-path-within-range. | Fresh path-evidence snapshot returned. |
| COM-12 | Suppress graph edge | Either human endpoint silently makes derived edge non-traversable; evidence/history remains private. | Suppression version immediately affects paths. |
| COM-13 | Request warm intro | Requester states specific ask to eligible broker; target is not contacted until broker consents. | Broker request with expiry/rate budget commits. |
| COM-14 | Broker introduction | Broker accepts/declines silently; on accept opens scoped channel with optional note; no pitch forwarding obligation. | Channel invitation and disclosure evidence commit. |
| COM-15 | Evaluate reachability | Sender-target policy resolves direct, intro-required or unavailable using density/compliance/block context. | Safe route returned without exposing refusal reason. |
| COM-16 | Create/reconcile shadow contact | Owner records off-platform person privately and may later confirm reconciliation; never automatic or subject-visible. | Owner-scoped record/merge provenance commits. |
| COM-17 | Add private note/tag/list | Owner stores bounded private relationship context; prohibited content validation applies; no shared computation reads it. | Encrypted owner-only version commits. |
| COM-18 | Schedule follow-up | Owner creates private reminder tied to contact; reconciliation moves reference; only author is notified. | Reminder state/delivery evidence commits. |

### Global Interaction Rules

- Commands carry `actor_person_id`, `acting_party_id`, `acting_context_version`, `idempotency_key`, `expected_version?` and `request_id`.
- Follow/connection/endorsement/collaboration edges connect explicit parties/entities; UI never unions states across acting contexts.
- Blocks and Shard 06 restrictions override follow, discovery, path, intro, call, post and contact routes without leaking existence/reason.
- Counts, candidate sets, paths and explanations are computed after visibility/suppression/block authorization.
- Ranking uses allowlisted shared evidence only. Private notes, shadow contacts, CRM tags, message content, protected traits and undisclosed availability are forbidden inputs.
- Missing graph/search inputs are labelled unknown/degraded; absence never means no relationship, no interest or poor fit.

## Contracts

### Core Types and Errors

| Contract | Definition |
|---|---|
| `FollowAlertScope` | `none | major | releases | opportunities | all_allowed`; bounded per edge |
| `ConnectionState` | `pending | accepted | declined | expired | revoked` |
| `GraphPathResult` | `path | unknown | no_path_within_intro_range` |
| `Reachability` | `direct | intro_required | unavailable` |
| `AppetiteState` | `active | paused | expired` |
| `StandardError` | `VALIDATION_FAILED, FORBIDDEN, ACTING_CONTEXT_STALE, VERSION_CONFLICT, IDEMPOTENCY_MISMATCH, BLOCKED_ROUTE, EVIDENCE_INELIGIBLE, PATH_UNCITABLE, BROKER_CAP_REACHED, RATE_LIMITED, CRM_CONTENT_PROHIBITED` |

### Graph, Feed and Discovery

| Contract | Invariant |
|---|---|
| `SetFollow` | Directed party edge, explicit acting entity, no approval/contact consent, no public roster; suspended/deleted excluded from counts. |
| `RequestConnection` | Mandatory contextual note; supplementary edge only and never source for collaboration path. |
| `CreateEndorsement` | Eligible Shard 07/09/booking evidence required; Operator limited to reliability attributes; basis visible. |
| `ProjectFeed` | Event domain owns eligibility; retraction/cancellation visibly amends. Rank reason set is allowlisted and posts remain subordinate. |
| `SearchCollaborators` | Evidence-based shared projections; remote/in-room primary axis; degraded self-tag-only result explicitly labelled. |
| `ComputeFit` | Returns reasons and missing inputs, never numeric user-facing score; endorsements excluded. |
| `PublishCall` | Terms/unused-submission policy/expiry mandatory; accepting responder cannot itself transfer rights. |

### Paths, Intros and CRM

| Contract | Invariant |
|---|---|
| `FindIntroPath` | Ego-rooted, max two hops, fresh evidence. Intermediaries human/claimed/active; each edge independently citable and second-human attested. |
| `SuppressCollaborationEdge` | Either human endpoint may suppress silently; evidence remains and suppression never affects credits. |
| `RequestIntro` | Broker-first, mandatory specific ask, strict separate rate/cap, neutral expiry; target gets nothing pre-consent. |
| `OpenIntroChannel` | Broker acceptance creates scoped channel; broker identity/note disclosed according to consent; decline reason hidden. |
| `ResolveReachability` | Direct eligibility density/compliance aware; unavailable sender offered intro route where safely possible. |
| `CreateShadowContact` | Owner-private, no subject signal, no automatic cross-owner or identity merge. |
| `WritePrivateNote` | Owner-only encrypted content; non-shareable and structurally excluded from ranking/search/endorsement/referral. |

## Data Models

| Model | Key relationships and constraints |
|---|---|
| `follow_edge` | Follower party, target party, alert scope, state/version; unique directed pair. |
| `connection_request` / `professional_connection` | Parties, context note, reachability snapshot, state/expiry and accepted edge. |
| `endorsement` | Endorser/endorsee/claim/basis evidence, state/hidden-by-subject/version. |
| `activity_event_projection` | Source event/domain/object, eligibility, evidence class, geography, actionability, amendment state. |
| `feed_preference` | Viewer party, muted parties/types/domains and control version; private. |
| `native_post` / `post_reaction` | Author party, bounded content, visibility, moderation/state/version. |
| `collaborator_search_document` | Party, public roles/evidence/appetite/geography/remote capability and projection version. |
| `open_to_signal` | Party, role/version, mode, geography/scope, starts/expires, state. |
| `collaboration_call` / `call_response` | Owner, role, terms, submission policy, expiry, moderation and response state. |
| `collaboration_edge_evidence` | Human endpoints, source kind/id/version, evidentiary class, date, citability and attestation. |
| `edge_suppression` | Human endpoints/evidence edge, suppressor, effective interval; private. |
| `intro_request` | Requester/target/broker, specific ask, evidence snapshot, state/expiry/rate key. |
| `intro_channel` | Request, participants, broker note, disclosure scope and channel reference. |
| `reachability_policy_version` | Target party, sender class/path/density/compliance rules and effective interval. |
| `shadow_contact` | Owner person/party, private display/contact refs, reconciliation state/target, version. |
| `private_contact_note` / `private_contact_tag` | Owner, contact, encrypted bounded content/value, state/version. |
| `follow_up_reminder` | Author, contact, due/recurrence, source, state/delivery/version. |
| `community_audit_event` | Immutable actor/context/action/target/before-after/evidence/request hashes. |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`follow_edge`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Follower party, target party, alert scope, state/version; unique directed pair..
- **`connection_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Parties, context note, reachability snapshot, state/expiry and accepted edge..
- **`professional_connection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Parties, context note, reachability snapshot, state/expiry and accepted edge..
- **`endorsement`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Endorser/endorsee/claim/basis evidence, state/hidden-by-subject/version..
- **`activity_event_projection`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Source event/domain/object, eligibility, evidence class, geography, actionability, amendment state..
- **`feed_preference`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Viewer party, muted parties/types/domains and control version; private..
- **`native_post`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Author party, bounded content, visibility, moderation/state/version..
- **`post_reaction`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Author party, bounded content, visibility, moderation/state/version..
- **`collaborator_search_document`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party, public roles/evidence/appetite/geography/remote capability and projection version..
- **`open_to_signal`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Party, role/version, mode, geography/scope, starts/expires, state..
- **`collaboration_call`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, role, terms, submission policy, expiry, moderation and response state..
- **`call_response`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, role, terms, submission policy, expiry, moderation and response state..
- **`collaboration_edge_evidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Human endpoints, source kind/id/version, evidentiary class, date, citability and attestation..
- **`edge_suppression`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Human endpoints/evidence edge, suppressor, effective interval; private..
- **`intro_request`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Requester/target/broker, specific ask, evidence snapshot, state/expiry/rate key..
- **`intro_channel`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Request, participants, broker note, disclosure scope and channel reference..
- **`reachability_policy_version`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Target party, sender class/path/density/compliance rules and effective interval..
- **`shadow_contact`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner person/party, private display/contact refs, reconciliation state/target, version..
- **`private_contact_note`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, contact, encrypted bounded content/value, state/version..
- **`private_contact_tag`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Owner, contact, encrypted bounded content/value, state/version..
- **`follow_up_reminder`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Author, contact, due/recurrence, source, state/delivery/version..
- **`community_audit_event`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: Immutable actor/context/action/target/before-after/evidence/request hashes..

## Access Control

| Actor | Permitted | Explicitly denied |
|---|---|---|
| Fan acting context | Follow, read/react, safe feed and public discovery | Connect, endorse, author posts, intro brokerage or professional CRM exposure |
| Professional party | Follow/connect/endorse/search/calls/paths/intros under policies | Infer blocks/refusals, browse arbitrary third-party paths or hidden graph |
| Broker | See specific requester/target/ask and choose accept/decline | Bulk target outreach, sell/list intro access or expose path evidence |
| Endorsee | Hide own endorsement and view basis | Edit endorser's statement/evidence or see private reliability notes |
| Call owner | Manage own call/responses and accept through typed downstream setup | Treat submission as rights transfer or bypass terms/safety |
| CRM owner | Own shadow contacts/notes/tags/reminders only | Share notes, search another owner's CRM or affect shared ranking |
| Moderator | Moderation case-scoped public/shared content and evidence | General private CRM access or use notes as safety allegations |
| System worker | Idempotent project/rank/search/path/expiry/notify operations | Read CRM for shared features, infer protected traits or auto-contact targets |

### Access Escalation

- **Fan acting context:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Professional party:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Broker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Endorsee:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Call owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **CRM owner:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Moderator:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **System worker:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Follow/connection controls always name active acting entity and current edge state; state is not color-only.
- Feed and search expose semantic reason labels, source/evidence state and degraded/unknown status in keyboard-navigable lists.
- Path results have linear text steps with evidence date/basis; graph visualization is optional.
- Intro and reachability flows explain available route without exposing rejection/block reason and preserve focus after neutral expiry.
- Call terms and unused-submission consequences appear before response/upload and remain screen-reader associated.
- CRM notes/reminders support keyboard editing, clear private-only labels and persistent validation without sending anything to subject.

## Event Schemas

| Event | Payload minimum | Consumers |
|---|---|---|
| `community.follow.changed.v1` | Edge/follower party/target/state/alert scope/version | Safe counts, local/durable alert projector |
| `community.connection.changed.v1` | Request/parties/state/version | Party notifications only |
| `community.endorsement.changed.v1` | Endorsement/parties/claim/basis class/state/version | Public profile projection |
| `community.feed-event.changed.v1` | Projection/source/type/eligibility/amendment/version | Feed projector |
| `community.open-to.changed.v1` | Party/role/mode/scope/state/expiry/version | Discovery search |
| `community.call.changed.v1` | Call/owner/role/terms/state/expiry/version | Discovery and accepted-response coordinator |
| `community.edge-suppression.changed.v1` | Evidence edge/state/version | Path resolver only |
| `community.intro.changed.v1` | Request/broker/target/state/channel?/version | Authorized participants |
| `community.crm-reminder.due.v1` | Reminder/author/contact ref/due/version | Author-only notification worker |

Events exclude notes, tags, contact details, mandatory request note text, path internals, refusal reasons, blocks, private availability, protected traits and unrestricted PII.

## Edge Cases

| Case | Required result |
|---|---|
| Same human acts through two entities | Separate follow/connection states and counts; never union. |
| Unclaimed followed profile is claimed | Edge transfers to canonical party with follower notice; no automatic expanded access. |
| Follow target blocks follower | Shared projections/routes disappear safely; unfollow/block reason not notified. |
| Source event retracts | Feed item visibly amended or removed under source policy with tombstone; no silent rewrite. |
| Search evidence disappears | Result re-ranks/degrades; prior match never cached as durable trust claim. |
| Graph dependency times out | Return unknown, never no path. |
| Edge is old | Age disclosed in path reason but not decayed/weighted. |
| Either collaborator suppresses edge | Immediate non-traversability; other endpoint gets no reason/notice. |
| Broker ignores request | Neutral expiry; target never contacted and requester sees no blame signal. |
| Graph too sparse | Reachability remains permissive per approved density rule; no fabricated warm path. |
| Two owners shadow same person | Records remain isolated and never merge. |
| Shadow contact later joins | Owner confirms reconciliation; reminders move and notes remain owner-private. |
| CRM note contains prohibited data | Reject with content policy route; never index/log/share raw note. |
| Browser-local follow without consent | Remains local; no durable email/push alert created. |

## Surface Applicability

Responsive web/PWA only. Browser-local follow state may exist before durable account synchronization under B4. No enterprise/team CRM, native contact-book import or background device scraping.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| COM-01 Follow/unfollow entity | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-02 Request professional connection | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-03 Endorse collaborator | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-04 Read activity feed | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-05 Mute/reduce feed source | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-06 Publish/react to native post | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-07 Search collaborators | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-08 Set open-to status | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-09 Publish collaboration call | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-10 Accept call responder | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-11 Find intro path | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-12 Suppress graph edge | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-13 Request warm intro | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-14 Broker introduction | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-15 Evaluate reachability | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-16 Create/reconcile shadow contact | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-17 Add private note/tag/list | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| COM-18 Schedule follow-up | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

## Cross-Shard Dependencies

- **Depends on:** [Shard 00](00-infrastructure.md) for requests/events/search/notifications; [Shard 01](01-identity-authority.md) for parties/acting context/blocks/membership; [Shard 06](06-trust-safety.md) for restrictions/moderation and CRM safety boundaries.
- **Depended on by:** Shards 12, 13, 30, 37 and 38 consume safe graph/reachability/discovery projections. They cannot access private CRM, arbitrary graph traversal or hidden refusal/block reasons.

## Deep Dives Needed

- [Social graph and collaborator network deep dive](deep-dives/11-community-graph.md)

### Cross-Shard Section Contract Map

- **Shard 12 — Community spaces and events:** consume [Shard 12 — Community spaces and events Contracts](12-community-spaces-events.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 12 — Community spaces and events Event Schemas](12-community-spaces-events.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 13 — Opportunities and casting:** consume [Shard 13 — Opportunities and casting Contracts](13-opportunities-casting.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 13 — Opportunities and casting Event Schemas](13-opportunities-casting.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 30 — Booking and contracts:** consume [Shard 30 — Booking and contracts Contracts](30-booking-contracts.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 30 — Booking and contracts Event Schemas](30-booking-contracts.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 37 — Fanbase and direct-to-fan:** consume [Shard 37 — Fanbase and direct-to-fan Contracts](37-fanbase-direct-to-fan.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 37 — Fanbase and direct-to-fan Event Schemas](37-fanbase-direct-to-fan.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 38 — Campaigns and communications:** consume [Shard 38 — Campaigns and communications Contracts](38-campaigns-communications.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 38 — Campaigns and communications Event Schemas](38-campaigns-communications.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial skeleton and source-feature seeding | /decompose-architecture-structure | All |
| 2026-08-03 | Reconciled 27 sources; locked graph, ranking, discovery, intro, reachability and CRM contracts | /write-architecture-spec | All |

## Dependency References

### Constrains

- [[specs/ia/12-community-spaces-events|Shard 12 — Community spaces and events]]
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking and contracts]]
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/38-campaigns-communications|Shard 38 — Campaigns and communications]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/12-community-spaces-events|Shard 12 — Communities, participatory spaces and events]]
- [[specs/ia/13-opportunities-casting|Shard 13 — Opportunities and casting lifecycle]]
- [[specs/ia/30-booking-contracts|Shard 30 — Booking, negotiation and contracts]]
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
