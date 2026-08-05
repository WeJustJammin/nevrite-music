# Run 7 — Owner Decision Agenda

> **Status:** draft decision aid, not a ratification. It groups the remaining owner decisions by
> dependency so confirmed answers can be applied atomically and then independently re-audited.
> The source of record remains [run7-owner-decision-packet.md](./run7-owner-decision-packet.md).

## Confirmed Platform Targets

| Target | Ratified value | Remaining detail |
|---|---|---|
| Pre-revenue infrastructure cap | **$0/month** | No chargeable service or usage before renewed approval |
| Availability | **100% outside scheduled outages** | Define operational maintenance treatment at `/create-prd-compile` |
| Normal-web p95 | **<2 seconds** | First-party interactive web requests at expected v1 load; confirmed 2026-08-02 |

**Ratified:** normal-web p95 is **<2 seconds** for first-party interactive web requests at expected
v1 load, confirmed 2026-08-02. It fits the $0 edge-first posture without making phase-2 real-time
constraints the v1 web SLO.

**Affected finding:** `R7-META-002`.

## Batch 1 — Actor and Authority Foundations — Ratified 2026-08-02

These decisions unblock identity, organization, opportunity, education, marketplace, promotion, and
trust-and-safety specs together. They should be confirmed as one coherent batch rather than creating
incompatible local answers.

### A1 — Party of Record — Ratified 2026-08-02

**Decision:** Can a natural person trade without forming an organization, and how are legally separate
band and label entities represented?

| Option | Pros | Cons |
|---|---|---|
| Require an organization for all commercial activity | Simplifies entity/payee rules | Excludes the solo professionals who form the v1 wedge |
| Allow one account party to collapse person, band, and label | Fewer visible objects | Incorrectly merges legal parties and obscures authority |
| **Allow a person or an organization to be a separate party of record — recommended** | Supports solo users; keeps band and label legally distinct; mandates make representation explicit | Requires entity verification and multi-party payment modeling |

**Ratified (2026-08-02):** An organization is optional. A person, band, studio, agency, or label may
be its own party of record; legally separate parties never collapse into one account context. Acting
for another party always requires a recorded mandate.

**Affected finding:** `R7-01-002`.

### A2 — Delegated Communication — Ratified 2026-08-02

**Decision:** Does a mandate need a distinct right to speak as a party?

| Option | Pros | Cons |
|---|---|---|
| Speech inherits every commercial mandate | Minimal vocabulary change | Silently gives agents/representatives authority to communicate |
| Speech only rides `book` | Fits booking messages | Fails for release, support, finance, and relationship communications |
| **Add an explicit `communicate` mandate scope — recommended** | Least privilege; separates speech from money and signature authority; covers all surfaces | Adds one permission to the shared grammar |

**Ratified (2026-08-02):** Add `communicate` as an independent mandate scope. No commercial
scope implicitly permits speaking as the party.

**Affected finding:** `R7-01-003`.

### A3 — Actor Taxonomy — Ratified 2026-08-02

**Decision:** How should the project represent the dealer, private-hire buyer, crew member, guardian,
manager, gatekeeper, and moderator without making the existing four personas incoherent?

| Option | Pros | Cons |
|---|---|---|
| Expand the core persona set for every actor | Full discovery and UX treatment per role | Explodes the core model and forces broad rework |
| Exclude all non-core actors | Lowest scope | Removes required workflows and leaves existing claims false |
| **Keep four core personas; introduce named bounded counterparty/staff roles — recommended** | Preserves the persona model while giving each actor explicit permissions and accountability | Requires role-specific authority and onboarding rules |

**Ratified (2026-08-02):**

- Keep **Musician, Producer, Operator, Fan** as the four core product personas.
- Model the **professional dealer/plugin developer**, **private-hire buyer**, **crew hire**,
  **fee-paying parent/guardian**, and **manager** as named, bounded account or counterparty roles,
  each with a dedicated authority model rather than a new persona column.
- Model **Admin/Moderator** as an internal staff role with a separate backoffice permission model,
  never as a public persona.
- Treat **curator/journalist/radio/DSP gatekeeper** as an off-platform pitch target in v1; no
  on-platform inbox or fifth-persona surface.

