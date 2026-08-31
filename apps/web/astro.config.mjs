// @ts-check
// @ts-expect-error Astro config runs in Node; the web package intentionally has no Node runtime types.
import { copyFile, readFile, writeFile } from 'node:fs/promises';

import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

const runtimeProcess = /** @type {unknown} */ (
  Reflect.get(globalThis, 'process')
);
const ciRunId =
  typeof runtimeProcess === 'object' &&
  runtimeProcess !== null &&
  'env' in runtimeProcess &&
  typeof runtimeProcess.env === 'object' &&
  runtimeProcess.env !== null &&
  'GITHUB_RUN_ID' in runtimeProcess.env &&
  typeof runtimeProcess.env.GITHUB_RUN_ID === 'string'
    ? runtimeProcess.env.GITHUB_RUN_ID
    : undefined;
/** @type {import('@astrojs/cloudflare').Options} */
const ciCloudflareDevIsolation =
  ciRunId === undefined ? {} : { inspectorPort: false, persistState: false };
const runtimeArgv =
  typeof runtimeProcess === 'object' &&
  runtimeProcess !== null &&
  'argv' in runtimeProcess &&
  Array.isArray(runtimeProcess.argv)
    ? runtimeProcess.argv
    : [];
const isAstroDevCommand = runtimeArgv.includes('dev');

/**
 * Astro's Cloudflare entry checks static and fallback assets before invoking
 * Astro middleware. Append one outer fetch boundary after the adapter emits
 * its entry so every response, including ASSETS.fetch responses, receives
 * HTTPS enforcement and the locked security headers.
 */
const edgeSecurityIntegration = () => ({
  name: 'wejammin-edge-security',
  hooks: {
    'astro:build:done': async (
      /** @type {{ dir: URL }} */
      { dir },
    ) => {
      const entryUrl = new URL('../server/entry.mjs', dir);
      const runtimeSourceUrl = new URL(
        './edge-security-runtime.mjs',
        import.meta.url,
      );
      const runtimeTargetUrl = new URL(
        '../server/edge-security-runtime.mjs',
        dir,
      );

      await copyFile(runtimeSourceUrl, runtimeTargetUrl);
      await copyFile(
        new URL('./edge-security-html.mjs', import.meta.url),
        new URL('../server/edge-security-html.mjs', dir),
      );
      const entry = await readFile(entryUrl, 'utf8');
      const entryMarker = 'export { worker_entry_default as default };';
      if (!entry.includes(entryMarker)) {
        throw new Error(
          'Astro Cloudflare entry shape changed; edge security wrapper was not installed',
        );
      }

      const wrapperMarker = '/* @wejammin-edge-security */';
      if (entry.includes(wrapperMarker)) return;

      const wrapper = `
import { createEdgeFetchHandler as __wejamminCreateEdgeFetchHandler } from './edge-security-runtime.mjs';
${wrapperMarker}
worker_entry_default.fetch = __wejamminCreateEdgeFetchHandler(worker_entry_default.fetch);
`;
      await writeFile(entryUrl, `${entry}\n${wrapper}`, 'utf8');
    },
  },
});

// https://astro.build/config
export default defineConfig({
  output: 'server',
  session: false,
  integrations: [react(), edgeSecurityIntegration()],
  vite: {
    optimizeDeps: {
      include: ['astro/assets/services/noop'],
    },
  },
  adapter: cloudflare({
    ...ciCloudflareDevIsolation,
    ...(isAstroDevCommand ? { configPath: './wrangler.dev.jsonc' } : {}),
    imageService: 'passthrough',
  }),
});
