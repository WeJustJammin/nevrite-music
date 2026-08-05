# F1 Migration — Rows With No Source (2026-08-05)

During the F1 migration, shards 00-23 gained per-flow `Preconditions` and `Failure / recovery` columns derived strictly from existing in-shard normative text. The rows below are the ones where the shard genuinely states nothing.

For each, the migrating agent wrote **the weakest condition the shard actually supports** and disclosed it here rather than inventing a rule. That is the correct outcome — a fabricated precondition is a corrupted spec that gets implemented; an honest gap is a finding.

**These are open findings for the next `/audit-ambiguity ia` run.** Each is a place where the shard has a flow but no stated authorization gate, no source-state rule, or no typed error code.

| Metric | Value |
|---|---:|
| Rows migrated | 416 |
| Acceptance criteria regenerated | 416 |
| Rows with no derivable source | 40 |
| Share of rows | 9.6% |
| Shards affected | 21 of 24 |

## Recurring causes

| Cause | Meaning |
|---|---|
| No Access Control row for the flow's actor | The shard authorizes the flow nowhere; the precondition had to be composed from adjacent capabilities. |
| No typed error code for the flow | The shard's error enum has no member covering this failure, so the failure cell names the behavior without a code. |
| No `§ Contracts` command for the flow | The interaction exists in the table but has no command signature, so neither inputs nor errors are specified. |
| Named threshold with no value | e.g. an "approved density and evidence threshold" with no number, unit or approver stated. |
| Flow owned by another shard | This shard only reacts; the precondition and failure belong to the owning shard. |

## Rows

### `00-infrastructure.md` (1)

- INF-08 Realtime hint — no § Access Control principal row governs a Realtime subscriber and no state machine covers the hint. Wrote the weakest supported condition from § Features ("Realtime is a refetch hint") and the Edge-Case Coverage Matrix INF-08 row: authorized subscription plus the explicit statement that the hint is non-authoritative so no state, version or authority may be presumed from it.

### `01-identity-authority.md` (1)

- IDA-12 Record name ownership — no § Access Control row names an authority specifically for name-ownership statements. Wrote the weakest supported condition by combining the Owner/admin row ("within current grant") with feature 01.04, which places name ownership inside band governance, and stated explicitly that any trademark reference is self-supplied because the deep dive defers registry search entirely.

### `02-profiles-verification.md` (1)

- PRF-02 Match possible duplicate — no § Access Control row governs duplicate matching and the shard states no authorization gate for it, because matching is advisory and runs alongside another command. Wrote the weakest supported condition from the interaction's own text plus the deep dive's Concurrency rule that "matching never becomes uniqueness": a party reference is available to match against, matching is advisory and never a uniqueness constraint, and it must not block the submitting command.

### `03-cms-content-modeling.md` (2)

- CMS-10 Register block version — § Access Control names no capability for this flow because the shard makes block registration a code release, not an admin action. Precondition written from the Contracts 'Block registry' row and the deep dive 'Block execution' resolution ('Code release owns implementation') as 'Registration arrives from a code release rather than an admin session…' rather than inventing an admin capability. The shard genuinely states no human authorization condition here.
- CMS-12 Use reusable pattern — no dedicated capability row exists for pattern insert/accept/detach. Precondition composed from the edit capabilities that already govern the containing artifact ('Actor may edit the target entry revision or template draft') plus the Contracts 'Pattern' row and the deep dive acyclic depth/count limits. No pattern-specific capability was invented.

### `04-cms-delivery-media.md` (1)

- DLV-04 Configure discovery metadata — the shard states the privacy/embargo/legal override and the 'explicit blocker' outcome, but states nothing about what happens when the policy state itself cannot be resolved. Rather than leave the row silent I wrote the weakest fail-closed reading the shard supports ('unresolvable policy state fails closed to that blocker instead of publishing editor values'), inferred from the Degraded rule 'Unknown/unsafe is unavailable—not absent or healthy' and the Overview 'Availability never outranks privacy'. This is a cross-section inference, not a rule stated for this flow — flagging it for the next audit.

