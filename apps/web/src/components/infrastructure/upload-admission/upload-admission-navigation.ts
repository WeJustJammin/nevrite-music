const TARGET_TYPE_PATTERN = /^[a-z][a-z0-9.]{0,63}$/u;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export interface UploadAdmissionTargetReference {
  readonly targetType: string;
  readonly targetId: string;
}

export interface UploadAdmissionNavigationInput extends UploadAdmissionTargetReference {
  readonly returnTo: string;
}

const validTarget = ({
  targetType,
  targetId,
}: UploadAdmissionTargetReference): boolean =>
  TARGET_TYPE_PATTERN.test(targetType) && UUID_PATTERN.test(targetId);

const hasControlCharacter = (value: string): boolean =>
  [...value].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint < 0x20 || codePoint === 0x7f);
  });

const validReturnTo = (returnTo: string): boolean =>
  returnTo.length <= 2_048 &&
  (returnTo === '/app' || returnTo.startsWith('/app/')) &&
  !returnTo.startsWith('//') &&
  !returnTo.includes('\\') &&
  !hasControlCharacter(returnTo);

export const createUploadAdmissionNavigation = (
  input: UploadAdmissionNavigationInput,
): Readonly<{ href: string; resubmitOnPopstate: false }> => {
  if (!validTarget(input) || !validReturnTo(input.returnTo)) {
    throw new Error('Upload navigation input is invalid.');
  }

  const query = new URLSearchParams({
    uploadTarget: input.targetType,
    returnTo: input.returnTo,
  });
  return Object.freeze({
    href: `/app/infrastructure/${input.targetId}?${query.toString()}`,
    resubmitOnPopstate: false,
  });
};

export const reconcileUploadAdmissionInvalidation = (
  current: UploadAdmissionTargetReference,
  invalidated: UploadAdmissionTargetReference,
): Readonly<{ preserveLocalDraft: true; refetchCanonical: boolean }> => {
  if (!validTarget(current) || !validTarget(invalidated)) {
    throw new Error('Upload invalidation target is invalid.');
  }

  return Object.freeze({
    preserveLocalDraft: true,
    refetchCanonical:
      current.targetType === invalidated.targetType &&
      current.targetId === invalidated.targetId,
  });
};
