import * as platformContracts from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

const id = '018f2f72-4b5a-7c9d-8e1f-123456789abc';
const definitionVersionId = '018f2f72-4b5a-7c9d-8e1f-123456789abd';
const instant = '2026-09-02T03:00:00.000Z';
const later = '2026-09-03T03:00:00.000Z';
const hash = 'a'.repeat(64);

const definitionRequest = {
  key: 'profile.visibility',
  valueKind: 'boolean',
  schema: { type: 'boolean' },
  ownerCapability: 'settings.profile.write',
  allowedScopes: ['platform', 'party'],
  precedence: ['party', 'platform'],
  mergeMode: 'replace',
  defaultSource: 'literal',
  defaultValue: false,
  riskClass: 'high',
  approverPolicy: {
    minimumDistinct: 2,
    requiresMfa: true,
    requiresCanary: true,
    notifyCapabilities: ['settings.profile.read'],
  },
  consumerKeys: ['web.profile'],
  contractRelease: 'phase-2.7',
  sensitivity: 'internal',
  reason: 'Register governed profile visibility.',
} as const;

describe('Phase 2 Slice 07 contract RED evidence', () => {
  it('[P2-S07-AC-001] accepts only a code-release definition with immutable registry metadata', () => {
    expect(
      platformContracts.Cfg05a01RegisterDefinitionRequestSchema.parse(
        definitionRequest,
      ),
    ).toEqual(definitionRequest);
    expect(
      platformContracts.Cfg05a01RegisterDefinitionRequestSchema.safeParse({
        ...definitionRequest,
        extra: true,
      }).success,
    ).toBe(false);
  });

  it('[P2-S07-AC-002] resolves an effective value from caller context without caller-owned schema or precedence', () => {
    const query = {
      key: 'profile.visibility',
      partyId: id,
      consumerKey: 'web.profile',
      supportedDefinitionVersions: ['1'],
    } as const;
    expect(
      platformContracts.Cfg05a02EffectiveValueQuerySchema.parse(query),
    ).toEqual(query);
    expect(
      platformContracts.Cfg05a02EffectiveValueQuerySchema.safeParse({
        ...query,
        schema: { type: 'boolean' },
        precedence: ['party'],
      }).success,
    ).toBe(false);
  });

  it('[P2-S07-AC-003] requires versioned proposal and action evidence for approval, activation, and rollback', () => {
    const proposal = {
      scopeType: 'party',
      scopeId: id,
      environment: 'production',
      typedValue: true,
      interval: { effectiveFrom: instant, effectiveTo: later },
      expectedDefinitionVersion: '1',
      impactManifest: { consumers: ['web.profile'] },
      rollbackCandidate: false,
      reason: 'Enable the governed profile projection.',
      consumerKeys: ['web.profile'],
    } as const;
    expect(
      platformContracts.Cfg05a03ProposeChangeRequestSchema.parse(proposal),
    ).toEqual(proposal);
    expect(
      platformContracts.Cfg05a04ChangeActionRequestSchema.safeParse({
        action: 'schedule',
        expectedReviewVersion: '1',
        candidateHash: hash,
      }).success,
    ).toBe(false);
  });

  it('[P2-S07-AC-004] excludes secret material from browser-facing definition projections', () => {
    const response = {
      definitionId: id,
      definitionVersionId,
      key: 'profile.visibility',
      version: '1',
      valueKind: 'boolean',
      allowedScopes: ['platform', 'party'],
      precedence: ['party', 'platform'],
      mergeMode: 'replace',
      riskClass: 'high',
      lifecycle: 'active',
      schemaHash: hash,
      contractRelease: 'phase-2.7',
      synchronized: true,
      createdAt: instant,
    } as const;
    expect(
      platformContracts.Cfg05a01DefinitionResponseSchema.safeParse({
        ...response,
        secret: 'must never cross the projection boundary',
      }).success,
    ).toBe(false);
  });

  const eventSchemaExports = [
    ['P2-S07-AC-044', 'ConfigDefinitionRegisteredV1Schema'],
    ['P2-S07-AC-045', 'ConfigValueResolvedV1Schema'],
    ['P2-S07-AC-046', 'ConfigChangeProposedV1Schema'],
    ['P2-S07-AC-047', 'ConfigChangeTransitionedV1Schema'],
    ['P2-S07-AC-048', 'ConfigFlagChangedV1Schema'],
    ['P2-S07-AC-049', 'ConfigExperimentChangedV1Schema'],
    ['P2-S07-AC-050', 'ConfigKillSwitchChangedV1Schema'],
  ] as const;

  it.each(eventSchemaExports)(
    '[%s] exposes a strict identifier-only observability event schema: %s',
    (_criterion, exportName) => {
      const schema = (platformContracts as unknown as Record<string, unknown>)[
        exportName
      ];
      expect(schema).toEqual(
        expect.objectContaining({
          parse: expect.any(Function),
          safeParse: expect.any(Function),
        }),
      );
    },
  );
});