### `05-platform-configuration-admin.md` (2)

- CFG-02 Resolve effective value — the shard states no authorization precondition for this flow anywhere. § Access Control's only relevant row is 'Service principal | Evaluate one setting', and the deep dive's resolution algorithm names only request context. The precondition therefore states the definition/context condition the algorithm does give ('caller supplies only request context and never schema, scope or precedence') with no authorization clause, rather than inventing a capability gate on a read path.
- CFG-12 Inspect audit/diagnostics — the shard names no specific capability key for audit scope; § Access Control covers it only through the general admin operator and privacy/legal operator rows plus the section rule that every protected operation rechecks a named capability. Written as 'Actor holds the named capability for the audit scope or diagnostic being read' — deliberately the generic form the shard actually mandates, not a fabricated capability name.

### `06-trust-safety.md` (2)

- TSE-08 Restrict another user — the shard states no authority or state precondition at all beyond an authenticated actor (the Required behavior cell says the restriction is "immediate with no case requirement"). Rather than invent a gating rule I wrote the weakest condition the shard supports: authenticated consumer actor with a current acting context and an addressable subject, with the shard's own explicit negative (no case, finding, severity, policy version or moderator involvement is required or created) stated as part of the precondition.
- TSE-18 Assess domain-launch risk — the shard names no actor row for the assessing owner. I bound it to the Shard 05 launch-gate capability, which is the narrowest existing binding (§ Cross-Shard Dependencies names Shard 05 as the owner of quality gates and the safety_risk_assessment model records an approver), rather than inventing a new role.

### `07-credits-core.md` (2)

- CRD-03 View public discography — the shard states no authentication or authority requirement for this read. I wrote the weakest supported condition ("Any viewer, authenticated or not") plus the ProjectDiscography eligibility formula (confidentiality + release/lift + page curation, authorization applied before counts), rather than inventing an access gate.
- CRD-16 Derive provenance — no actor row governs the derivation trigger beyond "System worker". I bound it to a service-identity worker holding the evidence-set hash and the configured algorithm version, which is what the provenance_derivation model and DeriveProvenance state; the shard says nothing about what schedules or debounces a re-derivation and I did not invent one.

### `08-credit-reporting-disclosure.md` (2)

- CXR-05 Generate portability receipt — the shard names no distinct authority for issuing a receipt. I bound it to the party that owns the export request, which is the weakest condition the "Credited party | Complete own export" access row supports, and to the generated_artifact fields (manifest, checksum, source versions, omissions, degradation notes) that must already exist.
- CXR-10 Transfer registered gear — this flow has no actor of its own in this shard; the transfer happens in Shard 23 and Shard 08 only reacts. I wrote the precondition as the Shard 23 ownership change having already landed with links held against the item version, and stated in Failure / recovery that Shard 08 refuses any attempt to write the ownership change itself. No trigger mechanism, event subscription or ordering guarantee is stated anywhere in the shard and I did not invent one.

### `09-projects-collaboration.md` (2)

- PRJ-10 Compare versions/stems — the shard has no § Contracts command, no per-flow error codes and no Access Control row for playback. Precondition written by explicit inheritance from PRJ-07's ResolveVaultAccess intersection plus the § Accessibility degraded-playback bullet, and the failure row uses only inherited access errors. Grounded but not flow-specifically stated.
- PRJ-04 Capture idea or edit creative doc — no § Contracts entry and no dedicated Access Control row exist for lyric/chart editing. Precondition written as the weakest supported condition (owner, Producer, or contributor acting for itself) from the 'all authorized creative records' and Musician/contributor rows, plus Shard 00 offline replay for the idea path.

### `10-rights-ownership.md` (2)

