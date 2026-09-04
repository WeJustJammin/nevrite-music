# Profile and portfolio components

## Contents

Server-renderable profile layers, owner command forms, bounded state helpers,
and the optional public-profile React island live here.

## Ownership

These components own safe rendering and local interaction state. Server routes
own identity, capability decisions, canonical reads, versions, and mutations.
EPK, sharing, and PDF operations remain explicitly deferred.

## Extension

Add a focused component or helper per responsibility. Preserve native forms,
contract fields, progressive enhancement, and the 200-line component and
300-line utility budgets.

## Conventions

Treat `BroadcastChannel` messages as invalidation hints only. Preserve drafts
across hydration, conflicts, rate waits, and offline recovery. Never render
private fields into a public profile response.

## Related links

See [`../../pages/profiles/`](../../pages/profiles/) for the public route,
[`../../lib/profile-portfolio-progressive.ts`](../../lib/profile-portfolio-progressive.ts)
for the progressive boundary, and `02b-profile-portfolio-epk.md` in the FE
specification corpus for the locked interaction contract.
