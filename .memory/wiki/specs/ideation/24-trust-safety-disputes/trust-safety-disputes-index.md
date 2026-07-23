# Trust, Safety & Disputes — Index

> **Level**: domain
> **Parent**: [WeJammin Ideation Index](../ideation-index.md)
> **Status**: [BREADTH]
> **Last updated**: 2026-07-23
> **Novelty**: `industry-standard` | **Priority**: `core`

## Overview

Preventing and resolving harm — content moderation and notice-and-action, enforcement and appeals, fraud
and risk operations, transaction disputes and protection programs, copyright enforcement, personal safety,
identity abuse, and the duties the platform owes to a state rather than to a user.

**Why this is a top-level domain**: Not a cross-cut despite serving every domain: it has a dedicated
operator persona, its own destination surfaces (report flow, resolution centre, appeal, moderation queues)
and legally mandated machinery — DSA notice-and-action with statements of reasons and internal complaint
handling, UK OSA illegal-harms duties, and DMCA safe harbour conditional on a reasonably implemented
repeat-infringer policy (the exact failure that produced nine- and ten-figure verdicts in BMG v. Cox and
UMG v. Grande). That is the discriminator against the cross-cut classification: a mechanism does not have a
statutory duty with its own adjudication surface. Moderation, fraud and disputes are merged because all
three are adjudication with shared evidence, shared appeals and one operator shell; three engines is waste.
This platform combines money, strangers, in-person meetings, user-uploaded audio and a young user base —
under-resourcing here is how music platforms generate their worst headlines. Absorbed entity-ownership and
impersonation disputes stripped from Identity, which land cleanly on existing sub-domains.

**Interacting capabilities** (what justifies domain status):

- report intake & moderation queues
- enforcement ladder & appeals
- fraud/risk scoring & ring detection
- transaction disputes & mediation
- buyer/seller protection & chargebacks
- copyright & counterfeit enforcement

### What the breadth pass found (2026-07-16)

Three findings reshaped the domain and belong at the top of it:

1. **Enforcement must not be able to destroy property.** WeJammin holds *co-owned* rights records (D-10,
   D-18). Banning a bassist cannot void their 20% share, and a DELETE CASCADE on ban would destroy four
   other people's evidence. Sanctions act on **access and privileges, never on the record** — a constraint
   no other platform's Trust & Safety design has to carry, and one that must be settled at architecture
   time because it is a data-model property. See [24.02.01](./24.02-enforcement-appeals-policy/24.02.01-enforcement-ladder-sanctions.md) DT-01.

2. **The platform is the first intermediary with a positive competing record.** The DMCA's entire design
   assumes a blind host that must act on assertion. WeJammin holds the session record — who uploaded which
   stem, when, into whose project, counter-attested by whom. When a label bot claims a producer's own mix,
   the platform has contemporaneous first-party evidence to weigh against the claim. **This is the thesis
   (D-18) arriving in the least expected place**, and it recurs: it is also the anti-impersonation
   mechanism ([24.07.01](./24.07-identity-abuse-ownership-disputes/24.07.01-impersonation-fake-profile.md) DT-01),
   the anti-counterfeit mechanism ([24.05.03](./24.05-copyright-authenticity-enforcement/24.05.03-authenticity-counterfeit-brand-protection.md) DT-01),
   and the reason creative-service disputes are decidable at all ([24.04.01](./24.04-transaction-disputes-protection/24.04.01-claims-dispute-filing.md) DT-03).

3. **Three industry defaults all point at the platform's own core persona.** The trusted-flagger lane is
   label-only everywhere ([24.01.04](./24.01-reporting-moderation/24.01.04-trusted-flagger-priority-channel.md) DT-01);
   the 512(g) counter-notice makes a musician publish their home address and consent to federal
   jurisdiction to reclaim their own work ([24.05.01](./24.05-copyright-authenticity-enforcement/24.05.01-dmca-notice-counter-notice-repeat-infringer.md) DT-02);
   a 512(h) subpoena unmasks them ([24.08.03](./24.08-illegal-content-legal-process/24.08.03-law-enforcement-legal-process-portal.md) DT-03).
   **Inheriting the default is a decision even when made by not deciding**, and this domain is where the
   thesis stops being a slogan or becomes one.

