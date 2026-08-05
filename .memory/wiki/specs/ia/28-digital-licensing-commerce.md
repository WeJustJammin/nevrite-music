# Shard 28 — Digital licensing, commerce, revocation and revenue

**Status:** Complete
**Surface:** Web/PWA, transactional digital commerce and contributor accrual
**Source:** [Architecture design](../2026-08-02-architecture-design.md) · [Decomposition plan](decomposition-plan.md)

## Overview

Shard 28 owns digital purchase/lease offers, withdrawal consent, refunds, entitlement state effects, licence transfer policy, promotions and contributor accrual. It consumes product, terms, entitlement and artifact versions from [[specs/ia/27-digital-catalog-delivery|Shard 27]], rights/split authority from [[specs/ia/10-rights-ownership|Shard 10]], and shared payment/payout rails without inventing a second ledger.

### Scope Reconciliation

| Item | Result |
|---|---|
| In-scope source documents | 28 |
| Child capabilities | 18 |
| Consumer-launch monetisation | Perpetual one-time purchases, beat lease tiers, single-vendor promotions/bundles |
| Launch exclusions | Platform subscriptions/credits, rent-to-own, used-licence transfer, loyalty currency and dealer software bundles |
| Rights lifecycle | Tier terms, exclusive sale, caps/expiry evidence, withdrawal consent, refund and future-use revocation |
| Contributor money | Domain-10 split authority, per-asset accrual, period statements and counsel-gated external disbursement |

### Commerce Decisions

| Area | Locked decision |
|---|---|
| Launch model | Perpetual products and beat leases only. Subscription credits and rent-to-own remain disabled because they add stored-value/credit regulation and reproduce subscription pain. |
| Beat tiers | Every tier is a structured Shard-27 terms version with plain-language caps/obligations and explicit non-exclusivity. Paid tiers deliver untagged masters. |
| Exclusivity | Exclusive purchase, product delist, existing-lease disclosure/resolution and Shard-10 rights transfer commit atomically or compensate visibly. |
| Lease monitoring | Tracked/self-reported/unknown consumption is evidence and notification only; platform never auto-enforces caps or expiry. |
| Withdrawal consent | First delivery requires an unticked, entitlement-scoped affirmative waiver where applicable; no record means no delivery grant. |
| Refund policy | Pre-delivery cancellation is instant. Post-delivery: statutory rights always apply; false compatibility/conformity promises refund; discretionary change-of-mind does not after valid waiver/delivery. |
| Refund consequences | Buyer outcome is independent from vendor/platform recovery. Refund revokes future delivery/use entitlement but preserves evidenced past release clearance. |
| Exclusive refunds | No automated post-transfer refund. Any rescission requires counsel-reviewed rights reversal and explicit compensation; ordinary refund machinery cannot resurrect exclusivity. |
| Used transfer | Disabled at launch pending territorial exhaustion law, vendor APIs and atomic deactivation proof. Policy failure always fails closed. |
| Hardware bundle | Future transferable licence leg settles after the physical inspection window, not payment/delivery, and only when buyer eligibility still passes. |
| Promotions | Single-vendor bundles/sales allowed with price allocation and ownership-aware adjustment. Multi-vendor bundles require an approved split before sale. |
| Contributor splits | Domain 10 owns contributor shares/consent. This shard allocates per-asset commerce accrual and holds unresolved shares without forfeiture. |
| Payout gate | Accrual/statements may operate; multi-payee external disbursement remains behind the approved B3 counsel/provider gate. |
| Cent rounding | Consumes Shard 18 `RoundPayableAggregate`; this shard never authors a second rounding rule. Accrual arithmetic is exact decimal at >=9 dp and never rounds line-by-line. Rounding happens once, at the payable boundary — the contributor period close — on the per-payee period aggregate, by largest remainder, so the sum of rounded payee figures equals the rounded period total exactly. Ties break on the Shard-10 ledger row key `(pool, party-id, role, contribution-basis)`, comparing `party-id` as unsigned UTF-8 bytes per DEC-011; list order, insertion/retrieval order and `entered-by` are prohibited inputs. The residue is always allocated to a named payee and is never platform float, revenue or a rounding sink. |

