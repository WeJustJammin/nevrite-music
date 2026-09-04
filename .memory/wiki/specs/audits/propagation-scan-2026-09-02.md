# Option A downstream propagation scan

**Date**: 2026-09-02  
**Status**: CONFIRMED — APPLY IN PROGRESS  
**Decision source**: [Slice 09 locked-contract reconciliation](../../../pipeline/progress/verification/2026-09-02-slice-09-contract-reconciliation.md)  
**Confirmation**: User response `a` authorizes Option A  
**Originating layer**: IA03

## Decision set

The scan treats the authorized package as one indivisible cross-layer decision:

1. Atomically create the initial content-type version aggregate.
2. Define a normative per-model envelope and exceptions matrix.
3. Separate source/default locale and use versioned workflow/default-template
   references.
4. Encode relation optionality through explicit bounds.
5. Derive activation approvals from workflow/risk policy.
6. Persist immutable compiled schema artifacts.
7. Keep block props ref/hash as identity and a signed normalized snapshot as
   release-bound evidence.
8. Add protected, capability-scoped list/detail registry reads while keeping
   public delivery in Shard 04.
9. Keep CMS-10 registration release-worker-only and human UI read-only.
10. Reject free-form validators and correct migration/event identity.

## Pre-scan classification

| Decision class                | Explicit contradiction groups                         | Classification                                                                 |
| ----------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Aggregate/data model          | `S09-R01`, `S09-R02`, `S09-R08`, `S09-R09`, `S09-R11` | Apply IA clarification, then regenerate BE storage and wire contracts.         |
| API/read ownership            | `S09-R05`                                             | Add protected list/detail ownership to 03a; retain Shard 04 public ownership.  |
| Security/workflow             | `S09-R03`, `S09-R06`, `S09-R10`                       | Apply policy-derived approvals, release-only CMS-10, and protected validators. |
| Frontend projection/ownership | `S09-R07`, `S09-R12`                                  | Regenerate concrete operations, fields, queries, errors, and workbench owners. |
| Provenance/block identity     | `S09-R04`                                             | Keep ref/hash identity and release-bound signed snapshot evidence.             |
| Events/migrations             | `S09-R13`                                             | Standardize names, counters, identifiers, and true producers.                  |

The thirteen evidence groups `S09-R01` through `S09-R13` in the decision source
are the canonical contradiction ledger. Implicit assumptions accepted for apply
are recorded separately below; previously consistent references remain unchanged
unless a generated index or source map must be refreshed.

## Must apply

| Order | Document                                                                        | Required propagation                                                                                                                           |
| ----: | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
|     1 | `ia/03-cms-content-modeling.md`                                                 | Clarify parent contracts, ownership, access, events, and model envelope.                                                                       |
|     2 | `ia/deep-dives/03-cms-content-modeling.md`                                      | Lock atomicity, canonical fields, algorithms, approval policy, artifacts, protected reads, and CMS-10 boundary.                                |
|     3 | `be/03a-content-schema-registry.md`                                             | Regenerate route registry, strict Zod contracts, persistence, policies, events, errors, and tests; add named protected list/detail operations. |
|     4 | `be/03b-editorial-workflow-publication.md`                                      | Reconcile consumed active schema/field/relation/block identifiers and artifact evidence only where the changed producer contract is inherited. |
|     5 | `be/03c-composition-taxonomy-localization.md`                                   | Reconcile block/template/locale registry references and retain template-event producer ownership.                                              |
|     6 | `fe/03-cms-content-modeling.md`                                                 | Add concrete protected reads and response discriminants; regenerate field/query/error/owner maps; remove CMS-10 browser mutation.              |
|     7 | `phases/phase-2.md`                                                             | Regenerate Slice 09 source metadata and acceptance criteria from reconciled IA/BE/FE.                                                          |
|     8 | `pipeline/progress/slices/phase-02-slice-09.md`                                 | Mirror the canonical Slice 09 plan exactly and record the cleared preflight gate.                                                              |
|     9 | `pipeline/progress/verification/2026-09-02-slice-09-contract-reconciliation.md` | Record authorization, applied resolutions, gates, and closure evidence.                                                                        |

## Generated or dependency-only refresh

- IA, BE, and FE indexes and root summaries.
- `feature-ledger.md`, `spec-pipeline.md`, and the compiled spec graph.
- Slice 10–12 dependency references only if their inherited source maps change.

## Preserved historical evidence

The 2026-08-29 ambiguity reports and their historical scope remain unchanged.
They cannot prove the reconciled corpus. Fresh IA and combined BE/FE audits must
run after propagation.

## Accepted implicit assumptions

- Protected read identity is the immutable content-type version; list results
  may summarize the current draft/active version, while detail identifies both
  `contentTypeId` and `versionId`.
- Protected reads are `GET /api/v1/cms/content-types` and
  `GET /api/v1/cms/content-types/{contentTypeId}/versions/{versionId}` with new
  sequential 03a operation IDs.
- Until Slice 12 owns the template table, `defaultTemplateVersionId` is an
  allowlisted immutable reference validated again at activation, not an unsafe
  cross-slice foreign key.
- Public delivery remains owned by Shard 04 and never reads private control-plane
  rows directly.

## Apply and verification gate

Apply in the order above. Then run fresh 83-document IA ambiguity coverage,
fresh 201-document combined BE/FE ambiguity and cross-layer checks, formatting,
progress consistency, `git diff --check`, and spec-graph compilation. Any failed
gate reopens this scan instead of allowing Slice 09 contract RED to start.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]

### References
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
