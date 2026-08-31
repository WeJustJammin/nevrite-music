# Generated OpenAPI contract

`openapi.json` is generated from `@wejammin/contracts`; direct edits are prohibited. Run `pnpm contracts:generate` after an approved Zod contract change and commit the regenerated artifact in the same change.

The public job-status surface contains one operation only: `GET
/api/v1/jobs/{jobId}`. `/api/v1/jobs`, extra path segments, duplicate identifiers,
and malformed identifiers are transport-validation cases, not additional
OpenAPI operations; reject them before authorization without resource
disclosure.
