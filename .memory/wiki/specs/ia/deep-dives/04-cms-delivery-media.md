# Deep Dive 04 — CMS navigation, media and delivery

> **Parent IA Shard**: [../04-cms-delivery-media.md](../04-cms-delivery-media.md)
> **Architecture Source**: [../../2026-08-02-architecture-design.md](../../2026-08-02-architecture-design.md)
> **Status**: Complete — deepening converged

## Scope

This deep dive owns route/menu/discovery manifests, media governance and read delivery. Shard 03 owns definitions, entries, composition, approvals, schedule and canonical publication. Shard 05 owns settings/admin/diagnostics/import/export. Domain rights/safety shards own adjudication; per DEC-098 they assert their outcome into this shard by calling its protected inbound delivery commands, and this shard executes the delivery consequence without ever reading their stores or adjudicating.

## Deepening Record

| Pass | Result |
|---|---|
| Cross-section consistency | Menus, routes, metadata, objects, rights, renditions, references, projections, caches, purge and recovery share immutable/versioned pointers. |
| What-if expansion | Stale targets, redirect loops, corrupt uploads, duplicate rights, failed transforms, expiry, partial invalidation, outage and urgent takedown converge. |
| Adversarial pass | Open redirects, navigation-as-auth, stored malware, polyglot files, dedup leakage, signed-URL overreach, preview/cache leaks, SEO privacy leaks and stale revoked output fail closed. |
| Convergence | Final pass introduced no new boundary, state, actor, field, or unresolved implementation choice. |

## Canonical Field Contracts

### Navigation and Routes

| Model | Fields and constraints |
|---|---|
| `menu` | `id uuid PK, key varchar(64) unique, location_key, lifecycle, created_at`; key immutable. |
| `menu_version` | `id, menu_id, version_no, locale, audience_class, tree_hash, state, approved/publication refs, version`; one active per menu/locale/audience. |
| `menu_item_version` | `menu_version_id, item_id, parent_item_id?, position, label, target_kind, target_ref, visibility jsonb, description?, icon_key?`; parent same version; unique position/sibling. |
| `route_manifest_version` | `id, version_no, publication_set_hash, state, generated_at, activated_at?`; immutable complete manifest. |
| `route_record` | `manifest_id, route_id, normalized_path, locale, target_kind, target_id/version, canonical, cache_class, audience`; unique manifest/path/locale. |
| `redirect_record` | `manifest_id, source_path, destination_path/route_id, status 301 \| 308, reason, active`; source unique; graph acyclic and ≤5 hops. |
| `discovery_metadata_version` | `publication_id, locale, title, description, canonical_url, noindex, social_asset_id?, breadcrumb jsonb, structured_data jsonb, policy_overrides[], hash`. |

### Assets, Rights, and Renditions

| Model | Fields and constraints |
|---|---|
| `asset_record` | `id, owner_party_id, purpose_code, classification, declared/detected_mime, byte_size, width/height/duration/pages?, checksum_algorithm/value, lifecycle, version`. |
| `storage_object` | `id, asset_id, bucket, object_key unique, upload_state, scanner_state, metadata_state, checksum, created_at`; key server-generated. |
| `asset_right` | `id, asset_id, claimant_party_id, rightsholder_party_id?, source_code, basis, use_codes[], territories[], starts/ends, audience, attribution, consent/evidence refs, state, version`. |
| `asset_accessibility` | `asset_id, use_code, locale, decorative, alt_text?, caption_ref?, transcript_ref?, focal_x/y?, author/reviewer, state, version`. |
| `transform_profile_version` | `key, version, input_kinds, operations jsonb, output_mime/dimensions/quality, max_output_bytes, a11y/rights rules, lifecycle, hash`; code-owned. |
| `rendition_record` | `id, asset_id, source_checksum, profile_key/version, transform_hash, object_id?, detected metadata, state, error_code?, version`; unique source/profile/transform hash. |
| `asset_reference` | `id, source_type/id/version/path, asset_id, rendition_id?, use_code, locale, audience, active_from/to, version`; exact reverse reference. |
| `delivery_purge` | `id, subject_type/id, subject_version, scope, reason_code, urgent, state, requested/completed_at, evidence/provider refs, version`. |

### Publication Delivery

