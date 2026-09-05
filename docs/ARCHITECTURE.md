# WeJammin - Living Architecture Map

**Last Updated:** 2026-09-05  
**Implementation scope:** Phase 1 operational foundation plus Phase 2 Slices 01–09 identity access, authority, organizations, profile ownership, public profile/portfolio delivery, governed settings and admin workspaces, the content-schema/block registry, and its production operational-alert boundary  
**Deployment status:** The Slice 09 product surface, scheduled Cloudflare telemetry, Queue DLQ, Supabase alert-state, Email Sending adapters, and repaired auth-provider transport are live through exact SHA `b22a914327291e2895bbcc7dc8f60837c8faa0d6`. Exact-main CI `33965293079`, staging `33965655238`, and protected production `33965764707` passed; staging and production provider catalogs return HTTP `200`. Four environment-owned acceptance receipts keep Slice 09 at 279/283 and prevent Slice 10 from starting.  
**Purpose:** Evidence-backed map of the code currently on disk: entry points, module boundaries, contracts, persistence authority, Cloudflare bindings, and request/data flows.

> This document maps implemented behavior, not the larger product architecture described in `.memory/wiki/specs/2026-08-02-architecture-design.md`. Generated output (`dist/`, `.astro/`, coverage), dependency trees (`node_modules/`), and generated Cloudflare ambient declarations are excluded from the tree. Slice 07 adds governed settings; Slice 08 adds the private admin authority and workspace; Slice 09 adds eight `CMS-03A` routes, twelve private content-schema/block tables, a server-first modeling workbench, a fenced activation/migration consumer, and a fail-closed scheduled operational-alert pipeline. The Slice 09 local quality gate is green, but four environment-owned release checks keep it at 279/283 and prevent Slice 10 from starting (`.memory/pipeline/progress/slices/phase-02-slice-09.md`; `.memory/pipeline/progress/verification/2026-09-03-slice-09-external-infrastructure.md`). `CFG-05A-01` through `CFG-05A-04`, `CFG-05B-01`, `CFG-05B-04`, and the `read_audit` branch of `CFG-05B-05` are active. `CFG-05B-02`, `CFG-05B-03`, and `run_diagnostic` remain deferred/unmounted (`.memory/pipeline/progress/slices/phase-02-slice-08.md`; `.memory/wiki/operations/runbooks/platform-configuration.md`).

---

## 1. Codebase Topography and Critical Files

### Runtime and source tree