## Children

> Classified 2026-07-16 by `/ideate-discover` Step 3. 29 candidates → **8 sub-domains, 36 features**,
> 3 cross-cuts routed out, 4 not-product halves stripped. All nodes `[SURFACE]`.

| # | Name | Type | Path | Status | Deep Think |
|---|------|------|------|--------|------------|
| 24.01 | Reporting, Moderation & Notice-and-Action | sub-domain | [24.01-reporting-moderation/](./24.01-reporting-moderation/24.01-reporting-moderation-index.md) | `[SURFACE]` | 15 hypotheses (5 features) |
| 24.02 | Enforcement, Appeals & Policy | sub-domain | [24.02-enforcement-appeals-policy/](./24.02-enforcement-appeals-policy/24.02-enforcement-appeals-policy-index.md) | `[SURFACE]` | 18 hypotheses (6 features) |
| 24.03 | Fraud & Risk Operations | sub-domain | [24.03-fraud-risk-operations/](./24.03-fraud-risk-operations/24.03-fraud-risk-operations-index.md) | `[SURFACE]` | 18 hypotheses (6 features) |
| 24.04 | Transaction Disputes & Protection | sub-domain | [24.04-transaction-disputes-protection/](./24.04-transaction-disputes-protection/24.04-transaction-disputes-protection-index.md) | `[SURFACE]` | 12 hypotheses (4 features) |
| 24.05 | Copyright & Authenticity Enforcement | sub-domain | [24.05-copyright-authenticity-enforcement/](./24.05-copyright-authenticity-enforcement/24.05-copyright-authenticity-enforcement-index.md) | `[SURFACE]` | 12 hypotheses (4 features) |
| 24.06 | Personal Safety & Threat Response | sub-domain | [24.06-personal-safety-threat-response/](./24.06-personal-safety-threat-response/24.06-personal-safety-threat-response-index.md) | `[SURFACE]` | 9 hypotheses (3 features) |
| 24.07 | Identity Abuse & Ownership Disputes | sub-domain | [24.07-identity-abuse-ownership-disputes/](./24.07-identity-abuse-ownership-disputes/24.07-identity-abuse-ownership-disputes-index.md) | `[SURFACE]` | 9 hypotheses (3 features) |
| 24.08 | Illegal Content & Legal Process | sub-domain | [24.08-illegal-content-legal-process/](./24.08-illegal-content-legal-process/24.08-illegal-content-legal-process-index.md) | `[SURFACE]` | 12 hypotheses (4 features) |
| 24.09 | Case Evidence Locker & Chain of Custody | feature | [24.09-case-evidence-locker.md](./24.09-case-evidence-locker.md) | `[SURFACE]` | 3 hypotheses |

> **Type column values:**
> - `sub-domain` — a grouping with 2+ interacting capabilities (folder with index + CX)
> - `feature` — a leaf node describing a single capability (.md file)
>
> **24.09 is a domain-level feature**, not a sub-domain child, because every adjudication sub-domain reads
> the same bundle. Three sub-domains derived its capture-at-source principle independently — see
> [24.09](./24.09-case-evidence-locker.md) DT-02.

## Role Matrix

> **Note on the missing actor — read this before using the matrix.** The primary actors in this domain are a
> **moderator, a risk analyst, a dispute agent, a law-enforcement officer and a regulator**. None of them is
> one of the four personas in `meta/personas.md`, and two are not users of the platform at all. Their
> absence from these columns is deliberate (personas are never invented) and it is the **evidence for
> `personas.md` Q-02**: three of the nine rows below are all-`❌`, which is not a gap in the analysis — it is
> the finding. **Q-02 must be resolved before `/write-be-spec`.**

