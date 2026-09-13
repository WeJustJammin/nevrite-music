type EvidenceResult = { readonly executionEvidence?: unknown };
type EvidenceCleanup = {
  readonly logoutPolicy?: unknown;
  readonly sessionTeardowns?: unknown;
};

export const hasCompleteHostedExecutionEvidence = (input: {
  readonly roles: readonly EvidenceResult[];
  readonly scenarios: readonly EvidenceResult[];
  readonly cleanup: EvidenceCleanup;
}): boolean => {
  return (
    input.roles.length > 0 &&
    input.roles.every((result) => result.executionEvidence !== undefined) &&
    input.scenarios.length > 0 &&
    input.scenarios.every((result) => result.executionEvidence !== undefined) &&
    input.cleanup.logoutPolicy === 'current_session_only' &&
    input.cleanup.sessionTeardowns !== undefined
  );
};