```text
/
├── apps/
│   ├── docs
│   │   ├── .vscode
│   │   │   ├── extensions.json
│   │   │   └── launch.json
│   │   ├── public
│   │   │   └── favicon.svg
│   │   ├── src
│   │   │   └── pages
│   │   │       └── index.astro
│   │   ├── .gitignore
│   │   ├── astro.config.mjs
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── web
│   │   ├── .vscode
│   │   │   ├── extensions.json
│   │   │   └── launch.json
│   │   ├── public
│   │   │   └── favicon.svg
│   │   ├── src
│   │   │   ├── components
│   │   │   │   ├── authentication
│   │   │   │   │   ├── login-method-manager
│   │   │   │   │   │   ├── AccountMergePanel.tsx
│   │   │   │   │   │   ├── api.ts
│   │   │   │   │   │   ├── LoginMethodsPanel.tsx
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   ├── types.ts
│   │   │   │   │   │   └── use-account-security.ts
│   │   │   │   │   └── LoginMethodManager.tsx
│   │   │   │   ├── identity-authority
│   │   │   │   │   ├── RelationshipCommandForms.tsx
│   │   │   │   │   ├── RelationshipMutationForm.tsx
│   │   │   │   │   ├── RelationshipReadSections.tsx
│   │   │   │   │   ├── RelationshipsAuthorityGovernanceCommands.tsx
│   │   │   │   │   ├── RelationshipsAuthorityGovernanceIsland.tsx
│   │   │   │   │   ├── RelationshipsAuthorityGovernanceWorkbench.tsx
│   │   │   │   │   ├── relationship-command-api.ts
│   │   │   │   │   ├── relationship-command-definitions.ts
│   │   │   │   │   └── relationship-form-contracts.ts
│   │   │   │   ├── infrastructure
│   │   │   │   │   ├── jobs
│   │   │   │   │   │   ├── InfrastructureJobRegions.tsx
│   │   │   │   │   │   ├── job-polling.ts
│   │   │   │   │   │   ├── job-state.ts
│   │   │   │   │   │   ├── job-time.ts
│   │   │   │   │   │   ├── JobProgress.tsx
│   │   │   │   │   │   ├── JobStatusFields.tsx
│   │   │   │   │   │   ├── JobStatusPanel.tsx
│   │   │   │   │   │   ├── JobStatusRegion.tsx
│   │   │   │   │   │   ├── OfflineIntentQueue.tsx
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   ├── realtime-coordinator.ts
│   │   │   │   │   │   ├── RealtimeRefetchStatus.tsx
│   │   │   │   │   │   ├── RetryAfterCountdown.tsx
│   │   │   │   │   │   ├── useJobPolling.ts
│   │   │   │   │   │   ├── useOfflineIntentReconciliation.ts
│   │   │   │   │   │   └── useRealtimeRefetch.ts
│   │   │   │   │   ├── provider-evidence
│   │   │   │   │   │   ├── provider-evidence-contract.ts
│   │   │   │   │   │   ├── provider-evidence-errors.ts
│   │   │   │   │   │   ├── provider-evidence-navigation.ts
│   │   │   │   │   │   ├── provider-evidence-persistence.ts
│   │   │   │   │   │   ├── provider-evidence-state.ts
│   │   │   │   │   │   ├── provider-evidence-types.ts
│   │   │   │   │   │   ├── provider-evidence.css
│   │   │   │   │   │   ├── ProviderEvidenceDetails.tsx
│   │   │   │   │   │   ├── ProviderEvidenceError.tsx
│   │   │   │   │   │   ├── ProviderEvidenceFeedback.tsx
│   │   │   │   │   │   ├── ProviderEvidencePanel.tsx
│   │   │   │   │   │   └── README.md
│   │   │   │   │   ├── upload-admission
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   ├── upload-admission-navigation.ts
│   │   │   │   │   │   ├── upload-admission-state.ts
│   │   │   │   │   │   ├── upload-admission-validation.ts
│   │   │   │   │   │   ├── upload-admission.css
│   │   │   │   │   │   ├── upload-transfer.ts
│   │   │   │   │   │   ├── UploadAdmissionActions.tsx
│   │   │   │   │   │   ├── UploadAdmissionFeedback.tsx
│   │   │   │   │   │   ├── UploadAdmissionField.tsx
│   │   │   │   │   │   ├── UploadAdmissionFields.tsx
│   │   │   │   │   │   ├── UploadAdmissionFile.tsx
│   │   │   │   │   │   ├── UploadAdmissionForm.tsx
│   │   │   │   │   │   ├── UploadAdmissionHeader.tsx
│   │   │   │   │   │   ├── UploadAdmissionReview.tsx
│   │   │   │   │   │   └── UploadAdmissionValidationSummary.tsx
│   │   │   │   │   ├── upload-completion
│   │   │   │   │   │   ├── README.md
│   │   │   │   │   │   ├── upload-completion-errors.ts
│   │   │   │   │   │   ├── upload-completion-navigation.ts
│   │   │   │   │   │   ├── upload-completion-persistence.ts
│   │   │   │   │   │   ├── upload-completion-state.ts
│   │   │   │   │   │   ├── upload-completion-validation.ts
│   │   │   │   │   │   ├── upload-completion.css
│   │   │   │   │   │   ├── UploadCompletionError.tsx
│   │   │   │   │   │   ├── UploadCompletionFeedback.tsx
│   │   │   │   │   │   ├── UploadCompletionFields.tsx
│   │   │   │   │   │   ├── UploadCompletionForm.tsx
│   │   │   │   │   │   ├── UploadCompletionResult.tsx
│   │   │   │   │   │   ├── UploadCompletionStatus.tsx
│   │   │   │   │   │   └── useUploadCompletionForm.ts
│   │   │   │   │   ├── ActionBar.tsx
│   │   │   │   │   ├── CapabilityGate.tsx
│   │   │   │   │   ├── ConfirmationStep.tsx
│   │   │   │   │   ├── DataTable.tsx
│   │   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   │   ├── FilterBar.tsx
│   │   │   │   │   ├── infrastructure-workbench-state.ts
│   │   │   │   │   ├── infrastructure-workbench-types.ts
│   │   │   │   │   ├── InfrastructureRecordDetail.tsx
│   │   │   │   │   ├── InfrastructureRecordList.tsx
│   │   │   │   │   ├── InfrastructureWorkbench.tsx
│   │   │   │   │   ├── InfrastructureWorkbenchContent.tsx
│   │   │   │   │   ├── InfrastructureWorkbenchMeta.tsx
│   │   │   │   │   ├── InfrastructureWorkbenchRuntime.tsx
│   │   │   │   │   ├── InfrastructureWorkbenchStatus.tsx
│   │   │   │   │   ├── OfflineStatus.tsx
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── SyncConflict.tsx
│   │   │   │   │   ├── useInfrastructureWorkbench-types.ts
│   │   │   │   │   └── useInfrastructureWorkbench.ts
│   │   │   │   ├── release-recovery
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── ReleaseRecoveryStatus.astro
│   │   │   │   │   ├── status-projection.ts
│   │   │   │   │   └── status-view.ts
│   │   │   │   └── SystemStatus.astro
│   │   │   ├── islands
│   │   │   ├── layouts
│   │   │   ├── lib
│   │   │   │   ├── infrastructure-accessibility.ts
│   │   │   │   ├── infrastructure-jobs.ts
│   │   │   │   ├── infrastructure-realtime.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── release-recovery-status-focus.ts
│   │   │   │   └── route-heading-focus.ts
│   │   │   ├── pages
│   │   │   │   ├── api
│   │   │   │   │   └── v1
│   │   │   │   │       ├── auth
│   │   │   │   │       │   ├── email
│   │   │   │   │       │   │   └── start.ts
│   │   │   │   │       │   ├── oauth
│   │   │   │   │       │   │   └── start.ts
│   │   │   │   │       │   ├── session
│   │   │   │   │       │   │   ├── index.ts
│   │   │   │   │       │   │   └── refresh.ts
│   │   │   │   │       │   ├── bootstrap.ts
│   │   │   │   │       │   ├── logout.ts
│   │   │   │   │       │   ├── providers.ts
│   │   │   │   │       │   └── README.md
│   │   │   │   │       ├── account
│   │   │   │   │       │   └── login-methods
│   │   │   │   │       │       ├── [provider]
│   │   │   │   │       │       │   └── link-intents.ts
│   │   │   │   │       │       ├── [identityId].ts
│   │   │   │   │       │       └── index.ts
│   │   │   │   │       ├── account-merges
│   │   │   │   │       │   ├── [mergeId]
│   │   │   │   │       │   │   ├── confirm.ts
│   │   │   │   │       │   │   ├── index.ts
│   │   │   │   │       │   │   ├── prove-duplicate.ts
│   │   │   │   │       │   │   └── README.md
│   │   │   │   │       │   └── index.ts
│   │   │   │   │       ├── membership-tenures
│   │   │   │   │       │   └── [tenureId]
│   │   │   │   │       │       ├── accept.ts
│   │   │   │   │       │       ├── capacity-periods.ts
│   │   │   │   │       │       └── end.ts
│   │   │   │   │       ├── organizations
│   │   │   │   │       │   ├── [organizationId]
│   │   │   │   │       │   │   ├── membership-assertions.ts
│   │   │   │   │       │   │   ├── membership-invitations.ts
│   │   │   │   │       │   │   ├── memberships.ts
│   │   │   │   │       │   │   └── type-assignments
│   │   │   │   │       │   │       ├── [assignmentId].ts
│   │   │   │   │       │   │       └── index.ts
│   │   │   │   │       │   ├── [organizationId].ts
│   │   │   │   │       │   └── index.ts
│   │   │   │   │       └── jobs
│   │   │   │   │           └── [jobId].ts
│   │   │   │   ├── app
│   │   │   │   │   ├── identity-authority
│   │   │   │   │   │   ├── _shell.astro
│   │   │   │   │   │   └── index.astro
│   │   │   │   │   └── infrastructure
│   │   │   │   │       ├── [recordId].astro
│   │   │   │   │       └── index.astro
│   │   │   │   ├── auth
│   │   │   │   │   ├── callback.ts
│   │   │   │   │   ├── sign-in.astro
│   │   │   │   │   ├── start.ts
│   │   │   │   │   └── README.md
│   │   │   │   ├── system
│   │   │   │   │   └── degraded.astro
│   │   │   │   ├── settings
│   │   │   │   │   └── security.astro
│   │   │   │   ├── index.astro
│   │   │   │   └── offline.astro
│   │   │   ├── pwa
│   │   │   ├── sentry
│   │   │   ├── server
│   │   │   │   ├── auth-platform-api.ts
│   │   │   │   ├── identity-authority-relationships.ts
│   │   │   │   ├── infrastructure-context.ts
│   │   │   │   ├── infrastructure-surface-projection.ts
│   │   │   │   ├── job-status-boundary-response.ts
│   │   │   │   ├── job-status-boundary-types.ts
│   │   │   │   ├── job-status-boundary.ts
│   │   │   │   ├── job-status-platform-api.ts
│   │   │   │   ├── README.md
│   │   │   │   └── upload-admission.ts
│   │   │   ├── styles
│   │   │   │   ├── infrastructure-jobs.css
│   │   │   │   ├── infrastructure.css
│   │   │   │   ├── README.md
│   │   │   │   └── release-recovery.css
│   │   │   ├── env.d.ts
│   │   │   ├── middleware.ts
│   │   │   ├── README.md
│   │   │   ├── security-headers.test.ts
│   │   │   └── security-headers.ts
│   │   ├── .gitignore
│   │   ├── astro.config.mjs
│   │   ├── edge-security-html.mjs
│   │   ├── edge-security-runtime.d.mts
│   │   ├── edge-security-runtime.mjs
│   │   ├── package.json
│   │   ├── README.md
│   │   ├── tsconfig.json
│   │   ├── wrangler.dev.jsonc
│   │   └── wrangler.jsonc
│   └── worker
│       ├── src
│       │   ├── authentication
│       │   │   ├── boundary.ts
│       │   │   ├── coverage-branches.test.ts
│       │   │   ├── index.ts
│       │   │   ├── phase-02-slice-01.test.ts
│       │   │   ├── phase-02-slice-02-route-branches.test.ts
│       │   │   ├── phase-02-slice-02-oauth-routing.test.ts
│       │   │   ├── phase-02-slice-02.test-fixtures.ts
│       │   │   ├── phase-02-slice-02.test-support.ts
│       │   │   ├── phase-02-slice-02.test.ts
│       │   │   ├── production-account-merges.ts
│       │   │   ├── production-configuration-slice-02.test.ts
│       │   │   ├── production-configuration.ts
│       │   │   ├── production-cookie.ts
│       │   │   ├── production-flows.ts
│       │   │   ├── production-http.ts
│       │   │   ├── production-login-methods.ts
│       │   │   ├── production-rate-limit.ts
│       │   │   ├── production-session.ts
│       │   │   ├── production-slice-02-security-branches.test.ts
│       │   │   ├── production-slice-02-security.test.ts
│       │   │   ├── production-slice-02.test.ts
│       │   │   ├── production-support.ts
│       │   │   ├── production-token.ts
│       │   │   ├── production.test.ts
│       │   │   ├── production.ts
│       │   │   ├── README.md
│       │   │   ├── route-support.ts
│       │   │   ├── routes-account-merges.ts
│       │   │   ├── routes-login-methods.ts
│       │   │   ├── routes-provider-access.ts
│       │   │   ├── routes-session.ts
│       │   │   ├── routes.ts
│       │   │   └── types.ts
│       │   ├── identity-authority
│       │   │   ├── handlers-relationship-capacity.ts
│       │   │   ├── handlers-relationship-membership-read.ts
│       │   │   ├── handlers-relationship-memberships.ts
│       │   │   ├── handlers-relationship-organizations.ts
│       │   │   ├── relationship-dependencies.ts
│       │   │   ├── relationship-handler-runtime.ts
│       │   │   ├── relationship-handler-support.ts
│       │   │   ├── relationship-production-http.ts
│       │   │   ├── relationship-production-request.ts
│       │   │   ├── relationship-production-support.ts
│       │   │   ├── relationship-production.ts
│       │   │   └── relationship-types.ts
│       │   ├── consumers
│       │   ├── jobs
│       │   │   ├── job-status-access.ts
│       │   │   ├── job-status-authorization.test.ts
│       │   │   ├── job-status-branches.test.ts
│       │   │   ├── job-status-production-authority-branches.test.ts
│       │   │   ├── job-status-production-authority.test.ts
│       │   │   ├── job-status-production-authority.ts
│       │   │   ├── job-status-production-parsers.ts
│       │   │   ├── job-status-production-rate.test.ts
│       │   │   ├── job-status-production-support.ts
│       │   │   ├── job-status-production.test.ts
│       │   │   ├── job-status-production.ts
│       │   │   ├── job-status-rate-limit.ts
│       │   │   ├── job-status-read.ts
│       │   │   ├── job-status-response.ts
│       │   │   ├── job-status-support.ts
│       │   │   ├── job-status-test-support.ts
│       │   │   ├── job-status-types.ts
│       │   │   ├── job-status.test.ts
│       │   │   ├── job-status.ts
│       │   │   └── README.md
│       │   ├── middleware
│       │   ├── provider-effects
│       │   │   ├── provider-effect-branches.test.ts
│       │   │   ├── provider-effect-configuration.test.ts
│       │   │   ├── provider-effect.test.ts
│       │   │   ├── provider-effect.ts
│       │   │   ├── provider-support.ts
│       │   │   ├── provider-types.ts
│       │   │   ├── provider-validation.ts
│       │   │   └── README.md
│       │   ├── routes
│       │   ├── scheduled
│       │   ├── storage
│       │   │   ├── README.md
│       │   │   ├── upload-storage.test.ts
│       │   │   ├── upload-storage.ts
│       │   │   └── upload-transfer.ts
│       │   ├── upload-admission
│       │   │   ├── README.md
│       │   │   ├── upload-intent-body.test.ts
│       │   │   ├── upload-intent-body.ts
│       │   │   ├── upload-intent-branches.test.ts
│       │   │   ├── upload-intent-command.ts
│       │   │   ├── upload-intent-p1.test.ts
│       │   │   ├── upload-intent-support.test.ts
│       │   │   ├── upload-intent-support.ts
│       │   │   ├── upload-intent-types.ts
│       │   │   ├── upload-intent-validation.test.ts
│       │   │   ├── upload-intent-validation.ts
│       │   │   ├── upload-intent.test.ts
│       │   │   └── upload-intent.ts
│       │   ├── upload-completion
│       │   │   ├── README.md
│       │   │   ├── upload-intent-completion-configuration.test.ts
│       │   │   ├── upload-intent-completion-production.test.ts
│       │   │   ├── upload-intent-completion-response.ts
│       │   │   ├── upload-intent-completion-support.test.ts
│       │   │   ├── upload-intent-completion-support.ts
│       │   │   ├── upload-intent-completion-types.ts
│       │   │   ├── upload-intent-completion.test.ts
│       │   │   └── upload-intent-completion.ts
│       │   ├── webhooks
│       │   │   ├── README.md
│       │   │   ├── webhook-body.test.ts
│       │   │   ├── webhook-body.ts
│       │   │   ├── webhook-processor-branches.test.ts
│       │   │   ├── webhook-processor.test.ts
│       │   │   ├── webhook-processor.ts
│       │   │   ├── webhook-support.ts
│       │   │   ├── webhook-types.ts
│       │   │   ├── webhook-validation.test.ts
│       │   │   ├── webhook-validation.ts
│       │   │   ├── webhook-verified.test.ts
│       │   │   └── webhook-verified.ts
│       │   ├── async-entrypoint-validation.test.ts
│       │   ├── async-entrypoint.test.ts
│       │   ├── async-entrypoint.ts
│       │   ├── async-runtime-branches.test.ts
│       │   ├── async-runtime-decisions.test.ts
│       │   ├── async-runtime-fence.test.ts
│       │   ├── async-runtime-fence.ts
│       │   ├── async-runtime-manual-review.test.ts
│       │   ├── async-runtime-support-cancellation.test.ts
│       │   ├── async-runtime-support.ts
│       │   ├── async-runtime.test.ts
│       │   ├── async-runtime.ts
│       │   ├── boundary-branches.test.ts
│       │   ├── browser-security.test.ts
│       │   ├── browser-security.ts
│       │   ├── diagnostics.test.ts
│       │   ├── diagnostics.ts
│       │   ├── index-boundaries.test.ts
│       │   ├── index.test.ts
│       │   ├── index.ts
│       │   ├── infrastructure-security-coverage.test.ts
│       │   ├── infrastructure-security-response.test.ts
│       │   ├── infrastructure-security-response.ts
│       │   ├── infrastructure-security.test.ts
│       │   ├── infrastructure-security.ts
│       │   ├── platform-surface-integration.test.ts
│       │   ├── production-composition.test.ts
│       │   ├── production-job-effect-dispatcher.test.ts
│       │   ├── production-job-effect-dispatcher.ts
│       │   ├── README.md
│       │   ├── request-boundary-command.ts
│       │   ├── request-boundary-coverage.test.ts
│       │   ├── request-boundary-reads.ts
│       │   ├── request-boundary-response.ts
│       │   ├── request-boundary-support.ts
│       │   ├── request-boundary-types.ts
│       │   ├── request-boundary.test.ts
│       │   ├── request-boundary.ts
│       │   ├── security-headers.test.ts
│       │   ├── security-headers.ts
│       │   └── worker-route-composition.ts
│       ├── .dev.vars.example
│       ├── .gitignore
│       ├── package.json
│       ├── README.md
│       ├── tsconfig.json
│       └── wrangler.jsonc
├── packages/
│   ├── application
│   │   ├── src
│   │   │   ├── infrastructure
│   │   │   │   ├── jobs
│   │   │   │   │   ├── acceptance.ts
│   │   │   │   │   ├── consumer.test.ts
│   │   │   │   │   ├── consumer.ts
│   │   │   │   │   ├── dispatch-decisions.test.ts
│   │   │   │   │   ├── dispatch.ts
│   │   │   │   │   ├── execution.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── offline.ts
│   │   │   │   │   ├── persistence.test-support.ts
│   │   │   │   │   ├── persistence.test.ts
│   │   │   │   │   ├── read-decisions.test-support.ts
│   │   │   │   │   ├── read-decisions.test.ts
│   │   │   │   │   ├── read.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── realtime.ts
│   │   │   │   │   ├── reconciliation.test.ts
│   │   │   │   │   ├── restore.ts
│   │   │   │   │   ├── runtime-safety.test.ts
│   │   │   │   │   ├── runtime-types.ts
│   │   │   │   │   ├── transition.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── provider-effects
│   │   │   │   │   ├── application-fixtures.ts
│   │   │   │   │   ├── application.test.ts
│   │   │   │   │   ├── boundary.test.ts
│   │   │   │   │   ├── edge-case-fixtures.ts
│   │   │   │   │   ├── edge-cases-failure.test.ts
│   │   │   │   │   ├── edge-cases-planning-reconciliation.test.ts
│   │   │   │   │   ├── edge-cases.test.ts
│   │   │   │   │   ├── execution-deadline.ts
│   │   │   │   │   ├── execution-support.ts
│   │   │   │   │   ├── execution.test.ts
│   │   │   │   │   ├── execution.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── payload-validation.ts
│   │   │   │   │   ├── planning.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── reconciliation.test.ts
│   │   │   │   │   ├── reconciliation.ts
│   │   │   │   │   ├── security.test.ts
│   │   │   │   │   └── types.ts
│   │   │   │   ├── release-recovery
│   │   │   │   │   ├── availability.test.ts
│   │   │   │   │   ├── availability.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── promotion.test.ts
│   │   │   │   │   ├── promotion.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── recovery.test.ts
│   │   │   │   │   └── recovery.ts
│   │   │   │   ├── upload-admission
│   │   │   │   │   ├── application.test.ts
│   │   │   │   │   ├── application.ts
│   │   │   │   │   ├── authorization.ts
│   │   │   │   │   ├── branches-validation.test.ts
│   │   │   │   │   ├── branches.test.ts
│   │   │   │   │   ├── compensation.ts
│   │   │   │   │   ├── constants.ts
│   │   │   │   │   ├── errors.ts
│   │   │   │   │   ├── idempotency.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── request-hash.ts
│   │   │   │   │   ├── resource.test.ts
│   │   │   │   │   ├── resource.ts
│   │   │   │   │   ├── security.test.ts
│   │   │   │   │   ├── types.ts
│   │   │   │   │   ├── validation.test.ts
│   │   │   │   │   └── validation.ts
│   │   │   │   ├── upload-completion
│   │   │   │   │   ├── application.branches.test.ts
│   │   │   │   │   ├── application.dependencies.test.ts
│   │   │   │   │   ├── application.test.ts
│   │   │   │   │   ├── application.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── production.ts
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── support.ts
│   │   │   │   │   ├── types.ts
│   │   │   │   │   ├── verification.test.ts
│   │   │   │   │   └── verification.ts
│   │   │   │   ├── jobs.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── security-execution.ts
│   │   │   │   ├── security-reads.ts
│   │   │   │   ├── security-support.ts
│   │   │   │   ├── security-types.ts
│   │   │   │   └── security.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── config
│   │   ├── src
│   │   │   ├── environment.schema.ts
│   │   │   ├── environment.test.ts
│   │   │   ├── environment.ts
│   │   │   └── README.md
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── contracts
│   │   ├── src
│   │   │   ├── authentication
│   │   │   │   ├── index.ts
│   │   │   │   ├── primitives.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── requests.ts
│   │   │   │   ├── resources.ts
│   │   │   │   └── routes.ts
│   │   │   ├── provider-operation
│   │   │   │   ├── effects.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── primitives.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── records.ts
│   │   │   │   └── transitions.ts
│   │   │   ├── upload-admission
│   │   │   │   ├── base.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── policy.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── request.ts
│   │   │   │   └── resource.ts
│   │   │   ├── webhook-admission
│   │   │   │   ├── helpers.ts
│   │   │   │   ├── identity.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── README.md
│   │   │   │   ├── receipt.ts
│   │   │   │   ├── registry.ts
│   │   │   │   └── request.ts
│   │   │   ├── api-error.ts
│   │   │   ├── availability-objective.ts
│   │   │   ├── core-contracts.test.ts
│   │   │   ├── identifiers.ts
│   │   │   ├── index.ts
│   │   │   ├── infrastructure-access.ts
│   │   │   ├── infrastructure-record.ts
│   │   │   ├── infrastructure-responsive.ts
│   │   │   ├── infrastructure-state.ts
│   │   │   ├── infrastructure-view-state.ts
│   │   │   ├── job-status.ts
│   │   │   ├── offline-intent.ts
│   │   │   ├── openapi.ts
│   │   │   ├── operational.ts
│   │   │   ├── platform-events.ts
│   │   │   ├── platform-registries.ts
│   │   │   ├── provider-operation.test.ts
│   │   │   ├── provider-operation.ts
│   │   │   ├── README.md
│   │   │   ├── realtime-hint.ts
│   │   │   ├── recovery-readiness.ts
│   │   │   ├── registries.test.ts
│   │   │   ├── registries.ts
│   │   │   ├── registry-contracts.ts
│   │   │   ├── release-artifact.ts
│   │   │   ├── release-recovery-common.ts
│   │   │   ├── release-recovery.test.ts
│   │   │   ├── release-recovery.ts
│   │   │   ├── request-authority-security.ts
│   │   │   ├── request-command-headers.ts
│   │   │   ├── request-command-payload.ts
│   │   │   ├── request-command-result.ts
│   │   │   ├── request-context.ts
│   │   │   ├── request-navigation-security.ts
│   │   │   ├── request-route-security.ts
│   │   │   ├── request-security.ts
│   │   │   ├── upload-admission.test.ts
│   │   │   ├── upload-admission.ts
│   │   │   ├── upload-completion.test.ts
│   │   │   ├── upload-completion.ts
│   │   │   ├── webhook-admission.test.ts
│   │   │   └── webhook-admission.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── data-access
│   │   ├── src
│   │   │   └── database.types.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── domain
│   │   └── README.md
│   ├── integrations
│   │   └── README.md
│   ├── observability
│   │   ├── src
│   │   │   ├── content-schema-registry-alert-evaluator.ts
│   │   │   ├── content-schema-registry-alert-policy.ts
│   │   │   ├── content-schema-registry-alert-thresholds.ts
│   │   │   ├── content-schema-registry-alert-types.ts
│   │   │   ├── content-schema-registry-alerts.ts
│   │   │   ├── logging.test.ts
│   │   │   ├── logging.ts
│   │   │   └── README.md
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── test-support
│   │   ├── src
│   │   │   ├── factories.ts
│   │   │   ├── index.ts
│   │   │   ├── README.md
│   │   │   └── types.ts
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   ├── ui
│   │   ├── src
│   │   │   ├── infrastructure
│   │   │   │   ├── navigation.ts
│   │   │   │   ├── network-navigation.ts
│   │   │   │   ├── presentation-access.ts
│   │   │   │   ├── presentation-responsive.ts
│   │   │   │   ├── presentation-state.ts
│   │   │   │   ├── presentation-types.ts
│   │   │   │   ├── presentation.ts
│   │   │   │   ├── query-navigation.ts
│   │   │   │   ├── README.md
│   │   │   │   └── route-navigation.ts
│   │   │   └── styles.css
│   │   ├── package.json
│   │   ├── README.md
│   │   └── tsconfig.json
│   └── README.md
├── supabase/
│   ├── migrations
│   │   ├── 20260830044317_operational_foundation.sql
│   │   ├── 20260830044624_configure_data_api_exposure.sql
│   │   ├── 20260830090000_database_harness.sql
│   │   ├── 20260830100000_persistence_authority.sql
│   │   ├── 20260830110000_persistence_service_api.sql
│   │   ├── 20260830120000_persistence_runtime_authority.sql
│   │   ├── 20260830130000_typed_restore_fence.sql
│   │   ├── 20260830135000_restore_fence_epoch_monotonicity.sql
│   │   ├── 20260830140000_upload_admission_authority.sql
│   │   ├── 20260830150000_webhook_provider_authority.sql
│   │   ├── 20260830160000_upload_completion_authority.sql
│   │   ├── 20260830170000_recovery_readiness_authority.sql
│   │   ├── 20260830180000_authority_contract_fixes.sql
│   │   ├── 20260830190000_close_legacy_authority_bypasses.sql
│   │   ├── 20260901010000_authentication_foundation.sql
│   │   ├── 20260901020000_login_methods_account_merge.sql
│   │   └── README.md
│   ├── seed
│   ├── snippets
│   ├── tests
│   │   ├── authority_closure.sql
│   │   ├── authentication_foundation.sql
│   │   ├── authority_contract_fixes.sql
│   │   ├── database_harness.sql
│   │   ├── login_methods_account_merge.sql
│   │   ├── operational_foundation.sql
│   │   ├── persistence_adapter.sql
│   │   ├── persistence_authority.sql
│   │   ├── persistence_runtime.sql
│   │   ├── README.md
│   │   ├── recovery_readiness_authority.sql
│   │   ├── upload_admission.sql
│   │   ├── upload_completion_authority.sql
│   │   └── webhook_provider_authority.sql
│   ├── .gitignore
│   ├── config.toml
│   ├── README.md
│   └── seed.sql
├── infra/
│   ├── cloudflare
│   ├── observability
│   │   ├── content-schema-registry-alert-evaluator.ts
│   │   ├── content-schema-registry-alert-thresholds.ts
│   │   ├── content-schema-registry-alert-types.ts
│   │   └── README.md
│   ├── performance
│   │   ├── api-p95-smoke.mjs
│   │   └── README.md
│   ├── scripts
│   ├── supabase
│   ├── workflows
│   │   ├── apply-hosted-migrations.sh
│   │   ├── build-immutable-artifacts.sh
│   │   ├── deploy-api-worker.sh
│   │   ├── finalize-staging-candidate.sh
│   │   ├── prepare-staging-candidate.sh
│   │   ├── read-production-candidate.sh
│   │   ├── README.md
│   │   ├── record-staging-artifacts.sh
│   │   ├── verify-ci-release-gates.sh
│   │   ├── verify-performance-evidence.ts
│   │   ├── verify-production-candidate.sh
│   │   ├── verify-staging-migration-evidence.mjs
│   │   ├── verify-production-promotion.ts
│   │   ├── verify-staging-artifacts.sh
│   │   ├── verify-staging-run.mjs
│   │   └── write-ci-gate-evidence.sh
│   ├── generate-openapi.mjs
│   ├── openapi-definitions.mjs
│   ├── openapi-document.mjs
│   ├── README.md
│   ├── sync-database-types.mjs
│   ├── verify-database.sh
│   ├── verify-release-promotion.ts
│   └── verify-staging.mjs
├── .github/
│   ├── actions
│   │   └── setup
│   │       └── action.yml
│   ├── workflows
│   │   ├── ci.yml
│   │   ├── deploy-production.yml
│   │   ├── deploy-staging.yml
│   │   └── README.md
│   ├── 10-wejammin-runners.sudoers
│   └── SECRETS.md
├── scripts/
│   ├── check-progress-consistency.mjs
│   └── verify-bundle-budget.mjs
├── tests/
│   ├── accessibility
│   │   ├── infrastructure-accessibility-contract.test.ts
│   │   ├── infrastructure-job-status.test.ts
│   │   ├── infrastructure-rendered.test.ts
│   │   ├── infrastructure-retry-after.test.ts
│   │   ├── phase-02-slice-02-login-methods.test.ts
│   │   ├── phase-1-a11y-blockers.test.ts
│   │   ├── README.md
│   │   ├── route-heading-focus.test.ts
│   │   ├── semantic-shell.test.ts
│   │   ├── slice-04-upload-admission.test.ts
│   │   ├── slice-05-upload-completion-branches.test.ts
│   │   ├── slice-05-upload-completion-controller.test.ts
│   │   ├── slice-05-upload-completion-render-branches.test.ts
│   │   ├── slice-05-upload-completion.test.ts
│   │   ├── slice-06-provider-evidence-branches.test.ts
│   │   ├── slice-06-provider-evidence-persistence.test.ts
│   │   ├── slice-06-provider-evidence.test.ts
│   │   └── slice-07-release-recovery.test.ts
│   ├── contracts
│   │   ├── access-matrix-continuation-contract.test.ts
│   │   ├── access-matrix-contract.test.ts
│   │   ├── authentication-openapi-contract.test.ts
│   │   ├── application-navigation-branch-coverage.test.ts
│   │   ├── foundation-fixtures.test.ts
│   │   ├── infrastructure-state-contract.test.ts
│   │   ├── README.md
│   │   ├── request-security-adversarial.test.ts
│   │   ├── request-security-contract.test.ts
│   │   ├── request-security-execution-contract.test.ts
│   │   ├── request-security-test-support.ts
│   │   ├── slice-03-openapi-contract.test.ts
│   │   ├── slice-03-openapi-registry-contract.test.ts
│   │   ├── slice-03-platform-contracts.test.ts
│   │   ├── slice-04-acceptance-traceability.test.ts
│   │   ├── slice-05-acceptance-traceability.test.ts
│   │   ├── slice-05-openapi-completion.test.ts
│   │   ├── slice-06-acceptance-traceability.test.ts
│   │   └── slice-07-acceptance-traceability.test.ts
│   ├── e2e
│   │   ├── authentication.spec.ts
│   │   ├── infrastructure-jobs.spec.ts
│   │   ├── infrastructure-page-surfaces.spec.ts
│   │   ├── infrastructure-shell.spec.ts
│   │   ├── infrastructure-upload-forms.spec.ts
│   │   ├── infrastructure-workbench-hydration.spec.ts
│   │   ├── phase-02-slice-02-security.spec.ts
│   │   ├── README.md
│   │   ├── scaffold.spec.ts
│   │   └── slice-07-release-recovery.spec.ts
│   ├── integration
│   │   ├── authentication-web-surface.test.ts
│   │   ├── foundation.integration.test.ts
│   │   ├── infrastructure-job-boundary.test.ts
│   │   ├── infrastructure-job-production-boundary.test.ts
│   │   ├── infrastructure-job-production-realtime.test.ts
│   │   ├── infrastructure-job-remediation.test.ts
│   │   ├── infrastructure-navigation-contract.test.ts
│   │   ├── infrastructure-offline-reconciliation.test.ts
│   │   ├── infrastructure-page-surfaces.test.ts
│   │   ├── infrastructure-realtime-refetch.test.ts
│   │   ├── infrastructure-workbench-jobs.test.ts
│   │   ├── README.md
│   │   ├── slice-04-upload-navigation.test.ts
│   │   ├── slice-05-upload-completion.integration.test.ts
│   │   ├── slice-05-upload-completion.navigation.test.ts
│   │   └── slice-07-release-recovery-status.test.ts
│   ├── performance
│   │   ├── api-p95-smoke.test.ts
│   │   ├── baseline-budget.test.ts
│   │   ├── bundle-budget.test.ts
│   │   └── README.md
│   ├── security
│   │   ├── application-security-branch-coverage.test.ts
│   │   ├── application-security-reads-branch-coverage.test.ts
│   │   ├── application-security-support-branch-coverage.test.ts
│   │   ├── infrastructure-context.test.ts
│   │   ├── infrastructure-projection-negative.test.ts
│   │   ├── infrastructure-retry-negative.test.ts
│   │   ├── README.md
│   │   └── secret-boundary.test.ts
│   ├── ci-setup-action.test.ts
│   ├── database-harness-contract.test.ts
│   ├── documentation-boundaries.test.ts
│   ├── environment-contract.test.ts
│   ├── production-promotion-guard.test.ts
│   ├── production-promotion-workflow-contract.test.ts
│   ├── promotion-performance-evidence.test.ts
│   ├── README.md
│   ├── release-identity-contract.test.ts
│   ├── release-promotion-verifier.test.ts
│   ├── staging-run-guard.test.ts
│   ├── system-shell-contract.test.ts
│   ├── validation-toolchain.test.ts
│   ├── verify-staging.test.ts
│   ├── web-ssr-deployment-contract.test.ts
│   ├── worker-wrangler-config.test.ts
│   ├── workflow-evidence-scripts.test.ts
│   └── workspace-architecture.test.ts
├── docs/openapi/
│   ├── openapi.json
│   └── README.md
├── docs/runbooks/
│   ├── auth-provider.md
│   ├── platform
│   │   ├── jobs-outbox-reconciliation.md
│   │   ├── operational-endpoints.md
│   │   ├── provider-webhook-reconciliation.md
│   │   ├── README.md
│   │   ├── release-recovery-gates.md
│   │   ├── request-security-and-interaction.md
│   │   ├── retention.md
│   │   ├── slo.md
│   │   └── upload-admission-reconciliation.md
│   └── README.md
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsconfig.base.json
├── eslint.config.js
├── vitest.config.ts
└── playwright.config.ts
```

