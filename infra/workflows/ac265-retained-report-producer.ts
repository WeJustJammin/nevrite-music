import {
  assembleAc265HostedE2eReportV3,
  type Ac265HostedE2eReportV3AssemblyInput,
} from './ac265-hosted-e2e-report-assembler.ts';
import {
  publishAc265RetainedReportV3Bytes,
  type Ac265RetainedReportPublicationInput,
} from './ac265-retained-report-publication.ts';
import {
  AC265_RETAINED_REPORT_FAILURE,
  type Ac265RetainedReportRedactionProvenance,
} from './ac265-retained-report-redactor.ts';
import {
  failAc265RetainedReport,
  hasExactAc265Keys,
  isAc265Record,
} from './ac265-retained-report-provenance.ts';
import type { Ac265RetainedReportWriteResult } from './ac265-retained-report-writer.ts';
import { deriveAc265TrustedReferenceDigests } from './ac265-retained-report-trusted-digests.ts';
import {
  listAc265HostedEvidenceSubjects,
  type Ac265HostedEvidenceSubjectSource,
} from './ac265-retained-report-trusted-digests.ts';
import { parseAc265RetainedReportRunManifest } from './ac265-retained-report-run-manifest.ts';

export { AC265_RETAINED_REPORT_FAILURE };
export { resolveAc265RetainedReportRoot } from './ac265-retained-report-writer.ts';
export type { Ac265RetainedReportRedactionProvenance };

export type { Ac265RetainedReportPublicationInput };

export type Ac265RetainedReportProductionOutcome =
  Ac265RetainedReportWriteResult &
    Readonly<{
      /** Digest of the exact canonical run-manifest bytes this run bound. */
      runManifestSha256: string;
      /** Copy-on-read accessor for those same published bytes. */
      runManifestBytes: () => Uint8Array;
    }>;

/**
 * Top-level producer request: the authenticated assembler inputs plus the
 * trusted run facts and the relative path the retained-release sidecar
 * declares. The caller supplies the exact runner-contract bytes, the
 * authenticated artifact resolver, and the receipt references; this module
 * never invents a broker, receipt, or evidence contract.
 *
 * Deliberately absent: receipt and evidence digests. They are derived from the
 * authenticated resolver, so a fabricated 64-hex value cannot enter as proof.
 */
export type Ac265RetainedReportProductionRequest = Readonly<{
  assembly: Ac265HostedE2eReportV3AssemblyInput;
  /**
   * Exact canonical `ac265-hosted-run-manifest-v1` bytes. The run manifest is
   * the protected run's own authorization container, so it is a required
   * protected input rather than an assembled value: the producer reads it
   * through the digest-bound CP-04g boundary and binds its membership to the
   * same runner contract the report is assembled from.
   */
  runManifestBytes: Uint8Array;
  /** Independently trusted digest of those exact bytes. */
  expectedRunManifestSha256: string;
  provenance: Omit<
    Ac265RetainedReportRedactionProvenance,
    'trustedReceiptSlots' | 'trustedEvidenceSha256'
  >;
  reportRoot: string;
  declaredReportPath: string;
}>;

const PRODUCTION_REQUEST_KEYS = [
  'assembly',
  'runManifestBytes',
  'expectedRunManifestSha256',
  'provenance',
  'reportRoot',
  'declaredReportPath',
] as const;

// Exactly the trusted facts the integrated caller supplies. Receipt and
// evidence digests are intentionally absent: they are read back out of the
// authenticated resolver, so a fabricated value cannot be submitted as proof.
const REQUEST_PROVENANCE_KEYS = [
  'reportStartedAt',
  'reportCompletedAt',
  'runnerContractBytes',
  'expectedRunnerContractSha256',
  'trustedIdentity',
  'trustedRunId',
  'trustedCutoffAt',
  'trustedSessionHandles',
  'trustedResourceRefs',
] as const;

