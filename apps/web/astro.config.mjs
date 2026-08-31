// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

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
    imageService: 'passthrough',
  }),
});
