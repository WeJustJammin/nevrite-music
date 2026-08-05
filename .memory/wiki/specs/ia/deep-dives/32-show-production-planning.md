# Deep Dive 32 — Event production planning and advancing

**Status:** Complete
**Parent:** [[specs/ia/32-show-production-planning|Shard 32]]

## Overview

This deep dive closes layered rider truth, privacy-scoped production sharing, pooled capability allocation, checklist causality and post-freeze acknowledgment.

## Interactions

### Rider and Production Plan

1. Resolve immutable layers in order: template, act, tour, date override, bilateral redline.
2. Author typed requirement with strictness/substitution/negotiability/verification, supply expectation and provenance.
3. Import may create draft rows only; human confirms each row before diff.
4. Person-owned access requirement never enters technical/hospitality prose. Recipient grant controls exact disclosed content.
5. Hospitality derives quantities from party size; aggregate dietary classes by default, with severe instructions disclosed only to explicitly consented operational recipient.
6. Stage sources/positions create structured 2D plan; drawing is render. Input rows derive from sources, with only patch address venue-writable.
7. Monitor mixes bind channels to person/position and equipment expectations; relative levels stay soundcheck notes.

### Diff and Allocation

1. Pin rider, stage/input, act manifest, room spec/freshness and bill allocation versions.
2. Net act-supplied manifest into remaining venue footprint/power requirement; never erase requirement provenance.
3. Compare typed attributes and strictness predicates. Model-name similarity and holistic PA verdicts are forbidden.
4. Produce `match`, `shortfall` or `unknown` plus basis, caveats, confidence, severity and judgement flag.
5. Caveated match becomes actionable row. Stale hard field demotes match to unknown.
6. Inverted pass emits every venue constraint relevant to date even if rider omits it.
7. Pooled resources require explicit production allocation across bill; exhaustion identifies affected acts/items.

### Advance and External Collaboration

1. Generate checklist only for shortfalls, unknowns, near matches, judgement and declared source requirements.
2. Compute urgency from item lead time and show date; severity derives source/strictness, not editor opinion.
3. Assigned side responds with answer/evidence; other side counter-confirms.
4. Scoped external link permits exact read/answer projection and records source note. It cannot browse or alter authority.
5. No-account answer may complete normal items; sensitive disclosure and binding redline still require authenticated owner consent.
6. Email parsing is disabled; email carries live link only.

### Freeze and Change Control

1. Freeze pins event, rider, diff, checklist, allocation and sheet versions.
2. Open hard items block ordinary freeze; authorized override requires reason and visible unresolved list.
3. After freeze, every delta appends successor with author, reason, affected rows and deterministic criticality.
4. Critical if inside configured day-of window, changes when a person acts, or changes who is expected.
5. Notify affected roles and track delivery/view/acknowledgment. Critical state clears only on required acknowledgments or governed supersession.
6. Change never blocks operational reality; lack of acknowledgment remains prominent and auditable.

## Contracts

### Rider Requirement

```text
RiderItem = {
  category,
  typed_requirement,
  supply: act | venue | production | third_party,
  strictness: hard | preferred | informational,
  substitution: exact | equivalent_attributes | none,
  negotiability: bilateral | person_only | non_negotiable,
  verification: confirmed | unconfirmed_import | stale,
  provenance,
  effective_version
}
```

Category policy can set minimum floors and defaults through versioned settings. Free text never carries access/medical content and never participates in matching.

### Diff Result

```text
DiffRow = {
  requirement_ref,
  result: match | shortfall | unknown,
  basis,
  caveats[],
  confidence,
  source_age,
  severity,
  judgement_required,
  allocation_ref?,
  checklist_item_ref?
}
```

No score, pass/fail or suitability verdict exists. `match` rows collapse visually but remain inspectable.

### Sensitive Disclosure

Grant binds person, recipient natural/party role, exact fields, event/purpose, expiry and revocation epoch. Aggregate dietary output follows counsel-approved minimum grouping; when aggregation would identify a person, venue receives safety class plus direct restricted instruction only through consented recipient.

## Data Models

### Layer and Overlay Rules

- Template/fork is copy-on-create and never live-syncs.
- Act/tour/date override is unilateral owner configuration.
- Redline is bilateral date overlay and cannot mutate base rider.
- Shard-30 accepted contract references exact rider version; later production change does not alter commercial incorporation automatically.
- Commercial content routes Shard 30; access content routes person grant.

