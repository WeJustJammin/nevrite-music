# Credits & Rights Decision Queue

> **Status:** Historical validated draft superseded by [the canonical ideation remediation decision queue](../ideation-remediation-decision-queue.md). Do **not** use this file for current scope, disposition counts, owner decisions, or implementation behavior.
>
> **CQ-02 update:** CQ-02 / `r-19[1]` was ratified **Option B** on 2026-07-20. When otherwise publicly eligible, a retained not-in-final-master credit renders once with the plain-language qualifier `not in final master`; ordinary publication, visibility, embargo, and public-work-identity gates still win. Consult the canonical queue and applied Domain 02 sources for the current contract.

## CQ-01 — Taxonomy-action RBAC grade

- **Entry type:** Ratified architecture decision
- **Affected ledger finding:** `r-09[0]` — verified-fixed after source-contract application.

**Question:** Which RBAC grade governs selecting a taxonomy value and proposing a missing one?

| Option | Pros | Cons |
|---|---|---|
| A. `Read-only` for all four personas | Keeps service taxonomy platform-curated and avoids a taxonomy-proposal write path. | Contradicts the credit-taxonomy experience that lets Musician, Producer, and Operator propose a missing value. |
| B. `Config` for Musician, Producer, and Operator; `Read-only` for Fan | Matches the credit-taxonomy interaction and retains the Fan boundary. | Requires a constrained proposal capability despite platform curation; the RBAC model must distinguish proposal from vocabulary editing. |
| C. A separate `Propose` permission | Makes the distinction explicit: users can request a value but cannot curate or publish it. | Adds a new permission concept and migration surface beyond the existing access-level vocabulary. |

**RATIFIED 2026-07-19:** Option B — Musician, Producer, and Operator have `Config` access only to select a permitted taxonomy value and submit a missing-value proposal; Fan is `Read-only`. Promotion, deprecation, mapping, and vocabulary editing remain exclusive to the external admin/governance role.

- **Applied sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:68`.
  - Service target and parent matrix: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/05-services-marketplace/05.01-service-listings-pricing/05.01.02-service-category-taxonomy-attributes.md` and `05.01-service-listings-pricing-index.md` — aligned Config scope, curation boundary, and resolved Q-08.
  - Credits authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.06-credit-role-instrument-taxonomy.md:20-25,217` — aligned proposal boundary and external vocabulary-edit authority.
- **Replaced interim rule:** A proposal is a constrained Config write to the curation queue, never an edit to vocabulary, and does not block publication.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-01 architecture decision.

## CQ-02 — Public treatment of a comped-out contribution — RESOLVED

- **Entry type:** Historical product-decision record
- **Affected ledger finding:** `r-19[1]`
- **Current classification:** `verified-fixed`; current authority is the canonical queue and applied source contract.

**Question retained for history:** How should a retained not-in-final-master credit appear to visitors?

| Option | Pros | Cons |
|---|---|---|
| A. Do not render it to visitors; retain the owner-only qualified record | Closely tracks a released-master-only public discography. | Erases a real captured contribution from public attribution and leaves the public record less complete. |
| B. Render it with a plain-language `not in final master` qualifier | Retains the contributor's visible credit and makes the delivered-master distinction honest. | Can create a more complex public page and may surprise audiences accustomed to liner-note-only credits. |
| C. Render it without a qualifier | Preserves continuity of public credit display. | Misstates the relationship to the delivered master and defeats the purpose of retaining the qualifier. |

**RATIFIED 2026-07-20: Option B.** When it otherwise passes normal publication, per-credit visibility, embargo, and public-work-identity gates, a retained not-in-final-master credit renders once with the plain-language qualifier `not in final master`. The qualifier neither widens visibility nor changes tier, ownership, rights, registration, royalty, payment, or union treatment. Visitors see neither the owner-only trigger date nor the comp-out reason or delivery history. Domain 10 neighbouring-rights registration remains separately open.

- **Current sources:**
  - Canonical ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md` — `r-19[1]`.
  - Applied target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.02-public-discography.md` — D-15 and resolved Q-07.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.01-credit-record-contribution-ledger.md` — D-09 and narrowed Q-05.
- **Historical draft status:** Superseded; no current interim rule or open CQ-02 visitor-rendering decision remains.

