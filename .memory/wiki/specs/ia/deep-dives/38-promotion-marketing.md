# Deep Dive 38 — Promotion and marketing

**Status:** Complete
**Parent:** [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
**Surface:** Responsive web/PWA

## Overview

This deep dive fixes the campaign graph, outreach commons, provider boundaries, attribution epistemics and public-artifact safety model for Shard 38. Promotion records what the platform actually knows: a deadline from a sourced rule, a message accepted by a sender, a link clicked, a first-party ticket bought, or an artifact retrievable at a timestamp. It never upgrades correlation, provider modelling, self-attestation or silence into stronger evidence.

### Convergence Findings

| Pass | Finding | Resolution |
|---|---|---|
| Cross-section | Release and tour campaigns share timing/readiness machinery but not every action | Typed campaign root plus kind-specific rule pack and projections |
| Cross-section | Shared WeJammin sending makes global caps enforceable but creates reputation contagion | Require verified entity-owned sender for platform transport; preserve export-only path |
| What-if | Rule pack changes after a campaign was planned | Existing derivation remains reconstructible; future commits require current pack or explicit stale handling |
| What-if | Date movement escapes into email/social/DSP systems | Preview classifies escaped actions and creates drafts/tasks; no automatic external mutation |
| Adversarial | Directory built by scraping exposes journalists and poisons outreach trust | Accept only licensed/editorial/target-consented professional facts with provenance |
| Adversarial | Multiple accounts race around curator cap | Atomic target-key budget is global across senders and identity-count invariant |
| Adversarial | Artist labels a paid placement as consulting | Intent classifier uses value exchange, promise and outcome; ambiguous consideration fails closed |
| Adversarial | Smart links become covert fan tracking | No capture, fingerprinting, raw IP event or cross-site identity; short-lived first-party session only |
| Adversarial | EPK badge implies coverage came from WeJammin pitch | Public badge derives only from artifact/retrievability; provenance stays private CRM state |
| Operations | Provider APIs lose scopes without notice | Capability-version preflight and complete manual fallback; planning remains independent |

## Interactions

### Campaign Derivation and Cascade

1. Actor selects a canonical release, tour or event and a compatible active rule pack.
2. Campaign service snapshots anchor revision, campaign kind, territory/channel settings and rule-pack version.
3. Deriver materializes grid rows with formula, source citation, hard/soft class, effective window and expiry.
4. Readiness graph links each row to canonical assets/facts or a named self-attestation; verifier strength renders explicitly.
5. Beat editor stores either offset anchor or absolute pin. Position and mode are mandatory; no inference from drag placement.
6. Date shopping creates a preview over current revisions and classifies each item as movable, pinned, stranded, elapsed, escaped or conflicting.
7. Commit rechecks source authority, anchor revision, campaign revision and rule-pack validity under one transaction.
8. Internal movable items update atomically. Escaped provider/message actions create reviewed drafts/tasks linked to the cascade.
9. New date and provenance emit through outbox. Consumers deduplicate on cascade ID and never independently recompute from a different rule pack.

### Sender Verification and Pitch Dispatch

1. Entity verifies a domain/sender through provider adapter; platform stores verification facts and capability profile, never mailbox credentials.
2. Composer creates one durable pitch revision from verified campaign/credit facts and explicit user-authored message blocks.
3. Policy engine rejects merge-field mass personalization, missing disclosures, prohibited offer intent and invalid target channel.
4. Budget service resolves protected target key and current global opt-out state.
5. One serializable transaction allocates per-target global and per-sender/channel leases; neither can overshoot under concurrency.
6. Dispatcher rechecks opt-out, sender verification, policy terms and lease validity immediately before provider handoff.
7. Provider acceptance consumes lease and appends outcome. Timeout becomes `unknown_reconciling`; retry uses same provider idempotency key.
8. Export-only mode produces recipient/content/asset package and records handoff, not send or delivery. It consumes no platform-send quota but remains subject to prohibited-offer classification.
9. Target opt-out invalidates every pending platform lease for the protected target key; no account or sender-specific negotiation is required.

### Directory and Private CRM

1. Source ingestion declares `licensed`, `editorial` or `target_consented` provenance, allowed fields, license/purpose and review date.
2. Validation rejects scraped/private-origin indicators, non-professional channels and unsupported sensitive data.
3. Source facts append to a target identity; current directory projection derives confidence and staleness without overwriting history.
4. Artist pitching creates a private entity contact and structured interaction automatically; no blank contact-entry form ships.
5. Directory link is suggested from strong evidence and requires entity actor confirmation. Merge/remove uses aliases/tombstones so private history survives.
6. Outcome contribution to directory analytics is disclosed and structured; B2 suppresses small-n values and low-count export.
7. CRM export contains entity-created contacts, pitches and structured outcomes in open documented format. It excludes directory-only enrichment and triggers no retention dark pattern.
8. Free-text third-party notes, allegations and special-category fields do not exist while B5 is closed.

### Smart Link and Pre-Save

1. Builder reads canonical source destinations and marks user overrides `unmanaged`.
2. Edge route resolves durable slug to active version, validates destination health and renders cacheable static HTML.
3. Visitor preference stored locally and optionally in own fan preference; device inference may suggest but never override explicit choice.
4. Redirect writes minimal click event with opaque short-lived first-party session, destination and coarse context; raw IP remains edge-security telemetry under separate retention.
5. Pre-save begins only after fan chooses provider and sees exact library-write scope, release and expiry.
6. OAuth callback stores encrypted token reference and provider grant facts; it creates no follow or marketing consent.
7. Release availability fans out idempotent attempts within provider quota. Outcome is confirmed only from provider evidence.
8. Release move updates grant expectation state. Cancellation/expiry revokes or deletes token and makes status visible; notification requires a separate service-purpose channel authorization.
9. Retirement changes link behavior without deleting slug/history. Retired traffic raises an owner review signal.

### Attribution Truth Model

| Observation | Truth label | Permitted statement |
|---|---|---|
| First-party smart-link redirect | `measured_click` | Link was selected at timestamp |
| Same first-party session buys on-platform ticket | `observed_conversion` | Eligible click preceded settled ticket purchase within configured window |
| Ticket refund | `observed_reversal` | Previously observed conversion no longer counts net |
| Pre-save provider confirms library write | `provider_confirmed` | Provider accepted/completed reported action |
| DSP streams after campaign | `correlated_external` | Stream trend overlaps campaign period; no causal claim |
| Ad platform conversion report | `provider_modelled` or provider-declared label | Reported by named provider/model, not platform measurement |
| Manual pitch outcome | `self_attested` | Entity actor recorded outcome |
| Retrievable fixed article | `verified` | URL/artifact was retrievable and class is fixed |
| Mutable playlist/add | `verified_at_timestamp` | Artifact contained item when checked |

No multi-touch weights, view-through inference, fingerprinting or identity graph join is computed. If several eligible clicks exist, report exposes the configured last-eligible first-party observation as a reporting convention, not causal allocation, and retains the other clicks separately.

### Payola and Seeding

1. Offer classifier receives structured value exchange, recipient/channel, promised outcome, disclosure and current DSP/legal terms versions.
2. Guaranteed placement, payment-for-airplay and any consideration whose outcome cannot be distinguished from placement return immutable prohibited verdict.
3. Unpaid editorial outreach may proceed subject to pitch caps. Paid-consideration brokerage returns `capability_disabled_review_only` until counsel/provider terms approve an evolved flow.
4. Unknown classifier state, missing terms or evaluator outage blocks action and explains uncertainty.
5. Marketplace listing creation and promotion campaign activation consume the same verdict; stricter result wins.
6. Creator seeding uses Shard 14 engagement/payment. Brief disclosure is immutable/non-removable and amplification rights require explicit grant.
7. Publication verification checks disclosure presence and continued availability at configured intervals. It opens a case/outcome; Shard 38 never moves money.

### Coverage and EPK

1. Actor records coverage as `claimed`; optional permitted verifier fetches only enough metadata to establish class/retrievability.
2. Fixed retrievable article may become `verified`; mutable placement becomes `verified_at_timestamp`; unavailable/unverifiable stays claimed.
3. Pitch link may classify private outcome `attributed`; absence of pitch parent is `organic`. Neither changes public strength.
4. EPK builder snapshots campaign, canonical biography/credits, licensed photos, release assets and coverage strengths.
5. Unconfirmed canonical credit renders `claimed`; no EPK-only credit entry exists.
6. Each publication creates immutable version. Recipient share stores opaque secret hash, scope, expiry, revocation and access evidence.
7. Forwarded link behavior follows access policy and may be revoked/expired; platform promises access control, not copy prevention.
8. Old version always resolves to available, expired, revoked, asset-withdrawn or legal-hold state.

### Event and Tour Marketing

1. Event/tour campaign reads named first-party dates, announcement/embargo state, on-sale facts and ticket-source freshness; it never becomes their owner.
2. Each date has independent readiness and tagged link because venues may announce or sell at different moments.
3. Venue notice records delivered/acknowledged state; contractual binding exists only when the booking owner supplies it.
4. Soft-date advisory requires policy-sufficient, fresh, non-sparse sales/refund facts and presents evidence/confidence to artist and venue.
5. Advisory can suggest plan changes but never create ad spend or claim marketing is the cause.
6. First-party ticket attribution nets refunds; external ticketing remains click-only and uses no inferred purchase.

## Contracts

### Command Results

| Command | Success | Stable refusal / recovery |
|---|---|---|
| `CreatePromotionCampaign` | `{campaignId, revision, rulePackVersion}` | `anchor_invalid`, `rule_pack_unavailable`, `mandate_denied` |
| `PreviewAnchorCascade` | `{previewId, sourceRevisions, classifications}` | `campaign_stale`, `source_unavailable`; no mutation |
| `CommitAnchorCascade` | `{cascadeId, movedItems, escapedTaskIds}` | `preview_stale`, `source_authority_denied`, `hard_conflict` |
| `VerifySenderIdentity` | `{senderId, capabilityVersion, state}` | `dns_unverified`, `provider_rejected`, `identity_conflict` |
| `ReservePitchBudget` | `{leaseId, expiresAt, remainingBand}` | `target_opted_out`, `target_cap_reached`, `sender_cap_reached`, `policy_unknown` |
| `DispatchPitch` | `{pitchId, providerState, receiptRef}` | `sender_unverified`, `lease_expired`, `policy_changed`, `unknown_reconciling` |
| `RecordPitchOutcome` | `{outcomeId, terminalState}` | `pitch_not_found`, `outcome_conflict`, `mandate_denied` |
| `UpsertDirectorySourceFact` | `{targetId, factId, confidenceState}` | `source_forbidden`, `private_channel`, `review_required` |
| `ExportPrivateCrm` | `{jobId, expiresAt, formatVersion}` | `step_up_required`, `scope_denied`, `export_in_progress` |
| `PublishSmartLink` | `{linkId, slug, version}` | `slug_conflict`, `source_unavailable`, `destination_invalid` |
| `CreatePreSaveGrant` | `{grantId, providerState, expiresAt}` | `scope_rejected`, `provider_denied`, `fan_cancelled` |
| `ExecutePreSaveGrant` | `{attemptId, outcome}` | `grant_expired`, `provider_rate_limited`, `unknown_reconciling` |
| `ClassifyPromotionOffer` | `{verdictId, verdict, termsVersion, reasons}` | Evaluation always returns immutable verdict; unavailable is blocked |
| `ScheduleSocialPublish` | `{jobId, dueAt, capabilityVersion}` | `provider_disconnected`, `scope_missing`, `unsupported_content` |
| `VerifyCoverage` | `{coverageId, strength, observedAt}` | `retrieval_forbidden`, `artifact_unavailable`, `class_unknown` preserves claimed state |
| `PublishEpkVersion` | `{epkId, version, sharePolicy}` | `asset_authority_missing`, `credit_state_invalid`, `access_policy_invalid` |

### Capability Gates

| Gate | Closed behavior | Activation evidence |
|---|---|---|
| `platform_pitch_send` | Compose/export/archive only | Verified entity-owned sender model, provider contract, complaint/bounce policy, domain incident runbook and cost quota |
| `paid_consideration_brokerage` | Classify as review-only disabled; no listing/payment/campaign activation | Counsel + DSP/provider terms, sanctions review, refund/dispute model and evolved architecture |
| `ad_account_integration` | Planner/import only; no token or spend command | Explicit future product decision, provider app review, support/ban runbook and cost controls |
| `fan_graph_ad_audiences` | No audience export/join/schema | `/evolve-feature`, explicit consent/opt-out, data-sharing inventory and counsel approval |
| `directory_shared_metrics` | No per-target low-count rate/band | B2 numeric floor, query-wide enforcement, lawful basis and disclosure |
| `crm_free_text_notes` | Schema absent; structured outcomes only | B5 approved fields, purpose, prohibited content, retention/erasure and audit |
| `social_provider_publish` | Manual package fallback | Provider connection, scopes/app review, capability tests and failure runbook per provider |
| `coverage_monitoring` | Manual capture/on-demand verification | Licensed/permitted source, false-positive controls, cost quota and copyright policy |

UI flags cannot open a gate. Server policy, schema constraints and provider credential availability all default deny. Gate activation records approvers, evidence, policy version and rollback condition.

### Cross-Shard Contracts

- [[specs/ia/22-release-distribution|Shard 22]] supplies release date, availability, destinations, assets, credits and provider delivery state; Shard 38 owns campaign derivation and never mutates release truth indirectly.
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37]] supplies only fan-owned destination preference/service-purpose notice decisions; Shard 38 receives no marketing list or ad audience.
- [[specs/ia/35-ticket-products-sales|Shard 35]] supplies first-party event/on-sale/order/refund facts; Shard 38 owns tagged links and reporting convention.
- [[specs/ia/14-services-marketplace|Shard 14]] owns creator engagement/payment and consumes payola verdict; Shard 38 owns promotion brief/disclosure/verification.
- [[specs/ia/11-community-graph|Shard 11]] may expose collaborator relation context but grants no campaign authority.
- [[specs/ia/00-infrastructure|Shard 00]] owns edge routing, outbox, quotas, provider adapters, secret vault and time-lock primitive; Shard 38 owns campaign semantics.
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39]] consumes explicitly labeled measurements/provenance and cannot strengthen truth labels.