### Phase 2 profile, portfolio, configuration, and admin implementation delta

The base tree above is complemented by these exact Slice 05–07 runtime roots:

```text
apps/web/public/
├── profile-portfolio-offline.js
├── profile-portfolio-sw.js
└── README.md
apps/web/src/components/
├── profile-ownership/       # claim/list/detail/native-command workbench
└── profile-portfolio/       # public layers, editor, filters, status, controller
apps/web/src/pages/
├── profiles/[partyId].astro
├── app/profiles-verification/{index,[recordId],_shell}.astro
└── api/v1/
    ├── profiles/[partyId].ts
    ├── profiles/[partyId]/{emphasis,portfolio,reel,reel-items}.ts
    └── reel-items/[reelItemId].ts
apps/web/src/server/
├── profile-ownership-{context,platform-api}.ts
├── profile-portfolio-{api-route,app-state,context,local-binding}.ts
└── profile-portfolio-{page-state,platform-api,projection,route-contracts,ssr}.ts
apps/worker/src/
├── profile-ownership/       # PRF-API-01..08 runtime and production adapters
└── profile-portfolio/       # PRF-PROF-01..11 runtime and production adapters
packages/contracts/src/
├── profiles-verification/   # active/deferred PRF-API registry and policy
└── profile-portfolio/       # schemas, events, active/deferred registry, OpenAPI
supabase/migrations/
├── 20260901050000_profile_ownership_authority.sql
├── 20260901051000_profile_ownership_commands.sql
├── 20260901060000_profile_portfolio_authority.sql
├── 20260901060500_profile_event_contract.sql
├── 20260901061000_profile_portfolio_guards.sql
├── 20260901061500_profile_projection_ingress.sql
├── 20260901062000_profile_portfolio_commands.sql
├── 20260901062100_profile_reel_commands.sql
├── 20260901062200_profile_portfolio_wrappers.sql
├── 20260901070000_platform_configuration_authority.sql
├── 20260901071000_platform_configuration_commands.sql
├── 20260901071500_platform_configuration_runtime_commands.sql
└── 20260901072000_platform_configuration_wrappers.sql
apps/web/src/components/
└── platform-configuration/ # SSR shell, bounded workbench, commands, transport, presentation security
apps/web/src/pages/
├── app/platform-configuration-admin/{index,[recordId]}.astro
└── api/v1/
    ├── config/[key]/effective.ts
    └── admin/settings/{[definitionId]/changes,changes/[reviewId]/actions}.ts
apps/web/src/server/
└── platform-configuration-*.ts # verified context, app state, safe projection, binding façade
apps/worker/src/
└── platform-configuration/ # CFG-05A-01..04 route/runtime/production adapters and telemetry
packages/contracts/src/
└── platform-configuration/ # strict settings, event, telemetry, and active route contracts
supabase/tests/
└── phase_02_slice_07_{schema,boundaries,behavior,authority_security,deferred_controls}.sql
tests/
├── accessibility/phase-02-slice-07-*.test.ts
├── contracts/{phase-02-slice-07-*,slice-07-acceptance-traceability}.test.ts
├── e2e/phase-02-slice-07-behavior.spec.ts
└── performance/bundle-budget.test.ts
```

Slice 08 adds the active admin shell and its server/data boundaries:

```text
apps/web/src/pages/app/platform-configuration-admin/
├── index.astro
└── [recordId].astro
apps/web/src/pages/api/v1/admin/
├── inbox.ts
├── capability-grants/actions.ts
└── audit-diagnostics/actions.ts
apps/web/src/server/
└── admin-workspace-context.ts
apps/web/src/components/platform-configuration/
├── AdminWorkspaceOperationsWorkbench.tsx
├── AdminWorkspaceActiveView.tsx
├── AdminWorkspaceInbox.tsx
├── AdminWorkspaceActionViews.tsx
├── AdminWorkspaceStatus.tsx
├── CapabilityGate.tsx
├── DataTable.tsx
├── FilterBar.tsx
├── ActionBar.tsx
├── SyncConflict.tsx
├── OfflineStatus.tsx
└── admin-workspace-{types,view-utils}.ts
apps/worker/src/platform-configuration/
├── admin-route-admission.ts
├── admin-route-runtime.ts
├── admin-route-support.ts
├── admin-runtime-port.ts
├── admin-telemetry.ts
└── production-context.ts
packages/contracts/src/platform-configuration/
├── admin-{common,inbox,capability,diagnostic,workspace}.ts
├── admin-{active-routes,deferred-routes,route-policy,route-registry}.ts
└── admin-{route-contracts,routes}.ts
supabase/migrations/
└── 20260902070000_admin_workspace_authority.sql
supabase/tests/
├── phase_02_slice_08_{security,inbox,audit,context_capabilities}_reaudit.sql
└── phase_02_slice_08_{schema,boundaries,behavior,authority_security,deferred_controls}.sql
tests/
├── accessibility/phase-02-slice-08-admin-workspace.test.ts
├── contracts/{phase-02-slice-08-*,slice-08-acceptance-traceability}.test.ts
├── e2e/phase-02-slice-08-admin-workspace.spec.ts
└── integration/phase-02-slice-08-closeout-evidence.test.ts
```

The S08 migration defines seven private `platform_private` tables: task
projections, capability grants, bulk-operation manifests and item results,
audit links, diagnostic definition versions, and diagnostic runs. Every table
is RLS-enabled and forced; service-role access is limited to the named
`platform_api` functions (`supabase/migrations/20260902070000_admin_workspace_authority.sql:89-454,484-516,1328-1337`).

Slice 09 adds the active content-schema and block-registry surface:

```text
apps/web/src/pages/app/cms-content-modeling/
├── index.astro
└── [contentTypeId]/versions/[versionId].astro
apps/web/src/components/
└── content-schema-registry/ # SSR-safe list/detail/forms, bounded island, reconciliation
apps/web/src/server/
└── content-schema-registry-*.ts # session/context projection and PLATFORM_API adapters
apps/worker/src/
└── content-schema-registry/ # CMS-03A-01..08, migration consumer, telemetry aggregation, scheduled alert adapters
packages/contracts/src/
└── content-schema-registry/ # strict resources, requests, policy, OpenAPI, evidence
packages/observability/src/
└── content-schema-registry-alert-*.ts # provider-neutral thresholds, evaluation, and redaction policy
supabase/migrations/
├── 20260902080000_content_schema_registry_authority.sql
└── 20260905080000_content_schema_registry_operational_alerts.sql
supabase/tests/
├── phase_02_slice_09_schema.sql
└── phase_02_slice_09_schema/ # split pgTAP plus independent-session harness
tests/
├── accessibility/phase-02-slice-09-*.test.ts
├── contracts/phase-02-slice-09-*.test.ts
├── e2e/phase-02-slice-09-*.spec.ts
├── integration/phase-02-slice-09-*.test.ts
├── observability/phase-02-slice-09-*.test.ts
└── security/phase-02-slice-09-*.test.ts
```

The S09 migration defines twelve forced-RLS `platform_private` tables for
immutable content types/versions, fields, relations, template/capability
bindings, migration plans/artifacts/dry-runs, release nonce receipts, block
versions, and append-only lifecycle events. Protected `platform_api` wrappers
own human reads/commands and the migration worker's lease, batch,
verification, reconciliation, rollback, event claim/release/ACK, and
dead-letter transitions
(`supabase/migrations/20260902080000_content_schema_registry_authority.sql`).

Together, the base tree and delta are the current inventory of the listed source, infrastructure, test, OpenAPI, and runbook roots. Empty future-facing directories (`apps/worker/src/consumers`, `middleware`, `routes`, `scheduled`; `apps/web/src/islands`, `layouts`, `pwa`, `sentry`; and `infra/cloudflare`, `scripts`) contain no implementation files and are intentionally not presented as active modules.

### Critical files

