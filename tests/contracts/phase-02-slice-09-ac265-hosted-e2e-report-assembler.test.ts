import { describe, expect, it } from 'vitest';

import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  assembleAc265HostedE2eReportV3,
  type Ac265HostedE2eReceiptReferences,
  type Ac265HostedE2eReportV3AssemblyInput,
} from '../../infra/workflows/ac265-hosted-e2e-report-assembler.ts';
import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import {
  contextFor,
  createFixture,
} from './ac265-hosted-receipt-test-fixtures.ts';
import {
  jsonBytes,
  sha256 as sha256Bytes,
  uuidFor,
} from './ac265-hosted-test-fixtures.ts';
import { sha256Ac265HostedSemanticSubject } from '../../infra/workflows/ac265-hosted-semantic-subject.ts';

type Fixture = ReturnType<typeof createFixture>;
type ReceiptKind = 'candidate' | 'role' | 'scenario' | 'cleanup';

const ASSEMBLY_OPTIONS = {
  includeCandidateIdentityReceipt: true,
  includeExecutionBindings: true,
  receiptIssuedAt: '2026-09-03T11:00:00.000Z',
} as const;

const receiptRefFor = (fixture: Fixture, kind: ReceiptKind, index: number) => {
  const slot = fixture.slots.find(
    (candidate) => candidate.kind === kind && candidate.index === index,
  );
  if (slot === undefined) throw new Error(`Missing ${kind} receipt slot.`);
  return slot.ref;
};

const receiptReferencesFor = (
  fixture: Fixture,
): Ac265HostedE2eReceiptReferences => ({
  candidateIdentity: receiptRefFor(fixture, 'candidate', 50),
  roles: Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES.map((role, index) => [
      role,
      receiptRefFor(fixture, 'role', index),
    ]),
  ) as unknown as Ac265HostedE2eReceiptReferences['roles'],
  scenarios: Object.fromEntries(
    CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS.map((scenario, index) => [
      scenario,
      receiptRefFor(fixture, 'scenario', index),
    ]),
  ) as unknown as Ac265HostedE2eReceiptReferences['scenarios'],
  cleanup: receiptRefFor(fixture, 'cleanup', 40),
});

const assemblyInputFor = (
  fixture: Fixture,
): Ac265HostedE2eReportV3AssemblyInput => ({
  runnerContractBytes: fixture.contractBytes,
  resolver: contextFor(fixture).resolver,
  startedAt: fixture.report.startedAt,
  completedAt: fixture.report.completedAt,
  receiptRefs: receiptReferencesFor(fixture),
});

const rewriteReceiptEnvelope = (
  fixture: Fixture,
  ref: string,
  mutate: (envelope: Record<string, unknown>) => Record<string, unknown>,
): void => {
  const bytes = fixture.receiptBytes.get(ref);
  if (bytes === undefined) throw new Error('Receipt bytes are missing.');
  const envelope = JSON.parse(Buffer.from(bytes).toString('utf8')) as Record<
    string,
    unknown
  >;
  fixture.receiptBytes.set(ref, jsonBytes(mutate(envelope)));
};

