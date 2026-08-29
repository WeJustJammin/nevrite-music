# BE Spec 30c — Deal Documents, Payments, and Announcement Governance

> Source: [IA Shard 30](../ia/30-booking-contracts.md), interactions 30.14–30.19 and 30.28–30.34. This companion owns announcement authorization/readiness, immutable deal-document output, accepted-deal amendment versions, payment schedules/assertions, and scheduled announcement commit. It records payment evidence but never holds funds, initiates unapproved money movement, infers consent, or announces before every pinned precondition passes.

## Classification

| Dimension | Decision | Evidence |
|---|---|---|
| Scope | Deal documents, payment evidence/schedules, announce consent/group governance, Tier-2 waiver, schedule snapshot, and exactly-once announcement | IA Shard 30 `Interactions` lines 112–117 and 126–132; `Contracts` lines 147–152 |
| Canonical ownership | This companion owns the 14 announcement/document/payment aggregates listed below and their lifecycle events; accepted-offer history remains 30b and venue timer production remains Shard 35 | IA `Data Models` lines 193–206 and `Cross-Shard Dependencies` lines 439–449 |
| Explicit non-ownership | Avails/positions, offer negotiation, venue schedules/timers, settlement, and fan projections remain in 30a/30b, Shard 29, Shard 35, or downstream consumers | IA `Interactions` lines 96–111 and 112–132; approved BE index split |
| Split validity | PASS: 30.14–30.19 and 30.28–30.34 each have one operation owner and this is the sole route registry for BE30C-14..34 | approved BE index and IA `Interactions` lines 112–117, 126–132 |

### Umbrella Feature Trace

The IA Shard 30 feature bullets are represented across 30a–30e: 17.01 Availability, Holds & Confirmation; 17.02 Offers & Negotiation; 17.03 Deal Structures & Economics; 17.04 Performance Contracts & Deal Memos; 17.05 Deposits, Balances & Cancellation; 17.06 Radius Clause & Exclusivity Tracking; 17.07 Booking Enquiry Inbox & RFQ; 17.14 Bill Construction & Support Slot Offers.

## Referenced Material Inventory

