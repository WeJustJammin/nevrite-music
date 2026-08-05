# Deep Dive 01 — Identity authority and party governance

> **Parent IA Shard**: [../01-identity-authority.md](../01-identity-authority.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive makes Shard 01's high-risk mechanics deterministic without moving profile rendering/claiming to Shard 02, domain-specific organization attributes to their owning shards, payments to commerce, disputes to moderation, or provider/session security to Shard 00.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Party kinds, relationship authority, governance defaults, legal/public identity, and lifecycle use one canonical/versioned model. |
| What-if expansion | Concurrent edits, stale context, retroactive dates, overlapping mandates, owner loss, identifier collision, death, and partial dissolution converge. |
| Adversarial pass | Impersonation, BOLA, handle squatting, authority escalation, forged tenure, royalty diversion, false death, and operator overreach fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field, or unresolved implementation choice. |

## Resolved Product and Architecture Choices

| Source ambiguity | Locked resolution |
|---|---|
| Initial facet membership/process | Seven launch facets are ratified; platform registry is protected/versioned; users may petition through curation but cannot mint facets. |
| Dormant handle reclamation | Handles are permanent reservations/redirects and are never reissued. |
| Mandated alias transfer | Never permitted. Any contractual name owner is a separate party/ownership record evolved later, not a mandate exception. |
| Communication undo by another holder | Only the originating human may retract within 60 seconds; another holder may issue a separate corrective/retraction action with audit. |
| Acting-context revert interval | 12 hours for org/representation contexts on all devices; first binding action after any session gap requires reconfirmation. |
| Counterparty attribute confirmation | Supported as an adjacent provenance claim; it never overwrites the organization assertion or statutory source. |
| Inferred quietness | Global 12-month prompt/18-month supply suppression defaults with protected type-specific overrides; inference is never a published lifecycle state. |
| Separate legal entities vs multi-type | Different legal/payable identities are separate affiliated parties; one party may have many types only when legal/payable identity is shared. |
| Representation commercial terms | Consumer launch records scope, territory, term, optional external agreement reference; no commission calculation or built-in signing. |
| Representation overlap | Intersection of domain, territory, and effective term produces a warning; exact overlapping scope requires explicit dual confirmation, not a hard block. |
| Representation ceiling default | Null means no monetary authority; an explicit amount/currency is required for monetary acts. |
| Membership capacity storage | Child periods under one tenure; rejoin creates a new tenure. |
| Provenance/embargo mechanism | Shared platform vocabulary and timed-reveal mechanism; Shard 01 owns membership application, Shard 02 owns credit application. |
| Governance templates | Record/disclosure only for consumer launch; no legal agreement generator or legal advice. |
| Governance→mandate | Activated terms generate the current enforcement projection transactionally; defaults govern until unanimous activation. |
| New member and existing terms | Acceptance of the current version is required before current membership/authority activates. |
| Trademark registry search | Deferred; no search, clearance, verification, registration, or assurance at consumer launch. |
| Treasury model | Record and authorize only; no platform-held band pool, split routing, escrow, or tax computation before counsel/provider evolution. |
| Dissolution stakeholder standing | Notify and disclose to affected non-members; no vote unless active recorded terms explicitly grant one. |
| Dissolved-party reactivation | Dissolved is terminal. Re-formation creates a successor party and lineage/fork references; ordinary `closed` may reopen. |
| Identifier procurement | Record/verify/resolve only; helping obtain identifiers requires provider/legal evolution. |
| Estate without nomination | No automatic successor. Verified legal authority is required through a counsel-approved case before administration. |
| Estate profile removal | Approved suppression removes optional public biography/discovery while preserving minimal citation and third-party provenance. |

## Deterministic Policy Values

These values are versioned protected policy/configuration records with the listed defaults and stronger-code bounds; ordinary CMS/settings roles cannot weaken authority, evidence, privacy, or abuse safeguards.

| Policy | Default and exact behavior |
|---|---|
| Facet removal obligations | `seller`: live listing, unfulfilled order, open return, checkout in flight; `teacher`: future lesson or running cohort; `producer`: open owned project or outstanding contributor invite; `engineer|tech`: accepted-undelivered service; `performer`: future confirmed booking; `writer`: issued-unsigned split. |
| Alias quotas | Maximum 5 alias creations/person/rolling 30 days and 2 handle changes/alias/rolling 12 months. Limit adds friction/review, never transfers ownership or reissues a handle. |
| Organization creation | Duplicate detection p95 <500ms and hard 2-second bound; after bound creation commits and detection continues. Default friction review at >3 orgs/24 hours or >10 lifetime/person; never a permanent denial by count alone. |
| Quietness | Prompt after 12 months without qualifying activity; suppress from supply discovery after 18 months without response; type-specific protected overrides permitted; no public dormancy claim. |
| Acting context | Org/representation context reverts to self after 12 hours inactivity; first attested or monetary action after a session gap requires reconfirmation. |
| Departure publication | Mutual embargo maximum 180 days, auto-publishes on expiry, and either party may publish earlier; access revocation and effective end remain immediate. |
| Unadministrable succession | Offer the uncapped owning mandate to the longest-tenured remaining confirmed permanent member, notify all members, wait 14 days, and route any contest; no candidate means no automatic authority. |
| Alias transfer | Offer expires after 7 days; public transfer banner remains 30 days; full ownership history remains permanently available. |

## Canonical Field Contracts

### Party, Alias, and Legal Identity

| Model | Fields and constraints |
|---|---|
| `party` | `id uuid PK`; `kind party_kind not null`; `lifecycle party_lifecycle not null`; `version bigint > 0`; immutable kind/created metadata. |
| `person_party` | `party_id PK/FK`; `auth_user_id uuid unique null`; `account_state`; shadow people may have null Auth UUID; one live person per UUID. |
| `role_facet_assertion` | `person_id, facet_code, state, source, asserted_at, removed_at`; partial unique active person/facet; removal requires expected person version. |
| `alias_party` | `party_id PK/FK`; `display_name 1..120`; `current_handle_id`; `public_link_state private|public`; alias never stores legal identity. |
| `alias_ownership_period` | `id, alias_id, owner_person_id, starts_at, ends_at, transfer_id`; exclusion constraint prevents overlap; exactly one open period. |
| `handle_reservation` | `id, normalized_handle unique, display_handle, party_id, state active|redirect|retired, successor_handle_id?`; normalized 3..40 code points; no reuse. |
| `legal_identity` | `id, person_id, effective_from/to, encrypted/protected field references, verification_ref?, version`; periods cannot overlap. |
| `legal_disclosure_event` | append-only `id, legal_identity_id, version, recipient_party_id, purpose_code, field_codes[], actor_id, acting_party_id, occurred_at`. |

### Organization, Relationships, and Authority

| Model | Fields and constraints |
|---|---|
| `organization_party` | `party_id PK/FK, ownership_state unclaimed|owned|ownerless, inferred_quiet_at?, closing_at?, version`; lifecycle remains on `party`. |
| `organization_type_assignment` | `organization_id, type_code, starts_at, ends_at?, version`; partial unique active org/type; type code references protected registry. |
| `membership_tenure` | `id, org_id, person_id, state invited|asserted|confirmed|ended|disputed|rejected, provenance, starts_on, ends_on?, accepted_at?, revoked_at?, version`. |
| `membership_capacity_period` | `id, tenure_id, capacity permanent|touring|staff|honorary, starts_on, ends_on?`; non-overlap; contained by tenure. |
| `representation_edge` | `id, principal_party_id, representative_party_id, activities[], domains[], territories[], starts_at, ends_at, communicate, ceiling_minor?, currency?, agreement_ref?, state, version`; territories are non-empty ISO-3166-1 alpha-2 codes or the sole sentinel `WORLDWIDE`; `ends_at > starts_at`. |
| `mandate_grant` | `id, relationship_type/id, activities[], domains_mode all|explicit, domains[], ceiling_minor?, currency?, starts_at, ends_at, source default|explicit|governance, grantor_party_id, state, version`. |
| `authority_projection` | derived/current `human_id, acting_party_id, source_relationship_id, activities, domains, communicate, ceiling, term, projection_version`; never client-written authority. |

### Governance, Identifiers, and Legacy

| Model | Fields and constraints |
|---|---|
| `governance_terms_version` | `id, org_id, version_no, terms_json, document_hash, state draft|proposed|active|superseded|withdrawn, proposed_at, effective_at?`; immutable after proposed. |
| `governance_confirmation` | `terms_id, member_person_id, decision confirm|reject, identity/acting context, occurred_at`; unique member/version; rejection prevents activation. |
| `name_ownership_record` | `id, org_id, terms_version, owners[], disposition, trademark_reference?, effective_at, superseded_at?`; record/surface only. |
| `party_identifier_claim` | `id, party_id, namespace, normalized_value, capacity, provenance, verification_state, evidence_ref?, verified_at?, revoked_at?, version`; no global uniqueness until verified. |
| `identifier_collision` | `id, namespace, normalized_value, claim_ids[], state open|resolved|withdrawn, resolution_basis?, resolved_at?`; open collision blocks routing for all claims. |
| `legacy_nomination` | `id, nominator_person_id, successor_person_id, state active|revoked|superseded, created_at, revoked_at?, version`; one active nomination/person. |
| `memorialisation_case` | `id, subject_person_id, reporter_person_id?, evidence_refs[], state reported|reviewing|verified|rejected|contested, reviewer_id?, reason_code?, decided_at?`. |
| `estate_representation` | ordinary representation edge referencing verified case/legal evidence; activities/domains/term explicit; cannot grant identity/signature as deceased. |

## State Machines

| Aggregate | Allowed transitions and guards |
|---|---|
| Person account | `shadow → claimed → active → suspended|memorialised|erasure_processing`; memorialised cannot return active without protected false-report reversal. |
| Facet | `absent → active → removed → active`; remove blocked only by current closed obligation codes. |
| Alias | `active → transfer_pending → active|transferred`; `active|transferred → retired`; empty unrelied alias may delete; retired never reactivates under a new party. |
| Organization | ownership and lifecycle are orthogonal; lifecycle `active ↔ dormant`, `active|dormant → closing → closed`, band `active|dormant → dissolving → dissolved`; only closed may reopen. |
| Membership | `invited → confirmed|rejected|expired`; `asserted → confirmed|rejected|disputed`; `confirmed → ended|disputed`; immediate authority revocation is independent of contested historic end date. |
| Representation | `draft → pending → active|rejected|expired`; `active → revoked|expired`; no authority outside active term. |
| Governance terms | `draft → proposed → active|rejected|withdrawn`; active → superseded; proposed content/member set is immutable. |
| Identifier claim | `self_asserted → verifying → verified|mismatch|collision|self_asserted`; any non-revoked → revoked; collision clears only by evidence/withdrawal. |
| Memorialisation | `reported → reviewing → verified|rejected|contested`; verified triggers account/authority termination and optional estate edge. |

## Authority Resolution

For every protected command, evaluate in this order:

1. Verify Supabase session and active account; derive human/person UUID.
2. Load the requested acting party by UUID; reject client-supplied identity/role/capability claims.
3. If self, bind self authority. If alias, resolve current ownership then owner authority. If organization/represented party, load active accepted relationship.
4. Resolve current mandate source: active governance projection, explicit grant, or exact band default. Never union expired/revoked sources.
5. Require action activity; representation additionally requires action domain. Membership domains resolve to all.
6. Require `communicate` for send/reply regardless of commercial grants.
7. Require territory/term/resource relationship and exact field/action capability.
8. For a declared monetary amount, compare integer minor units and ISO currency against explicit/default ceiling; currency mismatch cannot be converted implicitly.
9. Recheck resource lifecycle, NDA/visibility/domain invariant, expected version, and RLS/RPC predicate in the committing transaction.
10. Commit mutation, authority-source snapshot, audit, idempotency, and outbox atomically.

### Band Default

- Confirmed `permanent` band membership seeds `book, sign, spend, list, release, settle, administer` across all commercial domains.
- Seed ceiling is USD 1,000 per monetary act. The owning mandate is uncapped unless active terms configure otherwise.
- `touring|staff|honorary` and all non-band memberships seed no authority.
- `communicate` is always an explicit grant.
- A configured active governance projection overrides seed values for future acts and cannot rewrite prior authority snapshots.

## Concurrency and Idempotency

- Facet, type, mandate, relationship, terms, nomination, and identifier commands require aggregate ETag/`If-Match`.
- Alias handle reservation and organization creation use a client idempotency key plus canonical normalized-request hash.
- Alias transfer acceptance locks the transfer and open ownership period; expiration/acceptance races yield one winner.
- Membership acceptance locks invitation/tenure and current terms version; stale terms produce 409 and require renewed consent.
- Governance activation locks the proposed version, expected member set, all confirmations, and current active version in one RPC.
- Relationship revocation commits revocation, authority-projection invalidation, audit, and context-revoked outbox event atomically.
- Identifier verification locks claim/collision rows; a provider result based on stale claim version is retained as attempt evidence but cannot transition state.
- Memorialisation verification locks account/case/person versions and revokes sessions/authority through an idempotent protected job.

## Disclosure, Retention, and Counsel Gates

| Data/action | Launch posture |
|---|---|
| Public identity, facets, alias links | Viewer-relative explicit projection; private alias linkage fails closed. |
| Legal identity/disclosures | Protected, purpose-limited, no client cache; disclosure ledger retained with the transaction/legal record. |
| Membership/governance | Shared/jointly authored record; erasure uses suppression/redaction/exception manifest, never silent destructive cascade. Numeric retention remains counsel-gated. |
| Identifier claims | Minimum namespace/value/capacity/provenance; provider evidence restricted; routing disabled unless eligible. |
| Death evidence and estate documents | Restricted evidence references in Storage; no ordinary support/admin access; evidence types, retention, and verification policy are counsel-gated. |
| Minor identity/professional acts | Under-18 launch registration and professional transactions blocked; no partial minor model. |
| Multi-party funds/estate distributions | Disabled until B3/provider/counsel gate; Shard 01 records authority only. |
| Trademark/legal agreements/probate | Platform records user statements/evidence but offers no legal conclusion, template advice, registry clearance, or inheritance adjudication. |

## Cross-Shard Contracts

| Consumer | Contract supplied by Shard 01 |
|---|---|
| Shard 02 profiles/claims | Party kind, alias ownership periods, public/private linkage, identity/identifier provenance, ownership state. |
| Shards 03–05 CMS/admin | Canonical party references and named platform capabilities; CMS cannot create authority. |
| Shards 06–18 collaboration/commerce/rights | Acting party, subject party, current authority snapshot, party identifier eligibility, legal-disclosure boundary. |
| Shard 37 fanbase | Alias/band lifecycle, name disposition, successor/fork lineage, memorialised projection. |
| Shard 41 finance | Party/payee identity and treasury authorization; no pooled/multi-party entitlement. |
| Shard 06 moderation | Disputed membership, identifier collision, false death, succession, merge/claim case references; moderation does not rewrite evidence. |
| Shards 25/27/29/30/37/39 | Viewer-relative party projection and consented relationship identifiers; no inferred authority. |

Every downstream command stores the `actingPartyId`, human actor, authority source relationship/mandate ID, and source version needed to explain why the act was allowed.

## Abuse and Recovery Verification

| Threat/failure | Required proof |
|---|---|
| BOLA/tenant injection | Wrong valid human/party/resource tests fail at endpoint and RLS/RPC. |
| Stale/forged JWT role | User metadata never changes authority; server projection is sole source. |
| Handle homoglyph/squatting | Confusable normalization, rate controls, permanent reservation, and no display-name uniqueness. |
| Shared-account damage | Binding/legal/money actions require current human identity and step-up; acting party remains explicit. |
| Forged membership/representation | No authority before subject acceptance; assertions remain labelled/invisible on victim profile. |
| Sub-delegation escalation | Grant subset/term/ceiling is database-checked against grantor snapshot. |
| Manager royalty/alias capture | Representation cannot transfer/retire alias or exceed scope; identifiers do not transfer with authority. |
| Identifier royalty diversion | Unverified/collision claims cannot route or prove ownership; all state changes audited. |
| False death freeze | No public/session change before protected verification; reversal runbook restores active state with audit. |
| Sole-holder death | Party becomes ownerless/unadministrable; read/history continue; succession/estate case cannot invent authority. |
| Partial external outage | Local claims/relationships remain canonical; verification delayed; no provider state silently replaces local truth. |

## Verification Questions

- Two implementers derive the same party kinds, relationship fields, states, transitions, default authority, overlap behavior, and terminal lifecycle.
- Every authority decision identifies authenticated human, acting party, relationship, mandate source/version, activity/domain, term, ceiling, and resource predicate.
- Every disclosure distinguishes public identity, protected legal identity, private linkage, assertion, verification, dispute, and counsel-gated evidence.
- Every partial failure preserves canonical state and offers a retry/review path without duplicate party, authority escalation, or lost provenance.
- Keyboard, screen-reader, responsive, zoom, focus, confirmation, and degraded-state behavior is inherited from the parent accessibility contract.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [01-identity-authority § Contracts](../01-identity-authority.md#contracts) defines commands/queries and [01-identity-authority § Event Schemas](../01-identity-authority.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-02 | Authored field, state, authority, concurrency, disclosure, dependency, and abuse contracts | /write-architecture-spec-deepen | All |
| 2026-08-05 | A-24: retargeted three Cross-Shard Contracts consumer rows from ideation-domain numbers to IA shard numbers (20→37 fanbase, 23→41 finance, 24→06 moderation) | /resolve-ambiguity | Cross-Shard Contracts |

## Dependency References

- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|WeJammin — Data Placement Strategy]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
- [[specs/data-placement-strategy|Data Placement Strategy]]
