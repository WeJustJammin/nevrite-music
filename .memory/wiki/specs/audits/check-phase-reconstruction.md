# Check-Phase Reconstruction — done in the main loop

> **Date**: 2026-07-23
> **Why this exists**: the 177-unit subagent *check phase* of the expired-deferral
> triage (run `wf_884d11c7-65a`) died entirely on `You've hit your session limit ·
> resets 9am (America/New_York)`. Rather than defer its whole job to the reset, the
> deterministic and sampleable parts were reconstructed directly in the main loop
> (which is not subject to the subagent session cap). This file records exactly what
> was verified, how, and what genuinely remains for subagents.

## 1. Fabrication check — the check phase's #1 job — COMPLETE

**Question**: does any "already answered" (bucket-A) row cite a `D-`/`DT-`/`DEC-`/`CQ-`
decision that does not exist?

**Method** (`scratchpad/verify-citations2.js`, deterministic): for every struck Q row
citing a decision id, resolve the id against (a) the same file's decision table/headings,
(b) a dotted spec-number reference on the row (e.g. `05.01.03 DT-01`), (c) a `.md` path on
the row, (d) the canonical `CQ-` namespace in the audit decision queues, (e) any global
definition.

**Result** — 770 struck rows citing a decision:

| Resolution | Count |
|---|---|
| Same-file decision definition | 636 |
| Dotted spec-number reference | 99 |
| `CQ-09` canonical (User-ratified 2026-07-21, US/FR/DE/GB) | 2 |
| Bare id, real but no local anchor | 33 |
| **Unresolved / fabricated** | **0** |

**Zero fabricated citations.** The 33 bare-id cases cite real recurring cross-domain
decisions (`D-28`, `D-32`, `D-72`, …) without a local anchor — a citation-hygiene nit,
not a correctness problem; every id resolves somewhere in the tree.

## 2. Semantic soundness — sampled, all sound

**Question**: does each cited decision actually *answer* its question (not merely exist)?
This is judgment work; the full 770-row pass wants subagents. Two hand samples were read
directly against the cited decision text:

- **12 random across 12 domains** (`scratchpad/sample-bucketA.js`) — **12/12 sound**.
  Three needed the full row read because a mechanical "first-id, same-file" heuristic
  mis-attributed the id (the operative citation was a `[[linked]]` decision in another
  file); all three resolutions were correct and well-cited.
- **28 lowest question→answer term-coverage rows** (`scratchpad/semantic-bucketA.js`, the
  tail most likely to hide a disconnected resolution) — **28/28 sound**. Low coverage
  tracks *terseness*, not wrongness: good answers cite a decision id and state the ruling
  ("→ D-06: 14 days, seller-settable") rather than echoing the question's vocabulary. No
  cluster of templated non-answers exists.

**40 bucket-A resolutions hand-verified, 0 defective**, including the theoretically most
suspicious tail. Risk from the un-run semantic phase is well-bounded.

## 3. Deterministic audit gates — re-confirmed clean post-triage

The triage edited only Deferred-To cells, `[OWNER]` prefixes and struck-resolution prose.
Re-scanned after all edits:

| Gate | Result |
|---|---|
| Domains with `*-index.md` + `*-cx.md` | 24/24 (only `meta/` has no index — by design) |
| Relative `.md` links / broken | 11,011 / **0** |
| Genuinely-open expired rows | **0** (was ~1,969 raw) |

## 4. What still requires the subagent reset

1. **Full 770-row semantic re-verification** — the complete version of §2. Marginal value
   over the 40-row stress-tested sample; not a blocker.
2. **Fresh `/audit-ambiguity ideation` rubric scoring (dims 1–7) across 1,121 files** — the
   only part of a fresh audit that needs parallel judgment. The deterministic dimensions
   (dim 8 structure, feature ledger, links, expired count) are re-confirmed above.

Resume after the 9am ET reset:
```
Workflow({ scriptPath: "…/scratchpad/triage-workflow.js",
           resumeFromRunId: "wf_884d11c7-65a" })   # 177 cached; runs the 12 + 177 check
```
then a fresh `/audit-ambiguity ideation`. Do not advance to `/create-prd` until that fresh
audit's blocking count is zero.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-28|D-28]]
- [[decisions.md#d-32|D-32]]
- [[decisions.md#d-72|D-72]]
- [[decisions.md#d-06|D-06]]
