import { describe, expect, it, vi } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  contextFor,
  createFixture,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { jsonBytes, sha256, uuidFor } from './ac265-hosted-test-fixtures.ts';

const receiptIssuedAt = '2026-09-03T10:59:00.000Z';
const logoutPolicy = 'current_session_only';

type TestFixture = ReturnType<typeof createFixture>;
type ReceiptSlot = TestFixture['slots'][number];
type EvidenceKind =
  'role_assertion' | 'scenario_observation' | 'session_teardown';
type EvidenceReference = {
  kind: string;
  ref: string;
  sha256: string;
};
type EvidencePayload = Record<string, string>;
type ReceiptEnvelope = Record<string, unknown> & {
  result: Record<string, unknown>;
  issuedAt?: string;
};
type SessionTeardown = {
  sessionRefSha256: string;
  outcome: 'logged_out';
  evidence: EvidenceReference;
};

let evidenceSequence = 0;

const reportRecord = (fixture: TestFixture) =>
  fixture.report as unknown as Record<string, unknown>;

const findReceiptSlot = (
  fixture: TestFixture,
  kind: 'role' | 'scenario' | 'cleanup',
  index = 0,
): ReceiptSlot => {
  const targetIndex = kind === 'cleanup' ? 40 : index;
  const slot = fixture.slots.find(
    (candidate) => candidate.kind === kind && candidate.index === targetIndex,
  );
  if (slot === undefined)
    throw new Error(`Fixture ${kind} receipt ${index} is missing.`);
  return slot;
};

const rewriteReceipt = (
  fixture: TestFixture,
  slot: ReceiptSlot,
  update: (envelope: ReceiptEnvelope) => ReceiptEnvelope,
): void => {
  const bytes = fixture.receiptBytes.get(slot.ref);
  if (bytes === undefined)
    throw new Error('Fixture receipt bytes are missing.');
  const envelope = JSON.parse(
    Buffer.from(bytes).toString('utf8'),
  ) as ReceiptEnvelope;
  const replacement = jsonBytes(update(envelope));
  fixture.receiptBytes.set(slot.ref, replacement);
  withReceiptHash(fixture.report, slot, sha256(replacement));
};

const recordEvidence = (
  fixture: TestFixture,
  evidenceBytes: Map<string, Uint8Array>,
  kind: EvidenceKind,
  subject: Record<string, string>,
  sessionRefSha256?: string,
): EvidenceReference => {
  const sequence = evidenceSequence++;
  const ref = `ac265-evidence://blob/${uuidFor(sequence + 4_000)}`;
  const artifactBytes = Buffer.from(`synthetic execution artifact ${sequence}`);
  const payload: EvidencePayload = {
    schemaVersion: 'ac265-execution-evidence-v1',
    candidateIdentitySha256: sha256(jsonBytes(fixture.contract.identity)),
    subjectSha256: sha256(jsonBytes(subject)),
    kind,
    artifactSha256: sha256(artifactBytes),
    ...(sessionRefSha256 === undefined ? {} : { sessionRefSha256 }),
  };
  const bytes = jsonBytes(payload);
  evidenceBytes.set(ref, bytes);
  return { kind, ref, sha256: sha256(bytes) };
};

const updateResultRow = (
  fixture: TestFixture,
  collection: 'roles' | 'scenarios',
  index: number,
  executionEvidence: readonly EvidenceReference[],
): void => {
  const report = reportRecord(fixture);
  const rows = [...(report[collection] as Array<Record<string, unknown>>)];
  rows[index] = { ...rows[index], executionEvidence };
  report[collection] = rows;
};

const setReceiptEvidence = (
  fixture: TestFixture,
  kind: 'role' | 'scenario',
  index: number,
  evidence: EvidenceReference,
): void => {
  const collection = kind === 'role' ? 'roles' : 'scenarios';
  updateResultRow(fixture, collection, index, [evidence]);
  rewriteReceipt(
    fixture,
    findReceiptSlot(fixture, kind, index),
    (envelope) => ({
      ...envelope,
      result: { ...envelope.result, executionEvidence: [evidence] },
    }),
  );
};

