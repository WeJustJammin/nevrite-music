import type { FeatureApp } from './route-types';
import { operations, routeIds } from './route-types';
import { humanBodySchemas } from './admission';
import { parseQuery, parseRequestPathId, rejectDetailQuery } from './admission';
import { errorResponse } from './route-response';
import type { RouteHandlers } from './route-handlers';

export const registerContentSchemaRegistryEndpoints = (
  app: FeatureApp,
  handlers: RouteHandlers,
): void => {
  app.post('/api/v1/cms/content-types', async (context) => {
    context.set('operationId', operations.create);
    return handlers.humanMutation(
      context,
      operations.create,
      humanBodySchemas[operations.create],
    );
  });
  app.post(
    '/api/v1/cms/content-types/:contentTypeId/versions/:versionId/fields',
    async (context) => {
      context.set('operationId', operations.field);
      const typeId = parseRequestPathId(context.req.param(routeIds.typeId));
      const versionId = parseRequestPathId(
        context.req.param(routeIds.versionId),
      );
      if (!typeId.ok)
        return errorResponse(context, typeId, context.get('requestId'));
      if (!versionId.ok)
        return errorResponse(context, versionId, context.get('requestId'));
      return handlers.humanMutation(
        context,
        operations.field,
        humanBodySchemas[operations.field],
        { contentTypeId: typeId.value, versionId: versionId.value },
      );
    },
  );
  app.post(
    '/api/v1/cms/content-types/:contentTypeId/versions/:versionId/relations',
    async (context) => {
      context.set('operationId', operations.relation);
      const typeId = parseRequestPathId(context.req.param(routeIds.typeId));
      const versionId = parseRequestPathId(
        context.req.param(routeIds.versionId),
      );
      if (!typeId.ok)
        return errorResponse(context, typeId, context.get('requestId'));
      if (!versionId.ok)
        return errorResponse(context, versionId, context.get('requestId'));
      return handlers.humanMutation(
        context,
        operations.relation,
        humanBodySchemas[operations.relation],
        { contentTypeId: typeId.value, versionId: versionId.value },
      );
    },
  );
  app.post(
    '/api/v1/cms/content-types/:contentTypeId/versions/:versionId/activate',
    async (context) => {
      context.set('operationId', operations.activate);
      const typeId = parseRequestPathId(context.req.param(routeIds.typeId));
      const versionId = parseRequestPathId(
        context.req.param(routeIds.versionId),
      );
      if (!typeId.ok)
        return errorResponse(context, typeId, context.get('requestId'));
      if (!versionId.ok)
        return errorResponse(context, versionId, context.get('requestId'));
      return handlers.humanMutation(
        context,
        operations.activate,
        humanBodySchemas[operations.activate],
        { contentTypeId: typeId.value, versionId: versionId.value },
      );
    },
  );
  app.post('/api/v1/cms/blocks/versions', async (context) => {
    context.set('operationId', operations.register);
    return handlers.releaseMutation(context, operations.register);
  });
  app.get('/api/v1/cms/content-types', async (context) => {
    context.set('operationId', operations.list);
    const query = parseQuery(context.req.raw);
    if (!query.ok)
      return errorResponse(context, query, context.get('requestId'));
    return handlers.protectedRead(context, operations.list, {}, query.value);
  });
  app.get(
    '/api/v1/cms/content-types/:contentTypeId/versions/:versionId',
    async (context) => {
      context.set('operationId', operations.detail);
      const queryError = rejectDetailQuery(context.req.raw);
      if (queryError !== null)
        return errorResponse(context, queryError, context.get('requestId'));
      const typeId = parseRequestPathId(context.req.param(routeIds.typeId));
      const versionId = parseRequestPathId(
        context.req.param(routeIds.versionId),
      );
      if (!typeId.ok)
        return errorResponse(context, typeId, context.get('requestId'));
      if (!versionId.ok)
        return errorResponse(context, versionId, context.get('requestId'));
      return handlers.protectedRead(context, operations.detail, {
        contentTypeId: typeId.value,
        versionId: versionId.value,
      });
    },
  );
  app.post(
    '/api/v1/cms/blocks/versions/:blockDefinitionVersionId/lifecycle',
    async (context) => {
      context.set('operationId', operations.lifecycle);
      const blockId = parseRequestPathId(context.req.param(routeIds.blockId));
      if (!blockId.ok)
        return errorResponse(context, blockId, context.get('requestId'));
      return handlers.releaseMutation(context, operations.lifecycle, {
        blockDefinitionVersionId: blockId.value,
      });
    },
  );
};
