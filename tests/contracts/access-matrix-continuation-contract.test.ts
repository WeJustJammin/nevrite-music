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

describe('Slice 02 conditional rendering matrix (continued)', () => {
  it('P1-S02-AC-032', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('free', {}),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('P1-S02-AC-033', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('paid', { entitled: true }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'entitledRead',
    });
  });

  it('P1-S02-AC-034', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('creator', { ownsResource: true }),
    );
    expect(decision).toMatchObject({ mode: 'read_only', variant: 'ownerFull' });
  });

  it('P1-S02-AC-035', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('guardian', { guardianMandate: true }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'guardianMandate',
    });
  });

  it('P1-S02-AC-036', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('junior', { ageAllowed: true }),
    );
    expect(decision).toMatchObject({
      mode: 'partial_hidden',
      variant: 'juniorRestricted',
    });
  });

  it('P1-S02-AC-037', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('business', { organizationMandate: true }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'businessMandate',
    });
  });

  it('P1-S02-AC-038', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.provenance'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'staffCaseScoped',
    });
  });

  it('P1-S02-AC-039', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      access('admin', { capabilities: ['infrastructure.provenance:any'] }),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'adminStepUp',
    });
  });

  it('P1-S02-AC-040', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('free', {}),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P1-S02-AC-041', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('paid', {
        entitled: true,
        capabilities: ['infrastructure.destroy'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('P1-S02-AC-042', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('creator', {
        ownsResource: true,
        capabilities: ['infrastructure.destroy'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('P1-S02-AC-043', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('guardian', {}),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P1-S02-AC-044', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('junior', { ageAllowed: false }),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P1-S02-AC-045', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('business', {
        organizationMandate: true,
        capabilities: ['infrastructure.destroy'],
      }),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('P1-S02-AC-046', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.destroy:case'],
        stepUpVerified: true,
      }),
    );
    expect(decision).toMatchObject({
      mode: 'full',
      variant: 'staffCaseScoped',
    });
  });

  it('P1-S02-AC-047', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      access('admin', {
        capabilities: ['infrastructure.destroy:any'],
        stepUpVerified: true,
        auditReasonPresent: true,
      }),
    );
    expect(decision).toMatchObject({ mode: 'full', variant: 'adminStepUp' });
  });
});