| Child | Musician | Producer | Operator | Fan |
|-------|----------|----------|----------|-----|
| 24.01 Reporting & Moderation | ✅ Full — report anything | ✅ Full — report anything | ✅ Full — report anything | ✅ Full — report anything |
| 24.02 Enforcement, Appeals & Policy | ✅ Full — appeal own case | ✅ Full — appeal own case | ✅ Full — appeal own case | ✅ Full — appeal own case |
| 24.03 Fraud & Risk Operations | ❌ None | ❌ None | ❌ None | ❌ None |
| 24.04 Transaction Disputes & Protection | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 24.05 Copyright & Authenticity | ✅ Full | ✅ Full | ✅ Full | ✅ Full — 512(g) is statutory |
| 24.06 Personal Safety & Threat Response | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 24.07 Identity Abuse & Ownership Disputes | ✅ Full | ✅ Full | ✅ Full | 👁️ Read-only — owns no entity |
| 24.08 Illegal Content & Legal Process | ❌ None | ❌ None | ❌ None | ❌ None |
| 24.09 Case Evidence Locker | 👁️ Read-only — own case | 👁️ Read-only — own case | 👁️ Read-only — own case | 👁️ Read-only — own case |

> **Legend**: ✅ Full access · ⚙️ Configuration only · 👁️ Read-only · 📊 Reports only · ❌ No access
>
> Detailed per-role behaviour lives in each feature file's **Role Lens**. Three notes worth carrying:
> - **24.03 is all-`❌` by design** — exposing a risk score teaches an adversary the threshold. The four
>   personas experience fraud ops only as friction, always delivered via 24.02's sanctions with reasons.
> - **24.05 is `✅ Full` for Fan** because 512(g) counter-notice is a statutory right attaching to whoever
>   uploaded the material. Negligible volume does not reduce the obligation.
> - **24.07 is `👁️` for Fan** because a fan owns no band, label, studio or catalogue to dispute. That row is
>   the cleanest illustration of D-11's real consequence: fans are first-class users with a genuinely
>   thinner ontology, not thinner rights.

## Decision Log

| # | Decision | Context | Source |
|---|----------|---------|--------|
| D-01 | Established as a top-level domain | Not a cross-cut despite serving every domain: it has a dedicated operator persona, its own destination surfaces (report flow, resolution centre, appeal, moderation queues) and legally mandated machinery with its own adjudication surface. | 14-lens sweep + 3× adversarial verification; ratified by user 2026-07-16 (D-16) |
| D-02 | **Sub-domains are grouped by adjudication mode, not by harm type** | The 29 candidates were a list of harms. Harms do not group — machinery does. The line that emerged: **claim-driven** adjudication (a human asserts something with evidence → 24.01/24.02/24.04/24.05/24.07) vs **signal-driven** detection (nobody reports card testing → 24.03) vs **state-facing** duties (24.08) vs **person-harm** response (24.06). ATO and impersonation both touch identity and sit on opposite sides of that line, which is the test that proves it. | `/ideate-discover` Step 3 classification |
| D-03 | **Sanctions act on access and privileges — never on the ownership record** | The platform holds co-owned rights records (D-10, D-18). The hardest constraint in the domain, unique to a provenance platform, and a data-model property that cannot be retrofitted. The `Privacy` cross-cut reached the identical conclusion from the deletion side ("anonymise-and-retain, not DELETE CASCADE") independently. | `/ideate-discover` Deep Think — [24.02.01](./24.02-enforcement-appeals-policy/24.02.01-enforcement-ladder-sanctions.md) DT-01 |
| D-04 | **Two enforcement ladders in one engine**: general (proportionate, discretionary) and DMCA repeat-infringer (rigid, automatic, auditable) | Discretion is the virtue in one and the liability in the other. BMG v. Cox (~$1B) and UMG v. Grande ($46.7M) were lost by exercising judgment around a written policy — a policy you do not execute is worse than none, because it is evidence of knowledge. | `/ideate-discover` Deep Think — see [CX-05](./trust-safety-disputes-cx.md) |
| D-05 | **Statements of Reasons split from Transparency Reporting**; **Claims split from Mediation**; **Evidence Locker promoted to domain level** | The sweep merged things with different legal status (Art 17 has no micro/small carve-out; Art 15(2)/24 do) and different lifecycles. The locker serves six sub-domains, so it belongs one level up. | `/ideate-discover` Step 3 classification |
| D-06 | **Three cross-cuts routed out**: Block/Mute enforcement (new), Disintermediation detection (→ Messaging cross-cut), Operator console shell (→ Admin cross-cut) | Each is a mechanism serving many domains. Block/mute in particular must be enforced at every call site — structurally identical to the Roles & Permissions cross-cut — and building it inside the inbox produces a block that stops messages and not the ticket purchase. | `/ideate-discover` Step 3 classification |
| D-07 | **Three Deep Think additions**: Harassment/Stalking/Doxxing, Crisis & Welfare Escalation, Pre-Release Leak Detection, Deceased & Incapacitated Succession | The sweep had **no harassment feature at all** on a platform whose own persona doc names fan→artist harassment, and whose live domains broadcast musicians' physical locations by design. It also had no crisis lane, no leak forensics (despite two cross-cuts already implying one), and no succession path (in an industry whose economics are posthumous). | `/ideate-discover` Deep Think additions |

