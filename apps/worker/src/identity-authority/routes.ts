import type { WorkerApp, WorkerDependencies } from '../index';
import {
  acceptTransferOffer,
  addFacet,
  bindActingContext,
  changeHandle,
  createAlias,
  createPerson,
  createTransferOffer,
  declineTransferOffer,
  patchAlias,
  readActingContexts,
  readPerson,
  readPublicProjection,
  removeFacet,
  retireAlias,
} from './handlers';
import {
  addOrganizationType,
  createOrganization,
  readOrganization,
  removeOrganizationType,
} from './handlers-relationship-organizations';
import {
  acceptMembership,
  assertMembership,
  endMembership,
  inviteMembership,
} from './handlers-relationship-memberships';
import { addCapacityPeriod } from './handlers-relationship-capacity';
import { readMemberships } from './handlers-relationship-membership-read';
import type { RecoveryState } from './recovery';

export const registerIdentityAuthorityRoutes = (
  app: WorkerApp,
  dependencies: WorkerDependencies,
): void => {
  const state: RecoveryState = { pending: new Set() };
  app.post('/api/v1/me/identity', (context) =>
    createPerson(context, dependencies, state),
  );
  app.get('/api/v1/me/identity', (context) =>
    readPerson(context, dependencies, state),
  );
  app.post('/api/v1/me/facets', (context) =>
    addFacet(context, dependencies, state),
  );
  app.delete('/api/v1/me/facets/:facetCode', (context) =>
    removeFacet(context, dependencies, state),
  );
  app.post('/api/v1/aliases', (context) =>
    createAlias(context, dependencies, state),
  );
  app.patch('/api/v1/aliases/:aliasId', (context) =>
    patchAlias(context, dependencies, state),
  );
  app.post('/api/v1/aliases/:aliasId/handle-changes', (context) =>
    changeHandle(context, dependencies, state),
  );
  app.post('/api/v1/aliases/:aliasId/retire', (context) =>
    retireAlias(context, dependencies, state),
  );
  app.post('/api/v1/aliases/:aliasId/transfer-offers', (context) =>
    createTransferOffer(context, dependencies, state),
  );
  app.post('/api/v1/alias-transfer-offers/:offerId/accept', (context) =>
    acceptTransferOffer(context, dependencies, state),
  );
  app.post('/api/v1/alias-transfer-offers/:offerId/decline', (context) =>
    declineTransferOffer(context, dependencies, state),
  );
  app.get('/api/v1/me/acting-contexts', (context) =>
    readActingContexts(context, dependencies, state),
  );
  app.post('/api/v1/me/acting-context-bindings', (context) =>
    bindActingContext(context, dependencies, state),
  );
  app.get('/api/v1/identity/parties/:partyId/projection', (context) =>
    readPublicProjection(context, dependencies, state),
  );
  app.post('/api/v1/organizations', (context) =>
    createOrganization(context, dependencies, state),
  );
  app.get('/api/v1/organizations/:organizationId', (context) =>
    readOrganization(context, dependencies, state),
  );
  app.post(
    '/api/v1/organizations/:organizationId/type-assignments',
    (context) => addOrganizationType(context, dependencies, state),
  );
  app.delete(
    '/api/v1/organizations/:organizationId/type-assignments/:assignmentId',
    (context) => removeOrganizationType(context, dependencies, state),
  );
  app.post(
    '/api/v1/organizations/:organizationId/membership-invitations',
    (context) => inviteMembership(context, dependencies, state),
  );
  app.post(
    '/api/v1/organizations/:organizationId/membership-assertions',
    (context) => assertMembership(context, dependencies, state),
  );
  app.post('/api/v1/membership-tenures/:tenureId/accept', (context) =>
    acceptMembership(context, dependencies, state),
  );
  app.post('/api/v1/membership-tenures/:tenureId/end', (context) =>
    endMembership(context, dependencies, state),
  );
  app.post('/api/v1/membership-tenures/:tenureId/capacity-periods', (context) =>
    addCapacityPeriod(context, dependencies, state),
  );
  app.get('/api/v1/organizations/:organizationId/memberships', (context) =>
    readMemberships(context, dependencies, state),
  );
};