## Data Models

### State Machines

| Aggregate | States and transitions |
|---|---|
| Campaign | `draft → active → completed`; `paused` and `cancelled` preserve history; anchor change is additive cascade |
| Grid item | `unknown → not_ready → ready`; `stale/blocked` may replace derived readiness; verifier strength separate |
| Pitch | `draft → budgeted → handed_off/accepted → delivered/failed/unknown → outcome_terminal` |
| Sender identity | `pending → verified → degraded/revoked`; only verified current capability may send |
| Directory fact | `quarantined → reviewed_active → stale/superseded/removed`; facts never overwritten |
| Smart link | `draft → active → retired_keep/retired_redirect/retired_page`; no deleted state |
| Pre-save grant | `pending → authorized → due → confirmed/failed/expired/revoked/cancelled` |
| Social job | `draft → scheduled → preflight_ready → accepted → confirmed/failed/unknown/cancelled` |
| Coverage | `claimed → verified/verified_at_timestamp`; later unavailability appends observation, not erasure |
| EPK share | `active → expired/revoked`; version availability is independent state |

### Invariants

| Model | Invariant |
|---|---|
| `campaign_rule_pack` | Immutable after activation; every derived row names rule/source/version/verified-at |
| `cascade_preview` | Hash covers source and campaign revisions; one accepted commit or expiry |
| `pitch_budget_lease` | Unique active target/window slot and sender/window slot; consumption/release exactly once |
| `target_suppression` | Protected target key global across entities; no admin/entity clear path |
| `private_contact` | Entity-owned; directory link nullable/reversible; no free-text column under B5 |
| `campaign_click` | No raw IP/fingerprint/contact; short-lived session ref and purpose-retention version |
| `conversion_observation` | Truth label immutable; reversal appends; no multi-touch weight field |
| `promotion_offer_verdict` | Bound to offer fingerprint and terms version; no mutable override |
| `coverage_observation` | Strength derives only from artifact class/retrievability evidence |
| `epk_version` | Immutable source snapshots; claimed/verified provenance retained per field/item |