| Model | Fields and constraints |
|---|---|
| `publication_projection` | `id, publication_id, route_manifest_id, locale, audience, render_payload jsonb, render_hash, discovery_hash, required_refs jsonb, state, version`; no drafts/admin fields. |
| `projection_consumer_state` | `publication_id, consumer route \| render \| menu \| media \| search \| sitemap \| cache \| social, expected_version, state, attempts, last_error_code, updated_at`; unique publication/consumer. |
| `active_delivery_pointer` | `route/locale/audience, publication_projection_id, route_manifest_id, switched_at, version`; transactionally switched. |
| `preview_session` | Shard 03 token hash plus user/context, exact version set, route/locale/audience, expires/revoked; delivery never broadens scope. |

## State Machines

| Aggregate | Allowed transitions |
|---|---|
| Menu/route/discovery version | `draft → review → approved → active → superseded \| revoked`; active immutable. |
| Asset | `pending_upload → uploaded → inspecting → quarantined \| ready \| rejected`; ready → `restricted \| archived \| takedown \| erasure_pending`; held blocks byte deletion. |
| Right | `claimed → reviewing → verified \| restricted \| unknown \| rejected`; verified → `expired \| disputed \| revoked`; any ineligible state removes affected uses. A transition into `restricted`, `disputed` or `revoked` is written only by an inbound `RevokeDeliveryEligibility` command from Shard 06, 10 or 20 (DEC-098). |
| Rendition | `queued → processing → ready \| failed_retryable \| failed_terminal \| revoked`; source/right change may revoke use without deleting output evidence. |
| Projection | `building → ready \| blocked \| failed_retryable → active → superseded \| revoked`. |
| Purge | `requested → dispatching → verifying → completed \| partial \| failed_retryable`; urgent partial remains incident/open. |

## Route and Menu Compilation

1. Normalize all paths and external URLs; reject reserved prefix, control character, active scheme, credential/userinfo, non-HTTPS external URL, collision and locale ambiguity.
2. Resolve menu typed targets against approved publication/route manifest; do not embed target private fields or authorization.
3. Validate tree parent ownership, no cycles/orphans, limits, label/accessibility, and visibility predicate registry.
4. Build redirect graph from all retained source paths; reject cycles, self loops, >5 hops, external open redirects, and destination into preview/admin/private route.
5. Generate canonical/breadcrumb/sitemap/social/structured data from explicit safe projection; apply policy overrides last.
6. Hash complete route/menu/discovery manifest and activate pointer only as a whole.

## Media Ingest and Rendition Algorithm

1. Authorize purpose/owner/quota and create Shard 00 upload intent/object metadata in `pending_upload`.
2. Client uploads private bytes. Completion job streams/checks byte count/checksum, detects MIME/magic, dimensions/duration/pages, archives/decompression limits, and strips unneeded risky metadata.
3. Scanner result `clean` plus metadata/profile checks are required for `ready`; unavailable scanner remains quarantined.
4. Content-hash match returns duplicate suggestion/physical-byte reuse option without exposing owners/references/rights.
5. Rights/accessibility records are independent and use-specific; asset ready does not mean publishable.
6. Rendition job resolves code-owned profile, source checksum, rights/use, and accessibility requirements; deterministic transform hash deduplicates output safely.
7. Output is re-inspected, checksummed and stored privately; publication creates signed/public versioned delivery only for eligible reference/audience.

## Rights and Reference Evaluation

- Eligibility requires active asset/object, clean inspection, matching use purpose, effective right/consent, allowed territory/audience, required attribution/accessibility, no dispute/takedown/hold conflict, and current source-domain permission. Every one of those facts is read from this shard's own `asset_right` and `TakedownCaseLink` rows; the evaluation performs no cross-shard read.
- Territories use ISO-3166-1 alpha-2 or sole `WORLDWIDE`; time bounds are UTC instants; empty use/territory never means universal.
- Upload/possession/self-claim is never verified rights. Shards 10, 20 and 06 may verify, dispute, revoke or hold — and they do so by calling this shard's protected `ApplyDeliveryHold`, `ReleaseDeliveryHold` and `RevokeDeliveryEligibility` commands with their own case reference (DEC-098). This shard records the assertion, attributes it to the calling shard and case, and executes the consequence; it never evaluates or overturns the caller's adjudication.
- Replacement creates a new asset/reference plan. Editors approve each semantic/crop/right change or bounded equivalent set; old references remain until switch.
- Urgent revocation marks affected references/projections ineligible and writes purge intent in one transaction before provider/cache work.
- Byte deletion happens only after no active/retained reference, right/evidence/dispute/legal hold, export/backup duty, or retention rule remains.

