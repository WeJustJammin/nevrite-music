# AC265 source conflict and remediation proposal

Status: scope correction approved by the user on 2026-09-09 ("ac265 approved").
Apply denied-access evidence for deferred roles while retaining positive hosted
tests for authorized roles and all ten scenarios. This approval does not attest
to hosted execution or close AC265. Slice 09 remains 279/283.

## Expected versus recorded ownership

The prior record attributes missing role authority to Slice 13. Phase 2 Slice 13
actually implements menus, routes, slugs, and discovery metadata. BE03a instead
inherits principal resolution, acting context, party, capability, governance,
and disclosure from BE01a–01d. Its Cross-Shard Contracts section requires BE01
authorization facts and forbids copying identity state into CMS. The Slice 13
attribution is not a valid implementation dependency.

## Verified conflict

- Architecture's Access Control matrix gives minor/guardian no launch account role.
- Its Minors and Age-Restricted Access section requires age-18 attestation,
  blocks known under-18 registration, and forbids partially activating minor
  features. Guardian models, parental consent, safeguards, and counsel approval
  precede their future launch.
- Phase 2 Scope lock explicitly defers representation, mandates, and governance.
- FE03's rendering matrix nevertheless includes protected guardian-mandate and
  junior-restricted variants alongside business and staff variants.
- The executable hosted contract requires nine variants and ten scenarios.
  One successful Google callback cannot satisfy it.
- Production session resolution accepts presentation variants from a server
  resolver; browser labels cannot establish authority.

## Proposed correction requiring scope approval

Keep the adult-only launch boundary. Amend FE03 and Phase 2 AC265 together so
deferred role contexts require hosted denial/non-disclosure evidence rather
than successful minor/guardian sessions. Keep positive coverage for all currently
authorized CMS capabilities, with source-backed BE01 authority for each context.
Do not drop resilience scenarios, fabricate authority, or count skips as passes.

Cascade the approved distinction into the retained-report schema, verifier,
tests, hosted browser suite, runbook, and tracking using TDD. Results must
distinguish positive access from denial. Retain real IdP, RLS, MFA/step-up,
deployment identity, teardown, and all ten scenarios. Local fixtures cannot
replace hosted proof. Future positive minor/guardian access remains launch-gated.

Alternative: revise architecture and Phase 2 scope to bring forward complete
authority and safeguarding prerequisites. This expands product scope and still
requires independent minor-launch approvals before positive sessions.

## Sources

- [Architecture](../../../wiki/specs/2026-08-02-architecture-design.md), Access
  Control and Compliance — Minors and Age-Restricted Access.
- [Phase 2](../../../wiki/specs/phases/phase-2.md), Scope lock and Slice 13.
- [BE03a](../../../wiki/specs/be/03a-content-schema-registry.md), source inventory
  and Cross-Shard Contracts.
- [FE03](../../../wiki/specs/fe/03-cms-content-modeling.md), Conditional Rendering
  Matrix and Testing Obligations.
- `packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts`
- `apps/worker/src/content-schema-registry/production-auth.ts`

No provider mutation, identity creation, deployment, or hosted acceptance test
was performed during this source audit.
