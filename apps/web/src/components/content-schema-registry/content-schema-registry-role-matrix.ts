import type { ContentSchemaRegistryVariant } from './content-schema-registry-types';

/**
 * Presentation matrix from FE03. The role label documents server policy only;
 * it is never an authorization input and cannot select a capability in the
 * browser.
 */
export const CONTENT_SCHEMA_REGISTRY_ROLE_MATRIX = {
  Free: {
    variant: 'forbiddenHidden',
    listDetail: 'not-rendered',
    commands: 'not-rendered',
  },
  Paid: {
    variant: 'entitledRead',
    listDetail: 'protected-entitled-scope',
    commands: 'capability-bound',
  },
  Creator: {
    variant: 'ownerFull',
    listDetail: 'protected-owned-scope',
    commands: 'owned-or-mandated',
  },
  Guardian: {
    variant: 'guardianMandate',
    listDetail: 'protected-mandate-scope',
    commands: 'mandate-bound',
  },
  Junior: {
    variant: 'juniorRestricted',
    listDetail: 'protected-age-allowed-scope',
    commands: 'restricted-field-capability-bound',
  },
  Business: {
    variant: 'businessMandate',
    listDetail: 'protected-organization-scope',
    commands: 'organization-mandate-bound',
  },
  Staff: {
    variant: 'staffCaseScoped',
    listDetail: 'protected-case-scope',
    commands: 'operation-and-case-bound',
  },
  Admin: {
    variant: 'adminStepUp',
    listDetail: 'protected-capability-scope',
    commands: 'named-capability-step-up-bound',
  },
} as const satisfies Readonly<
  Record<
    string,
    Readonly<{
      readonly variant: Exclude<ContentSchemaRegistryVariant, 'degradedPage'>;
      readonly listDetail: string;
      readonly commands: string;
    }>
  >
>;

export type ContentSchemaRegistryRole =
  keyof typeof CONTENT_SCHEMA_REGISTRY_ROLE_MATRIX;
