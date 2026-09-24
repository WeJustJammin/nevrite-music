import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  assembleAc265HostedE2eReportV3,
  type Ac265HostedE2eReceiptReferences,
} from '../../infra/workflows/ac265-hosted-e2e-report-assembler.ts';
import { publishAc265RetainedReportV3Bytes } from '../../infra/workflows/ac265-retained-report-publication.ts';
import {
  produceAc265RetainedHostedE2eReportV3,
  serializeAc265RetainedReportV3,
} from '../../infra/workflows/ac265-retained-report-producer.ts';
import type { Ac265RetainedReportRedactionProvenance } from '../../infra/workflows/ac265-retained-report-provenance.ts';
import type {
  Ac265RetainedReportReceiptSlots,
  Ac265TrustedReference,
} from '../../infra/workflows/ac265-retained-report-provenance.ts';
import { sha256 as sha256Text } from './phase-02-slice-09-retained-evidence.test-support.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import type { ContentSchemaRegistryHostedE2eReportV3 } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  completeEvidence,
  expectedIdentity,
} from './phase-02-slice-09-operational-release-evidence.test-support.ts';
import { createRetainedEvidenceFixture } from './phase-02-slice-09-retained-evidence.test-support.ts';
import {
  contextFor,
  createFixture,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { makeContract } from './ac265-hosted-test-fixtures.ts';

export const AC265_PRODUCTION_RECEIPT_ISSUED_AT = '2026-09-03T11:00:00.000Z';

// The retained-release sidecar declares the relative report path. The producer
// must publish to that declared path instead of assuming `hosted/e2e.json`, so
// this support module keeps the declared path an explicit input.
export const AC265_DECLARED_REPORT_PATH = 'hosted/e2e.json';

const baseContract = makeContract();

export const productionContractFor = (
  identityOverrides: Partial<typeof baseContract.identity> = {},
): typeof baseContract =>
  ({
    ...baseContract,
    identity: {
      ...baseContract.identity,
      environment: expectedIdentity.hostedEnvironment,
      sourceRevision: expectedIdentity.sourceRevision,
      deploymentId: expectedIdentity.hostedDeploymentId,
      deployedAt: expectedIdentity.hostedDeployedAt,
      buildId: expectedIdentity.buildId,
      artifactSha256: expectedIdentity.artifactDigest,
      migrationVersion: expectedIdentity.migrationVersion,
      webOrigin: expectedIdentity.webOrigin,
      apiOrigin: expectedIdentity.apiOrigin,
      supabaseOrigin: expectedIdentity.supabaseOrigin,
      supabaseProjectRef: new URL(
        expectedIdentity.supabaseOrigin,
      ).hostname.split('.')[0],
      ...identityOverrides,
    },
  }) as typeof baseContract;

export const productionContract = productionContractFor();

type ProductionFixture = ReturnType<typeof createFixture>;
type ReceiptKind = 'candidate' | 'role' | 'scenario' | 'cleanup';

const receiptRefFor = (
  fixture: ProductionFixture,
  kind: ReceiptKind,
  index: number,
): string => {
  const slot = fixture.slots.find(
    (candidate) => candidate.kind === kind && candidate.index === index,
  );
  if (slot === undefined) throw new Error(`Missing ${kind} receipt slot.`);
  return slot.ref;
};

export const productionReceiptReferences = (
  fixture: ProductionFixture,
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

export const createProductionFixture = (
  identityOverrides: Partial<typeof baseContract.identity> = {},
) => {
  const contract = productionContractFor(identityOverrides);
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

export type Ac265ProductionFixture = ReturnType<typeof createProductionFixture>;

// The produced bytes are the exact UTF-8 bytes of a two-space-indented JSON
// document with one trailing newline. The retained-report digest binds those
// exact bytes, so tests recompute expected digests from this same text.
export const retainedReportTextFor = (report: unknown): string =>
  `${JSON.stringify(report, null, 2)}\n`;

export const retainedReportBytesFor = (report: unknown): Uint8Array =>
  Buffer.from(retainedReportTextFor(report), 'utf8');

// Report mutations round-trip through JSON so the test always reasons about the
// serialized boundary the producer and the verifier both read.
export const mutateProductionReport = (
  report: ContentSchemaRegistryHostedE2eReportV3,
  mutate: (copy: Record<string, unknown>) => void,
): ContentSchemaRegistryHostedE2eReportV3 => {
  const copy = JSON.parse(retainedReportTextFor(report)) as Record<
    string,
    unknown
  >;
  mutate(copy);
  return copy as unknown as ContentSchemaRegistryHostedE2eReportV3;
};

export const redactionProvenanceFor = (
  production: Ac265ProductionFixture,
): Ac265RetainedReportRedactionProvenance => {
  // Trusted digests are the digests of the exact fixture bytes the authenticated
  // resolver serves — never a value copied out of the report.
  const receiptDigest = (ref: string): Ac265TrustedReference => {
    const bytes = production.fixture.receiptBytes.get(ref);
    if (bytes === undefined)
      throw new Error(`Missing fixture receipt bytes for ${ref}`);
    return { ref, sha256: sha256Text(bytes) };
  };
  const slots: Ac265RetainedReportReceiptSlots = {
    candidateIdentity: receiptDigest(production.receiptRefs.candidateIdentity),
    roles: Object.fromEntries(
      Object.entries(production.receiptRefs.roles).map(([role, ref]) => [
        role,
        receiptDigest(ref),
      ]),
    ),
    scenarios: Object.fromEntries(
      Object.entries(production.receiptRefs.scenarios).map(
        ([scenario, ref]) => [scenario, receiptDigest(ref)],
      ),
    ),
    cleanup: receiptDigest(production.receiptRefs.cleanup),
  };
  return {
    reportStartedAt: production.fixture.report.startedAt,
    reportCompletedAt: production.fixture.report.completedAt,
    runnerContractBytes: production.fixture.contractBytes,
    // The trusted release context supplies the expected contract digest; the
    // producer recomputes it from the exact bytes and requires equality.
    expectedRunnerContractSha256:
      production.context.expectedRunnerContractSha256,
    trustedIdentity: production.contract.identity,
    trustedRunId: production.contract.runId,
    trustedCutoffAt: production.context.trustedCutoffAt,
    trustedSessionHandles: production.contract.sessionHandles,
    trustedResourceRefs: production.contract.resourceRefs,
    trustedReceiptSlots: slots,
    trustedEvidenceSha256: Object.fromEntries(
      [...production.fixture.evidenceBytes.entries()].map(([ref, bytes]) => [
        ref,
        sha256Text(bytes),
      ]),
    ),
  };
};

const sandboxes: string[] = [];

export const createProductionRoot = (): string => {
  const sandbox = mkdtempSync(join(tmpdir(), 'wejammin-ac265-producer-'));
  sandboxes.push(sandbox);
  return sandbox;
};

export const cleanupProductionSandboxes = (): void => {
  for (const sandbox of sandboxes.splice(0))
    rmSync(sandbox, { recursive: true, force: true });
};

export const assembleProductionReport = (production: Ac265ProductionFixture) =>
  assembleAc265HostedE2eReportV3({
    runnerContractBytes: production.fixture.contractBytes,
    resolver: production.context.resolver,
    startedAt: production.fixture.report.startedAt,
    completedAt: production.fixture.report.completedAt,
    receiptRefs: production.receiptRefs,
  });

/**
 * The producer's input shape, with the report bytes serialized by the same
 * function that owns the retained byte form.
 */
export const productionInputFor = (
  production = createProductionFixture(),
  reportRoot = createProductionRoot(),
) => ({
  reportBytes: serializeAc265RetainedReportV3(
    assembleProductionReport(production),
  ),
  provenance: redactionProvenanceFor(production),
  reportRoot,
  declaredReportPath: AC265_DECLARED_REPORT_PATH,
});

export const retainedVerificationFor = (
  production: Ac265ProductionFixture,
) => ({
  releaseEvidence: production.releaseEvidence,
  expectedIdentity: production.expectedIdentity,
  hostedV3Verification: {
    runnerContractBytes: production.fixture.contractBytes,
    verificationContext: production.context,
  },
});

export const produceProductionReport = (
  production = createProductionFixture(),
) => {
  const input = productionInputFor(production);
  return {
    input,
    produced: publishAc265RetainedReportV3Bytes(input),
  };
};

/**
 * The integrated producer request: exactly the assembler inputs plus provenance
 * and destination, so the integrated path assembles internally rather than
 * accepting caller-chosen bytes.
 */
export const productionRequestFor = (
  production = createProductionFixture(),
  reportRoot = createProductionRoot(),
) => ({
  assembly: {
    runnerContractBytes: production.fixture.contractBytes,
    resolver: production.context.resolver,
    startedAt: production.fixture.report.startedAt,
    completedAt: production.fixture.report.completedAt,
    receiptRefs: production.receiptRefs,
  },
  // The integrated request omits receipt/evidence digests: they are derived
  // from the authenticated resolver inside the producer.
  provenance: (() => {
    const callerProvenance: Record<string, unknown> = {
      ...redactionProvenanceFor(production),
    };
    delete callerProvenance['trustedReceiptSlots'];
    delete callerProvenance['trustedEvidenceSha256'];
    return callerProvenance;
  })(),
  reportRoot,
  declaredReportPath: AC265_DECLARED_REPORT_PATH,
});

/**
 * Rewrites the whole retained-release fixture so `hosted/e2e.json` is written by
 * the producer itself, then re-digests the sidecar reference. This is what lets
 * the integration test run the real retained verifier against produced bytes.
 */
export const createProducedRetainedFixture = () => {
  const retained = createRetainedEvidenceFixture();
  const hostedPath = join(retained.reportRoot, AC265_DECLARED_REPORT_PATH);
  rmSync(hostedPath, { force: true });

  const production = createProductionFixture();
  const produced = publishAc265RetainedReportV3Bytes(
    productionInputFor(production, retained.reportRoot),
  );
  const evidence = JSON.parse(readFileSync(retained.evidencePath, 'utf8')) as {
    hostedE2e: { report: { path: string; sha256: string } };
  };
  evidence.hostedE2e.report.path = produced.path;
  evidence.hostedE2e.report.sha256 = produced.sha256;
  writeFileSync(retained.evidencePath, JSON.stringify(evidence));
  return { retained, production, produced, evidence };
};

/**
 * Integrated-path fixture: the same retained tree, but the report is assembled
 * and written by `produceAc265RetainedHostedE2eReportV3` from the authenticated
 * resolver rather than from bytes a test assembled itself.
 */
export const createIntegratedRetainedFixture = () => {
  const retained = createRetainedEvidenceFixture();
  rmSync(join(retained.reportRoot, AC265_DECLARED_REPORT_PATH), {
    force: true,
  });
  const production = createProductionFixture();
  const produced = produceAc265RetainedHostedE2eReportV3(
    productionRequestFor(production, retained.reportRoot),
  );
  const evidence = JSON.parse(readFileSync(retained.evidencePath, 'utf8')) as {
    hostedE2e: { report: { path: string; sha256: string } };
  };
  evidence.hostedE2e.report.path = produced.path;
  evidence.hostedE2e.report.sha256 = produced.sha256;
  writeFileSync(retained.evidencePath, JSON.stringify(evidence));
  return { retained, production, produced, evidence };
};