## CQ-03 — Versioned collusion evidence interface

- **Entry type:** Interim-replacement architecture decision
- **Affected ledger finding:** `r-20[2]`
- **Classification:** Architecture — preserve ledger classification `deferred-with-interim-rule`.

**Question:** What versioned evidence interface should ring detection provide to credit-dispute resolution?

| Option | Pros | Cons |
|---|---|---|
| A. Per-edge negative multiplier only | Smallest interface; preserves the established per-edge, non-accusatory model. | Gives adjudication little diagnostic context when deciding whether independent corroboration exists. |
| B. Per-edge multiplier plus a typed `requiresNonTopologicalCorroboration` constraint | Preserves no-score/no-flag/no-auto-escalation boundaries while making escalation requirements explicit and testable. | Requires a carefully versioned contract across domains 02 and 24. |
| C. Per-witness trust score and ring flag | Could make triage appear simpler. | Conflicts with the interim contract; invents a score, exposes a de facto accusation, and permits topology-only exclusion. |

**RATIFIED 2026-07-19:** Option B — `CollusionEvidenceConstraintV1` carries a per-attestation-edge multiplier plus literal `requiresNonTopologicalCorroboration: true`. No witness score, cluster verdict, ring flag, hard exclusion, or topology-only escalation is emitted.

- **Applied sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:83`.
  - Applied target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.05-credit-dispute-resolution.md` — consumes the versioned contract only as an edge weight and requires separate non-topological corroboration for a transition relying on the detection signal.
  - Applied authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.04-attestation-credit-confidence/02.04.04-attestation-ring-collusion-detection.md` — defines the four-field v1 payload and its omissions.
  - Applied due-process boundary: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/24-trust-safety-disputes/24.01-reporting-moderation/24.01.01-report-intake-notice-and-action.md` — factual-dispute lane cannot be created or advanced by topology alone.
- **Replaced interim rule:** Unsupported versions are excluded from confidence calculation and cannot trigger escalation; ordinary dispute filing and resolution on other evidence remain available.
- **Resolution owner / stage:** Owner decision applied; no remaining CQ-03 architecture decision.

## CQ-04 — Traversal presentation of suspected-ring edges

- **Entry type:** Product decision
- **Affected ledger finding:** `r-25[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** How should traversal results present an edge suspected of ring collusion?

| Option | Pros | Cons |
|---|---|---|
| A. Hide the edge | Avoids displaying a potentially tainted relation. | Suppression can tip off an adversary and makes results harder to interpret. |
| B. Mark the edge as suspected | Gives users visible context. | Publicly or privately labelling suspicion can amount to an accusation and defame an innocent participant. |
| C. Show the edge normally while silently applying its existing tier-weight demotion | Preserves a non-accusatory experience and follows the integrity system's invisible per-edge model. | Users cannot distinguish a lower-ranked result from an ordinary low-confidence result. |

**UNRATIFIED recommendation:** Option C — do not hide or mark the edge; preserve the non-accusatory, per-edge demotion already defined for the integrity system.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:90`.
  - Target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.01-credit-graph-discography/02.01.03-credit-search-graph-traversal.md:46,94-95` — tier weighting and Q-03's hide-versus-mark decision.
  - Cited authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/02-credits-attribution/02.04-attestation-credit-confidence/02.04.04-attestation-ring-collusion-detection.md:39,67-69,106-109` — invisible enforcement and per-edge, not cluster, demotion.
- **Current interim rule:** No display policy is resolved. Existing ring detection remains internal and may only silently demote implicated attestation edges; no user-facing accusation is inferred.
- **Owner / stage:** Product owner; `/ideate-validate`.

## CQ-05 — Canonical ownership-ledger ordering key

- **Entry type:** Architecture decision
- **Affected ledger finding:** `r-34[0]`
- **Classification:** Architecture — preserve ledger classification `needs-architecture-decision`.

**Question:** Which immutable ordering key makes the ownership ledger deterministic for downstream cent allocation?

