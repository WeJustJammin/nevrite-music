import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

import { createAc265HostedPlaywrightConfig } from './tests/e2e/support/ac265-hosted-config';
import { validateAc265HostedPrerequisites } from './tests/e2e/support/ac265-hosted-prerequisites';

const repositoryRoot = fileURLToPath(new URL('.', import.meta.url));
const { webOrigin } = validateAc265HostedPrerequisites(
  process.env,
  repositoryRoot,
);

export default defineConfig(createAc265HostedPlaywrightConfig(webOrigin));
