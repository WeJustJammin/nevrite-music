import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { buildAc265HostedRunManifestV1 } from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import { readAc265HostedRunManifestV1Bytes } from '../../infra/workflows/ac265-hosted-run-manifest-crypto.ts';
import { produceAc265RetainedHostedE2eReportV3 } from '../../infra/workflows/ac265-retained-report-producer.ts';
import { sha256Ref, uuidFor } from './ac265-hosted-test-fixtures.ts';
import {
  AC265_PRODUCTION_CORRELATION_ID,
  cleanupProductionSandboxes,
  createProductionFixture,
  createProductionRoot,
  productionRequestFor,
  runManifestFor,
} from './ac265-retained-report-production.test-support.ts';

const FAILURE = /retained report redaction failed/iu;
const sha256 = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

afterEach(cleanupProductionSandboxes);

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
});