const replaceCleanupFields = (
  fixture: TestFixture,
  fields: Record<string, unknown>,
): void => {
  const report = reportRecord(fixture);
  report['cleanup'] = {
    ...(report['cleanup'] as Record<string, unknown>),
    ...fields,
  };
  rewriteReceipt(fixture, findReceiptSlot(fixture, 'cleanup'), (envelope) => ({
    ...envelope,
    result: { ...envelope.result, ...fields },
  }));
};

const makeFixtureWithExecutionEvidence = () => {
  const fixture = createFixture({
    includeCandidateIdentityReceipt: true,
    includeExecutionBindings: true,
    receiptIssuedAt,
  });
  const evidenceBytes = new Map<string, Uint8Array>();

  for (
    let index = 0;
    index < CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.length;
    index++
  ) {
    const role = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES[index];
    setReceiptEvidence(
      fixture,
      'role',
      index,
      recordEvidence(fixture, evidenceBytes, 'role_assertion', {
        kind: 'role',
        key: role,
      }),
    );
  }
  for (
    let index = 0;
    index < CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.length;
    index++
  ) {
    const scenario = CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS[index];
    setReceiptEvidence(
      fixture,
      'scenario',
      index,
      recordEvidence(fixture, evidenceBytes, 'scenario_observation', {
        kind: 'scenario',
        key: scenario,
      }),
    );
  }

  const sessionTeardowns = Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role) => {
      const sessionRefSha256 = fixture.contract.sessionHandles[role].sha256;
      return [
        role,
        {
          sessionRefSha256,
          outcome: 'logged_out',
          evidence: recordEvidence(
            fixture,
            evidenceBytes,
            'session_teardown',
            { kind: 'session_teardown', key: role },
            sessionRefSha256,
          ),
        } satisfies SessionTeardown,
      ];
    }),
  );
  replaceCleanupFields(fixture, { logoutPolicy, sessionTeardowns });
  const cleanupCompletedAt = (
    reportRecord(fixture)['cleanup'] as { completedAt: string }
  ).completedAt;
  rewriteReceipt(fixture, findReceiptSlot(fixture, 'cleanup'), (envelope) => ({
    ...envelope,
    issuedAt: cleanupCompletedAt,
  }));

  return { fixture, evidenceBytes };
};

const validateFixture = (
  fixture: TestFixture,
  evidenceBytes: Map<string, Uint8Array>,
  resolveEvidence: (ref: string) => Uint8Array | undefined = (ref) =>
    evidenceBytes.get(ref),
) =>
  validateContentSchemaRegistryHostedE2eReportV3(
    fixture.report,
    fixture.contractBytes,
    { ...contextFor(fixture, fixture.contract), resolveEvidence },
  );

const firstEvidence = (
  fixture: TestFixture,
  collection: 'roles' | 'scenarios',
  index = 0,
): EvidenceReference => {
  const rows = reportRecord(fixture)[collection] as Array<
    Record<string, unknown>
  >;
  const evidence = rows[index]?.['executionEvidence'] as
    EvidenceReference[] | undefined;
  if (evidence?.[0] === undefined)
    throw new Error(`Fixture ${collection} evidence is missing.`);
  return evidence[0];
};

const rewriteEvidencePayload = (
  fixture: TestFixture,
  evidenceBytes: Map<string, Uint8Array>,
  collection: 'roles' | 'scenarios',
  index: number,
  update: (payload: EvidencePayload) => EvidencePayload,
): void => {
  const evidence = firstEvidence(fixture, collection, index);
  const bytes = evidenceBytes.get(evidence.ref);
  if (bytes === undefined)
    throw new Error('Fixture evidence bytes are missing.');
  const payload = JSON.parse(
    Buffer.from(bytes).toString('utf8'),
  ) as EvidencePayload;
  const replacement = jsonBytes(update(payload));
  evidenceBytes.set(evidence.ref, replacement);
  setReceiptEvidence(
    fixture,
    collection === 'roles' ? 'role' : 'scenario',
    index,
    {
      ...evidence,
      sha256: sha256(replacement),
    },
  );
};

