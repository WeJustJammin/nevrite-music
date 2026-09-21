import { describe, expect, it } from 'vitest';

import { parseHostedE2eVerificationContext } from '../../infra/workflows/content-schema-registry-hosted-e2e-verification-context.ts';
import { validateContentSchemaRegistryHostedE2eReportV3 } from '../../infra/workflows/content-schema-registry-hosted-e2e-report-verifier.ts';
import { parseHostedV3Verification } from '../../infra/workflows/content-schema-registry-retained-hosted-context.ts';
import {
  createFixture,
  contextFor,
  withReceiptHash,
} from './ac265-hosted-receipt-test-fixtures.ts';
import { jsonBytes, sha256 } from './ac265-hosted-test-fixtures.ts';

describe('AC265 hosted resolver integration boundary', () => {
  it('rejects callback-only structural verification contexts', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    const callbackOnly = { ...contextFor(fixture) } as Record<string, unknown>;
    delete callbackOnly['resolver'];
    callbackOnly['resolveReceipt'] = () => undefined;
    callbackOnly['resolveEvidence'] = () => undefined;

    expect(() => parseHostedE2eVerificationContext(callbackOnly)).toThrow(
      /resolver|incomplete|authenticated|brand|protected/i,
    );
  });

  it('rejects spread, JSON-round-tripped, and independently forged resolver contexts', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    const callbackContext = contextFor(fixture);
    const forgedResolver = {
      resolveReceipt: () => undefined,
      resolveEvidence: () => undefined,
      trustedKeys: [],
    };

    for (const value of [
      { ...callbackContext, resolver: { ...callbackContext.resolver } },
      JSON.parse(
        JSON.stringify({ ...callbackContext, resolver: forgedResolver }),
      ),
      Object.assign(Object.create(null), callbackContext, {
        resolver: forgedResolver,
      }),
    ])
      expect(() => parseHostedE2eVerificationContext(value)).toThrow(
        /resolver|incomplete|authenticated|brand|protected/i,
      );
  });

  it('snapshots every validated context getter once and freezes the parsed values', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    const source = contextFor(fixture);
    const reads = new Map<string, number>();
    const getterContext = {} as Record<string, unknown>;
    for (const key of Object.keys(source))
      Object.defineProperty(getterContext, key, {
        enumerable: true,
        get: () => {
          const count = (reads.get(key) ?? 0) + 1;
          reads.set(key, count);
          if (count > 1) throw new Error(`Context getter reread: ${key}`);
          return source[key as keyof typeof source];
        },
      });

    const parsed = parseHostedE2eVerificationContext(getterContext);

    expect([...reads.values()].every((count) => count === 1)).toBe(true);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.expectedIdentity)).toBe(true);
    expect(Object.isFrozen(parsed.expectedOutageLeaseScope)).toBe(true);
    expect(Object.isFrozen(parsed.expectedRoleResourceBindings)).toBe(true);
    expect(Object.isFrozen(parsed.approvedRunnerMappings)).toBe(true);
    expect(Object.isFrozen(parsed.approvedOutageTarget)).toBe(true);

    const originalRunId = parsed.expectedRunId;
    (source as { expectedRunId: string }).expectedRunId =
      '20000000-0000-4000-8000-000000000002';
    expect(parsed.expectedRunId).toBe(originalRunId);
  });

  it('retained parsing clones contract bytes and returns the frozen parsed context', () => {
    const fixture = createFixture({ includeCandidateIdentityReceipt: true });
    const contractBytes = new Uint8Array(fixture.contractBytes);
    const sourceContext = contextFor(fixture);
    let byteReads = 0;
    let contextReads = 0;
    const retained = parseHostedV3Verification({
      get runnerContractBytes() {
        byteReads += 1;
        return byteReads === 1 ? contractBytes : new Uint8Array([0]);
      },
      get verificationContext() {
        contextReads += 1;
        return contextReads === 1 ? sourceContext : {};
      },
    });
    const firstByte = retained.runnerContractBytes[0];
    contractBytes[0] = firstByte ^ 0xff;

    expect(byteReads).toBe(1);
    expect(contextReads).toBe(1);
    expect(retained.runnerContractBytes).not.toBe(contractBytes);
    expect(retained.runnerContractBytes[0]).toBe(firstByte);
    expect(Object.isFrozen(retained)).toBe(true);
    expect(Object.isFrozen(retained.verificationContext)).toBe(true);

    const originalRunId = retained.verificationContext.expectedRunId;
    sourceContext.expectedRunId = '20000000-0000-4000-8000-000000000002';
    expect(retained.verificationContext.expectedRunId).toBe(originalRunId);
    expect(() => {
      (
        retained.verificationContext as unknown as { expectedRunId: string }
      ).expectedRunId = '20000000-0000-4000-8000-000000000002';
    }).toThrow(TypeError);
    expect(retained.verificationContext.expectedRunId).toBe(originalRunId);
  });

  it('passes report.startedAt to receipt attestation windows, independent of receipt issuedAt', () => {
    const fixture = createFixture({
      includeCandidateIdentityReceipt: true,
      includeExecutionBindings: true,
      receiptIssuedAt: '2026-09-03T11:00:00.000Z',
    });
    const roleSlot = fixture.slots.find(
      (slot) => slot.kind === 'role' && slot.index === 0,
    );
    if (roleSlot === undefined) throw new Error('Role receipt is missing.');
    const originalBytes = fixture.receiptBytes.get(roleSlot.ref);
    if (originalBytes === undefined)
      throw new Error('Receipt bytes are missing.');
    const envelope = JSON.parse(
      Buffer.from(originalBytes).toString('utf8'),
    ) as Record<string, unknown>;
    const issuedAtAtResolverExpiry = '2026-09-03T10:35:00.000Z';
    const replacement = jsonBytes({
      ...envelope,
      issuedAt: issuedAtAtResolverExpiry,
    });
    fixture.receiptBytes.set(roleSlot.ref, replacement);
    withReceiptHash(fixture.report, roleSlot, sha256(replacement));

    expect(() =>
      validateContentSchemaRegistryHostedE2eReportV3(
        fixture.report,
        fixture.contractBytes,
        contextFor(fixture),
      ),
    ).not.toThrow();
  });

  it.each([
    ['pre-issuance', '2026-09-03T10:29:59.999Z'],
    ['exact expiry', '2026-09-03T10:35:00.000Z'],
  ] as const)(
    'fails closed for receipt report start at %s',
    (_label, startedAt) => {
      const fixture = createFixture({
        includeCandidateIdentityReceipt: true,
        receiptIssuedAt: '2026-09-03T11:00:00.000Z',
      });
      (fixture.report as { startedAt: string }).startedAt = startedAt;

      expect(() =>
        validateContentSchemaRegistryHostedE2eReportV3(
          fixture.report,
          fixture.contractBytes,
          contextFor(fixture, fixture.contract, {
            receipt: {
              issuedAt: '2026-09-03T10:30:00.000Z',
              expiresAt: '2026-09-03T10:35:00.000Z',
            },
            evidence: {
              issuedAt:
                startedAt === '2026-09-03T10:29:59.999Z'
                  ? '2026-09-03T10:28:00.000Z'
                  : '2026-09-03T10:31:00.000Z',
              expiresAt:
                startedAt === '2026-09-03T10:29:59.999Z'
                  ? '2026-09-03T10:33:00.000Z'
                  : '2026-09-03T10:36:00.000Z',
            },
          }),
        ),
      ).toThrow(/attestation.*window|outside.*window/i);
    },
  );

  it.each([
    ['pre-issuance', '2026-09-03T10:29:59.999Z'],
    ['exact expiry', '2026-09-03T10:35:00.000Z'],
  ] as const)(
    'fails closed for evidence report start at %s',
    (_label, startedAt) => {
      const fixture = createFixture({ includeCandidateIdentityReceipt: true });
      (fixture.report as { startedAt: string }).startedAt = startedAt;

      expect(() =>
        validateContentSchemaRegistryHostedE2eReportV3(
          fixture.report,
          fixture.contractBytes,
          contextFor(fixture),
        ),
      ).toThrow(/attestation.*window|outside.*window/i);
    },
  );
});