**Affected findings:** `R7-04-001`, `run7-06.02-d3-001`, `R7-ROOT-D2-005`,
`R7-21-D2-001`, and `R7-24-RAW-002`. This also supplies the missing manager
context noted by `R7-01-003`.

### A4 — Unclaimed Public Portfolios — Ratified 2026-08-02

**Decision:** What is the v1 posture for publicly searchable portfolio pages about people who do not
have an account?

| Option | Pros | Cons |
|---|---|---|
| Public/index every unclaimed portfolio immediately | Strongest growth loop | Requires an established lawful basis and a robust removal path |
| **Do not publicly index unclaimed-party portfolios until legal basis and removal process are ratified — recommended** | Fails closed on sensitive legal exposure; preserves claim flow | Delays a growth surface |
| Disable all imported/claimed portfolio material | Lowest risk | Discards useful, consented account-holder material |

**Ratified (2026-08-02):** v1 may show portfolio material to the claimed account holder and through
consented/attributed paths, but does not publish or search-index a non-user's portfolio until the
legal basis, notice, and removal process are approved through `/create-prd-security`.

**Affected finding:** `R7-01-016`.

## Ratification Record

Approved as one coherent owner-decision package: A1–A4, 2026-08-02.
to accept a recommendation; give a replacement rule for any item you want changed. These decisions
are not applied until explicitly ratified.

## Batch 2 — Safety, Legal, and Compliance

> **Important:** This batch states product and operational choices; it does not provide legal advice.
> Items marked **counsel-gated** need a qualified legal/compliance review before their final policy can
> be applied. A conservative scope decision is still available now.

### B1 — Unresponsive Contributor Payouts — Ratified 2026-08-02

**Decision:** What happens when a named contributor confirms use of a pack but never confirms their
split, while direct-sale proceeds continue to arrive?

| Option | Pros | Cons |
|---|---|---|
| Freeze every contributor's payout indefinitely | Never pays on an unagreed split | Lets one absent party hold everyone else's money indefinitely |
| Treat silence as consent or assign the lister 100% | Simple | Creates an abusive forfeiture path |
| **Pay confirmed shares; hold only the unconfirmed share — recommended** | Pays earned money without inventing a split; preserves the absent party's claim | Requires a timeout, held-funds record, and claim path |

**Ratified (2026-08-02):** After a **30-calendar-day** response period, pay only the shares already agreed by
the confirmed contributors; place the unconfirmed portion in a non-forfeitable held-funds record.
Never redistribute or absorb the held share. The owner must set the response period.

**Affected finding:** `R7-14-020`.

### B2 — Anti-Targeting Privacy Floor — Counsel-gated 2026-08-02

**Decision:** What minimum audience size prevents an artist from using segments or demand-map clusters
to infer a particular fan's location or behavior?

| Option | Pros | Cons |
|---|---|---|
| No audience floor | Maximum utility | Enables individual targeting and location inference |
| Small floor (for example, 5–10) | Retains small-artist utility | Weak protection in sparse scenes |
| Larger floor (for example, 20+) | Stronger privacy protection | More empty segments/maps for early artists |

**Required scope choice:** State whether the floor applies independently to **map display**, **audience
export**, and **campaign sends**. Counts and a fan's own record are already excluded from the proposed
floor; the decision concerns outward targeting and disclosure.

**Counsel-gated (2026-08-02):** do not ratify a numeric `k` without qualified privacy/security review.
Segment-based campaign sends, audience exports, demand maps, and sparse-cluster disclosure do not ship until
the numeric floor and enforcement scope are approved; counts and a fan's own record remain available.

**Affected findings:** `R7-20.02-002` and `R7-20.07-003`.

### B3 — Direct-to-Fan Payout Scope — Counsel-gated 2026-08-02

**Decision:** How much direct-sale and multi-party payout risk belongs in the first release?