- RGT-16 Record AI declaration — the shard states no § Contracts invariant and no Access Control row for declarants beyond the Required behavior's own wording ('Contributor/authorized declarant'), and no flow-specific error code. Precondition restated that weakest condition plus the no-detection rule; failure uses only FORBIDDEN and VALIDATION_FAILED from the shared enum.
- RGT-19 View private/public rights evidence (public half) — the shard states no precondition for the unauthenticated public path. Written as the weakest supported condition: no authentication required and the request resolves only against the dedicated allowlisted publication-safe projection named in the deep dive § AI, NIL, Identifier and Evidence Algorithms.

### `11-community-graph.md` (2)

- COM-05 Mute/reduce feed source — the shard states no authorization rule, no § Contracts invariant and no error code for this flow; it is viewer-private by construction. Precondition written as the weakest supported condition: authenticated viewer in a resolved acting context naming an existing entity/type/domain, with no consent or notice from the muted party required.
- COM-18 Schedule follow-up — same situation: no § Contracts invariant and no flow-specific error code. Precondition written as owner-acting-for-itself on a contact inside its own CRM with a due time or recurrence supplied, drawn from the deep dive § Private CRM Isolation step 8 (author-only delivery) and the § Data Models follow_up_reminder row.

### `12-community-spaces-events.md` (3)

- SPC-04 Steward scene — `SetStewardship` requires an 'approved density and evidence threshold' but no threshold value, unit or approver is stated anywhere in the shard; the precondition says 'has passed the approved density and evidence threshold' without inventing a number.
- SPC-13 Persist event relationship — shard 12 does not own the flow and § Contracts enumerates no error code for a Shard 11 refusal; the failure cell states the Shard 11 typed error is returned unchanged, derived from the Cross-Shard Section Contract Map rather than from a shard-12 error code.
- SPC-12 Enable conference mode — no error code exists for activation outside the event window; mapped to the generic FORBIDDEN/VALIDATION_FAILED pair rather than inventing a code.

### `13-opportunities-casting.md` (2)

- OPP-09 Submit unsolicited pitch — the 'target pitch policy' is referenced by the Required behavior cell but its states and values are never enumerated in shard 13 or its deep dive; the precondition says 'a target whose published pitch policy permits unsolicited contact' without naming policy values.
- OPP-17 Review pipeline history — a read-only flow with no flow-specific error code in StandardError; `ProjectApplicantHistory` gives scope only, so failure is stated as FORBIDDEN for out-of-scope reads plus a generic typed-unavailable projection state.

### `14-services-marketplace.md` (3)

- SRV-13 Open recall — the `recall` data model carries 'count/window' and § Interactions calls it 'bounded', but no numeric bound is stated anywhere in the shard or deep dive; the precondition says 'inside the recall window and remaining recall count' with no numbers, and failure returns VALIDATION_FAILED because StandardError has no recall-specific code.
- SRV-18 Complete inspection — no inspection-specific error code exists in StandardError; the conflict-check failure is mapped to FORBIDDEN and an incomplete template to VALIDATION_FAILED rather than inventing codes.
- SRV-19 Record damage claim — no claim-specific error code exists; the shard states only 'Shard 06 dispute path handles contest' and 'without insurance promise', so failure is VALIDATION_FAILED for an absent mutual condition record plus the Shard 06 case route.

### `15-education-delivery.md` (1)

- EDU-12 Practice — the shard states no authority or source-state gate beyond the student acting on their own record (RecordPractice: 'student-private, offline/manual, non-evidentiary'). Wrote the weakest supported condition and said so in the cell: 'every tool is optional and the shard states no further gate, so the flow is legal with or without a lesson, assignment or network connection.' Flagging as an honest gap for the next audit.

### `16-education-credentials-institutions.md` (1)

- EDU-CI-15 User requests certificate/badge — the shard states no state or authority precondition because the capability does not exist ('no issuance aggregate, route, template or event exists'). Rather than invent a gate I wrote the honest weakest condition: 'Any authenticated actor may reach this path; the shard states no state or authority precondition because no issuance aggregate, route, template or event exists, so the request is always evaluated as an unsupported capability rather than an authorization question.' Same shape used for EDU-CI-16 (therapy/clinical data), where the only stated precondition is that purpose/schema controls run before persistence.

