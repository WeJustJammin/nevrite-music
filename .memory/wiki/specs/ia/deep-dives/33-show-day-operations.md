# Deep Dive 33 — Show-day execution and recovery

**Status:** Complete
**Parent:** [[specs/ia/33-show-day-operations|Shard 33]]

## Overview

This deep dive closes live timing causality, offline authority, performed-set attestation, case custody, advisory safety semantics and post-show correction containment.

## Interactions

### Setlist, Files and Performance Capture

1. Build tour-scoped immutable setlist from repertoire refs/local aliases and structural rows; each duration is exact/range/unknown.
2. Print-first stage output and device view render same pinned version.
3. Package generic files in exact set order with checksums; no executable session or playback control.
4. Show end prefills performed set from plan. Authorized production editor confirms deltas/personnel in seconds, offline-capable.
5. Venue confirms occurrence only. Qualified counterparty confirms content; absent capture remains unconfirmed plan fallback.
6. Work-level downstream outputs use only matched canonical references and confirmed performed rows.

### Timeline and Slippage

1. Derive owned timeline from frozen advance, bill, set duration ranges, venue occupancy, calls and load-out.
2. Evaluate several venue-sourced curfew constraints and uncertainty into breach/tight/clear/unknown.
3. One-tap update records actual start/end or new estimate, previews all same-day/cross-day cascades and affected owners.
4. Commit appends timeline version and targeted notifications. Staleness/captured-at stays visible everywhere.
5. Downstream fan publication consumes authorized projection and owns promises; internal timing is not directly public.

### Crew, Credentials and Manifest

1. Consume accepted service/venue crew engagements and assign event roles.
2. Derive per-role calls; one person may have several. Detect overlap/travel/rest conflicts.
3. Map role to venue areas and issue advisory credential/version/expiry.
4. Resolve manifest per date from frozen plan, personal/organization rigs and rentals; group by person/case.
5. Load-out bulk-confirms case, records missing/damage/custody and routes evidence without assigning blame.

### Day Sheet and Offline Operation

1. Render from current timeline, contacts, calls, credentials, logistics, safety and weather decision refs.
2. Missing source is a labeled gap. Recipient projection removes unauthorized acts/contacts/files.
3. Issue live link, accessible artifact and signed offline bundle with version/captured-at.
4. Old link announces supersession. Offline remains read-only authoritative to its captured version.
5. Queued local mutations retain device time but reconcile against server aggregate version.

### Safety, Weather and Recovery

1. Resolve event/venue/jurisdiction requirement class and responsible party; track evidence/date validity/human acceptance.
2. Never label compliance, verify certificate substance or broker insurance.
3. Outdoor contingency defines advisory thresholds, action options, named decision authority and communication tree.
4. Forecast/provider event can alert but cannot transition show. Authorized human records proceed/modify/pause/cancel with reason/evidence.
5. B6-disabled automated emergency promises remain absent; platform records and distributes within configured channels only.

### Post-Show Report

1. Prefill slippage, checklist deltas, manifest incidents, performed-set differences and known safety/weather decisions.
2. Production party co-edits one private factual/judgement report.
3. File within versioned edit window; subsequent correction becomes version/restatement, never hidden edit.
4. Venue capability/gear condition suggestion references evidence and routes owning provenance workflow.
5. No public review, venue score or cross-artist narrative is emitted.

## Contracts

### Timeline Mutation

```text
TimelineMutation = {
  item_ref,
  prior_version,
  actual_or_estimate,
  device_time,
  server_time,
  cascade[],
  curfew_margin,
  author_role,
  reason?
}
```

Cascade includes affected item/owner/date and old/new ranges. Commit requires current version and acknowledgment when configured hard constraint enters breach.

### Offline Bundle

Bundle contains allowlisted recipient projection, aggregate versions, captured-at, expiry, artifact checksums and signature. It contains no raw certificates, private show files outside scope or full contact directory. Expired bundle stays readable with prominent stale warning unless revoked for safety/privacy.

### Safety Semantics

| State | Meaning |
|---|---|
| `not_provided` | required evidence absent |
| `provided_unreviewed` | evidence exists; no authorized acceptance |
| `accepted_by_responsible_party` | named human accepted for this event/date |
| `invalid_for_show_date` | declared dates do not cover event |
| `contested` | parties disagree; route governed review |

No state means legally compliant, insured or safe.

