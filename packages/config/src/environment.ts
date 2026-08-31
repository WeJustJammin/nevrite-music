import { z } from 'zod';

import {
  BROWSER_ENVIRONMENT_KEYS,
  BrowserEnvironmentSchema,
  SERVER_ENVIRONMENT_KEYS,
  ServerEnvironmentSchema,
  type BrowserEnvironment,
  type ServerEnvironment,
} from './environment.schema';

export type EnvironmentScope = 'browser' | 'server';

export type EnvironmentIssue = Readonly<{
  code: string;
  message: string;
  path: string;
}>;

export class EnvironmentConfigurationError extends Error {
  readonly issues: readonly EnvironmentIssue[];
  readonly scope: EnvironmentScope;

  constructor(scope: EnvironmentScope, issues: readonly EnvironmentIssue[]) {
    const summary = issues
      .map((issue) => `${issue.path}: ${issue.message}`)
      .join('; ');

    super(
      `Invalid ${scope} environment configuration${summary ? ` (${summary})` : ''}`,
    );
    this.name = 'EnvironmentConfigurationError';
    this.scope = scope;
    this.issues = Object.freeze([...issues]);
  }
}

function safeIssueMessage(code: string): string {
  switch (code) {
    case 'invalid_type':
      return 'value is required and has the wrong type';
    case 'invalid_value':
      return 'value is not allowed';
    case 'invalid_format':
      return 'value has an invalid format';
    case 'too_small':
      return 'value is below the minimum';
    case 'too_big':
      return 'value exceeds the maximum';
    case 'unrecognized_keys':
      return 'unknown configuration key';
    default:
      return 'value is invalid';
  }
}

function safeIssues(error: z.ZodError): readonly EnvironmentIssue[] {
  return error.issues.map((issue) => ({
    code: issue.code,
    message: safeIssueMessage(issue.code),
    path: issue.path.length > 0 ? issue.path.join('.') : '<root>',
  }));
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function pickOwnKeys(
  input: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const key of keys) {
    if (Object.hasOwn(input, key)) {
      output[key] = input[key];
    }
  }

  return output;
}

/**
 * Parses the server-only runtime bindings. Throwing is intentional: a Worker
 * must not start serving requests with an incomplete server configuration.
 */
export function parseServerEnvironment(input: unknown): ServerEnvironment {
  const result = ServerEnvironmentSchema.safeParse(input);

  if (!result.success) {
    throw new EnvironmentConfigurationError('server', safeIssues(result.error));
  }

  return result.data;
}

/**
 * Builds the server configuration projection from combined runtime bindings.
 * Platform resources remain available to the runtime but never widen the
 * closed server configuration contract.
 */
export function projectServerEnvironment(input: unknown): ServerEnvironment {
  if (!isRecord(input)) {
    return parseServerEnvironment(input);
  }

  return parseServerEnvironment(pickOwnKeys(input, SERVER_ENVIRONMENT_KEYS));
}

/** Parses exactly the browser-safe public environment contract. */
export function parseBrowserEnvironment(input: unknown): BrowserEnvironment {
  const result = BrowserEnvironmentSchema.safeParse(input);

  if (!result.success) {
    throw new EnvironmentConfigurationError(
      'browser',
      safeIssues(result.error),
    );
  }

  return result.data;
}

/**
 * Builds the browser projection from a combined deployment environment.
 * Unknown values, including all server and setup secrets, are discarded
 * before validation and can never appear in the returned object.
 */
export function projectBrowserEnvironment(input: unknown): BrowserEnvironment {
  if (!isRecord(input)) {
    return parseBrowserEnvironment(input);
  }

  return parseBrowserEnvironment(pickOwnKeys(input, BROWSER_ENVIRONMENT_KEYS));
}

export { BROWSER_ENVIRONMENT_KEYS, SERVER_ENVIRONMENT_KEYS };
export type { BrowserEnvironment, ServerEnvironment };
