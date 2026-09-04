import { describe, expect, it } from 'vitest';

import type {
  InfrastructureAccessProjection,
  InfrastructureFeature,
  PresentationDecision,
} from '@wejammin/contracts';

import { resolveRoleProjection } from './role-projection.ts';

const accessFor = (
  actorClass: InfrastructureAccessProjection['actorClass'],
  overrides: Partial<InfrastructureAccessProjection> = {},
): InfrastructureAccessProjection => ({
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
  ...overrides,
});

const expectProjection = (
  feature: InfrastructureFeature,
  access: InfrastructureAccessProjection,
  expected: Pick<PresentationDecision, 'mode' | 'variant'>,
): void => {
  expect(resolveRoleProjection(feature, access)).toMatchObject(expected);
};

describe('P2-S03 role matrix: provenance/evidence projection', () => {
  it('P2-S03-AC-206 Free provenance/evidence renders public subset via publicRead', () => {
    expectProjection('provenance', accessFor('free'), {
      mode: 'read_only',
      variant: 'publicRead',
    });
  });

  it('P2-S03-AC-207 Paid provenance/evidence renders entitled subset via entitledRead', () => {
    expectProjection('provenance', accessFor('paid', { entitled: true }), {
      mode: 'read_only',
      variant: 'entitledRead',
    });
  });

  it('P2-S03-AC-208 Creator provenance/evidence renders owned/participating subset via ownerFull', () => {
    expectProjection(
      'provenance',
      accessFor('creator', { ownsResource: true }),
      {
        mode: 'read_only',
        variant: 'ownerFull',
      },
    );
  });

  it('P2-S03-AC-209 Guardian provenance/evidence renders mandate-visible subset via guardianMandate', () => {
    expectProjection(
      'provenance',
      accessFor('guardian', { guardianMandate: true }),
      {
        mode: 'read_only',
        variant: 'guardianMandate',
      },
    );
  });

  it('P2-S03-AC-210 Junior provenance/evidence renders disclosure-safe age-allowed subset', () => {
    expectProjection('provenance', accessFor('junior', { ageAllowed: true }), {
      mode: 'partial_hidden',
      variant: 'juniorRestricted',
    });
  });

  it('P2-S03-AC-211 Business provenance/evidence renders organization-mandated subset', () => {
    expectProjection(
      'provenance',
      accessFor('business', { organizationMandate: true }),
      {
        mode: 'read_only',
        variant: 'businessMandate',
      },
    );
  });

  it('P2-S03-AC-212 Staff provenance/evidence renders case-scoped read-only', () => {
    expectProjection(
      'provenance',
      accessFor('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.provenance'],
      }),
      { mode: 'read_only', variant: 'staffCaseScoped' },
    );
  });

  it('P2-S03-AC-213 Admin provenance/evidence renders capability-scoped read-only', () => {
    expectProjection(
      'provenance',
      accessFor('admin', { capabilities: ['infrastructure.provenance:any'] }),
      { mode: 'read_only', variant: 'adminStepUp' },
    );
  });
});

describe('P2-S03 role matrix: destructive/high-risk projection', () => {
  it('P2-S03-AC-214 Free destructive/high-risk action is not-rendered', () => {
    expectProjection('destructive_high_risk', accessFor('free'), {
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P2-S03-AC-215 Paid destructive/high-risk action is disabled without named capability and step-up', () => {
    expectProjection(
      'destructive_high_risk',
      accessFor('paid', { entitled: true }),
      { mode: 'disabled', variant: 'disabledPrerequisite' },
    );
  });

  it('P2-S03-AC-216 Creator destructive/high-risk action is disabled without owner capability and step-up', () => {
    expectProjection(
      'destructive_high_risk',
      accessFor('creator', { ownsResource: true }),
      { mode: 'disabled', variant: 'disabledPrerequisite' },
    );
  });

  it('P2-S03-AC-217 Guardian destructive/high-risk action is not-rendered without mandate grant', () => {
    expectProjection('destructive_high_risk', accessFor('guardian'), {
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P2-S03-AC-218 Junior destructive/high-risk action is not-rendered where age policy forbids', () => {
    expectProjection('destructive_high_risk', accessFor('junior'), {
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P2-S03-AC-219 Business destructive/high-risk action is disabled without organization capability and step-up', () => {
    expectProjection(
      'destructive_high_risk',
      accessFor('business', { organizationMandate: true }),
      { mode: 'disabled', variant: 'disabledPrerequisite' },
    );
  });

  it('P2-S03-AC-220 Staff destructive/high-risk action renders full with named case capability and step-up', () => {
    expectProjection(
      'destructive_high_risk',
      accessFor('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.destroy:case'],
        stepUpVerified: true,
      }),
      { mode: 'full', variant: 'staffCaseScoped' },
    );
  });

  it('P2-S03-AC-221 Admin destructive/high-risk action renders full with named operation capability and step-up', () => {
    expectProjection(
      'destructive_high_risk',
      accessFor('admin', {
        capabilities: ['infrastructure.destroy:any'],
        stepUpVerified: true,
        auditReasonPresent: true,
      }),
      { mode: 'full', variant: 'adminStepUp' },
    );
  });
});
