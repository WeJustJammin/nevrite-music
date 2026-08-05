# Decision Propagation Scan — Availability SLO

**Date:** 2026-08-02  
**Decision type:** Operating constraint  
**Originating decision:** Replace literal 100% availability outside scheduled outages with 99.9% monthly availability, excluding scheduled outages.

## Scope

Scanned 1,178 specification markdown files for the former availability wording and its downstream assumptions.

## Findings

| File | Line | Classification | Resolution |
|---|---:|---|---|
| ideation/meta/constraints.md | 286 | Explicit contradiction | Update the source constraint. |
| ideation/domain-map-proposal.md | 381 | Implicit downstream assumption | Update the operational-definition handoff. |
| architecture/prd-working/ideation-relevance-index.md | 30 | Implicit downstream assumption | Update reliability constraint. |
| architecture/prd-working/stack-synthesis.md | 72 | Implicit downstream assumption | Replace unresolved gate with confirmed SLO. |
| architecture-draft.md | 144 | Implicit downstream assumption | Replace unresolved gate with confirmed SLO. |
| architecture/prd-working/workflow-state.md | 5 | Workflow state | Advance to the hosting axis. |
| audits/run8-fresh-ideation-audit-2026-08-02.md | 27 | Historical record | Preserve unchanged; it accurately records the earlier audit state. |

## Apply Authorization

The owner confirmed the 99.9% monthly availability objective on 2026-08-02. Direct source and downstream changes are authorized.