| File                                                                                                                                   | Current responsibility                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/worker/src/index.ts:135-270`                                                                                                     | Creates the Hono application, installs the global correlation/security/logging middleware, composes HTTP routes, validates server bindings, and exports Cloudflare `fetch`, `queue`, and `scheduled` entry points.                                          |
| `apps/worker/src/worker-route-composition.ts`                                                                                          | Registers health, readiness, job, authentication, identity, profile, platform-configuration, active admin workspace, content-schema registry, upload, optional webhook, 404, and error routes.                                                              |
| `apps/worker/src/authentication/routes*.ts`                                                                                            | Composes fifteen authentication Hono boundaries split by provider access, sessions, login methods, and account merges; shared support enforces policies, rate headers, CSRF/idempotency/CAS, step-up, and typed errors.                                     |
| `apps/worker/src/authentication/production*.ts`                                                                                        | Adapts authentication ports to Supabase Auth and protected `platform_api` RPCs through bounded configuration, HTTP, cookie, token, flow, session, login-method, merge, and rate-limit modules.                                                              |
| `apps/worker/src/identity-authority/handlers-relationship-*.ts`                                                                        | Implements the ten active ORG/TYPE/MEM Hono boundaries with strict parsing, session-derived authority, capability/visibility checks, rate/deadline policy, and typed recovery.                                                                              |
| `apps/worker/src/identity-authority/relationship-production*.ts`                                                                       | Adapts relationship ports to protected `platform_api` RPCs, forwards trusted context/CAS/hash evidence, validates canonical resources, and performs resource-specific replay rereads.                                                                       |
| `apps/worker/src/profile-portfolio/routes.ts` and `route-registration.ts`                                                              | Mount the eleven active `PRF-PROF-*` Hono routes with strict admission, server-derived authority, registry rate/deadline policy, typed recovery, and an explicit unmounted EPK boundary.                                                                    |
| `apps/worker/src/profile-portfolio/production.ts` and `runtime-port.ts`                                                                | Adapt profile reads, section/emphasis/reel commands, and observation ingress to service-role-only Supabase RPCs with bounded hash-only event production and strict response validation.                                                                     |
| `apps/worker/src/platform-configuration/routes.ts`, `route-runtime.ts`, and `admin-route-runtime.ts`                                   | Mount `CFG-05A-01..04` plus active `CFG-05B-01`, `CFG-05B-04`, and `CFG-05B-05` (`read_audit` only); derive authority server-side and enforce strict parsing, scope/capability, CSRF, step-up, rate, deadline, idempotency, CAS, and typed recovery.        |
| `apps/worker/src/platform-configuration/admin-route-admission.ts`, `admin-route-support.ts`, and `admin-runtime-port.ts`               | Admit the authenticated admin workspace, validate the server-owned request context and named capability, parse inbox filters, propagate abort/deadline state, and validate bounded RPC responses with telemetry.                                            |
| `apps/worker/src/platform-configuration/production.ts`, `production-request.ts`, and `production-context.ts`                           | Adapt settings and active admin operations to named service-role `platform_api` RPCs, including server-only `admin_context_capabilities`; strict production defaults fail closed when authorization context is unavailable.                                 |
| `apps/worker/src/content-schema-registry/routes.ts`, `route-registration.ts`, and `route-*.ts`                                         | Mount all eight `CMS-03A` operations with strict request/response parsing, server-derived human or signed-release authority, capability, CSRF/CORS, raw-body signature, idempotency/CAS, rate, deadline, and typed recovery policy.                         |
| `apps/worker/src/content-schema-registry/production*.ts`                                                                               | Adapt registry reads and commands to named service-role `platform_api` RPCs, validate canonical responses, verify release signatures/nonces before JSON parsing, and emit redacted operation telemetry.                                                     |
| `apps/worker/src/content-schema-registry/migration-worker-*.ts`                                                                        | Consume schema-activation events through plan validation, fenced event and plan leases, dry-run/backfill/verification, activation reconciliation, rollback, full-identity ACK/release/dead-letter, and typed retry/terminal outcomes.                       |
| `apps/worker/src/content-schema-registry/operational-alert-*.ts`                                                                       | Aggregate redacted registry logs plus Queue and database state, evaluate all twelve alert conditions, claim a deduplicated alert receipt, deliver through Cloudflare Email Sending, and complete the receipt without exposing claim tokens or payload data. |
| `apps/web/astro.config.mjs:35-99`                                                                                                      | Configures Astro SSR, React, Cloudflare, and the post-build outer security wrapper protecting adapter and static-asset responses.                                                                                                                           |
| `apps/web/src/pages/app/infrastructure/index.astro:18-138`                                                                             | Server-authorized infrastructure list route; redirects unauthenticated users, returns non-disclosing failures, projects permitted props, then hydrates the bounded workbench with `client:visible`.                                                         |
| `apps/web/src/pages/app/infrastructure/[recordId].astro:18-140`                                                                        | Equivalent record-detail SSR route with validated record identity and the same authority/projection boundary.                                                                                                                                               |
| `apps/web/src/pages/api/v1/jobs/[jobId].ts:10-23`                                                                                      | Same-origin browser façade for job reads; resolves test ports or the `PLATFORM_API` service binding.                                                                                                                                                        |
| `apps/web/src/pages/auth/sign-in.astro:14-149`                                                                                         | Server-rendered email/recovery and provider sign-in surface; normalizes return targets, renders provider availability, and posts only to the server action.                                                                                                 |
| `apps/web/src/pages/settings/security.astro`                                                                                           | Server-rendered self-service security page; loads the caller's bounded login-method projection and hydrates the account-security island without account-discovery data.                                                                                     |
| `apps/web/src/components/authentication/LoginMethodManager.tsx`                                                                        | Bounded React island for link, unlink, duplicate proof, conflict acknowledgement, and merge confirmation using same-origin Astro façades.                                                                                                                   |
| `apps/web/src/components/identity-authority/RelationshipsAuthorityGovernanceWorkbench.tsx`                                             | Bounded server-first relationship workbench for organization creation/read, type-assignment mutation, and membership invitation/assertion/acceptance/end/capacity commands.                                                                                 |
| `apps/web/src/pages/profiles/[partyId].astro`                                                                                          | Viewer-safe public-profile SSR route with cache-bounded offline fallback; it renders only the canonical public projection and never requires account authentication.                                                                                        |
| `apps/web/src/pages/app/profiles-verification/index.astro`                                                                             | Authenticated Profile/Portfolio SSR composition; server derives actor, acting party, capabilities, CSRF, version, and canonical projection before emitting native forms.                                                                                    |
| `apps/web/src/pages/app/platform-configuration-admin/index.astro` and `[recordId].astro`                                               | Authenticated settings/admin SSR routes; ignore URL role labels, resolve session/identity/acting context and trusted capability metadata, and compose effective settings with inbox, grants, and audit views under fail-closed gates.                       |
| `apps/web/src/pages/app/cms-content-modeling/index.astro` and `[contentTypeId]/versions/[versionId].astro`                             | Authenticated server-first registry list/detail and native mutation routes; derive session/acting context/capabilities, project disclosure-safe state, and forward mutations through the `PLATFORM_API` binding.                                            |
| `apps/web/src/components/content-schema-registry/`                                                                                     | Bounded list/detail/create/field/relation/activation workbench with native forms, capability gates, exact recovery copy, focus/conflict handling, canonical refetch, and invalidation-only cross-tab signals.                                               |
| `apps/web/src/server/content-schema-registry-*.ts`                                                                                     | Resolve trusted page authority and canonical list/detail state, validate Worker responses, sanitize failures, and forward only allowlisted cookies and mutation headers through `PLATFORM_API`.                                                             |
| `apps/web/src/pages/api/v1/admin/{inbox,capability-grants/actions,audit-diagnostics/actions}.ts`                                       | Same-origin Astro façades for the three active admin operations; forward only allowlisted cookies, CSRF/origin, idempotency, conditional-version, and tracing headers through `PLATFORM_API`.                                                               |
| `apps/web/src/components/platform-configuration/SettingsFlagsRuntimeWorkbench.tsx`                                                     | Server-first bounded island for effective reads and governed proposal/action commands with local validation, canonical response replacement, conflict recovery, and invalidation-only Realtime.                                                             |
| `apps/web/src/components/platform-configuration/AdminWorkspaceOperationsWorkbench.tsx` and `AdminWorkspaceActiveView.tsx`              | Server-first admin shell with inbox, capability-grant, and audit tabs; renders truthful read-only/partial/hidden capability gates, conflict recovery, request IDs, and native-form fallbacks.                                                               |
| `apps/web/src/components/platform-configuration/{AdminWorkspaceInbox,AdminWorkspaceActionViews,DataTable,FilterBar,ActionBar}.tsx`     | Bounded task projection list/detail and action views with freshness, filters/sort, pagination, no-JavaScript forms, and disclosure-safe audit/grant presentation.                                                                                           |
| `apps/web/src/server/admin-workspace-context.ts`                                                                                       | Resolves the admin workspace projection through same-origin `PLATFORM_API`, validates the inbox resource, merges only trusted capability metadata, and computes access/freshness state for SSR.                                                             |
| `apps/web/src/server/platform-configuration-context.ts` and `platform-configuration-platform-api.ts`                                   | Resolve trusted actor/context/capability state, sanitize rendered values, and forward only allowlisted same-origin cookies and mutation headers through `PLATFORM_API`.                                                                                     |
| `apps/web/src/lib/profile-portfolio-progressive.ts`                                                                                    | Progressive mutation, draft, error, rate-wait, retry, and cross-tab invalidation boundary for the SSR app surface; browser hints never become canonical state.                                                                                              |
| `apps/web/src/server/profile-portfolio-context.ts`                                                                                     | Separates public and authenticated profile reads, resolves identity/acting context server-side, validates the canonical projection, and collapses disclosure-sensitive failures.                                                                            |
| `apps/web/src/server/profile-portfolio-platform-api.ts`                                                                                | Same-origin facade allowlisting session cookies and conditional/idempotency/CSRF headers while validating the `PLATFORM_API` binding and upstream content type.                                                                                             |
| `apps/web/src/server/auth-platform-api.ts`                                                                                             | Same-origin authentication façade that forwards only allowlisted headers/cookies through `PLATFORM_API` and converts unavailable or non-JSON upstream failures to typed 503 responses.                                                                      |
| `apps/web/src/server/identity-authority-relationships.ts`                                                                              | Same-origin relationship façade that preserves opaque target IDs, JSON bodies, CSRF, idempotency, conditional versions, and strict Worker response validation.                                                                                              |
| `apps/web/src/server/job-status-platform-api.ts:97-212`                                                                                | Forwards authenticated job reads to the API Worker, preserves ETag behavior, and validates the response with `JobStatusTransportSchema`.                                                                                                                    |
| `packages/contracts/src/authentication/`                                                                                               | Strict authentication primitives, request/resource contracts, provider and login-method projections, account-merge resources, return-target constraints, and route policies for active `AUTH-API-01` through `15`.                                          |
| `packages/contracts/src/identity-authority/relationship-*.ts`                                                                          | Strict relationship primitives, requests/resources, bounded collections, 30-operation route registry, active ORG/TYPE/MEM API map, and future representation/governance/lifecycle contract boundaries.                                                      |
| `packages/contracts/src/profile-portfolio/`                                                                                            | Strict profile, section, emphasis, portfolio, reel, observation, event, route-policy, registry, and OpenAPI contracts; active `PRF-PROF-01..11` and catalog-only `PRF-EPK-01..08` remain separate.                                                          |
| `packages/contracts/src/platform-configuration/`                                                                                       | Strict bounded primitives, settings and admin requests/resources, identifier-only events, redacted telemetry, and separate active/deferred admin route registries and contracts.                                                                            |
| `packages/contracts/src/content-schema-registry/`                                                                                      | Strict content-type/field/relation/activation/block resources, browser-safe projections, eight route policies, OpenAPI operations, migration events, and immutable operational release-evidence schemas.                                                    |
| `packages/observability/src/content-schema-registry-alert-*.ts`                                                                        | Provider-neutral alert thresholds, snapshot/result types, twelve-condition evaluator, safe-code policy, and redacted subject/body rendering shared by Worker and infrastructure tests.                                                                      |
| `packages/contracts/src/platform-registries.ts`                                                                                        | Authoritative route, consumer, retention, and SLO registry, including all fifteen active authentication routes.                                                                                                                                             |
| `packages/config/src/environment.schema.ts:51-101`                                                                                     | Strict server/browser environment allowlists and production HTTPS enforcement.                                                                                                                                                                              |
| `packages/application/src/infrastructure/`                                                                                             | Provider-neutral application decisions for security, jobs/outbox, uploads, provider effects, and release recovery.                                                                                                                                          |
| `packages/data-access/src/database.types.ts`                                                                                           | Generated TypeScript representation of the current Supabase schema; synchronization is enforced by `db:types:check`.                                                                                                                                        |
| `supabase/migrations/20260901010000_authentication_foundation.sql`                                                                     | Private party/person/context and identity-provider/session/intent/rate/security authority with forced RLS and transactional `platform_api` façades.                                                                                                         |
| `supabase/migrations/20260901020000_login_methods_account_merge.sql`                                                                   | Forced-RLS login-identity registry, merge cases/conflicts/redirects, atomic audit/outbox/idempotency effects, and seven protected login-method/merge RPCs.                                                                                                  |
| `supabase/migrations/20260901040000_relationships_authority_governance.sql`                                                            | Forced-RLS organization/type/membership authority, versioned transitions, governance confirmation, capability checks, replay/read RPCs, and atomic audit/outbox/idempotency effects.                                                                        |
| `supabase/migrations/20260902080000_content_schema_registry_authority.sql`                                                             | Twelve-table forced-RLS content-schema/block authority with immutable versioning, activation gates, release nonce/signature evidence, migration orchestration, fenced event claims, recovery, and protected JSONB RPC façades.                              |
| `supabase/migrations/20260905080000_content_schema_registry_operational_alerts.sql`                                                    | Forced-RLS operational-alert receipts plus service-only snapshot, claim, and completion RPCs with UUID-token hashing and server-time deduplication windows.                                                                                                 |
| `supabase/migrations/20260901060000_profile_portfolio_authority.sql` through `20260901062200_profile_portfolio_wrappers.sql`           | Forced-RLS profile/revision/emphasis/reel/projection authority, guarded observation ingress, atomic command RPCs, audit/outbox/idempotency effects, and service-role wrappers.                                                                              |
| `supabase/migrations/20260901070000_platform_configuration_authority.sql` through `20260901072000_platform_configuration_wrappers.sql` | Forced-RLS versioned definitions/values/reviews/approvals/snapshots and deferred control invariants, atomic registration/change/action RPCs, forward rollback, audit/outbox/idempotency, and service-role wrappers.                                         |
| `supabase/migrations/20260902070000_admin_workspace_authority.sql`                                                                     | Seven private forced-RLS admin tables plus `admin_inbox`, `admin_context_capabilities`, `admin_capability_action`, and `admin_audit_diagnostic`; enforces scope, freshness, pagination, CAS, idempotency, audit/outbox, and service-role-only execution.    |
| `infra/generate-openapi.mjs` and `docs/openapi/openapi.json`                                                                           | Deterministic OpenAPI generation and checked-in generated contract.                                                                                                                                                                                         |
| `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml`                                                              | Immutable build, test, staging promotion, and guarded manual production workflows.                                                                                                                                                                          |
| `package.json:8-39`                                                                                                                    | Canonical workspace commands; `validate` sequences contract/type/progress checks, format/lint/type-check, coverage, E2E, build, bundle budget, and p95 smoke.                                                                                               |

---

## 2. Infrastructure and Explicit Data Flow

### Deployment units and bindings

| Unit       | Entry                               | Bindings and configuration                                                                                                                                                             | Evidence                                                                                                               |
| ---------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Web Worker | Astro Cloudflare adapter            | `ASSETS` fetcher and `PLATFORM_API` service binding; staging targets `wejammin-api-staging`; `run_worker_first` is true outside local dev                                              | `apps/web/wrangler.jsonc:5-31`; `apps/web/wrangler.dev.jsonc:8-17`                                                     |
| API Worker | `apps/worker/src/index.ts`          | Strict app/Supabase bindings; `PLATFORM_JOBS` producer/consumer; one-minute cron; production-only Cloudflare account, observability-token, DLQ-ID, and `PLATFORM_ALERT_EMAIL` bindings | `packages/config/src/environment.schema.ts:57-76`; `apps/worker/src/async-entrypoint.ts`; `apps/worker/wrangler.jsonc` |
| Supabase   | PostgreSQL 17/Auth/Storage/Realtime | Data API exposes only `platform_api` and `public_api`; 1,000-row cap; migrations and seed enabled                                                                                      | `supabase/config.toml:5-18,32-41,58-70,86-87,114-128,154-177`                                                          |
| Docs app   | Static Astro app                    | React integration; consumes `@wejammin/ui`; no Cloudflare binding in its package                                                                                                       | `apps/docs/astro.config.mjs:1-9`; `apps/docs/package.json`                                                             |

Secrets do not cross into the browser contract. The application environment schema admits exactly `APP_ENVIRONMENT`, `APP_RELEASE`, `SUPABASE_SECRET_KEY`, and `SUPABASE_URL`; browser keys are exactly `PUBLIC_APP_ORIGIN`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `PUBLIC_SUPABASE_URL` (`packages/config/src/environment.schema.ts:57-97`). The Worker runtime additionally accepts production-only `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_OBSERVABILITY_API_TOKEN`, `CLOUDFLARE_PLATFORM_DLQ_ID`, and `PLATFORM_ALERT_EMAIL` bindings. The scheduled alert boundary runs only when all four exist; the deploy script injects the token through a protected temporary secrets file and unsets it before the Wrangler subprocess exits (`apps/worker/src/async-entrypoint.ts`; `infra/workflows/deploy-api-worker.sh`; `.github/workflows/deploy-production.yml`).

### Flow A — authenticated infrastructure SSR and React island

1. Astro receives `/app/infrastructure` or `/app/infrastructure/:recordId` and normalizes the return path/query (`apps/web/src/pages/app/infrastructure/index.astro:18-34`; `apps/web/src/pages/app/infrastructure/[recordId].astro:18-35`).
2. `resolveInfrastructureContext` uses trusted server-only ports to verify the session, resolve acting authority, require `infrastructure.read`, load the canonical projection, and validate it with `InfrastructureViewStateSchema` and `QuotedVersionSchema` (`apps/web/src/server/infrastructure-context.ts:23-67,114-155,172-280`). Structural lookalikes cannot become trusted ports or verified contexts.
3. Unauthenticated requests redirect to `/auth/sign-in`; invalid IDs return 400; forbidden/unavailable records collapse to 404 to avoid disclosure (`apps/web/src/pages/app/infrastructure/index.astro:34-54`; `apps/web/src/pages/app/infrastructure/[recordId].astro:35-55`).
4. `createInfrastructureSurfaceProjection` converts capabilities and already-sanitized seeds into upload/provider props. Missing seeds are visibly disabled; missing `infrastructure.read` yields `not-rendered` (`apps/web/src/server/infrastructure-surface-projection.ts:12-24,80-87,192-263`).
5. Astro emits server-first HTML and hydrates `InfrastructureWorkbench` only when visible. The wrapper server-renders the runtime but browser-loads it as a lazy chunk (`apps/web/src/pages/app/infrastructure/index.astro:115-138`; `apps/web/src/components/infrastructure/InfrastructureWorkbench.tsx:37-71`).

### Flow B — browser job status read

1. Browser code reads `/api/v1/jobs/:jobId` on the web origin with same-origin credentials (`apps/web/src/lib/infrastructure-jobs.ts:160-170`).
2. The Astro API route resolves a trusted test port or `env.PLATFORM_API.fetch` (`apps/web/src/pages/api/v1/jobs/[jobId].ts:17-23`).
3. The boundary accepts only GET, validates `jobId`, authenticates, forwards `If-None-Match`, normalizes 401/404/429/503 behavior, and validates the resource (`apps/web/src/server/job-status-boundary.ts:36-130`; `apps/web/src/server/job-status-platform-api.ts:121-212`).
4. API Worker production dependencies validate the bearer token by calling Supabase Auth `/auth/v1/user`, resolve server authority, call `platform_api.read_authorized_job`, and call `platform_api.consume_job_read_rate_limit` (`apps/worker/src/jobs/job-status-production.ts:40-170`; `apps/worker/src/jobs/job-status-production-support.ts:13-18,117-174`).

### Flow C — API Worker request boundary

1. `fetch` validates the complete server environment before constructing the production Hono app (`apps/worker/src/index.ts:221-258`).
2. Global middleware creates request/correlation IDs, starts the timer, enforces HTTPS, installs locked response headers, and emits schema-validated completion logs (`apps/worker/src/index.ts:135-194`).
3. Routes validate inputs with Zod-backed boundary modules before session/authority checks. Protected browser mutations require a canonical allowed origin and CSRF binding, then add `Vary: Origin` (`apps/worker/src/browser-security.ts:8-55`; `apps/worker/src/infrastructure-security.ts:106-158`).
4. Errors become `ApiErrorSchema` envelopes. Unknown routes are 404; uncaught errors are captured once, logged without raw payloads, and returned as no-store 500 responses (`apps/worker/src/worker-route-composition.ts:128-191`).

### Flow D — jobs, queue, outbox, and provider effects

1. Application acceptance validates both `JobStatusSchema` and `PlatformEventSchema`, checks idempotency, and permits only an atomic `job + outbox + idempotency` commit (`packages/application/src/infrastructure/jobs/acceptance.ts:13-62`).
2. `PLATFORM_JOBS` carries `QueueEnvelopeSchema`; environment-specific queue names are `platform-jobs`, `platform-jobs-staging`, and the configured development queue (`apps/worker/src/async-entrypoint.ts:5-18,76-127`).
3. Queue messages are orchestrated through `createAsyncJobDependencies`; scheduled `* * * * *` invocations sweep the outbox. Wrong queue names, missing orchestration, and unsupported cron paths fail closed/retry (`apps/worker/src/async-entrypoint.ts:85-137`; `apps/worker/src/async-runtime.ts:70-163`).
4. Supabase RPC calls use the `platform_api` profile with service credentials, a 15-second maximum deadline, a 256 KiB response ceiling, bounded streaming reads, fatal UTF-8 decoding, and typed dependency/manual-review failures (`apps/worker/src/async-runtime-support.ts:260-326,328-461,464-520`).
5. Provider operations use planning, bounded execution, reconciliation, and payload validation in `packages/application/src/infrastructure/provider-effects/`; the Worker adapter validates provider IDs, operation IDs, versions, and payload shape before dispatch (`apps/worker/src/provider-effects/provider-validation.ts`; `production-job-effect-dispatcher.ts`).

### Flow E — upload admission and completion

1. Admission validates method/content type/body size, request schema, target policy, idempotency key, and conditional version before the application layer performs authority/idempotency/resource work (`apps/worker/src/upload-admission/upload-intent.ts:60-161`; `packages/application/src/infrastructure/upload-admission/application.ts:61-160`).
2. Signed upload resources are bounded to a 15-minute maximum TTL; UI persistence deliberately strips the signed URL and keeps it only in the request-scoped transfer closure (`apps/worker/src/storage/upload-storage.ts:3`; `apps/web/src/server/upload-admission.ts:171-188`).
3. Completion validates route/body/headers/session, consumes rate authority, verifies storage metadata, atomically updates the object/intent, and enqueues verification. Limits are 256 KiB, 15 seconds, 60/user, 120/party, and 3 concurrent (`apps/worker/src/upload-completion/upload-intent-completion-types.ts:10-28`; `apps/worker/src/upload-completion/upload-intent-completion.ts:55-169`).
4. The default exported production handler currently supplies neither `uploadIntent` nor `uploadCompletion` dependencies. Both registered endpoints therefore return a no-store `DEPENDENCY_UNAVAILABLE` 503 until composition injects those ports (`apps/worker/src/index.ts:201-237,251-270`; `apps/worker/src/worker-route-composition.ts:82-105`; `apps/worker/src/upload-completion/upload-intent-completion.ts:173-214`). This is an activation boundary, not an undocumented live integration.

### Flow F — webhooks and release recovery

Webhook contracts validate provider identity, headers, raw body, digest, event type/schema version, receipts, acknowledgements, and manual-review results (`packages/contracts/src/webhook-admission/`). Runtime paths are dependency-injected under `/api/v1/webhooks/{provider}` and reject malformed or duplicate registrations (`apps/worker/src/worker-route-composition.ts:108-125`). The default production composition supplies no webhook routes (`apps/worker/src/index.ts:201-237`).

Release artifacts, gate sets, migration evidence, bundle/p95 evidence, promotion evidence, restore fences, and recovery readiness all have Zod contracts (`packages/contracts/src/release-artifact.ts`; `recovery-readiness.ts`). CI builds immutable artifacts; staging verifies exact SHA/artifact identity; production stays manual and runs preflight verification (`infra/workflows/`; `.github/workflows/deploy-staging.yml`; `.github/workflows/deploy-production.yml`).

### Flow G — authentication, session, and identity bootstrap

1. `/auth/sign-in` validates and normalizes `returnTo`, loads the provider catalog through the same-origin façade, and renders email/recovery plus enabled or unavailable provider actions without exposing server credentials (`apps/web/src/pages/auth/sign-in.astro:14-149`; `packages/contracts/src/authentication/primitives.ts`).
2. `/auth/start` validates form values and dispatches email or OAuth starts to the Astro API routes; each façade forwards an allowlisted request through `env.PLATFORM_API` and returns typed dependency failures (`apps/web/src/pages/auth/start.ts:22-74`; `apps/web/src/server/auth-platform-api.ts`).
3. Worker routes validate Zod bodies/query/headers, apply the authoritative route policy and PostgreSQL-backed rate bucket, and call dependency-injected authentication ports. Protected AUTH-API-03 link/proof intents are routed through the same CSRF, idempotency, version-CAS, and dedicated account-control ports as AUTH-API-10/14; the generic production OAuth adapter accepts sign-in only (`apps/worker/src/authentication/routes-provider-access.ts`; `routes-session.ts`; `packages/contracts/src/authentication/routes.ts`).
4. Production starts create expiring state/nonce/PKCE intent records, seal the flow in `wj_auth_flow`, and call Supabase Auth. Callback completion validates state, mandatory OAuth nonce and provider-subject evidence, return target, token claims, and HTTPS provider destinations. Sign-in/recovery may issue `wj_access`, `wj_refresh`, sealed `wj_session_ref`, and session-bound `wj_csrf` cookies; link/proof callbacks instead use intent-specific RPCs and preserve the initiating survivor session (`apps/worker/src/authentication/production-flows.ts`; `production-cookie.ts`; `production-token.ts`).
5. Session reads and refreshes resolve Supabase Auth identity plus the private session index. Bootstrap calls an idempotent transaction that creates or reuses party, person, binding, and acting context records. Logout revokes current or all indexed sessions, writes security/outbox evidence, clears local cookies first, then attempts provider revocation (`apps/worker/src/authentication/production-session.ts`; `supabase/migrations/20260901010000_authentication_foundation.sql`).

### Flow H — login methods and duplicate-account merge

1. `/settings/security` renders a disclosure-safe fallback and hydrates `LoginMethodManager` only with the authenticated caller's bounded method projection (`apps/web/src/pages/settings/security.astro`; `apps/web/src/components/authentication/login-method-manager/`).
2. The island calls seven same-origin Astro proxy routes. The façade forwards allowlisted cookies plus required `Idempotency-Key`, `If-Match`, and CSRF/origin headers; browser `Authorization` is never forwarded (`apps/web/src/server/auth-platform-api.ts`; `apps/web/src/pages/api/v1/account/`; `apps/web/src/pages/api/v1/account-merges/`).
3. Worker boundaries validate strict Zod envelopes and UUID/provider paths, derive the session and self authority server-side, require recent step-up for link/unlink/proof/confirm, conceal non-owner merge reads, and map typed dependency/deadline failures (`apps/worker/src/authentication/routes-login-methods.ts`; `routes-account-merges.ts`).
4. Production adapters call only named `platform_api` RPCs. Link and duplicate-proof starts create state/nonce/PKCE material server-side, bind replay to the initiating user/session/version, and seal it in the encrypted flow cookie; no candidate account lookup is exposed (`apps/worker/src/authentication/production-login-methods.ts`; `production-account-merges.ts`).
5. PostgreSQL owns final-method protection, provider-unlink reconciliation, survivor/candidate separation, different-account proof single use, merge expiry and plan/version CAS, idempotent replay, audit/outbox effects, redirect creation, and job acceptance in transaction boundaries (`supabase/migrations/20260901020000_login_methods_account_merge.sql`).

### Flow I — person, facet, alias, and acting-context authority

1. `/app/identity-authority` and its detail/degraded routes render a bounded Astro list/detail/action shell. React workbenches receive server-authorized projections only; URL context remains a suggestion and the acting-context switcher requires an explicit bind (`apps/web/src/pages/app/identity-authority/`; `apps/web/src/components/identity-authority/`).
2. Fourteen same-origin Astro API façades cover BE01b-01 through BE01b-13 and BE01b-18. They forward allowlisted cookies and mutation headers, never browser authorization, and preserve disclosure-safe 404, typed 503, and public-projection boundaries (`apps/web/src/server/identity-authority-platform-api.ts`; `apps/web/src/pages/api/v1/`).
3. Worker handlers parse strict Zod envelopes, verify same-origin session-bound CSRF, resolve the current session and acting context on every request, apply registry rate/deadline policy, then call typed identity ports. Recovery reconciles lost responses and keeps canonical state, audit, outbox, and idempotency atomic (`apps/worker/src/identity-authority/`).
4. PostgreSQL owns person/facet state, alias identity and permanent handle reservation, non-overlapping ownership periods, transfer offers, per-tab context binding, public projection, compare-and-swap versions, RLS, and redacted audit/outbox effects (`supabase/migrations/20260901030000_party_identity_aliases.sql`).
5. Revocation broadcasts `identity.acting-context.revoked.v1`; every tab refetches the canonical context list and falls back to self. Cached or deep-linked context cannot authorize a command (`apps/web/src/components/identity-authority/ActingContextSwitcher.tsx`; `packages/contracts/src/platform-events.ts`).

### Flow J — organizations, type assignments, and membership tenure

1. `/app/identity-authority?tab=relationships` server-loads the authorized relationship projection and mounts one bounded React workbench. Native forms submit JSON to same-origin Astro façades with CSRF, idempotency, and conditional `If-Match`; opaque organization, assignment, and tenure IDs remain distinct (`apps/web/src/pages/app/identity-authority/_shell.astro`; `apps/web/src/components/identity-authority/RelationshipsAuthorityGovernanceWorkbench.tsx`; `relationship-command-api.ts`).
2. Ten active façades cover ORG-01/02, TYPE-01/02, and MEM-01 through MEM-06. The façade forwards only allowlisted cookies and mutation headers through `PLATFORM_API`, validates the Worker response, and never treats the session acting-party ID as an organization ID (`apps/web/src/server/identity-authority-relationships.ts`; `apps/web/src/pages/api/v1/organizations/`; `apps/web/src/pages/api/v1/membership-tenures/`).
3. Hono handlers apply strict request schemas, canonical route policy, server-derived session and acting context, capability/visibility checks, exact rate decisions, deadline aborts, and typed error mapping before a production adapter invokes named `platform_api` RPCs (`apps/worker/src/identity-authority/handlers-relationship-*.ts`; `relationship-handler-runtime.ts`; `relationship-production.ts`).
4. The adapter forwards trusted actor/session/trace context, organization and membership versions, assignment IDs, governance mode, and governance-terms hashes. Lost responses use resource-specific rereads and strict canonical schemas; malformed database output fails closed rather than becoming a partial success (`apps/worker/src/identity-authority/relationship-production-request.ts`; `relationship-production-support.ts`; `relationship-production-http.ts`).
5. PostgreSQL owns the protected organization-type registry, organization lifecycle, type-assignment identity, invitation/assertion/acceptance transitions, capacity periods, governance confirmation, CAS, idempotent replay, audit, and outbox effects. Owner/admin/capability authorization and terms-hash checks execute inside the same transaction as mutations (`supabase/migrations/20260901040000_relationships_authority_governance.sql`).

### Flow K — public profiles and credit-backed portfolio

1. `/profiles/:partyId` performs a public, credential-free canonical read; `/app/profiles-verification?party=:partyId` first verifies the session, identity, and selectable acting context. Both validate the same safe projection and never accept browser-supplied authority (`apps/web/src/pages/profiles/[partyId].astro`; `apps/web/src/pages/app/profiles-verification/index.astro`; `apps/web/src/server/profile-portfolio-context.ts`).
2. Public SSR emits only publication-approved layers and registers a `/profiles/`-scoped service worker after caching the exact viewer-safe document. Offline navigation returns a visibly stale last-verified projection; it cannot cache protected app responses (`apps/web/public/profile-portfolio-offline.js`; `apps/web/public/profile-portfolio-sw.js`).
3. The authenticated surface uses native forms plus one progressive boundary for draft retention, field-linked validation, duplicate prevention, rate waits, version conflicts, canonical retry, and cross-tab invalidation. Same-origin Astro facades forward only allowlisted cookies and mutation headers (`apps/web/src/lib/profile-portfolio-progressive.ts`; `apps/web/src/pages/api/v1/profiles/`; `apps/web/src/server/profile-portfolio-platform-api.ts`).
4. Hono mounts `PRF-PROF-01` through `PRF-PROF-11`, applies strict Zod request validation, registry policy, server-derived actor/context, capability/concealment checks, idempotency/CAS, rate/deadline enforcement, response validation, and redacted telemetry. `PRF-EPK-01` through `PRF-EPK-08` are contract-validated but absent from runtime registration (`apps/worker/src/profile-portfolio/`; `packages/contracts/src/profile-portfolio/`).
5. Service-role-only wrappers invoke private forced-RLS functions. Profile heads, immutable section revisions, emphasis, portfolio/reel state, observation-source versions, audit, outbox, and idempotency evidence commit atomically; stale/duplicate observation ingress is a no-op and governed revocation removes ineligible public output (`supabase/migrations/20260901060000_profile_portfolio_authority.sql`; `20260901061500_profile_projection_ingress.sql`; `20260901062000_profile_portfolio_commands.sql`; `20260901062100_profile_reel_commands.sql`; `20260901062200_profile_portfolio_wrappers.sql`).

### Flow L — governed settings, effective values, and rollback

1. `/app/platform-configuration-admin` verifies the session and selectable acting context on the server, ignores URL role labels, and accepts capabilities only from the server-only authority seam or trusted Worker response metadata. The production Worker derives capabilities through `platform_api.admin_context_capabilities`; an explicit resolver may be injected for a trusted deployment/test seam, while unavailable or malformed authority fails closed. Authorized values remain sanitized and render in the no-JavaScript shell (`apps/web/src/pages/app/platform-configuration-admin/index.astro`; `apps/web/src/server/platform-configuration-context.ts`; `apps/worker/src/platform-configuration/production-context.ts`; `apps/worker/src/platform-configuration/production.ts`).
2. Browser reads and commands use the three same-origin Astro façades for effective values, setting-change proposals, and review actions. They forward only allowlisted cookies, CSRF/origin, idempotency, and conditional-version headers; the release-only definition-registration operation has no browser façade (`apps/web/src/pages/api/v1/config/`; `apps/web/src/pages/api/v1/admin/settings/`; `apps/web/src/server/platform-configuration-platform-api.ts`).
3. Hono mounts `CFG-05A-01` through `CFG-05A-04`, parses strict Zod inputs, derives release/service/session/acting-context authority server-side, applies capability/scope/concealment, step-up, rate, deadline, idempotency, candidate-hash, and version policy, then validates every success and typed failure (`apps/worker/src/platform-configuration/routes.ts`; `route-runtime.ts`; `route-support.ts`; `packages/contracts/src/platform-configuration/`).
4. Production adapters call only named service-role `platform_api` wrappers. PostgreSQL owns immutable definition/value versions, review and distinct-approval state, frozen impact hashes, scheduled activation, last-known-good snapshots, forward rollback, idempotent replay, audit, and outbox effects in transaction boundaries (`apps/worker/src/platform-configuration/production.ts`; `supabase/migrations/20260901070000_platform_configuration_authority.sql` through `20260901072000_platform_configuration_wrappers.sql`).
5. Feature-flag, experiment, and kill-switch tables enforce append-only, eligibility/privacy, allocation-version, declared-scope, and terminal-reconciliation invariants, but `CFG-05A-05` through `CFG-05A-07` are not in the active contract registry, Worker routes, browser façades, or workbench commands. Their runtime activation belongs to a later approved slice (`supabase/tests/phase_02_slice_07_deferred_controls.sql`; `packages/contracts/src/platform-configuration/routes.ts`).

### Flow M — admin workspace, task inbox, capability grants, and audit

1. `/app/platform-configuration-admin?tab=inbox|capabilities|audit` performs server-first session, identity, acting-context, and capability resolution, then composes the bounded admin shell. URL role labels, arbitrary capability headers, and untrusted query values never establish authority; missing or unavailable capability context yields a truthful hidden/disabled/read-only gate (`apps/web/src/pages/app/platform-configuration-admin/index.astro`; `apps/web/src/server/admin-workspace-context.ts`; `apps/web/src/components/platform-configuration/AdminWorkspaceActiveView.tsx`; `CapabilityGate.tsx`).
2. The SSR route reads `GET /api/v1/admin/inbox` through the same-origin façade. The façade forwards only allowlisted authentication/CSRF/origin/idempotency/CAS/trace headers, and the Worker validates the session, request context, named `admin.inbox.read` capability, filters, freshness threshold, and bounded cursor before invoking `platform_api.admin_inbox` (`apps/web/src/pages/api/v1/admin/inbox.ts`; `apps/web/src/server/platform-configuration-platform-api.ts`; `apps/worker/src/platform-configuration/admin-route-admission.ts`; `admin-route-runtime.ts`; `supabase/migrations/20260902070000_admin_workspace_authority.sql:660-844`).
3. Capability grant/revoke forms submit native or hydrated requests to `POST /api/v1/admin/capability-grants/actions`; audit links submit `POST /api/v1/admin/audit-diagnostics/actions`. Worker boundaries require CSRF/origin, recent step-up for grant mutation, rate/deadline aborts, strict envelopes, and durable replay/CAS inputs; `run_diagnostic` is explicitly rejected as deferred while `read_audit` returns disclosure-safe evidence (`apps/web/src/pages/api/v1/admin/capability-grants/actions.ts`; `apps/web/src/pages/api/v1/admin/audit-diagnostics/actions.ts`; `apps/worker/src/platform-configuration/admin-route-runtime.ts`; `apps/worker/src/platform-configuration/admin-runtime-port.ts`).
4. PostgreSQL is the final authority for scoped grants, distinct purpose-grant approval, durable idempotency, compare-and-swap revocation, audit-link lookup, evidence freshness, and atomic audit/outbox effects. The production Worker calls named service-role wrappers only; invalid RPC responses, stale versions, replay-hash drift, or unavailable dependencies fail closed (`supabase/migrations/20260902070000_admin_workspace_authority.sql:898-1161,1166-1326`; `apps/worker/src/platform-configuration/production.ts`; `production-request.ts`).
5. The React island keeps the SSR/native-form path usable before hydration and renders bounded list/detail/action views with filter/sort state, deterministic pagination, stale/partial-source indicators, conflict recovery, request IDs, and no disclosure of non-authorized task or audit targets (`apps/web/src/components/platform-configuration/AdminWorkspaceOperationsWorkbench.tsx`; `AdminWorkspaceInbox.tsx`; `AdminWorkspaceActionViews.tsx`; `DataTable.tsx`; `FilterBar.tsx`; `ActionBar.tsx`; `SyncConflict.tsx`; `OfflineStatus.tsx`; `apps/web/src/components/platform-configuration/phase-02-slice-08-final-reaudit.test.tsx`).

### Flow N — content-schema registry, signed block releases, and activation recovery

1. `/app/cms-content-modeling` and its version-detail route resolve the session, selectable acting context, and named registry capabilities on the server. They read canonical list/detail resources through `PLATFORM_API`, collapse disclosure-sensitive failures, and render native forms plus a bounded React island; URL state and invalidation messages never establish authority (`apps/web/src/pages/app/cms-content-modeling/`; `apps/web/src/server/content-schema-registry-context.ts`; `apps/web/src/components/content-schema-registry/ContentSchemaRegistryWorkbenchIsland.tsx`).
2. Human draft, field, relation, and activation forms post back to the Astro route. The server adapter forwards only allowlisted session, CSRF/origin, idempotency, and conditional-version headers. Hono re-derives request context/capability, applies the route registry's rate/deadline policy, validates strict Zod inputs, and calls named `platform_api` wrappers (`apps/web/src/server/content-schema-registry-platform-api.ts`; `apps/worker/src/content-schema-registry/routes.ts`; `packages/contracts/src/content-schema-registry/route-policy-human.ts`).
3. Block registration and lifecycle transitions are release-worker-only. Hono admits only the exact four release headers, verifies the signature over raw bytes before JSON parsing, consumes a nonce, forbids browser CSRF authority, and returns only the safe block projection; signatures, keys, nonce hashes, attestations, and executable evidence never enter browser state (`apps/worker/src/content-schema-registry/admission-release.ts`; `production-release.ts`; `packages/contracts/src/content-schema-registry/route-policy-read-release.ts`).
4. PostgreSQL owns immutable definitions and versions, relation and block compatibility, dry-run evidence, activation serialization, last-known-good rollback, audit/outbox/idempotency effects, and all protected reads/mutations. Active-state changes commit only after the exact artifact and migration gates pass (`supabase/migrations/20260902080000_content_schema_registry_authority.sql`).
5. The async consumer claims the activation event with a fresh UUID whose SHA-256 digest and server-time lease are persisted. Plan work is separately leased and progresses through dry-run, batch, verification, activation reconciliation, or rollback. Release, ACK, and dead-letter RPCs fence on the full event identity plus claim token; an expired lease may be taken over, but a stale owner cannot mutate or finalize the event (`apps/worker/src/content-schema-registry/migration-worker-runtime.ts`; `migration-worker-engine.ts`; `migration-worker-results.ts`; `supabase/tests/phase_02_slice_09_schema/005f-worker-event-claim-lease.sqlinc`).
6. Each production cron queries the bounded Cloudflare Workers Logs window for redacted `cms.registry.*` events, reads the production DLQ backlog through Cloudflare GraphQL, and reads current activation/outbox/nonce state through a service-only Supabase RPC. The package evaluator checks twelve fixed alert conditions. A breached condition must win a database claim before the Worker sends a redacted message through `PLATFORM_ALERT_EMAIL`; successful delivery stores a digest-only receipt. Missing bindings, malformed provider responses, oversized responses, claim races, and delivery/completion failures all fail closed (`apps/worker/src/content-schema-registry/operational-alert-production.ts`; `operational-alert-runtime.ts`; `operational-alert-metrics.ts`; `packages/observability/src/content-schema-registry-alert-policy.ts`; `supabase/migrations/20260905080000_content_schema_registry_operational_alerts.sql`).

---

## 3. Module Relationships and Contracts

### Workspace dependency direction

```text
@wejammin/docs ────────────────> @wejammin/ui
@wejammin/web ────────────────> @wejammin/ui ─────> @wejammin/contracts
       └──────────────────────> @wejammin/contracts

