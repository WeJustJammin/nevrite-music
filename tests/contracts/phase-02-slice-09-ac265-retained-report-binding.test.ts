import { describe, expect, it } from 'vitest';

import { buildAc265HostedRunManifestV1 } from '../../infra/workflows/ac265-hosted-run-manifest.ts';
import { assertAc265RetainedReportV3Redaction } from '../../infra/workflows/ac265-retained-report-redactor.ts';
import {
  mutateProductionReport,
  productionContractFor,
} from './ac265-retained-report-production.test-support.ts';
import {
  PROHIBITED,
  assembleProductionReport,
} from './ac265-retained-report-redaction.test-support.ts';

// These cases target the binding layers rather than the content vocabulary:
// slot-exact receipts, the trusted contract digest, the authenticated session
// and resource digests, and the run window. Each asserts a rejection that a
// syntax-only or set-membership check would wrongly accept.
describe('AC265 retained report provenance binding', () => {
  it('binds every receipt reference to its own slot instead of to set membership', () => {
    const { report, provenance } = assembleProductionReport();
    const first = report.roles[0]!.serverReceipt.ref;
    const second = report.roles[1]!.serverReceipt.ref;

    // Swapping two role references leaves the reference set unchanged, so only
    // slot-exact binding can reject it.
    expect(() =>
      assertAc265RetainedReportV3Redaction(
        mutateProductionReport(report, (copy) => {
          const roles = copy['roles'] as Record<string, unknown>[];
          (roles[0]!['serverReceipt'] as Record<string, unknown>)['ref'] =
            second;
          (roles[1]!['serverReceipt'] as Record<string, unknown>)['ref'] =
            first;
        }),
        provenance,
      ),
    ).toThrow(PROHIBITED);
  });

  it('binds the runner contract digest to the exact trusted bytes', () => {
    const { report, provenance } = assembleProductionReport();

    // A fabricated 64-hex digest must fail: the digest is recomputed from the
    // exact contract bytes and compared to the independently trusted value.
    for (const runnerContractSha256 of ['a'.repeat(64), 'b'.repeat(64)])
      expect(() =>
        assertAc265RetainedReportV3Redaction(
          mutateProductionReport(report, (copy) => {
            copy['runnerContractSha256'] = runnerContractSha256;
          }),
          provenance,
        ),
      ).toThrow(PROHIBITED);

    // A trusted digest that does not describe the trusted bytes fails too.
    for (const expectedRunnerContractSha256 of ['c'.repeat(64), '0'.repeat(64)])
      expect(() =>
        assertAc265RetainedReportV3Redaction(report, {
          ...provenance,
          expectedRunnerContractSha256,
        }),
      ).toThrow(PROHIBITED);
  });

  it('rejects contract bytes that do not hash to the trusted contract digest', () => {
    const { report, provenance } = assembleProductionReport();
    const tampered = Buffer.from(provenance.runnerContractBytes);
    tampered[0] = 0x20;

    expect(() =>
      assertAc265RetainedReportV3Redaction(report, {
        ...provenance,
        runnerContractBytes: tampered,
      }),
    ).toThrow(PROHIBITED);
  });

  it('binds contract bytes exactly, so an alternate byte form of the same contract fails', () => {
    const { report, provenance } = assembleProductionReport();
    // The CP-04f builder emits canonical code-point-ordered contract bytes while
    // this harness emits insertion-ordered `JSON.stringify` bytes. Both describe
    // the same contract and identity, so only the digest half of the binding
    // can distinguish them.
    const canonical = buildAc265HostedRunManifestV1({
      correlationId: '20000000-0000-4000-8000-000000000001',
      runnerContract: productionContractFor(),
    });
    const canonicalBytes = canonical.runnerContractBytes();
    expect(
      Buffer.from(canonicalBytes).equals(
        Buffer.from(provenance.runnerContractBytes),
      ),
    ).toBe(false);

    // Same contract, different bytes: the report's digest cannot satisfy a
    // trusted digest taken over the canonical form, and vice versa.
    expect(() =>
      assertAc265RetainedReportV3Redaction(report, {
        ...provenance,
        runnerContractBytes: canonicalBytes,
        expectedRunnerContractSha256: canonical.runnerContractSha256,
      }),
    ).toThrow(PROHIBITED);
  });

  it('rejects forged session and resource digests in the trusted context', () => {
    const { report, provenance } = assembleProductionReport();
    const role = 'entitled_read';
    const resourceKind = provenance.trustedResourceRefs[0]!.kind;

    // The trusted session/resource digests are authenticated by the runner
    // contract; a forged value must not be accepted as proof.
    expect(() =>
      assertAc265RetainedReportV3Redaction(report, {
        ...provenance,
        trustedSessionHandles: {
          ...provenance.trustedSessionHandles,
          [role]: {
            ...provenance.trustedSessionHandles[role],
            sha256: 'e'.repeat(64),
          },
        },
      }),
    ).toThrow(PROHIBITED);

    expect(() =>
      assertAc265RetainedReportV3Redaction(report, {
        ...provenance,
        trustedResourceRefs: provenance.trustedResourceRefs.map((resource) =>
          resource.kind === resourceKind
            ? { ...resource, sha256: 'f'.repeat(64) }
            : resource,
        ),
      }),
    ).toThrow(PROHIBITED);

    // The same forged value injected into the report is rejected too.
    expect(() =>
      assertAc265RetainedReportV3Redaction(
        mutateProductionReport(report, (copy) => {
          const cleanup = copy['cleanup'] as Record<string, unknown>;
          const teardowns = cleanup['sessionTeardowns'] as Record<
            string,
            Record<string, unknown>
          >;
          teardowns[role]!['sessionRefSha256'] = 'e'.repeat(64);
        }),
        provenance,
      ),
    ).toThrow(PROHIBITED);

    // A forged resource digest inside the report is rejected as well.
    expect(() =>
      assertAc265RetainedReportV3Redaction(
        mutateProductionReport(report, (copy) => {
          const cleanup = copy['cleanup'] as Record<string, unknown>;
          const resources = cleanup['verifiedResources'] as Record<
            string,
            unknown
          >[];
          resources[0]!['sha256'] = 'f'.repeat(64);
        }),
        provenance,
      ),
    ).toThrow(PROHIBITED);
  });

  it('accepts cleanup completing before the report window closes', () => {
    const { report, provenance } = assembleProductionReport();

    // The locked contract requires cleanup inside the report window, not equal
    // to its end, so genuine teardown that finishes earlier must be accepted.
    const earlier = mutateProductionReport(report, (copy) => {
      (copy['cleanup'] as Record<string, unknown>)['completedAt'] =
        '2026-09-03T10:59:30.000Z';
    });
    expect(() =>
      assertAc265RetainedReportV3Redaction(earlier, provenance),
    ).not.toThrow();
  });

  it('rejects a report that exceeds the trusted release cutoff', () => {
    const { report, provenance } = assembleProductionReport();

    expect(() =>
      assertAc265RetainedReportV3Redaction(report, {
        ...provenance,
        trustedCutoffAt: '2026-09-03T10:00:00.000Z',
      }),
    ).toThrow(PROHIBITED);
  });
});
