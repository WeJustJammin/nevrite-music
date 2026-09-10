# AC265 sole-account authority preflight

## Confirmed identity and setup-path finding

The owner clarified that WeBeJammin is the GitHub account name and intended in-app name, and authorized proceeding with staging setup. It must not be treated as an already-existing application handle.

Source inspection found that the normal admin grant operation requires `admin.capability.grant` plus delegable existing authority. No initial-admin bootstrap path was located in the inspected migrations, infrastructure, runbooks or relevant specifications. With no grants present, the normal grant flow cannot initialize itself. A first-admin bootstrap needs an explicit governed design; direct table insertion would not be the existing governed path previously promised.

The handle-change RPC is an authenticated, owner-checked alias operation with version/idempotency/audit requirements; changing a public projection row directly is not equivalent. The browser connection again returned `Transport closed`, preventing normal interactive setup here.

No identity or permission mutations were performed. The next decision is a narrowly scoped, audited initial-admin bootstrap for the sole approved account, retaining named capabilities, bounded grants, step-up requirements and no authority for other accounts.

The owner confirmed that WeBeJammin alone should have CMS/admin access; ordinary application access for other accounts is not excluded. The requested remediation order is AC265, AC209, AC211, then AC266.

Read-only hosted checks found:

| Evidence | Staging | Production |
| --- | --- | --- |
| Public projection matching WeBeJammin by handle or display name, case-insensitive | 0 | 0 |
| Active or claimed person linked to the owner-provided email | 1 | 0 |
| Admin capability grant rows | 0 | 0 |
| Active, date-valid `cms.*` organization grants | 0 | 0 |

These counts do not establish that WeBeJammin is the linked staging person. Public projections may be absent, and a provider account label is not application authority. No permissions, identities, sessions or production data were changed.

The CMS read authorization function requires a resolved person, confirmed organization membership and an active date-valid organization capability grant. An empty Auth metadata capability list is not the authoritative diagnosis; the independently queried grant tables are also empty.

Next prerequisite: establish which application identity the owner means by WeBeJammin before granting authority. Then use the governed access/bootstrap path and retain real hosted tests; do not create a second privileged account merely to fill a test matrix. AC265 remains unchecked.