@wejammin/worker ─────────────> @wejammin/application ─────> @wejammin/contracts
       ├──────────────────────> @wejammin/config
       ├──────────────────────> @wejammin/contracts
       └──────────────────────> @wejammin/observability

Supabase migrations ──generated-types──> @wejammin/data-access
```

The dependency graph is one-way: contracts do not import application/runtime packages; application owns decisions and injected ports; Worker/Web own transport adapters; UI owns presentation policy and has no server-secret dependency. Package manifests prove these workspace edges (`apps/*/package.json`; `packages/*/package.json`).

### HTTP contract registry and runtime state

| Method/path                                                                                         | Operation                | Request → success                                                                  | Auth/rate                                                              | Current default Worker state                                                                              |
| --------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/health`                                                                                | `healthRead`             | `EmptyRequestSchema` → `HealthResponseSchema`                                      | public / public-read                                                   | Active; returns 200 `ok`.                                                                                 |
| `GET /api/v1/ready`                                                                                 | `readinessRead`          | `EmptyRequestSchema` → `ReadinessResponseSchema`                                   | public / public-read                                                   | Registered; returns 503 `not_ready` unless `checkReadiness` is injected.                                  |
| `GET /api/v1/internal/diagnostics`                                                                  | `diagnosticsRead`        | `EmptyRequestSchema` → `DiagnosticResponseSchema`                                  | operator step-up / public-read registry class                          | Registered; default composition has no request-context resolver, so it denies as unauthenticated.         |
| `GET /api/v1/jobs/{jobId}`                                                                          | `jobStatusRead`          | `JobIdPathSchema` → `JobStatusSchema`                                              | authenticated / authenticated-read                                     | Active through Supabase Auth plus authorized-read/rate-limit RPCs.                                        |
| `POST /api/v1/upload-intents`                                                                       | `uploadIntentCreate`     | `UploadAdmissionRequestSchema` → `UploadIntentResourceSchema`                      | authenticated / upload-admission                                       | Registered, fail-closed 503 without an injected admission port.                                           |
| `GET /api/v1/auth/providers`                                                                        | `AUTH-API-01`            | Empty request → `ProviderCatalogSchema`                                            | public / 120 per 60 seconds                                            | Active through `auth_provider_catalog`; cacheable for 60 seconds.                                         |
| `POST /api/v1/auth/email/start`                                                                     | `AUTH-API-02`            | `EmailStartRequestSchema` → accepted                                               | public / 5 per 900 seconds                                             | Active through Supabase passwordless/recovery Auth; response is enumeration-safe.                         |
| `POST /api/v1/auth/oauth/start`                                                                     | `AUTH-API-03`            | `OAuthStartRequestSchema` → `AuthorizationStartSchema`                             | public / 10 per 900 seconds                                            | Active; creates sealed state/nonce/PKCE intent and an approved authorization URL.                         |
| `GET /auth/callback`                                                                                | `AUTH-API-04`            | `AuthCallbackQuerySchema` → 303 redirect                                           | callback state / 10 per 900 seconds                                    | Active; verifies callback state, nonce, provider/token response, and hardened return target.              |
| `GET /api/v1/account/login-methods`                                                                 | `AUTH-API-09`            | Empty request → `LoginMethodsResourceSchema`                                       | self session / 300 per 60 seconds                                      | Active; returns only the caller's bounded method projection and recovery baseline.                        |
| `POST /api/v1/account/login-methods/{provider}/link-intents`                                        | `AUTH-API-10`            | `LinkIntentApiRequestSchema` → `AuthorizationStartSchema`                          | self + step-up / 5 per 60 seconds                                      | Active; creates an idempotent provider-link state/nonce/PKCE intent.                                      |
| `DELETE /api/v1/account/login-methods/{identityId}`                                                 | `AUTH-API-11`            | `UnlinkApiRequestSchema` → `LoginMethodsResourceSchema`                            | owner + step-up / 5 per 60 seconds                                     | Active; CAS-protected and rejects removal of the final recovery method.                                   |
| `POST /api/v1/account-merges`                                                                       | `AUTH-API-12`            | `MergeCreateApiRequestSchema` → `MergeCaseResourceSchema`                          | survivor self / 2 per 60 seconds                                       | Active; creates an expiring case without candidate lookup or disclosure.                                  |
| `GET /api/v1/account-merges/{mergeId}`                                                              | `AUTH-API-13`            | `AuthMergePathSchema` → `MergeCaseResourceSchema`                                  | survivor self / 300 per 60 seconds                                     | Active; non-owner and absent cases collapse to the concealed boundary.                                    |
| `POST /api/v1/account-merges/{mergeId}/prove-duplicate`                                             | `AUTH-API-14`            | `MergeProofApiRequestSchema` → `AuthorizationStartSchema`                          | survivor + step-up / 5 per 60 seconds                                  | Active; starts proof for a different Auth UUID with single-use state.                                     |
| `POST /api/v1/account-merges/{mergeId}/confirm`                                                     | `AUTH-API-15`            | `MergeConfirmApiRequestSchema` → `JobStatusSchema`                                 | survivor + step-up / 10 per 60 seconds                                 | Active; accepts only the current resolved plan/version and queues one idempotent merge job.               |
| `POST/GET /api/v1/me/identity`                                                                      | `BE01b-01..02`           | strict identity request → `PersonIdentityResponseSchema`                           | verified self / registry policy                                        | Active; idempotent person creation and disclosure-safe self read.                                         |
| `POST/DELETE /api/v1/me/facets[/{facetCode}]`                                                       | `BE01b-03..04`           | strict facet command → `FacetMutationResponseSchema`                               | self + current version / registry policy                               | Active; one-facet commands with obligation checks and CAS removal.                                        |
| `/api/v1/aliases/**`                                                                                | `BE01b-05..11`           | alias/handle/transfer contracts → alias or offer resources                         | current owner/recipient / registry policy                              | Active; permanent handle reservation, ownership-period transfer, idempotency, and CAS.                    |
| `/api/v1/me/acting-contexts*`                                                                       | `BE01b-12..13`           | context read/bind contracts → context resources                                    | authenticated self / registry policy                                   | Active; candidates are derived server-side and binding requires deliberate confirmation.                  |
| `GET /api/v1/identity/parties/{partyId}/projection`                                                 | `BE01b-18`               | public path → `PublicPartyProjectionResponseSchema`                                | public / registry policy                                               | Active; returns publication-approved projection only.                                                     |
| `POST/GET /api/v1/organizations[/{organizationId}]`                                                 | `ORG-01..02`             | strict organization commands/paths → canonical organization                        | verified creator or bounded public/detail read                         | Active; creation returns canonical `Location`; reads preserve disclosure boundaries.                      |
| `/api/v1/organizations/{organizationId}/type-assignments*`                                          | `TYPE-01..02`            | assignment command + organization CAS → organization                               | current owner/admin/capability / registry policy                       | Active; removal targets the opaque assignment ID, not the type code.                                      |
| `/api/v1/organizations/{organizationId}/membership-*` and `/api/v1/membership-tenures/{tenureId}/*` | `MEM-01..06`             | invitation/assertion/accept/end/capacity contracts → tenure or bounded collection  | capable organization actor or invited/current member / registry policy | Active; governance terms, counterpart confirmation, provenance, and version transitions are enforced.     |
| `GET /api/v1/profiles/{partyId}` and `/sections/{sectionCode}/revisions`                            | `PRF-PROF-01..02`        | strict public/read metadata → viewer-safe projection or revisions                  | public projection or authorized history / registry policy              | Active; ETag/cursor/version and concealment boundaries are enforced.                                      |
| `PUT /api/v1/profiles/{partyId}/sections/{sectionCode}` and `/emphasis`                             | `PRF-PROF-03..04`        | strict asserted-section/emphasis commands → canonical versioned resource           | controlling party/mandate + CSRF/idempotency/CAS                       | Active; audit/outbox/idempotency commit with the mutation.                                                |
| `GET /api/v1/profiles/{partyId}/portfolio` and `/reel`                                              | `PRF-PROF-05..06`        | bounded cursor reads → rights/provenance-backed collections                        | public or authorized projection / registry policy                      | Active; ineligible, disputed, embargoed, unlisted, or revoked facts are excluded.                         |
| `/api/v1/profiles/{partyId}/reel-items*` and `/api/v1/reel-items/{reelItemId}`                      | `PRF-PROF-07..09`        | strict reel commands → canonical reel-item resource                                | controlling party + governed credit/media/rights + CAS                 | Active; create/update/unlist preserve role and rights basis.                                              |
| `POST /api/v1/profile-fact-observations` and `GET .../profile-fact-observations`                    | `PRF-PROF-10..11`        | bounded producer observation or authorized history                                 | trusted producer or scoped authorized reader                           | Active; source-version monotonicity and stale/duplicate no-op semantics apply.                            |
| `/api/v1/profiles/{partyId}/epk*`                                                                   | `PRF-EPK-01..08`         | strict deferred EPK/share/PDF catalog contracts                                    | deferred policy only                                                   | Not mounted; no database objects, Worker routes, browser facades, or UI controls exist in Slice 06.       |
| `POST /api/v1/internal/config/definitions`                                                          | `CFG-05A-01`             | strict release definition → immutable definition resource                          | verified release service / 30 per 60 seconds                           | Active; browser sessions and browser façades cannot register definitions.                                 |
| `GET /api/v1/config/{key}/effective`                                                                | `CFG-05A-02`             | bounded key/scope/consumer query → value with source/version/provenance            | authenticated human or verified service / 300 per 60 seconds           | Active; private no-store response distinguishes explicit, inherited, fallback, and unavailable state.     |
| `POST /api/v1/admin/settings/{definitionId}/changes`                                                | `CFG-05A-03`             | strict typed candidate and impact request → frozen change review                   | settings editor + risk-based step-up / 60 per 60 seconds               | Active; candidate, impact hash, expected version, idempotency, audit, and outbox commit together.         |
| `POST /api/v1/admin/settings/changes/{reviewId}/actions`                                            | `CFG-05A-04`             | approve/schedule/activate/rollback command → canonical review/action resource      | action capability + fresh step-up / 30 per 60 seconds                  | Active; distinct approval, snapshot compatibility, forward rollback, and reconciliation are enforced.     |
| `GET /api/v1/admin/inbox`                                                                           | `CFG-05B-01`             | bounded filters/cursor → task projections with freshness                           | `admin.inbox.read` / 120 per 60 seconds                                | Active; scope-filtered task projections use deterministic pagination and disclose partial/stale sources.  |
| `POST /api/v1/admin/capability-grants/actions`                                                      | `CFG-05B-04`             | strict grant/revoke envelope → versioned capability grant                          | `admin.capability.grant` + fresh step-up / 20 per 60 seconds           | Active; delegation scope, purpose-grant approval, CAS, idempotency, audit, and outbox are enforced.       |
| `POST /api/v1/admin/audit-diagnostics/actions`                                                      | `CFG-05B-05`             | strict audit/diagnostic envelope → audit evidence                                  | `admin.audit.read` / 30 per 60 seconds                                 | Active for `read_audit`; `run_diagnostic` is deferred and fails closed.                                   |
| `POST /api/v1/cms/content-types` and nested `/fields`, `/relations`, `/activate`                    | `CMS-03A-01..04`         | strict draft/change/activation request → immutable resource or accepted activation | schema designer + CSRF/idempotency/CAS / route-specific limits         | Active; PostgreSQL serializes definitions and activation, while activation may continue asynchronously.   |
| `GET /api/v1/cms/content-types` and `/{contentTypeId}/versions/{versionId}`                         | `CMS-03A-06..07`         | bounded query/path → browser-safe list or detail projection                        | registry reader or schema designer / 120 per 60 seconds                | Active; no-store reads have no mutation, idempotency, audit, outbox, or migration side effects.           |
| `POST /api/v1/cms/blocks/versions` and `/{blockDefinitionVersionId}/lifecycle`                      | `CMS-03A-05,08`          | signed raw release request → safe immutable block/lifecycle resource               | signed release worker / 20 per 60 seconds                              | Active; exact release headers, nonce, raw-body signature, release digest, and lifecycle CAS are enforced. |
| `GET /api/v1/auth/session`                                                                          | `AUTH-API-05`            | Session cookies → `SessionResourceSchema`                                          | session / 300 per 60 seconds                                           | Active through Supabase Auth plus the private session index.                                              |
| `POST /api/v1/auth/session/refresh`                                                                 | `AUTH-API-06`            | Refresh/session cookies → `SessionResourceSchema`                                  | session / 60 per 60 seconds                                            | Active; rotates validated Supabase tokens and secure cookies.                                             |
| `POST /api/v1/auth/bootstrap`                                                                       | `AUTH-API-07`            | Idempotency + CSRF → `PersonBootstrapResourceSchema`                               | session / 10 per 60 seconds                                            | Active; transactional, retry-safe party/person/context bootstrap.                                         |
| `POST /api/v1/auth/logout`                                                                          | `AUTH-API-08`            | `LogoutRequestSchema` + idempotency/CSRF → 204                                     | session / 60 per 60 seconds                                            | Active; current/global local revocation, security evidence, outbox, and cookie clearing.                  |
| `POST /api/v1/upload-intents/{uploadIntentId}/complete`                                             | `uploadIntentComplete`   | `UploadCompletionRequestSchema` → `JobStatusSchema`                                | authenticated / upload-admission                                       | Registered, fail-closed 503 without an injected completion port.                                          |
| `POST /api/v1/webhooks/{provider}`                                                                  | `providerWebhookReceive` | Provider-specific webhook schemas                                                  | provider signature/registry policy                                     | Only exists for injected, validated registrations; none in default composition.                           |

