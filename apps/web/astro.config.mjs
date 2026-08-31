// @ts-check
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

// https://astro.build/config
export default defineConfig({
  output: 'server',
  session: false,
  integrations: [react()],
  vite: {
    optimizeDeps: {
      include: ['astro/assets/services/noop'],
    },
  },
  adapter: cloudflare({
    ...ciCloudflareDevIsolation,
    imageService: 'passthrough',
  }),
});
