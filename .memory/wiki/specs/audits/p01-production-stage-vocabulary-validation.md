# P-01 Production-Stage Vocabulary Validation

> **Status:** **Gate decided and in force (ledger `r-44[0]` closed 2026-07-22); validation evidence outstanding.** No enum version is approved, and no candidate label is enforceable until this packet records a passing result and explicit product-owner approval. The *decision* is closed; the *evidence* is tracked implementation work.
> **Decision:** P-01 Option B, owner-selected 2026-07-21.
> **Authority:** [Production Stage Board](../ideation/07-music-projects-collaboration/07.01-song-release-production-board/07.01.03-production-stage-board-milestones.md) owns the shared fixed vocabulary and its semantic prompt mappings.

## Locked Contract

One platform-owned, music-specific, non-configurable vocabulary will govern every `Song.current_stage`.
The board remains a projection of that field. Validation may refine candidate labels, definitions, ordering,
and semantic mappings, but may not introduce a user-configurable board, a production-model-specific enum,
a second stage machine, or an unnormalised exception path.

No candidate enum is a lifecycle, prompt, release-readiness, reporting, or migration contract until this
packet records a passing result and explicit product-owner approval of one immutable enum version.

The following remain independent of this gate:

- **P-02 / `r-44[1]`** — resolved independently on 2026-07-21: automatic board presentation at `0–59` authorized visible unique Songs and catalogue-table presentation at `60+`. This gate did not evaluate or select that presentation policy.
- **P-03 / `r-44[2]`** — resolved independently on 2026-07-21: superseded approvals reinstate on re-advance iff no new immutable version landed in between. This gate did not evaluate or select that policy.

## Candidate Version Record

| Field | Required record | Current value |
|---|---|---|
| Candidate version ID | Immutable candidate identifier | Pending practitioner review |
| Ordered stage labels | Exact list and human definitions | Existing draft is evidence only; not approved |
| Initial-stage semantic | First lifecycle state | Pending approved version |
| Approved-master terminal semantic | State required for release readiness | Pending approved version; existing release gate remains semantic only |
| Prompt semantics | Mapping for roster seed, take selection, mix-credit confirmation, split-finality confirmation | Pending approved version; existing prompts remain non-blocking |
| Candidate rationale | Why one shared vocabulary fits every reviewed workflow | Pending practitioner review |

## Practitioner Validation Protocol

### Required Cohorts

| Cohort | Minimum | Eligibility | Evidence |
|---|---:|---|---|
| Beatmaker | 2 | Active practitioner with recurring release/delivery cadence | Three recent representative workflows mapped independently |
| Session player | 2 | Active contributor whose work is contribution-centric rather than full-song lifecycle ownership | Three recent representative workflows mapped independently |

One practitioner cannot satisfy both cohort minima. The packet records no PII; each trace uses a stable
reviewer code and redacted workflow description.

### Mapping Rules

Each practitioner maps every material position in each trace to exactly one candidate stage. For each
mapping, record whether the candidate stage would accurately place the Song and whether its semantic
prompt/release effects are correct. Record every ambiguity, rejected label, mismatch, and proposed
correction with a disposition.

A critical mismatch is one that would misplace a Song, fire a provenance prompt at the wrong moment, omit
a required provenance prompt, or defeat the approved-master release-readiness condition.

### Pass Gate

A candidate passes only when all conditions hold:

1. Both cohorts complete their required mappings.
2. Every reviewed trace maps completely to one shared candidate vocabulary.
3. No critical mismatch remains unresolved.
4. No cohort requires configurable columns, a production-model-specific vocabulary, a second state
   machine, or an unnormalised exception.
5. The product owner explicitly approves one immutable enum version with its semantic prompt and terminal
   mappings.
6. The approval records that P-02's and P-03's independently resolved policies were neither evaluated nor decided by this gate.

A failed or incomplete gate leaves the vocabulary provisional. No source contract, ledger status, release
predicate, or prompt mapping is silently hardened. The failure and next validation iteration are recorded
below.

## Practitioner Trace Register

| Reviewer code | Cohort | Trace ID | Complete mapping? | Critical mismatch? | Findings / disposition |
|---|---|---|---|---|---|
| Pending | Beatmaker | Pending | Pending | Pending | Pending |
| Pending | Beatmaker | Pending | Pending | Pending | Pending |
| Pending | Session player | Pending | Pending | Pending | Pending |
| Pending | Session player | Pending | Pending | Pending | Pending |

## Gate Result

| Field | Result |
|---|---|
| Validation status | Pending — candidate enum remains provisional |
| Approved enum version | None |
| Product-owner approval | Pending |
| P-02 evaluated or resolved by this gate? | No — resolved independently on 2026-07-21 |
| P-03 evaluated or resolved by this gate? | No — resolved independently on 2026-07-21 |
| Next action | Collect required practitioner evidence; then record pass/fail and owner approval. **This is implementation work, not an open product decision** — `r-44[0]` closed on the policy, matching how A-03 and A-04's validation gates were dispositioned. Until it completes, `Song.current_stage` keeps its semantic roles and no draft label is a downstream contract. |
