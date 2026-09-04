import type {
  InfrastructureAccessProjection,
  InfrastructureFeature,
  PresentationDecision,
} from '@wejammin/contracts';

import { resolvePresentation } from '../../../../../packages/ui/src/infrastructure/presentation-access';

/**
 * Thin feature-local adapter around the canonical design-system policy. The
 * Worker-selected projection remains the only authority; URL role strings are
 * never read here.
 */
export function resolveRoleProjection(
  feature: InfrastructureFeature,
  access: InfrastructureAccessProjection,
): PresentationDecision {
  return resolvePresentation(feature, access);
}
