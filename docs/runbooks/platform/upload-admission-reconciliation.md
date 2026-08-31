# Upload admission reconciliation

Use this runbook when an upload-intent request conflicts, a signer fails, a
client loses the response, or an intent expires before bytes are transferred.

## Safety boundary

The database record and object key are canonical; a signed upload URL is a
short-lived credential returned once. Never log, persist, copy into a ticket,
or recover a signed URL from telemetry. Never create an object key outside the
declared admission RPC, and never treat storage bytes as admitted content.

Production signing and storage adapters remain disabled in Phase 1. Only the
deterministic local/fake adapter may be used in automated verification. Do not
enable a provider, trial, storage add-on, or paid service through this runbook.

## Admission checks

1. Record UTC time, request ID, actor ID, acting-party ID when server-resolved,
   upload-intent ID, object-record ID, canonical version, and the first twelve
   characters of the request SHA-256. Exclude filenames containing personal
   data, signed URLs, tokens, headers, and object bytes.
2. Confirm the request was validated before authorization and that `targetType`,
   `targetId`, `purpose`, normalized media type, positive byte size, SHA-256,
   `Idempotency-Key`, and exact quoted `If-Match` match the locked contract.
3. Read the idempotency reservation through the service-role reconciliation
   path. The same normalized request may reuse its canonical result; a different
   request under the same key is a conflict and must not replace the first
   binding.
4. Confirm signer success occurred before the database commit. If signing
   failed, no upload intent or object record may remain committed. If commit
   failed after signing, allow the credential to expire and do not expose it.
5. Confirm the committed intent references one private object key and that the
   response URL was marked delivered once. RLS must deny browser access to the
   private rows and storage key.

## Lost response and expiry

Do not reconstruct or redisclose an upload credential after an unknown or lost
response. Re-read the canonical intent through the authorized status path. If
the credential is expired or delivery cannot be proven, cancel/expire the
intent through its named transition and let the client request a fresh intent
after identity, authority, target version, size, media type, and digest are
revalidated. Preserve the original idempotency evidence.

An admitted intent is not proof of upload completion. Content remains
non-consumable until the separate completion and verification slice reaches
`ready`; missing, mismatched, rejected, or quarantined objects stay closed.

## Completion and verification

1. Re-read the live intent, object record, current target authority, exact
   object version, and provider-observed byte size/media metadata through the
   service-role reconciliation path. Client declarations are not evidence of
   received bytes.
2. Confirm the completion idempotency binding matches the normalized body and
   exact `If-Match`. A committed lost response must replay the same verification
   job; different content or version must not enqueue another verifier.
3. Confirm one atomic transaction moved the object to `uploaded`, created the
   `platform.object.verify` job, and wrote the `object.uploaded/1` outbox event.
   Never enqueue or edit these records by hand.
4. Let the `platform-objects` consumer re-read canonical object state/version
   and provider-observed metadata. Duplicate or out-of-order delivery must use
   compare-and-swap and cannot regress `ready`, `rejected`, or `quarantined`.
5. Open the ready-only projection only when size, normalized media type,
   checksum, object key, and state all verify. A mismatch stays unavailable and
   transitions to the declared rejected/quarantined path with sanitized audit
   evidence.

Production object-storage inspection and queue adapters remain absent. Local
drills use deterministic fake metadata and queue delivery only; missing live
adapters must return a safe dependency-unavailable result and must not turn a
client declaration into verified content.
