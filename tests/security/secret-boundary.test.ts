import {
  parseBrowserEnvironment,
  projectBrowserEnvironment,
} from '../../packages/config/src/environment.ts';
import {
  createBrowserEnvironmentFixture,
  createSecurityFixture,
  createServerEnvironmentFixture,
} from '@wejammin/test-support';
import { describe, expect, it } from 'vitest';

describe('security test project', () => {
  it('projects only public environment keys into browser configuration', () => {
    const security = createSecurityFixture();
    const server = createServerEnvironmentFixture({
      SUPABASE_SECRET_KEY: security.serverSecret,
    });
    const browser = createBrowserEnvironmentFixture();
    const projection = projectBrowserEnvironment({ ...server, ...browser });

    expect(parseBrowserEnvironment(projection)).toEqual(
      security.publicEnvironment,
    );
    expect(projection).not.toHaveProperty(security.browserSecretKeyName);
    expect(JSON.stringify(projection)).not.toContain(security.serverSecret);
  });

  it('rejects a combined server environment when parsed as browser input', () => {
    const security = createSecurityFixture();
    const server = createServerEnvironmentFixture({
      SUPABASE_SECRET_KEY: security.serverSecret,
    });

    expect(() => parseBrowserEnvironment(server)).toThrow();
  });
});
