import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

type JsonObject = Record<string, unknown>;

const readRepoFile = (path: string): string =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const webDirectory = fileURLToPath(new URL('../apps/web/', import.meta.url));
const generatedWranglerUrl = new URL(
  '../apps/web/dist/server/wrangler.json',
  import.meta.url,
);

const parseJsonc = (source: string): JsonObject =>
  JSON.parse(
    source
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/^\s*\/\/.*$/gmu, '')
      .replace(/,\s*([}\]])/gu, '$1'),
  ) as JsonObject;

const asObject = (value: unknown, label: string): JsonObject => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as JsonObject;
};

const webDeployStep = (workflow: string): string => {
  const match = workflow.match(
    /- name: Deploy web SSR Worker[\s\S]*?(?=\n\s+- name:|$)/u,
  );
  if (!match) throw new Error('web SSR Worker deployment step is required');
  return match[0];
};

const buildWebConfig = (environmentName?: string): JsonObject => {
  const environment = { ...process.env };
  if (environmentName) environment.CLOUDFLARE_ENV = environmentName;
  else delete environment.CLOUDFLARE_ENV;

  execFileSync('pnpm', ['build'], {
    cwd: webDirectory,
    env: environment,
    stdio: 'pipe',
  });

  return JSON.parse(readFileSync(generatedWranglerUrl, 'utf8')) as JsonObject;
};

