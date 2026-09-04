import { z } from 'zod';

import type { ContentSchemaRegistryRoutePolicy } from './route-policy.ts';
import { schemaReference } from './openapi-contracts.ts';

export const apiErrorResponses = (
  route: ContentSchemaRegistryRoutePolicy,
  contracts: Readonly<Record<string, z.ZodTypeAny>>,
): Record<string, unknown> => {
  const grouped = new Map<number, string[]>();
  for (const [code, status] of Object.entries(route.errors)) {
    const codes = grouped.get(status) ?? [];
    codes.push(code);
    grouped.set(status, codes);
  }
  const errorRef = schemaReference('ApiErrorSchema', contracts);
  return Object.fromEntries(
    [...grouped.entries()]
      .sort(([left], [right]) => left - right)
      .map(([status, codes]) => [
        String(status),
        {
          description: codes.sort().join(', '),
          content: { 'application/json': { schema: errorRef } },
        },
      ]),
  );
};