## Open Questions

| # | Question | Owner | Deferred To |
|---|----------|-------|-------------|
| Q-01 | ✅ **RESOLVED** — 29 candidates classified: 8 sub-domains, 36 features, 3 cross-cuts, 4 not-product halves. | Agent | `/ideate-discover` (done) |
| Q-02 | ✅ **RESOLVED** — three candidates were cross-cuts (D-06); recorded in [trust-safety-disputes-cx.md](./trust-safety-disputes-cx.md) and returned for the global CX file. | Agent | `/ideate-discover` (done) |
| Q-03 | **Admin/Moderator is not a persona** (`personas.md` Q-02) and this domain has *five* non-persona actors. Three of nine children have an all-`❌` Role Matrix row. **This domain cannot be specified until Q-02 is resolved.** | User | `/create-prd` |
| Q-04 | **MoSCoW here is a function of the beachhead** (`problem-statement.md` Q-03). Gear-marketplace fraud, chargebacks and CITES are irrelevant if gear does not launch; CSAM reporting and DMCA are not, because they bind from user one regardless. The domain cannot be prioritised before the beachhead is chosen. | User | MoSCoW / `/ideate-validate` |
| Q-05 | **Every DSA scale-gate reading in this domain is an agent's reading.** Art 16 (Section 2, no carve-out) vs Art 19 disapplying Section 3 for micro/small; Art 17 SoR vs Art 15(2) transparency. This reasoning moves four features between Must and Could and **must be confirmed by counsel**, not by an agent. | User + counsel | `/create-prd-security` |
| Q-06 | **`meta/constraints.md` describes no platform team — so the owner is the first moderator.** That makes reviewer wellbeing a business-continuity control ([24.01.03](./24.01-reporting-moderation/24.01.03-moderation-queue-reviewer-ops.md) DT-01), makes conflict-of-interest recusal structurally impossible (24.01.03 Q-02), and puts CSAM and crisis review on one unrotatable person. **This is a founder-welfare question, not only a staffing one.** It now also carries a **new, unbudgeted inbound load**: every contested evidence-based lift objection that survives inline platform re-verification becomes per-objection human adjudication under a *mandatory* resolution SLA (`02.01.05` D-21 → `02.05` D-07; SLA value deferred to `02.01.05` Q-06). See **Inbound Adjudication Load** in [trust-safety-disputes-cx.md](./trust-safety-disputes-cx.md). | User | `/ideate-validate` |
| Q-07 | Music adjudication needs **domain literacy** ("is that a sample or an interpolation?", "is that NSBM or Nordic folk?", "is that refinished?"). Skill-routed queues conflict with a small team, which may mean: only launch the domains whose queues you can staff. That makes the beachhead a Trust & Safety decision, not only a growth one. | User | `/ideate-validate` |


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-10|D-10]]
- [[decisions.md#d-18|D-18]]
- [[decisions.md#d-11|D-11]]
- [[decisions.md#d-01|D-01]]
- [[decisions.md#d-16|D-16]]
- [[decisions.md#d-02|D-02]]
- [[decisions.md#d-03|D-03]]
- [[decisions.md#d-04|D-04]]
- [[decisions.md#d-05|D-05]]
- [[decisions.md#d-06|D-06]]
- [[decisions.md#d-07|D-07]]
- [[decisions.md#d-21|D-21]]
