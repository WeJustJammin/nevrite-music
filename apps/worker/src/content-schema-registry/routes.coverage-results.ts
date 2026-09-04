import type { ContentSchemaRegistrySession } from './types';
import type {
  ContentSchemaRegistryError,
  ContentSchemaRegistryResult,
} from './types';

export const ok = <T>(value: T): ContentSchemaRegistryResult<T> => ({
  ok: true,
  value,
});

export const failure = (
  status: ContentSchemaRegistryError['status'],
  code = 'DEPENDENCY_UNAVAILABLE',
  details?: Readonly<Record<string, unknown>>,
  retryAfterSeconds?: number,
): ContentSchemaRegistryError => ({
  ok: false,
  status,
  code,
  message: 'dependency failed',
  ...(details === undefined ? {} : { details }),
  ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
});

export type Overrides = Readonly<{
  session?: ContentSchemaRegistryResult<ContentSchemaRegistrySession>;
  rate?: ContentSchemaRegistryResult<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
  }>;
  release?: ContentSchemaRegistryResult<{
    principalId: string;
    keyId: string;
    capabilities: readonly string[];
    verifiedAt: string;
    rawBodyHash: string;
    signatureHash: string;
    nonceHash: string;
  }>;
  port?: ContentSchemaRegistryResult<unknown>;
}>;