## Features

- **14.05 Beat & Instrumental Licensing** — [ideation source](../ideation/14-digital-goods-marketplace/14.05-beat-instrumental-licensing/14.05-beat-instrumental-licensing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **14.06 Used Licence Transfer & Resale** — [ideation source](../ideation/14-digital-goods-marketplace/14.06-used-licence-transfer/14.06-used-licence-transfer-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **14.07 Monetisation Models & Pricing** — [ideation source](../ideation/14-digital-goods-marketplace/14.07-monetisation-models-pricing/14.07-monetisation-models-pricing-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **14.09 Digital Refunds, Withdrawal & Revocation** — [ideation source](../ideation/14-digital-goods-marketplace/14.09-digital-refunds-revocation/14.09-digital-refunds-revocation-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.
- **14.10 Contributor Revenue & Per-Download Royalty Pool** — [ideation source](../ideation/14-digital-goods-marketplace/14.10-contributor-revenue-royalty-pool/14.10-contributor-revenue-royalty-pool-index.md); represented in the normative interactions, contracts, data model, access rules and edge cases below.

## Acceptance Criteria

- **AC-28.01 — Select perpetual product/tier:** Given Product/version/terms sellable; holder selected, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Select perpetual product/tier, and (6) return Cart pins price, terms, holder and version range; if the flow cannot complete, Terms change breaks consent even while price hold remains.
- **AC-28.02 — Select beat lease:** Given Tier terms active, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Select beat lease, and (6) return Plain caps, obligations, non-exclusive status and delivered artifact scope appear at buy button; if the flow cannot complete, Missing/unknown terms fail closed.
- **AC-28.03 — Purchase exclusive beat rights:** Given No competing exclusive commit; live leases disclosed, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Purchase exclusive beat rights, and (6) return Funds, delist, lease facts and rights transfer commit/compensate atomically; if the flow cannot complete, Any leg failure rolls back or enters explicit compensation hold.
- **AC-28.04 — Serve tagged beat preview:** Given Public beat active, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Serve tagged beat preview, and (6) return Full approved preview contains audible source tag under density policy; if the flow cannot complete, Untagged public preview blocked; tag is separate from forensic watermark.
- **AC-28.05 — Track lease cap/expiry:** Given Entitlement/usage evidence exists, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Track lease cap/expiry, and (6) return Tracked/self-reported/unknown state and reminders append; if the flow cannot complete, No takedown, auto-revocation or vendor mutation.
- **AC-28.06 — Capture withdrawal waiver:** Given Buyer/holder eligible and first delivery requested, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Capture withdrawal waiver, and (6) return Frozen localized wording and affirmative act commit before grant/bytes; if the flow cannot complete, Decline preserves purchase and states withdrawal-window date; no URL.
- **AC-28.07 — Cancel before delivery:** Given No completed first delivery/waiver effect requiring adjudication, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Cancel before delivery, and (6) return Immediate original-method cancellation/refund, no case; if the flow cannot complete, Entitlement returns inactive with evidence retained.
- **AC-28.08 — Request digital refund:** Given Entitlement/order and evidence available, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Request digital refund, and (6) return Automatic or human path states SLA, reason/outcome/cause and appeal; if the flow cannot complete, Refusal cites exact snapshot; statutory floor never fraud-suspended.
- **AC-28.09 — Apply approved refund:** Given Refund outcome final, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply approved refund, and (6) return Original charged currency/instrument refund commits independently from clawback; if the flow cannot complete, Vendor recovery failure never becomes buyer debt.
- **AC-28.10 — Revoke future entitlement use:** Given Refund/chargeback/approved trigger, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Revoke future entitlement use, and (6) return Delivery stops, row tombstones with reason/appeal, annotations persist; if the flow cannot complete, Machine/file recovery best-effort only; never reported complete.
- **AC-28.11 — Preserve past clearance:** Given Refunded asset already evidenced in released work, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Preserve past clearance, and (6) return Prior lawful release use remains evidenced; future placement/use disallowed; if the flow cannot complete, Ambiguous rights route counsel/dispute, not silent un-clear.
- **AC-28.12 — Evaluate used-licence transfer:** Given Future gate enabled; territory/vendor policy/current entitlement valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Evaluate used-licence transfer, and (6) return Existing entitlement holder changes atomically with funds/deactivation/vendor fee; if the flow cannot complete, Unknown policy/law/provider state blocks and refunds escrow.
- **AC-28.13 — Transfer bundled software:** Given Physical order inspection closes and buyer vendor-account eligibility passes, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Transfer bundled software, and (6) return Licence leg transfers separately and order records result; if the flow cannot complete, Hardware return before settlement leaves licence with seller.
- **AC-28.14 — Create promotion/bundle:** Given Vendor controls products; allocation/policies valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Create promotion/bundle, and (6) return Ownership-aware cart price and per-item consideration pin; if the flow cannot complete, Ownership lookup failure holds cart; no duplicate charge.
- **AC-28.15 — Apply upgrade/crossgrade:** Given Base entitlement/proof valid, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Apply upgrade/crossgrade, and (6) return Upgrade extends version range in place; price basis/evidence pins; if the flow cannot complete, External ownership unknown shows full price; no honor-system discount.
- **AC-28.16 — Propose contributor splits/use:** Given Vendor submission names parties and Shard-10 agreement, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Propose contributor splits/use, and (6) return Each contributor separately consents to use and shares; if the flow cannot complete, Use refusal blocks publish; split disagreement holds only unresolved money.
- **AC-28.17 — Accrue contributor revenue:** Given Eligible paid acquisition/download and split version exist, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Accrue contributor revenue, and (6) return Per-asset accrual dedupes buyer/asset, allocates period shares and reconciles; if the flow cannot complete, Self-purchase/refund/chargeback reverses or excludes under pinned rule.
- **AC-28.18 — Close contributor period:** Given Period/rate/split versions frozen, when the actor invokes this flow, then the system MUST (1) validate inputs, (2) authenticate and resolve acting context, (3) authorize, (4) enforce revision and idempotency, (5) Close contributor period, and (6) return Evidentiary statement reconciles to penny; agreed shares payable/held under gate; if the flow cannot complete, Unresolved/departed shares remain non-forfeitable held funds.

## Interactions

| ID | Interaction | Preconditions | Success | Failure / recovery |
|---|---|---|---|---|
| 28.01 | Select perpetual product/tier | Product/version/terms sellable; holder selected | Cart pins price, terms, holder and version range | Terms change breaks consent even while price hold remains |
| 28.02 | Select beat lease | Tier terms active | Plain caps, obligations, non-exclusive status and delivered artifact scope appear at buy button | Missing/unknown terms fail closed |
| 28.03 | Purchase exclusive beat rights | No competing exclusive commit; live leases disclosed | Funds, delist, lease facts and rights transfer commit/compensate atomically | Any leg failure rolls back or enters explicit compensation hold |
| 28.04 | Serve tagged beat preview | Public beat active | Full approved preview contains audible source tag under density policy | Untagged public preview blocked; tag is separate from forensic watermark |
| 28.05 | Track lease cap/expiry | Entitlement/usage evidence exists | Tracked/self-reported/unknown state and reminders append | No takedown, auto-revocation or vendor mutation |
| 28.06 | Capture withdrawal waiver | Buyer/holder eligible and first delivery requested | Frozen localized wording and affirmative act commit before grant/bytes | Decline preserves purchase and states withdrawal-window date; no URL |
| 28.07 | Cancel before delivery | No completed first delivery/waiver effect requiring adjudication | Immediate original-method cancellation/refund, no case | Entitlement returns inactive with evidence retained |
| 28.08 | Request digital refund | Entitlement/order and evidence available | Automatic or human path states SLA, reason/outcome/cause and appeal | Refusal cites exact snapshot; statutory floor never fraud-suspended |
| 28.09 | Apply approved refund | Refund outcome final | Original charged currency/instrument refund commits independently from clawback | Vendor recovery failure never becomes buyer debt |
| 28.10 | Revoke future entitlement use | Refund/chargeback/approved trigger | Delivery stops, row tombstones with reason/appeal, annotations persist | Machine/file recovery best-effort only; never reported complete |
| 28.11 | Preserve past clearance | Refunded asset already evidenced in released work | Prior lawful release use remains evidenced; future placement/use disallowed | Ambiguous rights route counsel/dispute, not silent un-clear |
| 28.12 | Evaluate used-licence transfer | Future gate enabled; territory/vendor policy/current entitlement valid | Existing entitlement holder changes atomically with funds/deactivation/vendor fee | Unknown policy/law/provider state blocks and refunds escrow |
| 28.13 | Transfer bundled software | Physical order inspection closes and buyer vendor-account eligibility passes | Licence leg transfers separately and order records result | Hardware return before settlement leaves licence with seller |
| 28.14 | Create promotion/bundle | Vendor controls products; allocation/policies valid | Ownership-aware cart price and per-item consideration pin | Ownership lookup failure holds cart; no duplicate charge |
| 28.15 | Apply upgrade/crossgrade | Base entitlement/proof valid | Upgrade extends version range in place; price basis/evidence pins | External ownership unknown shows full price; no honor-system discount |
| 28.16 | Propose contributor splits/use | Vendor submission names parties and Shard-10 agreement | Each contributor separately consents to use and shares | Use refusal blocks publish; split disagreement holds only unresolved money |
| 28.17 | Accrue contributor revenue | Eligible paid acquisition/download and split version exist | Per-asset accrual dedupes buyer/asset, allocates period shares and reconciles | Self-purchase/refund/chargeback reverses or excludes under pinned rule |
| 28.18 | Close contributor period | Period/rate/split versions frozen | Evidentiary statement reconciles to penny; agreed shares payable/held under gate | Unresolved/departed shares remain non-forfeitable held funds |

## Contracts

### Command Contracts

| Command | Required input | Invariants |
|---|---|---|
| `CommitDigitalPurchase` | buyer/holder, product/tier, listing/price/terms/artifact versions, payment proof | Entitlement issuance and paid order idempotent; no stale terms consent |
| `CommitExclusivePurchase` | beat, exclusive terms, lease count, rights instrument, payment, expected versions | Rights/delist/commerce atomic or compensated; prior leases not silently revoked |
| `CaptureDeliveryWaiver` | entitlement, buyer act, full wording/version/locale, eligibility basis | Unticked explicit act; causal predecessor to transfer grant |
| `DecideDigitalRefund` | entitlement/order snapshot, reason/evidence, policy version, adjudicator | Evidence first, policy second; outcome/reason/cause/appeal mandatory |
| `ApplyRefundAndRevocation` | approved decision, money/revocation/idempotency refs | Refund independent of clawback; first revocation trigger authoritative |
| `ExecuteLicenceTransfer` | entitlement, parties, territory/policy/provider proof, escrow | Same record changes holder; funds/deactivation/writing atomic |
| `SavePromotion` | vendor products, allocations, eligibility, effective window | Multi-vendor requires accepted split; existing owners not double-charged |
| `AccrueDigitalRevenue` | acquisition/download asset, consideration allocation, split/rate/period versions | Asset is accrual unit; re-download deduped; immutable ledger |
| `CloseContributorPeriod` | period, frozen rate/splits, accrual set, gate status | Forward-only split edits; statement totals equal ledger; exactly one rounding pass over per-payee period aggregates per Shard 18 `RoundPayableAggregate`; a non-zero difference between the sum of per-payee payable figures and the rounded period total blocks the close and is never absorbed |

### Cross-Domain Contracts

- Shard 27 is authoritative for product/terms/entitlement/artifact facts and delivery enforcement.
- Shard 10 owns contributor shares, rights transfer and clearance evidence; this shard never authors parallel split percentages.
- Shared payment rail owns capture/refund/escrow/payout; this shard owns digital eligibility and allocation.
- Release flows consume structured terms and preserved-past/future-revoked disposition without inferring from refund alone.
- Jurisdiction/seller-capacity policy is counsel-authored, versioned and required before consumer activation.
- [[specs/ia/18-royalty-accounting|Shard 18]] owns the platform's cent remainder policy (`RoundPayableAggregate`). This shard consumes that rule for contributor accrual and period close and never defines its own rounding direction, boundary or tie key.

## Data Models

| Model | Required fields | Rules |
|---|---|---|
| `DigitalOfferSnapshot` | product/tier, vendor, buyer/holder, price/currency, terms/artifact/version range, policy | Buyer decision record; terms change invalidates consent |
| `BeatLeaseTier` | terms version, artifacts, price, caps, obligations, exclusive flag | Uses Shard-27 vocabulary only; non-exclusive explicit |
| `ExclusivePurchaseSaga` | commerce/right/delist steps, lease disclosure, state/compensation | No silent partial completion |
| `UsageEvidence` | entitlement, metric, value, source class, observed time/version | Classes tracked/self_reported/unknown; notification only |
| `WithdrawalWaiver` | entitlement, wording/version/locale, actor/time, exemption/basis, confirmation receipt | Delivery causal gate; retained under legal policy |
| `DigitalRefundCase` | order/entitlement, snapshot, reason, evidence, path/SLA, outcome/reason/cause, appeal | Pre-delivery cancellation is not a case |
| `RevocationTrigger` | entitlement, refund/chargeback/blacklist source, effective time, appeal, version | First trigger authoritative; later triggers historical |
| `TransferPolicyDecision` | entitlement/product, territory, vendor policy, legal/provider versions, result | Unknown fails closed |
| `PromotionAllocation` | promotion, product consideration values, ownership adjustment, split refs | Every acquired item has deterministic consideration recorded as the entitlement's allocated price in the transaction currency; any minor-unit residue from apportioning one consideration across N items is allocated by largest remainder on the same stable tie key |
| `ContributorAccrual` | asset/acquisition, period, gross/net basis, rate, split, payee, amount, reversal | Append-only and penny-reconcilable; `amount` is exact decimal at >=9 dp and is never a rounded minor-unit value |
| `HeldContributorFunds` | payee/split, source accruals, amount/currency, reason, claim path | Never forfeited/redistributed by timeout/erasure |

### Typed Field and Cardinality Registry

Field typing is deterministic: `*_id: uuid`, `*_at: timestamptz`, `*_date: date`, `*_minor: bigint`, `*_count: integer`, `currency: char(3)`, `is_*|has_*: boolean`, `state|status|type|kind|class: closed enum`, `version: bigint`, ratios `numeric(9,6)`, checksums `text`, and URLs `text`. Every named contract field uses this registry unless its contract declares a stricter type.

- **`DigitalOfferSnapshot`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: product/tier, vendor, buyer/holder, price/currency, terms/artifact/version range, policy | Buyer decision record; terms change invalidates consent.
- **`BeatLeaseTier`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: terms version, artifacts, price, caps, obligations, exclusive flag | Uses Shard-27 vocabulary only; non-exclusive explicit.
- **`ExclusivePurchaseSaga`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: commerce/right/delist steps, lease disclosure, state/compensation | No silent partial completion.
- **`UsageEvidence`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: entitlement, metric, value, source class, observed time/version | Classes tracked/self_reported/unknown; notification only.
- **`WithdrawalWaiver`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: entitlement, wording/version/locale, actor/time, exemption/basis, confirmation receipt | Delivery causal gate; retained under legal policy.
- **`DigitalRefundCase`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: order/entitlement, snapshot, reason, evidence, path/SLA, outcome/reason/cause, appeal | Pre-delivery cancellation is not a case.
- **`RevocationTrigger`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: entitlement, refund/chargeback/blacklist source, effective time, appeal, version | First trigger authoritative; later triggers historical.
- **`TransferPolicyDecision`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: entitlement/product, territory, vendor policy, legal/provider versions, result | Unknown fails closed.
- **`PromotionAllocation`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: promotion, product consideration values, ownership adjustment, split refs | Every acquired item has deterministic consideration recorded as the entitlement's allocated price in the transaction currency; any minor-unit residue from apportioning one consideration across N items is allocated by largest remainder on the same stable tie key.
- **`ContributorAccrual`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: asset/acquisition, period, gross/net basis, rate, split, payee, amount, reversal | Append-only and penny-reconcilable; `amount` is exact decimal at >=9 dp and is never a rounded minor-unit value.
- **`HeldContributorFunds`:** required core fields `id: uuid`, `owner_id: uuid`, `state: closed enum`, `version: bigint`, `created_at: timestamptz`, `updated_at: timestamptz`; domain fields are the named keys in Contracts and the model row above using the deterministic registry; cardinality is N:1 to its owner/aggregate and 1:N to additive events, revisions or evidence unless the row declares uniqueness. Constraints/relationships: payee/split, source accruals, amount/currency, reason, claim path | Never forfeited/redistributed by timeout/erasure.

## Access Control

| Capability | Buyer/holder | Vendor | Contributor | Adjudicator/finance | System |
|---|---:|---:|---:|---:|---:|
| Purchase/select holder | controlled party | self-purchase flagged | no | no | eligibility |
| View/use own licence | controlled holder | no buyer identity | own held entitlement | case-bound | enforce |
| Change bound lease | no | no | no | counsel/dispute only | immutable |
| Request refund/appeal | own order | evidence response, no buyer free text/identity | no | decide scoped | execute |
| Request licence transfer | current holder | policy only | no | future case | atomic gate |
| Propose product split | no | vendor/binding org authority | confirm own row/use | no | validate |
| View accrual/statement | no | vendor aggregate | own rows | reconcile/payout | ledger |

- Vendors never directly revoke, blacklist, expose holder identity or rewrite a bound terms/split version.
- Refund reviewers see minimum case evidence; vendor receives structured reason/cause, not buyer identity/free text.
- Contributor rows survive departure/erasure under lawful pseudonymous payment retention.
- Admin policy changes are forward-only and cannot change closed offers, waiver proof, periods or statements.

### Access Escalation

- **Purchase/select holder:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **View/use own licence:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Change bound lease:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Request refund/appeal:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Request licence transfer:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **Propose product split:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.
- **View accrual/statement:** a denial returns a typed reason and preserves canonical state; authority or evidence disputes route to the scoped case/Trust & Safety path, support handles mechanical recovery through an expiring purpose grant, and counsel/capability/privacy hard gates have no role override.

## Accessibility

- Beat tier comparison exposes caps/obligations in semantic tables and plain language before purchase.
- Waiver control is one unticked checkbox with no bundled consent; decline path and date remain keyboard reachable.
- Refund forms state automatic/human path and SLA before submission and preserve evidence uploads.
- Revoked/expired/out-of-term states use text, reason and appeal link rather than color-only badges.
- Contributor statements provide accessible tables, derivation steps and downloadable machine-readable data.
- Promotion ownership adjustments show each product and reason; totals do not rely on crossed-out price alone.

## Event Schemas

| Event | Required payload | Consumers |
|---|---|---|
| `digital_commerce.purchase_completed.v1` | order/line, product/tier, buyer/holder, pinned versions, amount | entitlement, revenue |
| `digital_beat.exclusive_committed.v1` | beat, order, rights instrument, lease count, delist version | catalog, rights, notifications |
| `digital_lease.usage_changed.v1` | entitlement, metric/source/value, prior/new state, version | holder/vendor reports, reminders |
| `digital_waiver.captured.v1` | entitlement, wording/version/locale, actor, capturedAt | delivery gate, legal evidence |
| `digital_refund.decided.v1` | case, outcome/reason/cause, policy, adjudicator, appeal deadline | refund, revocation, vendor report |
| `digital_entitlement.revocation_requested.v1` | entitlement, trigger, effectiveAt, case/version | Shard 27 delivery/library |
| `digital_clearance.disposition_changed.v1` | entitlement, past/future disposition, affected works, version | release/rights checks |
| `digital_transfer.completed.v1` | entitlement, prior/new holder, policy/territory/provider, settlement | library, vendor report |
| `digital_promotion.changed.v1` | promotion, product allocations, effective window, version | catalog/cart |
| `digital_contributor.accrued.v1` | accrual, asset/period/rate/split/payee, amount | statements, finance ledger |
| `digital_contributor.period_closed.v1` | period, rate/split versions, totals, gate state | statements, payout |
| `digital_contributor.funds_held.v1` | held record, payee, amount/reason, claim path | contributor, finance |

Events contain IDs/versions and money values only; no licence bytes, payment secrets or buyer free text.

## Edge Cases

| Case | Required outcome |
|---|---|
| Paid beat tier preview tag remains in delivery | Reject artifact mapping; paid tier delivers declared untagged master |
| Exclusive buyer races lease buyer | Exclusive transaction serializes; committed lease rights are disclosed/preserved per terms |
| Cap cannot be measured | Render unknown; notify without enforcement |
| Buyer declines waiver | No delivery; purchase remains until withdrawal window/cancellation choice |
| False “will run” verdict | Unconditional buyer refund against order snapshot, regardless of input cause |
| Refund after asset used in released work | Human review; genuine defect may refund; future use revoked, past evidenced clearance preserved |
| Exclusive rights refund requested | No automatic path; rights-rescission case only |
| Chargeback after file download | Revocation delivery effect immediate; local recovery best-effort; payment dispute allocates loss |
| Vendor transfer policy unavailable | Used transfer fails closed and escrow returns |
| Hardware returned after licence settled | Prevented by post-inspection settlement; later exceptional unwind is manual rights/provider case |
| Bundle includes already-owned product | Deduct allocated item price explicitly; ownership lookup failure holds cart |
| Contributor agrees split but not use | Publish blocked; money agreement cannot substitute rights consent |
| Split unresolved after period | Pay/disburse only where counsel/provider gate allows; unresolved share remains held, never redistributed |
| Contributor erased/departs | Pseudonymous split/accrual/held-funds record survives and claim path remains |
| Split produces an indivisible minor unit | Largest remainder on the stable tie key allocates the leftover minor unit to a named payee; it is never retained as platform float, revenue or a rounding sink |

## Dependency References

- Consumes product, terms, entitlement, artifact, QA and continuity state from Shard 27.
- Uses Shard 10 rights/splits and shared payment/ledger/payout infrastructure.
- Supplies refund/revocation/clearance dispositions back to library, delivery and release workflows.
- Subscription credits, rent-to-own and used transfers remain behind product, counsel and provider gates.
- Consumes the cent remainder policy from Shard 18; Domain 10 retains sole ownership of that policy (DEC-011).
- BLOCKED / not authored here: the apportionment basis for a single-vendor bundle — how one consideration is split across N items before the residue rule applies — is not determined by any source and is raised as a separate item citing ideation `14.02.01` DT-08 and `14.07.04` D-03. This shard states the residue rule only, never the basis.

## Edge-Case Coverage Matrix

| Flow | Concurrent access | Invalid input / authority | Deletion, revocation or cascade |
|---|---|---|---|
| 28.01 Select perpetual product/tier | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.02 Select beat lease | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.03 Purchase exclusive beat rights | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.04 Serve tagged beat preview | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.05 Track lease cap/expiry | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.06 Capture withdrawal waiver | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.07 Cancel before delivery | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.08 Request digital refund | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.09 Apply approved refund | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.10 Revoke future entitlement use | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.11 Preserve past clearance | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.12 Evaluate used-licence transfer | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.13 Transfer bundled software | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.14 Create promotion/bundle | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.15 Apply upgrade/crossgrade | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.16 Propose contributor splits/use | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.17 Accrue contributor revenue | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |
| 28.18 Close contributor period | Same idempotency key returns the same result; competing expected revisions serialize one winner and return typed conflict to the loser without duplicate effect. | Schema, authority and policy validation fail before mutation/provider effect and return a typed refusal without existence leakage. | Owner/source deletion or revocation preserves required immutable evidence/tombstone, removes derived access/projection, and queues idempotent dependent invalidation so no orphan remains. |

### Cross-Shard Section Contract Map

- **Shard 06:** consume [Shard 06 Contracts](06-trust-safety.md#contracts) into this shard `§ Contracts` — `OpenDispute` for chargeback and payment-dispute freezes, `CardTestingDefense`, whose rule that digital fulfilment never precedes settlement confirmation binds this shard's checkout, and `RiskSignal`/`ProtectAccount` for the fraud cause on a refund decision; publish this shard `§ Event Schemas` to [Shard 06 Event Schemas](06-trust-safety.md#event-schemas) — `digital_refund.decided.v1` and purchase/revocation state are the transaction facts `OpenDispute` freezes, and `safety.rail.blocked.v1` and `safety.dispute.changed.v1` already name commerce and payment adapters as consumers. Shard 06 owns case and evidence truth; this shard owns digital order, refund and revocation truth. Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 27:** consume [Shard 27 Contracts](27-digital-catalog-delivery.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 27 Event Schemas](27-digital-catalog-delivery.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 10:** consume [Shard 10 Contracts](10-rights-ownership.md#contracts) into this shard `§ Contracts`; publish this shard `§ Event Schemas` to [Shard 10 Event Schemas](10-rights-ownership.md#event-schemas). Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 18:** consume [Shard 18 Contracts](18-royalty-accounting.md#contracts) into this shard `§ Contracts`. Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.
- **Shard 41:** publish this shard `§ Contracts` — specifically `AccrueDigitalRevenue` and `CloseContributorPeriod` — to [Shard 41 Contracts](41-career-finance.md#contracts), and this shard `§ Event Schemas` (`digital_contributor.accrued.v1`, `digital_contributor.period_closed.v1`, `digital_contributor.funds_held.v1`) to [Shard 41 Event Schemas](41-career-finance.md#event-schemas). This shard owns digital eligibility, allocation and the contributor accrual ledger, and closes periods under the Shard 18 rounding rule; Shard 41 appends the closed-period amounts as `IncomeEventV1` rows for the holder and never re-allocates a split, re-rounds a period or reopens a close. Canonical ownership stays with the producer and typed failure/unknown states cross the same boundary.

## Changelog

- 2026-08-03: Initial complete interaction architecture authored from 28 source documents and 18 child capabilities.
- 2026-08-03: Locked perpetual/beat launch commerce, waiver-gated delivery, evidence-first refunds, future-use revocation and Shard-10-backed contributor accrual.
- 2026-08-05: A-17 applied by `/resolve-ambiguity` — cent rounding is consumed from Shard 18 `RoundPayableAggregate` (DEC-011 bytewise `party-id` tie key, largest remainder, one pass at period close) rather than authored here; `CloseContributorPeriod`, `PromotionAllocation`, `ContributorAccrual`, the registry mirrors, the edge cases, the dependency references and the cross-shard contract map updated to match.
- 2026-08-05: F2 — cross-shard contract reciprocity applied by `/resolve-ambiguity` — reciprocal `§ Cross-Shard Section Contract Map` bullets added for Shard 06 (trust & safety disputes, card-testing settlement rule and fraud-cause risk signals against this shard's checkout, refund and revocation facts) and Shard 41 (career finance ingests closed contributor-period amounts as `IncomeEventV1` without re-allocating splits, re-rounding periods or reopening closes).


<!-- spec-graph: auto-generated -->
## Related Specs

### Constrained by
- [[decisions.md#d-03|D-03]]

### References
- [[specs/ia/27-digital-catalog-delivery|Shard 27 — Digital catalog, entitlement, delivery and vendor QA]]
- [[specs/ia/10-rights-ownership|Shard 10 — Rights and ownership]]
- [[specs/ia/18-royalty-accounting|Shard 18 — Royalty registration, ingestion, calculation and payout]]