### Retention and Portability

- Campaigns, pitches, outcomes and EPK versions retain according to entity business-record policy; export uses versioned JSON/CSV plus asset manifest.
- CRM export is unconditional for entity-created contacts/history. Directory source facts, shared confidence and other entities' outcomes are excluded.
- Target opt-out retains minimal protected contact hash and evidence long enough to enforce globally; it is not exposed as a reusable directory.
- Click/session records expire at the configured attribution/privacy window. Aggregate campaign counts retain source/truth labels without session identity.
- OAuth and social tokens revoke/delete at grant disconnect, capability loss, cancellation or configured expiry; provider receipts retain no secret.
- Unreleased EPK assets follow source ownership/legal hold; share-access logs have shorter configured security retention than campaign artifact history.
- Coverage stores URL, class, timestamps and permitted metadata/evidence, not copied article body or unauthorized archive.

## Access Control

### Permission Predicates

| Action | Predicate |
|---|---|
| Create/edit campaign | Entity mandate includes `promotion.plan` for anchor scope |
| Move anchor | Source-shard authority includes date mutation + `promotion.anchor_change` + step-up |
| Send pitch | `promotion.send`, verified entity sender, open gate, valid budget lease and policy verdict |
| Read private CRM | Entity mandate includes `promotion.crm`; target/other entity has no reciprocal view |
| Export CRM | `promotion.crm_export`, step-up and entity scope; asynchronous owner-notified job |
| Steward directory | Scoped platform stewardship role + source-purpose grant; no private CRM read |
| Manage smart link/EPK | Entity campaign mandate; unreleased assets additionally require source authority |
| Manage own pre-save | Authenticated/verified fan only; entity cannot grant/revoke for fan |
| Publish event campaign | Artist/venue event mandate for named first-party show; shared facts remain scoped |
| Change policy/rule pack | Dual-controlled platform policy role; activation and rollback audited |