describe('AC265 hosted E2E report v3 assembler', () => {
  it('assembles the exact report from authenticated inputs and passes the hosted v3 verifier', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const input = assemblyInputFor(fixture);

    const report = assembleAc265HostedE2eReportV3(input);

    expect(report).toEqual(fixture.report);
    expect(Object.isFrozen(report)).toBe(true);
    expect(ContentSchemaRegistryHostedE2eReportV3Schema.parse(report)).toEqual(
      report,
    );
    expect(
      validateContentSchemaRegistryHostedE2eReportV3(
        report,
        fixture.contractBytes,
        contextFor(fixture),
      ),
    ).toEqual(report);
  });

  it('fails closed when the resolver is not an authenticated resolver', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const input = assemblyInputFor(fixture);

    expect(() =>
      assembleAc265HostedE2eReportV3({
        ...input,
        resolver: { ...input.resolver } as typeof input.resolver,
      }),
    ).toThrow(/assembly|authenticated|resolver/i);
  });

  it('derives every emitted receipt digest from the resolver-authenticated bytes, not the input', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const resolver = contextFor(fixture).resolver;
    const input: Ac265HostedE2eReportV3AssemblyInput = {
      ...assemblyInputFor(fixture),
      resolver,
    };

    const report = assembleAc265HostedE2eReportV3(input);

    // The resolver attests artifactSha256 over the exact bytes it verifies. The
    // assembler must emit a digest of those authenticated bytes, so it must
    // equal both the recomputed bytes digest and the resolver's attested value.
    const firstRole = CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES[0]!;
    const resolveFor = (ref: string, subject: unknown) =>
      resolver.resolveReceipt({
        ref,
        reportStartedAt: input.startedAt,
        expectedSubjectSha256: sha256Ac265HostedSemanticSubject(subject),
      });
    const candidateResolution = resolveFor(
      input.receiptRefs.candidateIdentity,
      {
        kind: 'candidate_identity',
        key: 'candidate',
      },
    );
    const roleResolution = resolveFor(input.receiptRefs.roles[firstRole], {
      kind: 'role',
      key: firstRole,
    });
    const cleanupResolution = resolveFor(input.receiptRefs.cleanup, {
      kind: 'cleanup',
      key: 'cleanup',
    });

    expect(report.candidateIdentityReceipt.sha256).toBe(
      sha256Bytes(candidateResolution.bytes),
    );
    expect(report.roles[0]!.serverReceipt.sha256).toBe(
      sha256Bytes(roleResolution.bytes),
    );
    expect(report.cleanup.serverReceipt.sha256).toBe(
      sha256Bytes(cleanupResolution.bytes),
    );
    // The emitted digest equals the authenticated (signed) artifact digest, not
    // a caller-supplied value.
    expect(report.roles[0]!.serverReceipt.sha256).toBe(
      roleResolution.artifact.artifactSha256,
    );
    expect(report.roles[0]!.serverReceipt.sha256).toBe(
      roleResolution.attestation.artifactSha256,
    );
    expect(candidateResolution.artifact.artifactSha256).toBe(
      candidateResolution.attestation.artifactSha256,
    );
    expect(cleanupResolution.artifact.artifactSha256).toBe(
      cleanupResolution.attestation.artifactSha256,
    );
    expect(report.candidateIdentityReceipt.sha256).toBe(
      candidateResolution.artifact.artifactSha256,
    );
    expect(report.cleanup.serverReceipt.sha256).toBe(
      cleanupResolution.artifact.artifactSha256,
    );
    expect(report.candidateIdentityReceipt.ref).toBe(
      input.receiptRefs.candidateIdentity,
    );
  });

  it('rejects an authenticated receipt result that carries a field outside the report allowlist', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const roleRef = receiptRefFor(fixture, 'role', 0);
    rewriteReceiptEnvelope(fixture, roleRef, (envelope) => ({
      ...envelope,
      result: {
        ...(envelope['result'] as Record<string, unknown>),
        operatorEmail: 'operator@example.test',
      },
    }));

    expect(() =>
      assembleAc265HostedE2eReportV3(assemblyInputFor(fixture)),
    ).toThrow(/assembly|allowlist|unexpected|field/i);
  });

  it('rejects a receipt result field that belongs only to another slot instead of silently dropping it', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const roleRef = receiptRefFor(fixture, 'role', 0);
    rewriteReceiptEnvelope(fixture, roleRef, (envelope) => ({
      ...envelope,
      result: {
        ...(envelope['result'] as Record<string, unknown>),
        // Valid for a cleanup receipt, never for a role receipt.
        logoutPolicy: 'current_session_only',
      },
    }));

    expect(() =>
      assembleAc265HostedE2eReportV3(assemblyInputFor(fixture)),
    ).toThrow(/assembly|allowlist|unexpected|field/i);
  });

  it('rejects a scenario receipt result that carries a role-only field', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const scenarioRef = receiptRefFor(fixture, 'scenario', 0);
    rewriteReceiptEnvelope(fixture, scenarioRef, (envelope) => ({
      ...envelope,
      result: {
        ...(envelope['result'] as Record<string, unknown>),
        // Valid for a role receipt, never for a scenario receipt.
        beforeStateSha256: 'a'.repeat(64),
      },
    }));

    expect(() =>
      assembleAc265HostedE2eReportV3(assemblyInputFor(fixture)),
    ).toThrow(/assembly|allowlist|unexpected|field/i);
  });

  it('rejects an authenticated receipt whose identity does not match the runner contract', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const roleRef = receiptRefFor(fixture, 'role', 0);
    rewriteReceiptEnvelope(fixture, roleRef, (envelope) => ({
      ...envelope,
      identity: {
        ...(envelope['identity'] as Record<string, unknown>),
        deploymentId: 'deployment-33469999999',
      },
    }));

    expect(() =>
      assembleAc265HostedE2eReportV3(assemblyInputFor(fixture)),
    ).toThrow(/assembly|identity|contract/i);
  });

  it('fails closed when a receipt reference is outside the authenticated source set', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const input = assemblyInputFor(fixture);

    expect(() =>
      assembleAc265HostedE2eReportV3({
        ...input,
        receiptRefs: {
          ...input.receiptRefs,
          roles: {
            ...input.receiptRefs.roles,
            entitled_read: `ac265-receipt://server/${uuidFor(9_001)}`,
          },
        },
      }),
    ).toThrow(/assembly|membership|authenticated/i);
  });

  it('fails closed when the run window is not a positive ordered interval', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const input = assemblyInputFor(fixture);

    for (const window of [
      { startedAt: input.completedAt, completedAt: input.startedAt },
      { startedAt: input.startedAt, completedAt: input.startedAt },
      { startedAt: 'not-a-timestamp', completedAt: input.completedAt },
    ])
      expect(() =>
        assembleAc265HostedE2eReportV3({ ...input, ...window }),
      ).toThrow(/assembly/i);
  });

  it('fails closed when the runner contract bytes are not the exact strict contract', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const input = assemblyInputFor(fixture);

    for (const bytes of [
      jsonBytes({ schemaVersion: 'ac265-hosted-runner-v1' }),
      new Uint8Array(0),
      jsonBytes({
        ...JSON.parse(Buffer.from(fixture.contractBytes).toString('utf8')),
        extra: true,
      }),
    ])
      expect(() =>
        assembleAc265HostedE2eReportV3({
          ...input,
          runnerContractBytes: bytes,
        }),
      ).toThrow(/assembly/i);
  });

  it('rejects unknown assembly input and reference fields', () => {
    const fixture = createFixture(ASSEMBLY_OPTIONS);
    const input = assemblyInputFor(fixture) as unknown as Record<
      string,
      unknown
    >;

    expect(() =>
      assembleAc265HostedE2eReportV3({
        ...input,
        acceptedReport: {},
      } as Ac265HostedE2eReportV3AssemblyInput),
    ).toThrow(/assembly/i);
    expect(() =>
      assembleAc265HostedE2eReportV3({
        ...input,
        receiptRefs: {
          ...(input['receiptRefs'] as Record<string, unknown>),
          extra: 'ac265-receipt://server/' + uuidFor(9_002),
        },
      } as Ac265HostedE2eReportV3AssemblyInput),
    ).toThrow(/assembly/i);
  });
});