describe('Astro Cloudflare Worker SSR deployment contract', () => {
  it('disables automatic KV sessions and paid image bindings', () => {
    const config = readRepoFile('apps/web/astro.config.mjs');

    expect(config).toMatch(/output:\s*'server'/u);
    expect(config).toMatch(/session:\s*false/u);
    expect(config).toMatch(
      /optimizeDeps:\s*\{[\s\S]*?include:\s*\['astro\/assets\/services\/noop'\]/u,
    );
    expect(config).toMatch(
      /cloudflare\(\{[\s\S]*?imageService:\s*'passthrough'[\s\S]*?\}\)/u,
    );
  });

  it('binds production and staging SSR Workers to their matching platform APIs', () => {
    const config = parseJsonc(readRepoFile('apps/web/wrangler.jsonc'));
    const environments = asObject(config.env, 'env');
    const staging = asObject(environments.staging, 'env.staging');

    expect(config.name).toBe('wejammin-web');
    expect(config.main).toBe('@astrojs/cloudflare/entrypoints/server');
    expect(config.assets).toEqual({ directory: './dist', binding: 'ASSETS' });
    expect(config.services).toEqual([
      { binding: 'PLATFORM_API', service: 'wejammin-api' },
    ]);
    expect(staging.name).toBe('wejammin-web-staging');
    expect(staging.services).toEqual([
      { binding: 'PLATFORM_API', service: 'wejammin-api-staging' },
    ]);
    expect(JSON.stringify(config)).not.toMatch(
      /API_ORIGIN|PUBLIC_API|kv_namespaces|"images"/u,
    );
  });

  it('generates environment-specific configs without KV or Images resources', () => {
    const production = buildWebConfig();
    const staging = buildWebConfig('staging');

    expect(production.name).toBe('wejammin-web');
    expect(production.services).toEqual([
      { binding: 'PLATFORM_API', service: 'wejammin-api' },
    ]);
    expect(staging.name).toBe('wejammin-web-staging');
    expect(staging.services).toEqual([
      { binding: 'PLATFORM_API', service: 'wejammin-api-staging' },
    ]);

    for (const config of [production, staging]) {
      const previews = asObject(config.previews, 'previews');
      expect(config.main).toBe('entry.mjs');
      expect(config.assets).toEqual({
        directory: '../client',
        binding: 'ASSETS',
      });
      expect(config.kv_namespaces).toEqual([]);
      expect(config.images).toBeUndefined();
      expect(previews.kv_namespaces).toBeUndefined();
      expect(previews.images).toBeUndefined();
    }
  }, 30_000);

  it('packages both generated runtime configs in the immutable CI artifact', () => {
    const workflow = readRepoFile('.github/workflows/ci.yml');
    const buildScript = readRepoFile(
      'infra/workflows/build-immutable-artifacts.sh',
    );

    expect(workflow).toMatch(
      /bash infra\/workflows\/build-immutable-artifacts\.sh/u,
    );
    expect(buildScript).toMatch(/unset CLOUDFLARE_ENV/u);
    expect(buildScript).toMatch(
      /CLOUDFLARE_ENV=staging pnpm --filter @wejammin\/web build/u,
    );
    expect(buildScript).toMatch(/wrangler\.production\.json/u);
    expect(buildScript).toMatch(/wrangler\.staging\.json/u);
    expect(workflow).toMatch(/workspace-build-\$\{\{ github\.sha \}\}/u);
  });

  it('promotes the complete staging SSR artifact with fail-closed origins', () => {
    const workflow = readRepoFile('.github/workflows/deploy-staging.yml');
    const verificationScript = readRepoFile(
      'infra/workflows/verify-staging-artifacts.sh',
    );
    const deployStep = webDeployStep(workflow);

    expect(workflow).not.toMatch(/wrangler pages deploy/u);
    expect(workflow).toMatch(
      /bash infra\/workflows\/verify-staging-artifacts\.sh/u,
    );
    expect(verificationScript).toMatch(/DEPLOY_SHA" =~ \^\[0-9a-f\]\{40\}\$/u);
    expect(workflow).toMatch(
      /name: workspace-build-\$\{\{ env\.DEPLOY_SHA \}\}/u,
    );
    expect(verificationScript).toMatch(
      /require_https_origin STAGING_WEB_ORIGIN/u,
    );
    expect(verificationScript).toMatch(
      /require_https_origin STAGING_API_ORIGIN/u,
    );
    expect(verificationScript).toMatch(/\$\{STAGING_WEB_ORIGIN#https:\/\/\}/u);
    expect(verificationScript).toMatch(
      /test -f \.artifacts\/apps\/web\/dist\/server\/entry\.mjs/u,
    );
    expect(verificationScript).toMatch(
      /test -f \.artifacts\/apps\/web\/dist\/server\/wrangler\.staging\.json/u,
    );
    expect(verificationScript).toMatch(
      /test -d \.artifacts\/apps\/web\/dist\/client/u,
    );
    expect(verificationScript).toMatch(
      /test -f \.artifacts\/apps\/worker\/dist\/index\.js/u,
    );
    expect(workflow).toMatch(/\.artifacts\/apps\/worker\/dist\/index\.js/u);
    expect(deployStep).toMatch(/wrangler deploy/u);
    expect(deployStep).toMatch(
      /\.artifacts\/apps\/web\/dist\/server\/wrangler\.staging\.json/u,
    );
    expect(deployStep).toMatch(/--domain "\$WEB_CUSTOM_DOMAIN"/u);
    expect(deployStep).not.toMatch(/--env|API_ORIGIN|PUBLIC_API|--var/u);
    expect(
      workflow.indexOf('- name: Deploy API Worker staging artifact'),
    ).toBeGreaterThan(-1);
    expect(
      workflow.indexOf('- name: Deploy API Worker staging artifact'),
    ).toBeLessThan(
      workflow.indexOf('- name: Deploy web SSR Worker staging artifact'),
    );
  });

  it('promotes the complete production SSR artifact with fail-closed origin', () => {
    const workflow = readRepoFile('.github/workflows/deploy-production.yml');
    const verificationScript = readRepoFile(
      'infra/workflows/verify-production-candidate.sh',
    );
    const deployStep = webDeployStep(workflow);

    expect(workflow).toMatch(/url: \$\{\{ vars\.PRODUCTION_WEB_ORIGIN \}\}/u);
    expect(workflow).toMatch(
      /PRODUCTION_WEB_ORIGIN: \$\{\{ vars\.PRODUCTION_WEB_ORIGIN \}\}/u,
    );
    expect(workflow).toMatch(
      /bash infra\/workflows\/verify-production-candidate\.sh/u,
    );
    expect(verificationScript).toMatch(
      /require_https_origin PRODUCTION_WEB_ORIGIN/u,
    );
    expect(verificationScript).toMatch(
      /\$\{PRODUCTION_WEB_ORIGIN#https:\/\/\}/u,
    );
    expect(verificationScript).toMatch(
      /test -f \.promotion\/artifacts\/apps\/web\/dist\/server\/entry\.mjs/u,
    );
    expect(verificationScript).toMatch(
      /test -f \.promotion\/artifacts\/apps\/web\/dist\/server\/wrangler\.production\.json/u,
    );
    expect(verificationScript).toMatch(
      /test -d \.promotion\/artifacts\/apps\/web\/dist\/client/u,
    );
    expect(verificationScript).toMatch(
      /test -f \.promotion\/artifacts\/apps\/worker\/dist\/index\.js/u,
    );
    expect(workflow).toMatch(
      /\.promotion\/artifacts\/apps\/worker\/dist\/index\.js/u,
    );
    expect(deployStep).toMatch(/wrangler deploy/u);
    expect(deployStep).toMatch(
      /\.promotion\/artifacts\/apps\/web\/dist\/server\/wrangler\.production\.json/u,
    );
    expect(deployStep).toMatch(/--domain "\$WEB_CUSTOM_DOMAIN"/u);
    expect(deployStep).not.toMatch(
      /--env staging|API_ORIGIN|PUBLIC_API|--var/u,
    );
    expect(
      workflow.indexOf('- name: Deploy API Worker production artifact'),
    ).toBeGreaterThan(-1);
    expect(
      workflow.indexOf('- name: Deploy API Worker production artifact'),
    ).toBeLessThan(
      workflow.indexOf('- name: Deploy web SSR Worker production artifact'),
    );
  });

  it('documents the Worker-only cost and browser boundary', () => {
    const readme = readRepoFile('apps/web/README.md');

    expect(readme).toMatch(/Cloudflare Worker SSR/u);
    expect(readme).toMatch(/dist\/server\/entry\.mjs/u);
    expect(readme).toMatch(/dist\/server\/wrangler\.json/u);
    expect(readme).toMatch(/dist\/client/u);
    expect(readme).toMatch(/PLATFORM_API/u);
    expect(readme).toMatch(/never exposed to browser code/u);
    expect(readme).toMatch(/does not provision KV or\s+Cloudflare Images/u);
    expect(readme).toMatch(/existing Workers Paid\s+authorization/u);
  });
});
