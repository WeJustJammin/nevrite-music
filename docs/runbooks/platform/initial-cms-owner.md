# Initial CMS owner

Use only for the owner-approved empty staging installation. This operation is
not a login, MFA assertion or acceptance report. Never grant another account
authority merely to fill the AC265 matrix.

## Prerequisites

Verify the deployed migration and exact project first. Resolve the confirmed
Auth account and active person using the owner-provided identity, then pin both
UUIDs. Check that no CMS/admin authority or initialization receipt exists.
Use a stable UUID authorization reference tied to the approved change record.
Choose a term ending after today's UTC date and no more than seven days away.
Date-only organization grants expire at the UTC midnight at or before that end.

The operation is `platform_private.initialize_cms_owner` with arguments in this
order: Auth UUID, person UUID, expected email, end timestamp, authorization UUID,
preview boolean. Run as the database operator against staging, first with
preview true. Check its four named capabilities and owner identity before
running with preview false. Do not put credentials, email or private identity
details in repository files or shell history.

## Result and verification

The transaction creates a private-linked WeBeJammin alias, self-member owner
organization, two CMS organization capabilities, and two organization-scoped
admin read capabilities. It creates no delegation authority, staff case,
approval or elevated-purpose grant. Existing request-time admission and MFA
requirements remain in force. The function returns the created IDs and term.

Verify exactly one initialization receipt, the explicit operator audit, one
privileged person, the four named organization grants and two admin read grants.
Verify ordinary accounts still lack CMS/admin grants. Then use a real hosted
login, select the legitimate organization context and execute the AC265 tests.
Database setup alone does not prove hosted acceptance.

## Failure and recovery

Any failure rolls back all setup effects. Do not bypass a conflict or delete the
receipt to retry. A committed setup cannot be replayed to extend grants. Handle
conflicts require identity review; expired grants require a separately reviewed
renewal path, not reopening this bootstrap. Normal revocation remains effective.
No production execution is implied by a staging result.
