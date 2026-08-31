# Upload completion

Server-first completion form and safe verification-job projection for the infrastructure upload flow.

## Contents

- `UploadCompletionForm.tsx`: bounded React island seam for server-selected access and callback-owned mutation.
- `UploadCompletionFields.tsx`: labeled, error-linked completion fields.
- `UploadCompletionFeedback.tsx`, `UploadCompletionStatus.tsx`, `UploadCompletionError.tsx`, `UploadCompletionResult.tsx`: typed status, error, conflict, and job result views.
- `upload-completion-state.ts`, validation, navigation, persistence, and error utilities: contracts and safe projections.

## Ownership

The server owns persona, capability, object version, job state, and completion authority. This directory owns accessible rendering and local draft state only. No component calls a provider, starts a paid service, stores signed URLs, persists raw payloads, or logs secrets. Production provider registry defaults to empty and disabled.

## Extension

Add a Zod-backed server projection and a typed callback prop before adding a new completion state. Keep unknown fields rejected, preserve idempotency and `If-Match`, and add an accessibility test for every new access or state branch.

## Conventions

Use server-first Astro composition with bounded React islands, polite live updates, first-invalid focus, safe canonical navigation, and 44px minimum controls. Offline drafts remain explicitly noncanonical; retries reconcile canonical state before any mutation reuse.

## Related links

- `.memory/wiki/specs/fe/00-infrastructure.md`
- `.memory/pipeline/progress/slices/phase-01-slice-05.md`
