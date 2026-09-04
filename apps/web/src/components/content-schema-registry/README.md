# Content schema registry components

## Contents

Server-backed CMS workbenches, activation and command forms, typed status and
conflict surfaces, invalidation state, and their Slice 09 interaction tests.

## Ownership

These components own presentation and bounded interaction state for the content
schema registry. Authorization, release evidence, persistence, and lifecycle
decisions remain in the worker/API and database contracts.

The private `PLATFORM_API` read boundary emits only the allowlisted CMS read and
designer capabilities after server authentication. The Astro context consumes
that proof; missing capability metadata fails closed, and components never infer
authority from browser headers or query parameters.

## Module map

- `ContentSchemaRegistryCommandForm.tsx` — command shell and transport fields.
- `ContentSchemaRegistryFormFields.tsx` — reusable JSON, text, select, and
  checkbox controls re-exported by the command shell.
- `ContentSchemaRegistryInteractions.tsx` — compatibility barrel for the
  action bar, capability, confirmation, offline, and conflict surfaces.
- `ContentSchemaRegistryActionBar.tsx` — native command controls.
- `ContentSchemaRegistryCapabilityGate.tsx` — server-authoritative capability
  presentation.
- `ContentSchemaRegistryConfirmationStep.tsx` — activation confirmation and
  step-up state.
- `ContentSchemaRegistryOfflineStatus.tsx` — truthful connectivity status.
- `ContentSchemaRegistrySyncConflict.tsx` — explicit conflict outcomes.
- `ContentSchemaRegistryStatus.tsx` and
  `content-schema-registry-status-helpers.ts` — accessible status, retry, and
  HTTP error presentation.
- `ContentSchemaRegistryWorkbenchIsland.tsx` — serializable hydrated boundary;
  constructs canonical refetch and reconnect callbacks in the browser.
- `content-schema-registry-runtime.ts` — bounded read/mutation retry and
  canonical reconciliation contracts.
- `content-schema-registry-runtime-dom-mutations.ts` and
  `content-schema-registry-runtime-dom-feedback.ts` — progressive native-form
  enhancement, field-linked validation, conflict, auth, rate-limit, and
  degraded recovery feedback.
- `content-schema-registry-runtime-dom-refetch.ts` — one canonical protected
  GET per invalidation/reconnect, delayed loading, live announcements, safe
  replacement, and focus preservation.

## Extension rules

Keep browser code free of server secrets and private evidence. Add new commands
through the typed contracts and preserve explicit loading, failure, conflict,
and offline states in the corresponding interaction tests.

## Conventions

Use the existing `ContentSchemaRegistry` component naming and keep each
interaction state covered by its colocated test.

## Related links

- `.memory/wiki/specs/fe/03-cms-content-modeling.md`
- `.memory/wiki/operations/runbooks/content-schema-registry.md`
