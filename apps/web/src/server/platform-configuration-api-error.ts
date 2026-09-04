import { ApiErrorSchema } from '@wejammin/contracts';

/** Validate an upstream envelope without trusting its shape or unknown keys. */
export const parsePlatformConfigurationApiError = (
  value: unknown,
): ReturnType<typeof ApiErrorSchema.parse> | null => {
  const parsed = ApiErrorSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};
