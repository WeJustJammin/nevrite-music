import type { RelationshipCommandDefinition } from './relationship-command-definitions';

export interface RelationshipFormValues {
  readonly [field: string]: string | readonly string[];
}

export type RelationshipCommandDefinitionLike = Pick<
  RelationshipCommandDefinition,
  'operationId' | 'action' | 'method' | 'targetField' | 'ifMatch'
>;

export interface RelationshipCommandRequest {
  readonly url: string;
  readonly method: 'POST' | 'DELETE';
  readonly headers: Headers;
  readonly body: string;
}

export type RelationshipCommandBuildResult =
  | Readonly<{ ok: true; request: RelationshipCommandRequest }>
  | Readonly<{ ok: false; message: string }>;

export const CREATE_ORGANIZATION_COMMAND: RelationshipCommandDefinitionLike = {
  operationId: 'ORG-01',
  action: '/api/v1/organizations',
  method: 'POST',
  ifMatch: false,
};

let idempotencyCounter = 0;

export const newRelationshipIdempotencyKey = (): string => {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `identity-relationship-${crypto.randomUUID()}`;
  }
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `identity-relationship-${Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('')}`;
  }
  idempotencyCounter += 1;
  return `identity-relationship-${Date.now().toString(36)}-${idempotencyCounter.toString(36)}`;
};

const firstValue = (
  value: string | readonly string[] | undefined,
): string | undefined => (typeof value === 'string' ? value : value?.[0]);

const bodyFromValues = (
  values: RelationshipFormValues,
  targetField: string | undefined,
): Record<string, unknown> => {
  const body: Record<string, unknown> = {};
  for (const [name, raw] of Object.entries(values)) {
    if (name === targetField) continue;
    if (name === 'typeCodes') {
      const source: readonly string[] =
        typeof raw === 'string' ? raw.split(',') : raw;
      const typeCodes = source
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      if (typeCodes.length > 0) body[name] = typeCodes;
      continue;
    }
    const value = firstValue(raw)?.trim();
    if (value !== undefined && value.length > 0) {
      if (name === 'inviteExpiresAt') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
          body[name] = parsed.toISOString();
          continue;
        }
      }
      body[name] = value;
    }
  }
  return body;
};

const pathFromDefinition = (
  definition: RelationshipCommandDefinitionLike,
  values: RelationshipFormValues,
  organizationId: string | null,
): string | null => {
  let path = definition.action;
  if (path.includes('{organizationId}')) {
    if (organizationId === null || organizationId.trim() === '') return null;
    path = path.replace(
      '{organizationId}',
      encodeURIComponent(organizationId.trim()),
    );
  }
  if (definition.targetField !== undefined) {
    const target = firstValue(values[definition.targetField])?.trim();
    if (target === undefined || target.length === 0) return null;
    path = path.replace(
      `{${definition.targetField}}`,
      encodeURIComponent(target),
    );
  }
  return path;
};

export const buildRelationshipCommandRequest = (
  input: Readonly<{
    readonly definition: RelationshipCommandDefinitionLike;
    readonly values: RelationshipFormValues;
    readonly organizationId: string | null;
    readonly expectedVersion: string | null;
    readonly idempotencyKey: string;
    readonly csrfToken?: string | null;
  }>,
): RelationshipCommandBuildResult => {
  const path = pathFromDefinition(
    input.definition,
    input.values,
    input.organizationId,
  );
  if (path === null) {
    return {
      ok: false,
      message: 'A canonical relationship target is required before submitting.',
    };
  }
  if (input.definition.ifMatch && input.expectedVersion === null) {
    return {
      ok: false,
      message: 'Refresh the organization before submitting this command.',
    };
  }
  const headers = new Headers({
    accept: 'application/json',
    'content-type': 'application/json',
    'idempotency-key': input.idempotencyKey,
  });
  if (input.definition.ifMatch && input.expectedVersion !== null)
    headers.set('if-match', input.expectedVersion);
  if (input.csrfToken !== undefined && input.csrfToken !== null)
    headers.set('x-csrf-token', input.csrfToken);
  return {
    ok: true,
    request: {
      url: path,
      method: input.definition.method,
      headers,
      body: JSON.stringify(
        bodyFromValues(input.values, input.definition.targetField),
      ),
    },
  };
};

export const relationshipFormValues = (
  form: HTMLFormElement,
): RelationshipFormValues => {
  const values: Record<string, string | string[]> = {};
  for (const [name, value] of new FormData(form).entries()) {
    if (typeof value !== 'string') continue;
    const current = values[name];
    if (current === undefined) values[name] = value;
    else if (Array.isArray(current)) values[name] = [...current, value];
    else values[name] = [current, value];
  }
  return values;
};

export const relationshipCsrfToken = (): string | null => {
  if (typeof document === 'undefined') return null;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('wj_csrf='));
  const token = cookie?.slice('wj_csrf='.length) ?? '';
  return token.length > 0 ? token : null;
};