Public smart-link routes do not reveal draft/retired/private campaign identity beyond selected public behavior. Recipient EPK secrets are stored hashed and compared in constant time. Support grants name one campaign/link/grant/provider case and expire automatically. Break-glass access requires incident ID, step-up and immutable audit. No artist, paid tier or administrator may lift target suppression or promotion-offer block.

## Accessibility

- Campaign graph has equivalent chronological list and table; dependencies, provenance and hard/soft status are announced in text.
- Drag-and-drop calendar operations have keyboard move/pin commands and confirmation; date shopping is usable without pointer or visual timeline.
- Readiness controls identify who/what verified each item; self-attested state does not use the same label or icon as machine/source validation.
- Pitch composer exposes target, ask, disclosures, budget and sender identity before content entry so users do not discover a block after authoring.
- Quota/policy errors retain form state, focus the explanatory summary and never market an upsell around protected limits.
- Directory confidence/staleness uses plain-language date and source type, not unexplained score alone.
- Smart-link page honors reduced motion, high contrast, zoom and locale; destination logos include visible text names.
- OAuth scope review and revoke actions use provider-independent language and a non-color state indicator.
- Attribution reports put truth label and source next to each number; accessible export repeats labels and does not rely on tooltip definitions.
- Calendar provider failures appear at the failed beat with live-region status and keyboard-operable manual fallback download.
- Coverage verification badge includes evidence timestamp; mutable and fixed artifact states are distinct to screen readers.
- EPK preserves heading order, alt text, credits, captions/transcripts and keyboard media controls in every immutable version.