/**
 * Produces the retained hosted E2E report end to end.
 *
 * This is the integrated path: it calls the existing assembler with the
 * supplied authenticated inputs, serializes the assembled report exactly once
 * into the retained byte form, then validates and publishes those exact bytes.
 * Serializing once matters — the digest the verifier checks must describe the
 * bytes that were written, not a second serialization of the same value.
 *
 * Authenticity of the underlying hosted source is the caller's: this module
 * requires an authenticated resolver and the trusted context values, and it
 * claims no hosted acceptance on its own.
 */
export const produceAc265RetainedHostedE2eReportV3 = (
  input: unknown,
): Ac265RetainedReportProductionOutcome => {
  try {
    if (
      !isAc265Record(input) ||
      !hasExactAc265Keys(input, PRODUCTION_REQUEST_KEYS)
    )
      return failAc265RetainedReport();
    const assembly = input['assembly'] as Ac265HostedE2eReportV3AssemblyInput;
    const provenance = input[
      'provenance'
    ] as Ac265RetainedReportProductionRequest['provenance'];
    // The integrated path derives receipt and evidence digests from the
    // authenticated resolver, so those fields are not accepted from a caller;
    // an injected value is rejected rather than silently overridden.
    if (
      !isAc265Record(provenance) ||
      !hasExactAc265Keys(provenance, REQUEST_PROVENANCE_KEYS)
    )
      return failAc265RetainedReport();
    // The trusted window must describe the run being assembled; otherwise the
    // provenance would be describing a different attempt.
    if (
      provenance['reportStartedAt'] !== assembly.startedAt ||
      provenance['reportCompletedAt'] !== assembly.completedAt
    )
      return failAc265RetainedReport();
    // The protected run manifest is read and bound before the report is
    // assembled or any directory is created, so a request whose manifest does
    // not describe this exact run leaves nothing behind.
    const runManifest = parseAc265RetainedReportRunManifest({
      runManifestBytes: input['runManifestBytes'],
      expectedRunManifestSha256: input['expectedRunManifestSha256'],
      runnerContractBytes: (assembly as { runnerContractBytes?: unknown })
        .runnerContractBytes,
    });
    const report = assembleAc265HostedE2eReportV3(assembly);
    // Trusted digests come from the authenticated source, never from the caller
    // or from the report: each reference is resolved and hashed here.
    const derived = deriveAc265TrustedReferenceDigests({
      resolver: assembly.resolver,
      reportStartedAt: assembly.startedAt,
      receiptRefs: assembly.receiptRefs,
      evidenceSubjects: listAc265HostedEvidenceSubjects(
        report as unknown as Ac265HostedEvidenceSubjectSource,
      ),
    });
    const published = publishAc265RetainedReportV3Bytes({
      reportBytes: serializeAc265RetainedReportV3(report),
      provenance: {
        ...provenance,
        trustedReceiptSlots: derived.receiptSlots,
        trustedEvidenceSha256: derived.evidenceSha256,
      },
      reportRoot: input['reportRoot'],
      declaredReportPath: input['declaredReportPath'],
    });
    // The published manifest bytes are the exact verified snapshot, so a
    // consumer recomputing the digest over them reproduces the published value.
    return Object.freeze({
      ...published,
      runManifestSha256: runManifest.sha256,
      runManifestBytes: runManifest.bytes,
    });
  } catch {
    return failAc265RetainedReport();
  }
};

/**
 * Serializes an assembled report into the retained-report byte form: a
 * two-space-indented JSON document with one trailing newline. These are the
 * exact bytes the digest binds and the verifier reads, so the same function is
 * used to produce and to re-derive them.
 */
export const serializeAc265RetainedReportV3 = (report: unknown): Uint8Array => {
  try {
    return Buffer.from(`${JSON.stringify(report, null, 2)}\n`, 'utf8');
  } catch {
    return failAc265RetainedReport();
  }
};
