import { createContentSchemaRegistryPlatformPorts } from './content-schema-registry-platform-api';
import type { ContentSchemaRegistryPorts } from './content-schema-registry-context-types';

export {
  AuthoritySchema,
  ReadCapabilities,
  SessionSchema,
  UuidSchema,
} from './content-schema-registry-context-types';
export type {
  ContentSchemaRegistryAuthority,
  ContentSchemaRegistrySession,
} from './content-schema-registry-context-types';

export const createContentSchemaRegistryPorts = (
  ports: ContentSchemaRegistryPorts,
): ContentSchemaRegistryPorts => ports;

const hasPort = (
  value: unknown,
  key: keyof ContentSchemaRegistryPorts,
): boolean =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Record<string, unknown>)[key] === 'function';

export const readContentSchemaRegistryPorts = (
  locals: unknown,
  binding?: unknown,
): ContentSchemaRegistryPorts | null => {
  if (typeof locals === 'object' && locals !== null) {
    const record = locals as Record<string, unknown>;
    for (const key of ['contentSchemaRegistryPorts', 'contentSchemaRegistry']) {
      const candidate = record[key];
      if (
        hasPort(candidate, 'verifySession') &&
        hasPort(candidate, 'now') &&
        hasPort(candidate, 'resolveAuthority') &&
        hasPort(candidate, 'loadList') &&
        hasPort(candidate, 'loadDetail')
      ) {
        return candidate as ContentSchemaRegistryPorts;
      }
    }
  }
  if (binding !== undefined) {
    try {
      return createContentSchemaRegistryPlatformPorts(binding);
    } catch {
      return null;
    }
  }
  return null;
};