| Option | Pros | Cons |
|---|---|---|
| Allow sales with no rights record; pay 100% to lister after acknowledgement | Launch catalogue is broad | Weakens the provenance thesis and can strand collaborators |
| Hard-block sale without a rights record | Strongest rights posture | Makes pre-platform catalogue hard to sell |
| **Allow sales only through a compliance-cleared, single-payee path until multi-party payout is cleared — conservative recommendation** | Avoids holding third-party funds before provider, tax, and regulatory posture are settled | Defers the product's strongest collaborator-payout story |

**Counsel-gated (2026-08-02):** held collaborator funds, reserve amount/window, tax collection and
reporting, payout terms-version evidence, and money-transmission/e-money exposure. These must be
answered before any multi-party payout is enabled.

**Affected finding:** `R7-20.04-002`.

### B4 — Anonymous Follow Durability — Ratified 2026-08-02

**Decision:** Can a visitor follow an artist without an account, and when may that follow become
durable or trigger alerts?

| Option | Pros | Cons |
|---|---|---|
| Require an account before following | Simple identity model | Reintroduces the fan acquisition wall |
| Anonymous browser-only follow | No account friction | Cannot reliably survive device loss or send alerts |
| **Browser-local follow; verified email plus explicit alert consent for durability — recommended** | Keeps friction low while giving alerts a consented destination | Requires a clear upgrade/linking flow |

**Ratified (2026-08-02):** a visitor may create a browser-local follow immediately. It becomes
durable and alert-eligible only after verified email plus explicit alert consent; account creation can
later link the same consented follow without creating a second subscription.

**Affected finding:** `R7-20.06-003`.

### B5 — Private CRM Notes — Counsel-gated 2026-08-02

**Decision:** What may an artist store in private notes about identifiable third parties?

**Counsel-gated (2026-08-02):** no private free-text notes about identifiable third parties ship in v1.
The future policy must address special-category data and defamatory
assertions; or remove free-text notes entirely. The recommended interim posture is to prohibit
special-category data and unverified allegations in the product policy, keep notes private to the
authorized owner, and require the security review to define retention, erasure, import, and audit
behavior before launch.

**Affected finding:** `R7-21-D4-002`.

### B6 — High-Risk Safety Operations — Counsel-gated 2026-08-02

The following are **not safe to resolve by convenience** on a solo, $0/month operating model:

| Topic | Required choice | Conservative posture pending counsel/operations decision | Finding |
|---|---|---|---|
| CSAM automatic Statement of Reasons | Populate required automated-action fields without a fictional human concurrence | Do not enable the automatic path until the required structured representation is valid and reviewed | `R7-24-RAW-004` |
| Crisis welfare escalation | Whether the platform ever contacts emergency services and how malicious reports are handled | Resources-only, no emergency contact or escalation state | `R7-24-RAW-005` |
| Law-enforcement requests | How EDRs/warrants are verified and handled after hours | No self-service police portal or 24/7 promise; use a documented legal intake and do not improvise at 2am | `R7-24-RAW-006` |

## Batch 2 Ratification Record

**Ratified:** B1 (30 calendar days) and B4. **Counsel-gated:** B2, B3, B5, and B6. The gated feature paths
are excluded from their applicable v1 release scope until qualified review is recorded.

## Batch 3 — Core Lifecycle Decisions — Resolved under owner autonomy 2026-08-02

### C1 — Claim Assurance Against Collusion — Resolved 2026-08-02

**Decision:** What can a cluster of mutually attesting accounts prove when it lacks independent
identity or offline verification?

| Option | Pros | Cons |
|---|---|---|
| Let Tier-C counter-attestation establish full claim authority | Low friction | A fabricated five-account ring can manufacture reputation and control |
| Require Tier-A proof for every claim | Strongest assurance | Excludes the legitimate users with no qualifying provider |
| **Permit a Tier-C claim but cap its effects until an independent signal arrives — recommended** | Preserves access while preventing reputation/ownership escalation from a ring | More states and messaging to explain |

**Resolved under owner autonomy (2026-08-02):** counter-attestation alone may create a provisional claim, but never
elevates public trust, changes ownership, or resolves a contested claim until an independent
identity/proof signal is present.

**Affected finding:** `R7-01-010`.

### C2 — Contested Credit Embargo Lift — Resolved 2026-08-02

**Decision:** What measurable bound prevents a contested objection from becoming an unlimited
producer veto over a credit's visibility?