Active and deferred route registries, schemas, ownership/BOLA expectations, rate policies, and deadlines are declared in `packages/contracts/src/platform-registries.ts` and the authentication, identity-authority, profile-portfolio, platform-configuration, and content-schema-registry contract directories. BE01b-14 through BE01b-17 and PRF-EPK-01 through PRF-EPK-08 remain contract-only; `CFG-05A-05` through `CFG-05A-07`, `CFG-05B-02`, and `CFG-05B-03` remain deferred storage/contract obligations without active route entries, and `CFG-05B-05` exposes only `read_audit`. All eight `CMS-03A` operations are active on disk. The checked-in OpenAPI covers its registered schema sources (`docs/openapi/openapi.json`), while runtime registration is independently proven in `apps/worker/src/worker-route-composition.ts`, the platform/CMS route runtimes, and route-mount tests.

### Principal schema modules

| Concern                       | Zod contracts                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Errors and identity           | `JsonValueSchema`, `ApiErrorDetailsSchema`, `ApiErrorSchema`, `RequestIdSchema`, `CorrelationIdSchema` (`api-error.ts`, `identifiers.ts`)                                                                                                                                                                                                                                                                 |
| Operational endpoints         | `HealthResponseSchema`, `ReadinessResponseSchema`, `DiagnosticResponseSchema` (`packages/contracts/src/operational.ts:11-48`)                                                                                                                                                                                                                                                                             |
| Request security              | `VerifiedSessionSchema`, `ServerAuthoritySchema`, `HighRiskServerAuthoritySchema`, public/authenticated read schemas, protected command/header/origin/navigation/query/route schemas (`request-*.ts`)                                                                                                                                                                                                     |
| Authentication                | provider/intent/return-target/email/OAuth/callback/logout/link/unlink/merge primitives and composed request envelopes; provider catalog, authorization start, session, login-method, merge-case, and bootstrap resources; route policies (`packages/contracts/src/authentication/`)                                                                                                                       |
| Identity authority            | person, facet, alias, handle, transfer, acting-context, organization, type-assignment, membership, capacity, representation, mandate, governance, name/treasury, lifecycle/lineage, authority-projection, bounded-collection, public-projection, and deferred legal-disclosure primitives, strict request envelopes, resources, events, and route policies (`packages/contracts/src/identity-authority/`) |
| Profile and portfolio         | profile/section/emphasis/portfolio/reel primitives, strict reads and commands, fact observations, identifier-only events, active/deferred registries, route policies, and generated OpenAPI (`packages/contracts/src/profile-portfolio/`)                                                                                                                                                                 |
| Platform configuration        | bounded setting/value/scope primitives; strict register, effective-read, proposal, and action envelopes/resources; identifier-only events; redacted telemetry; four-operation route metadata (`packages/contracts/src/platform-configuration/`)                                                                                                                                                           |
| Jobs/events                   | `JobStateSchema`, `JobProgressSchema`, `JobStatusSchema`, `JobStatusTransportSchema`, `JobIdPathSchema`, `PlatformEventSchema`, `QueueEnvelopeSchema`, realtime invalidation schemas (`job-status.ts`, `platform-events.ts`, `realtime-hint.ts`)                                                                                                                                                          |
| Upload admission              | byte size, target/purpose/media/checksum, policy registry, headers, request, resource/object key schemas (`upload-admission/`)                                                                                                                                                                                                                                                                            |
| Upload completion             | completion headers/request, storage metadata, object lifecycle/event/envelope, verification job status (`packages/contracts/src/upload-completion.ts:18-120`)                                                                                                                                                                                                                                             |
| Provider effects/webhooks     | operation primitives/records/transitions/evidence and provider definition/raw-request/receipt/ack/manual-review schemas (`provider-operation/`, `webhook-admission/`)                                                                                                                                                                                                                                     |
| Registries                    | route, consumer, provider, retention, SLO, and full `RegistrySetSchema` (`packages/contracts/src/registry-contracts.ts:17-133`; `packages/contracts/src/registries.ts:86-117`)                                                                                                                                                                                                                            |
| Release/recovery              | immutable artifact, gate, migration, bundle, p95, promotion, recovery, PITR, and readiness evidence schemas (`release-artifact.ts`, `recovery-readiness.ts`)                                                                                                                                                                                                                                              |
| Logging                       | strict log detail/event/config schemas with safe codes, hashed entity IDs, route templates, immutable service/environment/release fields (`packages/observability/src/logging.ts:3-80,130-150`)                                                                                                                                                                                                           |
| Content schema/block registry | strict immutable registry resources, human/release requests, browser-safe list/detail projections, activation/migration events, route policies, signed release evidence, and operational proof (`packages/contracts/src/content-schema-registry/`)                                                                                                                                                        |

