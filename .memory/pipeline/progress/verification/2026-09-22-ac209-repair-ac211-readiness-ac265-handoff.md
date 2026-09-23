# AC209 authorization repair, AC211 collection readiness, and AC265 authorization handoff

**Date**: 2026-09-22 (local)
**Scope**: operator-facing handoff for the open Slice 09 external gates.
Documentation only: no workflow, contract, migration, secret, deployment, or
tracker change.

**Verdict**: AC209's provider authorization is repaired and verified, and a real
production mailbox receipt now exists, but its rerun exercise failed closed at the
evidence stage on non-unique provider-event correlation, so AC209 stays open.
AC211 has an unexecuted collection prepared for the 2026-09-23 UTC day. AC265's
authorization foundation is live with hosted acceptance still open, and its owner
trust material does not exist yet. AC266 remains owner-deferred.

## State at a glance

| Gate  | Position                                                                           | Closes only with                                                                                          |
| ----- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| AC209 | Token scope repaired and verified; real mailbox receipt observed; correlation open | Automated uniquely matching provider + database correlation and a retained exercise artifact              |
| AC211 | Deployment verified; 2026-09-23 UTC-day collection prepared                        | One complete UTC day meeting every sample floor and SLO threshold                                         |
| AC265 | PR #95 merged; CI, staging, preflight, authorization runs succeeded                | First-time owner trust setup (no bundle/signer configured), protected publication, hosted matrix, receipt |
| AC266 | Owner-deferred and unchecked                                                       | Genuine macOS/Safari/VoiceOver and Windows/Firefox/NVDA reports                                           |

Slice counts are unchanged: Slice 09 **279/282 active** and **283 authored IDs**,
Phase 2 **8/17** and **1,999/2,000 active criteria**, Slice 10 locked.

## AC209 - permission repaired, receipt observed, correlation open

The Cloudflare API token **WeJammin Production Observability Alerts**, in account
`b1c05c00f04130a0d100adbca6696e6e` (the account identity, not a token ID) that
holds the production alert destination, now includes **Zone Analytics Read**
scoped to the `wejamm.in` zone `5bfba340525c623584c47d631116804c`; its
existing **Account Analytics Read** and **Workers Observability Edit** grants were
preserved. No rotation, secret rewrite, or Workers Scripts Edit.

