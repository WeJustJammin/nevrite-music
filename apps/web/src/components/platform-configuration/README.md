# Platform configuration UI

## Contents

Server-first Astro components render the governed configuration shell and safe
projections. `SettingsFlagsRuntimeWorkbench` is the bounded React island; its
runtime, command serialization, transport validation, and presentation security
are split so authoritative Zod parsing loads only when a canonical read or
mutation needs it.

## Ownership

The server context owns session, acting-context, capability, and disclosure
decisions. Browser code may refine URL and interaction state but never grants
authority. All rendered configuration values pass the bounded presentation
sanitizer, while mutations send only named command fields with CSRF,
idempotency, and version headers.

## Slice 08 ownership

`AdminWorkspaceOperationsWorkbench` owns the active CFG-05B-01 inbox,
CFG-05B-04 grant/revoke form, and CFG-05B-05 audit/security read projection.
`admin-workspace-context.ts` performs the server-side inbox read and converts
only disclosure-safe task fields into the SSR island state. The browser facade
allowlists those three routes; CFG-05B-02 search and CFG-05B-03 bulk operations
remain absent from the route, island, and DOM.

## Extension rules

Keep authoritative validation in the server or lazy transport boundary, and keep
the initial island free of schema-library imports. New controls must fail closed,
use named command fields, and add contract, interaction, and role evidence.

The command form facade stays in `platform-configuration-forms.tsx` for stable
imports. Add new form controls in a focused `PlatformConfiguration*Form.tsx`
component, keep validation-path helpers in `platform-configuration-form-validation.ts`,
and share accessible summaries or field messages through
`PlatformConfigurationValidation.tsx`. Keep components below 200 lines and
utilities below 300 lines; re-export only the established facade API.

## Conventions

Slice-specific tests in this directory cover components, states, security,
transport, keyboard behavior, responsive composition, and contract mapping.

## Related links

Repository-level accessibility, E2E, performance, and traceability suites cover
the complete route boundary.