## Event Schemas

### Ordering and Idempotency

| Stream key | Ordering | Consumer rule |
|---|---|---|
| Campaign | Monotonic aggregate revision | Reject stale beat/cascade writes; projections apply in revision order |
| Pitch/target | Pitch revision plus atomic quota lease | One provider acceptance per pitch revision; opt-out invalidates pending leases |
| Smart link | Link version order | Edge swaps complete immutable projection; old cache expires by version |
| Pre-save grant | Per grant sequence | Provider retries reuse attempt id; terminal revoke/cancel blocks later success |
| Social job | Per job sequence | Timeout remains unknown until receipt/reconciliation, never duplicate post |
| Ticket conversion | Order/ticket settlement sequence | Refund/reversal appends and recomputes net counts |
| Coverage | Per artifact observation time | Latest retrievability does not rewrite prior timestamped strength |
| EPK | Per EPK version | Published version immutable; access state changes separately |

Envelope fields are `event_id`, `event_type`, `schema_version`, `aggregate_id`, `aggregate_version`, `occurred_at`, `recorded_at`, `correlation_id`, `causation_id` and producer. Outbox write is atomic with canonical state. Dead-letter replay preserves IDs and truth label. Public/analytics events use opaque IDs and never include target email, fan identity, raw click address, provider token, private note, message body or secret EPK URL.

### Terms and Rule Invalidations

- New provider/DSP terms create a new immutable terms version and enqueue reclassification of non-terminal promotion offers.
- New campaign rule pack does not rewrite historical grids; active campaigns receive stale/changed-rule review tasks.
- Sender capability downgrade invalidates pending publish/send leases before handoff.
- B2/B5 or provider gate activation creates new policy version; existing records remain constrained by their capture terms and migrated only through explicit plan.

## Edge Cases