| Option | Pros | Cons |
|---|---|---|
| No resolution deadline | No operational promise | Makes the embargo permanent in practice |
| Short fixed resolution SLA | Gives credit holders a real path | Requires reviewer capacity the solo team may not have |
| **Time-bounded evidence exchange plus a stated final decision target — recommended** | Establishes a real exit while keeping objections reviewable | Owner must accept the capacity commitment |

**Resolved under owner autonomy (2026-08-02):** evidence exchange lasts **7 calendar days** and the
final-decision target is **30 calendar days** after it closes. Unsupported objections lose the embargo;
timely substantiated objections stay embargoed while queued with weekly status and priority review.

**Affected finding:** `R7-02-01-001`.

### C3 — Guardian Access to a Child's Practice Diary — Resolved 2026-08-02

**Decision:** Does the fee-paying parent see an identifiable child's practice log?

| Option | Pros | Cons |
|---|---|---|
| Guardian sees all practice details | Satisfies payer oversight expectation | Turns a child's hobby into an adult compliance record |
| **Guardian sees lesson feedback but not the practice diary — recommended** | Preserves the existing child-protection wall and the already-ratified feedback posture | Some parents receive less activity detail |
| Share aggregates only | Compromise | Still needs a carefully defined aggregation boundary |

**Resolved under owner autonomy (2026-08-02):** retain the established boundary: guardian sees lesson feedback and
billing/entitlement facts, but no identifiable practice diary. Practice data never leaves the education
domain without a separate safeguarding approval.

**Affected finding:** `run7-06.03-d3-001`.

### C4 — Partially Consumed Course Refunds — Resolved 2026-08-02

**Decision:** What refund rule applies after a buyer has consumed part of a digital course?

| Option | Pros | Cons |
|---|---|---|
| Full refund regardless of consumption | Simple and buyer-friendly | Enables complete consumption followed by refund |
| No refund after first access | Simple and fraud-resistant | Treats a broken or misleading course unfairly |
| **Consumption threshold plus delivery-defect exception — recommended** | Balances buyer protection and author protection | Owner must set a threshold and evidence rule |

**Resolved under owner autonomy (2026-08-02):** a change-of-mind refund is eligible within **14 calendar days**
and before **20%** material consumption. A substantiated delivery defect, misrepresentation, or mandatory law
overrides the threshold.

**Affected finding:** `run7-06.04-d3-001`.

### C5 — Contradictory Royalty Terms at Launch — Resolved 2026-08-02

**Decision:** A Must-level calculation holds contradictory terms, but the full dispute engine is only
Could. What release-era exit path exists?

| Option | Pros | Cons |
|---|---|---|
| Promote the complete dispute engine to Must | Full lifecycle | Expands launch scope substantially |
| Ship the hold with no exit | Lowest build cost | Strands money indefinitely |
| **Build a minimal bilateral term-reconciliation path in the Must flow — recommended** | Gives held calculations a bounded, consented exit without building a courtroom | Does not resolve bad-faith disputes |

**Resolved under owner autonomy (2026-08-02):** the Must flow compares the conflicting terms, asks the recorded
counterparties to select or replace them, records consent, and resumes only after agreement. Cases that
remain unresolved stay held and are explicitly escalated to the later full dispute system.

**Affected finding:** `RUN7-10-007`.

## Batch 3 Ratification Record

All Batch 3 decisions are resolved under the owner's recorded autonomy delegation.

## Batch 4 — Release and Distribution Transactions

### D1 — Release-Date Move Notifications

**Decision:** Who may notify fans when a release date moves, and when?

| Option | Pros | Cons |
|---|---|---|
| Automatically broadcast every date move | Keeps all followers informed | Sends unwanted marketing messages and can announce an artist's private reschedule |
| Never notify fans | Simplest boundary | Leaves pre-save fans with stale expectations |
| **Send only through the consent-aware promotion surface after artist authorization — recommended** | Preserves artist control, honors communication consent, and still lets opted-in fans learn of a change | Requires an event handoff between release and promotion domains |

