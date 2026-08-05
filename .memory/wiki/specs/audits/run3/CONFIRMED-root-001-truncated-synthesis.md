# CONFIRMED — `root#001`: 11 truncated cross-domain syntheses in `ideation-cx.md`

> Verified by direct inspection during run 3, **independently of the adversarial verifier pass**.
> Three independent lines of evidence, all agreeing. Severity: **blocking**.
> Classification: **content regeneration** — the source material exists, the synthesis does not.

## The defect

`ideation-cx.md` § `## 3. High-Confidence Synthesis` (line 270) carries **25** per-domain-pair
`- **Synthesis**:` bullets. **11 of them are cut mid-word.**

| Line | Pair | Cut at |
|---|---|---|
| 350 | 02-03 Credits ↔ Community & Networking | "…routes around **embar**" |
| 356 | 02-04 Credits ↔ Opportunities & Casting | "…taxonomy (02.06, mapped **n**" |
| 362 | 02-05 Credits ↔ Services Marketplace | "…02 carries as **unatteste**" |
| 368 | 02-06 Credits ↔ Education, Lessons & Mentorship | "…08 latency-aware matching (**ins**" |
| 374 | 02-07 Credits ↔ Music Projects & Collaboration | "…session close → credit **claim**" |
| 380 | 02-08 Credits ↔ Real-Time Jamming | "…probable merge. **Near-col**" |
| 386 | 02-09 Credits ↔ Rights & Ownership | "…one capture question **em**" |
| 392 | 02-10 Credits ↔ Royalties & Collections | "…Trigger chain: **02**" |
| 398 | 02-11 Credits ↔ Music Licensing | "…third-party licence **verificatio**" |
| 404 | 02-12 Credits ↔ Release & Distribution | "…authoritatively lifts **embar**" |
| 422 | 02-16 Credits ↔ Venues, Studios & Spaces | "…merge retires an identifier — a **live**" |

## Why this is blocking

`ideation-cx.md` is the **global cross-cut file**. Every downstream pipeline stage reads it to
learn how domains interact — ownership of shared state, trigger chains, permission boundaries,
race conditions. Eleven of its cross-domain contracts stop mid-sentence, and each cut lands
**inside the operative clause**: `:392` is cut at the literal words "Trigger chain: 02", so the
02→10 trigger chain has no content at all.

## Three independent confirmations

**1. The pattern is systematic, not random.** All 11 truncated bullets are **domain-02 pairs**,
forming one contiguous run (02-03 through 02-16). Non-02 pairs in the same section are intact.
That is the signature of an output limit hit while generating one block, not sporadic corruption.

**2. Git holds no complete version.** The truncation is present in **every** revision of the
file, including `f71b1d9` — *the commit that created the section*:

| Revision | Bytes | Synthesis bullets | Truncated |
|---|---|---|---|
| `578dbee` (HEAD) | 162,121 | 25 | 11 |
| `adc142e` | 160,795 | 25 | 11 |
| `4ff98b5` | 160,708 | 25 | 11 |
| `1a5c34c` | 159,599 | 25 | 11 |
| `f71b1d9` *(created the section)* | 156,409 | 25 | 11 |
| `57f4a20` | 141,368 | 0 | — |

The content was **never** complete on disk. This is not recoverable by revert — it must be
regenerated.

**3. The source domain CX does not hold it either.**
`02-credits-attribution/credits-attribution-cx.md` contains only **intra**-domain cross-cuts
(CX-01…CX-18, between 02's own sub-domains) and carries an explicit
`## Cross-Cuts Routed to the Global CX` section at `:333` — cross-domain pairs are routed **up**
to `ideation-cx.md` by design. Its own 19 bullets are clean (0 truncated). Probe searches for
each cut tail across all **190** CX files on disk match only `ideation-cx.md` itself.

**Conclusion: the cut text exists nowhere in the tree.**

## Remediation

Not a text fix — **regenerate the 11 pairwise syntheses** from source: domain 02's features and
sub-domain CX, plus each partner domain's features and CX, following the shape the 14 intact
bullets already establish (State owner / Trigger chain / Permission / Fan-out / Race).

The surviving prefix of each truncated bullet is usable as an anchor — it states the pair's
ownership split before it cuts — so regeneration extends rather than replaces.

This is **not** an owner decision: it is derivable from material already on disk. It is the
largest single remediation item run 3 surfaced.

## Related

`root#002` — the `CX-M##` mechanism identifier space is referenced **983 times across 132
files**, while `ideation-cx.md` § `## 1. Cross-Cut Mechanisms` (which owns the registry)
contains only **2** occurrences of that identifier form. Mechanisms are defined by name and
referenced by number, with no registry binding the two. Verified separately.
