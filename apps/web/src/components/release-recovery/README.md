# Release and recovery status

`ReleaseRecoveryStatus.astro` is the server-rendered status projection for
release promotion and recovery readiness. It receives already-verified,
serializable projections; it does not fetch, mutate, authorize, or activate a
provider.

## Contents

- `status-projection.ts` defines explicit release, recovery, and maintenance
  props plus fail-closed defaults.
- `ReleaseRecoveryStatus.astro` renders loading, error, verified, and blocked
  states with safe request IDs, retry/back links, and polite announcements.
- `../SystemStatus.astro` and `/system/degraded` pass the projections
  explicitly.
- `../../lib/release-recovery-status-focus.ts` focuses the status heading only
  after an explicit update event when focus is already on the document body.
- `../../styles/release-recovery.css` provides token-based responsive styling.

## Ownership

This directory owns the server-rendered release/recovery status projection.
Application policy and evidence validation remain upstream. Provider adapters,
deployment workflows, secrets, and protected writes do not belong here.

The degraded route defaults to blocked recovery: PITR is unavailable, measured
RPO/RTO are `null`, protected writes stay disabled, and no maintenance
exclusion is claimed. Synthetic/local fixtures never become an operational
success claim. Numeric recovery objectives are shown only when supplied by a
verified deployment projection.

The status view never displays raw provider payloads, secrets, private cached
records, or a deployment success claim without an artifact identity. Unplanned
downtime remains part of the 99.9% monthly objective; scheduled maintenance is
an exclusion only when its notice is verified at least 48 hours ahead.

## Extension

Add a new verified projection field only when its source contract and safe
failure state are defined. Preserve null/unavailable values instead of
inventing operational claims. Add an accessibility and integration assertion
for each new state or action.

## Conventions

The focus listener responds only to an explicit `wejammin:status-updated`
event and only when the document body owns focus, so status refreshes do not
steal focus from an active control. Retry is a canonical safe read; back
returns to the server-selected safe route.

## Related links

- [Infrastructure web component guidance](../infrastructure/README.md)
- [Frontend infrastructure specification](../../../../../.memory/wiki/specs/fe/00-infrastructure.md)
- [Slice 07 acceptance criteria](../../../../../.memory/pipeline/progress/slices/phase-01-slice-07.md)
