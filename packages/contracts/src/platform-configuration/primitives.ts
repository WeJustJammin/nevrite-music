import { z } from 'zod';

export const ConfigurationUuidSchema = z.uuid();
export const ConfigurationInstantSchema = z.iso.datetime({ offset: true });
export const ConfigurationVersionSchema = z
  .string()
  .regex(/^[1-9][0-9]{0,17}$/u, 'version_invalid');
export const ConfigurationHashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/u, 'hash_invalid');
export const ConfigurationKeySchema = z
  .string()
  .max(128)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+){0,15}$/u, 'key_invalid');
export const ConfigurationCapabilitySchema = z
  .string()
  .regex(/^[a-z][a-z0-9._-]{1,95}$/u, 'capability_invalid');
export const ConfigurationTextSchema = z.string().trim().min(1).max(512);

export const ConfigurationScopeTypeSchema = z.enum([
  'platform',
  'environment',
  'party',
  'site',
  'route',
  'feature',
  'user',
]);
export const ConfigurationValueKindSchema = z.enum([
  'boolean',
  'integer',
  'decimal',
  'short_text',
  'enum',
  'duration',
  'timestamp',
  'json_object',
  'string_list',
  'percentage',
]);
export const ConfigurationRiskClassSchema = z.enum([
  'low',
  'medium',
  'high',
  'emergency',
]);
export const ConfigurationMergeModeSchema = z.enum([
  'replace',
  'append_unique',
  'object_merge_allowlist',
]);

type JsonNode =
  string | number | boolean | null | JsonNode[] | { [key: string]: JsonNode };

const encodedByteLength = (value: JsonNode): number =>
  new TextEncoder().encode(JSON.stringify(value)).length;

export const ConfigurationJsonValueSchema = z
  .json()
  .superRefine((value, context) => {
    if (encodedByteLength(value) > 65_536) {
      context.addIssue({ code: 'custom', message: 'json_bytes_exceeded' });
    }
    const walk = (
      node: JsonNode,
      depth: number,
      path: readonly (string | number)[],
    ): void => {
      if (depth > 8) {
        context.addIssue({
          code: 'custom',
          path: [...path],
          message: 'json_depth_exceeded',
        });
        return;
      }
      if (Array.isArray(node)) {
        if (node.length > 64) {
          context.addIssue({
            code: 'custom',
            path: [...path],
            message: 'json_array_exceeded',
          });
        }
        node.forEach((item, index) => walk(item, depth + 1, [...path, index]));
        return;
      }
      if (node !== null && typeof node === 'object') {
        const entries = Object.entries(node);
        if (entries.length > 64) {
          context.addIssue({
            code: 'custom',
            path: [...path],
            message: 'json_keys_exceeded',
          });
        }
        for (const [key, item] of entries) {
          if (key.length > 128) {
            context.addIssue({
              code: 'custom',
              path: [...path, key],
              message: 'json_key_invalid',
            });
          }
          walk(item, depth + 1, [...path, key]);
        }
      }
    };
    walk(value, 0, []);
  });

export const ConfigurationJsonObjectSchema = z
  .record(z.string().max(128), ConfigurationJsonValueSchema)
  .refine((value) => Object.keys(value).length <= 64, 'json_keys_exceeded');

export const ConfigurationIntervalSchema = z
  .strictObject({
    effectiveFrom: ConfigurationInstantSchema,
    effectiveTo: ConfigurationInstantSchema.nullable(),
  })
  .refine(
    ({ effectiveFrom, effectiveTo }) =>
      effectiveTo === null || effectiveTo > effectiveFrom,
    'interval_invalid',
  );
