# AC265 authorized initial-owner setup

## Authority and scope

The owner delegated implementation decisions required to resolve the remaining Slice 09 blockers. Work proceeds in the explicit order AC265, AC209, AC211, AC266. WeBeJammin is the intended in-app name of the owner-provided account and the sole intended CMS/admin principal. Other accounts retain ordinary application access, not CMS/admin authority.

This approval authorizes development and controlled staging execution of initial-owner setup. It does not constitute a user login, recent MFA, independent approval, hosted test result, alert receipt, or production SLO measurement. No such evidence may be synthesized.

## Verified missing prerequisites

Staging contains one active person linked to the approved email, but no aliases, organizations, confirmed owner organization memberships, CMS grants, or admin grants. Production has no active person linked to that email. Normal admin grant creation requires existing delegable authority. There is no located first-admin initialization procedure.

## Selected design

Implement an operator-only, one-time, transactional initialization procedure, not a public HTTP endpoint or an editable metadata role flag. Resolve the owner using the verified Auth identity and bind the resulting immutable person ID. Check uniqueness, confirmation, active state, absence of existing bootstrap completion and absence of conflicting CMS/admin principals before any mutation. Fail closed on all mismatches.

Create the WeBeJammin alias and an owner organization through the existing identity operations, preserving their validation, handle reservation, membership, idempotency, audit and outbox behavior. Keep public alias disclosure explicit and minimal. Add only the individually enumerated CMS/admin capabilities required for the agreed work; no wildcard, bypass-RLS flag, second privileged identity or fabricated staff case. Grants have a bounded term and remain subject to normal request-time admission, revocation and fresh step-up checks. Record operator authorization as operator initialization, never as a forged interactive user action.

The initialization transaction must retain a replay-resistant completion receipt and redacted audit evidence and must roll back completely on failure. Application roles cannot execute it. A preview reports proposed changes without modifying data. Initial rollout is staging only; production is a separate explicit promotion with a real bootstrapped identity.

## Alternatives rejected

- Direct ad hoc inserts: omit a reusable, tested and auditable initialization boundary.
- A permanent superadmin or email-based authorization exception: bypasses named capabilities and sole-account verification.
- A second privileged test account: contradicts the owner's sole CMS/admin account decision.

## Required verification before execution

Test empty-system success, duplicate/replay denial, wrong or unconfirmed identity, conflicting principals, expired grants, transaction rollback, audit provenance and denial to application roles. Verify no profile mutation or authority is granted to another account. Verify real owner access and ordinary-account denial against the hosted deployment separately. Fresh MFA and any independent-approval obligation remain external evidence requirements.

Status: approved design recorded; implementation and hosted execution are not complete. No grants or identities were changed by this document.
