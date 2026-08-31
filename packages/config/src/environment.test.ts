import { describe, expect, it } from 'vitest';

import {
  BrowserEnvironmentSchema,
  ServerEnvironmentSchema,
} from './environment.schema';
import {
  EnvironmentConfigurationError,
  parseBrowserEnvironment,
  parseServerEnvironment,
  projectBrowserEnvironment,
} from './environment';

const validServerEnvironment = {
  APP_ENVIRONMENT: 'development',
  APP_RELEASE: 'local',
  SUPABASE_SECRET_KEY: 'sb_secret_local_only',
  SUPABASE_URL: 'http://127.0.0.1:54321',
} as const;

const validBrowserEnvironment = {
  PUBLIC_APP_ORIGIN: 'http://localhost:4321',
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_local',
  PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
} as const;

describe('environment contracts', () => {
  it('accepts the exact server contract and rejects unapproved provider bindings', () => {
    expect(parseServerEnvironment(validServerEnvironment)).toEqual(
      validServerEnvironment,
    );
    expect(() =>
      parseServerEnvironment({
        ...validServerEnvironment,
        UNAPPROVED_PROVIDER_SECRET: 'unapproved-provider-secret',
      }),
    ).toThrowError(EnvironmentConfigurationError);
  });

  it('accepts HTTPS server URLs outside development', () => {
    const parsed = parseServerEnvironment({
      ...validServerEnvironment,
      APP_ENVIRONMENT: 'staging',
      SUPABASE_URL: 'https://staging.example.supabase.co',
    });

    expect(parsed.APP_ENVIRONMENT).toBe('staging');
    expect(parsed.SUPABASE_URL).toBe('https://staging.example.supabase.co');
  });

  it('rejects unknown server keys without copying setup credential values into errors', () => {
    try {
      parseServerEnvironment({
        ...validServerEnvironment,
        SUPABASE_DB_PASSWORD: 'sentinel-db-password',
      });
      throw new Error('expected unknown server configuration to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      expect(error).toBeInstanceOf(Error);

      if (error instanceof EnvironmentConfigurationError) {
        expect(error.issues.map((issue) => issue.code)).toContain(
          'unrecognized_keys',
        );
        expect(error.message).not.toContain('sentinel-db-password');
      }
    }
  });

  it('fails startup parsing when required server bindings are missing', () => {
    try {
      parseServerEnvironment({
        APP_ENVIRONMENT: 'production',
        APP_RELEASE: 'release-1',
      });
      throw new Error('expected server configuration parsing to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);

      if (error instanceof EnvironmentConfigurationError) {
        expect(error.scope).toBe('server');
        expect(error.issues.map((issue) => issue.path)).toEqual(
          expect.arrayContaining(['SUPABASE_SECRET_KEY', 'SUPABASE_URL']),
        );
        expect(error.message).not.toContain('sentinel');
      }
    }
  });

  it('rejects non-HTTPS Supabase URLs for staging and production', () => {
    expect(() =>
      parseServerEnvironment({
        ...validServerEnvironment,
        APP_ENVIRONMENT: 'production',
        SUPABASE_URL: 'http://127.0.0.1:54321',
      }),
    ).toThrowError(EnvironmentConfigurationError);
  });

  it('accepts only the explicit browser-safe contract', () => {
    expect(parseBrowserEnvironment(validBrowserEnvironment)).toEqual(
      validBrowserEnvironment,
    );
    expect(
      BrowserEnvironmentSchema.safeParse(validBrowserEnvironment).success,
    ).toBe(true);
    expect(
      ServerEnvironmentSchema.safeParse(validServerEnvironment).success,
    ).toBe(true);
  });

  it('rejects server secrets passed directly to the browser parser', () => {
    expect(() =>
      parseBrowserEnvironment({
        ...validBrowserEnvironment,
        SUPABASE_SECRET_KEY: 'sentinel-server-secret',
      }),
    ).toThrowError(EnvironmentConfigurationError);
  });

  it('projects only browser-safe keys from a combined deployment environment', () => {
    const projected = projectBrowserEnvironment({
      ...validBrowserEnvironment,
      APP_RELEASE: 'release-with-secret-adjacent-data',
      SUPABASE_SECRET_KEY: 'sentinel-server-secret',
      UNAPPROVED_PROVIDER_SECRET: 'sentinel-provider-secret',
      SUPABASE_DB_PASSWORD: 'sentinel-db-password',
      UNREGISTERED_VALUE: 'sentinel-unknown',
    });

    expect(projected).toEqual(validBrowserEnvironment);
    expect(Object.keys(projected).sort()).toEqual([
      'PUBLIC_APP_ORIGIN',
      'PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'PUBLIC_SUPABASE_URL',
    ]);
    expect(JSON.stringify(projected)).not.toContain('sentinel');
  });

  it('fails browser projection when an allowlisted public value is missing', () => {
    expect(() =>
      projectBrowserEnvironment({
        PUBLIC_APP_ORIGIN: validBrowserEnvironment.PUBLIC_APP_ORIGIN,
        PUBLIC_SUPABASE_URL: validBrowserEnvironment.PUBLIC_SUPABASE_URL,
      }),
    ).toThrowError(EnvironmentConfigurationError);
  });

  it('rejects embedded URL credentials at either boundary', () => {
    expect(() =>
      parseBrowserEnvironment({
        ...validBrowserEnvironment,
        PUBLIC_APP_ORIGIN: 'https://user:password@example.test',
      }),
    ).toThrowError(EnvironmentConfigurationError);
  });
});
