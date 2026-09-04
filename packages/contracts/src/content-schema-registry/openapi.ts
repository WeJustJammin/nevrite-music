import { contentSchemaRegistryRoutePolicies } from './routes.ts';
import { buildPaths } from './openapi-operation.ts';
import {
  browserSchemaContracts,
  componentName,
  schemaContracts,
  schemaForName,
  toJsonSchema,
} from './openapi-support.ts';

export const getContentSchemaRegistryOpenApiComponentSchemas = (): Readonly<
  Record<string, unknown>
> =>
  Object.fromEntries(
    Object.keys(schemaContracts).map((name) => [
      componentName(name),
      toJsonSchema(name, schemaForName(name)),
    ]),
  );

export const getContentSchemaRegistryBrowserOpenApiComponentSchemas =
  (): Readonly<Record<string, unknown>> =>
    Object.fromEntries(
      Object.keys(browserSchemaContracts).map((name) => [
        componentName(name),
        toJsonSchema(name, schemaForName(name, browserSchemaContracts)),
      ]),
    );

export const contentSchemaRegistryOpenApiPaths = buildPaths(
  contentSchemaRegistryRoutePolicies,
  schemaContracts,
);

export const contentSchemaRegistryBrowserRoutePolicies =
  contentSchemaRegistryRoutePolicies.filter(
    (route) => route.audience === 'browser',
  );

export const contentSchemaRegistryBrowserOpenApiPaths = buildPaths(
  contentSchemaRegistryBrowserRoutePolicies,
  browserSchemaContracts,
);

/** Full route inventory for internal/worker documentation. */
export const buildContentSchemaRegistryOpenApiDocument = () => ({
  openapi: '3.1.0',
  info: {
    title: 'WeJammin Content Schema Registry API (internal)',
    version: '1.0.0',
    description:
      'Internal/worker audience. Includes release-worker route metadata; do not publish as browser API documentation.',
  },
  'x-audience': 'internal-worker',
  paths: contentSchemaRegistryOpenApiPaths,
  components: { schemas: getContentSchemaRegistryOpenApiComponentSchemas() },
});

/** Browser contract view; release-worker routes and evidence are excluded. */
export const buildContentSchemaRegistryBrowserOpenApiDocument = () => ({
  openapi: '3.1.0',
  info: {
    title: 'WeJammin Content Schema Registry API (browser)',
    version: '1.0.0',
    description:
      'Browser audience. Restricted routes and non-public fields are omitted.',
  },
  'x-audience': 'browser',
  paths: contentSchemaRegistryBrowserOpenApiPaths,
  components: {
    schemas: getContentSchemaRegistryBrowserOpenApiComponentSchemas(),
  },
});
