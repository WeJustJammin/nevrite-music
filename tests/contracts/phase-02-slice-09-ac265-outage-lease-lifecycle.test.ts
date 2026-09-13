import { describe, expect, it } from 'vitest';

import { ContentSchemaRegistryHostedRunnerContractSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import { ContentSchemaRegistryHostedE2eReportV3Schema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-report.ts';
import {
  buildLeaseFixture,
  contextWithCutoff,
  consumedAt,
  defaultLease,
} from './ac265-hosted-outage-lease-test-fixtures.ts';
import { validateWithContext } from './ac265-hosted-receipt-test-fixtures.ts';
import { sha256, sha256Ref, uuidFor } from './ac265-hosted-test-fixtures.ts';

describe('AC265 outage lease lifecycle proof', () => {
  it('binds the canonical lease reference, one consume event, and signed release proof through the report', () => {
    const built = buildLeaseFixture();
    const { fixture, lease, leaseEvidence, releaseProof, leaseReceiptRef } =
      built;
    const authenticatedRefs: string[] = [];
    const context = {
      ...contextWithCutoff(built),
      verifyReceiptAuthenticity: (ref: string) => {
        authenticatedRefs.push(ref);
        return true;
      },
    };

    expect(
      ContentSchemaRegistryHostedRunnerContractSchema.safeParse(
        fixture.contract,
      ).success,
    ).toBe(true);
    expect(
      ContentSchemaRegistryHostedE2eReportV3Schema.safeParse(fixture.report)
        .success,
    ).toBe(true);
    expect(
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toEqual(fixture.report);
    expect(lease.sha256).toBe(sha256Ref(lease.ref));
    expect(leaseEvidence['consumeEvents']).toHaveLength(1);
    expect(releaseProof).toMatchObject({
      ref: lease.ref,
      sha256: lease.sha256,
      outcome: 'released',
    });
    expect(authenticatedRefs).toContain(
      fixture.report.cleanup.serverReceipt.ref,
    );
    expect(authenticatedRefs).toContain(leaseReceiptRef);
    expect(context.expectedRunnerContractSha256).toBe(
      sha256(fixture.contractBytes),
    );
  });

  it('rejects noncanonical digests, leases longer than the bound, and anything other than one in-window consume event', () => {
    const valid = buildLeaseFixture();
    expect(
      validateWithContext(
        valid.fixture.report,
        valid.fixture.contractBytes,
        contextWithCutoff(valid),
      ),
    ).toEqual(valid.fixture.report);

    const invalidFixtures = [
      buildLeaseFixture({ lease: { sha256: 'f'.repeat(64) } }),
      buildLeaseFixture({
        lease: {
          acquiredAt: '2026-09-03T10:58:00.000Z',
          expiresAt: '2026-09-03T10:59:01.000Z',
        },
        consumeEvents: [
          {
            ref: defaultLease.ref,
            sha256: defaultLease.sha256,
            occurredAt: '2026-09-03T10:58:30.000Z',
          },
        ],
        releaseProof: { releasedAt: '2026-09-03T10:58:45.000Z' },
      }),
      buildLeaseFixture({
        lease: {
          acquiredAt: '2026-09-03T10:29:59.000Z',
          expiresAt: '2026-09-03T10:30:30.000Z',
        },
        consumeEvents: [
          {
            ref: defaultLease.ref,
            sha256: defaultLease.sha256,
            occurredAt: '2026-09-03T10:30:10.000Z',
          },
        ],
        releaseProof: { releasedAt: '2026-09-03T10:30:20.000Z' },
      }),
      buildLeaseFixture({ consumeEvents: [] }),
      buildLeaseFixture({
        consumeEvents: [
          {
            ref: defaultLease.ref,
            sha256: defaultLease.sha256,
            occurredAt: consumedAt,
          },
          {
            ref: defaultLease.ref,
            sha256: defaultLease.sha256,
            occurredAt: '2026-09-03T10:59:16.000Z',
          },
        ],
      }),
      buildLeaseFixture({
        consumeEvents: [
          {
            ref: defaultLease.ref,
            sha256: defaultLease.sha256,
            occurredAt: '2026-09-03T10:59:51.000Z',
          },
        ],
      }),
      buildLeaseFixture({
        releaseProof: { releasedAt: '2026-09-03T10:59:51.000Z' },
      }),
    ];

    for (const built of invalidFixtures) {
      expect(() =>
        validateWithContext(
          built.fixture.report,
          built.fixture.contractBytes,
          contextWithCutoff(built),
        ),
      ).toThrow();
    }
  });

  it('rejects an authentic cleanup receipt whose release proof names a different lease', () => {
    const valid = buildLeaseFixture();
    expect(
      validateWithContext(
        valid.fixture.report,
        valid.fixture.contractBytes,
        contextWithCutoff(valid),
      ),
    ).toEqual(valid.fixture.report);

    const otherRef = `ac265-lease://staging/${uuidFor(301)}`;
    const mismatched = buildLeaseFixture({
      releaseProof: {
        ref: otherRef,
        sha256: sha256Ref(otherRef),
      },
    });
    expect(() =>
      validateWithContext(
        mismatched.fixture.report,
        mismatched.fixture.contractBytes,
        contextWithCutoff(mismatched),
      ),
    ).toThrow();
  });

  it('requires authenticity verification of the cleanup receipt carrying the lease release proof', () => {
    const built = buildLeaseFixture();
    const { fixture } = built;
    expect(
      validateWithContext(
        fixture.report,
        fixture.contractBytes,
        contextWithCutoff(built),
      ),
    ).toEqual(fixture.report);
    const cleanupReceiptRef = fixture.report.cleanup.serverReceipt.ref;
    const context = {
      ...contextWithCutoff(built),
      verifyReceiptAuthenticity: (ref: string) => ref !== cleanupReceiptRef,
    };

    expect(() =>
      validateWithContext(fixture.report, fixture.contractBytes, context),
    ).toThrow(/authenticity/i);
  });
});
