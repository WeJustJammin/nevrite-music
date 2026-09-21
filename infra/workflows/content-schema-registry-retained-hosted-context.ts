import {
  parseHostedE2eVerificationContext,
  type ParsedContentSchemaRegistryHostedE2eReportV3VerificationContext,
} from './content-schema-registry-hosted-e2e-verification-context.ts';

export type RetainedHostedE2eVerificationInput = Readonly<{
  runnerContractBytes: Uint8Array;
  verificationContext: ParsedContentSchemaRegistryHostedE2eReportV3VerificationContext;
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseHostedV3Verification = (
  value: unknown,
): RetainedHostedE2eVerificationInput => {
  if (!isRecord(value))
    throw new Error(
      'Protected AC265 hosted E2E V3 verification context is required.',
    );
  const runnerContractBytes = value['runnerContractBytes'];
  const verificationContext = value['verificationContext'];
  if (
    !(runnerContractBytes instanceof Uint8Array) ||
    runnerContractBytes.byteLength === 0 ||
    !isRecord(verificationContext)
  )
    throw new Error(
      'Protected AC265 hosted E2E V3 verification context is required.',
    );
  const parsedContext = parseHostedE2eVerificationContext(verificationContext);
  return Object.freeze({
    runnerContractBytes: new Uint8Array(runnerContractBytes),
    verificationContext: parsedContext,
  });
};
