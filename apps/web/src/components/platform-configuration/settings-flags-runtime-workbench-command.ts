import { sanitizeConfigurationValue } from './platform-configuration-presentation-security';

export const jsonFormValue = (value: FormDataEntryValue | null): unknown => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  try {
    return sanitizeConfigurationValue(JSON.parse(trimmed));
  } catch {
    return trimmed;
  }
};

/**
 * Native `datetime-local` controls deliberately omit a zone. Convert a valid
 * local value to the API instant; preserve malformed input for linked errors.
 */
export const canonicalInstantFormValue = (
  value: FormDataEntryValue | null,
): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
};

const formText = (data: FormData, name: string): string | undefined => {
  const value = data.get(name);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const setWhenPresent = (
  command: Record<string, unknown>,
  data: FormData,
  name: string,
): void => {
  const value = formText(data, name);
  if (value !== undefined) command[name] = value;
};

/** Capture the allowlisted command before an async boundary can rerender form. */
export const formDataToConfigurationCommand = (
  form: HTMLFormElement,
): Readonly<Record<string, unknown>> => {
  const data = new FormData(form);
  const command: Record<string, unknown> = {};

  const actionCommand = data.has('action');
  if (!actionCommand) {
    setWhenPresent(command, data, 'scopeType');
    if (data.has('scopeId')) {
      const scopeId = formText(data, 'scopeId');
      command.scopeId = scopeId ?? null;
    }
    if (data.has('environment')) {
      command.environment = formText(data, 'environment') ?? null;
    }
    if (data.has('typedValue'))
      command.typedValue = jsonFormValue(data.get('typedValue'));
    setWhenPresent(command, data, 'expectedDefinitionVersion');
    if (data.has('effectiveFrom')) {
      command.interval = {
        effectiveFrom:
          canonicalInstantFormValue(data.get('effectiveFrom')) ?? '',
        effectiveTo: canonicalInstantFormValue(data.get('effectiveTo')),
      };
    }
    if (data.has('impactManifest'))
      command.impactManifest = jsonFormValue(data.get('impactManifest')) ?? {};
    if (data.has('rollbackCandidate'))
      command.rollbackCandidate = jsonFormValue(data.get('rollbackCandidate'));
    setWhenPresent(command, data, 'reason');
    const consumerKeys = formText(data, 'consumerKeys');
    if (consumerKeys !== undefined) {
      command.consumerKeys = consumerKeys
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    }
  } else {
    setWhenPresent(command, data, 'action');
    setWhenPresent(command, data, 'expectedReviewVersion');
    setWhenPresent(command, data, 'candidateHash');
    setWhenPresent(command, data, 'approvalReason');
    if (data.has('scheduledFor')) {
      command.scheduledFor = canonicalInstantFormValue(
        data.get('scheduledFor'),
      );
    }
    if (data.has('rollbackValue')) {
      const rollbackValue = jsonFormValue(data.get('rollbackValue'));
      if (
        rollbackValue !== null ||
        formText(data, 'rollbackValue') !== undefined
      ) {
        command.rollbackValue = rollbackValue;
      }
    }
    const stepUpToken = formText(data, 'stepUpToken');
    if (stepUpToken !== undefined) command.stepUpToken = stepUpToken;
    const canaryPercent = formText(data, 'canaryPercent');
    if (canaryPercent !== undefined)
      command.canaryPercent = Number(canaryPercent);
  }
  return command;
};