describe('AC265 signed execution-evidence binding', () => {
  it('accepts signed role/scenario evidence bound to the exact candidate identity and complete cleanup', () => {
    const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
    const resolveEvidence = vi.fn((ref: string) => evidenceBytes.get(ref));

    expect(validateFixture(fixture, evidenceBytes, resolveEvidence)).toEqual(
      fixture.report,
    );
    expect(resolveEvidence).toHaveBeenCalledWith(
      firstEvidence(fixture, 'roles').ref,
    );
  });

  it('rejects role/scenario evidence bytes that differ from their signed digests', () => {
    for (const collection of ['roles', 'scenarios'] as const) {
      const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
      const evidence = firstEvidence(fixture, collection);
      evidenceBytes.set(evidence.ref, Buffer.from('different synthetic bytes'));

      expect(() => validateFixture(fixture, evidenceBytes)).toThrow(
        /evidence.*digest|digest.*evidence|evidence bytes/iu,
      );
    }
  });

  it('rejects unresolved evidence references and evidence kinds outside the allowlist', () => {
    for (const mutation of ['reference', 'kind'] as const) {
      const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
      const evidence = firstEvidence(fixture, 'roles');
      const changed =
        mutation === 'reference'
          ? { ...evidence, ref: `ac265-evidence://blob/${uuidFor(99_999)}` }
          : { ...evidence, kind: 'unapproved_payload' };
      setReceiptEvidence(fixture, 'role', 0, changed);

      expect(() => validateFixture(fixture, evidenceBytes)).toThrow(
        mutation === 'reference'
          ? /evidence bytes are unavailable/iu
          : /report v3 body is invalid/iu,
      );
    }
  });

  it.each([
    { field: 'candidateIdentitySha256', binding: 'candidate identity' },
    { field: 'subjectSha256', binding: 'exact subject' },
  ] as const)('rejects evidence not bound to the $binding', ({ field }) => {
    for (const collection of ['roles', 'scenarios'] as const) {
      const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
      rewriteEvidencePayload(
        fixture,
        evidenceBytes,
        collection,
        0,
        (payload) => ({
          ...payload,
          [field]: 'f'.repeat(64),
        }),
      );

      expect(() => validateFixture(fixture, evidenceBytes)).toThrow(
        /candidate identity|subject|evidence binding/iu,
      );
    }
  });

  it.each([
    'missing_session',
    'changed_session_digest',
    'reused_evidence',
  ] as const)(
    'rejects cleanup that does not bind every session teardown exactly (%s)',
    (mutation) => {
      const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
      const cleanup = reportRecord(fixture)['cleanup'] as Record<
        string,
        unknown
      >;
      const sessionTeardowns = {
        ...(cleanup['sessionTeardowns'] as Record<string, SessionTeardown>),
      };
      const role = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES[0];
      if (mutation === 'missing_session') delete sessionTeardowns[role];
      else if (mutation === 'reused_evidence') {
        const secondRole = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES[1];
        sessionTeardowns[secondRole] = {
          ...sessionTeardowns[secondRole],
          evidence: sessionTeardowns[role].evidence,
        };
      } else
        sessionTeardowns[role] = {
          ...sessionTeardowns[role],
          sessionRefSha256: 'f'.repeat(64),
        };
      replaceCleanupFields(fixture, { sessionTeardowns });

      expect(() => validateFixture(fixture, evidenceBytes)).toThrow(
        mutation === 'missing_session'
          ? /report v3 body is invalid/iu
          : /cleanup|session|teardown|binding|evidence/iu,
      );
    },
  );

  it('rejects cleanup when any session teardown evidence bytes fail their digest', () => {
    const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
    const cleanup = reportRecord(fixture)['cleanup'] as Record<string, unknown>;
    const sessionTeardowns = cleanup['sessionTeardowns'] as Record<
      string,
      SessionTeardown
    >;
    const role = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES[0];
    const evidence = sessionTeardowns[role].evidence;
    evidenceBytes.set(evidence.ref, Buffer.from('altered synthetic teardown'));

    expect(() => validateFixture(fixture, evidenceBytes)).toThrow(
      /cleanup.*evidence|evidence.*digest|evidence bytes/iu,
    );
  });

  it('rejects cleanup that widens logout beyond the fixed current-session policy', () => {
    const { fixture, evidenceBytes } = makeFixtureWithExecutionEvidence();
    replaceCleanupFields(fixture, { logoutPolicy: 'all_sessions' });

    expect(() => validateFixture(fixture, evidenceBytes)).toThrow(
      /report v3 body is invalid/iu,
    );
  });
});
