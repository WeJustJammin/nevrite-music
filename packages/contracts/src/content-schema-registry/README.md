# Content schema registry contracts

## Contents

Strict request, response, event, and release-evidence schemas for the CMS
content schema registry and their Slice 09 contract tests.

The operational release-evidence sidecar is structural and fail-closed. It
binds production alerts/SLOs, hosted Auth/RLS/IdP E2E, and both manual screen-
reader platform reports to one immutable artifact without storing raw provider
payloads, credentials, tokens, or PII. Each digest has a traversal-safe relative
report path; the workflow verifier binds those references to retained files.

## Ownership

These schemas define the cross-surface boundary. They do not grant authority,
persist state, or expose private evidence; those decisions belong to the worker
and database layers.

## Extension rules

Add fields deliberately with strict validation and update the matching contract
and traceability tests. Preserve stable error codes and public/private
projection boundaries.

## Conventions

Use the existing content-schema-registry naming and export schemas through the
package contract entrypoints only.

## Related links

- `.memory/wiki/specs/be/03a-content-schema-registry.md`
- `.memory/wiki/specs/fe/03-cms-content-modeling.md`
