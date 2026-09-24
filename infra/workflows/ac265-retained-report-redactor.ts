import {
  ContentSchemaRegistryHostedE2eReportV3Schema,
  type ContentSchemaRegistryHostedE2eReportV3,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import { assertAc265RetainedReportV3Bindings } from './ac265-retained-report-binding.ts';
import {
  MAX_RETAINED_REPORT_BYTES,
  failAc265RetainedReport,
  parseAc265RetainedReportProvenance,
} from './ac265-retained-report-provenance.ts';
import {
  AC265_RETAINED_REPORT_FAILURE,
  assertAc265RetainedReportProhibitedContentAbsent,
} from './ac265-retained-report-prohibited-content.ts';
import { parseJsonWithoutDuplicateMembers } from './strict-json-object-members.ts';

export { AC265_RETAINED_REPORT_FAILURE };
export { MAX_RETAINED_REPORT_BYTES };
export type { Ac265RetainedReportRedactionProvenance } from './ac265-retained-report-provenance.ts';

/**
 * The retained-report redaction boundary.
 *
 * Layers, in order, and all four must pass:
 *
 * 1. **Provenance** — the trusted run facts (contract bytes, identity, run,
 *    session/resource references, authenticated receipt references) are parsed
 *    and their structural classes enforced.
 * 2. **Strict schema** — the value must satisfy the locked
 *    `ac265-hosted-e2e-v3` schema exactly, with no unknown members.
 * 3. **Provenance binding** — every identity field, receipt reference,
 *    session-reference digest, resource binding, and the run window must equal
 *    the trusted value, so a schema-valid report for another run is rejected.
 * 4. **Content inspection** — the decoded member names and string leaves are
 *    checked for prohibited material (credentials, session state, cookies,
 *    tokens, personal addresses, retained binary observation payloads).
 *
 * There is deliberately no global high-entropy scan: the contract's own UUID,
 * revision, and digest values are high-entropy by design, and secrets can be
 * made to match a digest. Structural classes plus provenance equality plus a
 * focused marker vocabulary are the guard; a digest or a locally resolvable
 * fixture is never proof of anything.
 */
export const assertAc265RetainedReportV3Redaction = (
  value: unknown,
  provenance: unknown,
): ContentSchemaRegistryHostedE2eReportV3 => {
  try {
    const trusted = parseAc265RetainedReportProvenance(provenance);
    const parsed =
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(value);
    if (!parsed.success) return failAc265RetainedReport();
    const report = parsed.data;
    assertAc265RetainedReportV3Bindings(report, trusted);
    assertAc265RetainedReportProhibitedContentAbsent(report);
    return report;
  } catch {
    return failAc265RetainedReport();
  }
};

/**
 * Byte-boundary form. Duplicate JSON object members are rejected after escape
 * decoding, before `JSON.parse`, so escaped-equivalent spellings such as
 * `"role"` and `"\u0072ole"` cannot be resolved by last-member-wins behavior.
 */
export const assertAc265RetainedReportV3BytesRedaction = (
  bytes: unknown,
  provenance: unknown,
): ContentSchemaRegistryHostedE2eReportV3 => {
  let value: unknown;
  try {
    if (
      !(bytes instanceof Uint8Array) ||
      bytes.byteLength === 0 ||
      bytes.byteLength > MAX_RETAINED_REPORT_BYTES
    )
      return failAc265RetainedReport();
    value = parseJsonWithoutDuplicateMembers(
      Buffer.from(bytes).toString('utf8'),
      'Hosted E2E retained report v3',
    );
  } catch {
    return failAc265RetainedReport();
  }
  return assertAc265RetainedReportV3Redaction(value, provenance);
};
