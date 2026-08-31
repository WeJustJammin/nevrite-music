import { z } from 'zod';

const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

export const SafeReleaseIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(SAFE_ID_PATTERN);

export const SafeReleaseTimestampSchema = z.iso.datetime({ offset: true });