**Resolved under owner autonomy (2026-08-02):** release distribution updates the artist and emits a date-change event;
it never directly messages fans. Promotion may send a notice only after the artist authorizes it and
only to fans whose applicable follow, pre-save, or release-update consent permits it. Store/pre-save
links update independently of any message.

**Affected finding:** `R7-12.04-D3-001`.

### D2 — Evidence During an Involuntary Suspension

**Decision:** May a suspended release receive evidence that could resolve the claim?

| Option | Pros | Cons |
|---|---|---|
| Block every change during suspension | Easiest to enforce | Prevents the very clearance or credit evidence needed to resolve a claim |
| Let the owner edit any release data | Fastest apparent recovery | Lets the challenged facts change while they are under review |
| **Permit additive evidence only; freeze challenged facts — recommended** | Creates a viable resolution path without rewriting disputed history | Requires a distinct evidence action and clear audit trail |

**Resolved under owner autonomy (2026-08-02):** suspension permits additive claim evidence such as clearances,
credits, and attestations. The evidence is timestamped and visible to the claimant; it cannot mutate
the challenged release facts, delivery state, or prior evidence. All other release mutations remain
blocked until the suspension resolves.

**Affected finding:** `R7-12.05-D3-001`.

### D3 — Takedown-to-Redelivery Half Failure

**Decision:** What happens when a store requires a destructive takedown before a redelivery and
the second half fails?

| Option | Pros | Cons |
|---|---|---|
| Mark the update complete after takedown | Minimal implementation | Can leave a release offline indefinitely |
| Reject all updates that need takedown | Avoids half failures | Blocks legitimate metadata repairs |
| **Use a persisted, resumable recovery workflow — recommended** | Makes the destructive transition recoverable and honest to the artist | Needs durable operation state and per-store retry handling |

**Resolved under owner autonomy (2026-08-02):** before any takedown, persist the per-store redelivery plan and the
prior state. Execute a per-store idempotent workflow; if redelivery does not complete, show the
release as `recovering`, retry only within the recorded plan, and surface a recoverable
failure rather than claiming success. Do not start a destructive route without a valid redelivery
plan, and do not silently abandon the release after a failed second half.

**Affected finding:** `R7-12.05-D3-002`.

### D4 — Ownership Conflict on Another UGC Platform

**Decision:** A recording conflicts on one Content ID platform. What containment applies elsewhere?

| Option | Pros | Cons |
|---|---|---|
| Treat each platform independently | Maximum availability | Repeats a possibly false ownership assertion on other platforms |
| Immediately withdraw every existing registration everywhere | Strongest containment | May perform irreversible actions beyond the platform's authority or available recovery path |
| **Freeze new registrations across platforms; retain existing registrations pending platform-specific action — recommended** | Stops expansion of the disputed assertion without inventing a cross-platform withdrawal capability | Existing platform claims may remain active while resolved |

**Resolved under owner autonomy (2026-08-02):** an unresolved recording-ownership conflict blocks new registrations
for that recording on all supported UGC platforms. Existing registrations and claims retain their
platform-specific state; the system performs no automatic cross-platform withdrawal unless that
platform's supported remediation path succeeds and is recorded.

**Affected finding:** `R7-12.06-D3-001`.

### D5 — Whitelist Reconciliation After Identity or Credit Changes

**Decision:** How does a derived Content ID whitelist remain safe after its source data changes?

| Option | Pros | Cons |
|---|---|---|
| Update the whitelist automatically | Fast protection for new contributors | A bad source change can silently suppress a valid claim |
| Never refresh after registration | Simple and predictable | Newly credited contributors can be claimed by their own release |
| **Re-derive immediately, preserve current protection, and require review for changed exclusions — recommended** | Avoids accidental self-claims without silently weakening enforcement | Introduces a pending-reconciliation state |

**Resolved under owner autonomy (2026-08-02):** an identity, channel, or credit change immediately derives a proposed
whitelist reconciliation. Existing whitelist entries are never removed automatically. A newly
proposed exclusion remains pending review and is protected from new claims while pending; the
authorized artist must approve or reject the changed exclusion before it becomes a durable whitelist
entry. Registration or claim actions that would conflict with an unresolved reconciliation remain
blocked.

**Affected finding:** `R7-12.06-D3-002`.

