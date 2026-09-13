import { SafeReleaseTimestampSchema } from '../../packages/contracts/src/release-recovery-common.ts';
import {
  ContentSchemaRegistryHostedRunnerIdentitySchema,
  type ContentSchemaRegistryHostedRunnerContract,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-input.ts';
import {
  parseTrustedHostedRunnerMappings,
  type TrustedHostedRunnerMappings,
} from './content-schema-registry-hosted-e2e-trusted-mappings.ts';
import {
  HostedOutageLeaseScopeSchema,
  type HostedOutageLeaseScope,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-hosted-outage-lease-scope.ts';

type HostedIdentity = ContentSchemaRegistryHostedRunnerContract['identity'];

export type ContentSchemaRegistryHostedE2eReportV3VerificationContext =
  TrustedHostedRunnerMappings & {
    readonly expectedIdentity: HostedIdentity;
    readonly expectedRunId: string;
    readonly expectedRunnerContractSha256: string;
    /** Supplied by trusted release policy; never derived from report or contract data. */
    readonly maxRunDurationMs: number;
    readonly trustedCutoffAt: string;
    readonly expectedOutageLeaseScope?: HostedOutageLeaseScope;
    readonly resolveReceipt: (ref: string) => Uint8Array | undefined;
    readonly resolveEvidence: (ref: string) => Uint8Array | undefined;
    readonly verifyReceiptAuthenticity: (
      ref: string,
      bytes: Uint8Array,
      parsedEnvelope: unknown,
    ) => boolean;
  };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseHostedE2eVerificationContext = (
  context: unknown,
): ContentSchemaRegistryHostedE2eReportV3VerificationContext => {
  if (!isRecord(context))
    throw new Error('Hosted E2E trusted verification context is required.');
  const expectedIdentity =
    ContentSchemaRegistryHostedRunnerIdentitySchema.safeParse(
      context['expectedIdentity'],
    );
  if (!expectedIdentity.success)
    throw new Error('Hosted E2E trusted expected identity is invalid.');
  const trustedCutoffAt = SafeReleaseTimestampSchema.safeParse(
    context['trustedCutoffAt'],
  );
  if (!trustedCutoffAt.success)
    throw new Error(
      'Hosted E2E trusted cutoff timestamp is required and must be valid.',
    );
  const trustedMappings = parseTrustedHostedRunnerMappings(context);
  const outageScope = context['expectedOutageLeaseScope'];
  const parsedOutageScope =
    outageScope === undefined
      ? undefined
      : HostedOutageLeaseScopeSchema.safeParse(outageScope);
  if (parsedOutageScope !== undefined && !parsedOutageScope.success)
    throw new Error('Hosted E2E trusted outage lease scope is invalid.');
  const maxRunDurationMs = context['maxRunDurationMs'];
  if (
    typeof maxRunDurationMs !== 'number' ||
    !Number.isSafeInteger(maxRunDurationMs) ||
    maxRunDurationMs <= 0
  )
    throw new Error(
      'Hosted E2E maximum run duration must be a positive safe integer.',
    );
  if (
    typeof context['expectedRunId'] !== 'string' ||
    typeof context['expectedRunnerContractSha256'] !== 'string' ||
    !/^[0-9a-f]{64}$/u.test(context['expectedRunnerContractSha256']) ||
    typeof context['resolveReceipt'] !== 'function' ||
    typeof context['resolveEvidence'] !== 'function' ||
    typeof context['verifyReceiptAuthenticity'] !== 'function'
  )
    throw new Error('Hosted E2E trusted verification context is incomplete.');
  return {
    expectedIdentity: expectedIdentity.data,
    expectedRunId: context['expectedRunId'],
    expectedRunnerContractSha256: context['expectedRunnerContractSha256'],
    maxRunDurationMs,
    ...trustedMappings,
    trustedCutoffAt: trustedCutoffAt.data,
    ...(parsedOutageScope?.success
      ? { expectedOutageLeaseScope: parsedOutageScope.data }
      : {}),
    resolveReceipt: context['resolveReceipt'] as (
      ref: string,
    ) => Uint8Array | undefined,
    resolveEvidence: context['resolveEvidence'] as (
      ref: string,
    ) => Uint8Array | undefined,
    verifyReceiptAuthenticity: context['verifyReceiptAuthenticity'] as (
      ref: string,
      bytes: Uint8Array,
      parsedEnvelope: unknown,
    ) => boolean,
  };
};
