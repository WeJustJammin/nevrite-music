# AC265 hosted artifact-source manifest and authority — CP04d local/private foundation

**Date:** 2026-09-21  
**Scope:** local/private signed source-manifest, authority-ledger, resolver, and staging-retry foundation  
**Verdict:** CP04d local validation, exact-main CI, and staging promotion are GREEN as private construction evidence; hosted AC265 acceptance remains OPEN

## Implemented boundary

CP04d adds the signed artifact-source manifest contract and authority boundary
across:

- `packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-artifact-source-manifest.ts`
- `infra/workflows/ac265-hosted-artifact-source-manifest-crypto.ts`
- `infra/workflows/ac265-hosted-artifact-source-manifest.ts`
- `infra/workflows/ac265-hosted-artifact-source-manifest-bindings.ts`
- `infra/workflows/ac265-hosted-semantic-subject.ts`
- `infra/workflows/content-schema-registry-hosted-e2e-verification-context.ts`
- `infra/workflows/content-schema-registry-hosted-e2e-receipt-verifier.ts`
- `infra/workflows/content-schema-registry-hosted-e2e-evidence-verifier.ts`
- `infra/workflows/content-schema-registry-retained-hosted-context.ts`
- `supabase/migrations/20260921050000_ac265_hosted_artifact_source_authority.sql`

The manifest uses a domain-separated Ed25519 signature, strict duplicate-free
canonical JSON, code-point ordering, exact UUID-v4 references, exact source
membership, kind-specific receipt/evidence references, bounded payloads, and a
server-derived authorization window. `manifestSha256` is bound separately from
the request hash. Authorization must cover the manifest issuance and expiry
window; caller-provided timing is not authority.

The database authority implements immutable reserve-to-finalize/readback state,
server-derived candidate/run/identity/source-revision/deployment bindings,
idempotent replay protection, and concurrency-safe source registration. Its
readback reports truthful `sourceSetComplete` and `kindComplete` fields only;
neither field asserts acceptance or substitutes for the hosted acceptance
report. A reserve response is never publishable; publication and verification
must use finalized-only readback. The ledger stores references and digests only:
no raw artifact bytes,
private keys, locators, credentials, or seeded live evidence are introduced.

The resolver, semantic-subject serializer, and protected verification context
reject structural or callback-only substitutes, snapshot mutable inputs before
use, clone byte boundaries, and pass the report start and independently derived
subject digest through receipt/evidence verification. Staging verification now
prevalidates inputs and retries the complete release contract for **13 attempts
at 5 seconds**.

## Deferred publication tranche

The SQL-to-TypeScript projection remains intentionally deferred to the next
publication tranche. The protected authority source, trusted-key source, and
runner-contract source are also deferred to that tranche; this record does not
invent or imply those publication sources. Until they are published and
verified, a reserve response cannot be used as an artifact, receipt, or
acceptance input—only finalized authority readback is eligible.

## Focused verification evidence

The known focused TypeScript evidence set reports **16 files / 104 tests**,
covering the manifest contract, canonicalization and signature boundary,
security/coverage cases, resolver integration, semantic-subject handling,
receipt/evidence context hardening, and staging retry behavior.

The initial full-validation attempt failed because the fixture `PUBLIC_KEY_PEM`
re-export was missing. The root cause was fixed; focused **8/8** and
**12-repeat** stability checks passed before the successful rerun. Final local
`pnpm validate` passed **562 files** with **4,498 passed + 1 skipped / 4,499**,
100% coverage (**13,184 statements, 9,862 branches, 2,164 functions, 12,263
lines**); Slice 09 evidence passed, Playwright passed **101/101 functional**
and **5/5 real-route** checks, builds and bundle budgets passed, and local API
p95 was **1.2129150000000095 ms**.

Focused database authority evidence reports **78/78 assertions** and the
concurrency proof reports **6/6** (**84/84 total**). After a fresh reset, final
local `pnpm db:verify` passed with migrations through `20260921050000`;
database lint had existing warnings only, **61 files / 2,208 tests** passed,
and generated types matched.

PR #91 merged to `main` at exact SHA
`289ed3a2f4f92da383aa1464340f804777496257`. Exact-main CI run
`35656504913` succeeded across all three jobs. Automatic staging run
`35657406613` succeeded on `run_attempt=1`, with deployment
`6578526934`. The candidate artifact is `10665966829` with digest
`sha256:d51c0104d8ea7933e5d4a45af021b0ac2067a24150739390edb58e171cab827c`;
the deployment evidence artifact is `10665756858` with digest
`sha256:2724a98beb5e2152b7c601697c95042af508ee94d2e62da7ee143495362c9664`;
the recorded source `artifactDigest` is
`0e92da9874c0fae7e0d62fb4419678a83f00a8986087de558dc101c465451c04`.
The promoted migration is `20260921050000`; provider deployment IDs are
`dac978c4-fe9d-4c86-9cf4-53d96a42d45e` and
`b27ddb9f-0ab3-4c07-88da-5ff8ea0b2f7b`. Staging p95 was
**29.956710999999927 ms** against the **500 ms** threshold. The automated axe
digest is `6a7f59d9792a176e3032a9b410c6a0c1bb03850f27ed2918bc98fe82fddbbcf4`,
with serious/critical counts **0/0**. These are exact-main CI and staging
promotion proofs only; staging proof does not equal hosted AC265 acceptance.

## Acceptance boundary

This record is local/private construction evidence only. It does not claim:

- live hosted producer or source population of the authority ledger;
- protected signer execution or a retained hosted source-manifest artifact;
- an independently authenticated delivery/evidence receipt;
- the complete hosted Auth/RLS/IdP browser matrix, role lifecycle, MFA/step-up,
  teardown, or accepted 9-role/10-scenario report;
- AC265 hosted acceptance.

AC265 remains **OPEN**. AC209 remains open after its read-only provider failure,
and AC211 remains open because no qualifying complete UTC-day sample/DLQ report
exists. Slice 10 remains locked on AC209, AC211, and AC265. AC266 remains
owner-deferred because the required real devices are unavailable; it is
unchecked, not passed/waived/simulated, excluded from the active Phase 2
denominator, and mandatory for post-Phase 2 production readiness/release.

Totals are unchanged: Slice 09 is **279/282 active** with **283 authored IDs**;
Phase 2 is **8/17 slices** with **1,999/2,000 active criteria**.
