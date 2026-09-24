import type { Ac265HostedE2eReceiptReferences } from './ac265-hosted-e2e-report-assembler.ts';
import { sha256Ac265HostedSemanticSubject } from './ac265-hosted-semantic-subject.ts';
import { CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  failAc265RetainedReport,
  sha256Ac265RetainedReportBytes,
  type Ac265RetainedReportReceiptSlots,
  type Ac265TrustedReference,
} from './ac265-retained-report-provenance.ts';
import {
  isAc265HostedArtifactResolver,
  type Ac265HostedArtifactResolver,
} from './content-schema-registry-hosted-e2e-protected-context.ts';

const RECEIPT_SUBJECT = {
  candidateIdentity: { kind: 'candidate_identity', key: 'candidate' },
  cleanup: { kind: 'cleanup', key: 'cleanup' },
} as const;

/** The parts of an assembled report needed to attribute each evidence ref. */
export type Ac265HostedEvidenceSubjectSource = Readonly<{
  roles: readonly Readonly<{
    role: string;
    executionEvidence?: readonly Readonly<{ ref: string }>[];
  }>[];
  scenarios: readonly Readonly<{
    scenario: string;
    executionEvidence?: readonly Readonly<{ ref: string }>[];
  }>[];
  cleanup: Readonly<{
    sessionTeardowns?: Readonly<
      Record<string, Readonly<{ evidence: Readonly<{ ref: string }> }>>
    >;
  }>;
}>;

/**
 * Attributes every published execution-evidence reference to the subject it
 * proves. The producer resolves each reference with this exact subject, so the
 * resolver — not the report — decides which bytes the digest describes.
 */
export const listAc265HostedEvidenceSubjects = (
  report: Ac265HostedEvidenceSubjectSource,
): ReadonlyMap<string, { kind: string; key: string }> => {
  const subjects = new Map<string, { kind: string; key: string }>();
  for (const role of report.roles)
    for (const evidence of role.executionEvidence ?? [])
      subjects.set(evidence.ref, { kind: 'role', key: role.role });
  for (const scenario of report.scenarios)
    for (const evidence of scenario.executionEvidence ?? [])
      subjects.set(evidence.ref, { kind: 'scenario', key: scenario.scenario });
  for (const role of CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES) {
    const teardown = report.cleanup.sessionTeardowns?.[role];
    if (teardown !== undefined)
      subjects.set(teardown.evidence.ref, {
        kind: 'session_teardown',
        key: role,
      });
  }
  return subjects;
};

/**
 * Derives the trusted receipt and evidence digests from the authenticated
 * resolver itself.
 *
 * Each reference is resolved to its exact raw bytes and hashed here, so the
 * expected digests describe bytes that an authenticated source actually
 * produced. A digest copied out of the report — or fabricated — cannot enter
 * the trusted map, which is what keeps a synthetic 64-hex value from
 * satisfying the redaction binding.
 *
 * The resolver's own attestation is what authenticates those bytes: the exact
 * run, candidate identity, runner-contract digest, subject, and validity window
 * are all enforced inside `resolveReceipt`/`resolveEvidence`.
 */
export const deriveAc265TrustedReferenceDigests = (input: {
  resolver: Ac265HostedArtifactResolver;
  reportStartedAt: string;
  receiptRefs: Ac265HostedE2eReceiptReferences;
  evidenceSubjects: ReadonlyMap<string, { kind: string; key: string }>;
}): Readonly<{
  receiptSlots: Ac265RetainedReportReceiptSlots;
  evidenceSha256: Readonly<Record<string, string>>;
}> => {
  if (!isAc265HostedArtifactResolver(input.resolver))
    return failAc265RetainedReport();
  const resolve = (
    ref: string,
    subject: unknown,
    kind: 'receipt' | 'evidence',
  ): Ac265TrustedReference => {
    const request = {
      ref,
      reportStartedAt: input.reportStartedAt,
      expectedSubjectSha256: sha256Ac265HostedSemanticSubject(subject),
    };
    const resolution =
      kind === 'receipt'
        ? input.resolver.resolveReceipt(request)
        : input.resolver.resolveEvidence(request);
    return {
      ref,
      sha256: sha256Ac265RetainedReportBytes(resolution.bytes),
    };
  };

  const evidenceSha256: Record<string, string> = {};
  for (const [ref, subject] of input.evidenceSubjects)
    evidenceSha256[ref] = resolve(ref, subject, 'evidence').sha256;

  return {
    receiptSlots: {
      candidateIdentity: resolve(
        input.receiptRefs.candidateIdentity,
        RECEIPT_SUBJECT.candidateIdentity,
        'receipt',
      ),
      roles: Object.fromEntries(
        Object.entries(input.receiptRefs.roles).map(([role, ref]) => [
          role,
          resolve(ref, { kind: 'role', key: role }, 'receipt'),
        ]),
      ),
      scenarios: Object.fromEntries(
        Object.entries(input.receiptRefs.scenarios).map(([scenario, ref]) => [
          scenario,
          resolve(ref, { kind: 'scenario', key: scenario }, 'receipt'),
        ]),
      ),
      cleanup: resolve(
        input.receiptRefs.cleanup,
        RECEIPT_SUBJECT.cleanup,
        'receipt',
      ),
    },
    evidenceSha256,
  };
};
