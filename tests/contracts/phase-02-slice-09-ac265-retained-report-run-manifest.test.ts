import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { buildAc265HostedRunManifestV1 } from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import { readAc265HostedRunManifestV1Bytes } from '../../infra/workflows/ac265-hosted-run-manifest-crypto.ts';
import {
  produceAc265RetainedHostedE2eReportV3,
  type Ac265RetainedReportProductionOutcome,
} from '../../infra/workflows/ac265-retained-report-producer.ts';
import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { MAX_RETAINED_REPORT_BYTES } from '../../infra/workflows/ac265-retained-report-provenance.ts';
import { parseJsonBytesWithoutDuplicateMembers } from '../../infra/workflows/strict-json-object-members.ts';
import {
  contextFor,
  createFixture,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { sha256Ref, uuidFor } from './ac265-hosted-test-fixtures.ts';
import {
  AC265_PRODUCTION_CORRELATION_ID,
  AC265_PRODUCTION_RECEIPT_ISSUED_AT,
  cleanupProductionSandboxes,
  createProductionFixture,
  createProductionRoot,
  productionContract,
  productionReceiptReferences,
  productionRequestFor,
  runManifestFor,
} from './ac265-retained-report-production.test-support.ts';
import {
  completeEvidence,
  expectedIdentity,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';

const FAILURE = /retained report redaction failed/iu;
const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

afterEach(cleanupProductionSandboxes);

// Compile-time equality: resolves to `false` when the two types differ, which
// makes the assignment below a type error and fails the type-check gate.
type AssertEqual<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;

/**
 * Builds a production fixture whose runner contract lists the safe resource
 * references in a caller-chosen order. The hosted resource-reference schema is
 * a four-element set (every kind exactly once, distinct), so array order carries
 * no meaning and must not change whether the run manifest binds.
 */
const productionFixtureWithResourceOrder = (
  resourceRefs: typeof productionContract.resourceRefs,
) => {
  const contract = {
    ...productionContract,
    resourceRefs,
  } as typeof productionContract;
  const fixture = createFixture({
    contract,
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt: AC265_PRODUCTION_RECEIPT_ISSUED_AT,
  });
  return {
    fixture,
    contract,
    context: contextFor(fixture, contract),
    receiptRefs: productionReceiptReferences(fixture),
    releaseEvidence: completeEvidence,
    expectedIdentity,
  };
};

// The retained V3 producer previously carried no run-manifest member at all,
// even though CP-04f/CP-04g own a frozen run-manifest contract, builder, and
// digest-bound read boundary that nothing in the repository imported. These
// tests pin the producer-side integration: the exact canonical manifest bytes
// and their digest are a required protected input, the digest is recomputed
// from those bytes, and the manifest membership must match the same runner
// contract the report is assembled from.
describe('AC265 retained report run-manifest binding', () => {
  it('publishes the canary digest of the exact manifest bytes the verifier recomputes', () => {
    const production = createProductionFixture();
    const manifest = runManifestFor(production);
    const produced = produceAc265RetainedHostedE2eReportV3(
      productionRequestFor(production, createProductionRoot()),
    );

    // The verifier-recomputed digest must equal the digest the producer
    // published for the manifest it was handed.
    const recomputed = sha256(produced.runManifestBytes());
    expect(recomputed).toBe(produced.runManifestSha256);
    expect(recomputed).toBe(manifest.manifestSha256);

    // The digest-bound read boundary is the hosted consumer entrypoint, so the
    // published bytes must be readable back through it under the same digest.
    expect(
      readAc265HostedRunManifestV1Bytes(
        produced.runManifestBytes(),
        produced.runManifestSha256,
      ),
    ).toEqual(manifest.manifest);
  });

  it('rejects a request that supplies no run-manifest bytes or digest', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());
    const withoutBytes = { ...request } as Partial<typeof request>;
    delete withoutBytes.runManifestBytes;
    const withoutDigest = { ...request } as Partial<typeof request>;
    delete withoutDigest.expectedRunManifestSha256;

    for (const incomplete of [withoutBytes, withoutDigest, {}])
      expect(() => produceAc265RetainedHostedE2eReportV3(incomplete)).toThrow(
        FAILURE,
      );
  });

  it('rejects insertion-ordered manifest bytes instead of canonicalizing them', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());
    const canonical = runManifestFor(production);
    // Same logical manifest, deliberately non-canonical member order: the
    // canonical form sorts object members by code point, so reversing the
    // serialized member order must produce different bytes for equal values.
    const members = JSON.parse(
      Buffer.from(canonical.manifestBytes()).toString('utf8'),
    ) as Record<string, unknown>;
    const insertionOrdered = Buffer.from(
      JSON.stringify(Object.fromEntries(Object.entries(members).reverse())),
      'utf8',
    );
    expect(
      insertionOrdered.equals(Buffer.from(canonical.manifestBytes())),
    ).toBe(false);

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...request,
        runManifestBytes: new Uint8Array(insertionOrdered),
        expectedRunManifestSha256: sha256(insertionOrdered),
      }),
    ).toThrow(FAILURE);
  });

  it('rejects a manifest digest that does not describe the supplied bytes', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());

    for (const digest of [
      'a'.repeat(64),
      request.expectedRunManifestSha256.toUpperCase(),
      request.expectedRunManifestSha256.slice(0, 63),
      '',
    ])
      expect(() =>
        produceAc265RetainedHostedE2eReportV3({
          ...request,
          expectedRunManifestSha256: digest,
        }),
      ).toThrow(FAILURE);
  });

  it('rejects a manifest that describes a different run, identity, or reference set', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());
    const contract = production.contract;

    const drift = [
      // A manifest for another run of the same candidate.
      runManifestFor({
        ...production,
        contract: {
          ...contract,
          runId: '20000000-0000-4000-8000-000000000009',
        },
      } as typeof production),
      // A manifest for a different candidate build.
      buildAc265HostedRunManifestV1({
        correlationId: AC265_PRODUCTION_CORRELATION_ID,
        runnerContract: {
          ...contract,
          identity: { ...contract.identity, sourceRevision: 'b'.repeat(40) },
        },
      }),
      // A manifest whose session reference set disagrees with the contract while
      // staying internally consistent, so only the cross-binding can reject it.
      buildAc265HostedRunManifestV1({
        correlationId: AC265_PRODUCTION_CORRELATION_ID,
        runnerContract: {
          ...contract,
          sessionHandles: {
            ...contract.sessionHandles,
            owner_full: (() => {
              const ref = `ac265-session://owner_full/${uuidFor(940)}`;
              return { ref, sha256: sha256Ref(ref) };
            })(),
          },
        },
      }),
    ];

    // The drifted manifests are still internally valid; they are rejected
    // because they do not describe this run's contract.
    for (const manifest of drift)
      expect(() =>
        produceAc265RetainedHostedE2eReportV3({
          ...request,
          runManifestBytes: manifest.manifestBytes(),
          expectedRunManifestSha256: manifest.manifestSha256,
        }),
      ).toThrow(FAILURE);
  });

  it('rejects unknown request fields rather than accepting an unchecked manifest', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...request,
        runManifest: runManifestFor(production).manifest,
      }),
    ).toThrow(FAILURE);
  });

  it('snapshots the manifest bytes so a caller cannot mutate them after binding', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());
    const callerOwned = new Uint8Array(request.runManifestBytes);
    const published = produceAc265RetainedHostedE2eReportV3({
      ...request,
      runManifestBytes: callerOwned,
    });

    // Overwrite every byte the caller still holds: the published digest and the
    // copy-on-read accessor must describe the snapshot that was verified.
    callerOwned.fill(0);
    const readback = published.runManifestBytes();
    expect(sha256(readback)).toBe(published.runManifestSha256);
    expect(readback).toEqual(request.runManifestBytes);

    // The returned accessor hands out copies, not the retained snapshot.
    readback.fill(0);
    expect(sha256(published.runManifestBytes())).toBe(
      published.runManifestSha256,
    );
  });

  it('leaves no report on disk when the manifest binding is rejected', () => {
    const production = createProductionFixture();
    const reportRoot = createProductionRoot();

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...productionRequestFor(production, reportRoot),
        expectedRunManifestSha256: 'b'.repeat(64),
      }),
    ).toThrow(FAILURE);
    expect(readdirSync(reportRoot)).toEqual([]);
  });

  it('binds a contract that lists the same safe resource references in a shuffled order', () => {
    const reversedRefs = [...productionContract.resourceRefs].reverse();
    // Reversing changes the array order only; the four kind/ref/digest triples
    // are identical, so the contract describes the same logical resource set.
    expect(reversedRefs.map(({ kind }) => kind)).toEqual(
      [...productionContract.resourceRefs].map(({ kind }) => kind).reverse(),
    );
    const production = productionFixtureWithResourceOrder(reversedRefs);
    const manifest = runManifestFor(production);

    // The manifest builder normalizes the resource set to the locked kind
    // order, so its bytes differ from the contract's raw order while describing
    // the same set. Binding must follow the schema's set semantics.
    const published = produceAc265RetainedHostedE2eReportV3(
      productionRequestFor(production, createProductionRoot()),
    );
    expect(published.runManifestSha256).toBe(manifest.manifestSha256);
    expect(sha256(published.runManifestBytes())).toBe(
      published.runManifestSha256,
    );

    // A partially shuffled order (rotated rather than reversed) must bind too.
    const rotated = [
      ...productionContract.resourceRefs.slice(2),
      ...productionContract.resourceRefs.slice(0, 2),
    ];
    const rotatedFixture = productionFixtureWithResourceOrder(rotated);
    expect(() =>
      produceAc265RetainedHostedE2eReportV3(
        productionRequestFor(rotatedFixture, createProductionRoot()),
      ),
    ).not.toThrow();
  });

  it('still rejects a resource reference whose ref or digest actually drifts', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());

    // Same kinds, same order, but one reference points at another object. The
    // role bindings are remapped too, so the drifted contract is internally
    // valid and only the cross-binding to the request's contract can reject it.
    const originalRef = productionContract.resourceRefs[0].ref;
    const driftedRef = `ac265-resource://${productionContract.resourceRefs[0].kind}/${uuidFor(960)}`;
    const driftedRefs = productionContract.resourceRefs.map(
      (resource, index) =>
        index === 0
          ? { ...resource, ref: driftedRef, sha256: sha256Ref(driftedRef) }
          : resource,
    );
    const driftedBindings = Object.fromEntries(
      Object.entries(productionContract.roleResourceBindings).map(
        ([role, references]) => [
          role,
          references.map((reference) =>
            reference === originalRef ? driftedRef : reference,
          ),
        ],
      ),
    ) as typeof productionContract.roleResourceBindings;
    const drifted = buildAc265HostedRunManifestV1({
      correlationId: AC265_PRODUCTION_CORRELATION_ID,
      runnerContract: {
        ...productionContract,
        resourceRefs: driftedRefs,
        roleResourceBindings: driftedBindings,
      },
    });

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...request,
        runManifestBytes: drifted.manifestBytes(),
        expectedRunManifestSha256: drifted.manifestSha256,
      }),
    ).toThrow(FAILURE);
  });

  it('caps the runner contract before parsing so an oversized contract is rejected undecoded', () => {
    const production = createProductionFixture();
    const request = productionRequestFor(production, createProductionRoot());
    // A schema-valid contract padded past the cap with in-document whitespace.
    // The padding keeps the JSON and the schema valid, so only the byte bound
    // can reject it — without a pre-decode cap this request would publish.
    const canonical = Buffer.from(
      Buffer.from(request.assembly.runnerContractBytes).toString('utf8'),
    ).toString('utf8');
    const padding = ' '.repeat(MAX_RETAINED_REPORT_BYTES);
    const paddedContract = Buffer.from(
      `{${padding}${canonical.slice(1)}`,
      'utf8',
    );
    expect(paddedContract.byteLength).toBeGreaterThan(
      MAX_RETAINED_REPORT_BYTES,
    );
    // Sanity: the padded document is still valid, schema-valid JSON.
    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
        parseJsonBytesWithoutDuplicateMembers(
          new Uint8Array(paddedContract),
          'padded contract',
        ),
      ).success,
    ).toBe(true);

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...request,
        assembly: {
          ...request.assembly,
          runnerContractBytes: new Uint8Array(paddedContract),
        },
      }),
    ).toThrow(FAILURE);
  });

  it('returns the manifest digest and bytes as part of the documented outcome', () => {
    const production = createProductionFixture();
    const published: Ac265RetainedReportProductionOutcome =
      produceAc265RetainedHostedE2eReportV3(
        productionRequestFor(production, createProductionRoot()),
      );

    // The outcome carries the write result plus the bound manifest identity,
    // and nothing in the module still advertises the pre-manifest alias.
    const equal: AssertEqual<
      typeof published,
      Ac265RetainedReportProductionOutcome
    > = true;
    expect(equal).toBe(true);
    expect(Object.keys(published).sort()).toEqual([
      'absolutePath',
      'bytes',
      'path',
      'runManifestBytes',
      'runManifestSha256',
      'sha256',
    ]);
  });
});