### Database authority

The database exposes `platform_api` and `public_api`, while canonical tables live in locked `platform_private` and `audit_private` schemas (`supabase/migrations/20260830044317_operational_foundation.sql:3-51`; `supabase/config.toml:7-18`). Current canonical tables are:

- Core execution: `jobs`, `outbox_events`, `idempotency_records`, `restore_fences`, `job_type_registry`, `job_read_rate_limits`, and `processed_events` (`supabase/migrations/20260830100000_persistence_authority.sql:157-231`; `supabase/migrations/20260830120000_persistence_runtime_authority.sql:5-36`).
- Append-only audit: `audit_private.audit_events` (`supabase/migrations/20260830100000_persistence_authority.sql:231-372`).
- Uploads: `object_records`, `upload_intents`, and `upload_intent_authority` (`supabase/migrations/20260830140000_upload_admission_authority.sql:46-62`; `supabase/migrations/20260830180000_authority_contract_fixes.sql:7-54`).
- Providers/webhooks: `provider_operations`, `webhook_receipts`, `provider_operation_intents`, and `webhook_event_records` (`supabase/migrations/20260830150000_webhook_provider_authority.sql:9-28`; `supabase/migrations/20260830180000_authority_contract_fixes.sql:183-235`).
- Recovery: `recovery_verification_evidence` and `recovery_verification_promotions` (`supabase/migrations/20260830170000_recovery_readiness_authority.sql:5-59`; `supabase/migrations/20260830180000_authority_contract_fixes.sql:1271-1314`).
- Authentication: `platform_private.party`, `person_party`, and `acting_context_binding`; private `identity.auth_provider_registry`, `auth_user_bindings`, `auth_session_index`, `auth_intents`, `auth_rate_limits`, and `security_events` (`supabase/migrations/20260901010000_authentication_foundation.sql:1-198`).
- Login methods and merge: private `identity.login_identity_registry`, `account_merge_cases`, `account_merge_conflicts`, and `account_redirects`; protected RPCs perform self reads, link-intent creation, final-method-safe unlink, survivor-scoped merge creation/read/proof, and idempotent confirmation (`supabase/migrations/20260901020000_login_methods_account_merge.sql`).
- Identity authority: private person facet assertions, alias records, permanent handle reservations, ownership periods, transfer offers, and versioned per-tab context bindings; protected RPCs own creation, mutation, transfer, projection, revocation fallback, audit, and outbox transactions (`supabase/migrations/20260901030000_party_identity_aliases.sql`).
- Relationship authority: protected organization type definitions, organizations, type assignments, membership tenures, invitation/governance confirmations, and capacity periods; named read/mutation RPCs enforce actor context, owner/admin/capability checks, version CAS, governance-terms hashes, replay, audit, and outbox transactions (`supabase/migrations/20260901040000_relationships_authority_governance.sql`).
- Profile/Portfolio authority: profile heads and immutable section revisions, versioned emphasis, rights-backed portfolio/reel state, monotonic observation ingress, public projections, audit/outbox/idempotency evidence, and service-role-only JSONB wrappers (`supabase/migrations/20260901060000_profile_portfolio_authority.sql` through `20260901062200_profile_portfolio_wrappers.sql`). EPK/share/PDF objects are intentionally absent.
- Platform-configuration authority: immutable setting definitions and value versions, change reviews, distinct approvals, runtime snapshot intents, idempotency, audit, and outbox effects; protected register/resolve/propose/action RPCs and service-role wrappers own every active transition (`supabase/migrations/20260901070000_platform_configuration_authority.sql` through `20260901072000_platform_configuration_wrappers.sql`). Deferred flag/experiment/kill-switch tables are present only with storage invariants; no matching runtime operation is mounted.
- Admin workspace authority: seven private tables for task projections, capability grants, bulk-operation manifests/results, audit links, diagnostic definitions, and diagnostic runs. `admin_inbox` applies server-derived scope, task/state/staleness filters, deterministic cursor pagination, and partial-source freshness; `admin_context_capabilities` returns only validated capability names; `admin_capability_action` enforces delegation/purpose approval, CAS, and durable idempotency; `admin_audit_diagnostic` exposes `read_audit` with freshness/CAS/idempotency while `run_diagnostic` remains deferred (`supabase/migrations/20260902070000_admin_workspace_authority.sql:89-454,631-844,846-1161,1163-1326`).
- Content-schema and block-registry authority: twelve private tables own immutable type/version, field, relation, template/capability binding, migration plan/artifact/dry-run, release nonce, block version, and lifecycle-event state. Protected wrappers enforce reserved-domain rejection, compatibility and exact-artifact activation gates, signed release nonce consumption, serialized activation/rollback, and separately fenced plan and event leases. Claim tokens persist only as SHA-256 digests; release, ACK, and dead-letter require exact event identity and token ownership (`supabase/migrations/20260902080000_content_schema_registry_authority.sql`).
- Operational-alert authority: a thirteenth private registry table stores only safe alert codes, window boundaries, UUID claim-token digests, delivery receipt digests, and claim/delivered state. Service-only RPCs expose the bounded operational snapshot and own claim/completion transitions; no provider response body, email content, or raw token is persisted (`supabase/migrations/20260905080000_content_schema_registry_operational_alerts.sql`).

All canonical tables are RLS-enabled/forced or protected by equivalent privilege/trigger boundaries. Public-facing Worker adapters call service-only `platform_api` RPC façades. Authentication exports only provider catalog, rate, intent, session, bootstrap, and logout functions to `service_role`; the `identity` schema itself is revoked from public/authenticated roles (`supabase/migrations/20260901010000_authentication_foundation.sql:1-2,176-198,582-605`). The Phase 1 closure migration explicitly revokes legacy non-authorized upload, provider, webhook, object, and restore functions (`supabase/migrations/20260830190000_close_legacy_authority_bypasses.sql:8-80`).

### Rate limits, CORS, and response policy