## Batch 4 Record

All five recommendations were resolved under the owner's autonomy delegation on 2026-08-02.


## Batch 5 — Marketplace, Fan Messaging, and Adjudication

### E1 — Damage Claim at the Inspection Deadline

**Decision:** A buyer opens a damage claim at the end of the inspection window. Can settlement
and title transfer still occur?

| Option | Pros | Cons |
|---|---|---|
| Let the scheduled settlement win | Simple timer model | Can transfer ownership while the object is allegedly destroyed or damaged |
| Reject claims near the deadline | Predictable settlement | Unfairly removes the buyer's last permitted day |
| **Timestamped claim opening freezes settlement and title transfer — recommended** | Gives the claim its promised window and prevents an irreversible race | Requires one atomic transition |

**Resolved under owner autonomy (2026-08-02):** a claim received before the inspection deadline atomically moves the
transaction to `claim-open` and suspends auto-settlement and ownership transfer. Settlement
may resume only after the claim is withdrawn, rejected, or resolved; the resulting title transfer
uses the resolved financial outcome, never the pre-claim timer.

**Affected finding:** `R7-13-018`.

### E2 — Rights Takedown: Existing-Holder Access and Pack Scope

**Decision:** What remains accessible when a purchased digital asset receives a rights takedown?

| Option | Pros | Cons |
|---|---|---|
| Existing holders keep downloading the asset | Strongest buyer expectation | Continues distribution of an asset subject to a rights issue |
| Remove every pack containing the asset | Simplest enforcement | Needlessly revokes unrelated purchased content |
| **Stop delivery of the affected asset, preserve the receipt, and expand scope only when technically or legally necessary — recommended** | Conservative on rights while limiting collateral revocation | Buyers lose archive access to the affected asset |

**Resolved under owner autonomy (2026-08-02):** on a rights takedown, preserve the holder record, purchase date, and
reason but disable new and archive delivery of the specifically identified asset. A pack remains
available if the affected asset can be excluded; otherwise the inseparable container is withheld
and its unaffected entitlements remain recorded. A qualified legal review may require a stricter
jurisdiction-specific rule before launch.

**Affected finding:** `R7-14-014`.

### E3 — Delisted Dependency of a Project Template

**Decision:** A buyer owns a template but cannot obtain a required, unbundled dependency because
it has been delisted. What is the availability promise?

| Option | Pros | Cons |
|---|---|---|
| Leave the template permanently incomplete | No seller remediation cost | Sells an unusable product with no remedy |
| Promise continued availability of every third-party dependency | Best buyer experience | Cannot be guaranteed by the marketplace |
| **Stop future sales and give existing buyers a substitute-or-refund remedy — recommended** | Honest about third-party availability while preserving a buyer remedy | Requires seller support and refund handling |

**Resolved under owner autonomy (2026-08-02):** a template whose required unbundled dependency becomes unavailable
is immediately marked `dependency unavailable` and cannot be sold as completable. Existing
buyers retain their delivered template files and may choose either a compatible updated template
or a refund of the template purchase. The marketplace never requires an additional external
purchase merely to restore the product's stated function.

**Affected finding:** `R7-14-015`.

### E4 — Base Product Refund While an Upgrade Is Owned

**Decision:** What happens if an approved refund removes the product that made an upgrade price
valid?

| Option | Pros | Cons |
|---|---|---|
| Refund neither product | Protects revenue | Denies a valid base-product refund |
| Always refund both products | Simple and avoids an invalid discount | Buyer cannot retain the upgrade |
| **Let the buyer keep the upgrade only by explicitly paying the disclosed price difference; otherwise refund both — recommended** | Preserves buyer choice without an unauthorized charge | Requires a clear consent step |

**Resolved under owner autonomy (2026-08-02):** once the base refund is approved, the buyer may either (a) keep the
upgrade by explicitly accepting and paying the disclosed difference to its non-upgrade price, or
(b) receive refunds and entitlement revocation for both base and upgrade. If no valid choice or
payment is recorded, the system follows option (b); it never silently charges the difference.

**Affected finding:** `R7-14-017`.

### E5 — Weak-Provenance Imported Fan Records