### Checklist Causality

Every generated item stores source type/ref/version, deterministic severity, lead-time policy, owner/counterparty and clear condition. Source change recomputes rather than edits item. Manual item has author/reason and cannot masquerade as diff/compliance source.

### Freeze Lineage

Freeze stores complete hash and open-item exceptions. Successors form append-only chain. Sheet URL resolves current authorized projection while each artifact/hash remains retrievable and announces supersession.

## Access Control

- Producer owns act rider document and freeze proposal; members/crew own assigned sections/person defaults.
- Person alone grants access-rider disclosure; act/TM cannot broaden it.
- Show producer allocates pooled resources and controls bill operational projection, not private act sections.
- Venue patch access is column-scoped and cannot alter source/channel requirement.
- External link uses opaque high-entropy token, bounded scope/expiry, optional verified-recipient challenge and complete audit.
- Privacy/counsel gate can disable exact sensitive sharing without disabling non-sensitive advancing.

## Accessibility

- Structured list is source of truth; canvas supports keyboard position controls and equivalent coordinate table.
- Generated plots include item labels, dimensions, reading order and text collision/clearance report.
- Checklist sort can be urgency or severity and exposes both values in text.
- External link is responsive, screen-reader tested and requires no inaccessible PDF action.
- Acknowledgment target and consequence are stated before action; live updates do not steal focus.
- Sensitive grant flows minimize repeated disclosure and support accessible consent review/revoke.

## Event Schemas

### Ordering and Idempotency

All imports, version writes, diff runs, responses, freezes, changes and acknowledgments use stable idempotency keys.

| Race | Resolution |
|---|---|
| Rider update vs diff | Diff pins version; newer rider emits stale-diff successor request |
| Two bill allocations | Expected pool version serializes; loser receives current allocation |
| External answer vs authenticated answer | Both append; counter-confirmation resolves contradiction |
| Freeze vs answer | Aggregate lock either includes answer or returns stale freeze |
| Change vs acknowledgment | Ack binds change version; successor requires new affected acknowledgments |
| Grant revoke vs sensitive read | Revocation epoch checked at read; future read fails |
| Booking postponement vs sheet render | Event version changes date and supersedes sheet; no silent reuse |

### Critical Change Fan-Out

Event carries changed fields/rows, reason, criticality rule version and recipient role refs, never sensitive values. Recipient projection fetches authorized detail. Retry continues until acknowledged, superseded or configured escalation ends; delivery alone never equals acknowledgment.

## Edge Cases

| Failure | Deterministic recovery |
|---|---|
| Template policy changes | Existing rider/date stays pinned; owner explicitly adopts new template |
| Imported row conflicts with authored row | Import remains draft evidence and never overwrites |
| Stage plot visual overlap | Structured collision report names items; author adjusts list/coordinates |
| Venue claims equivalent model | Compare typed attributes; unknown attributes remain unknown |
| First-hand venue history conflicts | Diff cites stronger source for date while Shard-29 contest handles registry |
| Sensitive requirement needed after consent revoke | Mark advance impacted and request new lawful operational route; do not retain hidden copy |
| External token leaks | Revoke epoch immediately; audit accesses and issue replacement |
| Freeze override abused | Immutable reason/open items visible to all authorized parties and downstream operations |
| Day-of edit offline | Save local draft/time; server order and revalidation control publication |
| Event cancelled/postponed | Preserve plan history; successor date reuses only through explicit override/version |

### Two-Implementer Check

Implementations must converge on structured canonical production data, immutable rider layering, person-owned sensitive disclosure, three-way nonblocking diff, explicit bill allocation, causally generated checklist, counter-confirmation, scoped external answering, versioned freeze and acknowledgment-gated critical changes. PDF-first, score-based, email-parsed, silent overwrite or delivery-equals-acknowledgment implementations are non-conformant.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [32-show-production-planning § Contracts](../32-show-production-planning.md#contracts) defines commands/queries and [32-show-production-planning § Event Schemas](../32-show-production-planning.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | `/decompose-architecture-validate` | All |
| 2026-08-03 | Completed deepening and adversarial convergence | `/write-architecture-spec-deepen` | All |


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/32-show-production-planning|Shard 32 — Event production planning and advancing]]
