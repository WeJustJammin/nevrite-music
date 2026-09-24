import { chromium, type Browser } from '@playwright/test';
import { accessSync, constants } from 'node:fs';

export type AutomatedAxeBrowser = Readonly<{
  name: 'chromium';
  version: string;
}>;

// Playwright's Chrome channel resolves the installer-provided browser at
// launch time. `chromium.executablePath()` ignores the channel and reports the
// bundled download, so the availability check resolves the canonical system
// candidates itself. `verify-system-chrome.sh` keeps the same list.
const SYSTEM_GOOGLE_CHROME_CANDIDATES = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/opt/google/chrome/chrome',
] as const;

export const googleChromeExecutablePath = (): string => {
  for (const candidate of SYSTEM_GOOGLE_CHROME_CANDIDATES) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      continue;
    }
  }
  throw new Error(
    'System Google Chrome is unavailable; install the official Google Chrome package on the runner. Bundled Chromium is not a supported fallback.',
  );
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
