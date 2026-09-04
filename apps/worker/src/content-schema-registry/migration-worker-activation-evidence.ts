import {
  failure,
  hasExactKeys,
  isHash,
  isRecord,
  isSafeToken,
  isVersion,
  type RuntimeSchemaResult,
} from './migration-worker-schema-core';

export type SchemaActivationEvidence = Readonly<{
  key: string;
  version: string;
  policyHash: string;
  riskClass: 'ordinary' | 'protected';
  requiredDecisionCount: number;
  requiredCapabilities: readonly string[];
  approvalEvidenceHash: string;
}>;

export const parseSchemaActivationEvidence = (
  value: unknown,
): RuntimeSchemaResult<SchemaActivationEvidence> => {
  if (!isRecord(value))
    return failure([], 'activationEvidence must be an object');
  if (
    !hasExactKeys(value, [
      'key',
      'version',
      'policyHash',
      'riskClass',
      'requiredDecisionCount',
      'requiredCapabilities',
      'approvalEvidenceHash',
    ])
  )
    return failure(
      ['activationEvidence'],
      'activation evidence keys are not allowed',
    );
  if (!isSafeToken(value.key))
    return failure(['activationEvidence', 'key'], 'key is invalid');
  if (!isVersion(value.version))
    return failure(['activationEvidence', 'version'], 'version is invalid');
  if (!isHash(value.policyHash))
    return failure(
      ['activationEvidence', 'policyHash'],
      'policyHash is invalid',
    );
  if (value.riskClass !== 'ordinary' && value.riskClass !== 'protected')
    return failure(['activationEvidence', 'riskClass'], 'riskClass is invalid');
  if (
    typeof value.requiredDecisionCount !== 'number' ||
    !Number.isInteger(value.requiredDecisionCount) ||
    value.requiredDecisionCount < 1 ||
    value.requiredDecisionCount > 8
  )
    return failure(
      ['activationEvidence', 'requiredDecisionCount'],
      'requiredDecisionCount is invalid',
    );
  if (
    !Array.isArray(value.requiredCapabilities) ||
    value.requiredCapabilities.length > 16 ||
    !value.requiredCapabilities.every((capability) => isSafeToken(capability))
  )
    return failure(
      ['activationEvidence', 'requiredCapabilities'],
      'requiredCapabilities is invalid',
    );
  if (
    value.riskClass === 'protected' &&
    (value.requiredDecisionCount < 2 || value.requiredCapabilities.length === 0)
  )
    return failure(
      ['activationEvidence'],
      'protected activation evidence requires dual named approval',
    );
  if (!isHash(value.approvalEvidenceHash))
    return failure(
      ['activationEvidence', 'approvalEvidenceHash'],
      'approvalEvidenceHash is invalid',
    );
  return {
    success: true,
    data: {
      key: value.key,
      version: value.version,
      policyHash: value.policyHash,
      riskClass: value.riskClass,
      requiredDecisionCount: value.requiredDecisionCount,
      requiredCapabilities: [...value.requiredCapabilities],
      approvalEvidenceHash: value.approvalEvidenceHash,
    },
  };
};
