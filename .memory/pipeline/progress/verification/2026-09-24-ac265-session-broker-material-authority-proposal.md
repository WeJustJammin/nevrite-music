# AC265 session broker — materialRef authority binding proposal

**Status**: proposal only. Not implemented, not migrated, not pushed.
**Date**: 2026-09-24
**Scope**: removes a caller-supplied-authority gap. Closes no AC265 criterion.

## Problem

The run-scoped session broker accepts, per locked role, a caller-supplied
`materialRef` of shape `ac265-session-material://staging/<uuid>`. The database
currently validates only its shape, its distinctness, and its binding to the
role's handle. Nothing constrains *who* may name a material reference.

A caller can therefore assert a material reference it does not legitimately
hold. The migration header's claim that the reference is one "only the external
broker can dereference" (20260924192516, lines 5-10) is a dereference-time
property, not a write-time authority check.

Two things must NOT be done to "fix" this:

- Do not treat a self-hash of the reference as trusted authority. A digest of a
  caller-supplied string proves only that the caller can hash its own input.
  This is exactly the false confidence that needs removing.
- Do not synthesize live session material. No handle, credential, or session
  byte may be created, and no fixture or generated test key may be promoted to
  an approval.

Governing constraints (quoted from the runbooks):

- `ac265-hosted-e2e-contract-v1.md:116-119` — "Refs resolve only through the
  approved external secret/session broker inside the protected run. A reference
  is not a bearer credential ... The broker authorizes resolution only for this
  run and runner identity."
- `ac265-hosted-e2e-contract-v1.md:135-136` — "The runner may not create
  identities, grants, mandates, organizations, cases, content schemas, or
  prerequisites to make a case pass."
- `ac265-hosted-e2e-runner-blocker.md:139-143` — "Handles resolve only through
  an authorized external broker ... Do not create minors, invent mandates,
  provision identity grants, or create acceptance resources."
- `ac265-hosted-e2e-contract-v1.md:487,495-496` — "A digest without trusted
  resolution and authenticity verification is not proof." / "Do not treat a
  local resolver, fixture, or hash as a hosted evidence service or issuer."
- `ac265-hosted-e2e-contract-v1.md:183-184` — "fixtures and generated test keys
  are not acceptance evidence."
- `20260923090000_ac265_approved_registry_population_gate.sql:19-20` — "A
  pinned row is trusted only because a separate owner-approved forward
  migration is reviewed and applied."

## Options considered

**Option A — owner pre-registers handles and material before the run.**
Rejected: the owner cannot enumerate live broker-held material before the run
without that material escaping the broker boundary the contract protects, and
the runbooks state session material is never retained.

**Option B — authenticated broker registration RPC.** The broker calls its own
registration endpoint with a broker credential. Rejected: this relocates a
broker secret into the runner's environment, which the blocker explicitly
forbids.

**Option C (recommended) — signed broker assertion against a pinned broker
key.** The authority sits where the material actually lives. The broker signs
the per-role tuple `(brokerKeyId, runId, identitySha256, role, handleRef,
materialRef)`; the database verifies that signature against an owner-pinned
broker public key and persists the verified binding. `authorize` then binds
only to already-verified rows.

Why C: it introduces no new network trust, is replay-proof across runs because
run and identity are inside the signed bytes, and is verifiable offline with
`pgsodium.crypto_sign_verify_detached` — already installed and already used in
this exact posture by the content-schema-registry authority migration.

## Proposed shape (not implemented)

New forward-only migration, sorting after `20260924192516`, no DOWN.

1. `platform_private.ac265_approved_session_broker_keys` — pinned broker public
   keys. Columns: `broker_key_id` (pk), `broker_public_key` (32-byte Ed25519),
   `broker_ref`, `approval_ref`, `environment`. **Ships empty and fails closed.**
2. `platform_private.ac265_approved_session_broker_resources` — verified
   per-role bindings. Mirrors `ac265_approved_safe_resources` column-for-column:
   server-minted id, `handle_ref`, `handle_sha256`,
   `material_ref`, `material_sha256`, the signed assertion payload, the
   run/identity/candidate scope tuple, `approved_at`, `idempotency_ref`,
   `request_sha256`, plus `unique (run_id, role)` and immutability triggers.
3. `material_sha256` digests the **signed assertion payload**, not the reference
   string, so the stored digest is evidence of a verified signature rather than
   a self-hash.
4. Canonical payload function, domain-separated, `immutable strict`, empty
   `search_path` — same discipline as the CMS release signing payload.
5. Register RPC: strict JSONB, service-role only, on empty `search_path`.
   Rejection semantics in order: malformed → `22023`; exact replay → stored
   envelope; differing payload for the same idempotency reference → conflict;
   non-live or mismatched authorization → conflict; **no pinned key → conflict**;
   any signature failure → conflict (never `22023`, so a caller cannot
   distinguish an unknown key from a forged signature); uniqueness violation →
   conflict.
6. `authorize` gains exactly one gate: the request's `(role, handleRef,
   materialRef)` triple must match a verified row for the same authorization,
   run, and identity, otherwise conflict. Envelope shape, resolve, and teardown
   are unchanged.

Deployment order: pin keys (owner migration) → register broker-signed
assertions → authorize.

## Owner-controlled gates (cannot be synthesized)

- The broker's Ed25519 **public key** and `broker_ref` must come from a real
  external broker under owner control, seeded by a separate reviewed forward
  migration.
- The broker's **private signing key** never enters this repo, the runner, or
  any artifact.
- The assertions must be broker-signed at run time.
- Test-local `crypto_sign_seed_new_keypair` keys are vectors only and are
  barred from promotion to a pinned approval by
  `ac265-hosted-e2e-contract-v1.md:183-184`.

## What this does not do

This removes a caller-supplied-authority gap. It does not produce hosted
evidence, does not close AC265, and does not authorize a push or deployment.
The pinned-key row and the live broker remain owner decisions.