## Projection and Cache Algorithm

1. Consume exact Shard 03 `cms.publication.changed.v1`; lease by publication/version.
2. Load publication, schema/template/block/pattern/taxonomy/locale/settings versions and authorized current domain bindings.
3. Resolve menu/route/discovery and eligible media references; generate bounded render payload with no control-plane fields.
4. Build required route/render/menu/media states. Optional search/sitemap/social can lag only if no page correctness/privacy/discovery contract is violated.
5. Transactionally mark projection ready and switch active pointer from prior version; emit projection-ready.
6. Serve versioned ETag/cache key. Event-driven purge targets route/tag/version; long-lived hashed assets never mutate.
7. Failed purge cannot make version-addressed new route wrong, but stale canonical URLs are tracked as degraded until verified.

## Signed Delivery

- Private object URLs are minted server-side after PostgreSQL authorization and bind object/rendition ID, checksum/version, audience/user/party where required, disposition, maximum range/use, and expiry.
- Public publication assets use immutable content-hashed paths only after explicit public eligibility; takedown removes active pointer/CDN object or changes unguessable path—not merely waiting for signed URL expiry.
- User-provided filenames are display metadata only and never object keys/headers without sanitization.
- Range requests, download disposition and content type are allowlisted by purpose; no inline active document when attachment is required.

## Degraded Delivery and Recovery

- Last-known-good requires previously active verified projection, current route/audience authorization, no urgent purge/right/privacy block, and route-class maximum staleness.
- Public response includes truthful degraded status only where useful and safe; operational details remain private.
- If no safe projection exists, return explicit unavailable response. Never substitute empty page, unrelated locale, wrong jurisdiction, or draft.
- Recovery compares canonical publication/manifest/purge versions to every consumer, rebuilds missing/stale projections, purges stale keys, and verifies synthetic routes/media.
- Protected revocation path has independent credentials/runbook and is exercised in infrastructure verification.

## Concurrency and Idempotency

- Menu/route/metadata version activation requires expected active manifest and complete-tree hash.
- Upload completion, scanner callbacks, metadata extraction, rendition jobs and right-state webhooks deduplicate by object/asset/profile/provider IDs and expected versions.
- Slug changes reserve normalized path and redirect source in one transaction.
- Publication projection and active-pointer switch are idempotent by publication/version; stale builders cannot replace newer pointer.
- Purge attempts preserve one canonical purge ID and append provider attempt evidence; replay never changes business reason/scope.
- Inbound delivery commands deduplicate by calling shard, that shard's case reference, subject scope and expected version; a replay returns the first outcome and creates no second hold, right transition or purge.
- Because a lost command would leave this shard's materialised hold/right state behind the caller's adjudication, an outbox-backed reconciliation sweep re-asserts each calling shard's current case set against `TakedownCaseLink` and `asset_right`. A subject whose command state cannot be confirmed remains held; reconciliation never releases on uncertainty.

## Abuse and Recovery Verification

| Threat/failure | Required proof |
|---|---|
| Open redirect/route takeover | Reserved path, active scheme, external host, loop, hop, locale collision and stale redirect tests fail. |
| Navigation authorization bypass | Hidden/shown menu never changes endpoint/RLS result; wrong party/user tests remain denied. |
| Upload polyglot/malware/bomb | Declared/detected mismatch, scanner unavailable/infected, archive/decompression and metadata attacks stay quarantined. |
| Dedup tenant leak | Duplicate response exposes no other owner/reference/right and cannot grant byte access. |
| Signed URL overreach | Wrong user/party/audience/version/range/disposition/expiry tests deny. |
| Preview/public cache leak | Preview is no-store/noindex, token reauthenticates, public cache keys cannot include draft. |
| SEO privacy leak | Suppressed/unclaimed/private/embargoed targets absent from sitemap/social/structured data/cache. |
| Stale revoked content | Revocation transaction creates urgent purge; degraded path rejects affected last-known-good. |
| Partial convergence | Consumer status identifies exact lag/version; retry/rebuild produces one active pointer. |

