# AC265 hosted E2E runner status

**Status: blocked; no acceptance runner or report producer is implemented.**

The staging-only Playwright configuration and prerequisite validator are safety
boundaries, not evidence. The runner remains blocked until an approved,
versioned contract defines the role/session authority mapping and bounded hosted
test controls described below. Do not generate `hosted/e2e.json` from policy,
configuration, local fixtures, or partial checks.

## Locked evidence contract

The retained report must satisfy `ac265-hosted-e2e-v2` and contain all nine
roles and all ten hosted scenarios exactly once, each with a passed outcome and
bounded duration. Role assertions are fixed:

| Role                    | Required assertion     |
| ----------------------- | ---------------------- |
| `entitled_read`         | `authorized_access`    |
| `owner_full`            | `authorized_access`    |
| `guardian_mandate`      | `denied_no_disclosure` |
| `junior_restricted`     | `denied_no_disclosure` |
| `business_mandate`      | `denied_no_disclosure` |
| `staff_case_scoped`     | `authorized_access`    |
| `admin_step_up`         | `authorized_access`    |
| `forbidden_hidden`      | `denied_no_disclosure` |
| `disabled_prerequisite` | `disabled_no_mutation` |

Scenarios: `idp_sign_in`, `server_authoritative_rls`,
`keyboard_landmarks_live_regions`, `three_breakpoints`, `zoom_200`,
`offline_reconnect`, `stale_multi_tab`, `auth_expiry`, `rate_limit_429`, and
`dependency_outage`. The final report must also bind the exact immutable source
revision, staging deployment, migration, and public HTTPS origins. The schema is
strict and only accepts a passed, redacted aggregate report; it is not a place to
record a blocked or partial run.

## Current fail-closed inputs

`playwright.s09-hosted.config.ts` requires an explicit `STAGING_WEB_ORIGIN` and
one `AC265_STORAGE_STATE_<ROLE>` absolute path for every role. Origins use the
release contract's public, pathless HTTPS validation. State files must exist,
resolve outside the repository, be regular non-symlink files, and on POSIX have
the owner-read bit set with all group and other permission bits clear. Windows
runners are rejected because Node's portable filesystem metadata does not
verify owner-only Windows ACLs. Keep them outside all retained artifacts. The
validator checks file metadata only; it does not read, print, copy, or retain
cookies or credentials.

The config selects only `*.ac265-hosted.spec.ts`, defines no `webServer`, runs a
single Chromium worker without retries, and disables traces, screenshots, and
video. The global setup intentionally fails closed until the control contract is
approved. No hosted spec currently exists, and this config must not be used to
run the local role fixture as hosted evidence.

## Exact blocker before implementation can continue

The release runbook requires positive roles to prove real server capability,
ownership, case scope, and recent step-up, and requires deferred-context denial
using eligible adults without creating minors or inventing mandates. There is no
approved input contract that ties each external storage state to independently
verified server authority, identifies safe test resources, captures before/after
state for no-mutation assertions, or defines bounded setup and teardown.

There is also no approved hosted control contract for reliably and safely
exercising auth expiry, stale multi-tab state, HTTP 429, and dependency outage.
Browser-local interception would prove only a simulated client response, not a
hosted server condition. Existing storage states alone also cannot prove a fresh
Google-through-Supabase-Auth sign-in. No test-only switches or staging mutations
are authorized by the report policy.

Before adding the real runner/report producer, approve a versioned contract for:

1. Each role's outside-repository session input and independently verifiable
   authority preconditions, including current admin step-up.
2. Adult-only denied cases, protected resource references, no-disclosure and
   before/after no-mutation checks, and narrowly scoped teardown ownership.
3. Google IdP sign-in inputs and redaction/retention boundaries.
4. Bounded, staging-only controls for expiry, multi-tab staleness, rate limiting,
   and dependency failure, including their authorization, exact scope, duration,
   cleanup, and proof that production cannot be affected.
5. The immutable deployment identity inputs and the server-derived observations
   that prove each role and scenario passed.

Until that contract exists, the global setup must keep failing and no report,
role pass, scenario pass, or AC265 closure may be claimed.
