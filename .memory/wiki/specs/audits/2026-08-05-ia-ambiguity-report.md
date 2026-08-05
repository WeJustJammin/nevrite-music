# IA Ambiguity Audit — Fresh Run (2026-08-05)

**Scope:** 83 documents (index + 43 parent shards + 39 deep dives), per `audit-scope.md`.  
**Method:** every document read in full — 9 parallel audit agents running implementer simulation and rubric scoring, then an independent adversarial refutation pass over every finding, plus a deterministic whole-layer sweep run by the orchestrator.  
**Verdict: FAIL — 19.48% ambiguity (67/344). Remediation required before this layer can be advanced.**

> This contradicts `2026-08-03-ia-ambiguity-rerun-1.md`, which recorded 0/344 (0.00%) over the same 83 documents. See *Relationship to the 2026-08-03 PASS* below.

## Coverage

| Metric | Value |
|---|---|
| Documents in scope | 83 |
| Documents read in full | 83/83 (plus 15 ideation source files opened for dimension 1) |
| Parent shards scored | 43/43 |
| Deep dives read directly | 39/39 |
| Audit agents | 9 |
| Refutation agents | 9 |
| Raw findings produced | 138 |
| Findings refuted | 104 (75%) |
| Findings upheld | 34 (25 blocking, 9 partial) |
| Deterministic checks over all 83 docs | link resolution (1783 links), contract-map reciprocity (218 edges), AC/Interaction schema, section presence |

Cross-layer BE/FE checks were not run: scope is `ia`, and `scoring.md` restricts those checks to `be`, `fe` or `all`.

## Score

Two numbers, because they answer different questions.

| Measure | Points | Ambiguity |
|---|---:|---:|
| Auditors' raw scores, before refutation | 146/344 | 42.44% |
| **Consolidated, after refutation — authoritative** | **67/344** | **19.48%** |

The raw figure is not the finding. 104 of 138 agent findings were refuted on inspection, and their points are discarded. The consolidated figure counts only defects that survived an adversarial reviewer instructed to default to REFUTED, plus deterministic defects verified mechanically over the whole layer. One point per (shard, dimension) cell, blocking = 1, partial = 0.5.

### By dimension

| # | Dimension | Points (max 43) |
|---|---|---:|
| 1 | Feature Enumeration | 6 |
| 2 | Access Model | 2.5 |
| 3 | Data Model | 7 |
| 4 | User Flows | 12.5 |
| 5 | Cross-Shard Contracts | 24 |
| 6 | Edge Cases | 0.5 |
| 7 | Deep Dive Coverage | 0 |
| 8 | Testability | 14.5 |

Cross-Shard Contracts (24) and Testability (14.5) carry the layer. Deep Dive Coverage scored 0 — every deep dive that a parent declares exists and is substantive.

### By shard

Fully clean: **2/43** — `36-box-office-risk.md`, `40-market-intelligence-signals.md`.

| Shard | Points |
|---|---:|
| `06-trust-safety.md` | 4.5 |
| `09-projects-collaboration.md` | 4 |
| `18-royalty-accounting.md` | 3.5 |
| `14-services-marketplace.md` | 3 |
| `00-infrastructure.md` | 2.5 |
| `01-identity-authority.md` | 2.5 |
| `02-profiles-verification.md` | 2.5 |
| `08-credit-reporting-disclosure.md` | 2.5 |
| `10-rights-ownership.md` | 2.5 |
| `22-release-distribution.md` | 2.5 |
| `04-cms-delivery-media.md` | 2 |
| `07-credits-core.md` | 2 |
| `11-community-graph.md` | 2 |
| `29-venues-spaces.md` | 2 |
| `33-show-day-operations.md` | 2 |
| `03-cms-content-modeling.md` | 1.5 |
| `05-platform-configuration-admin.md` | 1.5 |
| `13-opportunities-casting.md` | 1.5 |
| `16-education-credentials-institutions.md` | 1.5 |
| `17-realtime-sessions.md` | 1.5 |
| `19-royalty-reporting-forecasting.md` | 1.5 |
| `20-licensing-core.md` | 1.5 |
| `21-specialized-licensing.md` | 1.5 |
| `23-gear-provenance-registry.md` | 1.5 |
| `37-fanbase-direct-to-fan.md` | 1.5 |
| `12-community-spaces-events.md` | 1 |
| `15-education-delivery.md` | 1 |
| `28-digital-licensing-commerce.md` | 1 |
| `30-booking-contracts.md` | 1 |
| `31-live-settlement-intelligence.md` | 1 |
| `32-show-production-planning.md` | 1 |
| `35-ticket-products-sales.md` | 1 |
| `42-career-planning-risk.md` | 1 |
| `24-gear-holdings-operations.md` | 0.5 |
| `25-gear-market-catalog.md` | 0.5 |
| `26-gear-commerce-fulfilment.md` | 0.5 |
| `27-digital-catalog-delivery.md` | 0.5 |
| `34-touring-operations.md` | 0.5 |
| `38-promotion-marketing.md` | 0.5 |
| `39-analytics-ingestion-reporting.md` | 0.5 |
| `41-career-finance.md` | 0.5 |

## Systemic defects (deterministic, whole-layer)

These were found by machine check over all 83 documents, so they are exhaustive rather than sampled.

### F1 — Two incompatible Interactions schemas split the layer

| Group | Shards | Interactions columns |
|---|---:|---|
| Legacy | 24 (00–23) | `ID \| Interaction \| Required behavior \| Completion` |
| Current | 19 (24–42) | `ID \| Interaction \| Preconditions \| Success \| Failure / recovery` |

The legacy group has no per-flow precondition column and no per-flow failure column. Consequence, measured: **393 of 773 acceptance criteria** across the layer open with the identical string `Given a valid request with current identity, authority, source state and required inputs` and close with an identical generic refusal clause. In those 24 shards nothing states when a flow is legal to attempt, or what specifically happens when it fails.

Dimensions hit: 4 (User Flows — "no flow ends at an undefined success", error paths required) and 8 (Testability — a Given that states no flow-specific precondition).

### F2 — 52 cross-shard contracts the target shard never acknowledges

Of 218 directed edges declared in the Cross-Shard Section Contract Maps, 52 have no counterpart in the target shard — not in its contract map, and not in its `Dependency References`. The rubric requires every cross-shard reference to be bidirectional.

| Source declares contract with | Target that never mentions it |
|---|---|
| Shard 06 | Shard 25, Shard 26, Shard 27, Shard 28 |
| Shard 07 | Shard 18, Shard 20, Shard 22, Shard 23 |
| Shard 08 | Shard 22, Shard 23 |
| Shard 13 | Shard 09, Shard 10, Shard 14, Shard 30 |
| Shard 16 | Shard 03 |
| Shard 17 | Shard 02, Shard 06 |
| Shard 18 | Shard 02, Shard 06 |
| Shard 19 | Shard 10 |
| Shard 20 | Shard 02, Shard 06, Shard 09 |
| Shard 21 | Shard 01, Shard 06, Shard 09, Shard 20 |
| Shard 22 | Shard 01, Shard 02, Shard 06, Shard 20 |
| Shard 23 | Shard 02, Shard 06, Shard 14 |
| Shard 24 | Shard 23 |
| Shard 25 | Shard 23, Shard 24 |
| Shard 26 | Shard 23, Shard 24 |
| Shard 27 | Shard 07 |
| Shard 31 | Shard 18 |
| Shard 33 | Shard 17 |
| Shard 34 | Shard 24 |
| Shard 37 | Shard 22 |
| Shard 38 | Shard 14, Shard 22, Shard 35 |
| Shard 39 | Shard 01, Shard 22 |
| Shard 41 | Shard 18, Shard 26, Shard 28 |

### F3 — 54 broken cross-shard references across 10 shards

Ten shards reference 14 distinct shard names that do not exist anywhere in this decomposition — stale slugs left from an earlier numbering. Both the markdown links and the Obsidian wikilinks are wrong, so the vault graph is wrong too.

| Shard | Dangling targets |
|---|---|
| `09-projects-collaboration.md` | `17-royalty-splits`, `32-venue-operations` |
| `10-rights-ownership.md` | `21-licensing-operations` |
| `11-community-graph.md` | `38-campaigns-communications` |
| `14-services-marketplace.md` | `41-finance-tax-operations` |
| `29-venues-spaces.md` | `32-event-operations`, `35-discovery-recommendations` |
| `30-booking-contracts.md` | `31-live-settlement`, `32-event-operations`, `35-discovery-recommendations` |
| `31-live-settlement-intelligence.md` | `34-event-ticketing`, `41-career-business` |
| `32-show-production-planning.md` | `33-show-day-tour-operations`, `34-event-ticketing` |
| `33-show-day-operations.md` | `34-event-ticketing`, `36-live-reporting` |
| `35-ticket-products-sales.md` | `37-ticket-resale-refunds`, `39-fan-discovery` |

This is the most mechanical class of defect in the report and the most damaging: an implementer following `30-booking-contracts.md` to wire its outbox is sent to `31-live-settlement.md`, which does not exist.

## Findings that survived adversarial refutation

Each was challenged by an independent reviewer instructed to default to REFUTED and to quote proof of absence. 104 sibling claims did not survive that test and are excluded.

### A-01 · `01-identity-authority.md` · 8 Testability · BLOCKING

**Defect.** AC-IDA-15 is structurally corrupted: the Given holds the interaction's required-behavior text, step (5) holds only the flow title, the state enum is truncated at its first pipe, and the refusal clause is destroyed.

**Evidence.** "**AC-IDA-15 — Record external identifier:** Given Validate namespace format/capacity, record provenance, and attempt configured registry verification., when the actor invokes this flow, then the system MUST (1) validate inputs, ... (5) Record external identifier, and (6) return Identifier is labelled `self_asserted; if the flow cannot complete, verified." — the Interactions row IDA-15 shows the intended completion as "Identifier is labelled `self_asserted|verified|mismatch|collision|revoked`".

**What an implementer is forced to invent.** The only acceptance criterion for external-identifier recording is untestable: it states no precondition, no system behavior, three of five enum values are missing (`mismatch`, `collision`, `revoked`), and there is no failure branch, so a test author must reconstruct the criterion from the Interactions table and guess whether the truncated enum is authoritative.

**Refutation attempt.** Verified at /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/01-identity-authority.md line 49, quoted exactly: "**AC-IDA-15 — Record external identifier:** Given Validate namespace format/capacity, record provenance, and attempt configured registry verification., when the actor invokes this flow, then the system MUST (1) validate inputs, ... (5) Record external identifier, and (6) return Identifier is labelled `self_asserted; if the flow cannot complete, verified." Line 72 shows the intended source: "| IDA-15 | Record external identifier | Validate namespace format/capacity... | Identifier is labelled `self_asserted|verified|mismatch|collision|revoked`. |". The unescaped pipes inside the enum shifted the row's columns, so the required-behavior text landed in the Given, the flow title landed in step (5), the completion cell was truncated at the first pipe, and the refusal clause became the orphan word "verified." This is NOT the already-logged shards 00-23 boilerplate gap — AC-IDA-15 is precisely the AC that does NOT carry the boilerplate Given or the boilerplate refusal clause; it is a distinct, shard-specific text corruption. Neighbouring AC-IDA-14 and AC-IDA-16 are intact, proving the defect is local to this criterion. `mismatch`, `collision` and `revoked` are absent from the AC and the sentence "if the flow cannot complete, verified." is not a failure branch. Claim survives.

### A-02 · `02-profiles-verification.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** Ownership-contest adjudication is routed to "Shard 24", which in this IA layer is gear collections/rigs/custody, not trust & safety (Shard 06); the reference is also undeclared in either direction and cites no section.