## Cross-Shard Contracts

| Consumer | Contract |
|---|---|
| Shard 03 | Consumes exact publication/version manifests; returns projection/consumer readiness and purge evidence. |
| Shard 05 | Supplies protected route/cache/media policy definitions and consumes diagnostics; cannot weaken rights/privacy/security floors. |
| Shard 01/02 | Consumes party authority and viewer-safe profile/provenance constraints; CMS cannot publish hidden identity facts. |
| Shard 06 | Calls this shard's protected `ApplyDeliveryHold` / `ReleaseDeliveryHold` / `RevokeDeliveryEligibility` commands with its own dispute or takedown case reference. This shard writes `TakedownCaseLink`, performs delivery revoke/purge and returns completion evidence; it never reads Shard 06 state and does not adjudicate. |
| Shard 10 | Calls the same protected commands with its own rights-conflict or freeze case reference, setting `AssetRight.state` to `restricted`, `disputed` or `revoked`. This shard executes the delivery consequence; it never reads Shard 10 state and does not adjudicate ownership. |
| Shard 20 | Calls the same protected commands with its own licence or instrument-lifecycle case reference. This shard executes hold and eligibility consequences; it never reads Shard 20 state and does not adjudicate licence validity. |

All three edges point downward (06 → 04, 10 → 04, 20 → 04) and satisfy DEC-097; this shard declares no dependency on Shards 06, 10 or 20. DEC-098 fixes the inbound-command inversion as the mechanism, in place of an upward read or event-consumption edge.

## Implementation Envelope

- **Technology choice:** canonical domain state uses Supabase PostgreSQL with RLS, typed Hono/Zod command/query boundaries, transactional outbox events, Cloudflare Queue workers for bounded asynchronous effects, and Astro/React web/PWA projections; external systems remain replaceable provider adapters.
- **Rationale:** one PostgreSQL authority plus additive events prevents split truth, RLS enforces tenant/party scope near data, and queued adapters isolate provider latency without weakening canonical-state or p95 web-read guarantees.
- **Phasing:** (1) schema/RLS/settings and capability gates, (2) commands/events/idempotency, (3) projections and accessible surface, (4) provider or counsel-gated effects only after their evidence gate; disabled capability schemas/commands remain unreachable.
- **Failure modes:** validation/authority/version failures stop before mutation; ambiguous provider outcomes remain typed pending/unknown; retries reuse idempotency keys; projection lag exposes freshness; deletion/revocation preserves required evidence and invalidates derived access.
- **Integration contracts:** the parent [04-cms-delivery-media § Contracts](../04-cms-delivery-media.md#contracts) defines commands/queries and [04-cms-delivery-media § Event Schemas](../04-cms-delivery-media.md#event-schemas) defines asynchronous handoff. Producers retain canonical ownership; consumers never strengthen provenance, permission, confidence or terminal state.

## Changelog

| Date | Change | Workflow | Sections Affected |
|---|---|---|---|
| 2026-08-02 | Initial deep-dive skeleton | /decompose-architecture-validate | All |
| 2026-08-02 | Authored route, media, rights, rendition, projection, signing, cache, purge and recovery contracts | /write-architecture-spec-deepen | All |
| 2026-08-05 | A-25 — applied DEC-098 inbound-command inversion: replaced the undeclared `Shard 06/10/20` consumer row with three downward caller rows, restated eligibility as a local-state read, and added inbound-command idempotency plus the reconciliation sweep | `/resolve-ambiguity` | Scope, Rights and Reference Evaluation, Concurrency and Idempotency, Cross-Shard Contracts |

## Dependency References

- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]


<!-- spec-graph: auto-generated -->
## Related Specs

### References
- [[specs/ia/04-cms-delivery-media|Shard 04 — CMS navigation, media and delivery]]
- [[specs/ia/03-cms-content-modeling|Shard 03 — CMS content modeling and authoring]]
- [[specs/ia/01-identity-authority|Shard 01 — Identity authority and party governance]]
- [[specs/ia/00-infrastructure|Shard 00 — Cross-cutting platform foundation]]
- [[specs/2026-08-02-architecture-design|WeJammin — Architecture Design]]
