export * from './route-policy-base.ts';

import {
  CONTENT_SCHEMA_REGISTRY_OPERATION_IDS,
  type ContentSchemaRegistryOperationId,
} from './route-policy-base.ts';
import type { RouteContractByOperation } from './route-policy-contracts.ts';

export type ContentSchemaRegistryRoutePolicy = {
  [OperationId in ContentSchemaRegistryOperationId]: Readonly<
    { operationId: OperationId } & RouteContractByOperation[OperationId]
  >;
}[ContentSchemaRegistryOperationId];

export const assertContentSchemaRegistryRouteRegistry = <
  const T extends readonly ContentSchemaRegistryRoutePolicy[],
>(
  routes: T,
): T => {
  const operationIds = new Set<ContentSchemaRegistryOperationId>();
  const methodPaths = new Set<string>();
  for (const route of routes) {
    if (operationIds.has(route.operationId))
      throw new Error(
        `Duplicate content schema registry operation: ${route.operationId}`,
      );
    operationIds.add(route.operationId);
    const methodPath = `${route.method} ${route.path}`;
    if (methodPaths.has(methodPath))
      throw new Error(`Duplicate content schema registry route: ${methodPath}`);
    methodPaths.add(methodPath);
  }
  if (routes.length !== CONTENT_SCHEMA_REGISTRY_OPERATION_IDS.length)
    throw new Error(
      `Content schema registry route count must be ${CONTENT_SCHEMA_REGISTRY_OPERATION_IDS.length}.`,
    );
  for (const operationId of CONTENT_SCHEMA_REGISTRY_OPERATION_IDS)
    if (!operationIds.has(operationId))
      throw new Error(
        `Missing content schema registry operation: ${operationId}`,
      );
  return routes;
};
