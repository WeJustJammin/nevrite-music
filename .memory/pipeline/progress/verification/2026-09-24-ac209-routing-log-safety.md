# AC209 routing diagnostics public-log safety patch

**Date**: 2026-09-24 local
**Scope**: hardening change on branch `codex/ac209-routing-event-diagnostic`,
base commit `e7a709d8`, in the isolated worktree
`/home/rob/.codex/worktrees/ac209-routing-event-diagnostic/WeJammin`. Local
implementation, tests, and validation only: no workflow dispatch, no provider
call, no secret read, no deployment, no email, no queue write, no push, and no
pull request.

**Verdict**: implemented and locally verified. The change is a safety fix to two
diagnostics; it closes no acceptance criterion, produces no provider evidence,
and moves no tracker fraction. AC209 stays open on its existing external gate.
No raw provider text reaches a public CI log or a retained artifact after this
change.

## The defect

Both routing diagnostics published provider-owned label strings verbatim. The
per-event diagnostic printed the provider's `status` and `action` tallies, and the
day-count diagnostic printed its `status` dimension, on the entrypoint summary
line; the same values were written into the retained JSON artifact.

The existing guard bounded those labels to visible ASCII and 256 characters.
That is not a safety boundary: `##[`, `::`, `set-output`, and `@` are all visible
ASCII. GitHub's runner locates the legacy `##[` workflow-command token with an
unanchored substring search, so a provider label containing that token anywhere in
the summary line - not only at the start - was read as a workflow command rather
than as data. A provider label is unvetted text this repository did not write, and
nothing in the provider contract prevents it from carrying personal data.

## The fix

Every provider label is now reduced to a one-way SHA-256 digest before it leaves
the reader frame. Counts are retained, distinct labels stay distinct, and two
reports remain comparable through their digests. No allowlist was introduced:
Cloudflare types `status` and `action` as plain `string` and publishes no value
list for either, so an allowlist would have been invented.

- `infra/workflows/ac209-email-log-safety.ts` (new) owns the digest rule, the
  digest shape, and the closed failure-code narrowing shared by both entrypoints.
- The per-event artifact now carries `labelSha256` tallies instead of `label`
  tallies; the day-count artifact carries `statusSha256` instead of `status`.
- Both entrypoints now print digest tallies on the summary line, and both bound a
  thrown value's `code` to the shared closed vocabulary instead of echoing any
  string a caught value exposed.
- The legacy and current workflow-command forms are covered by RED regression
  tests in `tests/ac209-routing-log-safety.test.ts`, together with a personal-data
  label case and a digest-distinctness case.

## Schema versions

The output semantics changed, so both schema versions moved:
`ac209-email-routing-event-v2` and `ac209-email-routing-day-counts-v2`. A `v1`
artifact already retained is historical evidence of what was observed then and is
NOT rewritten or re-read as if it were digest-shaped; the version literal is what
lets a reader tell the two apart.

## Comment corrections

Three comments overstated what the code does or cited a source that does not say
it. All three are corrected rather than left standing:

- The event contract claimed a one-hour window is "the documented widest span" the
  `*Adaptive` events datasets serve. It is not asserted by any doc; `60 * 60 *
1000` is a repository constant reused so both readings share one span. The
  comment now says that.
- The same contract described correlation as depending on a `digits` field
  reporting `sufficient`. No such field exists here; the report carries
  `messageIdDigestCoverage` with `complete` or `partial`. Corrected.
- The event schema claimed compliance with the 150-line schema cap while being
  over it. The file is now genuinely within the cap, split by shape rather than by
  domain: `ac209-email-routing-event-schema.ts` (141 lines) keeps the input, the
  bounded label tally, and the outcome union, and the new
  `ac209-email-routing-event-report-schema.ts` (81 lines) keeps the report
  envelope. The dependency runs one way, the contract re-exports both so importers
  keep one stable path, and both files describe the single routing-event domain, so
  the "one domain per schema file" wording still holds.

## File-size cap compliance

`extensibility.md` and `patterns.md` cap new files per type. Four new files were
over cap after the safety fix and are split to comply rather than left over cap:

- Schema: 193 -> 141 + new 81-line report schema (both <= 150).
- Utility: the 332-line collector -> 221-line collector plus a new 135-line row
  reader (`ac209-email-routing-event-row.ts`), which owns the row boundary and the
  label/identifier digesting (both <= 300).
- Test: the 478-line collection suite -> 256-line collection file plus a new
  198-line failure-path file, sharing a 60-line
  `tests/ac209-email-routing-event.test-support.ts` helper (the repository's
  existing `.test-support.ts` convention, excluded from coverage; all <= 400).
- Config: the 104-line probe workflow -> 99 lines (blank-line only, structure
  unchanged and still identical in shape to the three sibling AC209 probes).

The split is behaviour-preserving: the AC209 suite still reports the same 452
tests passing, and the hostile-label surface check was re-run against the
refactored tree with zero violations.

The digest comments were also corrected on a substantive point: an unsalted
digest is not secrecy. It suppresses raw text, but a guessable label - which most
of this vocabulary is - can be confirmed by hashing it, so the digest discloses
candidate membership by design. That is stated where the digest is defined and
where the message-identifier digest set is defined.

## Verification performed (first-hand)

- Pinned runtime: Node `22.23.1` and pnpm `11.24.0`.
- RED first: the new suite failed against the pre-change shape (a raw label was
  accepted, no digest existed), then passed after the change.
- Targeted AC209 surface: **34 files / 452 tests passed** (the extra file is the
  split-out failure-path suite; the test count is unchanged).
- Independent hostile-label check: the real collectors and formatters were run
  over `##[add-mask]user@example.com`, `##[set-output name=x]pwn`,
  `::add-mask::secret`, `alice@example.com`, and `subject: private matter`,
  against all four public surfaces (both log lines and both artifact JSON
  serializations). Zero violations: no raw label, no `##[`, and no `::` on any
  surface, with the digests still emitted.
- `pnpm validate` exit 0 on the final tree, under the pinned Node `22.23.1` /
  pnpm `11.24.0` pair, including the full coverage thresholds, browser E2E,
  builds, bundle budget, and the performance smoke.

## Boundaries this change does not cross

No workflow was dispatched, no approval was given, no provider setting was
changed, no email was sent, no queue was written, no deployment or migration ran,
and no secret value was read or printed. No commit was pushed and no pull request
was opened. The change is local work in an isolated worktree.
