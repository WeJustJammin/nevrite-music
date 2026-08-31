import {
  InfrastructureAccessProjectionSchema,
  type ActorClass,
  type InfrastructureAccessProjection,
  type InfrastructureFeature,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

const access = (
  actorClass: ActorClass,
  overrides: Partial<InfrastructureAccessProjection> = {},
): InfrastructureAccessProjection =>
  InfrastructureAccessProjectionSchema.parse({
    actorClass,
    capabilities: [],
    entitled: false,
    ownsResource: false,
    guardianMandate: false,
    ageAllowed: true,
    organizationMandate: false,
    caseScoped: false,
    stepUpVerified: false,
    auditReasonPresent: false,
    ...overrides,
  });

describe('Slice 02 conditional rendering matrix', () => {
  it('P1-S02-AC-016', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('free', {}),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'publicRead' });
  });

  it('P1-S02-AC-017', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('paid', { entitled: true }),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'entitledRead' });
  });

  it('P1-S02-AC-018', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('creator', { ownsResource: true }),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'ownerFull' });
  });

  it('P1-S02-AC-019', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('guardian', { guardianMandate: true }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'guardianMandate',
    });
  });

  it('P1-S02-AC-020', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('junior', { ageAllowed: true }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'juniorRestricted',
    });
  });

  it('P1-S02-AC-021', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('business', { organizationMandate: true }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'businessMandate',
    });
  });

  it('P1-S02-AC-022', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.read'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'staffCaseScoped',
    });
  });

  it('P1-S02-AC-023', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'public_read' as InfrastructureFeature,
      access('admin', { capabilities: ['infrastructure.read:any'] }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'adminStepUp',
    });
  });

  it('P1-S02-AC-024', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('free', {}),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P1-S02-AC-025', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('paid', {
        entitled: true,
        capabilities: ['infrastructure.write'],
      }),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'entitledRead' });
  });

  it('P1-S02-AC-026', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('creator', {
        ownsResource: true,
        capabilities: ['infrastructure.write'],
      }),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'ownerFull' });
  });

  it('P1-S02-AC-027', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('guardian', {
        guardianMandate: true,
        capabilities: ['infrastructure.write'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'guardianMandate',
    });
  });

  it('P1-S02-AC-028', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('junior', {
        ageAllowed: true,
        capabilities: ['infrastructure.write'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'partial_hidden',
      variant: 'juniorRestricted',
    });
  });

  it('P1-S02-AC-029', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('business', {
        organizationMandate: true,
        capabilities: ['infrastructure.write'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'businessMandate',
    });
  });

  it('P1-S02-AC-030', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.write:case'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'staffCaseScoped',
    });
  });

  it('P1-S02-AC-031', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      access('admin', {
        capabilities: ['infrastructure.write:any'],
        stepUpVerified: true,
        auditReasonPresent: true,
      }),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'adminStepUp' });
  });
});
