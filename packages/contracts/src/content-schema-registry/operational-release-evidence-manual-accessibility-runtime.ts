import { z } from 'zod';

export const ManualAccessibilityUtcTimestampSchema = z.iso.datetime({
  precision: 3,
});

const ManualAccessibilityMacOsVersionSchema = z
  .string()
  .regex(/^macos-(?:10|[1-9]\d)(?:\.\d{1,2}){0,2}$/u);

const ManualAccessibilityWindowsVersionSchema = z
  .string()
  .regex(/^windows-(?:10|11)(?:\.\d{2}h[12])?$/u);

const ManualAccessibilitySafariVersionSchema = z
  .string()
  .regex(/^safari-\d{1,3}(?:\.\d{1,3}){0,2}$/u);

const ManualAccessibilityFirefoxVersionSchema = z
  .string()
  .regex(/^firefox-\d{1,3}(?:\.\d{1,3})?$/u);

const ManualAccessibilityVoiceOverVersionSchema = z
  .string()
  .regex(/^voiceover-\d{1,3}(?:\.\d{1,3}){0,2}$/u);

const ManualAccessibilityNvdaVersionSchema = z
  .string()
  .regex(/^nvda-\d{4}\.\d{1,2}(?:\.\d{1,2})?$/u);

export const manualAccessibilityPlatformVersionsMatch = (
  platform: 'mac_safari_voiceover' | 'windows_firefox_nvda',
  osVersion: string,
  browserVersion: string,
  screenReaderVersion: string,
): boolean =>
  platform === 'mac_safari_voiceover'
    ? ManualAccessibilityMacOsVersionSchema.safeParse(osVersion).success &&
      ManualAccessibilitySafariVersionSchema.safeParse(browserVersion)
        .success &&
      ManualAccessibilityVoiceOverVersionSchema.safeParse(screenReaderVersion)
        .success
    : ManualAccessibilityWindowsVersionSchema.safeParse(osVersion).success &&
      ManualAccessibilityFirefoxVersionSchema.safeParse(browserVersion)
        .success &&
      ManualAccessibilityNvdaVersionSchema.safeParse(screenReaderVersion)
        .success;
