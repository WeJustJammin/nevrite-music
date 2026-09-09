import { chromium, type Browser } from '@playwright/test';
import { existsSync } from 'node:fs';

export type AutomatedAxeBrowser = Readonly<{
  name: 'chromium';
  version: string;
}>;

export const assertPlaywrightChromiumExecutable = (
  executablePath: string,
): string => {
  if (!existsSync(executablePath))
    throw new Error('Pinned Playwright Chromium executable is unavailable.');
  return executablePath;
};

export const playwrightChromiumExecutablePath = (): string =>
  assertPlaywrightChromiumExecutable(chromium.executablePath());

export const launchPinnedPlaywrightChromium = async (): Promise<{
  browser: Browser;
  metadata: AutomatedAxeBrowser;
}> => {
  const executablePath = playwrightChromiumExecutablePath();
  const browser = await chromium.launch({ headless: true, executablePath });
  return {
    browser,
    metadata: { name: 'chromium', version: browser.version() },
  };
};
