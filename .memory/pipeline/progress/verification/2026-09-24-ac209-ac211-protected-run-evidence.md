# AC209 routing day-count probe, AC209 email diagnostic, and AC211 2026-09-23 collection - protected run evidence

**Date**: 2026-09-24 (local)
**Scope**: documentation only. This record persists the redacted results of three
protected production runs that were already dispatched and completed, plus the
observed status of the Cloudflare support case. It changes no code, contract,
migration, workflow, secret, deployment, or provider state, and it moves no
tracker count.

**Verdict**: the AC209 Email Routing day-count probe
[36067233068](https://github.com/WeJustJammin/wejammin/actions/runs/36067233068)
succeeded and retained a redacted artifact: the Email Routing dataset reports
**9 delivered routing rows across 4 days** in the 31-day window, while the Email
Sending dataset still reports **zero**. That is a genuine provider reading and
still **not acceptance**: the aggregated rows carry no per-message identity, so
none of them can be attributed to the 2026-09-22 delivered control alert, and the
absence of Email Sending telemetry is unresolved. The latest completed AC211
collection
[36038007951](https://github.com/WeJustJammin/wejammin/actions/runs/36038007951)
passed preflight and failed closed on the sample-sufficiency gate with **all zero
eligible samples and no artifact** for the complete 2026-09-23 UTC day. AC209 and
AC211 stay open. The bounded read-only email diagnostic
[36069837542](https://github.com/WeJustJammin/wejammin/actions/runs/36069837542)
then queried the Email Sending node over the exact hour of the verified send and
returned `settings=available` with `rowsReturned=0` and classification
`zero_rows`. That clears the provider permissions, scope, and query-shape
condition - the earlier `provider_graphql_error` does not reproduce - while
establishing **no** correlated Sending telemetry and no delivered
`dlq_nonempty` row. A fresh email exercise stays deferred until the evidence path
can return a row for a known-delivered send.

## Status totals (unchanged)

Slice 09 remains **279/282 active** (**283 authored IDs**), Phase 2 remains
**8/17** with **1,999/2,000 active criteria**, Slice 10 remains locked on
AC209/AC211/AC265, and AC266 remains owner-deferred and unchecked. No criterion
is marked passed, waived, simulated, or inferred by this record.

## AC209 - protected Email Routing day-count probe (run 36067233068)

The live diagnostic added in PR #105 was dispatched read-only from exact `main`
`20338c72ef9f5924f5f2a7ce82c12122aa84c46a` at `2026-09-24T22:24:21Z`
(`run_attempt=1`, `workflow_dispatch`, conclusion **success**). Preflight job
`107859720104` verified the `CONFIRM_DAY_COUNTS_PROBE=true` intent, that the ref
was `refs/heads/main`, and that `SOURCE_REVISION` equals the dispatched SHA; probe
job `107859752084` then issued exactly one provider query and uploaded its
artifact.

- Retained redacted artifact: `production-ac209-routing-day-counts-20338c72ef9f5924f5f2a7ce82c12122aa84c46a`
  (artifact `10836324426`, created `2026-09-24T22:25:23Z`, **7-day** retention,
  so it expires `2026-10-01T22:25:22Z`). GitHub reports the artifact as a
  **582-byte ZIP** archive. The digest is computed over the uncompressed JSON
  bytes the entrypoint wrote - **967 bytes** - not over the ZIP archive:
  `sha256:95e3cc7378a1d3128ff7660bdf842808a175fc6c52fff07b0f522249b7a88c3a`,
  recomputed locally over those uncompressed bytes and identical to the
  `sha256=` value in the probe log line.
- Report identity: schema `ac209-email-routing-day-counts-v1`,
  `diagnosticOnly: true`, `environment: production`, dataset
  `emailRoutingAdaptiveGroups`, one inclusive 31-day window
  `2026-08-25..2026-09-24`, `probedAt 2026-09-24T22:25:22.303Z`,
  `pageComplete: true`, `observation: 'provider_reported_grouped_totals'`,
  `sampling: 'provider_may_sample_adaptive_dataset'`. The zone binding is the
  one-way digest `zoneTagSha256=94385f2a214a04825b578eb135b368882d2ffd10898dfb0988a3a6c5c1b00c98`;
  no raw zone, address, subject, provider message identifier, routing rule, or
  token is retained.
- Provider-reported groups, exactly as reported and never re-derived:

| UTC date   | status    | count |
| ---------- | --------- | ----: |
| 2026-09-22 | delivered |     1 |
| 2026-09-12 | delivered |     4 |
| 2026-09-11 | delivered |     3 |
| 2026-09-05 | delivered |     1 |

- Totals as reported: `reportedTotalCount: 9` across `distinctDays: 4`.

What this establishes: the Email Routing dataset for the requested zone is
populated and serves grouped day counts, so it is not a zone-wide missing
dataset. What it does **not** establish, stated to prevent an inference the data
cannot support:

1. **No attribution.** These are aggregated counts with only `date` and
   `status` dimensions. The diagnostic deliberately reads no per-event identity,
   so the single `2026-09-22 / delivered` row **cannot** be attributed to the
   control alert that the mailbox received at approximately
   `2026-09-22T20:22Z`. The date coincidence is correlation, not proof.
   Cloudflare documents a specific hazard for outbound mail sent through the
   Worker `send_email` binding: those messages "appear in the Email Routing
   summary as `dropped`, even when they were delivered successfully", and
   outbound send success must be tracked with Email Sending metrics and logs
   instead
   (https://developers.cloudflare.com/email-service/platform/limits/#emails-sent-from-workers).
   The `delivered` label therefore cannot be treated as a reliable outbound
   success signal in either direction - a routing row does not prove our send
   and its absence would not prove failure - which makes the date overlap
   weaker still, and confirms Email Sending telemetry as the only correct
   outbound source.
2. **No sampling guarantee.** `emailRoutingAdaptiveGroups` carries the
   `Adaptive` suffix, so the provider may serve these counts from a sample:
   they are provider-reported estimates, not an audited event ledger. Cloudflare
   documents this at
   https://developers.cloudflare.com/analytics/graphql-api/sampling/.
3. **No Email Sending explanation.** This dataset is Email **Routing**. The
   Email **Sending** dataset (`emailSendingAdaptive`) is a different node and
   still reports zero rows in both a recent 24-hour window and the wide 30-day
   window, as recorded from the earlier presence probe
   [36059761536](https://github.com/WeJustJammin/wejammin/actions/runs/36059761536)
   (`sending_recent24h=0`, `sending_wide30d=0`, `sending=zone_wide_missing`).
   The diagnostic below then queried that node directly, succeeded, and also
   returned zero rows over the send hour - so the dataset is provably queryable
   and provably empty, and the absence is not an authorization or query fault.

The AC209 delivery gate needs one uniquely correlated provider event plus a
delivered `dlq_nonempty` alert row for the exact release, retained with an
exercise artifact. A grouped routing count closes none of that, and AC209 remains
open.

## AC209 - protected email-visibility diagnostic (run 36069837542)

The read-only diagnostic introduced by PR #96 (`795efa62`) and dispatched from exact `main`
`20338c72ef9f5924f5f2a7ce82c12122aa84c46a` at `2026-09-24T22:52:41Z`
(`run_attempt=1`, `workflow_dispatch`, conclusion **success**). Preflight job
`107867967834` verified the confirmation flag, `refs/heads/main`, and
dispatch-SHA equality, then confirmed live production environment protection;
diagnose job `107867998175` re-verified the checked-out revision, confirmed a
clean tree before secret use, and ran one bounded read-only query. It sent no
email, changed no queue or production state, and performed no deployment.

This answers a question the earlier probes could not: the presence probe
`36059761536` rested on an `events` query with `limit: 1`, so it could only show
that the dataset returned no row. This diagnostic re-queries the same
`emailSendingAdaptive` node over the exact hour of the verified send.

- Window: inclusive `2026-09-22T20:00:00Z` to `2026-09-22T20:59:59Z`. The
  verified control alert was sent and received at approximately
  `2026-09-22T20:22Z`, so the window contains the send.
- Retained redacted artifact:
  `production-ac209-email-diagnostic-20338c72ef9f5924f5f2a7ce82c12122aa84c46a`
  (artifact `10837384534`, created `2026-09-24T22:55:00Z` for run
  `2026-09-24T22:52:41Z`-`2026-09-24T22:55:06Z`; **7-day** retention, expiring
  `2026-10-01T22:54:59Z`). GitHub reports it as a **620-byte ZIP** archive.
  The digest is computed over the uncompressed JSON bytes the entrypoint wrote
  (**1,109 bytes** including its trailing newline), not over the ZIP archive:
  `sha256:efe7a2ee6b6be762eec5a936d4c82f22d5a17393e67ff6fc7b53a94a2e58c177`,
  recomputed locally over those uncompressed bytes and identical to the
  `sha256=` value in the diagnostic log line, which reads
  `AC209_EMAIL_DIAGNOSTIC settings=available window=zero_rows`.
- Report identity: schema `ac209-email-diagnostic-v1`, `diagnosticOnly: true`,
  `environment: production`, `sourceRevision: 20338c72ef9f5924f5f2a7ce82c12122aa84c46a`.

### What it read

`settings` came back `available` with `enabled: true`,
`requiredFieldsAvailable: true`, `requiredFieldsMissing: 0`, and
`availableFieldCount: 23`. The window query came back `available` (not
`unavailable`) with `rowsReturned: 0` of any kind: `uniqueReturnedMessageIds: 0`,
`withinWindowRows: 0`, `outsideWindowRows: 0`, `senderMatches: 0`,
`recipientMatches: 0`, `subjectMatches: 0`, `identityMatches: 0`,
`deliveredCount: 0`, `terminalCount: 0`, `matchedRows: 0`, and
`duplicateMessageIds: 0`, with `pageFull: false` and `pageTruncated: false`.
Classification: **`zero_rows`**.

### What this clears

The provider call itself is healthy. `settings=available` and a window
`status: available` mean the query succeeded and returned a well-formed
envelope; the `unavailable` branch carries a closed provider code and was not
taken. `zero_rows` is also the classification the code reaches only after the
page, duplicate, match, identity, and terminal-status gates all pass on a
successful response. The previous `provider_graphql_error` on
`emailSendingAdaptive` - including the `35612514031` failure recorded below - is
therefore **not** reproduced, and neither is a permissions, scope, or query-shape
fault. That is a real advance over the presence probe `36059761536`, which could
only show absence via a `limit: 1` events query rather than a shaped,
non-truncated, zero-row window.

### What this does not establish

1. **No correlated Sending telemetry.** `zero_rows` means the Email Sending
   dataset holds no event for the hour containing the verified send. It does not
   show the event was ingested and then withheld, and it does not show the send
   was absent - the mailbox receipt independently confirms delivery. The
   dataset simply carries nothing for that window.
2. **No delivered `dlq_nonempty` row.** The AC209 gate needs a delivered alert
   row for the exact release, with unique provider-to-database correlation and a
   retained exercise artifact. `deliveredCount: 0` and `terminalCount: 0` are the
   opposite of that.
3. **Nothing about the routing counts.** This is the Email Sending node, not
   Email Routing, so it neither supports nor contradicts the 9-row routing
   reading above.

AC209 stays open. Because the evidence path still cannot return a row for a
known-delivered send, a fresh protected email exercise would produce another
zero reading rather than a receipt, so it is deferred until the path works.

### Boundary against the routing reading

These are two different provider datasets answering two different questions, and
neither substitutes for the other. The routing probe shows the Email **Routing**
node is populated (9 delivered rows across 4 days, unattributable); this
diagnostic shows the Email **Sending** node is queryable and holds zero rows for
the send hour. Together they locate the gap precisely: the query path works and
the sending dataset is empty, so the missing piece is ingestion of sending
events, not authorization and not query construction.

### Corroboration: Cloudflare dashboard (read-only, subordinate)

The Cloudflare dashboard for Email Sending on `alerts.wejamm.in` was read
read-only in Chrome on 2026-09-24 and is consistent with the diagnostic. It is
**corroboration only** and is not acceptance evidence, because a dashboard view
carries no artifact, digest, or authenticated provenance.

Observed: configuration summary **Sending status Enabled** and **DNS records
Configured**; **daily sending quota 0 / 200 today**; Analytics over **Last 7
days** shows **No data available**; the Activity log over **Last 24 hours** shows
**No activity found**; and Next Steps still offers **Send your first email**.
Bounce, spam-complaint, and spam-rejection rates all read `0.00%`.

Two readings to avoid. First, the dashboard also renders **Delivery rate
`100.00%` 7d / 24h**, but that figure is shown together with `No data available`,
so it is a no-data presentation and **not** evidence that anything was delivered;
reading it as a success rate would invert its meaning. Second, a dashboard
showing no activity does not establish _why_ - it is consistent with the
diagnostic reading and with several configurations, so no root cause or
product-identity conclusion is drawn from it here.

## AC211 - complete 2026-09-23 UTC-day collection (run 36038007951)

Collection [36038007951](https://github.com/WeJustJammin/wejammin/actions/runs/36038007951)
was dispatched from `main` at
`219291762072fc9eda6441292ade16e6095b45c0` (`run_attempt=1`, conclusion
**failure**) at `2026-09-24T17:58:31Z`. That revision is the promoted
queue-analytics row-shape fix, which is an ancestor of current `main`.

- Requested evidence: `UTC_DAY=2026-09-23`, window
  `2026-09-23T00:00:00.000Z` to `2026-09-24T00:00:00.000Z`,
  `QUERY_ID=wejammin-ac211-20260923`, `SOURCE_REVISION=c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`,
  `PRODUCTION_DEPLOYMENT_ID=6417116181`, `PRODUCTION_DEPLOYED_AT=2026-09-13T03:07:54.000Z`.
  The selected production Worker is unchanged: deployment `6417116181` still
  serves `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2` (created
  `2026-09-13T03:06:08Z`), so there is no production drift to account for.
- Preflight job `107762837413` succeeded and printed
  `content_schema_registry_slo_source=passed`, confirming the source and
  deployment identity before any secret use.
- Collect job `107763104257` failed. Redacted diagnostic output, quoted
  verbatim: `{"diagnosticOnly":true,"counts":{"dataset":1,"registry":0,"productionRegistry":0,"releaseRegistry":0}}`
  and `{"collectorVerdict":"accepted","diagnosticOnly":true,"dlqMessagesClass":"within_provider_cap","envelope":"rows","queueAttemptsClass":"within_provider_cap","rejectedRowCount":0,"rowCount":0,"rows":[],"rowsTruncated":false,"summaryGate":null}`.
- Failure line, verbatim: `AC211 production samples are insufficient
(commands=0, protectedRpcs=0, acceptances=0, queueFirstAttempts=0).` The
  contract floors are **200** for commands, protected RPCs, and acceptances, and
  **1** for queue first attempts, so every floor was missed by the full margin.
- Retained artifacts for this run: **none** (`0` artifacts). No SLO verdict, no
  report, and no retained UTC-day evidence exists.

Read precisely: the Sep 23 queue-analytics envelope was accepted as
`rows` with `rowCount=0`, so that day carried no queue-analytics rows at all -
this run did not exercise the malformed-row path that commit `21929176` fixed,
and it produces no evidence about that fix either way. The blocker is genuine
production volume, not a parser rejection. AC211 still needs one **complete UTC
day** that meets every sample floor and all five SLO thresholds, retained; no
such day exists, and **no synthetic volume was created or proposed**.

## Cloudflare support case status (observed 2026-09-24)

Case [02343626](https://www.support.cloudflare.com/s/case/500Nv00000jYwsWIAS)
(`500Nv00000jYwsWIAS`) was read live in Chrome during this pass:

- Status **New**, priority Low, domain `wejamm.in`, owner-approved contact,
  created `2026-09-24 14:17 EDT` (`2026-09-24T18:17Z`), last modified
  `2026-09-24 14:28 EDT` (`2026-09-24T18:28Z`).
- No support response is visible in the case feed, and the last-modified
  timestamp is **earlier than the 22:24Z probe**, which is consistent with no
  agent activity since submission.
- The case body is the owner-approved redacted version: parent zone and sending
  domain, the observed `0`-row windows, the `zone_wide_missing`
  classification, and the "No activity found for Last 30 days" Email Sending
  Activity reading. It states explicitly that no token, message body, recipient
  address, or private key is included.

Nothing about case status closes an acceptance criterion; it is recorded so the
next pass does not have to re-derive it, and it must be re-checked before any
conclusion is drawn from it.

## Tracker surfaces touched

- `.memory/pipeline/progress/verification/2026-09-24-ac209-ac211-protected-run-evidence.md`
  - this record (new).
- `.memory/pipeline/progress/slices/phase-02-slice-09.md` - the
  "Blocking release evidence" section now reflects the runs above. Its policy
  statements are untouched: Slice 09 stays **279/282 active** (**283 authored
  IDs**), Slice 10 stays locked **only on AC209, AC211, and AC265**, and AC266
  stays owner-deferred and mandatory for post-Phase 2
  production-readiness/release.
- `.memory/pipeline/progress/memory/blockers.md` - the active
  `P2-S09 external release evidence` blocker now cites the latest AC209 and
  AC211 runs instead of the superseded `35612514031` / `35673313035` pair, and
  the CP-04b entry in the same file now marks its `35612514031` line as
  historical and points here.
- `.memory/pipeline/progress/sessions/2026-09-24.md` - appended session entry.
- `.memory/pipeline/progress/slices/phase-02-slice-09.md` AC209 bullet - adds
  this diagnostic and the deferred-exercise note; the AC211 bullet, every
  count, and the Slice 10 / AC266 policy sentences are untouched.
- `.memory/pipeline/progress/spec-pipeline.md` - the AC209 and AC211 evidence
  blocks are relabeled `HISTORICAL` / `HISTORICAL (superseded)` and point here;
  no count or gate statement changed.
- `.memory/pipeline/progress/index.md` - the CP-04e checkpoint no longer
  presents `35673313035` as current and points here for the current results.
- `.memory/pipeline/progress/phases/phase-02.md` - the CP-04b checkpoint now
  marks its AC209 `provider_graphql_error` line as historical and points here.

The slice header and every published count in `index.md`, `spec-pipeline.md`,
and the phase file are deliberately unchanged, because no slice, phase,
promotion, or criterion status moved. The relabeled sentences above carry no
counts; they only stop presenting superseded runs as current.

## Boundaries this record does not cross

No workflow was dispatched by this pass, no approval was given, no provider
setting or secret was changed, no email was sent, no queue was written, no
deployment or migration ran, and no identity or grant was created. The diagnostic
recorded here was already dispatched and completed; this pass only read its run
record and artifact. The only external reads were the three already-completed run
records and artifacts and the already-open support case. Everything quoted is
provider- or platform-reported, non-secret, and free of addresses, subjects,
tokens, and provider message identifiers. No acceptance criterion is closed and
no total moves.

## Local sources

- `.github/workflows/probe-production-ac209-routing-day-counts.yml` and
  `infra/workflows/ac209-email-routing-day-counts.ts` - the probe and its
  bounds.
- `.github/workflows/diagnose-production-ac209-email.yml`,
  `infra/workflows/diagnose-production-ac209-email.ts`, and
  `infra/workflows/ac209-email-diagnostics.ts` - the diagnostic entrypoint, its
  protected gates, and the window classification that orders the `pageFull`,
  duplicate, match, identity, and terminal-status gates ahead of `zero_rows`.
- `.github/workflows/collect-production-ac211.yml` and
  `infra/workflows/collect-content-schema-registry-slo-evidence.ts` - the
  collection entrypoint and its inputs.
- `packages/contracts/src/content-schema-registry/operational-release-evidence-collector-common.ts`
  - the `200`-sample floors for commands, protected RPCs, and acceptances, and
    the `1`-sample floor for queue first attempts.
- `.memory/pipeline/progress/verification/2026-09-24-ac209-email-dataset-presence-probe.md`
  - the earlier presence probe that established `sending=zone_wide_missing`.
- `.memory/pipeline/progress/verification/2026-09-22-ac209-repair-ac211-readiness-ac265-handoff.md`
  - the mailbox receipt provenance for the 2026-09-22 control alert.

Forward pointer: this note extends
`.memory/pipeline/progress/verification/2026-09-24-ac209-routing-day-counts-diagnostic.md`
(the implementation record for the probe) with the first genuine provider reading
it produced, and it supersedes the run references in the AC209/AC211 bullets of
the Slice 09 blocking-evidence section.
