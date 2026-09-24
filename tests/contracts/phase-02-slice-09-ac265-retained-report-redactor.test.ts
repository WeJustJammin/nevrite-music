import { describe, expect, it } from 'vitest';

import {
  assertAc265RetainedReportV3BytesRedaction,
  assertAc265RetainedReportV3Redaction,
} from '../../infra/workflows/ac265-retained-report-redactor.ts';
import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report-v3.ts';
import {
  mutateProductionReport,
  retainedReportBytesFor,
  retainedReportTextFor,
} from './ac265-retained-report-production.test-support.ts';
import {
  PROHIBITED,
  assembleProductionReport,
  mutateStringLeaf,
  stringLeafPaths,
} from './ac265-retained-report-redaction.test-support.ts';

describe('AC265 retained report redaction boundary', () => {
  it('accepts the assembled report and returns the validated frozen value', () => {
    const { report, provenance } = assembleProductionReport();

    const accepted = assertAc265RetainedReportV3Redaction(report, provenance);

    expect(accepted).toEqual(report);
    expect(Object.isFrozen(accepted)).toBe(true);
  });

  it('rejects a sensitive value substituted into every string leaf the schema allows', () => {
    const { report, provenance } = assembleProductionReport();
    const leaves = stringLeafPaths(report);

    // The layers are independent, so a substitution may be caught by the
    // trusted-provenance binding or by content inspection. The security
    // property asserted is the end state: no schema-permitted string slot can
    // hold a sensitive value in a published report.
    expect(leaves.length).toBeGreaterThan(100);
    for (const [path] of leaves)
      expect(() =>
        assertAc265RetainedReportV3Redaction(
          mutateStringLeaf(report, path, 'Jane Doe'),
          provenance,
        ),
      ).toThrow(PROHIBITED);
  });

  it('rejects sensitive values the strict schema itself accepts', () => {
    const { report, provenance } = assembleProductionReport();
    // These slots accept any `SafeReleaseId`, so the strict schema admits a
    // personal name. Only the provenance binding and content layer reject it.
    const freeFormSlots = [
      'ciRunId',
      'stagingRunId',
      'deploymentId',
      'buildId',
      'hostingProjectId',
    ] as const;
    const schemaValidSensitiveValues = [
      'jane.doe',
      'JaneDoe-Corp.legal',
      'a.b:c-jane_doe',
    ];

    for (const slot of freeFormSlots)
      for (const value of schemaValidSensitiveValues) {
        const mutated = mutateProductionReport(report, (copy) => {
          copy[slot] = value;
        });
        expect(
          ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(mutated)
            .success,
        ).toBe(true);
        expect(() =>
          assertAc265RetainedReportV3Redaction(mutated, provenance),
        ).toThrow(PROHIBITED);
      }
  });

  it('rejects a schema-valid but untrusted identifier in an identity slot', () => {
    const { report, provenance } = assembleProductionReport();

    for (const value of ['JaneDoe', 'jane.doe-personal', 'JaneDoe-Corp']) {
      for (const slot of ['buildId', 'hostingProjectId'])
        expect(() =>
          assertAc265RetainedReportV3Redaction(
            mutateProductionReport(report, (copy) => {
              copy[slot] = value;
            }),
            provenance,
          ),
        ).toThrow(PROHIBITED);
    }
  });

  it('rejects sensitive values in digest, ref, timestamp, and origin slots', () => {
    const { report, provenance } = assembleProductionReport();

    const mutations: readonly ((copy: Record<string, unknown>) => void)[] = [
      (copy) => {
        (copy['roles'] as Record<string, unknown>[])[0]!['beforeStateSha256'] =
          'Jane Doe';
      },
      (copy) => {
        (copy['scenarios'] as Record<string, unknown>[])[0]![
          'browserObservationSha256'
        ] = 'jane.doe';
      },
      (copy) => {
        (copy['candidateIdentityReceipt'] as Record<string, unknown>)['ref'] =
          'ac265-receipt://server/jane.doe';
      },
      (copy) => {
        (copy['cleanup'] as Record<string, unknown>)['completedAt'] =
          'Jane Doe';
      },
      (copy) => {
        copy['webOrigin'] = 'https://staging.wejamm.in/private/jane-doe';
      },
      (copy) => {
        (copy['cleanup'] as Record<string, unknown>)['verifiedResources'] = [
          {
            kind: 'content_schema',
            ref: 'ac265-resource://content_schema/jane-doe',
            sha256: report.cleanup.verifiedResources[0]!.sha256,
          },
          ...report.cleanup.verifiedResources.slice(1),
        ];
      },
    ];

    for (const mutate of mutations)
      expect(() =>
        assertAc265RetainedReportV3Redaction(
          mutateProductionReport(report, mutate),
          provenance,
        ),
      ).toThrow(PROHIBITED);
  });

  it('rejects a receipt reference that is not the trusted run receipt', () => {
    const { report, provenance } = assembleProductionReport();
    const trustedRef = report.roles[0]!.serverReceipt.ref;
    const otherRef =
      trustedRef ===
      'ac265-receipt://server/00000000-0000-4000-8000-000000000999'
        ? 'ac265-receipt://server/00000000-0000-4000-8000-000000000998'
        : 'ac265-receipt://server/00000000-0000-4000-8000-000000000999';

    expect(() =>
      assertAc265RetainedReportV3Redaction(
        mutateProductionReport(report, (copy) => {
          (copy['roles'] as Record<string, unknown>[])[0]!['serverReceipt'] = {
            ref: otherRef,
            sha256: report.roles[0]!.serverReceipt.sha256,
          };
        }),
        provenance,
      ),
    ).toThrow(PROHIBITED);
  });

  it('rejects prohibited material that enters through the trusted context itself', () => {
    for (const identityOverrides of [
      { buildId: 'ci-Bearer-abcdef' },
      { hostingProjectId: 'sessionStorage-wejammin' },
      { deploymentId: 'deployment-eyJhbGciOi' },
    ]) {
      const { report, provenance } =
        assembleProductionReport(identityOverrides);
      expect(() =>
        assertAc265RetainedReportV3Redaction(report, provenance),
      ).toThrow(PROHIBITED);
    }
  });

  it('rejects prohibited markers that pass the structural identity classes', () => {
    // Each value satisfies its field's structural class, so only the content
    // layer can reject it. This proves the marker vocabulary carries real
    // weight rather than being shadowed by the identifier shapes.
    for (const identityOverrides of [
      { buildId: 'ci-localstorage-0' },
      { deploymentId: 'deployment-bearer-0' },
      { buildId: 'ci-eyjhbzci-0' },
      { deploymentId: 'deployment-setcookie-0' },
      { buildId: 'ci-refresh-token-0' },
    ]) {
      const { report, provenance } =
        assembleProductionReport(identityOverrides);
      expect(() =>
        assertAc265RetainedReportV3Redaction(report, provenance),
      ).toThrow(PROHIBITED);
    }
  });

  it('accepts structurally valid identifiers without false positives', () => {
    const { report, provenance } = assembleProductionReport();

    // Values the locked contract requires must never trip the guard: v4 UUIDs,
    // 40-hex revisions, 64-hex digests, ac265 references, and public origins.
    expect(() =>
      assertAc265RetainedReportV3Redaction(report, provenance),
    ).not.toThrow();
    expect(report.runId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u,
    );
    expect(report.sourceRevision).toMatch(/^[a-f0-9]{40}$/u);
    expect(report.roles[0]!.serverReceipt.sha256).toMatch(/^[a-f0-9]{64}$/u);
  });

  it('accepts the real deployment and build identifier shapes', () => {
    // GitHub deployment IDs are numeric; this repository also uses the
    // `deployment-<run>` and `ci-<run>-<attempt>` spellings in hosted evidence.
    // A genuine report must never be rejected for using the real shape.
    for (const identityOverrides of [
      { deploymentId: '6428523608' },
      { deploymentId: 'deployment-6567092259' },
      { buildId: 'ci-34751474024' },
      { buildId: 'ci-34751474024-2' },
      { buildId: 'build-34751474024-2' },
    ]) {
      const { report, provenance } =
        assembleProductionReport(identityOverrides);
      expect(() =>
        assertAc265RetainedReportV3Redaction(report, provenance),
      ).not.toThrow();
    }
  });

  it('accepts the exact produced bytes and rejects duplicate JSON members before parsing', () => {
    const { report, provenance } = assembleProductionReport();
    const text = retainedReportTextFor(report);

    expect(
      assertAc265RetainedReportV3BytesRedaction(
        retainedReportBytesFor(report),
        provenance,
      ),
    ).toEqual(report);

    const duplicated = text.replace(
      '"outcome": "passed"',
      '"outcome": "passed",\n  "outcome": "passed"',
    );
    expect(duplicated).not.toBe(text);
    expect(() =>
      assertAc265RetainedReportV3BytesRedaction(
        Buffer.from(duplicated, 'utf8'),
        provenance,
      ),
    ).toThrow(PROHIBITED);
    expect(() =>
      assertAc265RetainedReportV3BytesRedaction(new Uint8Array(0), provenance),
    ).toThrow(PROHIBITED);
  });

  it('rejects report bytes that are not the report the trusted context describes', () => {
    const first = assembleProductionReport();
    const second = assembleProductionReport({ stagingRunId: '34751910126' });

    expect(() =>
      assertAc265RetainedReportV3BytesRedaction(
        retainedReportBytesFor(second.report),
        first.provenance,
      ),
    ).toThrow(PROHIBITED);
  });
});
