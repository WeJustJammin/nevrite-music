export interface FormErrorInput {
  readonly code: string;
  readonly message: string;
  readonly requestId: string;
  readonly details: unknown;
  readonly cause?: unknown;
}

const safeDetails = (
  value: unknown,
): Readonly<Record<string, unknown>> | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return null;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'cause' || key === 'stack') continue;
    if (
      entry === null ||
      typeof entry === 'string' ||
      typeof entry === 'number' ||
      typeof entry === 'boolean' ||
      Array.isArray(entry)
    ) {
      output[key] = entry;
    }
  }
  return output;
};

export function serializeFormError(input: FormErrorInput) {
  return {
    code: input.code,
    message: input.message,
    requestId: input.requestId,
    details: safeDetails(input.details),
  };
}
