import {
  assertAc265RetainedReportV3BytesRedaction,
  type Ac265RetainedReportRedactionProvenance,
} from './ac265-retained-report-redactor.ts';
import {
  failAc265RetainedReport,
  hasExactAc265Keys,
  isAc265Record,
} from './ac265-retained-report-provenance.ts';
import {
  writeAc265RetainedReportAtomically,
  type Ac265RetainedReportWriteResult,
} from './ac265-retained-report-writer.ts';

const PUBLICATION_INPUT_KEYS = [
  'reportBytes',
  'provenance',
  'reportRoot',
  'declaredReportPath',
] as const;

export type Ac265RetainedReportPublicationInput = Readonly<{
  /** Exact retained-report bytes, already in the one canonical byte form. */
  reportBytes: Uint8Array;
  /** Complete trusted run facts, including resolver-derived digests. */
  provenance: Ac265RetainedReportRedactionProvenance;
  /** Approved report root; the published file is the only entry created. */
  reportRoot: string;
  /** Relative path declared by the retained-release sidecar. */
  declaredReportPath: string;
}>;

/**
 * Byte-level retained-report publication boundary.
 *
 * This is NOT the producer. It is the narrow boundary for callers that already
 * hold retained-report bytes and the complete trusted provenance — including the
 * receipt and evidence digests derived from authenticated resolver bytes. It
 * carries no assembler, no broker, and no resolver, so a caller must supply
 * provenance that can only come from authenticated sources. Prefer the
 * integrated `produceAc265RetainedHostedE2eReportV3`, which derives those
 * digests itself.
 *
 * Ordering is deliberate: bytes are validated in full (duplicate-member
 * rejection, strict schema, provenance binding, prohibited-content inspection)
 * before the report root is created or inspected, so a rejected report leaves
 * no directory behind. The published digest is SHA-256 over the exact bytes
 * written.
 */
export const publishAc265RetainedReportV3Bytes = (
  input: unknown,
): Ac265RetainedReportWriteResult => {
  try {
    if (
      !isAc265Record(input) ||
      !hasExactAc265Keys(input, PUBLICATION_INPUT_KEYS)
    )
      return failAc265RetainedReport();
    const reportBytes = input['reportBytes'];
    if (!(reportBytes instanceof Uint8Array) || reportBytes.byteLength === 0)
      return failAc265RetainedReport();

    assertAc265RetainedReportV3BytesRedaction(reportBytes, input['provenance']);

    return writeAc265RetainedReportAtomically({
      reportRoot: input['reportRoot'] as string,
      declaredReportPath: input['declaredReportPath'] as string,
      bytes: reportBytes,
    });
  } catch {
    return failAc265RetainedReport();
  }
};