**Evidence.** AC-PRF-08 / PRF-08: "credible conflict freezes control and routes Shard 24"; Edge Cases: "Both claimants have credible proof | Freeze ownership, preserve operate-only committed work, route Shard 24"; Event Schemas: "`profile.contest.changed.v1` ... Shard 24, operations, notifications, commerce refetch" — while index.md reads "| 24 | 24-gear-holdings-operations.md | Gear collections, rigs, custody and manifests |" and "| 06 | 06-trust-safety.md | Trust, safety, disputes and evidence |". Cross-Shard Dependencies lists only "Depended on by: Shard 15 and Shard 16" and the Section Contract Map contains no Shard 24 or Shard 06 entry.

**What an implementer is forced to invent.** An implementer building the contest-freeze path must invent which shard owns adjudication, what case contract to call, and what payload it takes — and following the text literally wires profile ownership contests into the gear-custody shard. The same wrong target appears in deep-dives/02-profiles-verification.md ("Shard 24 adjudication", "| Shard 24 | Typed claim contest, suppression/correction, false evidence...").

**Refutation attempt.** Verified verbatim in /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/02-profiles-verification.md. AC-PRF-08 (line 40) and Interactions PRF-08 (line 61): "credible conflict freezes control and routes Shard 24"; Edge Cases line 219: "Freeze ownership, preserve operate-only committed work, route Shard 24"; Contracts line 89: "three attempts/target/rolling 90 days then Shard 24 review"; Event Schemas line 201: "`profile.contest.changed.v1` | ... | Shard 24, operations, notifications, commerce refetch." index.md line 39 assigns 24 = "Gear collections, rigs, custody and manifests" and line 21 assigns 06 = "Trust, safety, disputes and evidence". I confirmed the reference is undeclared in BOTH directions: 02's Cross-Shard Dependencies (line 261-262) lists only "Depends on: Shard 00 ... Shard 01" / "Depended on by: Shard 15 and Shard 16", its Section Contract Map (lines 270-273) contains only 00, 01, 15, 16 — and 06-trust-safety.md's own "Depended on by: Shards 11–16, 25–31, 33, 35–37 and 40" omits Shard 02. The deep dive repeats it (line 9 "Shard 24 adjudication", line 28, line 103, and the Cross-Shard Contracts row line 162 "| Shard 24 | Typed claim contest, suppression/correction, false evidence, credential review, and trader mismatch case references."). Root cause confirmed: ideation-index.md line 144 shows domain "24 | Trust, Safety & Disputes", and 06-trust-safety.md labels its own features "24.03", "24.07" — so this is ideation-domain numbering leaking into an IA-numbered document, and the same sentence at deep-dive line 9 mixes both schemes ("Shard 02 credit meaning/rungs" = ideation 02 = Credits, while "Shard 15/16 domain requirements" = IA education shards). Following the text literally in the IA layer wires profile ownership contests into gear custody. Claim survives.

### A-03 · `02-profiles-verification.md` · 8 Testability · BLOCKING

**Defect.** AC-PRF-15 is corrupted the same way: behavior text sits in the Given, the classification enum is cut at the first pipe, and both the completion condition and the refusal clause are lost.

**Evidence.** "**AC-PRF-15 — Declare trader status:** Given At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission., when the actor invokes this flow, then the system MUST ... (5) Declare trader status, and (6) return Approved rule pack resolves `private; if the flow cannot complete, trader." — Interactions row PRF-15 gives "Approved rule pack resolves `private|trader|undetermined|review_required`; listing gate rechecks."

**What an implementer is forced to invent.** The acceptance criterion governing a commerce-gating legal classification omits `undetermined` and `review_required` — the two fail-closed values that the Commerce gate contract depends on ("Unknown or review-required fails closed") — and drops the listing-gate recheck entirely, so an implementer testing against the AC would ship a two-value classifier that cannot block listings.

**Refutation attempt.** Verified at /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/02-profiles-verification.md line 47, quoted exactly: "**AC-PRF-15 — Declare trader status:** Given At first sale, ask situational jurisdiction questions and disclose exactly what will become public before submission., when the actor invokes this flow, then the system MUST ... (5) Declare trader status, and (6) return Approved rule pack resolves `private; if the flow cannot complete, trader." Interactions line 68 gives the intact source: "Approved rule pack resolves `private|trader|undetermined|review_required`; listing gate rechecks." Same unescaped-pipe column shift as claim 3, and it is materially worse here because the two values lost (`undetermined`, `review_required`) are exactly the fail-closed values the Commerce gate contract depends on — line 112: "| Commerce gate | No listing publishes unless classification and counsel-approved disclosure rule pack are current for seller/buyer jurisdiction. Unknown or review-required fails closed. |" — and the "listing gate rechecks" completion condition is destroyed. AC-PRF-16 immediately below is intact and does reference `review_required`, confirming the corruption is local rather than the logged boilerplate schema gap. Claim survives.

### A-04 · `03-cms-content-modeling.md` · 8 Testability · BLOCKING

**Defect.** AC-CMS-15 is corrupted the same way: the translation-state enum is cut at its first pipe and the entire completion condition (the legal/safety publish block) is replaced by fragments.

**Evidence.** "**AC-CMS-15 — Author locale variant:** Given Translate allowed fields, track `untranslated, when the actor invokes this flow, then the system MUST ... (5) Author locale variant, and (6) return draft; if the flow cannot complete, review." — Interactions row CMS-15 gives "track `untranslated|draft|review|approved|stale`, and preview explicit fallback chain" with completion "Legal/safety/no-fallback fields block locale publish when absent/stale."

**What an implementer is forced to invent.** The acceptance criterion for localization loses `approved` and `stale` states and loses the no-fallback publish blocker, which the Localization contract makes mandatory ("Legal/safety/jurisdictional fields default `no_fallback`"). A test written from the AC would pass a build that publishes a locale variant with a missing legally required field.

**Refutation attempt.** Verified at /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/03-cms-content-modeling.md line 47, quoted exactly: "**AC-CMS-15 — Author locale variant:** Given Translate allowed fields, track `untranslated, when the actor invokes this flow, then the system MUST ... (5) Author locale variant, and (6) return draft; if the flow cannot complete, review." Interactions line 68 gives the intact source: "| CMS-15 | Author locale variant | Translate allowed fields, track `untranslated|draft|review|approved|stale`, and preview explicit fallback chain. | Legal/safety/no-fallback fields block locale publish when absent/stale. |". `approved` and `stale` are lost, the explicit fallback-chain preview is lost, and the entire completion condition — the publish blocker — is replaced by the fragments "draft" and "review". The Localization contract at line 111 makes that blocker mandatory: "BCP 47 locale IDs, one source locale, explicit ordered fallback per type/field, stale-on-source-change. Legal/safety/jurisdictional fields default `no_fallback`." Same pipe-induced column shift, local to this AC. Claim survives.

### A-05 · `06-trust-safety.md` · 1 Feature Enumeration · BLOCKING

**Defect.** Eight Level-1 ideation sub-features are named in the Features bullets and then appear nowhere else in the shard or its deep dive — no interaction, contract, model field, access rule, event or edge case.

**Evidence.** Features line 28 promises "trusted flaggers" and "metadata-first messaging safety"; line 32 promises "counterfeit/authenticity review, and forensic leak response"; line 33 promises "meetup safety records"; line 35 promises "separate TVEC hash/policy paths". Grep across 06-trust-safety.md and deep-dives/06-trust-safety.md returns those bullets as the ONLY hit for "trusted", "flagger", "counterfeit", "TVEC" and "meetup", and zero hits for "scam", "triangulat", "card test" and "rating" (ideation 24.01.04, 24.01.05, 24.03.04, 24.03.06, 24.05.03, 24.05.04, 24.06.02, 24.08.02).

**What an implementer is forced to invent.** Trusted-flagger priority is directly contradicted by what IS specified: `RouteCase` says "Priority derives from severity and remaining deadline", the deep dive's `case_route` carries "no reporter-volume priority field", and the Global rule says badge/persona "never independently establish guilt or priority" — so an implementer has no field, no eligibility rule and no priority effect for the DSA Art 22 lane, and no way to tell whether it was cut or forgotten. TVEC and counterfeit likewise have no `CaseKind` member, no policy path and no severity mapping.

**Refutation attempt.** Verified by grep across 06-trust-safety.md and deep-dives/06-trust-safety.md. "trusted" and "flagger" return exactly one hit each — line 28, the Features bullet. "counterfeit" returns one hit — line 32. "TVEC" returns one hit — line 35. "meetup" returns one hit — line 33. "scam", "triangulat" and "card test" return zero hits in both files; the single "rating" hit is the substring in "operating procedure" (deep dive line 119). All eight ideation nodes exist on disk: 24.01.04-trusted-flagger-priority-channel.md, 24.01.05-messaging-safety-scam-filtering.md, 24.03.04-triangulation-card-testing-defense.md, 24.03.06-review-rating-integrity.md, 24.05.03-authenticity-counterfeit-brand-protection.md, 24.05.04-pre-release-leak-detection-response.md, 24.06.02-meetup-safety-safe-exchange.md, 24.08.02-tvec-removal.md. The contradiction is exactly as described: `RouteCase` | "Priority derives from severity and remaining deadline" (line 117); deep dive line 30 `case_route` | "...severity, deadline_remaining_ms, policy_version, reason_codes[], computed_at`; **no reporter-volume priority field**"; Global rule line 95 "Volume, badge, persona, entity membership, price, genre, protected trait and role diversity never independently establish guilt or priority." And `CaseKind` = `safety_report | moderation | dmca | fraud_review | transaction_dispute | impersonation | ownership | legal_process | illegal_content | crisis | governance` (line 105) has no counterfeit/authenticity or TVEC member and no separate policy path.

### A-06 · `06-trust-safety.md` · 3 Data Model · BLOCKING

**Defect.** The enforcement ladder rung is used as the trigger for mandatory dual-human review but is never enumerated or bounded anywhere.

**Evidence.** AC-TSE-06/TSE-06: "S1 and rung ≥6/indefinite require another human"; deep dive Decision Control step 3: "S1 or rung ≥6/indefinite with at least two human moderators: distinct-human concurrence"; the only schema statement is deep dive `sanction` | `id, decision_id, subject_person/party, action, rung?, scope_type/id, ...` — an optional field with no domain, no scale length and no mapping from `Decision` values to rungs.

**What an implementer is forced to invent.** The implementer cannot type the column, cannot validate input, and cannot implement the concurrence predicate — is `terminate_access` rung 6, 8 or 10? How many rungs exist? The same gap makes AC-TSE-06 untestable, and `Severity` "mapping is policy-versioned" gives no severity-to-deadline mapping either, so `case_route.deadline_remaining_ms` has no derivable value.

**Refutation attempt.** Verified. The rung threshold is load-bearing in two places — AC-TSE-06 / TSE-06 (lines 53 and 76): "From second moderator onward, S1 and rung ≥6/indefinite require another human", and deep dive line 103: "S1 or rung ≥6/indefinite with at least two human moderators: distinct-human concurrence". The only schema statement is deep dive line 40: "| `sanction` | `id, decision_id, subject_person/party, action, **rung?**, scope_type/id, starts_at, ends_at?, indefinite, state, reversal_id?, version`" — optional, untyped, no domain. Grepping both files for `rung|ladder` returns no enumeration, no scale length and no mapping. The `Decision` enum (line 108) — `no_action | warn | restrict | remove_object | suspend_scope | suspend_account | terminate_access | restore | refer_external | resources_only` — is not an ordered ladder (it contains `restore`, `refer_external` and `resources_only`, which are not rungs) and is never mapped to rung numbers, so `terminate_access` has no determinable rung. A hardcoded constant `6` over an undefined scale makes the mandatory dual-human-review predicate unimplementable and AC-TSE-06 untestable. `Severity` | "...**mapping is policy-versioned**" (line 107) is a legitimate deferral by contrast — the rung is not deferred to anything, it is simply absent.

### A-07 · `06-trust-safety.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** The Cross-Shard Section Contract Map omits all three upstream dependencies and only ten of the eighteen declared downstream consumers.

