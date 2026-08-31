import { PresentationDecisionSchema } from '@wejammin/contracts';
import type {
  InfrastructureAccessProjection,
  InfrastructureFeature,
  PresentationDecision,
} from '@wejammin/contracts';

import type { AccessVariant } from './presentation-types.ts';

const actorVariant = (
  actorClass: InfrastructureAccessProjection['actorClass'],
): PresentationDecision['variant'] => {
  switch (actorClass) {
    case 'free':
      return 'publicRead';
    case 'paid':
      return 'entitledRead';
    case 'creator':
      return 'ownerFull';
    case 'guardian':
      return 'guardianMandate';
    case 'junior':
      return 'juniorRestricted';
    case 'business':
      return 'businessMandate';
    case 'staff':
      return 'staffCaseScoped';
    case 'admin':
      return 'adminStepUp';
  }
};

const decision = (
  mode: PresentationDecision['mode'],
  variant: PresentationDecision['variant'],
  reason: string,
): PresentationDecision =>
  PresentationDecisionSchema.parse({ mode, variant, reason });

const hasCapability = (
  access: InfrastructureAccessProjection,
  capability: string,
): boolean => access.capabilities.includes(capability);

export function resolvePresentation(
  feature: InfrastructureFeature,
  access: InfrastructureAccessProjection,
): PresentationDecision {
  const variant = actorVariant(access.actorClass);

  if (feature === 'public_read') {
    if (
      (access.actorClass === 'staff' &&
        (!access.caseScoped ||
          !hasCapability(access, 'infrastructure.read'))) ||
      (access.actorClass === 'admin' &&
        !hasCapability(access, 'infrastructure.read:any'))
    ) {
      return decision(
        'not_rendered',
        'forbiddenHidden',
        'Server capability does not grant this read projection',
      );
    }

    return decision(
      access.actorClass === 'staff' || access.actorClass === 'admin'
        ? 'read_only'
        : 'full',
      variant,
      'Server authority grants the bounded read projection',
    );
  }

  if (feature === 'provenance') {
    const privileged =
      (access.actorClass === 'staff' &&
        access.caseScoped &&
        hasCapability(access, 'infrastructure.provenance')) ||
      (access.actorClass === 'admin' &&
        hasCapability(access, 'infrastructure.provenance:any'));
    if (
      (access.actorClass === 'staff' || access.actorClass === 'admin') &&
      !privileged
    ) {
      return decision(
        'not_rendered',
        'forbiddenHidden',
        'Server capability does not grant provenance evidence',
      );
    }

    if (access.actorClass === 'junior' && !access.ageAllowed) {
      return decision(
        'not_rendered',
        'forbiddenHidden',
        'Age policy does not grant this evidence projection',
      );
    }

    const boundedVariant =
      (access.actorClass === 'paid' && !access.entitled) ||
      (access.actorClass === 'creator' && !access.ownsResource) ||
      (access.actorClass === 'guardian' && !access.guardianMandate) ||
      (access.actorClass === 'business' && !access.organizationMandate)
        ? 'publicRead'
        : variant;

    return decision(
      access.actorClass === 'junior' ? 'partial_hidden' : 'read_only',
      boundedVariant,
      'Server authority grants a disclosure bounded evidence projection',
    );
  }

  if (feature === 'protected_command') {
    const allowed =
      (access.actorClass === 'paid' &&
        access.entitled &&
        hasCapability(access, 'infrastructure.write')) ||
      (access.actorClass === 'creator' &&
        access.ownsResource &&
        hasCapability(access, 'infrastructure.write')) ||
      (access.actorClass === 'guardian' &&
        access.guardianMandate &&
        hasCapability(access, 'infrastructure.write')) ||
      (access.actorClass === 'junior' &&
        access.ageAllowed &&
        hasCapability(access, 'infrastructure.write')) ||
      (access.actorClass === 'business' &&
        access.organizationMandate &&
        hasCapability(access, 'infrastructure.write')) ||
      (access.actorClass === 'staff' &&
        access.caseScoped &&
        hasCapability(access, 'infrastructure.write:case')) ||
      (access.actorClass === 'admin' &&
        hasCapability(access, 'infrastructure.write:any') &&
        access.stepUpVerified &&
        access.auditReasonPresent);

    if (!allowed) {
      return decision(
        access.actorClass === 'paid' ? 'disabled' : 'not_rendered',
        access.actorClass === 'paid'
          ? 'disabledPrerequisite'
          : 'forbiddenHidden',
        'Server authority does not grant this protected command',
      );
    }

    return decision(
      access.actorClass === 'junior' ? 'partial_hidden' : 'full',
      variant,
      'Server authority grants this bounded protected command',
    );
  }

  const destructiveAllowed =
    (access.actorClass === 'paid' &&
      access.entitled &&
      hasCapability(access, 'infrastructure.destroy') &&
      access.stepUpVerified) ||
    (access.actorClass === 'creator' &&
      access.ownsResource &&
      hasCapability(access, 'infrastructure.destroy') &&
      access.stepUpVerified) ||
    (access.actorClass === 'guardian' &&
      access.guardianMandate &&
      hasCapability(access, 'infrastructure.destroy') &&
      access.stepUpVerified) ||
    (access.actorClass === 'business' &&
      access.organizationMandate &&
      hasCapability(access, 'infrastructure.destroy') &&
      access.stepUpVerified) ||
    (access.actorClass === 'staff' &&
      access.caseScoped &&
      hasCapability(access, 'infrastructure.destroy:case') &&
      access.stepUpVerified) ||
    (access.actorClass === 'admin' &&
      hasCapability(access, 'infrastructure.destroy:any') &&
      access.stepUpVerified &&
      access.auditReasonPresent);

  if (destructiveAllowed) {
    return decision(
      'full',
      variant,
      'Server authority and recent step up grant this destructive command',
    );
  }

  const neverExpose =
    access.actorClass === 'free' ||
    (access.actorClass === 'guardian' && !access.guardianMandate) ||
    access.actorClass === 'junior';
  return decision(
    neverExpose ? 'not_rendered' : 'disabled',
    neverExpose ? 'forbiddenHidden' : 'disabledPrerequisite',
    'Destructive command prerequisites are not satisfied',
  );
}

export function accessVariantForMode(
  mode: PresentationDecision['mode'],
): AccessVariant {
  switch (mode) {
    case 'full':
      return 'full';
    case 'read_only':
      return 'read-only';
    case 'partial_hidden':
      return 'partial-hidden';
    case 'disabled':
      return 'disabled';
    case 'not_rendered':
      return 'not-rendered';
  }
}
