import { z } from '../../packages/contracts/node_modules/zod/index.js';
import {
  SafeReleaseIdSchema,
  SafeReleaseTimestampSchema,
} from '../../packages/contracts/src/release-recovery-common.ts';
import {
  AC209_EXERCISE_STAGE_CODES,
  AC209_EXERCISE_STAGES,
  parseAc209StageDiagnostic,
} from './ac209-exercise-stage-diagnostic.ts';
import {
  AC209_QUEUE_DIAGNOSTIC_BOUNDARIES,
  AC209_QUEUE_DIAGNOSTIC_CODES,
} from './ac209-queue-contracts.ts';

const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;

/**
 * `not_required`: the exercise never recorded `cleanup_required`, so no queue
 * mutation started. `unverified`: cleanup was required but this process holds
 * no proof that it completed, so a reviewer must treat the marker as possibly
 * resident.
 *
 * There is deliberately no `verified` value. Proof of marker absence comes from
 * the separate `always()` cleanup step, which runs after this process exits and
 * writes no file, so a receipt produced here can never honestly claim it. A
 * value that no producer can emit would invite exactly that misreading.
 */
const CLEANUP_STATES = ['not_required', 'unverified'] as const;

/**
 * The stage and code allowlists are compiled from the same closed table the
 * producer validates against, so a receipt can never encode vocabulary the code
 * cannot emit. `z.enum` needs a non-empty tuple; the table is non-empty by
 * construction, and the stage/code pairing is enforced by the refinement below.
 */
const ALL_STAGE_CODES = [
  ...new Set([
    ...Object.values(AC209_EXERCISE_STAGE_CODES).flat(),
    ...AC209_QUEUE_DIAGNOSTIC_CODES,
  ]),
] as unknown as readonly [string, ...string[]];

const asEnum = (values: readonly string[]): [string, ...string[]] =>
  values as unknown as [string, ...string[]];

export const Ac209ProductionExerciseFailureReceiptSchema = z
  .object({
    schemaVersion: z.literal('ac209-production-exercise-failure-v1'),
    status: z.literal('unsuccessful'),
    outcome: z.literal('no_acceptance'),
    environment: z.literal('production'),
    sourceRevision: z.string().regex(SOURCE_REVISION).nullable(),
    productionVersionId: SafeReleaseIdSchema.nullable(),
    stage: z.enum(asEnum(AC209_EXERCISE_STAGES)),
    code: z.enum(ALL_STAGE_CODES),
    boundary: z.enum(asEnum(AC209_QUEUE_DIAGNOSTIC_BOUNDARIES)).nullable(),
    providerStatus: z.number().int().min(100).max(599).nullable(),
    cleanupRequired: z.boolean(),
    cleanup: z.enum(CLEANUP_STATES),
    recipientDigest: z.string().regex(SHA256).nullable(),
    capturedAt: SafeReleaseTimestampSchema,
  })
  .strict()
  .superRefine((receipt, context) => {
    const reject = (message: string, path: string): void => {
      context.addIssue({ code: 'custom', path: [path], message });
    };
    // A known boundary with no HTTP status is the normal shape for a transport
    // timeout, an unreadable response body, or a rejected purge: the provider
    // never returned a status we could read. The reverse -- a status with no
    // boundary -- has no producer and is rejected.
    if (receipt.providerStatus !== null && receipt.boundary === null)
      reject('A provider status requires a queue boundary.', 'providerStatus');
    if (!receipt.cleanupRequired && receipt.cleanup !== 'not_required')
      reject(
        'Cleanup cannot be reported when it was never required.',
        'cleanup',
      );
    if (receipt.cleanupRequired && receipt.cleanup === 'not_required')
      reject('Required cleanup cannot be reported as not required.', 'cleanup');
    const pairing = parseAc209StageDiagnostic({
      stage: receipt.stage,
      code: receipt.code,
      ...(receipt.boundary === null
        ? {}
        : { boundary: receipt.boundary, status: receipt.providerStatus }),
    });
    if (
      pairing === undefined ||
      'boundary' in pairing !== (receipt.boundary !== null)
    )
      reject(
        'Stage, code, and boundary are not an allowlisted pairing.',
        'code',
      );
  });

export type Ac209ProductionExerciseFailureReceipt = z.infer<
  typeof Ac209ProductionExerciseFailureReceiptSchema
>;

export const AC209_FAILURE_CLEANUP_STATES = CLEANUP_STATES;
