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

describe('P2-S03 role matrix: public/read projection', () => {
  it('P2-S03-AC-190 Free public/read renders full public via publicRead', () => {
    expectProjection('public_read', accessFor('free'), {
      mode: 'full',
      variant: 'publicRead',
    });
  });

  it('P2-S03-AC-191 Paid public/read renders full entitled via entitledRead', () => {
    expectProjection('public_read', accessFor('paid', { entitled: true }), {
      mode: 'full',
      variant: 'entitledRead',
    });
  });

  it('P2-S03-AC-192 Creator public/read renders full owned/public via ownerFull', () => {
    expectProjection(
      'public_read',
      accessFor('creator', { ownsResource: true }),
      {
        mode: 'full',
        variant: 'ownerFull',
      },
    );
  });

  it('P2-S03-AC-193 Guardian public/read renders full mandate-visible via guardianMandate', () => {
    expectProjection(
      'public_read',
      accessFor('guardian', { guardianMandate: true }),
      {
        mode: 'full',
        variant: 'guardianMandate',
      },
    );
  });

  it('P2-S03-AC-194 Junior public/read renders full age-allowed own/public via juniorRestricted', () => {
    expectProjection('public_read', accessFor('junior', { ageAllowed: true }), {
      mode: 'full',
      variant: 'juniorRestricted',
    });
  });

  it('P2-S03-AC-195 Business public/read renders full organization public/mandated via businessMandate', () => {
    expectProjection(
      'public_read',
      accessFor('business', { organizationMandate: true }),
      {
        mode: 'full',
        variant: 'businessMandate',
      },
    );
  });

  it('P2-S03-AC-196 Staff public/read renders read-only with explicit case capability', () => {
    expectProjection(
      'public_read',
      accessFor('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.read'],
      }),
      { mode: 'read_only', variant: 'staffCaseScoped' },
    );
  });

  it('P2-S03-AC-197 Admin public/read renders read-only with explicit capability', () => {
    expectProjection(
      'public_read',
      accessFor('admin', { capabilities: ['infrastructure.read:any'] }),
      { mode: 'read_only', variant: 'adminStepUp' },
    );
  });
});

describe('P2-S03 role matrix: protected command form', () => {
  it('P2-S03-AC-198 Free protected command is not-rendered without capability', () => {
    expectProjection('protected_command', accessFor('free'), {
      mode: 'not_rendered',
      variant: 'forbiddenHidden',
    });
  });

  it('P2-S03-AC-199 Paid protected command renders full with server capability', () => {
    expectProjection(
      'protected_command',
      accessFor('paid', {
        entitled: true,
        capabilities: ['infrastructure.write'],
      }),
      { mode: 'full', variant: 'entitledRead' },
    );
  });

  it('P2-S03-AC-200 Creator protected command renders full for owned resource', () => {
    expectProjection(
      'protected_command',
      accessFor('creator', {
        ownsResource: true,
        capabilities: ['infrastructure.write'],
      }),
      { mode: 'full', variant: 'ownerFull' },
    );
  });

  it('P2-S03-AC-201 Guardian protected command renders full within guardian mandate', () => {
    expectProjection(
      'protected_command',
      accessFor('guardian', {
        guardianMandate: true,
        capabilities: ['infrastructure.write'],
      }),
      { mode: 'full', variant: 'guardianMandate' },
    );
  });

  it('P2-S03-AC-202 Junior protected command renders partial-hidden restricted fields', () => {
    expectProjection(
      'protected_command',
      accessFor('junior', {
        ageAllowed: true,
        capabilities: ['infrastructure.write'],
      }),
      { mode: 'partial_hidden', variant: 'juniorRestricted' },
    );
  });

  it('P2-S03-AC-203 Business protected command renders full in organization mandate', () => {
    expectProjection(
      'protected_command',
      accessFor('business', {
        organizationMandate: true,
        capabilities: ['infrastructure.write'],
      }),
      { mode: 'full', variant: 'businessMandate' },
    );
  });

  it('P2-S03-AC-204 Staff protected command renders full with operation/case capability', () => {
    expectProjection(
      'protected_command',
      accessFor('staff', {
        caseScoped: true,
        capabilities: ['infrastructure.write:case'],
      }),
      { mode: 'full', variant: 'staffCaseScoped' },
    );
  });

  it('P2-S03-AC-205 Admin protected command renders full with named capability, step-up, and audited reason', () => {
    expectProjection(
      'protected_command',
      accessFor('admin', {
        capabilities: ['infrastructure.write:any'],
        stepUpVerified: true,
        auditReasonPresent: true,
      }),
      { mode: 'full', variant: 'adminStepUp' },
    );
  });
});