**Evidence.** Cross-Shard Dependencies: "**Depends on:** [Shard 00](00-infrastructure.md) ...; [Shard 01](01-identity-authority.md) ...; [Shard 05](05-platform-configuration-admin.md) for capabilities, guarded configuration, tasks, diagnostics, quality gates, retention and kill switches" — three bare file links with no section. "**Depended on by:** Shards 11–16, 25–31, 33, 35–37 and 40" (18 shards), while the Contract Map lists only 11, 14, 25, 26, 27, 28, 30 and 36. Shard 05's own map does declare a Shard 06 contract, so the pair is one-sided.

**What an implementer is forced to invent.** `CounselGate` ("feature flag cannot substitute for approval record") and the break-glass custodian role both depend on Shard 05 capability grants, but no section of Shard 05 is cited, so the implementer must guess whether the grant contract is Shard 05 § Contracts "Capability grant" or § Data Models `AdminCapabilityGrant`. Ten declared consumers (12, 13, 15, 16, 29, 31, 33, 35, 37, 40) get no restriction/enforcement projection contract at all.

**Refutation attempt.** Verified, with one correction to the claim's headline. `Cross-Shard Dependencies` reads "**Depends on:** [Shard 00](00-infrastructure.md) ...; [Shard 01](01-identity-authority.md) ...; [Shard 05](05-platform-configuration-admin.md) for capabilities, guarded configuration, tasks, diagnostics, quality gates, retention and kill switches" and "**Depended on by:** Shards 11–16, 25–31, 33, 35–37 and 40" (18 shards). The Cross-Shard Section Contract Map that follows contains exactly EIGHT entries — 11, 14, 25, 26, 27, 28, 30, 36 — not ten as the claim's title says; the claim's own impact sentence gets it right by naming the ten omitted consumers (12, 13, 15, 16, 29, 31, 33, 35, 37, 40). All three upstreams are absent from the map. The one-sidedness also checks out: 05-platform-configuration-admin.md's map lists Shards 00, 01, 03, 04 AND "**Shard 06 — Trust and safety:** consume [Shard 06 — Trust and safety Contracts](06-trust-safety.md#contracts)...", so the pair is declared in one direction only. That upstreams belong in these maps is settled by 05 and by 08-credit-reporting-disclosure.md, whose map opens with Shards 00, 01 and 07. `CounselGate` ("feature flag cannot substitute for approval record") and the Break-glass custodian row therefore have no named Shard 05 section to bind to.

### A-08 · `08-credit-reporting-disclosure.md` · 3 Data Model · BLOCKING

**Defect.** The Typed Field and Cardinality Registry contains eight bogus entities generated by mis-parsing the AI Disclosure Entry V1 field table, including the table's own header row.

**Evidence.** "- **`Field`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`ationships: Constraint." followed by identically-shaped entries for **`kind`**, **`scope`**, **`tool_name`**, **`tool_version?`**, **`model_name?`**, **`subject_is_own_model?`** and **`note?`** — each declared with its own `id`, `owner_id`, `state`, `version`, `created_at`, `updated_at`.

**What an implementer is forced to invent.** The registry is the shard's only typed schema statement. An implementer reading it would create tables named `field`, `kind`, `scope`, `note?` etc. with uuid primary keys, instead of implementing them as columns of `ai_disclosure_version.entries JSON`. It also means the six real AI-disclosure fields never receive a type from the registry, so `kind`, `scope` and the length limits on `tool_name`/`note` are unspecified.

**Refutation attempt.** Verified at /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/08-credit-reporting-disclosure.md lines 162-169. After the twelve legitimate model entries the registry continues: "- **`Field`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; ... Constraints/relationships: Constraint." — that is the literal header row `| Field | Constraint |` of the AI Disclosure Entry V1 table (line 137) promoted into an entity. It is followed by identically-shaped entries for **`kind`**, **`scope`**, **`tool_name`**, **`tool_version?`**, **`model_name?`**, **`subject_is_own_model?`** and **`note?`**, each given `id: uuid`, `owner_id: uuid`, `state: closed enum` and `version: bigint`, with the constraint text lifted from the field's own row (e.g. `- **\`note?\`:** ... Constraints/relationships: Optional bounded plain text; not used for policy evaluation."). Eight bogus entities, one of them a table header, one of them named with a trailing `?`. The Data Models section says these are columns of `ai_disclosure_version` | "...entries JSON..." (line 131), so the registry directly contradicts the model table it is supposed to type. This is a generation artifact of the same family as the shard-06 escalation header, not a naming convention.

### A-09 · `09-projects-collaboration.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** Two of the six Cross-Shard Section Contract Map entries name shards that do not exist, under titles that belong to no shard in this decomposition.

**Evidence.** "**Shard 17 — Royalty splits:** consume [Shard 17 — Royalty splits Contracts](17-royalty-splits.md#contracts)" and "**Shard 32 — Venue operations:** consume [Shard 32 — Venue operations Contracts](32-venue-operations.md#contracts)" — the IA directory contains 17-realtime-sessions.md and 32-show-production-planning.md; 17-royalty-splits.md and 32-venue-operations.md do not exist (there is no royalty-splits shard at all; splits live in Shard 10/18).

**What an implementer is forced to invent.** An implementer wiring Shard 09's outbound contracts has to guess which real shard each entry means — Shard 17 (realtime sessions) and Shard 32 (show production planning) both do reference 09 reciprocally, but the map's titles point at royalty splits and venue operations instead, so the wrong consumer contract gets built. The same map also omits Shard 00, 01 and 07 entirely even though Cross-Shard Dependencies declares them upstream, so PRJ-05's "roster event emits Shard 07 claim" has no named target section.

