# Run-2 Blocking Decision Queue

> **Date**: 2026-07-24 · **Source**: fresh audit run 2 (`wf_f5ea9990-b0e`), confirmed findings.
> **Status**: 1 confirmed entry prepared for ratification. The other 3 raw-blocking units (`07.08`,
> `14.06`, `20.01`) had their detail lost to scratchpad cleanup and need the complete verified
> re-run to confirm — do not treat their absence here as "clean."

---

## DQ-R2-01 — Representation edge: reconcile the 7-verb mandate with the 5-domain commercial scope

**Type**: Architecture (data model) — present options, owner picks.

**Headline**: On a representation edge (01.03.02), what is the relationship between the **mandate's
seven activity verbs** (01.03.03 D-01, ratified DQ-02.3: `book / sign / spend / list / release /
settle / administer`) and the **five commercial-domain scope** the same edge names (01.03.02
Behavior: `live booking / recording / publishing / sync / merch`)?

**Why it blocks (confirmed by hand)**: `01.03.02` Behavior line 25 says a representation edge
"carries: **scope (which activities — live booking, recording, publishing, sync, merch)**, territory,
term, **a mandate (01.03.03)**." It names *both* the 5 domains *and* the 7-verb mandate on one edge,
and calls the 5 domains "activities" — colliding with `01.03.03`'s "activity" (the 7 verbs). An
implementer cannot tell whether a representation edge's authority is scoped by the 7 verbs, by the 5
domains, or by both crossed, and the shared word "activities" means two files use one term for two
different sets. The mandate-scope model that the whole Roles & Permissions cross-cut resolves against
therefore has no defined shape for representation edges.

**What is *not* in question** (already ratified): the 7-verb enum itself (01.03.03 D-01), and that
both membership *and* representation edges "carry a mandate" (parent D-01 / 01.03.02 DT-02 — the merge).

| Option | Model | Pros | Cons |
|---|---|---|---|
| **A — Two orthogonal axes, crossed** *(recommended)* | An edge carries a **mandate** (which of the 7 verbs) **and** a **domain scope** (which of the 5 commercial areas), applied as a cross-product: "can `[verbs]` within `[domains]`." Rename `01.03.02`'s "scope (which activities)" → "**domains**" to end the term collision. | Matches `01.03.02` line 25, which already lists *both* on the edge. Verbs (actions) and domains (areas) are genuinely different axes — "a manager can `book` and `sign` (verbs) for `live` and `recording` (domains) but nothing for `publishing`." Membership edges simply carry no domain scope (whole-org). No ratified decision is disturbed; the change is one rename + one confirmed cross-product rule. | Adds a second scope axis to enforce at every representation call site. The cross-cut must resolve `verb ∈ mandate AND domain ∈ scope`. |
| **B — Domains for representation, verbs for membership; no crossing** | Representation is scoped by the 5 domains only; the 7 verbs are a membership-only concept. | Simplest mental model per edge type. | **Contradicted by `01.03.02` line 25**, which explicitly carries "a mandate (01.03.03)" on the representation edge, and by the Happy Path ("act as the artist… replying to booking enquiries, but not signing away masters" — that *is* verb-level scoping on a representation edge). Rejecting verbs on representation edges breaks the manager-can-book-not-sign promise the feature exists to make. |
| **C — Collapse to one vocabulary** | Map the 5 domains into the 7 verbs (or vice versa) so an edge has a single scope dimension. | One list to learn and enforce. | The two are semantically different (area vs action); collapsing loses information — `book` within `live` vs `book` within nothing is the exact distinction a roster needs. No clean mapping exists (publishing is not an action; sign is not an area). |

**Recommendation: A.** It is the only option consistent with `01.03.02`'s own Behavior (both axes
already present) and with the manager-can-book-not-sign product promise, and it disturbs no ratified
decision — the fix is a terminological rename (`01.03.02` "activities" → "domains") plus a one-line
confirmation that a representation edge's effective authority is `mandate-verbs × domain-scope`, with
membership edges carrying verbs only. This is an owner ratification, not a mechanical fix, because it
locks the representation-edge data model that `/create-prd-architecture` and the Roles & Permissions
cross-cut both build on.

**Downstream if ratified**: `01.03.02` Behavior/D-02 (rename + cross-product rule), the Roles &
Permissions cross-cut resolver (add the domain-scope conjunct), `17` (counterparty "can they bind?"
check reads both axes), `04` (agent-acts-for-roster scoping).
