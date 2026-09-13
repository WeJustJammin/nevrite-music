import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  contextFor,
  createFixture,
  validateWithContext,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import {
  buildLeaseFixture,
  contextWithCutoff,
  type BuiltLeaseFixture,
} from './ac265-hosted-outage-lease-test-fixtures.ts';
import { jsonBytes, sha256 } from './ac265-hosted-test-fixtures.ts';

type JsonRecord = Record<string, unknown>;
type ScenarioLeaseMutation = (lease: JsonRecord) => JsonRecord | undefined;

const recordAt = (value: unknown, label: string): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`Expected ${label} to be an object.`);
  return value as JsonRecord;
};

const validateBuilt = (built: BuiltLeaseFixture) =>
  validateWithContext(
    built.fixture.report,
    built.fixture.contractBytes,
    contextWithCutoff(built),
  );

const expectValidBuiltFixture = (built: BuiltLeaseFixture): void => {
  expect(
    ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(built.fixture.report)
      .success,
  ).toBe(true);
  expect(validateBuilt(built)).toEqual(built.fixture.report);
};

const setOrDelete = (
  record: JsonRecord,
  field: string,
  value: JsonRecord | undefined,
): void => {
  if (value === undefined) delete record[field];
  else record[field] = value;
};

const rewriteScenarioLease = (
  built: BuiltLeaseFixture,
  mutate: ScenarioLeaseMutation,
): void => {
  const { fixture } = built;
  const report = fixture.report as unknown as JsonRecord;
  const scenarios = [...(report['scenarios'] as JsonRecord[])];
  const index = fixture.report.scenarios.findIndex(
    ({ scenario }) => scenario === 'dependency_outage',
  );
  if (index < 0) throw new Error('Dependency outage result is missing.');
  const scenario = recordAt(scenarios[index], 'dependency outage result');
  const currentLease = recordAt(scenario['outageLease'], 'outage lease');
  const nextLease = mutate(currentLease);

  const slot = fixture.slots.find(
    (candidate) => candidate.kind === 'scenario' && candidate.index === index,
  );
  if (slot === undefined)
    throw new Error('Dependency outage receipt is missing.');
  const previousBytes = fixture.receiptBytes.get(slot.ref);
  if (previousBytes === undefined)
    throw new Error('Dependency outage receipt bytes are missing.');
  const envelope = recordAt(
    JSON.parse(Buffer.from(previousBytes).toString('utf8')),
    'scenario receipt envelope',
  );
  const result = recordAt(envelope['result'], 'scenario receipt result');
  const executionBinding = recordAt(
    result['executionBinding'],
    'scenario receipt execution binding',
  );

  const nextScenario = { ...scenario };
  const nextResult = { ...result };
  const nextBinding = { ...executionBinding };
  setOrDelete(nextScenario, 'outageLease', nextLease);
  setOrDelete(nextResult, 'outageLease', nextLease);
  setOrDelete(nextBinding, 'outageLease', nextLease);
  scenarios[index] = nextScenario;
  report['scenarios'] = scenarios;

  const nextBytes = jsonBytes({
    ...envelope,
    result: { ...nextResult, executionBinding: nextBinding },
  });
  fixture.receiptBytes.set(slot.ref, nextBytes);
  withReceiptHash(report, slot, sha256(nextBytes));
};

const removeCleanupReleaseProof = (built: BuiltLeaseFixture): void => {
  const { fixture } = built;
  const report = fixture.report as unknown as JsonRecord;
  const cleanup = recordAt(report['cleanup'], 'cleanup result');
  delete cleanup['outageLeaseReleaseProof'];
  report['cleanup'] = cleanup;

  const slot = fixture.slots.find((candidate) => candidate.kind === 'cleanup');
  if (slot === undefined) throw new Error('Cleanup receipt is missing.');
  const previousBytes = fixture.receiptBytes.get(slot.ref);
  if (previousBytes === undefined)
    throw new Error('Cleanup receipt bytes are missing.');
  const envelope = recordAt(
    JSON.parse(Buffer.from(previousBytes).toString('utf8')),
    'cleanup receipt envelope',
  );
  const result = recordAt(envelope['result'], 'cleanup receipt result');
  const executionBinding = recordAt(
    result['executionBinding'],
    'cleanup receipt execution binding',
  );
  delete result['outageLeaseReleaseProof'];
  delete executionBinding['outageLeaseReleaseProof'];

  const nextBytes = jsonBytes({
    ...envelope,
    result: { ...result, executionBinding },
  });
  fixture.receiptBytes.set(slot.ref, nextBytes);
  withReceiptHash(report, slot, sha256(nextBytes));
};

