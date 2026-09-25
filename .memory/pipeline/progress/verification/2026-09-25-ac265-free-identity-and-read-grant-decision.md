# AC265 Cloud Identity Free source and single read-grant exception - owner decision record

**Date**: 2026-09-25 (local).
**Scope**: documentation only. This record persists two dated owner decisions about
the AC265 staging test-identity source and the single narrow CMS read grant that
the `entitled_read` role requires, and it resolves the matching gates recorded on
2026-09-23. It changes no code, contract, migration, workflow, secret, deployment,
account, or tracker count.

**Verdict**: both decisions are recorded; nothing is provisioned. No account,
identity, grant, mandate, organization, case, content schema, prerequisite,
credential, tenant, factor, or session exists. No criterion is closed, waived,
simulated, or inferred, and AC265 remains open.

## Status totals (unchanged)

Slice 09 remains **279/282 active** (**283 authored IDs**), Phase 2 remains
**8/17** with **1,999/2,000 active criteria**, Slice 10 remains locked on
AC209/AC211/AC265, and AC266 remains owner-deferred and unchecked. This record
moves no fraction.

## Provenance

The owner answered in this session on 2026-09-25. The original wording of the
decision reply is:

> Use Cloud Identity Free for wejamm.in as source for dedicated AC265 staging
> test identities, no paid Google Workspace; approve exactly one narrowly scoped,
> expiring cms.schema_registry.read staging test-account grant as explicit
> exception to earlier sole-admin/no-other-CMS-authority rule, with existing
> owner still sole admin and no design/admin permissions.

Also observed in the same session, immediately before that reply, through a live
read-only Chrome view of the Supabase staging dashboard: **TOTP App Authenticator
is `Enabled` on the Free plan**, SMS/phone MFA is disabled and Pro-only, and the
existing owner account `admin.wejammin@gmail.com` (UID prefix `10ac0f9b`) signs
in through Google OAuth. **Enrolled factors were not confirmed**, and no provider
setting was changed by that observation.

## Decision 1 - Cloud Identity Free is the dedicated identity source

The owner selected **Cloud Identity Free** on the owner-controlled `wejamm.in`
domain as the source of the dedicated AC265 staging test identities, with **no
paid Google Workspace** subscription. This resolves the previously open
"Cloud Identity Free vs existing Google org" gate recorded on 2026-09-23.

### Provider facts (verification, not owner choice)

These are Google-published properties of Cloud Identity Free, recorded separately
from the owner's choice so a later reader does not mistake a provider property for
a project decision:

- Cloud Identity Free provides up to **50 free user licenses**.
- Adopting it requires **creating a new Cloud Identity account/organization with a
  new administrator**, completing **domain verification** for `wejamm.in`, and
  **accepting Google's terms of service**.

### Consequence

Those provider steps are outstanding, so **nothing is provisioned** by this
record. The Google-side work stays owner-performed: no credential, tenant,
administrator, domain, or terms action is authorized to the runner, to any agent,
or to any automated step.

## Decision 2 - Exactly one narrow, expiring CMS read grant

The `entitled_read` role requires an actor holding `cms.schema_registry.read`
**without** `cms.schema_designer`, because the server resolver selects
`ownerFull` first whenever `cms.schema_designer` is present. To satisfy that role
without granting CMS design or admin authority, the owner approved **exactly one**
staging test-account grant of `cms.schema_registry.read`, narrowly scoped and
expiring, as an **explicit exception** to the earlier sole-admin /
no-other-CMS-authority rule.

Boundaries of that exception:

- The existing owner account remains the **sole admin** principal.
- The exception covers `cms.schema_registry.read` on staging only.
- **No** `cms.schema_designer` and **no** admin or design permission is granted
  to any test account.
- The grant is **narrowly scoped and expiring**; it is not a permanent grant.
- It exists to support the AC265 `entitled_read` role evidence only.

This is the dated owner exception the 2026-09-23 record required, and it is limited
to the four boundaries above. The sole-admin rule otherwise continues in force.

## Gates that remain open

None of the following may be treated as decided while it remains open:

1. **No second privileged admin test identity.** The existing owner account
   remains the sole administrator, and this record authorizes no additional
   privileged identity. The async question about a privileged admin test identity
   is answered as not needed.
2. **TOTP enrollment is unconfirmed.** The dashboard reading confirms the App
   Authenticator feature is enabled for the project, not that the administrator
   has an enrolled factor. `admin_step_up` still requires a real enrolled factor
   and a completed current-context step-up before it can pass.
3. **The step-up surface decision remains open.** Whether step-up is delivered
   through a new server-side operation or a browser Supabase session is still an
   owner architecture decision; no surface is implemented or authorized here.
4. **`staff_case_scoped` remains a scope blocker, not an account blocker.** It
   requires a current, server-verified case assignment, and the case domain is not
   in Slice 09 scope.
5. **Chrome observation does not establish a hosted runner.** A live read-only
   Chrome dashboard session was observed this session; that is not a
   Playwright-capable protected hosted runner, and the hosted browser acceptance
   gate is unchanged.
6. **Nothing created.** No credential, account, identity, grant, mandate,
   organization, case, content schema, prerequisite, tenant, factor, or session
   was created, read, or changed by this record, and no provider setting was
   mutated.

## Boundaries this record does not cross

This record does not authorize creation of a Google or Cloud Identity tenant, an
administrator, a Workspace or Cloud Identity subscription, domain verification, a
terms acceptance, any admin or CMS design grant, any second privileged account, or
any credential handling outside the owner-controlled process. It authorizes one
narrowly scoped expiring `cms.schema_registry.read` staging grant and nothing
else. It closes no criterion, produces no hosted evidence, and changes no tracker
total.

The runner contract continues to forbid the runner from creating identities,
grants, mandates, organizations, cases, content schemas, or prerequisites to make
a case pass, so provisioning and the single grant must happen outside the runner
under owner control before any hosted run.

## Local sources

- `.memory/pipeline/progress/verification/2026-09-23-ac265-dedicated-staging-test-accounts-decision.md` - the superseded-in-part record whose identity-source and sole-admin gates this record resolves.
- `.memory/pipeline/progress/verification/2026-09-10-ac265-bootstrap-plan.md` - the sole intended CMS/admin principal decision that continues to govern privileged admin identity.
- `codex/ac265-mfa-step-up-decision` at `.memory/pipeline/progress/verification/2026-09-24-ac265-mfa-step-up-surface-feasibility-decision.md` - the open step-up surface decision. This record exists **only on that unmerged branch**; it is not present on `main`, so it is cited by ref rather than as a repository path.
- `packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-role.ts` - the locked per-role assertion policy.
- `apps/worker/src/content-schema-registry/route-response.ts` - the server resolver that selects `ownerFull` ahead of `entitledRead`.
- `docs/runbooks/platform/ac265-hosted-e2e-contract-v1.md` - the locked role matrix and the no-identity-creation rule.