| Option | Pros | Cons |
|---|---|---|
| A. Database insertion sequence | Straightforward within one database instance. | Backfills, imports, migrations, and replicated writes can change order without changing entitlement. |
| B. Ascending party identifier only | Stable and easily auditable for one-row-per-party cases. | Does not order multiple pools, roles, or contribution bases belonging to the same party. |
| C. Explicit composite: pool, party identifier, contribution basis, immutable ledger-row identifier | Deterministic across exports and reruns while distinguishing rows that share a party. | Requires a specified collation and immutable identifier contract. |
| D. Opaque ledger-row identifier only | Stable after creation and simple to implement. | Produces an arbitrary order that is difficult for users and auditors to reason about. |

**UNRATIFIED recommendation:** Option C — an explicit, documented composite avoids retrieval-order dependence while retaining a reviewable rationale for every allocated cent.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:103`.
  - Target and cited authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.02-ownership-ledger-validation.md:82,90,224,242,268,276` — exact rationals and canonical order are required; collation belongs to `/create-prd-architecture`.
- **Current interim rule:** Exact rationals and deterministic ordering remain required, but no ordering field or collation is source-locked. Do not rely on database retrieval order.
- **Owner / stage:** Architecture owner; `/create-prd-architecture`.

## CQ-06 — Majority-by-share consent threshold