const trustedScopeFor = (fixture: ReturnType<typeof createFixture>) => ({
  runId: fixture.contract.runId,
  hostingProjectId: fixture.contract.identity.hostingProjectId,
  supabaseProjectRef: fixture.contract.identity.supabaseProjectRef,
  deploymentId: fixture.contract.identity.deploymentId,
  dependencyId:
    fixture.contract.scenarioParameters.dependencyOutage.dependencyId,
  route: fixture.contract.scenarioParameters.dependencyOutage.route,
});

const expectSchemaIssue = (report: unknown, field: string): void => {
  const parsed = ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(report);
  expect(parsed.success).toBe(false);
  if (!parsed.success)
    expect(
      parsed.error.issues.some((issue) => issue.path.includes(field)),
    ).toBe(true);
};

describe('AC265 required dependency outage lease evidence', () => {
  it('rejects a dependency_outage run whose trusted contract omits outageLease', () => {
    const fixture = createFixture({
      omitOutageLeaseFromContract: true,
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const context = contextFor(fixture, fixture.contract);
    context.expectedOutageLeaseScope = trustedScopeFor(fixture);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/outage lease|runner contract body is invalid/i);
  });

  it('rejects omission of the dependency_outage scenario lease from its signed receipt and report', () => {
    const built = buildLeaseFixture();
    expectValidBuiltFixture(built);
    rewriteScenarioLease(built, () => undefined);

    expect(() => validateBuilt(built)).toThrow(
      /hosted outage lease consumption and release proof are required/i,
    );
  });

  it('requires independently trusted outage lease scope', () => {
    const built = buildLeaseFixture();
    expectValidBuiltFixture(built);
    const context = contextWithCutoff(built);
    delete context.expectedOutageLeaseScope;

    expect(() =>
      validateWithContext(
        built.fixture.report,
        built.fixture.contractBytes,
        context,
      ),
    ).toThrow(/trusted outage lease scope is required/i);
  });

  it('requires a resolved control-plane lease receipt', () => {
    const built = buildLeaseFixture();
    expectValidBuiltFixture(built);
    rewriteScenarioLease(built, (lease) => {
      delete lease['leaseReceipt'];
      return lease;
    });

    expect(() => validateBuilt(built)).toThrow(
      /hosted outage lease control-plane receipt is required/i,
    );
  });

  it('requires exactly one consume event in the signed dependency_outage result', () => {
    const built = buildLeaseFixture();
    expectValidBuiltFixture(built);
    rewriteScenarioLease(built, (lease) => {
      delete lease['consumeEvents'];
      return lease;
    });
    expectSchemaIssue(built.fixture.report, 'consumeEvents');

    expect(() => validateBuilt(built)).toThrow(
      /hosted e2e report v3 body is invalid/i,
    );
  });

  it('requires the cleanup release proof to remain in the signed cleanup result', () => {
    const built = buildLeaseFixture();
    expectValidBuiltFixture(built);
    removeCleanupReleaseProof(built);

    expect(() => validateBuilt(built)).toThrow(
      /hosted outage lease consumption and release proof are required/i,
    );
  });

  it('requires the cleanup server receipt that authenticates release', () => {
    const built = buildLeaseFixture();
    expectValidBuiltFixture(built);
    const report = built.fixture.report as unknown as JsonRecord;
    const cleanup = recordAt(report['cleanup'], 'cleanup result');
    delete cleanup['serverReceipt'];
    report['cleanup'] = cleanup;
    expectSchemaIssue(report, 'serverReceipt');

    expect(() => validateBuilt(built)).toThrow(
      /hosted e2e report v3 body is invalid/i,
    );
  });
});
