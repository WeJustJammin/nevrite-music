# Cross-Cut Emergent Capabilities — Step 6 Synthesis

> **Provenance**: Consolidated from the Step 6 cross-cut synthesis sweep across domains 01–24.
> Source pool: 83 candidate emergent cross-cuts (`emCC`), 90 candidate emergent features (`emF`),
> 101 boundary problems (`bp`). Date: 2026-07-18.
>
> **Downstream contract**: `/create-prd` (architecture + shared-mechanism registry), `/decompose-architecture`
> (domain/shard boundaries), and `/audit-ambiguity` inherit this file. The **New Cross-Cut Mechanisms**
> table is the authoritative "extract-me-as-shared" list — anything here must NOT be rebuilt per-domain.
> The **Boundary Analysis** section is the D-17 (24-domain-count) verdict.

Domain key: 01 Identity · 02 Credits · 03 Community · 04 Opportunities/Casting · 05 Services · 06 Education ·
07 Music Projects · 08 Real-Time Jamming · 09 Rights/Ownership · 10 Royalties/Collections · 11 Licensing ·
12 Release/Distribution · 13 Gear Marketplace · 14 Digital Goods/Plugins · 15 Gear Registry/Ownership ·
16 Venues/Studios/Spaces · 17 Live Booking/Settlement · 18 Show Production/Touring · 19 Ticketing/Box Office ·
20 Fanbase/D2F · 21 Promotion/Marketing · 22 Analytics/Market Intelligence · 23 Career/Finance · 24 Trust/Safety/Disputes.

---

## 1. New Cross-Cut Mechanisms

Genuinely-new shared mechanisms **not** in the consolidated registry. Excluded from this list (they are
*refinements/constraints* on existing registry entries, tracked separately): entity→alert-delegate addressing,
the three-contract collaboration-graph split, follow-notification graph-distance tiering, per-field permission
ownership, single-hop redirect-on-merge, native-OS notification channel + per-slot severity, per-payee escrow
freeze, warn-the-owner-of-perishable-state, the Availability substrate/commercial-avail split, and the
Safeguarding-consumer additions (11 joins 01/03/04/06/08/17/20/24). These are captured as registry-entry deltas,
not new mechanisms.

### 1a. Money & Exploitation layer
The single most-duplicated cluster. Boundary evidence (B31/B34) independently flags 09/10/11/12 as "a shared
exploitation & money schema layer." Build these four once or four domains write four dialects that disagree about
one artist's money.