- Job reads are 300 requests per user and 600 per acting party per 60-second window. Production consumption is shared in PostgreSQL through `consume_job_read_rate_limit`; the in-memory limiter is explicitly local/test only (`apps/worker/src/jobs/job-status-types.ts:4-5`; `apps/worker/src/jobs/job-status-production.ts:132-163`; `apps/worker/src/jobs/job-status-rate-limit.ts:8-69`).
- Upload completion declares 60/user, 120/party, and 3 concurrent with a 15-second deadline (`apps/worker/src/upload-completion/upload-intent-completion-types.ts:10-28`). Admission has a 256 KiB body maximum and 15-second default (`apps/worker/src/upload-admission/upload-intent-validation.ts:22`; `apps/worker/src/upload-admission/upload-intent.ts:94-95`). Webhook admission caps the global body at 256 KiB and defaults to 2 seconds (`apps/worker/src/webhooks/webhook-types.ts:1`; `apps/worker/src/webhooks/webhook-processor.ts:66-71`).
- Authentication policies are route-specific: provider catalog 120/minute; email start 5/15 minutes; OAuth start and callback 10/15 minutes; session and login-method/merge reads 300/minute; refresh/logout 60/minute; bootstrap and merge confirm 10/minute; link, unlink, and duplicate proof 5/minute; merge create 2/minute. The PostgreSQL bucket keys operation plus hashed IP/session/identifier data and emits `RateLimit-*` plus `Retry-After` on 429 (`packages/contracts/src/authentication/routes.ts`; `apps/worker/src/authentication/route-support.ts`; `supabase/migrations/20260901010000_authentication_foundation.sql`).
- Identity commands and reads use the BE01b registry's per-operation user/party limits and 5/8-second deadlines. The Worker applies these policies before invoking an identity port, emits rate headers, and maps timeout or missing persistence to no-store typed failures (`packages/contracts/src/identity-authority/routes.ts`; `apps/worker/src/identity-authority/route-runtime.ts`).
- Relationship commands and reads use the BE01c operation registry's exact user/party dimensions, limits, and deadlines. The active ORG/TYPE/MEM handlers reject malformed rate decisions, emit `RateLimit-*` plus `Retry-After` on 429, and abort late dependencies before any response is accepted (`packages/contracts/src/identity-authority/relationship-routes.ts`; `apps/worker/src/identity-authority/relationship-handler-runtime.ts`).
- Profile/Portfolio reads, commands, and observation ingress use the `PRF-PROF-*` registry's exact public/user/party/producer dimensions and deadlines. Hono rejects malformed or widened rate decisions, emits `RateLimit-*` and `Retry-After`, aborts late dependencies, and never registers deferred EPK buckets as routes (`packages/contracts/src/profile-portfolio/route-policy.ts`; `apps/worker/src/profile-portfolio/route-admission.ts`).
- Platform-configuration policies are `CFG-05A-01` 30/minute with a 15-second deadline, `CFG-05A-02` 300/minute with an 8-second deadline, `CFG-05A-03` 60/minute with a 15-second deadline, and `CFG-05A-04` 30/minute with a 15-second deadline. The Worker combines authoritative authentication rate decisions with its bounded local guard, emits rate headers, and fails closed when the remote limiter is unavailable (`apps/worker/src/platform-configuration/runtime-helpers.ts`; `route-support.ts`).
- Admin workspace policies are `CFG-05B-01` 120/minute with an 8-second deadline, `CFG-05B-04` 20/minute with a 15-second deadline, and `CFG-05B-05` 30/minute with a 15-second deadline. The Worker requires the corresponding named capability, applies authenticated PostgreSQL-backed rate authority, propagates abort/deadline signals, emits rate headers, and maps `run_diagnostic` to a deferred typed failure (`packages/contracts/src/platform-configuration/admin-active-routes.ts`; `apps/worker/src/platform-configuration/admin-route-admission.ts`; `admin-route-runtime.ts`).
- There is no permissive `Access-Control-Allow-Origin` middleware in the production source. Browser writes are same-origin/canonical-origin operations guarded by required mutation headers, a CSRF token cryptographically bound to the HttpOnly session reference and compared in constant time, an allowed-origin set, and `Vary: Origin` (`apps/worker/src/authentication/boundary.ts`; `production-cookie.ts`; `packages/contracts/src/authentication/requests.ts`).
- Both Web and API apply per-request CSP nonces, HSTS, nosniff, frame denial, strict referrer policy, permissions policy, HTTPS redirects, and explicit CSP source restrictions (`apps/web/edge-security-runtime.mjs:11-47,124-179`; `apps/worker/src/security-headers.ts:11-50`). Astro additionally wraps the generated adapter so `ASSETS.fetch` and fallback responses cannot bypass the policy (`apps/web/astro.config.mjs:35-82`).

---

## 4. Key Patterns and Implementation Evidence

### Contract-first ports and adapters

Zod schemas in `@wejammin/contracts` define transport and state. Pure application modules accept typed ports and return explicit decisions. Hono/Astro/Supabase modules adapt those ports at the edge. Examples: job acceptance validates contract inputs before returning an atomic write plan (`packages/application/src/infrastructure/jobs/acceptance.ts:13-62`); the web job route consumes a trusted boundary port (`apps/web/src/server/job-status-boundary.ts:36-130`); production supplies a Supabase adapter (`apps/worker/src/jobs/job-status-production.ts:40-170`).

### Server-first Astro with bounded React islands

Astro pages perform session, authority, canonical data, and capability projection before rendering. React receives only server-approved props and hydrates through bounded islands; workbench runtime is split into lazy browser chunks while preserving SSR HTML (`apps/web/src/pages/app/infrastructure/index.astro`; `apps/web/src/components/infrastructure/InfrastructureWorkbench.tsx`; `apps/web/src/pages/app/platform-configuration-admin/index.astro`; `apps/web/src/components/platform-configuration/SettingsFlagsRuntimeWorkbench.tsx`). Upload, provider, and heavy Zod transport surfaces are lazy/gated outside initial route closures.

### Fail-closed activation

Optional dependencies are not replaced with fake success. Readiness, uploads, diagnostics, and webhooks return unavailable/unauthenticated or remain unregistered when their trusted ports are absent (`apps/worker/src/worker-route-composition.ts:46-125`; `apps/worker/src/diagnostics.ts:81-150`; `apps/worker/src/upload-completion/upload-intent-completion.ts:173-214`). Empty future directories are likewise boundaries, not implementations.

### Sealed authentication boundary

OAuth flow state, nonce, PKCE verifier, actor/session binding, and post-auth return target are server-created, expiration-bounded, authenticated-encrypted, and checked again at callback. OAuth callbacks require local ID-token nonce and digest-only provider-subject evidence. Session access/refresh tokens stay in Secure, HttpOnly, SameSite=Lax cookies; CSRF uses a required readable cookie/header value bound to the sealed session reference. MFA freshness comes from explicit AMR event time preserved across refresh, never refreshed JWT issue time. Approved authorization hosts require HTTPS except explicit loopback development, and nested/external return targets are rejected (`apps/worker/src/authentication/production-flows.ts`; `production-cookie.ts`; `production-session.ts`; `production-token.ts`; `packages/contracts/src/authentication/primitives.ts`).

### Survivor-owned duplicate merge

The current authenticated account is always the survivor; the browser cannot supply or search for a candidate identity. Duplicate proof must resolve a different Auth UUID, is single-use and expiry-bound, and precedes an explicit conflict-plan acknowledgement. Confirmation uses both merge version and conflict-plan version CAS, then atomically records audit/outbox/idempotency evidence, creates redirects, and accepts one job (`apps/worker/src/authentication/routes-account-merges.ts`; `production-account-merges.ts`; `supabase/migrations/20260901020000_login_methods_account_merge.sql`).

### Atomic outbox and idempotency

Job acceptance permits one atomic write set containing the job, outbox event, and idempotency record (`packages/application/src/infrastructure/jobs/acceptance.ts:13-62`). PostgreSQL functions enforce leases, monotonic versions, outcome transitions, restore fences, processed-event deduplication, and append-only audit (`supabase/migrations/20260830100000_persistence_authority.sql`; `20260830120000_persistence_runtime_authority.sql`).

Organization and membership commands use the same atomic rule: the canonical aggregate transition, idempotency outcome, audit event, and outbox event commit together. A replay returns a strict resource-specific reread; request-hash, version, assignment, actor, or governance-terms drift rejects the replay (`supabase/migrations/20260901040000_relationships_authority_governance.sql`; `apps/worker/src/identity-authority/relationship-production.ts`).

### Data minimization and non-disclosure

Server environment schemas reject unknown keys; browser schemas contain public values only. Logs accept a strict safe field set and hashed entity identity. Infrastructure routes turn unauthorized/unavailable record access into 404. Upload view persistence omits signed URLs. Provider payloads are depth/key/byte bounded before effects execute (`packages/config/src/environment.schema.ts:57-97`; `packages/observability/src/logging.ts:43-80`; `apps/web/src/server/upload-admission.ts:171-188`; `apps/worker/src/provider-effects/provider-validation.ts:19-22`).

### Immutable promotion evidence

Release contracts tie artifact identity, migration evidence, bundle limits, p95 results, and promotion to a source SHA. Staging workflows build/record/verify artifacts; production is manual and validates the exact successful staging candidate before dispatch (`packages/contracts/src/release-artifact.ts`; `infra/workflows/verify-production-candidate.sh`; `.github/workflows/deploy-production.yml`).

### Profile-ownership authority and claim proof

Phase 2 Slice 05 adds one fail-closed profile-ownership flow. Authenticated browsers render `/app/profiles-verification` from server-derived identity, acting context, CSRF, and canonical claim state; unauthenticated requests redirect before protected data is loaded. Eight same-origin Astro API facades forward bounded requests to Hono without exposing Worker credentials. Hono validates the shared Zod/OpenAPI contracts, then calls service-role-only `api.profile_*` JSONB wrappers, whose private functions atomically maintain shadow parties, invitations, remedies, claim challenges/proofs, audit events, outbox events, jobs, and idempotency evidence (`apps/web/src/server/profile-ownership-context.ts`; `apps/web/src/server/profile-ownership-platform-api.ts`; `apps/worker/src/profile-ownership`; `packages/contracts/src/profile-ownership`; `supabase/migrations/20260901050000_profile_ownership_authority.sql`; `supabase/migrations/20260901051000_profile_ownership_commands.sql`).

Claim-proof acceptance is asynchronous: the command returns `202` with a persisted `JobStatus` representation and `Location`; rejected, expired, or exhausted proof attempts return typed `409` conflicts. Account-free `/claim` requests never forward cookies, preserve an explicit idempotency key, and return the opaque claim pointer only in the JSON response body. Offline state and version conflicts use the canonical shared primitives, while API09–API16 remain unmounted until their owning slices implement them.

### Public profile composition and governed curation

Phase 2 Slice 06 adds viewer-safe public profile composition and owner/mandate-controlled asserted-section, emphasis, portfolio, and reel commands. Candidate public facts must survive current source-version, provenance, visibility, embargo, listing, dispute, party-lifecycle, credit, media, and rights checks. Observation ingress is producer-bounded and monotonic; it cannot carry canonical authority in its payload (`apps/worker/src/profile-portfolio`; `supabase/migrations/20260901061500_profile_projection_ingress.sql`).

The public Astro route is cacheable only after the exact safe document and scoped service worker are ready. Protected app state is never cached. Native forms remain functional before hydration; the progressive boundary preserves drafts and field errors, prevents duplicate activation, maps typed failures with request IDs and retry waits, treats cross-tab messages as invalidation, and requires canonical reconciliation (`apps/web/src/pages/profiles/[partyId].astro`; `apps/web/src/lib/profile-portfolio-progressive.ts`; `apps/web/public/profile-portfolio-sw.js`). EPK/share/PDF contracts exist for downstream planning but every runtime, database, facade, and UI activation point remains absent.

### Governed settings and forward rollback

Phase 2 Slice 07 makes configuration a versioned authority rather than an environment-variable or browser-state convention. Definition registration is release-service-only; effective reads return explicit source/version/fallback provenance; setting proposals freeze candidate and impact hashes; approval, scheduling, activation, and rollback require action-specific capability, distinct actors, fresh step-up, compatible snapshots, and compare-and-swap versions (`packages/contracts/src/platform-configuration/`; `apps/worker/src/platform-configuration/`; `supabase/migrations/20260901070000_platform_configuration_authority.sql`).

Rollback is a new forward version and never deletes history. Definition, value, review, approval, snapshot, idempotency, audit, and outbox effects remain private and transactionally reconciled. The browser receives a sanitized projection, cannot register definitions, cannot derive capability from a role query, and treats optimistic state and Realtime as non-authoritative hints (`apps/web/src/server/platform-configuration-context.ts`; `apps/web/src/components/platform-configuration/settings-flags-runtime-workbench-controller.ts`; `.memory/wiki/operations/runbooks/platform-configuration.md`).

The standard Cloudflare `PLATFORM_API` service binding remains fetch-only; the
capability authority is implemented as a server-only request to
`platform_api.admin_context_capabilities` in the production Worker. Optional
resolver injection exists only as an explicit trusted deployment/test seam;
browser role labels and capability headers are never accepted. Missing,
malformed, or unavailable capability authority keeps settings/admin views
read-only, disabled, or hidden while Worker and PostgreSQL command
authorization fail closed independently.

### Admin workspace authority and freshness

Phase 2 Slice 08 adds the server-first admin workspace. The inbox is a
projection over private task sources, filtered by the caller's verified
acting-party scope and named capability, with bounded task/state/staleness
queries, deterministic cursor pagination, and explicit stale/partial-source
provenance. Grant/revoke and audit operations use strict contracts, recent
step-up where required, conditional versions, durable idempotency, and atomic
audit/outbox effects. Capability names are obtained only from the server-only
`admin_context_capabilities` RPC, and invalid or unavailable context never
widens access (`apps/web/src/server/admin-workspace-context.ts`; `apps/worker/src/platform-configuration/admin-route-admission.ts`; `apps/worker/src/platform-configuration/admin-runtime-port.ts`; `supabase/migrations/20260902070000_admin_workspace_authority.sql`).

### Immutable CMS definitions and fenced migration ownership

Phase 2 Slice 09 separates immutable registry identity from mutable workflow
state. Keys are never reused; active definition versions cannot be edited;
relation, template, capability, artifact, and block compatibility are checked
before activation; and rollback advances through audited state instead of
rewriting history. Human commands derive browser session/context authority,
while block registration and lifecycle advance use a distinct signed-release
principal (`packages/contracts/src/content-schema-registry/`;
`apps/worker/src/content-schema-registry/`).

Migration processing uses two ownership layers: a plan lease for bounded
dry-run/backfill/verification work and a per-delivery event claim for message
finalization. Both are server-time bounded. Event claims use a fresh UUID and
store only its hash; every release, ACK, and dead-letter transition verifies
the complete immutable event identity and the token. This makes retries and
lease takeover safe without allowing an expired worker to mutate a newer
owner's event (`apps/worker/src/content-schema-registry/migration-worker-*.ts`;
`supabase/migrations/20260902080000_content_schema_registry_authority.sql`).

Operational alerts use a separate claim-before-effect pattern. Provider-neutral
threshold evaluation and message redaction live in `@wejammin/observability`;
the Worker owns Cloudflare Logs/GraphQL and Email Sending adapters; PostgreSQL
owns the deduplication and delivery receipt. Claim tokens are UUIDs in memory
and SHA-256 digests at rest, while delivered receipts contain only fixed safe
codes, time windows, and content digests
(`packages/observability/src/content-schema-registry-alert-*.ts`;
`apps/worker/src/content-schema-registry/operational-alert-*.ts`;
`supabase/migrations/20260905080000_content_schema_registry_operational_alerts.sql`).

---

## 5. Current Boundaries and Maintenance Rules

- Phase 1 is complete and validated. No Phase 1 quality/readiness gate remains open; live production deployment was intentionally not required or performed (`.memory/wiki/specs/audits/phase-1-validation.md:13,170-179`).
- The implemented product surface is the operational foundation plus Phase 2 Slices 01–09: authentication/session/bootstrap, login-method linking and duplicate-account merge, person/facet/alias/acting-context authority, organization/type-assignment/membership-tenure authority, shadow-party/invitation/claim-proof authority, viewer-safe public profile/credit-backed portfolio authority, governed setting definition/effective-value/change/rollback authority, the admin shell/task inbox/capability-grant/audit read surface, and content-schema/block-registry authoring, activation, release, migration recovery, and scheduled alerting. EPK/share/PDF, flag/experiment/kill-switch runtime operations, admin search/bulk/run-diagnostic branches, editorial entry/composition/public-delivery surfaces, and later music-product domains remain unmounted specifications.
- Slice 09 is locally QA-GREEN and deployed through exact SHA `b22a914327291e2895bbcc7dc8f60837c8faa0d6`, but remains release-blocked at 279/283 on a genuine alert delivery receipt, complete UTC-day SLO/DLQ evidence, configured Google OAuth/test identities plus deployed Supabase Auth/RLS/RPC/Worker/web E2E, and the two required manual screen-reader/browser pairs. Google remains disabled in both Supabase projects; the business Google Cloud account requires owner acceptance of its Terms of Service before OAuth client setup. Any later promotion must continue to verify exact source SHA, migration, contracts, artifact identity, protected review, and retained evidence before activation.
- Upload admission/completion, dynamic webhooks, diagnostics authority, and readiness probes have complete boundaries/tests but are not activated by the default exported Worker dependency composition. Any activation must inject real verified ports and preserve the existing failure behavior.
- `packages/domain` and `packages/integrations` currently contain only boundary READMEs. They must not be described as runtime services until implementation files exist.
- Refresh this map after a phase validation pass or any change to routes, bindings, package edges, migrations/RPCs, or runtime composition. Verify with `pnpm validate`, `pnpm contracts:check`, `pnpm db:types:check`, and `git diff --check` as appropriate.

### Phase-aware next step

Phase 1 validation is closed and Phase 2 Slices 01–09 are implemented on disk. Slice 09 — **content schemas, relations, activation, and block registry** — has passed every local quality gate and its auth-provider transport is verified in staging and production, but it remains blocked at 279/283 by AC209, AC211, AC265, and AC266. Slice 10 is dependency-locked until the alert receipt, complete UTC-day telemetry, configured Google/test-identity hosted matrix, and manual platform-pair checks are evidenced against an immutable candidate; the next step is the owner-gated Google Cloud terms/OAuth setup and remaining Slice 09 external evidence, not Slice 10 implementation (`.memory/pipeline/progress/phases/phase-02.md`; `.memory/pipeline/progress/slices/phase-02-slice-09.md`).
