import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { verifyContentSchemaRegistryRetainedReports } from '../../infra/workflows/content-schema-registry-retained-report-verifier.ts';
import { produceAc265RetainedHostedE2eReportV3 } from '../../infra/workflows/ac265-retained-report-producer.ts';
import {
  createIntegratedRetainedFixture,
  productionRequestFor,
  retainedVerificationFor,
} from './ac265-retained-report-production.test-support.ts';

const FAILURE = /retained report redaction failed/iu;

// The integrated producer is the only public production entrypoint: it takes
// the authenticated assembler inputs plus trusted run facts, assembles the
// report itself, derives every trusted digest from the resolver, and publishes
// the exact serialized bytes. These tests exercise that path, so the suite
// cannot pass by wiring an externally assembled report through a publisher.
describe('AC265 retained hosted E2E report producer', () => {
  it('assembles, redacts, binds, and writes from the authenticated resolver in one call', () => {
    const built = createIntegratedRetainedFixture();
    const verification = retainedVerificationFor(built.production);
    const written = readFileSync(built.produced.absolutePath, 'utf8');
    const parsed = JSON.parse(written) as {
      runId: string;
      runnerContractSha256: string;
    };

    // The published digest must describe the exact bytes on disk.
    expect(built.produced.sha256).toBe(
      createHash('sha256')
        .update(readFileSync(built.produced.absolutePath))
        .digest('hex'),
    );
    expect(parsed.runId).toBe(built.production.contract.runId);
    expect(parsed.runnerContractSha256).toBe(
      built.production.context.expectedRunnerContractSha256,
    );
    expect(() =>
      verifyContentSchemaRegistryRetainedReports(
        built.evidence as never,
        verification.expectedIdentity as never,
        built.retained.reportRoot,
        verification.hostedV3Verification as never,
      ),
    ).not.toThrow();
  });

  it('rejects an integrated request whose trusted window is not the assembled run window', () => {
    const request = productionRequestFor();

    for (const window of [
      { reportCompletedAt: '2026-09-03T11:05:00.000Z' },
      { reportStartedAt: '2026-09-03T10:31:00.000Z' },
    ])
      expect(() =>
        produceAc265RetainedHostedE2eReportV3({
          ...request,
          provenance: { ...request.provenance, ...window },
        }),
      ).toThrow(FAILURE);
  });

  it('rejects an integrated request whose trusted contract digest is not the exact contract bytes', () => {
    const request = productionRequestFor();

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...request,
        provenance: {
          ...request.provenance,
          expectedRunnerContractSha256: 'd'.repeat(64),
        },
      }),
    ).toThrow(FAILURE);
  });

  it('rejects caller-supplied receipt or evidence digests on the integrated path', () => {
    const request = productionRequestFor();

    // Digests are derived from the authenticated resolver, so submitting them is
    // an unknown field rather than an accepted trust input.
    for (const injected of [
      { trustedReceiptSlots: {} },
      { trustedEvidenceSha256: {} },
    ])
      expect(() =>
        produceAc265RetainedHostedE2eReportV3({
          ...request,
          provenance: { ...request.provenance, ...injected },
        }),
      ).toThrow(FAILURE);
  });

  it('rejects unknown request fields and a missing assembly', () => {
    const request = productionRequestFor();

    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        ...request,
        acceptedReport: {},
      } as unknown as typeof request),
    ).toThrow(FAILURE);
    expect(() =>
      produceAc265RetainedHostedE2eReportV3({
        provenance: request.provenance,
        reportRoot: request.reportRoot,
        declaredReportPath: request.declaredReportPath,
      }),
    ).toThrow(FAILURE);
  });
});