| Source file | Section / lines | Material consumed |
|---|---|---|
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Acceptance Criteria` lines 70–93 | document, payment, consent, group, waiver, schedule, and announce acceptance obligations |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Interactions` lines 112–117, 126–132 | exact 30.14–30.19 and 30.28–30.34 preconditions, success, failure, and recovery |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Contracts` lines 147–152 | command inputs, gate/error vocabulary, payment evidence, membership, and callback boundaries |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Data Models` lines 193–206, 253–271 | announcement/document/payment models, typed fields, states, and cardinality |
| `.memory/wiki/specs/ia/30-booking-contracts.md` | `Event Schemas` lines 327–341 | announcement, group, waiver, document, and payment event payload/privacy |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Request/Response Contracts` lines 112–200; `Error Handling` lines 426–461 | Zod 4 wire conventions, global ApiError, and failure recovery |
| `.memory/wiki/specs/be/00-infrastructure.md` | `Middleware & Policies` lines 253–308; `Database Schema` lines 202–251 | CORS, auth, rate/body limits, RPC-only persistence, RLS, grants, audit, and outbox |

## IA Source Map

| IA interaction | Source trace | Backend operation | Canonical completion |
|---|---|---|---|
| 30.14 | IA `Interactions` line 112; `AC-30.14` | BE30C-14 | versioned active `AnnounceAuthorization` only after the full prerequisite manifest |
| 30.15 | IA `Interactions` line 113; `AC-30.15` | BE30C-15 | reproducible `DealDocument` bound to accepted digest/template |
| 30.16 | IA `Interactions` line 114; `AC-30.16` | BE30C-16 | append-only accepted-deal amendment with invalidated projections |
| 30.17 | IA `Interactions` line 115; `AC-30.17` | BE30C-17 | complete `PaymentSchedule` including deposit policy |
| 30.18 | IA `Interactions` line 116; `AC-30.18` | BE30C-18 | evidence-first `PaymentAssertion` reconciliation |
| 30.19 | IA `Interactions` line 117; `AC-30.19` | BE30C-19 | policy-pinned overdue action without automatic void |
| 30.28 | IA `Interactions` line 126; `AC-30.28` | BE30C-28 | immutable exact-deal-version `AnnounceConsent` |
| 30.29 | IA `Interactions` line 127; `AC-30.29` | BE30C-29 | versioned `AnnounceGroup` membership and readiness recompute |
| 30.30 | IA `Interactions` line 128; `AC-30.30` | BE30C-30 | privacy-safe `AnnounceGroupEjectionRequest` |
| 30.31 | IA `Interactions` line 129; `AC-30.31` | BE30C-31 | two-key `AnnouncePreconditionWaiver` for eligible Tier-2 condition |
| 30.32 | IA `Interactions` line 130; `AC-30.32` | BE30C-32 | versioned `AnnounceWaiveCapability` grant/revocation |
| 30.33 | IA `Interactions` line 131; `AC-30.33` | BE30C-33 | immutable `OnSaleScheduleSnapshot` |
| 30.34 | IA `Interactions` line 132; `AC-30.34` | BE30C-34 | exactly-once `AnnounceRecord` and lifecycle transition |

### Canonical model and event coverage

| IA canonical identifier | Owned or consumed here | Trace |
|---|---|---|
| `DepositAnnouncePolicy` | owned/consumed by BE30C-14/17/31 | IA `Data Models` line 193 |
| `OnSaleScheduleSnapshot` | owned by BE30C-33/34 | IA `Data Models` line 194 |
| `AnnounceAuthorization` | owned by BE30C-14 and consumed by 34 | IA `Data Models` line 195 |
| `AnnounceRecord` | owned by BE30C-34 | IA `Data Models` line 196 |
| `AnnounceConsent` | owned by BE30C-28 | IA `Data Models` line 197 |
| `AnnounceGroup` | owned by BE30C-29/30 | IA `Data Models` line 198 |
| `AnnounceGroupMembershipEvent` | emitted by BE30C-29 | IA `Data Models` line 199 |
| `AnnounceGroupEjectionRequest` | owned by BE30C-30 | IA `Data Models` line 200 |
| `AnnounceGroupReadinessProjection` | recomputed by BE30C-14/29/30/31 | IA `Data Models` line 201 |
| `AnnounceWaiveCapability` | owned by BE30C-32 and checked by 31 | IA `Data Models` line 202 |
| `AnnouncePreconditionWaiver` | owned by BE30C-31 | IA `Data Models` line 203 |
| `DealDocument` | owned by BE30C-15/16 | IA `Data Models` line 204 |
| `PaymentSchedule` | owned by BE30C-17/19 | IA `Data Models` line 205 |
| `PaymentAssertion` | owned by BE30C-18 | IA `Data Models` line 206 |
| `booking.announce.authorization_changed.v1` | emitted by BE30C-14 | IA `Event Schemas` line 327 |
| `booking.deal.lifecycle_changed.v1` | emitted by BE30C-16/34 | IA `Event Schemas` line 328 |
| `booking.announce.consent_changed.v1` | emitted by BE30C-28 | IA `Event Schemas` line 329 |
| `booking.announce_group.changed.v1` | emitted by BE30C-29/30 | IA `Event Schemas` line 330 |
| `booking.announce_group.ejection_requested.v1` | emitted by BE30C-30 | IA `Event Schemas` line 331 |
| `booking.deposit.announce_policy_classified.v1` | emitted by BE30C-17/14 | IA `Event Schemas` line 332 |
| `booking.announce_waive.capability_changed.v1` | emitted by BE30C-32 | IA `Event Schemas` line 333 |
| `booking.announce.precondition_waived.v1` | emitted by BE30C-31 | IA `Event Schemas` line 334 |
| `booking.deal.document_generated` | emitted by BE30C-15 | IA `Event Schemas` line 335 |
| `booking.payment.schedule_changed` | emitted by BE30C-17/19 | IA `Event Schemas` line 336 |
| `booking.payment.assertion_changed` | emitted by BE30C-18 | IA `Event Schemas` line 337 |

### Feature Ledger Coverage

| Ledger feature | Disposition | Operation or owning companion |
|---|---|---|
| `17.01.04` Confirmation & Announce Readiness Gate | represented | BE30C-14/28–34 |
| `17.04` Performance Contracts & Deal Memos | represented | BE30C-15/16 |
| `17.05.01` Deposit Invoice & Collection | represented as evidence/policy only | BE30C-17/18 |
| `17.05.02` Balance Schedule & Payment Reminders | represented | BE30C-17/18/19 |
| `17.02.01`, `17.02.02`, `17.02.03`, `17.02.04`, `17.03.01`, `17.03.02`, `17.03.03` | deferred | 30b |
| `17.05.03`, `17.05.04`, `17.06` | deferred | 30d |
| `17.07`, `17.14` | deferred | 30e |

## Endpoint Completeness Reconciliation

| IA interaction | HTTP operation | Request → typed success | Error / event |
|---|---|---|---|
| 30.14 | POST `/api/v1/booking/deals/{dealId}/announce-authorizations` | AnnounceAuthorizationRequest → AnnounceAuthorizationResult (201) | ApiError; booking.announce.authorization_changed.v1 |
| 30.15 | POST `/api/v1/booking/deals/{dealId}/documents` | DocumentRequest → DealDocumentResult (202) | ApiError; booking.deal.document_generated |
| 30.16 | POST `/api/v1/booking/deals/{dealId}/amendments` | AmendmentRequest → AmendmentResult (201) | ApiError; booking.deal.lifecycle_changed.v1 |
| 30.17 | POST `/api/v1/booking/deals/{dealId}/payment-schedules` | PaymentScheduleRequest → PaymentScheduleResult (201) | ApiError; booking.payment.schedule_changed |
| 30.18 | POST `/api/v1/booking/payment-schedules/{scheduleId}/assertions` | PaymentAssertionRequest → PaymentAssertionResult (201) | ApiError; booking.payment.assertion_changed |
| 30.19 | POST `/api/v1/booking/payment-schedules/{scheduleId}/overdue-actions` | OverdueRequest → OverdueActionResult (201) | ApiError; booking.payment.schedule_changed |
| 30.28 | POST `/api/v1/booking/deals/{dealId}/announce-consents` | ConsentRequest → AnnounceConsentResult (201) | ApiError; booking.announce.consent_changed.v1 |
| 30.29 | POST `/api/v1/booking/announce-groups/{groupId}/membership-actions` | MembershipRequest → AnnounceGroupResult (201) | ApiError; booking.announce_group.changed.v1 |
| 30.30 | POST `/api/v1/booking/announce-groups/{groupId}/ejection-requests` | EjectionRequest → EjectionRequestResult (201) | ApiError; booking.announce_group.ejection_requested.v1 |
| 30.31 | POST `/api/v1/booking/deals/{dealId}/announce-waivers` | WaiverRequest → WaiverResult (201) | ApiError; booking.announce.precondition_waived.v1 |
| 30.32 | POST `/api/v1/booking/announce-waive-capabilities` | CapabilityRequest → CapabilityResult (201) | ApiError; booking.announce_waive.capability_changed.v1 |
| 30.33 | POST `/api/v1/booking/deals/{dealId}/on-sale-snapshots` | ScheduleSnapshotRequest → OnSaleScheduleSnapshotResult (201) | ApiError; booking.deal.lifecycle_changed.v1 |
| 30.34 | POST `/api/v1/booking/deals/{dealId}/scheduled-announcements/{scheduleId}/commit` | CommitAnnouncement → AnnounceRecordResult (201) | ApiError; booking.deal.lifecycle_changed.v1 |

## Canonical Model Inventory

| Domain | Canonical models |
|---|---|
| Announcement basis | `DepositAnnouncePolicy`, `OnSaleScheduleSnapshot`, `AnnounceAuthorization`, `AnnounceRecord`, `AnnounceConsent` |
| Group governance | `AnnounceGroup`, `AnnounceGroupMembershipEvent`, `AnnounceGroupEjectionRequest`, `AnnounceGroupReadinessProjection` |
| Exceptional waiver | `AnnounceWaiveCapability`, `AnnouncePreconditionWaiver` |
| Documents/payments | `DealDocument`, `PaymentSchedule`, `PaymentAssertion` |

## API Endpoints

### Authoritative Route Registry

| ID | IA | Method | Path | Authorization/idempotency |
|---|---|---|---|---|
| BE30C-14 | 30.14 | POST | `/api/v1/booking/deals/{dealId}/announce-authorizations` | binding party consent administrator; key + deal/policy versions |
| BE30C-15 | 30.15 | POST | `/api/v1/booking/deals/{dealId}/documents` | deal document generator/requesting binding party; key + accepted digest/template |
| BE30C-16 | 30.16 | POST | `/api/v1/booking/deals/{dealId}/amendments` | all affected binding mandates + step-up; key + deal/document versions |
| BE30C-17 | 30.17 | POST | `/api/v1/booking/deals/{dealId}/payment-schedules` | deal finance mandate; key + accepted/amendment digest |
| BE30C-18 | 30.18 | POST | `/api/v1/booking/payment-schedules/{scheduleId}/assertions` | payer/payee/verified provider source; key + row/source fact |
| BE30C-19 | 30.19 | POST | `/api/v1/booking/payment-schedules/{scheduleId}/overdue-actions` | finance controller under pinned overdue policy; key + row/clock versions |
| BE30C-28 | 30.28 | POST | `/api/v1/booking/deals/{dealId}/announce-consents` | exact announce-group member mandate; key + group/deal versions |
| BE30C-29 | 30.29 | POST | `/api/v1/booking/announce-groups/{groupId}/membership-actions` | group governance mandate; key + group/member versions |
| BE30C-30 | 30.30 | POST | `/api/v1/booking/announce-groups/{groupId}/ejection-requests` | group member/governance actor; key + membership/evidence digest |
| BE30C-31 | 30.31 | POST | `/api/v1/booking/deals/{dealId}/announce-waivers` | active scoped waive capability + step-up; key + readiness/capability versions |
| BE30C-32 | 30.32 | POST | `/api/v1/booking/announce-waive-capabilities` | governance approver distinct from holder; key + scope/policy versions |
| BE30C-33 | 30.33 | POST | `/api/v1/booking/deals/{dealId}/on-sale-snapshots` | schedule source worker or event launch administrator; key + source schedule digest |
| BE30C-34 | 30.34 | POST | `/api/v1/booking/deals/{dealId}/scheduled-announcements/{scheduleId}/commit` | scheduler worker or step-up break-glass operator; occurrence key + readiness CAS |

This is the sole authoritative route registry for 30c. BE30C-14..19 and BE30C-28..34 are stable operation IDs used as keys for every contract, error, authorization, idempotency, rate, observability, and test row; 30a/30b/30d/30e and BE00 routes are inherited and never duplicated here.

Rates: document/amend/schedule/authorization 20/hour/deal; assertions 120/hour/source; consent/group actions 60/hour/group; waiver/capability 10/day/actor; schedule snapshot 60/hour/deal; commit 10/min/schedule. All writes are private/no-store; synchronous p95 <800 ms, p99 <1.5 s; documents and announcement delivery return 202 within 500 ms. TLS, ULIDs, request ID, strict JSON, 128 KiB cap (document templates by reference), exact-origin role CORS, and authenticated/session or signed worker principal are mandatory. Preflight permits route method plus `OPTIONS` and `Authorization, Content-Type, Idempotency-Key, If-Match, X-Request-Id`.

## Zod 4 Contracts

```ts
const Id=z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/);
const At=z.string().datetime({offset:true});
const Ver=z.number().int().positive();
const Money=z.object({amountMinor:z.bigint().nonnegative(),currency:z.string().regex(/^[A-Z]{3}$/)}).strict();
const Ref=z.object({id:Id,version:Ver}).strict();
type BE00JsonValue = null | boolean | number | string | readonly BE00JsonValue[] | { readonly [key: string]: BE00JsonValue };
const BE00JsonValueSchema: z.ZodType<BE00JsonValue> = z.lazy(() => z.union([z.null(), z.boolean(), z.number().finite(), z.string().max(4096), z.array(BE00JsonValueSchema).max(128), z.record(z.string().max(128), BE00JsonValueSchema)]));
const be00JsonDepth = (value: BE00JsonValue): number => value === null || typeof value !== "object" ? 0 : Array.isArray(value) ? 1 + Math.max(0, ...value.map(be00JsonDepth)) : 1 + Math.max(0, ...Object.values(value).map(be00JsonDepth));
const BE00ErrorDetails = z.record(z.string().max(128), BE00JsonValueSchema).superRefine((value, ctx) => { if (Object.keys(value).length > 16) ctx.addIssue({ code: "custom", message: "details_key_limit" }); if (be00JsonDepth(value) > 4) ctx.addIssue({ code: "custom", message: "details_depth_limit" }); if (new TextEncoder().encode(JSON.stringify(value)).length > 8192) ctx.addIssue({ code: "custom", message: "details_size_limit" }); });
const ApiError=z.object({code:z.string().min(1),message:z.string().min(1),requestId:z.string().min(1),details:BE00ErrorDetails}).strict();
const TermScalar=z.union([z.string().trim().max(2000),z.number().finite(),z.boolean(),z.null()]);
const TermValue=z.union([TermScalar,z.array(TermScalar).max(50),z.record(z.string().regex(/^[A-Z0-9_]{1,80}$/),TermScalar).refine(v=>Object.keys(v).length<=50)]);
const AnnounceAuthorizationRequest=z.object({acceptedDealVersion:Ver,depositPolicy:Ref,groupId:Id,groupVersion:Ver,scope:z.enum(['announce','on_sale','both']),effectiveUntil:At,reason:z.string().trim().min(1).max(1000)}).strict();
const DocumentRequest=z.object({acceptedDealVersion:Ver,termDigest:z.string().regex(/^[a-f0-9]{64}$/),template:Ref,format:z.enum(['pdf','docx','html']),recipientPolicy:Ref,locale:z.string().min(2).max(20)}).strict();
const AmendmentRequest=z.object({expectedDealVersion:Ver,citedDocumentVersion:Ver,changedTerms:z.record(z.string().regex(/^[A-Z0-9_]{1,80}$/),TermValue).refine(x=>Object.keys(x).length>0&&Object.keys(x).length<=100),partyApprovalRefs:z.array(Id).min(2).max(20),effectiveAt:At,reason:z.string().trim().min(1).max(2000)}).strict();
const PaymentRow=z.object({rowId:Id,kind:z.enum(['deposit','balance','expense_reimbursement','other']),dueAt:At,amount:Money,payerPartyId:Id,payeePartyId:Id,conditionRefs:z.array(Id).max(20)}).strict().refine(v=>v.payerPartyId!==v.payeePartyId,{path:['payeePartyId'],message:'parties differ'});
const PaymentScheduleRequest=z.object({expectedDealVersion:Ver,rows:z.array(PaymentRow).min(1).max(100),overduePolicy:Ref}).strict().refine(v=>new Set(v.rows.map(x=>x.rowId)).size===v.rows.length,{path:['rows'],message:'row IDs unique'});
const PaymentAssertionRequest=z.object({rowId:Id,sourceType:z.enum(['payer','payee','provider']),sourcePartyId:Id.optional(),providerRef:Id.optional(),sourceFactId:Id,sourceVersion:Ver,outcome:z.enum(['initiated','paid','failed','reversed','disputed']),amount:Money,observedAt:At,evidenceRefs:z.array(Id).min(1).max(30)}).strict();
const OverdueRequest=z.object({rowId:Id,expectedScheduleVersion:Ver,clockVersion:Ver,action:z.enum(['notify','escalate','waive_late_state','mark_disputed']),reason:z.string().trim().min(1).max(1000)}).strict();
const ConsentRequest=z.object({groupId:Id,groupVersion:Ver,memberPartyId:Id,mandateRef:Id,outcome:z.enum(['consent','withhold','revoke']),scope:z.enum(['announce','on_sale','both']),effectiveUntil:At,reason:z.string().trim().min(1).max(1000)}).strict();
const MembershipRequest=z.object({expectedGroupVersion:Ver,memberPartyId:Id,action:z.enum(['add','suspend','restore','remove']),mandateRef:Id,reason:z.string().trim().min(1).max(1000)}).strict();
const EjectionRequest=z.object({targetMembershipId:Id,expectedGroupVersion:Ver,criterionCode:z.string().regex(/^[A-Z0-9_]{1,60}$/),evidenceRefs:z.array(Id).min(1).max(50),requestedAt:At}).strict();
const CapabilityRequest=z.object({holderPartyId:Id,scope:z.array(z.enum(['deposit','consent','schedule','ejection'])).min(1),dealOrGroupRef:Id.optional(),effectiveFrom:At,effectiveUntil:At,approverPartyId:Id,policyVersion:Ver,reason:z.string().trim().min(1).max(1000)}).strict().refine(v=>v.holderPartyId!==v.approverPartyId,{path:['approverPartyId'],message:'approver distinct'});
const WaiverRequest=z.object({readinessProjectionVersion:Ver,capabilityId:Id,capabilityVersion:Ver,preconditionCode:z.enum(['TIER2_DEPOSIT','TIER2_CONSENT','TIER2_SCHEDULE']),scope:z.enum(['single_occurrence']),expiresAt:At,evidenceRefs:z.array(Id).min(1).max(30),reason:z.string().trim().min(1).max(1000)}).strict();
const ScheduleSnapshotRequest=z.object({sourceSchedule:Ref,timeZone:z.string().min(1).max(64),announceAt:At,onSaleAt:At,channelRefs:z.array(Id).min(1).max(30),sourceDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict().refine(v=>Date.parse(v.announceAt)<=Date.parse(v.onSaleAt),{path:['onSaleAt'],message:'must not precede announcement'});
const CommitAnnouncement=z.object({expectedReadinessVersion:Ver,scheduleSnapshotVersion:Ver,occurrenceAt:At,mode:z.enum(['scheduled','break_glass']),stepUpProofRef:Id.optional(),reason:z.string().trim().max(1000).optional()}).strict().refine(v=>v.mode!=='break_glass'||Boolean(v.stepUpProofRef&&v.reason),{path:['stepUpProofRef'],message:'break glass requires proof and reason'});
```

### Typed success and error schemas

Every route returns its named strict Zod 4 success object or the BE00 global ErrorResponse envelope ApiError { code, message, requestId, details }. A response never exposes provider secrets, private terms, evidence, or unfiltered membership.

~~~ts
const AnnounceAuthorizationResult=z.object({id:Id,version:Ver,dealId:Id,state:z.enum(['active','superseded','revoked','consumed']),scope:z.enum(['announce','on_sale','both']),policyVersion:Ver,expiresAt:At}).strict();
const DealDocumentResult=z.object({id:Id,version:Ver,dealId:Id,dealVersion:Ver,termDigest:z.string().regex(/^[a-f0-9]{64}$/),format:z.enum(['pdf','docx','html']),status:z.enum(['queued','ready','superseded'])}).strict();
const AmendmentResult=z.object({dealId:Id,version:Ver,state:z.enum(['accepted','superseded','cancelled','postponed']),termDigest:z.string().regex(/^[a-f0-9]{64}$/),approvalCount:z.number().int().nonnegative()}).strict();
const PaymentScheduleResult=z.object({id:Id,version:Ver,dealId:Id,state:z.enum(['planned','due','pending_confirmation','paid','partially_paid','overdue','waived_by_amendment','contested']),rowCount:z.number().int().positive(),total:Money}).strict();
const PaymentAssertionResult=z.object({id:Id,version:Ver,scheduleId:Id,rowId:Id,outcome:z.enum(['initiated','paid','failed','reversed','disputed']),reconciledState:z.enum(['unknown','pending','paid','failed','reversed','disputed']),observedAt:At}).strict();
const OverdueActionResult=z.object({scheduleId:Id,version:Ver,rowId:Id,state:z.enum(['overdue','pending_confirmation','paid','disputed']),action:z.enum(['notify','escalate','waive_late_state','mark_disputed']),actionAt:At}).strict();
const AnnounceConsentResult=z.object({id:Id,version:Ver,dealId:Id,groupId:Id,outcome:z.enum(['consent','withhold','revoke']),scope:z.enum(['announce','on_sale','both']),effectiveUntil:At}).strict();
const AnnounceGroupResult=z.object({id:Id,version:Ver,groupId:Id,state:z.enum(['assembling','blocked','ready','announced','dissolved']),readinessState:z.enum(['ready','blocked','unknown']),activeMemberCount:z.number().int().nonnegative(),aggregateBlockerCount:z.number().int().nonnegative()}).strict();
const EjectionRequestResult=z.object({id:Id,version:Ver,groupId:Id,targetMembershipId:Id,state:z.enum(['pending','accepted','refused','superseded']),requestedAt:At}).strict();
const WaiverResult=z.object({id:Id,version:Ver,dealId:Id,preconditionCode:z.enum(['TIER2_DEPOSIT','TIER2_CONSENT','TIER2_SCHEDULE']),state:z.enum(['recorded','superseded','expired']),expiresAt:At}).strict();
const CapabilityResult=z.object({id:Id,version:Ver,capabilityId:Id,state:z.enum(['draft','active','revoked','expired']),effectiveUntil:At}).strict();
const OnSaleScheduleSnapshotResult=z.object({id:Id,version:Ver,dealId:Id,scheduleId:Id,announceAt:At,onSaleAt:At,sourceDigest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const AnnounceRecordResult=z.object({id:Id,version:Ver,dealId:Id,scheduleId:Id,state:z.literal('announced'),announcedAt:At,occurrenceAt:At}).strict();
const ErrorResponse=ApiError;
~~~

| Operation | Request schema | Success schema | Status | Error response |
|---|---|---|---|---|
| BE30C-14 | AnnounceAuthorizationRequest | AnnounceAuthorizationResult | 201 | ErrorResponse |
| BE30C-15 | DocumentRequest | DealDocumentResult | 202 | ErrorResponse |
| BE30C-16 | AmendmentRequest | AmendmentResult | 201 | ErrorResponse |
| BE30C-17 | PaymentScheduleRequest | PaymentScheduleResult | 201 | ErrorResponse |
| BE30C-18 | PaymentAssertionRequest | PaymentAssertionResult | 201 | ErrorResponse |
| BE30C-19 | OverdueRequest | OverdueActionResult | 201 | ErrorResponse |
| BE30C-28 | ConsentRequest | AnnounceConsentResult | 201 | ErrorResponse |
| BE30C-29 | MembershipRequest | AnnounceGroupResult | 201 | ErrorResponse |
| BE30C-30 | EjectionRequest | EjectionRequestResult | 201 | ErrorResponse |
| BE30C-31 | WaiverRequest | WaiverResult | 201 | ErrorResponse |
| BE30C-32 | CapabilityRequest | CapabilityResult | 201 | ErrorResponse |
| BE30C-33 | ScheduleSnapshotRequest | OnSaleScheduleSnapshotResult | 201 | ErrorResponse |
| BE30C-34 | CommitAnnouncement | AnnounceRecordResult | 201 | ErrorResponse |

Unknown keys, stale/dead deal/mandate/policy/group/capability/schedule, term digest mismatch, unapproved amendment, unequal schedule totals/accepted deal currency, duplicate payment source fact, contradictory assertion without dispute/reversal link, self-approved capability, waiver outside Tier-2 scope, missing consent, invalid member/ejection criterion, schedule clock ambiguity, unsafe text, and raw bank/payment/document secrets fail before mutation. Payment assertions are evidence, not funds truth; precedence rules pin verified provider > bilateral matching assertions > unilateral assertion, with disagreement becoming ``disputed``.
Unknown keys, stale/dead deal/mandate/policy/group/capability/schedule, term digest mismatch, unapproved amendment, unequal schedule totals/accepted deal currency, duplicate payment source fact, contradictory assertion without dispute/reversal link, self-approved capability, waiver outside Tier-2 scope, missing consent, invalid member/ejection criterion, schedule clock ambiguity, unsafe text, and raw bank/payment/document secrets fail before mutation. Payment assertions are evidence, not funds truth; precedence rules pin verified provider > bilateral matching assertions > unilateral assertion, with disagreement becoming `disputed`.

## Persistence Registry

| Canonical model / table | Typed required fields and constraints | Index/RLS/grant boundary |
|---|---|---|
| `DepositAnnouncePolicy` / `deposit_announce_policies` | id/version PK; deal class; deposit threshold BPS 0..10000; Tier-1/2 preconditions JSON; policy/effective interval; immutable | effective deal class; governance write; deal parties read projection |
| `OnSaleScheduleSnapshot` / `on_sale_schedule_snapshots` | deal/version PK; source schedule ID/version/digest; zone; announce/on-sale timestamps; channels; `announce_at<=on_sale_at` | deal/source digest unique; authorized launch roles |
| `AnnounceAuthorization` / `announce_authorizations` | id/version PK; deal/group/version; scope enum; policy version; effective-until; state; authorizer/mandate | active deal/scope/expiry; binding parties only |
| `AnnounceRecord` / `announce_records` | id PK; deal/schedule/occurrence unique; readiness digest; mode; commit/delivery state; artifact/receipt refs | due/delivery state; scheduler narrow write |
| `AnnounceConsent` / `announce_consents` | id/version PK; group/member/mandate; outcome/scope/expiry/reason ciphertext | group/member/current outcome; own/full, group minimized |
| `AnnounceGroup` / `announce_groups` | id/version PK; deal; policy; state; readiness version; membership digest | deal/state/current; group governance |
| `AnnounceGroupMembershipEvent` / `announce_group_membership_events` | id PK; group/version; member; add/suspend/restore/remove; mandate; reason; occurred-at | group/member/time; append-only |
| `AnnounceGroupEjectionRequest` / `announce_group_ejection_requests` | id/version PK; group/target membership; criterion/evidence; submitted/approved/rejected/withdrawn; decider | open group/state; evidence restricted |
| `AnnounceGroupReadinessProjection` / `announce_group_readiness_projections` | group/version PK; deal/group/policy/source versions; required/received consent sets; deposit/schedule states; gaps; digest | deal/current/digest; worker-owned projection |
| `AnnounceWaiveCapability` / `announce_waive_capabilities` | id/version PK; holder/scope/deal-group bound; interval; approver distinct; policy; active/revoked/expired | holder/state/expiry; governance only |
| `AnnouncePreconditionWaiver` / `announce_precondition_waivers` | id/version PK; deal/readiness/capability versions; closed precondition enum; single occurrence; expiry; evidence/reason | occurrence/precondition unique; step-up custodian |
| `DealDocument` / `deal_documents` | id/version PK; deal/accepted version/term digest/template/version/format/recipient policy; artifact hash/ref; supersedes | deal/current/digest; recipient projection |
| `PaymentSchedule` / `payment_schedules` | id/version PK; deal/deal version; row JSON; total/currency; overdue policy; state; `total>=0` | deal/state/current; finance roles |
| `PaymentAssertion` / `payment_assertions` | id/version PK; schedule/row; source type/party/provider; source fact/version unique; outcome; amount/currency; evidence; observed-at | row/time/source fact; party/provider scoped |

All physical tables use `tenant_id`, `created_at`, and actor/service audit reference; foreign keys point to local deal/group/schedule records or validated opaque source refs with version/digest. Monetary columns are bigint minor units plus ISO currency; timestamps are `timestamptz`; JSON columns have shape checks. Direct client `INSERT/UPDATE/DELETE`, `anon`, and public grants are denied. Every table enables and forces RLS. Authenticated users execute security-definer RPCs that recheck deal-party/finance/group/governance purpose. Documents, terms, amounts, reasons, evidence, mandate, capability and recipient fields are column-filtered. Workers receive row leases only.

### Constraint, index, RLS, and grant registry

This typed registry is authoritative for every persisted domain field, including nullability, constraints, local foreign keys or opaque source seams, query indexes, and grants. Common fields on every table are tenant_id uuid NOT NULL, created_at timestamptz NOT NULL, and updated_at timestamptz NOT NULL unless the row is an append-only event, which uses occurred_at timestamptz NOT NULL instead of updated_at.

| Table | Typed fields, nullability, and constraints | FK or opaque target | Query indexes | RLS and grants |
|---|---|---|---|---|
| deposit_announce_policies | id uuid NOT NULL PK; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; deal_version bigint NOT NULL CHECK >0; classification text NOT NULL CHECK explicit_zero/due_before_announce/not_due_before_announce; deposit_amount_minor bigint NOT NULL CHECK >=0; currency char(3) NOT NULL; due_condition text NOT NULL; due_at timestamptz NULL; term_evidence_ref uuid NOT NULL; term_evidence_version bigint NOT NULL; evidence_status text NOT NULL CHECK valid/missing/contradictory; classified_at timestamptz NOT NULL; common fields | deal_id FK accepted_deals.id; term_evidence_ref opaque accepted-term seam with pinned version | UNIQUE(deal_id,deal_version); (classification,due_at); (term_evidence_ref,term_evidence_version) | RLS binding parties and finance purpose; SELECT projection only; service/RPC INSERT; no UPDATE/DELETE |
| on_sale_schedule_snapshots | id uuid NOT NULL PK; schedule_id uuid NOT NULL; schedule_version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; deal_version bigint NOT NULL CHECK >0; venue_timezone text NOT NULL; announce_local timestamp NOT NULL; announce_at timestamptz NOT NULL; on_sale_local timestamp NULL; on_sale_at timestamptz NULL; is_free_or_rsvp boolean NOT NULL; timing_term_ref uuid NOT NULL; timing_term_version bigint NOT NULL; source_digest text NOT NULL CHECK 64 lowercase hex; recorded_at timestamptz NOT NULL; idempotency_key text NOT NULL; common fields | deal_id FK accepted_deals.id; schedule_id/timing_term_ref opaque Shard 35/accepted-term seams | UNIQUE(schedule_id,schedule_version); UNIQUE(deal_id,deal_version,source_digest); (deal_id,announce_at) | RLS scheduler/deal-party projection; worker INSERT through RPC; no direct client grant |
| announce_authorizations | id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; deal_version bigint NOT NULL CHECK >0; schedule_id uuid NOT NULL; schedule_version bigint NOT NULL CHECK >0; prerequisite_manifest_hash text NOT NULL; group_version bigint NULL; deposit_policy_version bigint NOT NULL; scope text NOT NULL CHECK announce/on_sale/both; state text NOT NULL CHECK active/superseded/revoked/consumed; authorizer_id uuid NOT NULL; mandate_ref uuid NOT NULL; effective_until timestamptz NOT NULL; superseded_at timestamptz NULL; common fields; PK(id,version) | deal_id FK accepted_deals.id; schedule_id/group/mandate refs opaque producer or authority seams | UNIQUE(deal_id,version); partial UNIQUE(deal_id) WHERE state=active; (schedule_id,schedule_version); (state,effective_until) | RLS binding parties and launch worker; active projection only; service/RPC INSERT; no UPDATE/DELETE |
| announce_records | id uuid NOT NULL PK; deal_id uuid NOT NULL; deal_version_before bigint NOT NULL CHECK >0; deal_version_after bigint NOT NULL CHECK >0; authorization_id uuid NOT NULL; authorization_version bigint NOT NULL CHECK >0; schedule_id uuid NOT NULL; schedule_version bigint NOT NULL CHECK >0; announced_at timestamptz NOT NULL; worker_occurrence_id text NOT NULL; idempotency_key text NOT NULL; state text NOT NULL CHECK announced; common fields | deal_id FK accepted_deals.id; authorization_id FK announce_authorizations(id); schedule_id opaque Shard 35 seam | UNIQUE(deal_id); UNIQUE(authorization_id,authorization_version); UNIQUE(worker_occurrence_id); (announced_at) | RLS fan-invisible deal-party projection; scheduler INSERT through commit RPC; no direct client grants |
| announce_consents | id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; deal_version bigint NOT NULL CHECK >0; group_id uuid NOT NULL; group_version bigint NOT NULL CHECK >0; member_party_id uuid NOT NULL; mandate_ref uuid NOT NULL; outcome text NOT NULL CHECK consent/withhold/revoke; scope text NOT NULL CHECK announce/on_sale/both; effective_until timestamptz NOT NULL; reason_ciphertext bytea NOT NULL; recorded_at timestamptz NOT NULL; idempotency_key text NOT NULL; common fields; PK(id,version) | deal_id FK accepted_deals.id; group_id FK announce_groups.id; member and mandate refs opaque Identity/authority seams | UNIQUE(deal_id,deal_version,member_party_id,scope); (group_id,group_version,outcome); (effective_until) | RLS member-own and group-governance policies; ciphertext service-only; INSERT RPC only; no public grant |
| announce_groups | id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; artist_owner_id uuid NOT NULL; policy_version bigint NOT NULL CHECK >0; state text NOT NULL CHECK assembling/blocked/ready/announced/dissolved; membership_version bigint NOT NULL CHECK >0; readiness_version bigint NOT NULL CHECK >0; membership_digest text NOT NULL; readiness_digest text NOT NULL; active_member_count integer NOT NULL CHECK >=0; aggregate_blocker_count integer NOT NULL CHECK >=0; common fields; PK(id,version) | deal_id FK accepted_deals.id; artist_owner_id/policy_version opaque Identity/policy seams | UNIQUE(deal_id); UNIQUE(id,version); (artist_owner_id,state); (state,readiness_version) | RLS Musician owner full and Operator aggregate-only; governance RPC INSERT; no direct update/delete |
| announce_group_membership_events | id uuid NOT NULL PK; group_id uuid NOT NULL; group_version bigint NOT NULL CHECK >0; booking_id uuid NOT NULL; member_party_id uuid NOT NULL; action text NOT NULL CHECK add/suspend/restore/remove; prior_state text NOT NULL; next_state text NOT NULL; mandate_ref uuid NOT NULL; reason_ciphertext bytea NOT NULL; occurred_at timestamptz NOT NULL; idempotency_key text NOT NULL; common tenant field | group_id FK announce_groups.id; booking/member/mandate refs opaque Identity/booking seams | UNIQUE(group_id,group_version); (group_id,occurred_at DESC); (booking_id,occurred_at DESC) | RLS owner full and affected booking scoped; service/governance INSERT RPC; append-only |
| announce_group_ejection_requests | id uuid NOT NULL; version bigint NOT NULL CHECK >0; group_id uuid NOT NULL; target_membership_id uuid NOT NULL; requesting_operator_id uuid NOT NULL; criterion_code text NOT NULL; evidence_refs jsonb NOT NULL; state text NOT NULL CHECK pending/accepted/refused/withdrawn; decider_id uuid NULL; decided_at timestamptz NULL; submitted_at timestamptz NOT NULL; common fields; PK(id,version) | group_id FK announce_groups.id; target membership FK membership event id; actor/evidence refs opaque seams | (group_id,state,submitted_at); (target_membership_id,state); UNIQUE(id,version) | RLS requesting Operator own projection and Musician owner decision; evidence service-only; RPC INSERT |
| announce_group_readiness_projections | id uuid NOT NULL; group_id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_version bigint NOT NULL CHECK >0; membership_version bigint NOT NULL CHECK >0; policy_version bigint NOT NULL CHECK >0; source_versions jsonb NOT NULL; required_consent_sets jsonb NOT NULL; deposit_state text NOT NULL; schedule_state text NOT NULL; state text NOT NULL CHECK ready/blocked/unknown; gap_codes jsonb NOT NULL; manifest_hash text NOT NULL; evaluated_at timestamptz NOT NULL; common fields; PK(id,version) | group_id FK announce_groups.id; deal/policy/schedule/member versions opaque producer seams | UNIQUE(group_id,version,manifest_hash); (group_id,evaluated_at DESC); (state,evaluated_at DESC); (manifest_hash) | RLS owner full and Operator aggregate-only; worker INSERT RPC; no direct client grants |
| announce_waive_capabilities | id uuid NOT NULL; version bigint NOT NULL CHECK >0; holder_party_id uuid NOT NULL; scope jsonb NOT NULL; deal_or_group_ref uuid NULL; precondition text NULL CHECK P-06/P-07; effective_from timestamptz NOT NULL; effective_until timestamptz NOT NULL CHECK effective_until>effective_from; approver_party_id uuid NOT NULL; policy_version bigint NOT NULL CHECK >0; state text NOT NULL CHECK draft/active/revoked/expired; reason_ciphertext bytea NOT NULL; common fields; PK(id,version); CHECK holder_party_id<>approver_party_id | deal_or_group_ref opaque deal/group seam; holder/approver IDs opaque Identity authority seams | (holder_party_id,state,effective_until); (deal_or_group_ref,precondition,state); partial UNIQUE(deal_or_group_ref,precondition) WHERE state=active | RLS governance and holder purpose; ciphertext service-only; governance RPC INSERT; no direct update/delete |
| announce_precondition_waivers | id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; readiness_version bigint NOT NULL CHECK >0; capability_id uuid NULL; capability_version bigint NULL CHECK >0; precondition_code text NOT NULL CHECK TIER2_DEPOSIT/TIER2_CONSENT/TIER2_SCHEDULE; scope text NOT NULL CHECK single_occurrence; expires_at timestamptz NOT NULL; evidence_refs jsonb NOT NULL; reason_ciphertext bytea NOT NULL; recorded_at timestamptz NOT NULL; common fields; PK(id,version) | deal_id FK accepted_deals.id; capability_id FK announce_waive_capabilities(id) when delegate; readiness/evidence refs opaque seams | UNIQUE(deal_id,precondition_code,scope); (deal_id,expires_at); (capability_id,capability_version) | RLS binding principals and step-up custodian; evidence/reason service-only; append RPC only |
| deal_documents | id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; accepted_deal_version bigint NOT NULL CHECK >0; term_digest text NOT NULL CHECK 64 lowercase hex; template_id uuid NOT NULL; template_version bigint NOT NULL CHECK >0; format text NOT NULL CHECK pdf/docx/html; recipient_policy_id uuid NOT NULL; artifact_hash text NULL CHECK 64 lowercase hex; artifact_ref text NULL; supersedes_id uuid NULL; status text NOT NULL CHECK queued/ready/superseded; common fields; PK(id,version) | deal_id FK accepted_deals.id; template/recipient policy/artifact refs opaque CMS/storage/policy seams; supersedes_id FK deal_documents(id) | UNIQUE(deal_id,version); (deal_id,accepted_deal_version); (term_digest,template_id,template_version); (status,created_at) | RLS binding parties and recipient purpose; artifact/storage refs service-only; generator RPC INSERT |
| payment_schedules | id uuid NOT NULL; version bigint NOT NULL CHECK >0; deal_id uuid NOT NULL; deal_version bigint NOT NULL CHECK >0; rows jsonb NOT NULL; total_minor bigint NOT NULL CHECK >=0; currency char(3) NOT NULL; overdue_policy_id uuid NOT NULL; state text NOT NULL CHECK planned/due/pending_confirmation/paid/partially_paid/overdue/waived_by_amendment/contested; common fields; PK(id,version) | deal_id FK accepted_deals.id; overdue_policy_id opaque policy seam | UNIQUE(deal_id,version); (deal_id,state); (state,created_at); GIN(rows) | RLS deal parties and finance mandate; finance RPC INSERT; no direct update/delete |
| payment_assertions | id uuid NOT NULL; version bigint NOT NULL CHECK >0; schedule_id uuid NOT NULL; row_id uuid NOT NULL; source_type text NOT NULL CHECK payer/payee/provider; source_party_id uuid NULL; provider_ref uuid NULL; source_fact_id uuid NOT NULL; source_version bigint NOT NULL CHECK >0; outcome text NOT NULL CHECK initiated/paid/failed/reversed/disputed; amount_minor bigint NOT NULL CHECK >=0; currency char(3) NOT NULL; evidence_refs jsonb NOT NULL; observed_at timestamptz NOT NULL; common fields; PK(id,version) | schedule_id FK payment_schedules.id; source party/provider/fact/evidence refs opaque external/payment seams | UNIQUE(source_fact_id,source_version); (schedule_id,row_id,observed_at DESC); (source_type,source_fact_id); (outcome,observed_at DESC) | RLS payer/payee/finance projection; provider webhook and bilateral RPC INSERT; no direct update/delete |

All physical tables enable and force RLS. Anonymous and public grants are denied; authenticated clients receive only purpose-scoped SELECT projections and execute security-definer RPCs that recheck tenant, deal-party, finance, group-governance, worker signature, and step-up claims. Immutable rows are append-only. Foreign-key violations and unresolved opaque source versions fail closed before commit.

## Transactions and Lifecycles

- 30.14/30.28 lock accepted deal/group/member policy, append authorization/consent, then recompute `AnnounceGroupReadinessProjection` in the same transaction. Revocation immediately makes readiness false.
- 30.15 freezes accepted term digest/template/recipient snapshot and job. Renderer signs/scans artifacts and attaches only if deal version remains current; otherwise result is superseded.
- 30.16 locks deal/document and every affected party mandate/approval in stable order, validates changed term schemas, appends accepted-deal amendment and replacement document/readiness/payment invalidations atomically. Amendment never edits prior deal/document.
- 30.17 derives complete payment rows/totals from accepted terms, appends `PaymentSchedule`, audit/outbox. 30.18 appends one source fact; reconciliation derives paid/failed/reversed/disputed without erasing evidence. 30.19 database-clock worker or controller appends overdue action only after pinned grace/policy.
- 30.29 appends membership event and group version. 30.30 submits evidence; distinct governance decision may eject, recompute consent set, and invalidate readiness. No request auto-ejects.
- 30.32 governance locks scope/policy and creates/revokes capability with distinct approver. 30.31 locks readiness/capability, permits only closed Tier-2 preconditions for one occurrence, appends waiver and recomputes readiness; Tier-1/legal/safety conditions are non-waivable.
- 30.33 stores immutable schedule source snapshot. 30.34 scheduler claims due occurrence with `FOR UPDATE SKIP LOCKED`, locks readiness/snapshot/deal, rechecks all source versions and waiver expiry, inserts unique `AnnounceRecord`, publishes canonical change, and dispatches. Any failed precondition remains `blocked`; no partial announce.

Idempotency binds tenant, actor/worker, route, deal/group/schedule, and canonical body hash for 72 hours. Same key/different body returns `409 IDEMPOTENCY_CONFLICT`; completed replay returns stored result. Database time controls due/expiry. Audit/outbox/idempotency response commit with every write.

### Explicit state machine and blocked behavior

| Aggregate | States | Allowed transitions and trigger | Blocked behavior |
|---|---|---|---|
| DepositAnnouncePolicy | unclassified, explicit_zero, due_before_announce, not_due_before_announce | unclassified→one immutable classification on BE30C-17; no later rewrite | missing or contradictory evidence stays unknown and blocks authorization |
| OnSaleScheduleSnapshot | received, current, superseded | received→current after source/version validation; current→superseded on newer schedule | stale or contradictory timing remains blocked; callback retries with same key |
| AnnounceAuthorization | active, superseded, revoked, consumed | active→superseded on source change; active→revoked on consent/capability loss; active→consumed only BE30C-34 | any missing prerequisite returns READINESS_BLOCKED and no fan-facing state |
| AnnounceRecord | pending, announced | pending→announced exactly once under deal/schedule CAS | duplicate occurrence returns stored record; failed delivery never rolls back canonical commit |
| AnnounceConsent | effective, withhold, revoked, superseded | effective↔withhold only through versioned consent action; any revoke invalidates readiness | stale deal/group or non-principal action leaves prior evidence unchanged |
| AnnounceGroup | assembling, blocked, ready, announced, dissolved | assembling→blocked/ready after readiness recompute; ready→announced only after commit; active membership can return ready→blocked | unknown member evidence projects blocked/unknown and prevents authorization |
| AnnounceGroupMembershipEvent | active, suspended, restored, removed | append add/suspend/restore/remove against expected group version | stale group version returns MEMBERSHIP_VERSION_CONFLICT; no partial membership mutation |
| AnnounceGroupEjectionRequest | pending, accepted, refused, withdrawn | pending→accepted/refused only by Musician owner; accepted creates membership event | Operator request cannot mutate membership or reveal foreign member identity |
| AnnounceGroupReadinessProjection | ready, blocked, unknown | recompute on consent, membership, deposit, schedule, or policy version change | unknown source remains unknown and blocks; projection never invents satisfied evidence |
| AnnounceWaiveCapability | draft, active, revoked, expired | draft→active by distinct governance approver; active→revoked/expired by policy/time | inactive or scope-mismatched capability rejects waiver before mutation |
| AnnouncePreconditionWaiver | requested, recorded, superseded, expired | requested→recorded for eligible Tier-2 one-occurrence key; later source change supersedes | Tier-1, wrong policy, missing step-up, or expired capability remains unwaived |
| DealDocument | queued, ready, superseded, failed | queued→ready after artifact hash/signature; ready→superseded on amendment | renderer failure leaves prior document current and job retryable |
| PaymentSchedule | planned, due, pending_confirmation, paid, partially_paid, overdue, waived_by_amendment, contested | planned→due by database clock; outcomes/reconciliation append state; amendment can waive only under accepted term | unknown provider fact remains pending/contested; no automatic void or fund movement |
| PaymentAssertion | initiated, paid, failed, reversed, disputed | source fact append then precedence derives reconciliation state | conflicting assertions preserve all facts and remain disputed until authorized resolution |

## Event Schemas

| Canonical event | Trigger and required payload |
|---|---|
| `booking.announce.authorization_changed.v1` | authorization state: `{dealId,authorizationId,version,scope,state,policyVersion,occurredAt}` |
| `booking.deal.lifecycle_changed.v1` | amendment/document/readiness lifecycle: `{dealId,dealVersion,state,termDigest,changeCode,occurredAt}` |
| `booking.announce.consent_changed.v1` | member consent: `{groupId,groupVersion,consentId,version,memberRef,outcome,scope,occurredAt}` |
| `booking.announce_group.changed.v1` | group/membership/readiness: `{groupId,version,state,membershipDigest,readinessVersion,gapCodes,occurredAt}` |
| `booking.announce_group.ejection_requested.v1` | ejection request: `{groupId,requestId,version,targetMembershipRef,criterionCode,state,occurredAt}` |
| `booking.deposit.announce_policy_classified.v1` | deal policy result: `{dealId,policyId,version,tier,requiredPreconditions,occurredAt}` |
| `booking.announce_waive.capability_changed.v1` | capability transition: `{capabilityId,version,holderRef,scope,state,effectiveUntil,occurredAt}` |
| `booking.announce.precondition_waived.v1` | waiver commit: `{dealId,waiverId,version,preconditionCode,occurrenceRef,expiresAt,occurredAt}` |
| `booking.deal.document_generated` | document artifact: `{dealId,documentId,version,dealVersion,termDigest,format,artifactHash,state,occurredAt}` |
| `booking.payment.schedule_changed` | schedule/overdue state: `{dealId,scheduleId,version,rowRefs,state,changeCode,occurredAt}` |
| `booking.payment.assertion_changed` | assertion/reconciliation: `{scheduleId,rowId,assertionId,version,sourceType,outcome,reconciledState,occurredAt}` |

Transactional outbox, per-deal/group/schedule ordering, at-least-once, event-ID dedupe, 24-hour retry/dead-letter. General events omit parties, terms, amounts, reasons, mandates, evidence, document URLs, payment provider refs, consents, and capability details; authorized finance/document/group consumers receive separate minimized projections.

## External Boundaries and Recovery

### External Seam Contract Registry

Every external seam uses a typed request/response, bounded timeout, finite retry/backoff, circuit breaker, and explicit recovery. A timeout or open circuit leaves the domain state blocked or pending and never fabricates payment, consent, authorization, or announcement.

| Seam | Exact request → response | Timeout | Retries and backoff | Circuit breaker | Recovery |
|---|---|---|---|---|---|
| Renderer/signing/storage | {dealId,dealVersion,termDigest,templateRef,format,recipientPolicy} → {documentId,artifactHash,status,artifactRef} | 30000 ms total | 2 retries at 1000 ms and 5000 ms | open after 5 failures in 60 s; hold 120 s | keep prior document current; queue retry; never expose unsigned artifact |
| Payment/provider evidence | {scheduleId,rowId,sourceFactId,sourceVersion,amount,currency,providerRef} → {assertionId,outcome,providerTimestamp} | 3000 ms total | 2 retries at 200 ms and 800 ms for timeout/429/5xx | open after 5 failures in 60 s; hold 120 s | retain unknown/pending assertion; webhook or poll dedupes source fact; never mark paid |
| Identity/mandate/accepted-deal authority | {tenantId,dealId,partyId,mandateRef,expectedDealVersion,purpose} → {authorized,dealVersion,mandateVersion,reasonCode} | 2000 ms total | 2 retries at 100 ms and 500 ms | open after 5 failures in 30 s; hold 60 s | fail closed with 503 DEPENDENCY_UNAVAILABLE; retry same idempotency key |
| Shard 35 schedule/timer callback | {dealId,scheduleId,scheduleVersion,announceAt,onSaleAt,sourceDigest,occurrenceId} → {accepted, snapshotVersion, announceRecordVersion} | 3000 ms total | 3 retries at 1 s, 5 s, and 30 s | open after 5 failures in 60 s; hold 120 s | retain blocked schedule or committed record; callback replay is deduped |
| Event/outbox consumers | {eventId,eventType,aggregateRef,aggregateVersion,payloadHash,occurredAt} → {accepted,sequence,dedupe} | 1000 ms per write | 3 retries at 100 ms, 500 ms, and 2000 ms | open after 5 failures in 60 s; hold 120 s | transaction rolls back before domain commit or dead-letters after 24 h; replay preserves ordering |

Renderer/signing/storage uses a 30 s total timeout, retries at 1/5 s, and a circuit opened after 5 failures in 1 min for 2 min; the prior document remains current. Payment/provider evidence uses a 3 s total timeout, two retries at 200/800 ms for timeout/429/5xx, and a circuit opened after 5 failures in 1 min for 2 min; after a source fact ID exists, webhook/poll recovery prevents duplicates, while unavailable becomes `unknown`, never `paid`. Identity/mandate/deal/policy/schedule sources use a 2 s total timeout, retries at 100/500 ms, and a circuit opened after 5 failures in 30 s for 60 s; uncertainty fails closed. Announcement channels use a 3 s total timeout, retries at 1/5/30 s, a circuit opened after 5 failures in 1 min for 2 min, and destination idempotency by announce record; partial delivery is explicit and replayable, but the canonical committed occurrence is never duplicated. Workers lease 60 s/renew 20 s; permanent 4xx dead-letters with reasoned step-up replay.

## Middleware, Errors, Observability, and Tests

Order: request ID -> TLS/CORS/body/content -> auth/service signature -> tenant/context -> rate -> strict Zod/term schemas -> deal/group/payment RLS -> mandate/conflict/step-up -> idempotency/If-Match -> transaction -> response projection -> audit. Failures strictly use `ApiError { code, message, requestId, details }`.

| Status/code | Condition/recovery |
|---|---|
| 400 `VALIDATION_FAILED` | malformed document/amendment/payment/group/waiver/schedule |
| 401 `UNAUTHENTICATED` | invalid session/principal |
| 403 `FORBIDDEN` | deal/finance/group/governance authority absent |
| 404 `NOT_FOUND` | absent/concealed deal/group/schedule |
| 409 `VERSION_CONFLICT` | stale deal/document/group/readiness/schedule |
| 409 `APPROVAL_OR_CONSENT_INCOMPLETE` | exact affected mandates missing |
| 409 `ASSERTION_CONFLICT` | sources disagree; row becomes disputed |
| 409 `IDEMPOTENCY_CONFLICT` | key/body mismatch |
| 410 `CAPABILITY_OR_WAIVER_EXPIRED` | cannot satisfy readiness |
| 422 `PRECONDITION_NOT_WAIVABLE` | Tier-1/unsupported condition |
| 422 `READINESS_BLOCKED` | schedule commit prerequisites fail |
| 422 `PAYMENT_EVIDENCE_INVALID` | assertion source/amount/row mismatch |
| 429 `RATE_LIMITED` | honor `Retry-After` |
| 503 `DEPENDENCY_UNAVAILABLE` | pending/unknown/blocked retained |

### Per-operation Error, Security, and Limits Matrix

Every row uses the BE00 global envelope ApiError { code, message, requestId, details }; app codes and messages are stable, and details contain only safe field names and opaque references.

| Operation | Success status/app code/message/retry | Error status/app code/message/retry | Ownership and 403/404 rule |
|---|---|---|---|
| BE30C-14 | 201 ANNOUNCE_AUTHORIZATION_CREATED “authorization recorded”; no retry after commit, replay returns result | 409 READINESS_BLOCKED “announce prerequisites are incomplete”; no retry; 422 PRECONDITION_NOT_WAIVABLE “precondition cannot be waived”; no retry | binding party consent administrator; known deal without mandate 403 FORBIDDEN, concealed deal 404 NOT_FOUND |
| BE30C-15 | 202 DOCUMENT_QUEUED “document generation queued”; replay returns job | 422 TERM_DIGEST_MISMATCH “accepted terms changed”; no retry; 503 DEPENDENCY_UNAVAILABLE “renderer unavailable”; retry after Retry-After | generator or binding party; known deal without mandate 403, concealed deal 404 |
| BE30C-16 | 201 AMENDMENT_RECORDED “deal amendment recorded”; no retry after commit, replay returns result | 409 APPROVAL_OR_CONSENT_INCOMPLETE “affected approvals are incomplete”; refresh then retry; 409 VERSION_CONFLICT “deal version is stale”; refresh then retry | all affected binding mandates; known deal without approval 403, concealed deal 404 |
| BE30C-17 | 201 PAYMENT_SCHEDULE_CREATED “payment schedule recorded”; no retry after commit, replay returns result | 400 PAYMENT_EVIDENCE_INVALID “payment rows are invalid”; no retry; 409 VERSION_CONFLICT “accepted deal is stale”; refresh then retry | deal finance mandate; known deal without finance role 403, concealed deal 404 |
| BE30C-18 | 201 PAYMENT_ASSERTION_RECORDED “payment evidence recorded”; no retry after commit, replay returns result | 409 ASSERTION_CONFLICT “payment assertions disagree”; no retry; 422 PAYMENT_EVIDENCE_INVALID “source fact is invalid”; no retry | payer/payee/provider source; known schedule without source authority 403, concealed schedule 404 |
| BE30C-19 | 201 OVERDUE_ACTION_RECORDED “overdue action recorded”; replay returns result | 409 VERSION_CONFLICT “schedule clock is stale”; refresh then retry; 422 READINESS_BLOCKED “overdue policy blocks action”; no retry | finance controller under policy; known schedule without role 403, concealed schedule 404 |
| BE30C-28 | 201 ANNOUNCE_CONSENT_RECORDED “announce consent recorded”; no retry after commit, replay returns result | 403 FORBIDDEN “member mandate is absent”; no retry; 409 VERSION_CONFLICT “group version is stale”; refresh then retry | exact group member mandate; known group without mandate 403, concealed group/deal 404 |
| BE30C-29 | 201 ANNOUNCE_GROUP_UPDATED “group membership recorded”; no retry after commit, replay returns result | 403 FORBIDDEN “group governance mandate is absent”; no retry; 409 VERSION_CONFLICT “membership version is stale”; refresh then retry | Musician group owner; known group without ownership 403, concealed group 404 |
| BE30C-30 | 201 EJECTION_REQUEST_RECORDED “ejection request recorded”; no retry after commit, replay returns result | 400 VALIDATION_FAILED “ejection evidence is invalid”; no retry; 403 FORBIDDEN “booking is not controlled”; no retry | Operator for own booking or group owner; known booking without control 403, concealed group 404 |
| BE30C-31 | 201 PRECONDITION_WAIVER_RECORDED “precondition waiver recorded”; no retry after commit, replay returns result | 422 PRECONDITION_NOT_WAIVABLE “precondition is not Tier 2”; no retry; 410 CAPABILITY_OR_WAIVER_EXPIRED “capability expired”; no retry | active scoped capability plus step-up; known deal without capability 403, concealed deal 404 |
| BE30C-32 | 201 WAIVE_CAPABILITY_CHANGED “waive capability changed”; no retry after commit, replay returns result | 403 FORBIDDEN “distinct approver required”; no retry; 409 VERSION_CONFLICT “capability scope is stale”; refresh then retry | governance approver distinct from holder; known scope without governance 403, concealed deal/group 404 |
| BE30C-33 | 201 SCHEDULE_SNAPSHOT_RECORDED “schedule snapshot recorded”; no retry after commit, replay returns result | 400 VALIDATION_FAILED “schedule timing is invalid”; no retry; 409 VERSION_CONFLICT “source schedule is stale”; refresh then retry | signed Shard 35 source worker; known deal without producer signature 403, concealed deal 404 |
| BE30C-34 | 201 ANNOUNCEMENT_COMMITTED “announcement committed”; no retry after commit, replay returns result | 422 READINESS_BLOCKED “announcement prerequisites are incomplete”; no retry; 409 VERSION_CONFLICT “commit versions are stale”; refresh then retry | scheduler worker or break-glass step-up; known deal without worker scope 403, concealed deal 404 |

### Per-operation middleware and output filtering

| Operation | Auth and ownership | Numeric rate limit | Validation locus | CORS policy | Output allowlist |
|---|---|---|---|---|---|
| BE30C-14 | session + binding consent administrator; absent mandate 403, concealed deal 404 | 20/hour/deal | Zod AnnounceAuthorizationRequest then readiness/policy validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | authorization id/version/scope/state/expiry; no term or member identity |
| BE30C-15 | session + document generator or binding party; absent mandate 403, concealed deal 404 | 20/hour/deal | Zod DocumentRequest then digest/template validator before enqueue | BE00-CORS-WEB-CREDENTIALLED exact origin | job/document id/status/digest/format; no artifact secret |
| BE30C-16 | session + all affected binding mandates and step-up; absent mandate 403, concealed deal 404 | 20/hour/deal | Zod AmendmentRequest then changed-term/approval validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | deal/version/state/digest/approval count; no private approvals |
| BE30C-17 | session + finance mandate; absent role 403, concealed deal 404 | 20/hour/deal | Zod PaymentScheduleRequest then row-total/currency validator before insert | BE00-CORS-WEB-CREDENTIALLED exact origin | schedule id/version/row count/state/total currency; no bank/provider secrets |
| BE30C-18 | session/provider signature + row source scope; absent scope 403, concealed schedule 404 | 120/hour/source | Zod PaymentAssertionRequest then source-fact precedence validator before insert | BE00-CORS-SERVICE-NONE for provider callbacks | assertion id/outcome/reconciled state/time; no raw evidence or provider token |
| BE30C-19 | session + finance controller and pinned overdue policy; absent role 403, concealed schedule 404 | 20/hour/deal | Zod OverdueRequest then database-clock/policy validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | schedule/version/row/state/actionAt; no private policy |
| BE30C-28 | session + exact group member mandate; absent mandate 403, concealed deal/group 404 | 60/hour/group | Zod ConsentRequest then deal/group version and principal validator before insert | BE00-CORS-WEB-CREDENTIALLED exact origin | consent id/version/outcome/scope/expiry; no reason/evidence |
| BE30C-29 | session + Musician group governance mandate; absent ownership 403, concealed group 404 | 60/hour/group | Zod MembershipRequest then expected-version/action validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | group id/version/readiness/aggregate counts; no foreign member identities |
| BE30C-30 | session + Operator booking control or Musician owner; absent control 403, concealed group 404 | 60/hour/group | Zod EjectionRequest then membership/evidence validator before insert | BE00-CORS-WEB-CREDENTIALLED exact origin | request id/state/criterion class; no foreign member identity/evidence |
| BE30C-31 | session + active scoped capability + step-up; absent capability 403, concealed deal 404 | 10/day/actor | Zod WaiverRequest then Tier-2/capability/expiry validator before lock | BE00-CORS-WEB-CREDENTIALLED exact origin | waiver id/version/precondition/state/expiry; no reason/evidence |
| BE30C-32 | session + governance approver distinct from holder; absent governance 403, concealed scope 404 | 10/day/actor | Zod CapabilityRequest then scope/approver validator before insert | BE00-CORS-WEB-CREDENTIALLED exact origin | capability id/version/state/effectiveUntil; no relationship secrets |
| BE30C-33 | signed worker principal or launch administrator; invalid signature 403, concealed deal 404 | 60/hour/deal | Zod ScheduleSnapshotRequest then source digest/time validator before insert | BE00-CORS-SERVICE-NONE for callbacks | snapshot id/version/times/source digest; no worker credentials |
| BE30C-34 | scheduler worker or step-up break-glass; invalid scope 403, concealed deal 404 | 10/min/schedule | Zod CommitAnnouncement then readiness/CAS validator before transaction | BE00-CORS-SERVICE-NONE for worker callbacks | announce record/version/state/time; no member/private terms |

### Pagination and bounded command responses

All operations are bounded commands, not collection reads; no cursor is returned. Array caps are explicit in the request schemas.

| Operation | Pagination / limit rule |
|---|---|
| BE30C-14 | N/A single authorization; reason max 1000 and one manifest response |
| BE30C-15 | N/A single generation job; template is a reference and one document response |
| BE30C-16 | N/A single amendment; changed terms max 100 keys and approvals max 20 |
| BE30C-17 | N/A single schedule command; rows max 100 and one schedule response |
| BE30C-18 | N/A single assertion; evidence refs max 30 and one assertion response |
| BE30C-19 | N/A single overdue action; reason max 1000 and one row response |
| BE30C-28 | N/A single consent; one member action and one consent response |
| BE30C-29 | N/A single membership action; one member action and aggregate response |
| BE30C-30 | N/A single ejection request; evidence refs max 50 and one request response |
| BE30C-31 | N/A single waiver; evidence refs max 30 and one waiver response |
| BE30C-32 | N/A single capability change; scope min 1 and one capability response |
| BE30C-33 | N/A single schedule snapshot; channel refs max 30 and one snapshot response |
| BE30C-34 | N/A single commit occurrence; one record response and no fan-out payload |

Logs include request/trace/operation IDs, opaque deal/group/document/schedule/assertion/capability/waiver IDs, versions/digest prefixes/state/code, counts, latency, worker/delivery attempt, and outbox age; exclude terms, amounts, parties, consents, reasons, evidence, mandates, provider/document/channel secrets. Metrics cover document generation, amendments, payment due/assertion/dispute/overdue, consent/readiness gaps, membership/ejection, capability/waiver, schedule drift/blocked/partial delivery, latency/errors/circuits/outbox. Availability 99.9%, announcement scheduler 99.95%; p99 synchronous <1.5 s; due commit drift <5 s p99. Page on announcement without readiness, duplicate occurrence, Tier-1 waiver, assertion-to-paid without precedence, schedule drift >10 s, or five-minute 5xx >1%.

Tests cover every schema/cross-field/model/event, money/row totals and assertion precedence, exact amendment approvals, document digest/supersession, consent revoke/readiness, group membership/ejection separation, capability approver/scope/expiry, closed waiver enum/single occurrence, DST/schedule/worker races, all roles/tenants/mandates/revocations, RLS/field projection/grants, idempotency conflicts, audit/outbox atomicity, dependency retries/circuits/recovery, event privacy/order/dedupe, log redaction, migration/index plans, CORS, document accessibility, and alerts. CI fails on uncovered 30.14–30.19 or 30.28–30.34, missing 14 canonical models/11 events, route collision, unstated consent/payment/announcement, direct write grant, malformed table/link, or unresolved question.

### Per-operation observability registry

| Operation ID | Structured logs and trace | Metrics and SLO | Audit, outbox, and alert |
|---|---|---|---|
| BE30C-14 | opaque deal/authorization/readiness IDs, versions, state, latency; no consent text | readiness-blocked/waiver rate, p95 <1.5 s | authorization audit and outbox; page on announce without readiness |
| BE30C-15 | opaque deal/document/job IDs, digest prefix, template version, latency; no terms | render latency/failure rate, p95 <1.5 s | document audit and render outbox; page on digest mismatch |
| BE30C-16 | opaque deal/amendment IDs, version/digest, approval count, latency; no changed terms | amendment/conflict rate, p95 <1.5 s | amendment audit/outbox; page on incomplete approval commit |
| BE30C-17 | opaque deal/schedule IDs, row count, currency class, version, latency; no amounts | schedule creation/conflict rate, p95 <1.5 s | schedule audit/outbox; page on unpinned payment policy |
| BE30C-18 | opaque schedule/assertion/source IDs, outcome, precedence state, latency; no raw evidence | assertion/dispute rate, p95 <1.5 s | assertion audit/outbox; page on precedence violation |
| BE30C-19 | opaque schedule/overdue IDs, policy version, state, latency; no private policy | overdue action/retry rate, p95 <1.5 s | overdue audit/outbox; page on automatic void inference |
| BE30C-28 | opaque group/consent/deal IDs, version, outcome, expiry; no member evidence | consent/revocation/readiness rate, p95 <1.5 s | consent audit/outbox; page on consent without mandate |
| BE30C-29 | opaque group/membership IDs, version, readiness counts, latency; no member identities | membership/readiness recompute rate, p95 <1.5 s | membership audit/outbox; page on stale readiness |
| BE30C-30 | opaque group/ejection IDs, criterion class, state, latency; no evidence | ejection request/denial rate, p95 <1.5 s | ejection audit/outbox; page on direct removal |
| BE30C-31 | opaque waiver/deal IDs, tier, capability version, expiry; no reason/evidence | waiver/blocked rate, p95 <1.5 s | waiver audit/outbox; page on Tier-1 waiver |
| BE30C-32 | opaque capability/group IDs, scope hash, version, expiry; no relationship secrets | capability grant/revoke rate, p95 <1.5 s | capability audit/outbox; page on self-approval |
| BE30C-33 | opaque deal/snapshot/channel IDs, source digest, version, latency; no credentials | snapshot drift/worker latency, p95 <1.5 s | snapshot audit/outbox; page on unsigned callback |
| BE30C-34 | opaque deal/announce IDs, readiness/version, state, latency; no private terms | commit/duplicate/drift rate, p95 <1.5 s | exactly-once announce audit/outbox; page on duplicate occurrence |

### Per-operation contract tests

| Test ID | Operation ID | Acceptance evidence |
|---|---|---|
| BE30C-T14 | BE30C-14 | authorization/readiness Zod, mandate/waiver rules, ApiError, audit/outbox, and output filtering tests pass |
| BE30C-T15 | BE30C-15 | document digest/template, renderer seam recovery, ApiError, job replay, and CORS tests pass |
| BE30C-T16 | BE30C-16 | amendment approval quorum, stale digest CAS, append-only version, ApiError, and privacy tests pass |
| BE30C-T17 | BE30C-17 | schedule row totals/currency, finance auth, idempotency race, ApiError, and amount filtering tests pass |
| BE30C-T18 | BE30C-18 | evidence precedence/dispute, provider signature, retry/circuit, ApiError, and redaction tests pass |
| BE30C-T19 | BE30C-19 | due-clock/CAS, overdue policy, retry guidance, ApiError, audit/outbox, and CORS tests pass |
| BE30C-T28 | BE30C-28 | exact-deal consent, member mandate, revocation race, ApiError, event dedupe, and output tests pass |
| BE30C-T29 | BE30C-29 | membership version/readiness recompute, governance auth, ApiError, RLS, and CORS tests pass |
| BE30C-T30 | BE30C-30 | ejection evidence privacy, membership separation, idempotency, ApiError, and audit tests pass |
| BE30C-T31 | BE30C-31 | Tier-2 subset/expiry/two-key waiver, blocked Tier-1, ApiError, and capability tests pass |
| BE30C-T32 | BE30C-32 | capability scope/approver/revoke, version race, ApiError, and secret filtering tests pass |
| BE30C-T33 | BE30C-33 | signed worker callback, schedule digest, expiry, ApiError, event order, and CORS tests pass |
| BE30C-T34 | BE30C-34 | exactly-once commit, readiness CAS, duplicate worker tick, ApiError, and announcement tests pass |

## Deepening Passes

| Pass | Question | Resolution and evidence |
|---|---|---|
| 1 cross-operation consistency | Can documents, amendments, payments, group consent, or announcement commit without one accepted deal/version? | BE30C-14 through BE30C-19 and BE30C-28 through BE30C-34 pin deal, document, schedule, group, and readiness versions; all writes use the same authority chain. |
| 2 sequencing and concurrency | What wins when approvals, assertions, amendments, or scheduler commits race? | Expected versions, approval/consent quorum, payment precedence, and serializable schedule CAS elect one result; losers receive a named conflict and refetch. |
| 3 failure cascade | What happens when rendering, payment provider, identity, or downstream schedule services fail? | Atomic domain/audit/outbox commit is withheld until local invariants pass; external work is queued with bounded retry/circuit behavior and leaves readiness blocked rather than guessed. |
| 4 authorization completeness | Are finance, governance, consent, capability, waiver, worker, and break-glass roles distinct? | The per-operation matrices name each role and mandate, use 403 for visible scope without authority and 404 for concealed scope, and require step-up for waiver/commit actions. |
| 5 observability completeness | Can an operator trace a payment or announcement while preserving privacy? | Opaque IDs, version/digest prefixes, state, counts, latency, worker/outbox age, audit, metrics, and field redaction are defined; terms, amounts, evidence, and secrets are excluded. |
| 6 abuse and limit edges | Can oversized schedules, evidence, membership, or provider callbacks bypass policy? | Strict schemas, explicit array/string caps, per-deal/group/source numeric limits, signature checks, idempotency body binding, and callback CORS policy apply to every route. |
| 7 partial-state hygiene | Can a failed amendment, assertion, waiver, or scheduler tick partially alter money or publication state? | Transaction boundaries preserve source precedence and readiness; retries replay idempotent outcomes, disputes remain disputed, and compensating jobs repair only through named commands. |

## Open Questions

None.

## Ambiguity Gate

- All 13 interactions, 14 canonical models, and 11 canonical events in this split are explicitly covered.
- Document/amendment integrity, payment evidence precedence, group consent/ejection, waive capability, Tier-2 waiver, schedule snapshot/commit, concurrency, RLS/grants, recovery, errors, SLOs, and tests are deterministic.
- Open Questions: None.
- Result: **PASS**.

## Dependency References

- [IA Shard 30](../ia/30-booking-contracts.md)
- Shards 01/04/11/14/29/30a/30b/31/35 identity, delivery, finance, engagement, venue/event, position, accepted deal, settlement, and on-sale schedule contracts.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-28 | Completed BE30C contracts, route matrices, typed persistence, state/recovery, seam, security, deepening, and ambiguity gates. |