**Decision:** Can an imported audience record be sent marketing messages when the importer cannot
prove permission?

| Option | Pros | Cons |
|---|---|---|
| Permit sends with a warning | Fast list activation | Treats uncertain consent as consent |
| Delete the records immediately | Lowest compliance exposure | Loses legitimate contacts and import history |
| **Quarantine from marketing sends until explicit re-permission — recommended** | Protects fan consent while preserving an auditable import record | Slows audience activation |

**Resolved under owner autonomy (2026-08-02):** weak-provenance or stale-consent records may be imported only into a
quarantined state. They receive no marketing or campaign send until the person gives fresh,
recorded consent through a lawful re-permission path; warnings, inferred consent, and list age
alone never unlock sending. The importer can export or delete the quarantined record under the
applicable privacy controls.

**Affected finding:** `R7-20.01-002`.

### E6 — Broadcast Sender Reputation on a $0, Solo Operation

**Decision:** Does launch include bulk broadcast messaging without a staffed deliverability
operation, numeric reputation thresholds, or a blocklist incident runbook?

| Option | Pros | Cons |
|---|---|---|
| Enable full broadcast now | Fastest feature coverage | Unsafe: no defensible complaint breaker, ramp, or on-call response |
| Invent platform thresholds now | Enables a theoretical rollout | Numbers without provider data or operations are false precision |
| **Defer bulk broadcasts until a managed sender and runbook exist — recommended** | Aligns the $0/solo constraint with sender-health obligations | Fan updates are limited at launch |

**Resolved under owner autonomy (2026-08-02):** v1 does not enable bulk email or comparable broadcast sends. Follows,
pre-saves, consent capture, and stored campaign drafts may exist, but delivery stays disabled until
a managed sender, numeric complaint and bounce thresholds, ramp curve, and blocklist incident
runbook are approved. This is a scope decision, not a promise that free infrastructure can safely
operate bulk messaging.

**Affected finding:** `R7-20.03-002`.

### E7 — Backer-Fund Custody and Fulfilment

**Decision:** Does v1 collect and hold campaign money without settled custody, milestone,
insolvency, and refund controls?

| Option | Pros | Cons |
|---|---|---|
| Collect campaign funds now | Enables a headline feature | Creates unbounded financial, tax, and consumer-protection exposure |
| Define informal creator promises only | Low implementation effort | Gives backers no enforceable funds protection |
| **Exclude paid campaign funding from v1 — recommended** | Avoids holding customer funds before counsel, payments, and operations exist | Defers monetized patronage campaigns |

**Resolved under owner autonomy (2026-08-02):** v1 may show a creator's non-binding interest or launch-intent page,
but it does not collect, custody, release, or split campaign funds. Paid campaigns remain
counsel- and payment-operations-gated until milestone verification, funds custody, insolvency,
partial-fulfilment, and refund policies are specified.

**Affected finding:** `R7-20.05-002`.

### E8 — Publicly Reachable but Unauthorized Recording

**Decision:** What test applies when a recording is publicly accessible but no authorization from
the rights holder is established?

| Option | Pros | Cons |
|---|---|---|
| Treat public access as authorization | Easy to apply | Mistakes availability for permission |
| Require the reporter to prove the complete rights chain immediately | Strong anti-abuse posture | Can bury legitimate creators under impossible proof burdens |
| **Treat public reachability as discovery evidence, never authorization — recommended** | Gives reviewers a concrete, fair predicate | Requires human review of authority evidence |

**Resolved under owner autonomy (2026-08-02):** a recording is `publicly reachable but unauthorized` when the
object is publicly accessible yet the responding publisher cannot supply a recorded release,
license, or authority from the asserted rights holder. A human reviewer records the cited object,
the claimant's asserted authority, and the publisher's authorization evidence. Public availability
alone does not defeat the claim; unresolved cases use the established temporary visibility/embargo
path rather than an invented approval.

**Affected finding:** `R7-24-RAW-007`.

## Batch 5 Record

All eight recommendations were resolved under the owner's autonomy delegation on 2026-08-02.
E2 and E8 retain their stated qualified legal-review gates before the associated launch capability.