**Refutation attempt.** Verified in /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/09-projects-collaboration.md lines 342 and 345, which read verbatim: "- **Shard 17 — Royalty splits:** consume [Shard 17 — Royalty splits Contracts](17-royalty-splits.md#contracts)..." and "- **Shard 32 — Venue operations:** consume [Shard 32 — Venue operations Contracts](32-venue-operations.md#contracts)...". `ls 17-*.md 32-*.md` in the IA directory returns only `17-realtime-sessions.md` and `32-show-production-planning.md`; the two cited targets do not exist anywhere in the repo (grep for `17-royalty-splits|32-venue-operations` returns only shard 09's own lines 342, 345, 360, 363). The real shard titles are `# Shard 17 — Real-time jamming and remote sessions` and `# Shard 32 — Event production planning and advancing`, so the map's titles name subject matter that belongs to no shard. This is not the "links resolve" convention — these two demonstrably do not resolve, and the defect is identity, not link hygiene: an implementer wiring 09's outbound contracts is pointed at royalty-splits and venue-operations semantics when the reciprocal shards (17-realtime-sessions.md:279 and 32-show-production-planning.md:245 both declare `Depends on ... Shard 09`) are about sessions and production advancing. The secondary point also holds: `Cross-Shard Dependencies` (line 331) declares 00, 01 and 07 upstream, and none of the three appears in the map, so PRJ-05's "roster event emits Shard 07 claim" has no named target section.

### A-10 · `09-projects-collaboration.md` · 2 Access Model · BLOCKING

**Defect.** The role-to-sensitivity mapping that PRJ-07 (the shard's core access flow) depends on is referenced three times but never defined anywhere in the parent or the deep dive.

**Evidence.** `SensitivityClass` | `roster | review | stems | takes | restricted` with approved role-profile version"; `ResolveVaultAccess` | Union of current roster roles intersected with asset sensitivity, block state, NDA and role-profile version; no hand grants."; deep dive step 6: "calculate union of live roles, then intersect sensitivity profile, blocks, NDA, asset state and version." No table, list or default anywhere states which role maps to which sensitivity class.

**What an implementer is forced to invent.** An implementer must invent the entire vault authorization matrix — whether a Musician sees `stems`, whether a Producer sees `takes`, what the default profile is for a newly added role, and what the profile record's schema is (`access_profile_version?` in `roster_event` is an unschematized pointer). Two implementers would ship different confidentiality behaviour for the shard's most sensitive asset class.

**Refutation attempt.** Verified. The three references exist exactly as cited: line 111 `| \`SensitivityClass\` | \`roster | review | stems | takes | restricted\` with approved role-profile version |`; line 126 `| \`ResolveVaultAccess\` | Union of current roster roles intersected with asset sensitivity, block state, NDA and role-profile version; no hand grants. |`; deep-dives/09-projects-collaboration.md line 81 "On access, calculate union of live roles, then intersect sensitivity profile, blocks, NDA, asset state and version." I grepped both files for `sensitiv|role.profile|access.profile` — the only other hits are the Features bullet, AC-PRJ-07/PRJ-07 restating the same intersection, the edge case "Role taxonomy unavailable | Roster/claim commits literal; access fails closed until role profile resolves", and `roster_event`'s unschematized `access_profile_version?` (deep dive line 29). No table, list, default or entity defines which role maps to which `SensitivityClass`, and there is no `role_access_profile` model. I also checked the named upstream owner of the role taxonomy: grep for `sensitiv|access.profile` across 07-credits-core.md and deep-dives/07-credits-core.md returns ZERO hits, so the mapping is not deferred to Shard 07 either. The shard's most sensitive authorization decision is undefined.

### A-11 · `09-projects-collaboration.md` · 1 Feature Enumeration · BLOCKING

**Defect.** Three Level-1 ideation sub-features appear only as words in the Features bullets and have no interaction, contract, data model, access rule, event or edge case; a fourth exists only as a data-model row.

**Evidence.** Features line 32 promises "advisory revision counting" (ideation 07.05.05 Revision Round Counting & Scope Enforcement), line 34 promises "reference briefs" (07.07.01 Mix Brief & Reference Board), line 35 promises "gated remix stems" (07.08.05 Remix Stems Delivery & Remix Programs). Grepping the parent and deep dive, "brief" and "remix" occur only on those Features lines, and every other "revision" hit is the boilerplate "enforce revision and idempotency". 07.06.04 (track sheet/channel map/recall) appears only as "`environment_archive` / `recall_sheet_version` | Labelled asset archive/manifest availability and filtered track/channel/room data."

**What an implementer is forced to invent.** There is no round object, no round counter, no scope term, no reference-track entity, and no outward stem-release flow. 07.08.05 is described in ideation as "the only feature in all of domain 07 where the Fan has any access", yet Shard 09's Access Control table contains no Fan or public actor row at all — so the implementer must invent the public access model, the opt-in gate and the revocation semantics for the domain's most sensitive asset class.

**Refutation attempt.** Verified by grep across both files. "brief" occurs exactly once — line 34, the 07.07 Features bullet. "remix" occurs exactly once — line 35, the 07.08 Features bullet. "round" occurs zero times. Every "revision" hit outside line 32 is either the boilerplate "(4) enforce revision and idempotency" or the registry's "additive events, revisions or evidence" phrase. The three ideation sub-features are real Level-1 nodes on disk: `07.05-review-feedback-approval/07.05.05-revision-round-counting-scope.md`, `07.07-mix-master-workflow/07.07.01-mix-brief-reference-board.md`, `07.08-delivery-readiness-qc/07.08.05-remix-stems-delivery-programs.md`. There is no round entity or counter, no reference/brief entity, and no outward stem-release interaction, contract, model, event or edge case. The Fan point also checks out: the Access Control table (lines 228-238) lists Song/project owner, Producer, Musician/contributor, Operator/room, Link recipient, Approver/client, Package recipient, Bridge device, System worker — no Fan or public actor — while ideation 07.08.05 line 15 states it is "the **only feature in all of domain 07 where the Fan has any access**". Caveat that does not save the shard: ideation Q-03 (07.08 index line 71) is an unratified `[OWNER]` question about re-homing the *program* to domains 20/21, but even the proposed split keeps "the stem set and the clearance gate" in 07, and shard 09 still advertises "gated remix stems" in its own Features list while specifying none of it.

### A-12 · `10-rights-ownership.md` · 4 User Flows · BLOCKING

**Defect.** The RGT-10 Interactions row is broken by unescaped pipe characters, and the corruption has propagated into AC-RGT-10, which now has no usable behavior or completion clause.

**Evidence.** Line 79: "| RGT-10 | Resolve control summary | System derives ... honestly. | `authorized | blocked | no_recorded_obstacle` with evidence links. |" (six cells in a four-column table). Line 54: "**AC-RGT-10 — Resolve control summary:** Given System derives ownership/control/encumbrance/covenant outcome from consented records and labels uncertainty honestly., when the actor invokes this flow, then the system MUST ... (5) Resolve control summary, and (6) return `authorized; if the flow cannot complete, blocked."

**What an implementer is forced to invent.** AC-RGT-10 is the only acceptance criterion for the control-resolution flow that every downstream gate (release, licensing, payout) consumes. Step (5) restates the flow name instead of a behavior, and step (6) returns the literal string "`authorized" with the rest of the verdict enum lost. An implementer must reconstruct the verdict set and its inputs from deep-dives/10 § Chain, Control and Reversion Algorithm step 5, and has no testable criterion for the parent flow at all.

**Refutation attempt.** Confirmed at 10-rights-ownership.md:79 — the Completion cell contains unescaped pipes inside a code span, producing a six-cell row in a four-column table, and the corruption is in the generated AC, not just the render. Line 54 verbatim: "**AC-RGT-10 — Resolve control summary:** Given System derives ownership/control/encumbrance/covenant outcome from consented records and labels uncertainty honestly., when the actor invokes this flow, then the system MUST (1) validate inputs ... (5) Resolve control summary, and (6) return `authorized; if the flow cannot complete, blocked." The Given clause holds the Required-behavior cell, step (5) restates the flow title, step (6) returns the truncated literal "`authorized", and the refusal clause is the stray enum member "blocked." I scanned all 43 shards for over-celled Interactions rows: this is one of only four instances layer-wide (also AC-IDA-15, AC-PRF-15, AC-CMS-15), so it is a generator defect, not a convention, and not the logged 00-23 precondition schema gap. Partial correction to the auditor: the verdict enum is not lost from the document — § Interactions RGT-10 still carries "`authorized | blocked | no_recorded_obstacle` with evidence links" and § Contracts `MasterControl` gives the derivation, so no trip to the deep dive is required. But AC-RGT-10 itself has no usable behavior or completion clause, which is what the claim asserts.

### A-13 · `14-services-marketplace.md` · 3 Data Model · BLOCKING

**Defect.** `RightsPosture` is declared a closed vocabulary but the vocabulary is never enumerated in the shard, its deep dive, or Shard 10.

**Evidence.** 14 § Contracts, Core Types and Errors: "`RightsPosture` | Closed master and composition vocabularies; `creates_none` explicit; no default/free text". Every sibling type in the same table is fully enumerated (e.g. "`ExitKind` | `buyer_cancel | seller_cancel | abandonment | mutual_release`"). deep-dives/14 § Multi-Party Supply and Rights Execution only adds "Master/composition posture has no default and remains symmetric/plain-language."

**What an implementer is forced to invent.** SRV-01 requires the seller to choose a posture at listing time, SRV-03 freezes it into the quote, and SRV-16 executes it against Shard 10 allocation. With only `creates_none` named, an implementer must invent the entire enum (buyout? exclusive licence? points? co-ownership?) and therefore also invent which Shard 10 instrument each member maps to.

**Refutation attempt.** I grepped the entire IA layer for the vocabulary tokens and got exactly one hit — the declaration itself: `grep -rn "work_for_hire|co_ownership|creates_none|creates none" ia/` returns only `ia/14-services-marketplace.md:100: | RightsPosture | Closed master and composition vocabularies; `creates_none` explicit; no default/free text |`. Nothing in deep-dives/14 (only "Master/composition posture has no default and remains symmetric/plain-language") and nothing in Shard 10 (`RightType` is right types, not postures). The auditor's internal-consistency point holds: every sibling in that same table is fully enumerated (`PricingShape`, `AnonymityLevel`, `EngagementState`, `ExitKind` = `buyer_cancel | seller_cancel | abandonment | mutual_release`). The vocabulary exists upstream and was not carried down — ideation 05.01.02 states it exactly: "| Rights posture | work-for-hire · licence · co-ownership · points · `creates none` (composition only) | 05.06.01 | **2 per tier** ...". That upstream file is not a shard section the IA cites for this, so an implementer of SRV-01/SRV-03/SRV-16 has a closed vocabulary with one named member.

### A-14 · `18-royalty-accounting.md` · 1 Feature Enumeration · BLOCKING

**Defect.** Level-1 sub-feature 10.01.06 Neighbouring Rights & Performer Registration (MoSCoW SHOULD) is entirely absent from the shard and its deep dive, despite the shard claiming full reconciliation of 10.01's children.

**Evidence.** Features: "**10.01 Society Registration & Delivery** — [ideation source](../ideation/10-royalties-collections/10.01-society-registration-delivery/10.01-society-registration-delivery-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below." plus Scope Reconciliation row "| Child capabilities reconciled | 24 |". Grep of the shard and its deep dive returns zero occurrences of "performer", "ISRC", "featured" or "neighbouring"; every registration model is work-scoped (`registration_submission` = "Work/society/territory payload version...").

**What an implementer is forced to invent.** An implementer has no entity for a registration keyed on (performer, recording ISRC, featured/non-featured role), no eligibility derivation from the credit graph (ideation D-01), and no representation of ideation D-06's mandatory confirmation prompt and permanent `unconfirmed` tag when someone other than the performer asserts the featured flag. All of it must be invented, including whether it reuses `registration_submission` or needs a separate aggregate.

**Refutation attempt.** I could not refute this. Grep over both /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/18-royalty-accounting.md and its deep dive returns zero hits for 'performer', 'neighbouring', 'ISRC' or 'featured' (the only 'recording'/'master' hits are 'recording→work allocation' in the calculation algorithm and 'work/master' scoping on deal terms). Every registration artefact is work-keyed: `registration_submission` / `registration_observation` = 'Work/society/territory payload version, channel/sequence/receipt/expected-by and belief history'; `RegistrationBelief` = 'Work/society/territory/state/...'; ROY-02 is 'User validates work registration'. The reconciliation claim is quantified and exact: 'Child capabilities reconciled | 24', and `grep -c '| 18-royalty-accounting |' feature-ledger.md` returns exactly 24 rows, one of which is '`10.01.06` 10/neighbouring-rights-performer-registration | Neighbouring Rights & Performer Registration | Royalties & Collections | Should'. I checked the obvious escape hatch — Shard 10 — and it does not cover this: 10-rights-ownership.md's only registration artefact is `registration_draft` 'Jurisdiction/form/group/source versions/gaps/artifact/submission evidence' (copyright-office filing), and its `RightType` enum merely lists `performer | neighbouring` as rights positions, with the Performer role limited to 'Confirm performance fact and own neighbouring/NIL position'. The ideation feature is structurally incompatible with what Shard 18 built — 10.01.06 states the registration 'is keyed on **(performer, recording, role)**' and 'inverts almost everything' relative to 10.01.02's work payload — so an implementer cannot fold it into `registration_submission`, and eligibility-from-the-credit-graph plus the featured/non-featured assertion have no representation anywhere in the shard.

### A-15 · `18-royalty-accounting.md` · 3 Data Model · BLOCKING

**Defect.** `RegistrationBelief` declares a `state` field whose values are never enumerated, while every sibling core type in the same table enumerates its members.

**Evidence.** Core Types and Errors: "| `RegistrationBelief` | Work/society/territory/state/effective observation/age/expected-by; not society truth. |" versus "| `ParseState` | `received`, `parsing`, `reconciled`, `unoracled`, `blocked`, `superseded`. |" and "| `PayoutGate` | `disabled_b3`, `provider_unready`, `eligible`, `held`, `submitted`, `paid`, `failed` ...".

**What an implementer is forced to invent.** ROY-04's terminal outcome ("Known outcome, conflict route or overdue alarm") and Shard 19's `money_in_flight_expectation` ("Registration/calendar/work/right/period/due state") both key on this state machine. The implementer must invent its members, including whether ideation 10.01.05 D-02's first-class `registered / unmatched` state exists — the state that distinguishes a successful MLC registration from money still sitting in the unmatched pool.

**Refutation attempt.** Verified absent. In 18-royalty-accounting.md § Core Types and Errors, `RegistrationBelief` reads only 'Work/society/territory/state/effective observation/age/expected-by; not society truth' while all four sibling state types in the same table are exhaustive: `ParseState` '`received`, `parsing`, `reconciled`, `unoracled`, `blocked`, `superseded`'; `MappingState` '`proposed`, `confirmed`, `rejected`, `reversed`, `review_required`'; `CalculationState` '`ready`, `incomplete`, `held_terms`, `held_rights`, `calculated`, `restated`'; `PayoutGate` seven members. The Typed Field and Cardinality Registry forces the field closed ('`state|status|type|kind|class: closed enum`') and stamps '`state: closed enum`' onto both `registration_submission` and `registration_observation`, yet no member list exists anywhere. I checked the deep dive: the nearest text is Registration and Recovery step 4, 'Acknowledgement/rejection creates per-work/society/territory belief with age, translated action/owner or explicit untranslatable state' — prose, not an enumeration, and it does not settle whether a distinct `registered` vs `unmatched` member exists. ROY-04's terminal outcome ('Known outcome, conflict route or overdue alarm') and the edge case 'Society silent past expected-by | Create overdue observation/alarm' imply members without enumerating them. One of the auditor's two downstream hooks is wrong — Shard 19's `money_in_flight_expectation` 'due state' is 19's own enumerated `InFlightState = scheduled|due|arrived|overdue|unknown` — but the other holds: deep-dives/19 Forecast step 2 requires 'active registration', which keys on exactly this unenumerated machine.

### A-16 · `22-release-distribution.md` · 1 Feature Enumeration · BLOCKING

**Defect.** Level-1 sub-feature 12.02.04 MEAD Enrichment Delivery is absent from the entire shard — no interaction, contract, type, error, data model, event or edge case — although its parent 12.02 is listed in `## Features` and feature-ledger.md assigns 12.02.04 to this shard.

**Evidence.** `## Features` line: "- **12.02 DDEX Delivery Messaging** — [ideation source](../ideation/12-release-distribution/12.02-ddex-delivery-messaging/12.02-ddex-delivery-messaging-index.md)"; that index's Children table row 04 is "MEAD Enrichment Delivery". `grep -in "mead\|enrich" 22-release-distribution.md deep-dives/22-release-distribution.md` returns zero hits; feature-ledger.md:567 — "`12.02.04` 12/mead-enrichment-delivery | MEAD Enrichment Delivery | … | 22-release-distribution".

**What an implementer is forced to invent.** The whole enrichment path is dropped: an implementer has no MEAD message kind in `GenerateDeliveryMessage`, no pre-fill-from-session-record rule (12.02.04 D-01), no witnessed-vs-inferred provenance marker on tempo/key (D-02, the rule that stops inference being delivered as artist assertion), no shared-source constraint with the editorial pitch (D-03) and no never-blocking guarantee (D-04). They must either invent all four or silently ship without the feature.

**Refutation attempt.** Verified absent. `grep -in "mead\|enrich" 22-release-distribution.md deep-dives/22-release-distribution.md` returns exit 1 — zero hits in both files. I also searched for the concept under other names: "tempo", "mood", "descript" — zero hits; "infer" — zero hits (the only `*Provenance` type is `IdentifierProvenance`, about ISRC/UPC supply). `partner_knowledge_version` names only "ERN" as the message kind, and `delivery_message` has no message-kind field. The MoSCoW defence does not hold: the shard's own Scope Reconciliation claims "Child capabilities | 25", and there are exactly 25 domain-12 rows in feature-ledger.md, so 12.02.04 is inside the declared scope; and the shard does cover every other Could row (12.04.03 pre-save and 12.04.04 timeline via DST-13, 12.06.01/12.06.02 via DST-18/19) and even the Won't row 12.06.03 ("dispute action"). The ideation file is substantive, with four decisions — D-01 pre-fill from the session record, D-02 "Inferred values are marked inferred and are correctable", D-03 one shared source with the editorial pitch, D-04 "MEAD is never blocking" — and none of the four has any expression in the shard. The `## Features` line for 12.02 nevertheless asserts it is "represented in the normative interactions, contracts, data model, access rules and edge cases below", which is false for this child.

### A-17 · `28-digital-licensing-commerce.md` · 3 Data Model · BLOCKING

**Defect.** Contributor statements are required to "reconcile to penny" but no rounding or remainder-allocation rule exists anywhere in the shard or its deep dive.

**Evidence.** | 28.18 | Close contributor period | Period/rate/split versions frozen | Evidentiary statement reconciles to penny; agreed shares payable/held under gate | Unresolved/departed shares remain non-forfeitable held funds |

**What an implementer is forced to invent.** Allocating one acquisition's consideration across N assets in a pack and then across M payees per `PromotionAllocation` + `ContributorAccrual` requires a deterministic rounding direction and a rule for where the leftover cent lands. None is given, and there is no reference to the ordering convention the project already ratified for Shard 10's ownership ledger. Two implementers produce different per-payee statements from identical inputs, and the AC is untestable as written.

**Refutation attempt.** I read 28-digital-licensing-commerce.md and deep-dives/28-digital-licensing-commerce.md in full and grepped the whole IA layer for rounding/remainder language. Shard 28 and its deep dive contain no occurrence of round, remainder, residual, tie key, or allocation ordering. What they do contain are three assertions of determinism that require the missing rule: `PromotionAllocation` — "Every acquired item has deterministic consideration"; `ContributorAccrual` — "Append-only and penny-reconcilable"; AC-28.18 — "Evidentiary statement reconciles to penny"; `CloseContributorPeriod` — "statement totals equal ledger". The deep dive assigns the work to this shard and stops: "This shard authors acquisition consideration allocation, asset attribution, period rate, accrual/reversal and held-funds records." The gap is sharper than the auditor states. The architecture design (`2026-08-02-architecture-design.md`, cited as Source by every shard) fixes "Amounts use integer minor units and ISO currency", so allocation is over integers and a remainder is unavoidable. Meanwhile the project's one ratified rule lives in a shard 28 never cites — 18-royalty-accounting.md `RoundPayableAggregate`: "Round once at future payable boundary by largest remainder with stable tie key; never line-by-line" — and shard 28's per-acquisition per-asset per-payee accrual is line-by-line, so it either contradicts that rule or is silent. Shard 10, which 28 does cite, offers only "Unbalanced draft | Persist as unallocated… no auto-remainder", which governs share sums, not cent allocation. Two implementers produce different per-payee statements from identical inputs.

### A-18 · `29-venues-spaces.md` · 3 Data Model · BLOCKING

**Defect.** The Typed Field and Cardinality Registry contains a phantom entity named `Aggregate` generated from the Canonical Aggregates table header row.

**Evidence.** - **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; ... Constraints/relationships: Key relationships and invariants.

**What an implementer is forced to invent.** An implementer reading the registry sees a nineteenth entity to create, whose only stated constraint is the literal column heading "Key relationships and invariants." It is indistinguishable in form from the eighteen real entries beside it, and its presence shows the registry is machine-generated rather than authored, which undermines the eighteen legitimate rows that carry the shard's only field typing.

**Refutation attempt.** Located verbatim at 29-venues-spaces.md line 176, the first bullet of the Typed Field and Cardinality Registry: "- **`Aggregate`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; … Constraints/relationships: **Key relationships and invariants**." That trailing string is the literal column heading of the Canonical Aggregates table at line 133 ("| Aggregate | Key relationships and invariants |"), which proves the entry was generated from the header row and not authored. It is formatted identically to the eighteen real entries beside it (`Place`, `Room`, `RoomRelationship`, … `ConformanceRun`), each of which ends with its own row's real constraint text, so nothing in the form distinguishes the phantom from the genuine. I confirmed the same artifact in seven sibling shards (30, 31, 32, 33, 34, 35, 36), so it is systematic rather than a one-off typo. In a section that carries the shard's only field typing, a nineteenth entity whose sole stated constraint is a column label is a defect, not a style preference.

### A-19 · `30-booking-contracts.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** `AuthorizeAnnouncement` returns `EMBARGO_ACTIVE` but no embargo state, owner, aggregate or producing shard is defined anywhere in shard 30 or its deep dive.

**Evidence.** | `AuthorizeAnnouncement` | deal, prerequisite evidence/version | authorization | `DEPOSIT_UNSATISFIED`, `LINEUP_UNRESOLVED`, `EMBARGO_ACTIVE`, `HARD_GATE_FAILED` |

**What an implementer is forced to invent.** Deep dive 30 § Confirmation and Announcement step 3 enumerates the gate as 'non-waivable identity/date/room/lineup honesty and accepted-deal prerequisites' — embargo is absent. The only `embargo` field in the layer is Shard 35 `OnSaleSchedule` ('Venue-local/UTC announce/public/presale windows, embargo and job states'), but shard 30 declares Shard 35 only under '**Depended on by:**', i.e. purely downstream. An implementer writing the announce gate must invent what an embargo is, who sets it, and how a downstream shard's state is read back into an upstream gate without a declared contract.

**Refutation attempt.** I could not find any definition of the announce embargo. A grep for "embargo" across the entire ia/ layer returns hits only in shards 04, 07, 08, 30, 35 and deep dives 01/02/04/07. In shard 30 the ONLY three occurrences are the error code itself (line 132 `AuthorizeAnnouncement` … `EMBARGO_ACTIVE`) and the two identical failure clauses (line 72 AC-30.14 and line 104 flow 30.14: "Deposit/lineup/embargo gap returns exact blocker"). Deep dive 30 § Confirmation and Announcement enumerates the gate exhaustively and embargo is absent: "3. Announcement gate evaluates non-waivable identity/date/room/lineup honesty and accepted-deal prerequisites. 4. Deposit gate follows accepted schedule… 5. Waivable operational prerequisites require both principals… 6. Gate emits authorization only; downstream ticketing/publishing owns announcement artifact and timing." The Architecture Decisions row says only "Announcement is separate and requires hard preconditions plus contract-defined deposit state." No aggregate, no field, no state machine, no event, no edge case covers embargo. Shard 35's `OnSaleSchedule` ("Venue-local/UTC announce/public/presale windows, embargo and job states") cannot be the source: shard 35 § Boundary Rules states "Shard 30 owns deal/announce authority; Shard 35 owns fan-facing product/schedule execution" and AC-35.04's precondition is "Shard-30 authorization" — i.e. 35's embargo is strictly downstream of the gate that returns EMBARGO_ACTIVE. One correction to the auditor: shard 30's Cross-Shard Section Contract Map DOES declare a consume direction from 35 ("consume [Shard 35 Contracts](…#contracts) into this shard § Contracts"), so "purely downstream" overstates it — but that row is uniform boilerplate present for all eight listed shards and points at a nonexistent file, so it supplies no embargo contract. The dangling error code stands.

### A-20 · `33-show-day-operations.md` · 8 Testability · BLOCKING

**Defect.** AC-33.07 is truncated mid-value at an unescaped pipe character, leaving the curfew flow with no stated success output and no failure path.

**Evidence.** - **AC-33.07 — Evaluate curfew margin:** Given Venue constraints and duration ranges available, when the actor invokes this flow, then the system MUST (1) validate inputs, … (5) Evaluate curfew margin, and (6) return `breach; if the flow cannot complete, tight.

**What an implementer is forced to invent.** The corresponding interaction row reads '`breach|tight|clear` range with uncertainty/provenance renders | Unknown/stale constraint returns unknown risk', so the AC has lost the `clear` state and the entire unknown/stale failure branch. Deep dive 33 § Timeline and Slippage states a fourth state — 'Evaluate several venue-sourced curfew constraints and uncertainty into breach/tight/clear/unknown' — so the shard offers three conflicting enumerations (2, 3 and 4 members) of the same return type. An implementer cannot write the curfew evaluator's return contract or a test for it.

**Refutation attempt.** Confirmed verbatim at shard 33 line 60: "- **AC-33.07 — Evaluate curfew margin:** Given Venue constraints and duration ranges available, when the actor invokes this flow, then the system MUST (1) validate inputs, … (5) Evaluate curfew margin, and (6) return `breach; if the flow cannot complete, tight." The AC generator split the source cell on the unescaped pipe in the interaction row: line 83 reads "| 33.07 | Evaluate curfew margin | Venue constraints and duration ranges available | `breach|tight|clear` range with uncertainty/provenance renders | Unknown/stale constraint returns unknown risk |". The AC therefore ends mid-token with a dangling backtick, loses `clear` and the "range with uncertainty/provenance" output, and its failure clause is the orphaned fragment "tight" instead of "Unknown/stale constraint returns unknown risk." This is a mechanical corruption of a normative testable criterion and is not covered by any of the calibrated conventions. Two qualifications against the auditor: the severity is overstated — the complete contract is recoverable one section away at line 83 and in deep dive 33 line 24 ("Evaluate several venue-sourced curfew constraints and uncertainty into breach/tight/clear/unknown") — and the "three conflicting enumerations (2, 3 and 4 members)" reasoning is wrong: the '2-member' set is the corruption itself, and 3+unknown reconciles to 4 because `unknown` sits in the same row's failure column. The defect is the garbled AC line, not a semantic disagreement about the return type.

### A-21 · `35-ticket-products-sales.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** Shard 35's consumer list and Cross-Shard Section Contract Map cite two shards that do not exist in the layer, and omit the two shards that actually consume it.

**Evidence.** "- **Depended on by:** [[specs/ia/36-box-office-risk|Shard 36]], [[specs/ia/37-ticket-resale-refunds|Shard 37]], [[specs/ia/39-fan-discovery|Shard 39]]" and "- **Shard 37:** consume [Shard 37 Contracts](37-ticket-resale-refunds.md#contracts) into this shard `§ Contracts`"; the directory contains only 37-fanbase-direct-to-fan.md and 39-analytics-ingestion-reporting.md, while 38-promotion-marketing.md declares "| `TicketConversionAttributionV1` | Shard 35 → promotion reporting |" and 39 declares "ticket facts from [[specs/ia/35-ticket-products-sales|Shard 35]]".

**What an implementer is forced to invent.** An implementer wiring shard 35's outbound contracts must invent which shards consume `ticketing.order.changed`, `ticketing.waitlist.offer_changed` and the ticket-conversion feed. The map points ticket resale/refund at a nonexistent "Shard 37 — ticket resale refunds" when that scope actually lives in shard 36, and neither 38 nor 39 appears as a consumer despite both declaring inbound contracts from 35.

**Refutation attempt.** Verified on disk. `35-ticket-products-sales.md:270` reads "- **Depended on by:** [[specs/ia/36-box-office-risk|Shard 36]], [[specs/ia/37-ticket-resale-refunds|Shard 37]], [[specs/ia/39-fan-discovery|Shard 39]]" and lines 280-281 point at `37-ticket-resale-refunds.md#contracts` and `39-fan-discovery.md#contracts`. `ls` of the layer confirms MISSING 37-ticket-resale-refunds.md and MISSING 39-fan-discovery.md — the only two files at those indexes are `37-fanbase-direct-to-fan.md` and `39-analytics-ingestion-reporting.md`, and a layer-wide grep for those two slugs returns hits ONLY in shard 35 (3 lines), i.e. no other shard ever used those names — so this is not a rename that resolves elsewhere. The convention exemption 'all relative markdown links resolve' does not hold for these two links, and the defect is not merely link rot: the consumer list is substantively wrong. The real consumers each declare the inbound edge — `37-fanbase-direct-to-fan.md:321` and `38-promotion-marketing.md:353` and `39-analytics-ingestion-reporting.md:265` all list `[[specs/ia/35-ticket-products-sales|Shard 35]]` under **Depends on**, and 38 declares the outbound payload at line 148 ("| `TicketConversionAttributionV1` | Shard 35 → promotion reporting | order/ticket, event, eligible click, settlement/refund state |") — yet Shard 38 appears nowhere in 35's consumer list or its Cross-Shard Section Contract Map. I could not locate any place in shard 35 naming 38 as a consumer. Scope note: I found the same class of stale reference in `31-live-settlement-intelligence.md:321` ("[[specs/ia/34-event-ticketing|Shard 34]], [[specs/ia/41-career-business|Shard 41]]" — also nonexistent filenames), so this is likely a family defect rather than a one-off, but the shard-35 instance the auditor cites is real and correctly described.

### A-22 · `37-fanbase-direct-to-fan.md` · 1 Feature Enumeration · BLOCKING

**Defect.** Name-your-price pricing and bundles — two of the three mechanics in ideation sub-feature 20.04.03 — appear nowhere in the shard or its deep dive.

**Evidence.** Features row "- **20.04 Direct-to-Fan Storefront**" resolves to ideation 20.04.03 "Digital Music Sales, Name-Your-Price & Bundles" [DEEP], whose ratified decisions include "D-06 | Partial refunds use component notional values captured at listing, scaled to the price paid" and "D-11 | **The NYP basis is a platform-wide constant (paid-net)**". Shard 37's only pricing statement is "Finite variants reserve stock for 15 minutes; price holds 30 minutes; money uses integer minor units and immutable sale currency", and grep for "name-your-price", "NYP" and "bundle" returns only the unrelated line "no preselected marketing checkbox, color-only state or bundled acceptance".

**What an implementer is forced to invent.** `product_listing` carries a single `price`, so an implementer must invent the minimum-price and suggested-price fields, the over-payment capture path and the paid-net display obligation; and with no bundle or bundle-component entity there is no `component notional value` field, so D-06's partial-refund rule and the bundle's instant-digital/deferred-physical two-lifecycle order cannot be built at all.

**Refutation attempt.** I confirmed the absence by grep over both files: `grep -rn -i 'name-your-price|name your price|NYP|bundle' 37-fanbase-direct-to-fan.md deep-dives/37-fanbase-direct-to-fan.md` returns exactly one line — `37:237`, "...no preselected marketing checkbox, color-only state or **bundled** acceptance" — which is consent UI, not commerce. A layer-wide grep for 'name-your-price'/'name your price' returns zero hits in all 43 shards and 41 deep dives; the only bundle machinery anywhere is shard 28's unrelated software/vendor promotions (`28:63` `Create promotion/bundle`), a different domain. Shard 37 does claim the scope: line 54 lists "**20.04 Direct-to-Fan Storefront** ... represented in the normative interactions, contracts, data model, access rules and edge cases below", and its Scope Reconciliation asserts "Child capabilities | 27 across 20.01-20.07" — I counted the ideation tree (5+3+4+4+6+4 leaves plus the 20.07 leaf file = 27), so 20.04.03 "Digital Music Sales, Name-Your-Price & Bundles" `[DEEP]` is inside the claimed 27. No boundary row defers it: the Commerce boundary excludes only "marketplace, escrow or collaborator payout under counsel gate B3" and the Money row defers splits, neither of which is a pricing or product mechanic. The model confirms the gap — `37:126` is "| `ProductListingV1` | Storefront -> catalog projection | entity, kind, source object, payout-term version, **price**, currency, fulfillment policy |" (single price, no minimum/suggested/over-payment), and `37:152` "| `store` / `product_listing` / `product_variant` |" has no bundle or bundle-component entity, so ideation D-06's "component notional values captured at listing" has nowhere to live. Partial credit to the shard: D-11's paid-net basis IS carried (`37:40`, "Paid-net is the versioned platform basis term"), so the auditor overstates on that one sub-point; the NYP mechanic and bundles themselves are genuinely absent.

### A-23 · `42-career-planning-risk.md` · 1 Feature Enumeration · BLOCKING

**Defect.** Goal progress carries a single value with no verified/declared trust dimension, which violates the domain-wide invariant that binds every ledger consumer.

**Evidence.** "| `GoalProgressV1` | Source projections → goal view | goal, value/state, source revision, integrity/freshness, derived-at | Unknown/stale cannot become achieved |". Domain 23 INV-03 (career-finance-business-cx.md): "**Verified and declared are never summed.** Trust tiering is a property of every row and is destroyed by any consumer that averages across it." Ideation 23.05.01 Q-01 resolution: "a goal derives over both tiers and reports them segregated — never one blended bar". `grep -i "verified\|declared"` in Shard 42 hits only the cohort rule "Verified income only" — nothing in the goal sections.

**What an implementer is forced to invent.** An income-shaped goal ("earn £2,000/month from sessions", the ideation's own example) renders one blended number across verified and declared income, silently breaching the invariant. The implementer must invent the segregated progress shape — two values, a per-tier breakdown, or a tier-scoped derivation — with nothing in the shard to constrain the choice.

**Refutation attempt.** I located this gap and can quote both sides. Shard 42 § Contracts: "| `GoalProgressV1` | Source projections → goal view | goal, **value/state**, source revision, integrity/freshness, derived-at | Unknown/stale cannot become achieved |" — one value, and "integrity/freshness" is series integrity (coverage/gaps), not trust tier, which Shard 41 keeps as a separate axis ("Trust | Only platform-observed source facts can be `verified`; imports are permanently `declared`. **Verified and declared never merge into one statement headline**", `IssuedFinancialSnapshotV1` "trust bands"). Grep across shard 42 for verified/declared returns only the cohort rule "Verified income only" and the unrelated insurance "declared policy attributes" — nothing in the goal contract, entity (`goal_progress_projection` "Disposable source-versioned value/state/integrity/freshness"), event (`career.goal.progress_changed.v1` "goal, state/value, source revision, integrity, derived-at") or Architecture Decisions ("Progress | Derived from canonical source facts and source integrity"). Upstream this is explicitly locked: INV-03 in `career-finance-business-cx.md` — "**Verified and declared are never summed.** Trust tiering is a property of every row and is destroyed by any consumer that averages across it" — and 23.05.01 Q-01 is marked RESOLVED with "a goal derives over both tiers and **reports them segregated — never one blended bar**", explicitly binding goals as a ledger consumer. The shard neither carries the segregated shape nor states the alternative as a decision; the only counter-signal is the Overview's passing "verified income/runway/finance facts from Shard 41", which would silently reverse Q-01's "it counts" rather than implement it — leaving the implementer to adjudicate between the two.

### A-24 · `deep-dives/01-identity-authority.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** The Cross-Shard Contracts table names its consumers by ideation-domain number, not IA shard number, so three of seven rows publish Shard 01's authority contract to the wrong shards.

**Evidence.** "| Shard 20 fanbase | Alias/band lifecycle, name disposition, successor/fork lineage, memorialised projection. |", "| Shard 23 finance | Party/payee identity and treasury authorization; no pooled/multi-party entitlement. |", "| Shard 24 moderation | Disputed membership, identifier collision, false death, succession, merge/claim case references |" — index.md assigns 20 = "Licensing core and instrument lifecycle", 23 = "Gear identity, provenance and recovery", 24 = "Gear collections, rigs, custody and manifests"; fanbase is 37, career finance is 41, trust & safety is 06.

**What an implementer is forced to invent.** Shard 01 declares "Depended on by: Shards 02–18, 20, 23–25, 27, 29–30, 37, and 39", so implementers of shards 20, 23, 24, 37 and 41 cannot determine which identity contract they are entitled to consume. The same table is the only place the party/payee and treasury-authorization contract is published, so the finance consumer has no correct source at all. Row "Shards 25/27/29/30/37/39" is likewise unresolvable against either numbering.

**Refutation attempt.** Verified in /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/deep-dives/01-identity-authority.md lines 171-173, quoted exactly: "| Shard 20 fanbase | Alias/band lifecycle, name disposition, successor/fork lineage, memorialised projection. |", "| Shard 23 finance | Party/payee identity and treasury authorization; no pooled/multi-party entitlement. |", "| Shard 24 moderation | Disputed membership, identifier collision, false death, succession, merge/claim case references; moderation does not rewrite evidence. |". index.md assigns IA 20 = licensing core, 23 = gear provenance, 24 = gear holdings; fanbase is IA 37, career finance IA 41, trust & safety IA 06 — while ideation-index.md assigns 20 = Fanbase, 23 = Career/Finance, 24 = Trust/Safety, confirming the three rows use ideation numbering inside an IA table whose other rows ("Shard 02 profiles/claims", "Shards 03–05 CMS/admin") use IA numbering. I confirmed this table is the only publication point: 01-identity-authority.md's Cross-Shard Section Contract Map lists only Shard 00, the decomposition plan, and Shard 02, and its "Depended on by: Shards 02–18, 20, 23–25, 27, 29–30, 37, and 39" is quoted correctly. The finance row has no correct source at all — 41-career-finance.md declares "Depends on: Shard 00, Shard 14, Shard 18, Shard 26, Shard 28, Shard 31" and does not list Shard 01. One overreach: the auditor's parenthetical that "Shards 25/27/29/30/37/39" is "unresolvable against either numbering" is wrong — that row resolves cleanly under IA numbering (gear market, digital catalog, venues, booking, fanbase, analytics), which only sharpens the internal inconsistency with the "Shard 20 fanbase" row. Core claim survives.

### A-25 · `deep-dives/04-cms-delivery-media.md` · 5 Cross-Shard Contracts · BLOCKING

**Defect.** Media rights eligibility depends on state owned by Shards 06, 10 and 20, but those dependencies are undeclared, cite no section, are absent from the Section Contract Map, and point to higher-numbered shards in violation of the layer's stated dependency direction.

**Evidence.** "Upload/possession/self-claim is never verified rights. Shard 10/20/06 state may verify, dispute, revoke, or hold." and "| Shard 06/10/20 | Consumes dispute/takedown/right/licence state and performs delivery revoke/purge; does not adjudicate. |"; the parent declares only "**Depends on:** Shard 00 platform contracts, Shard 01 authority, and Shard 03 CMS definition/publication control plane" and models `TakedownCaseLink` as "asset/reference/right, Shard 06/rights case, scope, hold, state/effective time"; index.md states "Dependencies only point to lower-numbered shards."

**What an implementer is forced to invent.** Implementing the eligibility rule ("no dispute/takedown/hold conflict, and current source-domain permission") and the `TakedownCaseLink.case` foreign reference requires a contract shape and event name that are never cited — no section, no event type, no field list — so the implementer must invent the case identifier type and the read path for dispute/licence state.

**Refutation attempt.** All four structural assertions check out and I located the absences. deep-dives/04-cms-delivery-media.md line 90: "Upload/possession/self-claim is never verified rights. Shard 10/20/06 state may verify, dispute, revoke, or hold." and line 149: "| Shard 06/10/20 | Consumes dispute/takedown/right/licence state and performs delivery revoke/purge; does not adjudicate. |" — while eligibility at line 88 requires "no dispute/takedown/hold conflict, and current source-domain permission". The parent 04-cms-delivery-media.md declares only "**Depends on:** Shard 00 platform contracts, Shard 01 authority, and Shard 03 CMS definition/publication control plane" and "**Depended on by:** Shard 05", and its Cross-Shard Section Contract Map contains entries for Shards 00, 01, 03 and 05 only — no 06, 10 or 20, and no section anchor for any of them. The reverse direction is equally silent: 06-trust-safety.md's "Depended on by: Shards 11–16, 25–31, 33, 35–37 and 40" and 10-rights-ownership.md's "Depended on by: Shards 14, 18, 20, 21, 22, 27 and 28" both omit Shard 04. index.md line 9 states "Dependencies only point to lower-numbered shards." Two overreaches worth flagging to the auditor: the case identifier type is NOT unspecified — the parent's own Typed Field and Cardinality Registry fixes `*_id: uuid` — and the event names do exist upstream (06 publishes `safety.dmca.changed.v1` with consumers "Asset availability, ledger, notice"; 10 publishes `rights.conflict.changed.v1` and `rights.freeze.changed.v1`). They are simply never cited from Shard 04. The undeclared, unanchored, direction-violating dependency itself survives.

### A-26 · `00-infrastructure.md` · 3 Data Model · PARTIAL

**Defect.** The Typed Field and Cardinality Registry declares required core fields that contradict the model rows above it and invents thirteen non-entities out of table row labels.

**Evidence.** Every entry asserts "required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`" — including "**`AuditEvent`:**" whose own row reads "`id, action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at` | Append-only; ... rows are append-only and update/delete is revoked" and "**`OutboxEvent`:**" whose row reads "immutable". The list also registers "**`Common`:**", "**`Idempotency`:**" (twice), "**`Outbox`:**", "**`Object/upload`:**", "**`Audit`:**", "**`Webhook receipt`:**" (twice) and "**`Job`:**" (three times).

**What an implementer is forced to invent.** Shard 00 has no deep dive to defer to, so an implementer generating migrations from this section adds `updated_at`/`version`/`owner_id` columns to append-only and immutable tables and creates tables named `Common` and `Object/upload`; the blanket "cardinality is N:1 to its owner/aggregate and 1:N to additive events" also contradicts the explicit Relationships section ("One `ProviderOperation` may reference many deduplicated `WebhookReceipt` records").

**Refutation attempt.** Verified line by line in /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/00-infrastructure.md. Every registry entry opens with the identical assertion "required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`" — including **`AuditEvent`**, whose own field list in the same bullet is "`id, action, actor_id, acting_party_id, target_type, target_id, decision, reason_code, correlation_id, occurred_at` | Append-only; excludes secrets, bodies, payment/evidence data, and private content." (no owner_id, no state, no version, no created_at/updated_at), and **`OutboxEvent`**, whose row ends "Written with domain mutation; immutable; payload excludes unnecessary PII." The separate `Audit` entry adds "rows are append-only and update/delete is revoked" — so the registry mandates an `updated_at` column on a table whose UPDATE privilege is revoked. I counted the phantom registrations and the auditor's figure is exact — 13 entries built from table row labels rather than entities: `Common`, `Idempotency` (twice), `Outbox`, `Job` (twice more, on top of the real `Job`), `Webhook receipt` (twice), `Provider operation` (twice), `Object/upload`, `Audit`, `Object`. `Common` even registers a CREATE TABLE fragment as an entity: "`id uuid primary key default gen_random_uuid()`; timestamps `timestamptz not null default now()`...". index.md line 15 confirms Shard 00 has no deep dive ("| 00 | ... | — |"), so there is no normative detail layer to defer to as there is in shards 02-04. The cardinality half of the claim is the weakest part — the blanket rule's "unless the row declares uniqueness" escape and the reading of a `WebhookReceipt` as "evidence" partly absorb the "One `ProviderOperation` may reference many deduplicated `WebhookReceipt` records" case (line 205) — but the append-only/immutable field contradiction and the 13 non-entities stand.

### A-27 · `00-infrastructure.md` · 2 Access Model · PARTIAL

**Defect.** The Access Escalation section repeats one byte-identical sentence for all eight principals, so no principal has a named escalation path and the text is wrong for the non-human principals.

**Evidence.** All eight bullets read identically, e.g. "- **Provider webhook:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override." — identical for "Deployment principal", "Queue/schedule principal" and "Service role".

**What an implementer is forced to invent.** A signature-rejected webhook, a failed production promotion and a leased queue consumer have no defined recovery owner; the spec instead tells an implementer to open a Trust & Safety case and issue an "expiring purpose grant" to a provider endpoint. The same block is repeated verbatim in shards 01–04, including a stray "**Principal/context:**" header row rendered as a principal in 01 and 02.

**Refutation attempt.** Verified: all eight bullets under "### Access Escalation" in /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/00-infrastructure.md are byte-identical apart from the principal label, each reading "a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override." — including "**Provider webhook:**", "**Deployment principal:**", "**Queue/schedule principal:**" and "**Service role:**". The Access Control table above it does differentiate these principals ("Provider webhook | Submit signed provider event to one provider endpoint | Raw-body signature and replay validation precede parse"; "Deployment principal | Promote approved immutable artifact and managed migrations"), which makes the uniform escalation text demonstrably wrong rather than merely repetitive: a rejected webhook signature and a failed production promotion are routed to Trust & Safety and offered an "expiring purpose grant" to a machine principal. The section therefore names no escalation path for any principal, which is the one thing it exists to do. The stray-header sub-claim also checks out — 01-identity-authority.md and 02-profiles-verification.md (line 173) both render "- **Principal/context:**" — the Access Control table's column header — as if it were a principal, and the identical block repeats across shards 01-04. This is not the logged Interactions-column schema gap; it is a different section.

### A-28 · `00-infrastructure.md` · 6 Edge Cases · PARTIAL

**Defect.** The Edge-Case Coverage Matrix repeats three identical cells for all twelve flows, asserting idempotency-key and deletion-cascade behavior for flows that have neither.

**Evidence.** "| INF-01 Public read | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | ... | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |" — identical text for INF-08 Realtime hint, INF-11 Release promotion and INF-12 Maintenance/recovery.

**What an implementer is forced to invent.** Public reads carry no `Idempotency-Key` (Contracts: "Protected retryable creates/effects require `Idempotency-Key`") and release promotion has no owner cascade, so the matrix supplies no real per-flow concurrency or cascade rule; flows whose only concurrency coverage is this matrix — e.g. DLV-02 menu publish, CMS-13 publish, IDA-11 governance activation — leave the concurrent-write outcome to the implementer. The identical matrix appears in shards 01–04.

**Refutation attempt.** Verified at /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/00-infrastructure.md line 367ff: all twelve rows (INF-01 through INF-12) carry byte-identical text in all three columns — "Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect." / "Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage." / "Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains." The contradiction with the shard's own Contracts is real: line 129 restricts keys to protected writes — "| Idempotency | Protected retryable creates/effects require `Idempotency-Key`: 8–128 printable ASCII characters, scoped and hashed before persistence. |" — so the concurrency cell is vacuous for INF-01 Public read and INF-02 Authenticated read, and the cascade cell is vacuous for INF-11 Release promotion and INF-12 Maintenance/recovery. The identical block repeats in shards 01-04 (I confirmed it in 02-profiles-verification.md lines 242-257 and 04). Not a restatement of the logged Interactions-column gap — different section, different failure. One correction for the auditor: the downstream examples are wrong. DLV-02 and CMS-13 are NOT left to the implementer — deep-dives/04 line 122 states "Menu/route/metadata version activation requires expected active manifest and complete-tree hash" and deep-dives/03 line 117 specifies the publication transaction. The defect is that the matrix itself carries no per-flow content, not that concurrency is unspecified layer-wide.

### A-29 · `05-platform-configuration-admin.md` · 2 Access Model · PARTIAL

**Defect.** Access Escalation is one identical sentence repeated for all eight capabilities and delegates recovery to an actor that has no row in the Access Control table.

**Evidence.** Each of the eight bullets reads "a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override." The Access Control table lists Settings editor, Configuration approver, Release manager, Experiment operator, Incident operator, Admin operator, Privacy/legal operator and Service principal — there is no "support" capability, and no "purpose grant" type exists in the Contracts or `AdminCapabilityGrant`.

**What an implementer is forced to invent.** The shard owns capability granting, so the undefined "support" actor is a self-referential hole: the implementer must invent a capability key, grant term, approval requirement and audit path for the one role that is allowed to recover every other role's denials, in the exact shard whose `Capability grant` contract says "Named actions/resources/scope/term, no wildcard".

**Refutation attempt.** Verified verbatim at lines 170-177: all eight bullets are the identical sentence "a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override." — one per capability (Settings editor, Configuration approver, Release manager, Experiment operator, Incident operator, Admin operator, Privacy/legal operator, Service principal). The Access Control table above it (lines 158-167) contains no support row, and grepping the shard and its deep dive for "purpose grant" returns nothing: the only grant vocabulary defined here is `Capability grant` | "**Named actions/resources/scope/term, no wildcard**; grantor cannot exceed own authority; revocation immediate; break-glass time-bounded..." (line 95) and `AdminCapabilityGrant` | "subject person, capability, resource/scope/actions, starts/ends, grantor, approval/evidence, state/version" (line 118), plus the lifecycle `pending → active → expired|revoked` (deep dive line 66). The self-reference is the shard-specific bite: this shard owns capability definition and grants, yet the one actor it names as able to recover every other capability's denials has no capability key, no term and no approval path here — while other shards freely hand that actor an expiring grant (22-release-distribution.md line 197, 39-analytics-ingestion-reporting.md line 173, 41-career-finance.md line 189), proving the role is a live layer concept this shard fails to define.

### A-30 · `06-trust-safety.md` · 2 Access Model · PARTIAL

**Defect.** The Access Escalation list is one sentence repeated verbatim for every row, begins with the Access Control table's header as if it were an actor, and routes every denial in the Trust & Safety shard to Trust & Safety.

**Evidence.** "- **Actor/capability:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant..." — "Actor/capability" is the header of the table above ("| Actor/capability | Permitted | Explicitly denied |"), and the identical sentence is then repeated for all ten real roles including Moderator, Legal/counsel and Break-glass custodian.

**What an implementer is forced to invent.** No role has a named escalation owner. "Support" is granted an "expiring purpose grant" but appears in no Access Control row, has no capability key and no term, and the Trust & Safety routing is circular for the Moderator and Independent reviewer rows — a denied moderator is told to open a Trust & Safety case with themselves. The implementer must invent the escalation actor, its grant duration and its audit requirements.

**Refutation attempt.** Verified verbatim. The Access Control table header at line 172 is `| Actor/capability | Permitted | Explicitly denied |`, and the Access Escalation list immediately below opens with "- **Actor/capability:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override." — the header rendered as an actor, same generation failure as claim 4's `Field`. That identical sentence then repeats for all ten real rows (Reporter/claimant, Case party, Public user, Moderator, Independent reviewer, Fraud/safety specialist, Legal/counsel, Break-glass custodian, System worker, Platform administrator). The shard-specific consequence is real and is not the logged Interactions-schema gap: this is the shard that OWNS the Trust & Safety case path, so "disputes route to the scoped case/Trust & Safety path" is circular for the Moderator and Independent reviewer rows. "Support" appears in no Access Control row here and has no capability key or term; other shards do carry a Support actor row (e.g. 22-release-distribution.md line 197, 37-fanbase-direct-to-fan.md line 216), which proves the role is a real layer concept that this shard leaves ungranted rather than a phrase to be ignored.

### A-31 · `07-credits-core.md` · 3 Data Model · PARTIAL

**Defect.** `CreditState.acknowledged` is unreachable — no interaction, contract or algorithm produces the transition — and `discography_curation`'s pin rank has no producing flow.

**Evidence.** "| `CreditState` | `asserted | acknowledged | contested | superseded | withdrawn` |" and deep dive "- Credit: `asserted -> acknowledged | contested -> superseded | withdrawn`" are the only two occurrences of "acknowledg" in either file; CRD-01 commits "Immutable credit version created" and no CRD flow acknowledges. Likewise "| `discography_curation` | Party + credit listed/unlisted and pin rank; cannot change ledger visibility. |" with `PageCuration` = `listed | unlisted`, while CRD-03 only renders ("pinned highlights then reverse chronology" in the deep dive) — no interaction sets listed/unlisted or pin rank.

**What an implementer is forced to invent.** The implementer must invent who acknowledges a credit and what acknowledgement means for provenance (does the credited party's acknowledgement raise the rung? step 6 says self-assertion never promotes, but says nothing about acknowledgement), and must invent the whole curation write path including its authorization and whether pin rank is unique per party.

**Refutation attempt.** Both halves verified. "acknowledg" returns exactly two hits across 07-credits-core.md and its deep dive, exactly as claimed: line 93 `| \`CreditState\` | \`asserted | acknowledged | contested | superseded | withdrawn\` |` and deep dive line 38 "- Credit: `asserted -> acknowledged | contested -> superseded | withdrawn`". No interaction produces it — the eighteen CRD rows contain no acknowledgement flow, and the two candidates are ruled out by their own contracts: `ClaimCredit` | "Identity proof links claimant; **it does not confirm credit**", and `RequestAttestation` requires an attester "independent of credited party/asserter", so an attestation is not the credited party acknowledging. No event carries it either (`credit.record.changed.v1` ships state but nothing sets this one). The curation half is the same shape: `PageCuration` = `listed | unlisted`; party-page only (line 95) and `discography_curation` | "Party + credit listed/unlisted and **pin rank**; cannot change ledger visibility" (line 148) are only ever read — `ProjectDiscography` "Public eligibility = confidentiality + release/lift + page curation" and deep dive step 6 "pinned highlights then reverse chronology". No interaction, no Access Control row and no event grants or performs the write, so the authorization for curation and the uniqueness of pin rank are both unstated.

### A-32 · `07-credits-core.md` · 5 Cross-Shard Contracts · PARTIAL

**Defect.** The Cross-Shard Section Contract Map omits both upstream dependencies and one declared downstream consumer.

**Evidence.** "**Depends on:** [Shard 00](00-infrastructure.md) for contracts/events/offline/idempotency/projections; [Shard 01](01-identity-authority.md) for parties, aliases, acting context, memberships, mandates and non-automatic identity merges" — bare file links with no section. "**Depended on by:** Shards 08–10, 18–20, 22, 23 and 39" includes Shard 19, but the Contract Map lists 08, 09, 10, 18, 20, 22, 23 and 39 only.

**What an implementer is forced to invent.** `MergePartyShell` ("Person merge always human-confirmed; re-points party IDs only") and `ClaimCredit` both consume Shard 01 identity-merge evidence, but no target section is named, so the implementer must guess which Shard 01 contract governs the shell-to-party re-point. Shard 19 gets no provenance projection contract despite being declared a consumer.

**Refutation attempt.** Verified. `Cross-Shard Dependencies` reads "**Depends on:** [Shard 00](00-infrastructure.md) for contracts/events/offline/idempotency/projections; [Shard 01](01-identity-authority.md) for parties, aliases, acting context, memberships, mandates and non-automatic identity merges" and "**Depended on by:** Shards 08–10, 18–20, 22, 23 and 39". The Cross-Shard Section Contract Map immediately below lists Shard 08, 09, 10, 18, 20, 22, 23 and 39 — Shard 19 is inside the declared `18–20` range and is missing, and neither upstream appears. That Shard 19 is a genuine consumer is corroborated inside the same file: `credit.provenance.derived.v1` | "..." | "Discography, search, Shards 08/10/**18–20**/22/39" (line 240) and deep dive line 122 "| Shards 08, **18–20**, 22, 23, 39 | Receive authorized rung/taxonomy/credit projections only". Upstreams do belong in these maps under this layer's own convention — 08-credit-reporting-disclosure.md's map opens with Shards 00, 01 and 07, and 05-platform-configuration-admin.md's with 00, 01, 03, 04. So `MergePartyShell` and `ClaimCredit`, which consume Shard 01 identity-merge evidence, have no named target section, and Shard 19 has no provenance projection contract despite being declared a consumer twice.

### A-33 · `22-release-distribution.md` · 1 Feature Enumeration · PARTIAL

**Defect.** Level-1 sub-feature 12.01.05 Label Copy & Distributor of Record survives only as the phrase "label copy, distributor statement" inside one data-model row; none of its five typed fields, its derive-from-rights-record rule, its override-reason requirement or its mandatory plain-language distributor-of-record statement appears in any normative section.

**Evidence.** Only occurrences in the shard: "| Build chain | Composition, metadata, readiness, asset conformance, label copy |" and "| `release` / `release_version` | Owner, type, label copy, distributor statement, dates/state; immutable published versions. |". DST-01 "Owner composes release" covers "order/type/volume/focus/gapless and schedule licence-expiry obligations" only; there is no contract, error code or edge case for label copy. Ideation 12.01.05 D-01 — "(P)/(C) lines derive from the rights record (09); divergence requires a recorded justification visible to co-owners" — and D-02 — "Distributor of record is stated in plain language at the moment it is set, with its exit consequences".

**What an implementer is forced to invent.** An implementer must invent whether (P)/(C) derive from Shard 10 or are free text, whether an override requires a stored reason, how co-owners are notified of a divergence, and what error is returned when the (P) line contradicts the ownership record — the same five fields that 12.08's exit rules and the ISRC-prefix decision hang off.

**Refutation attempt.** Verified. `grep -in "label copy\|distributor\|(P)\|(C)\|copyright line"` over the shard and its deep dive returns only the two occurrences the auditor names — the Scope Reconciliation "Build chain | ... label copy" and the `release` / `release_version` model row "Owner, type, label copy, distributor statement, dates/state" (plus its two registry restatements). There is no interaction, no contract, no error code and no edge case. The ideation decisions exist as quoted: 12.01.05 D-01 "(P)/(C) lines derive from the rights record (09); divergence requires a recorded justification visible to co-owners" and D-02 "Distributor of record is stated in plain language at the moment it is set, with its exit consequences". The rule is not parked in the upstream owner either: `grep -in "label copy|(P)|(C)|copyright line|phonogram"` over 10-rights-ownership.md and its deep dive returns nothing. So the derivation rule, the recorded-justification requirement, the co-owner visibility and the error path for a (P) line contradicting the ownership record have no home in any shard. Severity "partial" is fair — the two fields do exist on `release`/`release_version` and DST-01 is the composing flow, so the data has a home; only the normative rules are missing.

### A-34 · `30-booking-contracts.md` · 5 Cross-Shard Contracts · PARTIAL

**Defect.** Three of the eight Cross-Shard Section Contract Map rows target shard files that do not exist and name the wrong domain for the target shard.

**Evidence.** - **Shard 31:** consume [Shard 31 Contracts](31-live-settlement.md#contracts) … - **Shard 32:** … (32-event-operations.md#contracts) … - **Shard 35:** … (35-discovery-recommendations.md#contracts)

**What an implementer is forced to invent.** The real shards are `31-live-settlement-intelligence.md`, `32-show-production-planning.md` and `35-ticket-products-sales.md`. Shard 34 in the same group carries the corrected slugs, so this is stale text and not a layer convention. An implementer wiring the outbox for `booking.deal.accepted` and `booking.announce.authorization_changed` is told Shard 35 is 'discovery-recommendations' when it is Ticket products and sales, and cannot resolve the cited target sections. The same defect appears in 31 (34-event-ticketing, 41-career-business), 32 (33-show-day-tour-operations, 34-event-ticketing) and 33 (34-event-ticketing, 36-live-reporting).

**Refutation attempt.** Verified by `ls` on /home/rob/Projects/WeJammin/.memory/wiki/specs/ia/: there is no `31-live-settlement.md`, no `32-event-operations.md` and no `35-discovery-recommendations.md`. The real files are `31-live-settlement-intelligence.md`, `32-show-production-planning.md` and `35-ticket-products-sales.md`. Shard 30 lines 356-358 and 346 still carry the stale slugs in both the `[[wiki]]` dependency list ("[[specs/ia/35-discovery-recommendations|Shard 35]]") and the Cross-Shard Section Contract Map ("consume [Shard 35 Contracts](35-discovery-recommendations.md#contracts)"). The auditor's control is correct: shard 34's map at the same layer position carries the corrected slugs ("31-live-settlement-intelligence.md", "32-show-production-planning.md", "33-show-day-operations.md"), so this is stale text, not a layer convention. I also confirmed the spread: shard 31's map points at `34-event-ticketing.md` and `41-career-business.md`, where the real files are `34-touring-operations.md` and `41-career-finance.md`; shard 33's dependency block names "[[specs/ia/34-event-ticketing|Shard 34]]" and "[[specs/ia/36-live-reporting|Shard 36]]" against real `34-touring-operations.md` and `36-box-office-risk.md`. NOTE ON CALIBRATION: the brief states "All relative markdown links in the layer resolve. Do not report broken links." That premise is false for these rows, and I am reporting the substantive half rather than the syntactic half — the map tells an implementer that Shard 35 is the discovery/recommendations domain when it is Ticket products and sales, which is where `booking.announce.authorization_changed` and `booking.deal.accepted` actually land. That is a wrong cross-shard designation, not a link typo. Shard 30's auto-generated "Related Specs" block at the bottom is unaffected — the stale names live only in the hand-authored dependency section.

## Relationship to the 2026-08-03 PASS

`2026-08-03-ia-ambiguity-rerun-1.md` scored the same 83 documents at 0/344 and cleared the layer for `/write-be-spec`. Its per-document table records the identical evidence string — "8/8 rubric dimensions; implementer and adversarial checks pass" — for all 43 shards. That is not a per-document result; it is one verdict copied 43 times.

Several defects in this report are mechanically detectable in seconds and were present on that date: the broken links in F3 sit in Changelog-dated text older than 2026-08-03, and the F1 schema split is visible from the table headers alone. A scoring pass that returns 0/344 while 54 dangling references sit in the layer did not read the layer.

**Recommendation:** treat the 2026-08-03 IA PASS as void rather than superseded, and do not carry its evidence forward.

**Update, same day:** commit `5c4e712` "Deleted premature fe/be specs" emptied `.memory/wiki/specs/be/` and `.memory/wiki/specs/fe/`. The BE layer that was authored against these IA shards on the strength of the voided PASS no longer exists on disk (retrievable at `git show 7986b4d:.memory/wiki/specs/be/`). So no `be`-scoped audit is owed — but the deletion is consistent with this report's finding: BE was built on an IA layer that had not actually been verified.

## Remediation classification

| Class | Items | Notes |
|---|---:|---|
| Mechanical — no owner decision needed | F3 (54 refs, 10 shards), the corrupted-AC set (A-01, A-03, A-04, A-12, A-20), the phantom registry entities (A-08, A-18, A-26) | Every target is determinable from the existing decomposition; these are generator bugs, not open questions. |
| Structural — large but determined | F1 (24 shards need Preconditions + Failure/recovery columns and re-derived ACs), F2 (52 reciprocal entries) | The content exists in the shards; it has to be lifted into the right columns and the ACs regenerated. |
| Requires an owner decision | A-05, A-11, A-14, A-16, A-22, A-33 (dropped ideation sub-features), A-06 (enforcement ladder rung), A-10 (vault sensitivity matrix), A-13 (`RightsPosture` vocabulary), A-15 (`RegistrationBelief` states), A-17 (rounding/remainder rule), A-19 (announce embargo owner), A-23 (goal progress trust tiering), A-31 (`acknowledged` credit state) | Each needs a product or architecture decision before a spec can be written. |

## Next step

Remediate, then rerun `/audit-ambiguity ia` as a fresh invocation. The layer may not advance to `/write-fe-spec` on this run.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-11|D-11]]

### References
- [[specs/ia/36-box-office-risk|Shard 36 — Door access, box office, reconciliation and ticketing risk]]
- [[specs/ia/35-ticket-products-sales|Shard 35 — Ticket products, sales, access packages and delivery]]