| Scenario | Required outcome |
|---|---|
| Rule source unreachable during campaign creation | Derived row blocks with source/last-known context; no cached value presented as current |
| Campaign has territory-specific releases | Separate typed campaign anchors or explicit territory instances; one ambiguous date is prohibited |
| Pinned beat now falls after release | Mark stranded and require explicit decision; never auto-move |
| Embargo lift conflicts with scheduled social post | Hard conflict blocks schedule/commit; bound parties receive least-detail notice |
| Venue was notified but not contractually bound | UI says notice delivered/acknowledged, never `legally bound` |
| External DSP form changes after pitch assembled | Rule pack invalidates readiness; export remains available with stale warning |
| Two accounts target same curator simultaneously | Serializable global lease admits one within remaining budget; other draft survives |
| Target opt-out endpoint is probed | Response invariant and rate-limited; no directory/account existence disclosure |
| Hard bounce arrives after manual rejection recorded | Bounce appends channel-rot fact; rejection outcome remains separate |
| Directory source license expires | Facts become stale/withdrawn from shared projection; private entity history survives |
| Departing band member requests CRM | Entity-owned CRM follows entity-governance outcome; no builder-person ownership inferred |
| Artist exports CRM repeatedly | No retention warning, delay or downgrade; jobs are cost/rate bounded only |
| Smart-link slug guessed before publication | Same not-found behavior as nonexistent/private slug; no campaign leakage |
| Remembered DSP destination disappears | Preference remains but resolver asks again and never routes to dead destination |
| Pre-save token has broader provider scope | Grant is rejected unless exact scope is policy-approved; no category-standard bundling by default |
| Release cancelled after pre-save provider accepted | Grant/token revoked where possible; fan status explains cancellation without claiming remote library rollback |
| Multiple clicks precede one ticket order | Report names convention-selected eligible click and lists others; no split credit percentages |
| Ticket bought externally after tracked click | Click-only correlation, even if user later self-reports purchase |
| Imported ad report lacks model label | Row quarantined until provenance supplied; metrics never default to measured |
| Paid-consideration offer avoids placement wording | Classifier examines value/outcome intent; ambiguity returns blocked review-only verdict |
| Actor switches persona to evade guardrail | Verdict binds action/offer and terms, not persona; same block applies |
| Terms change after spend committed externally | Platform halts future platform action and explains; refund/grandfathering requires approved policy, never improvised |
| Social provider says accepted then removes post | Read-back/actor outcome records removed/unknown; accepted is not rendered published |
| Manual social post differs from planned beat | Actor may attach observed URL/version; calendar preserves planned and actual separately |
| Playlist add disappears | New observation records unavailable; historical `verified_at_timestamp` remains truthful |
| Article blocks verifier bot but loads for user | Keep claimed or manual-evidence state; do not counterfeit machine verification |
| EPK recipient forwards link | Access policy applies to secret, not human identity; display label/audit aids response without claiming prevention |
| EPK credit later disputed | New version reflects dispute; old version resolves with historical/disputed notice under source policy |
| Sparse ticket sales would identify buyers | Advisory/analytics withhold under B2 and show insufficient-data state |
| Provider outage threatens p95 | Public cached link/EPK still load within p95 target; provider health is checked asynchronously or on explicit action |

## Verification

- **Two-implementer check:** campaign kinds, state machines, command errors, truth labels, gate behavior, concurrency winners and source ownership are explicit.
- **Devil's-advocate check:** shared-sender fallback, cap sybil race, opt-out bypass, directory scraping, note smuggling, fan-data ad export, payola euphemism, attribution inflation and EPK provenance leakage are denied.
- **Bidirectional dependency check:** release, fan, ticket, marketplace, community, infrastructure and analytics contracts identify one owner and one consumer direction.
- **Complexity check:** document remains below the 400-line pass threshold; no split required.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [38-promotion-marketing § Contracts](../38-promotion-marketing.md#contracts) defines commands/queries and [38-promotion-marketing § Event Schemas](../38-promotion-marketing.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Locked campaign derivation, outreach quotas, provider gates, attribution truth and EPK safety | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/38-promotion-marketing|Shard 38 — Promotion and marketing]]
- [[specs/ia/22-release-distribution|Shard 22 — Release and distribution lifecycle]]
- [[specs/ia/37-fanbase-direct-to-fan|Shard 37 — Fanbase and direct-to-fan]]
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
- [[specs/ia/14-services-marketplace|Shard 14 — Services marketplace lifecycle]]
- [[specs/ia/11-community-graph|Shard 11 — Social graph and collaborator network]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/ia/39-analytics-ingestion-reporting|Shard 39 — Analytics ingestion, matching and reporting]]