Verification: capability verifier
[35777357009](https://github.com/WeJustJammin/wejammin/actions/runs/35777357009)
and read-only configuration collection
[35778197002](https://github.com/WeJustJammin/wejammin/actions/runs/35778197002)
both succeeded; the collection retained artifact `10717065970` with digest
`sha256:13cc21f633c30a74c24e2f13b40f23f312f2fcf13cb9856cdda474ae0b72a82e`. Only
the collection uploads a retained artifact
(`production-ac209-alert-configuration-<source_revision>`, 30-day retention); the
verifier declares no upload step. Both runs are read-only: no email, no queue
change, no deployment. The old `provider_graphql_error` failure is eliminated in
the current verifier, which does not establish that every historical AC209 error
was solely an authorization gap, since the collector query was corrected later.

### Mailbox receipt now observed

A separate read-only Chrome worker confirmed exactly one Gmail **Inbox/Primary**
message for `admin.wejammin@gmail.com`, received **2026-09-22T20:22Z**, subject
`[WeJammin] dlq_nonempty`, sender `platform.on-call@alerts.wejamm.in`,
`mailed-by cf-bounce.alerts.wejamm.in`, `signed-by alerts.wejamm.in`, over
TLS. Non-secret body fields read:
`release=c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, `route=platform.on_call`,
`runbook=content-schema-registry`, `alert=dlq_nonempty`, `observed=1`,
`threshold=0`, `scheduled_at=2026-09-22T20:22:04.000Z`, `redacted=true`.
Root computed the canonical sender and recipient hashes and they match the
configured expected hashes. This record keeps only those non-secret fields: no
full message body, no message or provider identifier, and no invented full hash.

### Rerun attempt outcome

The original exercise run
[34735006559 attempt 2](https://github.com/WeJustJammin/wejammin/actions/runs/34735006559)
was approved 2026-09-22 at 20:18:35Z and **finished failed** at 20:40:16Z. Step 8
"Exercise one production queue message" failed about 20:36Z with the redacted
diagnostic `AC209_DIAGNOSTIC stage=evidence code=email_not_observed`. That code
maps to an `event_not_unique` condition - **zero or multiple** matching provider
events - so the log does **not** prove zero matching events. Cleanup step 9 then
succeeded with exact text `AC209 queue marker cleanup verified (purged=0;
source_messages=0; dlq_messages=0)`: both queues were empty afterward. Because the
Gmail receipt above proves a send had occurred, earlier speculation that the
attempt produced no receipt or no provider side effects is withdrawn.

Step 10 "Upload redacted AC209 exercise evidence" was skipped and the attempt
carries **no retained exercise artifact**. No claim is made that `exercise.json`
exists on the runner. Values recovered from the earlier
retained configuration artifact `10717065970`: source revision
`c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`, production Worker version
`c5f79163-86dc-4b97-beb5-33145f041b24`, production DLQ
`88155985aa0c49caa591b9bf9e6ca937`, and configuration
`ac209-config-20260911-expand` with approved reference `pr:53`. No deployment is
needed for this attempt: a GitHub rerun of the original run preserves its SHA and
ref, so no new dispatch was made and production still serves the same release.

What this attempt settles: the repaired `provider_graphql_error` authorization gap
is not present on this path, because the run reached enqueue and evidence
observation and failed on provider-event correlation instead. It does not pass
AC209, which needs one uniquely matching provider event correlated with one
delivered `dlq_nonempty` row for the exact release. A real receipt alone does not
satisfy the automated correlation requirement.

### Read-only provider view (visible UI observation only)

A separate read-only Chrome session observed account
`b1c05c00f04130a0d100adbca6696e6e`, parent zone `wejamm.in`
`5bfba340525c623584c47d631116804c`, and Email Sending domain
`alerts.wejamm.in`. The domain Activity log showed "No activity found" for a
custom 20:10-20:50 UTC 22 Sep range covering the 20:22Z receipt, and the widened
recent history was likewise empty; Overview showed no data.

This is a visible UI observation only. It does not show that the raw GraphQL
dataset holds zero rows for the domain, and it cannot rule out another domain, the
retention window, an active filter, a status selection, or ingestion lag.
`alerts.wejamm.in` is a sending domain, not a separate DNS zone; the child
`c82...` identifier is a sending-domain ID, not a proven zone. A
destination-address binding does not prove a different Email Routing transport:
Cloudflare documents destination restrictions, not the definitive event dataset.
The actual cause of the missing provider-event visibility or correlation remains
unproven. No transport or configuration change and no provider support ticket was
authorized or performed. The token repair above stands as verified successful.

AC209 closes only after a bounded exercise pushes one marker message, the marker
reaches the bound DLQ, the service-only verifier correlates one delivered
`dlq_nonempty` row for the exact release, Cloudflare reports a delivered Email
Sending event with `isLastEvent = 1`, and a human inspects the real Gmail receipt.
Retained configuration proof alone does not satisfy the criterion, nor does a
repaired permission scope on its own. Dispatch shapes and fail-closed guards are in
the runbook linked below.

## AC211 - collection prepared against the selected deployment

Production source revision `c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2`,
deployment `6417116181` promoted by run
[34734646414](https://github.com/WeJustJammin/wejammin/actions/runs/34734646414)
at `2026-09-13T03:07:54Z`, Worker version
`c5f79163-86dc-4b97-beb5-33145f041b24`; the root operator live-verified this
deployment. Earlier collection `35673313035` passed preflight but failed closed
with `commands=0`, `protectedRpcs=0`, `acceptances=0`, and
`queueFirstAttempts=0`, so the gate is sample-starved rather than showing a broken
collector.

The candidate window remains the complete UTC day **2026-09-23**, collected only
after `2026-09-24T00:00:00Z`. It is provisional, not a guarantee: dispatch only if
that day genuinely follows the selected deployment, the binding is unchanged, and
the day carried enough real production traffic. A day below the floors is a real
failed gate, not grounds to resubmit. No AC209 marker traffic counts.

```bash
gh workflow run collect-production-ac211.yml \
  --repo WeJustJammin/wejammin --ref main \
  -f utc_day=2026-09-23 \
  -f source_revision=c8f0cbd52cb6140ee1a756f106fa329f8c23b0e2 \
  -f production_deployment_id=6417116181 \
  -f confirm_collection=true
```

Floors: 200 command durations, 200 protected RPC durations, 200 acceptance
durations, 200 complete correlated non-read groups (all four
`cms.registry.request`, `cms.registry.command`, `cms.registry.rpc`, and
`cms.registry.acceptance` events sharing one request ID, operation, and outcome;
three-event read operations excluded), and 1 queue first-attempt duration.
Thresholds fail on equality: Tier 2 command p95 1,200 ms, protected RPC p95 300 ms,
acceptance p99 1,000 ms, queue first-attempt p95 60,000 ms, and daily DLQ rate
0.001 (0.1%). The collector fails closed on incomplete pagination, unexpected
event identity, insufficient samples, incoherent queue counts, threshold equality
or failure, and integrity mismatch, and it uploads its three retained reports only
after success.

## AC265 - authorization foundation live, acceptance open

PR #95 merged to exact `main` `37c0a86ee0a39d337dacfcefed15ece891ad5e2d` and
fixed the immutable OIDC subject to the canonical repository identity
`repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging`.

- Exact-main CI [35758939205](https://github.com/WeJustJammin/wejammin/actions/runs/35758939205)
  and staging deploy [35759725855](https://github.com/WeJustJammin/wejammin/actions/runs/35759725855)
  (deployment `6596526062`).
- Candidate preflight [35760013434](https://github.com/WeJustJammin/wejammin/actions/runs/35760013434)
  and runner authorization [35760318394](https://github.com/WeJustJammin/wejammin/actions/runs/35760318394).

All four runs succeeded.

The authorization run issues a redacted, short-lived runner authorization of at
most five minutes and states that it is an authorization foundation, not hosted
acceptance. That reference has expired, cannot be replayed as a bootstrap, and the
run that uses authorization needs a fresh one.

AC265 is hosted browser end-to-end acceptance over nine role cases and ten
scenarios against one immutable staging candidate, with step-up and session
teardown proof. The roles, their `authorized_access`, `denied_no_disclosure`,
and `disabled_no_mutation` assertions, and the scenarios are fixed by the approved
Phase 2 contract and listed in the runner contract linked below.
`dependency_outage` also needs its one-use staging-only lease proof, at most 60
seconds, with exactly one consume event and a release proof. Denied cases use
eligible adults without minor accounts or invented mandates, every assertion needs
a real server receipt, and skips, relabeled older results, fixtures, and Chromium
substitutes do not pass.

`AC265_PUBLICATION_CONTEXT_BUNDLE_B64` is the owner-controlled trust root for a
publication run: signed authority manifest, pinned public keys, authorization and
candidate bindings, separate CI and staging provenance, and archive digests.
`AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM` is a distinct protected Ed25519
key used only to sign the finalized publication manifest, must match a public key
pinned by that bundle, and must never be embedded in it.
`AC265_SOURCE_MANIFEST_SIGNING_KEY_ID` is the non-secret protected staging
variable naming that key.

Correction: none of that owner material exists yet - the owner confirms it was not
created. No `AC265_PUBLICATION_CONTEXT_BUNDLE_B64` value and no
`AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM` or
`AC265_SOURCE_MANIFEST_SIGNING_KEY_ID` value is configured, and there is nothing to
discover, recover, or replay: this is a first-time protected signing and trust
setup, not location of pre-existing material. So the blocker is the creation and
approval of new trust material, not a lookup step.

Creating that material needs explicit owner authority for a new trust setup -
signing identity, pinned public keys, authority manifest, session mappings, outage
policy - and that authorization is still outstanding, with no keys, bundle, or
signature generated by any worker. After it is granted, the protected candidate
preflight and authorization workflows must still emit genuine candidate references,
run identities, and hashes, which remain required and are not yet in hand. No worker
may synthesize references, digests, or signatures; this record contains no values
and creates no configuration.

### 2026-09-23 follow-up - owner authority granted, signer provisioned

The paragraph above recorded the position on 2026-09-22. The owner has since
granted the first-time trust-setup authority, and a worker provisioned the signer
under it. The superseded framing is only the "authorization is still outstanding"
part; every earlier statement is kept as history.

- One Ed25519 key pair now exists owner-only at `/home/rob/.config/wejammin/ac265`
  (directory 0700, private key 0600). Public SPKI fingerprint
  `sha256:456f32d0f927339df47e5df35fde5257bd5049562d842f0339b68947ac16e4df`;
  non-secret key ID `ac265-source-manifest-ed25519-456f32d0f927339df47e5df35fde5257`.
- Protected staging secret `AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM` and
  protected staging variable `AC265_SOURCE_MANIFEST_SIGNING_KEY_ID` are
  configured. The root operator independently re-verified the secret metadata,
  the key-ID readback, the local permissions, the Ed25519 public-key type, and
  the fingerprint-to-key-ID match.
- `AC265_PUBLICATION_CONTEXT_BUNDLE_B64` remains entirely unset. The concrete
  remaining blocker is no longer "approval" but genuine AC265 signed hosted
  source artifacts with an approved issuer and pinning, plus a fresh
  authorization at publication time. An in-memory audit of the four current
  upstream archives found no AC265 signed receipt or execution-evidence document
  and no attestation companion.

Full receipt:
`.memory/pipeline/progress/verification/2026-09-22-ac265-source-manifest-signer-provisioning.md`.
This follow-up generated no key, secret, variable, bundle, or signature, and no
criterion is marked passed; counts are unchanged.

## AC266 - owner-deferred

AC266 stays owner-deferred and unchecked. It needs genuine macOS/Safari/VoiceOver
and Windows/Firefox/NVDA report pairs against the exact hosted candidate, plus
same-candidate automated axe results and the canonical manual checks. This host
cannot supply either platform attestation, and this record does not mark the
criterion passed, waived, or simulated. It remains mandatory for the post-Phase 2
production-readiness and release gate.

## Boundaries this record does not cross

No acceptance criterion is closed here. The repaired AC209 token scope, the
read-only runs, the observed Gmail receipt, the read-only provider view, the
selected AC211 deployment, and the AC265 authorization foundation are
infrastructure position only; exact-main CI, staging promotion, and a passing
authorization run never by themselves prove hosted acceptance. This record
dispatched no workflow, generated no new traffic, made no provider or configuration
change, opened no provider ticket, read or wrote no secret value, and changed no
tracker count. The AC209 exercise rerun and its bounded marker are separate,
already-approved work. This is a single-file change.

## Local sources

- `.github/SECRETS.md` - protected secret, variable, and least-privilege ownership.
- `.github/workflows/verify-production-cloudflare-observability.yml` - AC209 capability verifier.
- `.github/workflows/collect-production-ac209.yml` and `.github/workflows/exercise-production-ac209.yml` - AC209 collection and exercise.
- `.github/workflows/collect-production-ac211.yml` and `infra/workflows/verify-content-schema-registry-slo-source.ts` - AC211 preflight and provenance binding.
- `docs/runbooks/platform/content-schema-registry-release-evidence.md` - operator runbook for AC209, AC211, AC265, and AC266.
- `docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md` - AC265 runner contract, role matrix, and scenario matrix.
- `packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts` - canonical roles, scenarios, and locked SLO thresholds.
- `.memory/pipeline/progress/verification/2026-09-21-ac265-hosted-artifact-source-manifest-publication.md` - preceding CP04e promotion record.
- `.memory/pipeline/progress/verification/2026-09-22-ac209-diagnostic-ac211-provenance-ac265-report-assembler.md` - later 2026-09-22 change record covering the AC209 diagnostic, the AC211 historical-slug provenance fix, and the AC265 report assembler.