All duration bands, curfew margins, staleness limits, credential expiry, offline-bundle expiry, alert cadence and post-report windows resolve from versioned settings or explicit event policy; implementations contain no hidden numeric constants.

## Data Models

### Ordering and Merge

- Setlist has stable row IDs plus ordered-list version.
- Independent row edits merge; same-row or competing reorder creates sibling conflict.
- Rollback creates successor from prior version.
- Performed set references plan and stores actual independent order.
- Timeline server version determines operational ordering; device time remains evidence only.

### Custody

Manifest item references frozen source identity when available; rental/local item carries date-scoped description. Case confirmation covers contained snapshot. Missing/damage event records last custody, discovering actor, evidence and reply state; only adjudicated/corroborated outcomes affect external trust.

### Post-Show Correction

Report item class is `fact`, `judgement`, `incident`, `source_correction`. Only `source_correction` can create provenance suggestion; none directly mutates source. Report privacy and edit-lock versions remain independent from downstream correction case.

## Access Control

- Setlist/show files default act-only; venue receives only explicitly shared stage-ready outputs.
- Production manager can mutate shared timeline within owned items; item ownership prevents unrelated edits.
- Crew receives own call/pass/day-sheet projection, not full roster/contact graph.
- Door personnel can verify current pass status without reading unrelated event data.
- Safety decider capability is event/hazard-scoped and cannot be inferred from generic admin.
- Post-show report visibility is event production parties only; moderators see referenced evidence upon escalation.

## Accessibility

- Offline bundle preserves semantic HTML, text alternatives, logical order and high-contrast print.
- Timeline update control is operable with screen reader and keyboard in one short flow.
- Curfew risk states include range/uncertainty/provenance text.
- Credential lookup supports name/code fallback when camera/QR is inaccessible.
- Safety decision flow clearly separates advisory data from human choice.
- Incident/report forms support voice-dictation-compatible labels and resumable evidence upload.

## Event Schemas

### Ordering and Idempotency

All version, package, timeline, credential, custody, safety and report commands use stable idempotency keys.

| Race | Resolution |
|---|---|
| Setlist edit vs file package | Package pins setlist version; newer edit marks package superseded |
| Offline performed capture vs online edit | Sibling conflict preserves both until exact row/content merge |
| Timeline mutation vs curfew update | Version lock re-evaluates margin before commit |
| Role revoke vs credential scan | Credential epoch checked at lookup; stale pass fails |
| Load-out confirmation vs incident | Case version serializes; incident can reopen confirmed case with evidence |
| Weather update vs human decision | Forecast appends advisory fact; never overwrites decision |
| Report lock vs queued edit | Server receipt/window controls acceptance; late draft retained privately for governed correction |

### Recovery

On service recovery: verify bundle/current pointers, process timeline writes in local sequence with version checks, expire/revoke credentials, reconcile custody events, refresh weather status and emit supersession notices. No queued write silently overwrites server state.

## Edge Cases

| Failure | Deterministic recovery |
|---|---|
| Local song alias later matched | New setlist/performed metadata version links canonical work; prior display history remains |
| Printout outlives current set | Version stamp/checksum and change notice reveal supersession |
| Files changed after package | Hash mismatch; new package required |
| Curfew source changes mid-show | Re-evaluate timeline immediately and require authorized decision/acknowledgment |
| Credential provider/offline lookup unavailable | Signed current offline roster lookup with revocation-age warning |
| Case contains quantity-only assets | Snapshot quantity and custodian; incident cannot invent individual serial identity |
| Safety evidence upload unavailable | Record requirement/action offline, but no accepted state until authoritative upload/actor confirmation |
| Weather alert false positive | Preserve advisory source and human decision; no automated blame |
| Private report subpoena/legal hold | Apply Shard-06/legal retention workflow without broadening ordinary access |

### Two-Implementer Check

Implementations must converge on immutable setlist/packages, separate performed set, range-aware timeline cascades, role-derived advisory credentials, date/case manifest custody, offline versioned day sheet, non-certifying safety states, human weather decisions and private corroborated post-show corrections. Playback engines, public schedules by default, automatic safety calls, compliance labels or single-report source mutation are non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [33-show-day-operations § Contracts](../33-show-day-operations.md#contracts) defines commands/queries and [33-show-day-operations § Event Schemas](../33-show-day-operations.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/33-show-day-operations|Shard 33 — Show-day execution and recovery]]
