const sourceRevisionPattern = /^[0-9a-f]{40}$/u;

export function resolveExpectedSourceRevision({
  deploySha,
  configuredRelease,
}) {
  if (typeof deploySha !== 'string' || !sourceRevisionPattern.test(deploySha)) {
    throw new Error('DEPLOY_SHA must be a lowercase 40-character SHA');
  }
  if (configuredRelease !== undefined && configuredRelease !== deploySha) {
    throw new Error('STAGING_EXPECTED_RELEASE must match DEPLOY_SHA');
  }
  return deploySha;
}
