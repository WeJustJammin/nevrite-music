# Initial-owner propagation

Sources: [IA05](../ia/05-platform-configuration-admin.md) and
[BE05b](../be/05b-admin-workspace-operations.md).
This correction supports Phase 2 Slice 09; it does not unlock Slice 10.

Owner delegated decisions to resolve Slice 09 and specified WeBeJammin as the
sole CMS/admin account. Inspection proved the empty-installation authority cycle:
the normal grant operation requires prior delegable authority, but both hosted
environments contain no admin grants. The selected exception is operator-only,
one-time staging initialization, not a relaxation of normal application grants.

Explicit impacted rules: IA05 grantor-subset requirements and BE05b's
grant-RPC-only insertion rule. Both now explicitly delimit the initial-owner
exception. Implicit assumptions: existing alias, organization and membership;
the procedure creates these through canonical identity operations instead.
FE03 role evidence and Slice 09's four remaining acceptance gates are unchanged.

Traceability: migration `20260910020135_initial_cms_owner_bootstrap.sql`, pgTAP
`phase_02_slice_09_owner_bootstrap.sql`, and the initial-owner runbook. RED failed
on the absent function; initial GREEN passed 25 concrete assertions. Broader
verification and hosted execution remain pending.

## Adversarial review

Authentication/privilege: no HTTP endpoint exists; revoked application-role
execution and a database-operator check reject invocation outside the operator
boundary. ID substitution fails the pinned Auth/person/email join. Input values
are SQL parameters, not dynamic SQL. The response contains only the intended
owner/setup identifiers and no email or credentials.

Misuse: preview does not write; replay cannot extend grants; existing authority
and handle collisions fail closed. Concurrent executions serialize on the
singleton and grant tables. Identity rows remain locked until transaction end.
Late failure rolls back alias, organization, membership and grants; pgTAP injects
a receipt failure to verify this path. Date-only authority expires no later than
the requested timestamp. No alternate login, MFA or evidence path is introduced.

Current verification: 29 bootstrap assertions and all 1,707 database assertions
pass. Full application validation is still running; hosted execution remains
unproven. No additional spec gap was found within this operator-only boundary.


<!-- spec-graph: auto-generated -->
## Related Specs

### Phases into
- [[specs/phases/phase-2|Phase 2 — Identity, admin, CMS/settings]]