### `18-royalty-accounting.md` (1)

- ROY-05 Failure / recovery — the shard names no flow-specific edge case and no dedicated error code for statement-source registration. Written from the weakest thing it does support: `NOT_AUTHORIZED` from the § Contracts error enum plus the § Edge-Case Coverage Matrix rule that validation fails before mutation, i.e. 'no reporting relationship' refusal with no partial registry entry. Flagged as thin rather than invented.

### `21-specialized-licensing.md` (3)

- SPL-10 (Subscriber cancels) Preconditions — no § Access Control row names a Subscriber role and no § Contracts command covers cancellation. Wrote the weakest supported condition from the `subscription_grant_history` model row and the Persistence locked decision: authenticated subscriber cancels their own subscription and the grant history is scoped to future-purchase capability only, never to ownership of an issued instrument.
- SPL-10 (Subscriber cancels) Failure / recovery — no shard-specific error code exists for this flow. Used `FORBIDDEN` plus a typed refusal, with the substantive recovery taken verbatim in meaning from the Edge Case row 'Subscription ends/provider cascade fails → Issued licence and whitelist persist.'
- SPL-02 (System suggests sample identity) Failure / recovery — the shard defines no error code for provider absence. Wrote the honest no-machine state from the § Contracts `SuggestSampleIdentity` rule ('provider absence visible') and the Edge Case 'Fingerprint unavailable/wrong', rather than inventing a PROVIDER_UNAVAILABLE code.

### `22-release-distribution.md` (3)

- DST-06 (Owner chooses release dates) and DST-14 (Owner changes release date) Failure / recovery — the § Contracts Errors row contains no date/window-specific code. Used `TERRITORY_UNKNOWN` / `FORBIDDEN` where the shard supports them and otherwise a typed refusal, carrying the substantive behavior from the Dates locked decision ('platform never moves announced date automatically') and the Edge Case 'Store silent into date'.
- DST-13 (Owner manages editorial/pre-save/timeline) Failure / recovery — no error code covers the one-use OAuth grant or a missed editorial deadline. Wrote a typed refusal plus the honest submitted/link/deadline state the Completion cell already requires, anchored on the Global Interaction Rule that distribution never directly messages fans and on DST-21's shared-descriptor invariant.
- DST-21 (Owner enriches release descriptors) Failure / recovery — deliberately has no blocking failure by design. Stated `FORBIDDEN` from the § Access Control denial ('Delivery operator … any access to `release_enrichment`') and otherwise recorded the shard's explicit non-failure behavior: skip silently, no error, no failure event, no user-visible failure state.

### `23-gear-provenance-registry.md` (3)

- GPR-05 (User views provenance) — the § Contracts table defines no command for the chain view, so neither a command signature nor an error code exists. Preconditions written from the deep dive's 'chain is a projection over immutable facts' step and the § Access Control public-visitor bounds; Failure / recovery written as `FORBIDDEN` plus an absent field and a typed refusal without existence leakage, taken from the § Edge-Case Coverage Matrix's invalid-input/authority column and the Global Interaction Rule on bounded public lookup.
- GPR-12 (Owner records manual modification) — § Contracts covers only the provider path (`AppendServiceEvent`), so no command signature or error code governs the owner's manual declaration. Preconditions and failures derived from the deep dive's 'owner manual declaration creates append-only event and component facts' and 'originality is component-level' steps plus the Edge Case 'Modification removes serial-bearing component'; used `FORBIDDEN` and a typed validation refusal rather than inventing a component-specific code.
- GPR-07 (Owner reports theft) Failure / recovery — the shard names no error code for a standing or loss-facts failure on this flow. Used `FORBIDDEN` plus a typed validation refusal, with the substantive content taken from the Theft locked decision (a flag may be filed without a police reference) and the `TheftFlagState` enum's system-controlled, non-deleting lifecycle.
