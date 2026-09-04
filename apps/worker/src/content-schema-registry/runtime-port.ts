import {
  BlockDefinitionVersionResourceSchema,
  BlockLifecycleEventResourceSchema,
  ContentSchemaRegistryDetailSchema,
  ContentSchemaRegistryListPageSchema,
  ContentTypeVersionResourceSchema,
  FieldDefinitionVersionResourceSchema,
  RelationDefinitionResourceSchema,
  SchemaActivationResourceSchema,
} from './contracts';
import type {
  ContentSchemaRegistryDependencies,
  ContentSchemaRegistryError,
  ContentSchemaRegistryOperationId,
  ContentSchemaRegistryPortInput,
  ContentSchemaRegistryResult,
} from './types';

type ResponseSchema = Readonly<{
  safeParse: (
    value: unknown,
  ) =>
    Readonly<{ success: true; data: unknown }> | Readonly<{ success: false }>;
}>;

const responseSchemas: Readonly<
  Record<ContentSchemaRegistryOperationId, ResponseSchema>
> = {
  'CMS-03A-01': ContentTypeVersionResourceSchema,
  'CMS-03A-02': FieldDefinitionVersionResourceSchema,
  'CMS-03A-03': RelationDefinitionResourceSchema,
  'CMS-03A-04': SchemaActivationResourceSchema,
  'CMS-03A-05': BlockDefinitionVersionResourceSchema,
  'CMS-03A-06': ContentSchemaRegistryListPageSchema,
  'CMS-03A-07': ContentSchemaRegistryDetailSchema,
  'CMS-03A-08': BlockLifecycleEventResourceSchema,
};

const portNames: Readonly<
  Record<
    ContentSchemaRegistryOperationId,
    keyof ContentSchemaRegistryDependencies['ports']
  >
> = {
  'CMS-03A-01': 'createTypeDraft',
  'CMS-03A-02': 'addFieldDefinition',
  'CMS-03A-03': 'bindRelation',
  'CMS-03A-04': 'activateSchema',
  'CMS-03A-05': 'registerBlock',
  'CMS-03A-06': 'listContentTypes',
  'CMS-03A-07': 'getContentTypeVersion',
  'CMS-03A-08': 'advanceBlockLifecycle',
};

const unavailable = (): ContentSchemaRegistryError => ({
  ok: false,
  status: 503,
  code: 'DEPENDENCY_UNAVAILABLE',
  message: 'CMS registry persistence is temporarily unavailable.',
  details: { dependencyClass: 'cms_registry', retryable: true },
  retryAfterSeconds: 5,
});

const timedOut = (): ContentSchemaRegistryError => ({
  ok: false,
  status: 504,
  code: 'DEPENDENCY_DEADLINE_EXCEEDED',
  message: 'CMS registry persistence exceeded its deadline.',
  details: { dependencyClass: 'cms_registry', retryable: true },
  retryAfterSeconds: 5,
});

const invalidResponse = (): ContentSchemaRegistryError => ({
  ok: false,
  status: 502,
  code: 'DEPENDENCY_INVALID_RESPONSE',
  message: 'The CMS registry dependency returned an invalid response.',
  details: { dependencyClass: 'cms_registry', retryable: false },
});

const withDeadline = async <T>(
  invoke: (signal: AbortSignal) => Promise<ContentSchemaRegistryResult<T>>,
  deadlineMs: number,
): Promise<ContentSchemaRegistryResult<T>> => {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<ContentSchemaRegistryError>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(timedOut());
    }, deadlineMs);
  });
  try {
    return await Promise.race([invoke(controller.signal), timeout]);
  } catch {
    return unavailable();
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
};

export const createContentSchemaRegistryPortRunner = (
  dependencies: ContentSchemaRegistryDependencies,
) => {
  const run = async (
    input: ContentSchemaRegistryPortInput,
  ): Promise<ContentSchemaRegistryResult<unknown>> => {
    const portName = portNames[input.operationId];
    const port = dependencies.ports[portName];
    if (port === undefined) return unavailable();
    const result = await withDeadline<unknown>(
      (signal) =>
        port(input, signal) as Promise<ContentSchemaRegistryResult<unknown>>,
      dependencies.deadlineMs ?? 15_000,
    );
    if (!result.ok) return result;
    const parsed = responseSchemas[input.operationId].safeParse(result.value);
    return parsed.success
      ? { ok: true, value: parsed.data }
      : invalidResponse();
  };

  return { run };
};
