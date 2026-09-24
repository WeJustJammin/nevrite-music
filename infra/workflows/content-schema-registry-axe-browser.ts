import { chromium, type Browser } from '@playwright/test';
import { accessSync, constants } from 'node:fs';

export type AutomatedAxeBrowser = Readonly<{
  name: 'chromium';
  version: string;
}>;

// Playwright's `channel: 'chrome'` hard-resolves the installer-provided
// binary at launch time and never falls back to the bundled Chromium download,
// so the availability check targets that exact executable. On Linux the launch
// target is `/opt/google/chrome/chrome`; a `/usr/bin` distribution wrapper is a
// different file and does not prove the channel can launch. The preflight in
// `verify-system-chrome.sh` pins the same per-platform path.
const PLAYWRIGHT_CHROME_CHANNEL_EXECUTABLE = '/opt/google/chrome/chrome';

export const googleChromeExecutablePath = (): string => {
  try {
    accessSync(PLAYWRIGHT_CHROME_CHANNEL_EXECUTABLE, constants.X_OK);
  } catch {
    throw new Error(
      'System Google Chrome is unavailable; install the official Google Chrome package on the runner. Bundled Chromium is not a supported fallback.',
    );
  }
  return PLAYWRIGHT_CHROME_CHANNEL_EXECUTABLE;
};

export const launchSystemGoogleChrome = async (): Promise<{
  browser: Browser;
  metadata: AutomatedAxeBrowser;
}> => {
  googleChromeExecutablePath();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  return {
    browser,
    metadata: { name: 'chromium', version: browser.version() },
  };
};
