import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  cleanupAc209QueueMarker,
  type Ac209QueueCleanupInput,
  type Ac209QueueExerciseReport,
} from './ac209-queue-exercise.ts';

const CLOUDFLARE_ID = /^[0-9a-f]{32}$/u;
const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type Cleanup = (
  input: Ac209QueueCleanupInput,
) => Promise<Ac209QueueExerciseReport['cleanup']>;

export type CleanupProductionAc209Input = Readonly<{
  accountId: string;
  providerToken: string;
  expectedSourceQueueId: string;
  expectedDeadLetterQueueId: string;
  marker: string;
  execution: Readonly<{ environment: string; ref: string }>;
}>;

const fail = (): never => {
  throw new Error('AC209 production cleanup failed');
};

const assertInput = (input: CleanupProductionAc209Input): void => {
  if (
    !CLOUDFLARE_ID.test(input.accountId) ||
    !CLOUDFLARE_ID.test(input.expectedSourceQueueId) ||
    !CLOUDFLARE_ID.test(input.expectedDeadLetterQueueId) ||
    input.expectedSourceQueueId === input.expectedDeadLetterQueueId ||
    !UUID_V4.test(input.marker) ||
    typeof input.providerToken !== 'string' ||
    input.providerToken.length === 0 ||
    /\s/u.test(input.providerToken) ||
    input.execution.environment !== 'production' ||
    input.execution.ref !== 'refs/heads/main'
  )
    fail();
};

export const cleanupProductionAc209 = async (
  input: CleanupProductionAc209Input,
  cleanup: Cleanup = cleanupAc209QueueMarker,
): Promise<Ac209QueueExerciseReport['cleanup']> => {
  try {
    assertInput(input);
    return await cleanup({
      accountId: input.accountId,
      providerToken: input.providerToken,
      sourceQueueName: 'platform-jobs',
      deadLetterQueueName: 'platform-jobs-dlq',
      expectedSourceQueueId: input.expectedSourceQueueId,
      expectedDeadLetterQueueId: input.expectedDeadLetterQueueId,
      marker: input.marker,
    });
  } catch {
    fail();
  }
};

const run = async (): Promise<void> => {
  const report = await cleanupProductionAc209({
    accountId: process.env['CLOUDFLARE_ACCOUNT_ID'] ?? '',
    providerToken: process.env['CLOUDFLARE_QUEUE_EXERCISE_TOKEN'] ?? '',
    expectedSourceQueueId: process.env['CLOUDFLARE_PLATFORM_QUEUE_ID'] ?? '',
    expectedDeadLetterQueueId: process.env['EXPECTED_DLQ_ID'] ?? '',
    marker: process.env['AC209_EXERCISE_MARKER'] ?? '',
    execution: {
      environment: process.env['GITHUB_ENVIRONMENT'] ?? '',
      ref: process.env['GITHUB_REF'] ?? '',
    },
  });
  console.log(
    `AC209 queue marker cleanup verified (purged=${report.purgedRefCount}; source_messages=${report.sourceMessages}; dlq_messages=${report.deadLetterMessages}).`,
  );
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch(() => {
    console.error('::error::AC209 production cleanup failed');
    process.exitCode = 1;
  });
}