- **Entry type:** Product decision
- **Affected ledger finding:** `r-35[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** What share threshold authorizes an action under `majority-by-share`?

| Option | Pros | Cons |
|---|---|---|
| A. Strictly more than 50% of consented ownership share | Gives `majority` its ordinary meaning and blocks 50/50 ties without transferring control. | A 50% owner cannot proceed alone even when the co-owner is inactive. |
| B. At least 50% of consented ownership share | Allows a 50% owner to act. | Treats an equal split as a majority and can override an equally entitled co-owner. |
| C. A higher recorded supermajority, such as two-thirds | Better protects minority owners on consequential actions. | Changes the documented rule's meaning and adds further policy variants. |

**UNRATIFIED recommendation:** Option A — use strict `> 50%`; a tie fails closed, consistent with the source's unanimous-by-default safety posture.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:104`.
  - Target and cited authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.03-master-rights-ownership.md:61-63` — recorded consent-rule variants and unanimous default when parties agree nothing.
- **Current interim rule:** No threshold is inferred for an expressly selected `majority-by-share` rule. Where the parties recorded no rule, the existing default remains `unanimous`; no-recorded-obstacle is not inferred from silence or a tie.
- **Owner / stage:** Product owner; `/ideate-validate`.

## CQ-07 — Default weight for temporally overlapping works

- **Entry type:** Product decision
- **Affected ledger finding:** `r-36[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** What default weight should a mashup receive when its embodied works overlap in time?

| Option | Pros | Cons |
|---|---|---|
| A. Prorate each work by its full overlapping duration, then normalize | Preserves an automatic suggestion. | Normalization changes the apparent contribution of simultaneously audible works and may conceal an arbitrary allocation rule. |
| B. Offer no default; require the declarant to enter exact weights totaling 100% | Avoids pretending that overlapping time determines ownership or allocation. | Adds work during declaration and can slow a common mashup flow. |
| C. Offer equal shares | Simple and comprehensible. | Arbitrarily treats unequal creative or legal contributions as equal. |

**UNRATIFIED recommendation:** Option B — duration proration is meaningful only for disjoint spans; an overlapping mashup should require declared exact weights instead of receiving an invented automatic split.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:105`.
  - Target and cited authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.01-work-recording-duality.md:97-115,225-230` — duration proration default, exact-total requirement, and mashup's dual master/work declaration.
- **Current interim rule:** Multi-work links must use exact rational weights totaling 100%. Duration proration is the stated default for ordinary spans, but no source specifies a computation for simultaneous overlap; do not invent one.
- **Owner / stage:** Product owner; `/ideate-validate`.

## CQ-08 — Writer-name equality for unclaimed-stub auto-merge

- **Entry type:** Product decision
- **Affected ledger finding:** `r-36[1]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** What writer-name equivalence is sufficient to auto-merge two unclaimed work stubs?

| Option | Pros | Cons |
|---|---|---|
| A. Exact stored-string equality only | Lowest chance of false merge. | Fails to merge harmless variants caused by case, spacing, Unicode, or diacritics. |
| B. Canonical text equality: Unicode normalization, case-folding, whitespace normalization, and diacritic folding | Removes routine presentation variance without claiming that different people are the same person. | Can still conflate distinct writers with materially similar names. |
| C. Legal/stage identity resolution | Strongest identity assurance. | Unclaimed stubs commonly lack claimed identities, defeating the anti-proliferation purpose of their safe auto-merge exception. |
| D. Fuzzy-name similarity | Captures abbreviations and spelling variants. | Too aggressive for an irreversible-ish fusion; turns an equality rule into a probabilistic judgment. |

**UNRATIFIED recommendation:** Option B — use deterministic canonical text equality only, retain the existing unclaimed/no-conflict guard, and leave fuzzy or identity-resolution cases as flags rather than automatic merges.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:106`.
  - Target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.01-rights-registry/09.01.01-work-recording-duality.md:176-178,218,273` — auto-merge is limited to unclaimed stubs with non-conflicting asserted facts.
  - Cited authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.04-rights-conflicts-disputes/09.04.01-conflicting-claim-detection.md:60,68,106-107,114` — duplicate handling is precision-first and title-only coincidence never suffices.
- **Current interim rule:** Auto-merge remains limited to unclaimed stubs with non-conflicting asserted facts, with attached recording owners notified. No name-normalization rule is source-locked; do not expand the equality test through fuzzy matching.
- **Owner / stage:** Product owner; `/ideate-validate`.

## CQ-09 — v1 territory and fact scope for term and moral-right status

- **Entry type:** Product decision
- **Affected ledger finding:** `r-40[0]`
- **Classification:** Product — preserve ledger classification `needs-product-decision`.

**Question:** What territory and death-date coverage should v1 support for copyright-term and moral-right status?

| Option | Pros | Cons |
|---|---|---|
| A. US-first: support United States status from participant and estate records; show unavailable historical facts as unknown | Matches the confirmed primary market and limits initial legal-data scope. | Does not provide reliable answers for artists, authors, or uses centered in other territories. |
| B. US plus selected moral-rights territories such as France, Germany, and the United Kingdom | Captures the contrast between non-waivable, waivable, and limited moral-right regimes. | Introduces multiple legal frameworks and historical-data obligations before the platform has a global launch commitment. |
| C. Global, per-territory status wherever source data is available | Closest to the sources' territory-aware model. | High accuracy and data-provenance burden; partial coverage can be mistaken for a complete legal answer. |

**UNRATIFIED recommendation:** Option A — use the confirmed US-first launch boundary, preserve territory as an explicit model dimension, and show unknown or out-of-scope death-date and moral-right facts as unknown rather than fabricating a global answer.

- **Exact sources:**
  - Ledger: `/home/rob/Projects/WeJammin/.memory/wiki/specs/audits/remediation-state.md:110`.
  - Cross-cut target: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.03-chain-of-title-lifecycle/09.03-chain-of-title-lifecycle-cx.md:13-14` — death date is rights-critical and moral rights do not travel with transfers.
  - Term authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.05-copyright-term-public-domain.md:37,49-50,58,72-73,80,85,97,107` — term status is per territory, shown with inputs, and death-date coverage is an open product choice.
  - Moral-rights authority: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/09-rights-ownership/09.03-chain-of-title-lifecycle/09.03.06-moral-rights-attribution.md:16,23,31,41,48,56,58,104` — rights persist differently by territory and waivability scope is open.
  - Market constraint: `/home/rob/Projects/WeJammin/.memory/wiki/specs/ideation/meta/constraints.md:248-254` — confirmed United States-first primary market and later-market decision.
- **Current interim rule:** Display determinate term status only with its inputs and territory scope; display unknown territories or unknown death dates as unknown, not omitted. Chain-of-title records must not treat transferred economic rights as moral-right transfers; the product scope remains unresolved.
- **Owner / stage:** Product owner; `/ideate-validate`.

## Coverage mapping

Each requested input row is mapped exactly once below. Mentions earlier in the document identify an entry's affected finding and do not create additional coverage mappings.

| Input ledger row | Queue entry |
|---|---|
| `r-09[0]` | CQ-01 |
| `r-19[1]` | CQ-02 |
| `r-20[2]` | CQ-03 |
| `r-25[0]` | CQ-04 |
| `r-34[0]` | CQ-05 |
| `r-35[0]` | CQ-06 |
| `r-36[0]` | CQ-07 |
| `r-36[1]` | CQ-08 |
| `r-40[0]` | CQ-09 |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-09|D-09]]