| Mechanism | Why it's new / not in registry | Serves |
|---|---|---|
| **Structured Deal-Terms & Settlement/Recoupment Evaluator** | Typed economic terms compile to an evaluable formula (base + ordered deductions + thresholds + derived rates + recoupment against a float, applied as-of a date). Registry has Split-Capture (disbursement) and Contracts/E-Sign (documents) but **no evaluator**. A guarantee-vs-door live settlement, a royalty statement, and a licence fee are the same engine. Highest reinvention risk on rounding (single-rounding-at-payable-boundary), deduction-stack order, determinism/versioning. (10.03.02 DT-03, 17.03→17.09) | 05,10,11,13,14,17,19,23 |
| **Effective-vs-Nominal Share Resolution** | Derives effective net after the encumbrance waterfall (gross→net→owners'-share tier order declared in 09, executed in 10), co-pub shares-of-shares, and recoupment. Distinct from Split-Capture (disbursement at capture) — an as-of computation over live revenue + deal terms. (09.01.03/09.01.04) | 09,10,11,23 |
| **As-Of / Bitemporal Record Resolver** | First-class point-in-time resolver where the as-of key is sometimes a **window** (receipt-basis uncertainty bands), and which must also resolve **inbound cross-domain references** (a credit cite @02, a ticket address @19, a settlement basis @17) to a record's state as of the referenced date, surviving relocation/rename/merge. Registry names as-of only as an Audit-Ledger *constraint*; every royalty restatement/term/split read and cross-domain reference depends on it standalone. (10 As-Of, 16.01.01 DT-15) | 09,10,11,12,16,23 |
| **Territory Matrix (right-type × territory)** | Term, reversion, public domain, moral rights, licensing scope, sub-publishing and distribution each vary by territory and *differently from each other*; effective share is a right-type × territory **matrix**, not a scalar. Distinct from the registry's presentation-only Localization/Currency/Timezone mechanism. Highest-leverage schema decision in 09. (09.01.04 D-07, 09.03.02 D-01) | 09,10,11,12,19 |
| **Income Event Emission Contract** | Normalized income-event emission (gross/deductions/net decomposition, immutable native currency/amount, idempotency key, reversal semantics, optional `work_id`) that ~10 earning domains must implement for 23's ledger to exist. Distinct from Split-Capture (disbursement, not read-side aggregation) and Analytics Instrumentation (fire-and-forget, no money/reversal semantics). Omitting `work_id` silently breaks 23.01.05 with no error — must be a contract, not a per-consumer detail. (23.01) | 05,06,10,11,12,13,14,17,19,20,23 |
| **Post-Payout Reversal / Clawback-after-Settlement** | A chargeback arrives up to 120 days (cards) / 13 months (SEPA) after the contributor pool paid out, forcing a compensating negative accrual against a future period. Registry Payments covers refunds/chargebacks but not after-settlement reversal semantics rippling into Split-Capture. (14.09) | 05,10,14 |
| **Unclaimed & Unpayable Balance Handling** | Money owed to a payee the platform cannot reach (unclaimed shell, below-threshold, dead payee). Explicitly **not** a payments-rails concept (rails handle a failed transfer, not money owed to a non-existent payee). Each domain otherwise reinvents it as a `balance` column with no clock. (10.04.03 DT-01) | 05,10,13,14,17,19 |

### 1b. Standards-body & distribution transport

| Mechanism | Why | Serves |
|---|---|---|
| **Standards-Body Emission & Acknowledgement Transport** | Batch payload with no per-item status call, sequence-stateful retries, ack parsing, expected-by alarm because **silence is the failure mode**. Unifies CWR (10.01.03), DDEX ERN (12), RIN (02.08), black-box claim submission (10.05.02). | 02,10,11,12 |
| **Partner-Conformance Learned Store & Feedback Loop** | One versioned store of "what each DDEX/DSP partner accepts" (validation thresholds + ERN/MEAD grammar + transport windows + date semantics), read by validation and ERN generation, written by a human-reviewed rejection/silent-normalisation learning loop, pinned per delivery. Registry Integrations covers connectors but not the shared learned store, its promote/decay loop, or per-delivery pinning. (12.03.03) | 02,09,10,11,12 |
| **Silent-Normalisation Read-Back / Store-Display Reconciliation** | Periodically read back what a store actually rendered and diff against what was delivered — the only detector of DSPs silently rewriting accepted metadata (no failure signal otherwise). Not covered by Audit Log, Analytics, or Integrations. (12.01.02 DT-10) | 12 (feeds 22,24) |

### 1c. Scheduling, delivery & media

| Mechanism | Why | Serves |
|---|---|---|
| **Deferred / Obligation-Driven Action Scheduler** | An action dated now, fired later on a calendar date **or** an external event: licence-expiry takedown (11→12), lease-term flag (14→12), event-triggered reversion (23→12), and the money case where a fan's funds in indefinite postponement auto-convert to a cancellation/refund (19.06.03) — the case where inaction is rewarded and the law intervenes. Distinct from Availability/Scheduling (resource holds) and Notifications cadence. | 11,12,14,16,18,19,23 |
| **Entitled-Party Media Delivery Layer** | Versioned fetch gated on a held right + statutory (EU distance-selling) waiver captured at first delivery + platform-authored consumer licence + irreversibility rule + **per-recipient forensic write** (embedded ACIDized/Apple-Loops tempo/key metadata + deterministic per-buyer watermark, resume-safe, breaking the CDN cache assumption). Registry Media Handling covers transcode/audition only. B52 confirms four domains need the identical "entitled party fetches a versioned file gated on a right" shape — a cross-cut, not a domain. | 05,06,07,11,12,14,20 |
| **Forensic Audio Watermarking & Leak Tracing (stream-level)** | Per-recipient encoding that marks the **stream**, not only the download, no shared cache, plus a leak-investigation surface whose disclosure record survives expiry/revocation/archival. Materially larger than registry's audition watermark — the difference between the default streaming mode being traceable or being the untraceable one. (07.05.02 DT-07/D-09) | 05,07,11,12,14 |
| **Audio DSP Analysis Compute** | Null-test, true-peak, loudness measurement. Registry's Audio Fingerprinting is acoustic content-ID; this is signal **measurement**, a different compute path (Cloudflare Workers may not be viable for multi-GB DSP). Three features, one answer (07.04.04/07.07.03/07.08.02). | 07,12,14 |
| **Large-Asset Resumable Chunked Ingest** | Multi-GB stem-pack upload over studio upstream with resumability — a failed 4 GB upload at 90% is product-abandoning. Registry Object/Evidence Storage covers durable storage + signed-URL retrieval but not the resumable **ingest** path. | 07,08 (+ any large-upload domain) |
| **Endpoint Uplink Arbitration / Session-Aware Upload Scheduler** | Arbitrates the platform's own background take-uploads against the live monitor stream on a shared uplink (a 1.5 GB upload saturating upstream sabotages the monitor stream the platform is serving). Defers uploads while in a live room; runs immediately in overdub mode. Not in registry; Real-Time Rooms moves live packets but doesn't arbitrate. (CX-08b) | 07,08 |
| **DAW Session Format Parsing & Parser-Rot Monitoring** | Reverse-engineered proprietary-format parsing that fails **silently**, so unmonitored parser rot is indistinguishable from users not being credited. No registry entry covers format-parser health as a monitored capability. (07.09.02 DT-03) | 07 (feeds 02,09) |
| **Collaborative-Record Optimistic Concurrency** | Optimistic-version contract for concurrent editors of a shared record (tracklist 12.01.01, split sheet 09, project 07). Realtime Rooms is audio transport only (D-15); no cross-cut covers collaborative **document** editing. Explicit gap in 12.01.01. | 07,09,12 |

### 1d. Trust, evidence & attestation

| Mechanism | Why | Serves |
|---|---|---|
| **Graded-Confidence Attestation & Counter-Attestation** | A general trust primitive weighting a fact by observation-strength, distinct from Contracts/E-Sign (document signing) and Verified-Credit-as-Evidence (credit-specific): the same mechanic weights ownership claims, service entries, appraisals, gear-on-session attestations, session-attendance grades (delivered-by < observed-playing < session-captured+attested), a `provisionally-attested` credit rung (address-proven, zero weight, unpublished), box-office number-attestation (a certified count, not a signed document), and provenance trust-tier labels (captured/asserted/imported → badge + evidentiary weight). Confidence bounded by the weakest link. Will diverge badly if implemented per-domain. (08.05.04 DT-08, 15 attestation, 19.05.05, 07.03.02 DT-07) | 02,08,09,15,17,19,24 |
| **Evidence-Capture-at-Source Contract** | 13/17/19/07 each capture structured, queryable evidence (serial + condition photos, hold + deposit events, door-scan, session provenance) at their **own** moment-that-matters, because a missing snapshot cannot be recovered weeks later at dispute time. Three sub-domains derived it independently — a platform-wide capture obligation, not a 24-storage feature. | 07,13,17,19,24 |
| **Public Certificate Verification ("cited, not claimed")** | Third parties (buyers/venues) prove a licence certificate (11.08.03) or a credit is genuine via unguessable references + rate limits + forgery detection. Distinct from countersignature/attestation — this is public verification of an already-issued artifact. Merge candidate across 02 credits and 11 licences and 19 box-office counts. | 02,11,19 |
| **Listing-Eligibility / Prohibited-Items Engine** | Machine-readable projection of the commerce rulebook, invoked at listing **and** checkout, returning a coherent single reason across CITES/prohibited-items and authenticity/counterfeit checks. Registry has no listing-eligibility mechanism, only per-domain marketplaces. A rule publish must rebuild the projection or sellers get contradictory reasons; rebuild failure keeps the old projection and alerts — never fails open. (24.02.05) | 05,13,14,18,19,24 |
| **Pair-Scoped Negative-Permission Enforcement** | A **negative** permission scoped to a pair of actors ("these two, never") checked at every transactional call site (buy listing, book studio, buy ticket, apply to casting), not just the inbox. Registry Roles & Permissions is positive-grant RBAC; this is its structural inverse and propagation failure is silent. | 03,04,05,13,16,19,24 |
| **Composed-Exposure / Physical-Safety Evaluator** | Composes owned-value (15) + identity/home-city (01) + tour dates/absence (17/18) + fan reach (20) into a targeting-package burglary/safety risk score, warning at the moment of publication naming what else is already public. No single domain can see the composition; a genuinely homeless cross-cut. Registry Privacy covers per-datum consent, not composition-across-domains hazard. (15.02.01/15.04) | 01,15,17,18,20 |
| **Price-Signal-Driven Catalog Integrity Feedback Loop** | Comp-set statistics feed **back** into catalog moderation / entity-resolution: bimodal sold comps emit a model-split candidate; a thin-variant bind that silences the price guide emits an evasion signal. No registry mechanism models the price/comp layer as a diagnostic writer. (13 DT-09) | 13,22,24 |
| **First-Party Condition/Custody Record as Evidence** | The platform's own rental-return, repair, and intake-grading records for a serial-keyed unit accrue across owners and pre-fill seller disclosure. The physical-goods analogue of Verified-Credit-as-Evidence but for **condition** — structurally impossible for a pure marketplace (no fleet, no repair function). | 13,15,16 |
| **Capture-at-Source Assertion Promotion** | One-tap promotion of an unstructured chat claim ("any cracks?" → "no, none") into a structured, timestamped, evidence-pinned, liability-bearing disclosure. Registry Messaging does not describe promoting chat into signed structured records — serves every negotiation-heavy domain. | 04,05,13,17 |

### 1e. Discovery, outreach & consent

| Mechanism | Why | Serves |
|---|---|---|
| **Outbound Deliverability Commons** | Platform-wide opt-out ledger + per-target rate-control + shared sender-reputation/deliverability pool + a non-user addressable notification channel (with its own global opt-out and `delivered`-never-`read` reporting). Registry Notifications covers consented fan-out and Messaging covers participant-scoped threads; neither covers **cold outbound to non-users** on shared infrastructure. If the sender resolves to as-WeJammin, one artist's imported-list complaint rate mechanically degrades every other artist's inbox placement — existential, not optional. Flagged 4× independently. (21.02.06, 20.03.04, 07.05.02) | 04,05,07,17,20,21 |
| **Cross-Domain Response-Reputation & Unified Triage Inbox** | A single triage inbox aggregating inbound submissions (04), service enquiries (05) and lesson/mentorship requests (06) because they land on **the same human on the same day**, plus a response-reputation signal (did you answer applicants?) on discovery surfaces. Scores *answering inbound*, distinct from the registry's post-transaction Reviews. Owner ambiguous by design. | 04,05,06,16 |
| **Dynamic Requirement/Response Forms** | A bounded, type-scoped question builder (plain-text-only ceiling, no upload) serving 04 casting requirements, 05 service enquiries, 11 sync briefs and 16 venue enquiries. Not in registry. | 04,05,11,16 |
| **Professional Co-Presence Graph (pre-credit edges)** | Co-presence in a session is a professional-graph edge created **before** any credit exists, at zero marginal cost — the true substrate of warm intros and dep matching. Registry's collaboration graph is strictly credit-derived. A leak-with-a-fuse: must not become visible before the credit publishes (02.01.05 embargo). | 02,03,04,05 |
| **Purpose-Scoped Discoverability Consent** | findable-for-hire (05) ≠ watchable-for-evaluation (22.07) ≠ contactable (03/04); a single "discoverable" flag either breaks livelihoods or launders consent. Distinct from the generic Privacy/Consent mechanism. | 03,04,05,20,22 |
| **Paid-Endorsement / Sponsorship Disclosure Label** | A generic, non-removable disclosure label on a paid-relationship verdict. Registry Audit Log carries AI-generation disclosure but there is no consumer-facing paid-endorsement label mechanism. 21 owns only the music-specific payola policy; the label render/persist is the cross-cut's. | 05,13,14,20,21 |
| **Timed-Reveal / Embargo Lock** | A generic timed-reveal publish-**block** (hard), distinct from a tour-conflict warn (soft) — the block-vs-warn distinction is load-bearing. Includes aggregate/count-level embargo suppression (a rendered credit **count** must be viewer-relative and exclude non-participant embargoed credits, because the count itself discloses a session happened). Registry Availability covers reservations/holds, not content-reveal embargoes. | 02,12,13,14,17,19,20,21 |

### 1f. Analytics primitives

| Mechanism | Why | Serves |
|---|---|---|
| **Anonymised Cohort Construction & k-Anonymity Floor** | One shared privacy floor for benchmark cohorts, venue-catchment market views and rate guides — two floors for one mechanism is an incoherence, and two cohort surfaces cross-referenced break each other's floor (CX-07). | 05,16,22,23 |
| **Playlist Quality / Bot Classification** | One classifier feeding curator intelligence, streaming-fraud detection, promo-vendor scoring and pitching. CX-04's celebration gate depends on exactly one verdict; duplicated copies that disagree are unacceptable. | 21,22 |
| **Work-Identity Tier (ISWC above the recording)** | Career totals sum works, not recordings, so a grouping tier above ISRC is required. Registry Canonical Data mints IDs but not the work>recording grouping tier. | 02,09,10,11,12,22 |
| **Shared Attention / Notification Budget Authority** | A shared budget authority arbitrating both (a) a single scarce capture moment (the tired band at 1am contended by 02/16/17/18/19/20) and (b) a per-user finite notification tolerance every domain independently spends. Sharpens — does not replace — registry Notifications, which does fan-out but not scarcity arbitration. | all 24 (esp 02,16,17,18,19,20,22) |

### 1g. Assets, rooms & documents

| Mechanism | Why | Serves |
|---|---|---|
| **Custody / Possession-vs-Ownership Tracking** | A state distinct from ownership that gates listing/consignment rights (13), is created by service bookings (05), governs room-resident gear (16), and moves with touring gear (18). No registry equivalent; added late (D-04) because four unrelated features produced wrong answers without it. Blast radius exceeds 15. | 05,13,15,16,18 |
| **Read-Through Asset Room-Binding Join** | 15 registers assets against the org, 16 makes the room the spec/calendar unit, and "which room the asset is in" is held by neither — a join layer distinct from both the asset register and the room record. The compatibility oracle and per-room backline lists depend on it. (16.03.02 ↔ 15.07.01) | 13,15,16,18 |
| **Pooled-Asset Booking Contention Detector** | A shared resource (the studio's single C12 mic locker) contended across independent room calendars — a double-sale is invisible because no calendar owns the asset. Availability/Scheduling assumes one bookable resource per calendar. | 15,16 |
| **Structured Evidentiary-Document Generation** | A render-scope-version-supersede-distribute primitive: insurance claim pack, appraisal, insurance schedule, rig spec sheet, carnet source data, advance sheet, day sheet, tour book, setlist, signed split-sheet export, rider, invoice, cue sheet. Registry Object/Evidence Storage **stores** them but nothing **generates** them. | 09,11,15,17,18,19 |
| **Document Custody, Validity & Verification** | A document with an issuer, a validity window and a human who accepts it (insurance certs, visas, carnets, permits, proof of ownership); the twist is validity is evaluated against the **event date**, not today. Not cleanly covered by Contracts/E-Sign (signing) or Object Storage (custody). | 11,16,17,18 |
| **Structured Requirement↔Capability Diff** | Requirement set vs capability set producing match/shortfall/unknown with an equivalence model — the wedge mechanism recurring in 04 (role vs musician), 05 (brief vs provider), 16 (rider vs room / Spec Conformance) and 18. The venue/gear-equivalence data stays domain-owned. | 04,05,16,18 |
| **Per-Category Structured-Attribute Schema** | One versioned, moderation-owned schema keyed on catalog category drives attribute set, flaw checklist, component set, fitment/voltage warnings **and** compliance derivation (CITES/tariff/freight). Taxonomy mentions categories but not "category schema instantiates multiple derived forms." Gear-owned but pattern-general. | 13 |
| **Geo / Mapping / Drive-Time Computation** | Distance/geocoding/travel-time behind routing feasibility and the cross-day cascade, and behind casting reachability (04.02.02). Registry Search has geo **discovery** but not drive-time **computation**. | 04,17,18 |

### 1h. Contracts, scope & booking mechanics

| Mechanism | Why | Serves |
|---|---|---|
| **Scope Freeze / Contract Snapshot** | An immutable accepted-quote/scope snapshot that every downstream reader (dispute, substitution, change order, revision) composes from, plus contract-pin against bulk mutation (a contracted retainer rate is immune to a bulk rate-card edit, with a pre-commit blast-radius check). Broader than Contracts/E-Sign, which models signing but not the composed frozen scope object. (CX-13) | 05,13,17 |
| **Entity Binding-Authority / Capacity-to-Bind Chain** | The "who may bind this band/label/studio" primitive serving licensing (11.08.02), live booking (17.02.03), services acceptance (05.03.03), resting on 01's membership/mandate edge — with a **multi-clock** constraint (a 48h offer-approval chain, a 4-minute car-park settlement signoff, and an open-ended split agreement can't share one unanimity rule). Partially overlaps Roles/Delegated-Authority but the multi-party approval-to-bind chain is not spelled out there. | 01,05,11,17 |
| **Offline-First Admit & Reconcile Replica** | A low-connectivity occupancy/scan replica with peer-exchange double-scan detection, reconcile-not-repair posture, and freshness-gated refusal, for structurally bad venue connectivity. Distinct from Realtime Rooms (jamming audio). Its reconcile-produces-evidence-not-repair rule is the box-office thesis in miniature. (19.04.02) | 16,18,19 |
| **Session Attendance / Hours Tracking** | Opt-in, controlled by the person tracked, never visible to the Operator, producing union AFM/MU hour reports. Registry Payments/Tax move money but do not track **hours** — a distinct evidence-of-time mechanism. (07.06.01 D-13) | 05,06,07,16,17,23 |
| **Timestamped Annotation on a Media Object** | The SoundCloud-comment / Frame.io-shaped primitive: teacher feedback on a student take (06), producer revision notes on a mix (07), client notes on a service deliverable (05). The domains are right; the shared mechanism is unowned and will be rebuilt three incompatible times. | 05,06,07 |
| **Practice / Performance Tool Surface** *(tentative)* | Tuner, metronome, drone, tempo slow-downer — Education owns the practice room but the tools recur in jam rooms (08) and sessions (07). Open Q whether shared cross-cut or education-owned instances; registry Media Handling covers the slow-downer's transcode but not the tool surface. | 06,07,08 |
| **Purchased-Input Clearance Propagation** | A paid purchase becomes dated, machine-readable clearance **evidence** that travels downstream (placement → project 07 → release 12 → rights 09), carrying the *right* not the *use*. Related to but distinct from Verified-Credit-as-Evidence (trigger is a purchase, not a countersigned credit). Open Q: push-at-purchase vs pull-as-of-at-release. | 07,09,12,14 |
| **Plan-vs-Fact Paired Records** *(modelling convention)* | Plan and fact are always separate objects (planned/performed setlist, planned/actual schedule, manifest/load-out check), rhyming across the corpus (booking/settlement, offer/contract). An emergent modelling pattern, not a service — but must be enforced consistently. | 02,17,18 |

---

## 2. New Features by Domain

Deduped from 90 candidates. Cross-domain duplicates collapsed (Title→Identifier binding surfaced from
05/12; Event-Brand from 16/21; room-installed-software from 14/16; withholding gross-up from 10/23; etc.).
Features that are merely the domain-owning **consumer** of a Section-1 cross-cut are listed here with a pointer.

| Feature | Owning domain | Why it's new / uncovered |
|---|---|---|
| Identity-page composition-by-arrival-context | 01 | Same teacher/identity page renders differently for a fee-paying parent vs Producer vs logged-out stranger; identity header the only constant. No 01 feature covers arrival-context composition. (06.02.01 DT-05) |
| Band-formation-from-class-roster | 01 | A Band as a first-class identity entity materialising out of a group-class roster, carrying members into Community. No 01 feature models roster→band promotion. |
| Cross-teacher trial-farming / sockpuppet defence | 01/24 | Trial abuse spanning multiple teachers is unsolvable inside 06 — identity is the only defence. No 01/24 feature names identity-level trial-abuse detection. |
| Behavioral-data non-attachment on account creation | 01 | When a weak-link recipient later signs up with the same email, prior anonymous listen data must **not** silently attach. Retroactive identification is the trust-destroying move; no non-attachment guard exists. (07.05.02) |
| Sanction-aware surface state (VISIBLE-AND-BLOCKED) | 01 | Under a selling suspension, identity surfaces render visible-but-blocked with 24's reason + appeal route (a disappeared surface reads as data loss). No 01 feature covers rendering while a permission is revoked. |
| On-site attendee / present-party model | 01 | The harvest prompt must route to the person physically present (the eyewitness), not the booking contact/manager. 01 has no attendee model to route against. (16.05.06 D-21) |
| Departing-member financial-access resolution | 01/23 | When a member leaves a Band entity, continued access to the band's ledger/expenses/P&L/deal-vault is an unresolved collision — revoked, frozen, or retained for the tenure period? (23.07.03) |
| Doubling model in the role/instrument taxonomy | 02 | One party, two instruments, one date must be expressible — under AFM/MU rules it carries a fee (a payment fact, not a taxonomy nicety). No 02.06 content covers doubling. (CX-15) |
| Room-mode "witnessed" confirmation capture | 02 | "The Producer says this person tapped on my phone" confirmations captured but scored below producer-asserted until ratified. The provenance ladder has no rung for it. → cross-cut §1d. |
| Not-in-final-master post-export credit mutation | 02 | The comped-out qualifier is set at delivery, after credits may already be exported/registered — joins amendment/retraction/demotion on the unsolved re-emission list. (Q-08) |
| Feed-as-provenance-write-surface | 03 | The activity feed is where pending credit counter-attestation requests land as confirmation cards — a feed item that is also a **write** affordance ("lazy-path-is-correct-path"). Feed files treat it as read-only. |
| Booking-lifecycle-driven visiting-membership grant/revoke | 03 | A confirmed booking derives a visiting scene membership scoped to load-in/curfew; a cancelled booking revokes it on the same event. 17 does not model the coupling. |
| Follower-count integrity / anti-inflation verification | 03 | Follower counts function as **booking currency** (promoters set guarantees on them), so bought followers are revenue-motivated fraud with direct payback — a stronger threat model than vanity gaming. |
| Referral / "who sent them" recognition capture | 03 | The dep circuit's real recognition signal, distinct from discovery, that nothing currently carries. |
| Supply-side inverted matching trigger | 04/17 | "A drummer just became free who could fill Tuesday" — matches a person against a gap, not an intent against an Opportunity. Homeless: 04 is demand-side; belongs to 17/availability. |
| Occupational-requirement-vs-discrimination adjudication | 24 | Casting contains legitimate occupational requirements shape-identical to discrimination ("female vocalist for a Motown tribute" vs "crew, under 25"). Unowned in 04; belongs to 24. |
| Buyer input-material clearance warranty | 05 | 05.06.04 warrants only the seller's deliverable; nothing warrants the buyer's supplied input. The buyer-side clearance acknowledgement at the requirements gate is uncovered. (CX-15) |
| Trial / test-mix milestone | 05 | The industry's near-universal de-risking mechanism (a bounded paid trial gating the full engagement) is absent from the domain model. (05.02.01 DT-10) |
| Entity acceptance-approver nomination | 05/01 | An engagement contracted by a band/label entity must nominate ONE binding approver at acceptance, other members' input non-binding. No feature owns the nomination flow. → cross-cut §1h. |
| Cross-domain compound booking (room + engineer) | 05/16 | Dry-hire room (16) + freelance engineer (05) in one transaction — the platform's clearest structural cross-sell, impossible for single-side competitors, currently nobody's feature. |
| Rights-Orphan Detector | 07 | A readiness check flagging a Song at `master approved` with ZERO asserted recordings in 09 — a finished record that is a rights object nowhere. The loudest completeness deficit, the thesis failing where it should work. |
| Non-user addressable notification channel + global opt-out | 07 | Delivery channel for address-proven non-users (email-only attestation-invite recipients) with its own opt-out, abuse limits, and `delivered`-never-`read` reporting. → cross-cut §1e (Outbound Deliverability Commons). |
| Provisionally-attested credit tier | 02 | A third attestation tier between `claimed` and `counter-attested`: `provisionally attested` = address-proven, zero weight, unpublished; publication gates on upgrade. 02 models only two tiers. → cross-cut §1d. |
| Local monitoring round-trip calibration (overdub pre-flight) | 08 | 08.06 covers live-rig readiness but not overdub's output→input round-trip calibration — the local latency that becomes the alignment offset. A wrong offset silently mis-aligns every take. |
| Bed-version disclosure record | 08 | A dated, non-recallable record of who holds which bed version at which fidelity. Once disclosed to an overdubbing player it can't be recalled; 24 needs it for leak/exposure disputes. |
| Statement-to-bank-receipt reconciliation | 23 | The statement says £4,200; the bank credit is £3,890; the gap is netting, at-source deductions and the bank's FX — routine, unexplained, unowned. (10.02.01 Q-07) |
| Platform-discovered source dispute (`source-total-disputed`) | 10 | A statement that structurally reconciles (Σ = declared total) but whose own arithmetic fails (rate × units ≠ line) is a dispute the platform finds in the counterparty's own document before any human objects. |
| Withholding-tax gross-up & reclaim-input capture | 10 | The parse must preserve source-currency gross + the WHT deduction type so cross-border reclaim is possible; the parse-side capture is unowned (23 owns the reclaim). (10.02.05, D-20) |
| Asset custody / possession indicator | 09 | "You own it — do you hold it?" Ownership and possession are routinely severed and no rights DB models it. → cross-cut §1g (Custody). |
| Medley / multi-work composition object | 09 | Exact-rational medley weights on the work-link (a second arithmetic surface) + a per-publisher negotiated, refusable medley-release clearance path harder than a cover's. No feature covers medley composition. |
| Signed split-sheet export ("the wedge exit") | 09 | A human-readable signed export so the captured sheet is an asset, not a hostage. Machine interchange (CWR/RIN) is 10; the export surface is unnamed. → cross-cut §1g (doc-gen). |
| "Not society-ready" badge (distinct from "no split agreed") | 09 | A second, independent release/registration-readiness badge, plausibly gating society registration separately from release. |
| Cue-sheet generation & PRO filing at issuance | 10/11 | Triggered at licence issuance for sync — the only moment any system holds the complete PRO payload, and the writer's performance royalty routinely exceeds the sync fee. No feature owns it. |
| Live-performance PRO royalty auto-filing | 10 | Performed setlist + date + venue auto-files a PRO live-performance report as a byproduct — unclaimed today because filing is manual admin; potentially the domain's strongest revenue argument. |
| AI buy-side provenance | 11 | A work that **contains** AI-generated material of unknown/uncopyrightable provenance (the sell side, 11.07, is modelled; the buy side is not). Falls between 11.02.03, 11.07 and 07. |
| Venue PRO blanket public-performance licence | 16/11 | The one piece of real Operator licensing work, flagged as having NO current home. (Q-05) |
| DSP ownership-assertion reconciliation | 12/11 | The distributor "I own this" tick and the completeness attestation are the same fact in two places — unifying (or flagging contradiction) is an unowned laundering-vector control. |
| Licence renewal / re-clearance flow | 11 | A lapsing clearance re-encumbers and must route to a renewal flow with 90/30/7-day pre-expiry warnings. Breadth pass treated clearance as terminal. (CX-21) |
| Unit-record write-at-publish | 13 | At listing publish nothing writes the serial-keyed **unit** itself; listing reads the registry, settlement writes the chain — no feature materialises the unit entity. (DT-08/D-07) |
| Thin-variant-bind evasion detection | 13/24 | A signal when a listing binds a rare n=2 variant to silence the price guide, weaponising the platform's honesty mechanism. → cross-cut §1d (price-signal feedback). |
| Model-split-candidate proposal queue | 13 | The reverse of merge — a moderation intake receiving comp-variance split candidates with bind re-pointing via the alias graph. Merge is specified; split-from-price-signal is not. |
| Per-attribute model-assertion provenance | 13 | Who/when/citing-what/confirmed-by-whom on every model attribute — a scope extension beyond merge-reversibility use of the audit ledger. |
| Photographic identity fingerprint at listing (serial-less gear) | 13 | Mandatory 3+ distinguishing-mark photos so misrepresented-vintage and swap-scam fraud is provable. Driven by T&S but landing on 13's data model. → cross-cut §1d (Evidence-at-Source). |
| Store-Display read-back reconciliation | 12 | Reads back the store's rendered metadata, diffs against delivered, flags silent normalisation, feeds the learning loop. → cross-cut §1b. |
| Scheduled / obligation-driven takedown | 12 | An automated takedown fired by a licence-expiry (or lease-term) timer — distinct from voluntary (12.05.01) and dispute-initiated (12.05.03) takedown. → cross-cut §1c (scheduler). |
| Artwork illegal-imagery scan at first custody | 24 | Statutory consumer-reach scanning of artwork at first asset upload, before the pre-save Fan surface. No feature owns the scan-at-custody obligation. |
| Title→Identifier binding at release | 12 | Binds a title agreed years earlier (in a split or spec deal) to the ISRC minted at release — "the unowned seam" orphaned between 05/09/10/12. |
| Chargeback handling & post-payout clawback | 14 | 14.09.03 enumerates refund/transfer/hardware-return only; the chargeback trigger (no vendor consent, no policy check, months later, after payout) has no feature. → cross-cut §1a. |
| Delivery-time embedded metadata writer | 14 | Delivered audio written with ACIDized-WAV / Apple-Loops tempo/key/loop metadata so DAWs auto-stretch; must compose with watermarking on one delivery step. → cross-cut §1c (delivery layer). |
| Two-part vendor rights attestation | 14 | A second attestation beyond "is this yours?": "if any is licensed from elsewhere, does that licence permit resale inside a pack?" The central inbound exposure (producers read "royalty-free" as "resellable"). |
| Bundle per-entitlement price allocation | 14 | Bundles must apportion price + currency across N minted entitlements so partial refunds and contributor payout attribution have a correct amount. |
| Platform consumer listening licence artifact | 14 | A platform-authored consumer licence (distinct from vendor terms) bound on every fan music purchase across 14 and 20 — no feature authors/versions/manages the shared object. → cross-cut §1c (delivery layer). |
| Installed-and-usable software registry for a room/studio | 16 | What software is actually installed and runnable in a given room (DAW version, plugin set) — 14 sells plugins as goods, 15 models physical objects; the room-scoped software capability is orphaned. |
| Room↔asset location binding fact | 15/16 | Which room a given org-owned asset currently lives in — 15 registers against the org, 16 makes the room the calendar unit; neither holds the join. → cross-cut §1g. |
| Gear-burden / haul profile as casting reachability input | 15/04 | What a musician physically hauls, in a form 04's reachability engine can consume; without it reachability degrades to travel-time with an assumed load. |
| Manifest/carnet field extension on the gear record | 15 | Weight, insured value, country-of-manufacture per item — required by 18's carnets and freight, fields 15.01 does not yet hold. |
| Holder→owner fault/loss relay | 15 | "The holder notices, the owner has standing" — a cross-custody notification + standing feature that reaches the title-holder. (CX-08) |
| Stale-custody decaying-confidence nudge | 15 | A nudge to both holder and owner after a silence window — a concrete notification feature currently only a hypothesis. |
| Event-brand entity ownership & lifecycle | 21 | The promoter-branded event brand 16 detects/suppresses (not an alias, not a building) — nobody owns what the brand becomes as a first-class entity. Ambiguous across 16/18/21. |
| Load-out / vehicle-movement curfew as routing input | 18 | A band that can't legally load out until 07:00 can't make tomorrow's drive; 18's tour routing has no field for it because the industry has none. |
| Multi-night run / residency shared-advance model | 18 | Nights 2..N of a run share ONE advance, contradicting 18.03's per-date model. Unowned across 18.01/18.11. |
| Venue standing advance questions | 16 | The structured set a room always needs (parking, support count, merch mechanics, curfew ack) — the advance's third generation source, must live as a venue-profile object on 16. |
| Scoped dep/sub advance-access grant | 18 | A filled dep needs a credential + limited advance view (call time, setlist, stage plot) firewalled from fees, contracts, other players' data. The sharpest 04↔18 intersection failure. → cross-cut §1d (pair-scoped/negative perms adjacent). |
| Cross-day operational cascade advisory | 18 | A computed advisory chaining a late load-out → driver-rest breach → infeasible leg → added travel day → unbudgeted per diems, spanning 18.07/18.11/18.12/18.13. |
| Dep/Sideman engagement agreement | 04/05 | The contract by which a band hires a dep/hired player for a specific show. 17.10.01's split references the dep's rate but the agreement is homeless — 04 and 05 both fit awkwardly. |
| Postponement as a first-class booking state | 17 | The date moves, the deal survives, tickets stay valid — post-2020 the dominant outcome; neither cancellation nor force majeure. Must move hold, contract, schedule and ticket manifest together. |
| Recurring / residency / open-cast no-money event | 17/03 | A recurring event with no deposit/settlement and an open cast fits neither 17's one-off booking model nor 03's community model. A real domain-map gap. |
| Door-scan record as chargeback evidence | 19 | Ticketing must persist the check-in scan as durable, queryable chargeback-representment evidence at scan time. → cross-cut §1d (Evidence-at-Source). |
| Extra-durable hold/deposit event capture | 17 | Live-booking hold + deposit events captured with elevated durability — the ONLY evidence for no-show/deposit-chargeback disputes (no delivery signature exists). → cross-cut §1d. |
| Structured accessible-provision room configuration | 16 | Typed accessible positions, companion entitlement, access-route and facility metadata as first-class room data, not free text — the accessible-seating feature's source data and the door's companion-to-position link. (CX-15) |
| Per-configuration licensed capacity | 16 | Licensed capacity per room configuration (standing 350 / seated 220), not a single per-room number — a safety/licensing constraint 19.01.04's subtraction chain requires. |
| Structured licensed age restriction | 16 | The room's licensed age restriction as structured data feeding 19.04.04's door age/ID default — at risk of being modelled as free text. |
| Attendee-data recipient as a negotiable deal term | 17 | Who receives consented attendee data is increasingly negotiated by artists; if so it flows from the 17 deal rather than being configured at the box office — a deal-term field 17 does not name. |
| Board-derived price-signal surface (going rate) | 22 | Publishing the local going rate (e.g. the London dep rate) as an aggregate emitted by the honest-compensation gate — an unavoidable emergent property. |
| Cross-domain handoff & consolidation telemetry | 22 | Handoff-failure rate across domains — the one metric telling the owner whether the 24 domains are genuinely connected or 24 products sharing a login (the D-18 consolidation bet). 22 measures external market data, not internal flow. |
| Operator venue-operations analytics | 22 | No-show rate, cancellation-by-lead-time distribution, overrun frequency — Operator BI generated as exhaust; the Operator's second substantive analytics touchpoint (today only audience catchment). |
| Public credit-graph aggregate statistics / leaderboards | 22/02 | "Most-credited drummers of 2026", trend counts, scene leaderboards over the credit graph, with mandatory non-participant embargo exclusions. Distinct from 22.08's private rollup and 02's per-credit visibility. |
| Curator / gatekeeper inbox & preferences | 21 | Curators, journalists, radio programmers, DSP editors are the population the domain reaches, yet none of the four personas is a gatekeeper. An on-platform curator inbox with accepted-genre/opt-out self-management makes the domain two-sided. |
| Operator release-independent promo tooling + local-press CRM | 21 | A venue marketing recurring club nights on its own calendar, with its own local-press contact book, fits neither 21.03 (release-cycle) nor cleanly 21.08 (event/announce). |
| Save-the-venue fan campaign | 20/21 | 16.01.05 emits an at-risk-venue signal + follow surface but no feature covers a fan-organised save-the-venue crowdfund/campaign consuming it. |
| Cross-entity gig-alert deduplication | 20 | A multi-hyphenate human's several artist entities can each fire a duplicate alert to the same fan; no feature de-duplicates across a follower's overlapping followed entities. |
| Unified payee/settlement statement | 23 | A single statement a producer/payee reads across royalties (10), D2F payouts (20.04.04) and MRR — the evidence twice asks to unify inward-reconciled and outward-paid money flows. |
| Formula / contingent receivable | 23 | A receivable whose amount is a **formula** not a number (door split: "50% of the door", unknown until 17 settles). 23.03 models no unknown-amount/formula-shaped receivables, yet they must be forecastable. |

---

## 3. Boundary Analysis & D-17 Verdict

**D-17** = the standing question of whether the 24-domain split over-counts (some domains should merge).
The 101 boundary problems were classified into: (a) **clean/defended seams** cited as counter-evidence *for*
the split; (b) **tooling mis-tags** (parse collisions between decision-IDs and domain numbers); (c) **unowned
coordination seams / gaps** whose fix is *extract a shared mechanism* (Section 1), not merge domains; (d)
**genuine merge / shared-owner candidates**.

### Verdict

**The 24-domain split is fundamentally sound. The 101 boundary problems are overwhelmingly SEAM-WORK, not
merge signal.** The heavy interaction between near-mirror domains — the money cluster (09/10/11/12), the show
cluster (16/17/18/19), the gear cluster (13/14/15), the credit/session cluster (02/07/08/09) — is *expected and
healthy* precisely where a shared **mechanism** is extracted to own the straddling capability. The recurring
phrase across the evidence is that these are "cross-cutting mechanisms mis-modelled as domain-owned features"
(the split-capture moment, the opportunity board, the entitled-party delivery layer, the deal-terms evaluator,
the graded-attestation primitive, the event-brand entity). **The fix for ~85 of the 101 is mechanism extraction
per Section 1 — not domain merger.** Several entries are explicit clean-seam counter-examples (02↔09 credit≠share,
16↔17 terms-vs-deal, 16↔18 registry-vs-ad-hoc, 21↔20 strangers-vs-fans, 08's outward 05/02 boundaries), and two
are pure tooling artifacts (a "[D13]" that means Safeguarding decision D-13 not domain 13; a "toDomain 15" that
means transport decision D-15 not Gear Registry). The 24↔13/15 and 24↔* high edge counts are the healthy hub
pattern of a pure cross-cut consumer, arguing *for* the split.

### Classification summary

| Class | Approx count | Representative entries | Resolution |
|---|---|---|---|
| Clean / defended seams (evidence FOR split) | ~10 | B23, B26, B34, B45, B63, B79 | None — leave as-is |
| Tooling mis-tags (not real seams) | 2 | B2 (Safeguarding D-13), B27 (transport D-15) | Suppress spurious rows in assembler |
| Unowned coordination seams / cross-cut mis-modelled as feature | ~65 | B3, B20, B22, B31, B39, B46, B52, B64, B76, B85, B91, B94 | **Extract Section-1 mechanism** |
| Genuine merge / shared-owner candidates | ~8 | B24, B41/B56, B65, B70, B88, B3, B42, B50 | See below |

### Genuine merge candidates (few)

| Pair | Nature | Recommendation |
|---|---|---|
| **08 Real-Time Jamming ↔ 07 Music Projects** | **The single strongest over-count candidate.** If Overdub Mode is where the value is, and Overdub's machinery (local-first capture, alignment, provenance, pre-flight) could live in 07, domain 08 may be a rump of infrastructure-blocked live-room features. Dissolution was rejected only **narrowly** (08.07 DT-03); the 07–08 asset edge is the busiest, bidirectional edge in the domain — exactly what an incoherent boundary looks like. (B24) | **Real merge candidate — escalate to `/create-prd` for an explicit keep-or-fold decision.** If kept, 08 must own a defensible live-transport surface that 07 cannot absorb. |
| **17 Live Booking ↔ 18 Show Production** | The **tour object**: an agent routes a tour while booking it (holds in 17); a TM runs the same dates after confirmation (18). Same entity, two owners — "the domain's biggest unresolved boundary" (B70). Compounded by the "buyout" naming collision (B71). | **Shared-owner, not merge:** a single tour-container entity with two lifecycle lenses (pre-confirmation routing = 17, post-confirmation operations = 18). Namespace "buyout" across the seam. |
| **17 Live Booking ↔ 19 Ticketing** | Settlement cannot be trustworthy without 19's count, the count IS 19's, and the index itself flags folding 19 in ("commerce vs operations of a show"). (B65/B80) | **Shared-owner, not merge:** 19 remains the authoritative count-owner; the deal (17) *reads* the count through one contract ("one question not five"). Keep split but bind the count dependency explicitly on the map. |
| **13 Gear Marketplace ↔ 15 Gear Registry** | Strongest boundary tension by edge count (31); many whole features straddle (stolen-serial screening, ownership-transfer-on-settlement, condition-history-across-owners, unit-record-at-publish) and a live contradiction on transfer timing (delivered vs settled). D-05 deliberately splits event/record. (B41/B56) | **Not a merge — name a shared "unit" owner.** Extract the serial-keyed unit + Read-Through Room-Binding Join (§1g) and First-Party Condition Record (§1d) as the shared spine; keep 13 (process) and 15 (record) distinct per D-08. |
| **14 Digital Goods ↔ 20 Fanbase** | "A presentation split masquerading as a domain boundary" — same entitlement/delivery/waiver/refund floor; 20 is "14's machinery with ~90% of columns removed." (B54/B88) | **Not a merge — extract the delivery cross-cut** (§1c Entitled-Party Media Delivery Layer). 14 owns machinery/rule, 20 owns surface/policy/tone. |
| **04 Opportunities ↔ 05 Services** | "May be one domain with two entry anchors" — a brief-response and a service-proposal are near-identical, and a won Opportunity *creates* a Services engagement. (B3) | **Not a merge — extract the shared spec-work-gate + response-triage + close-out mechanism** (§1e), owned by neither. Keep the two demand/supply anchors. |
| **13.10 Gear Rental** (intra-13) | Rental's order/comp/ownership/condition models are irreconcilable with sale's; it overlaps 16 and 18. Domain Q-07 asks to promote it out. (B42) | **Sub-domain relocation candidate, not a domain merge** — decide at `/decompose-architecture` whether rental is 13, 16, or its own shard. |
| **14.05 Beat Licensing** (relocation) | The objects are rights, not files; "a cross-cut plus a cross-cut does not make a domain." Beat licensing may belong in 11/09, not 14. (B50/B51) | **Sub-domain relocation, not a domain merge** — route beat licensing's rights grammar to 11; keep only cart/player (themselves cross-cuts). |

**Bottom line for D-17:** keep 24 domains. Commission the Section-1 mechanism extractions in `/create-prd`
(especially the Money & Exploitation schema layer, the Split-Capture/session-close moment, the Entitled-Party
Delivery Layer, the Graded-Attestation primitive, and the Outbound Deliverability Commons). Carry **one** genuine
domain-merge decision forward — **07/08 (Overdub)** — and four shared-owner/relocation decisions (17/18 tour
container, 17/19 count binding, 13/15 unit owner, 14.05 & 13.10 relocation) as explicit ratification items.

**Open-decision governance — 07/08 (Overdub).** The **Owner** is User; the hard decision deadline is
immediately before `/create-prd` begins; and the decision blocks whether domain 08 remains a separate
vision domain or folds into domain 07. The four shared-owner and relocation items above are architecture
ratification work for the named downstream stages; they do not reopen the 24-domain decision.


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-17|D-17]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-09|D-09]]
- [[decisions.md#d-15|D-15]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-13|D-13]]
- [[decisions.md#d-21|D-21]]
- [[decisions.md#d-20|D-20]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-08|D-08]]
