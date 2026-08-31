import {
  InfrastructureAccessProjectionSchema,
  type ActorClass,
  type InfrastructureFeature,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

const noPrerequisites = (actorClass: ActorClass) =>
  InfrastructureAccessProjectionSchema.parse({
    actorClass,
    capabilities: [],
    entitled: false,
    ownsResource: false,
    guardianMandate: false,
    ageAllowed: false,
    organizationMandate: false,
    caseScoped: false,
    stepUpVerified: false,
    auditReasonPresent: false,
  });

describe('Slice 02 server projection fails closed', () => {
  it('guardian high-risk projection requires and honors a server mandate', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const granted = InfrastructureAccessProjectionSchema.parse({
      ...noPrerequisites('guardian'),
      capabilities: ['infrastructure.destroy'],
      guardianMandate: true,
      stepUpVerified: true,
    });
    expect(resolvePresentation('destructive_high_risk', granted)).toMatchObject(
      { mode: 'full', variant: 'guardianMandate' },
    );
  });

  it('protected_command free without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('free'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('protected_command paid without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('paid'),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('protected_command creator without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('creator'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('protected_command guardian without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('guardian'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('protected_command junior without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('junior'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('protected_command business without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('business'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('protected_command staff without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('staff'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('protected_command admin without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'protected_command' as InfrastructureFeature,
      noPrerequisites('admin'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('provenance free without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('free'),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('provenance paid without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('paid'),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('provenance creator without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('creator'),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('provenance guardian without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('guardian'),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('provenance junior without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('junior'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('provenance business without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('business'),
    );
    expect(decision).toMatchObject({
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('provenance staff without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('staff'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('provenance admin without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'provenance' as InfrastructureFeature,
      noPrerequisites('admin'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('destructive_high_risk free without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('free'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('destructive_high_risk paid without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('paid'),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('destructive_high_risk creator without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('creator'),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('destructive_high_risk guardian without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('guardian'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('destructive_high_risk junior without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('junior'),
    );
    expect(decision).toMatchObject({
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('destructive_high_risk business without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('business'),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('destructive_high_risk staff without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('staff'),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });

  it('destructive_high_risk admin without prerequisites', async () => {
    const { resolvePresentation } =
      await import('../../packages/ui/src/infrastructure/presentation.ts');
    const decision = resolvePresentation(
      'destructive_high_risk' as InfrastructureFeature,
      noPrerequisites('admin'),
    );
    expect(decision).toMatchObject({
      mode: 'disabled',
      variant: 'disabledPrerequisite',
    });
  });
});
