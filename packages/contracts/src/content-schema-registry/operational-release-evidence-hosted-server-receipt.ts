import { z } from 'zod';

import { ReleaseEvidenceDigestSchema } from './operational-release-evidence-common.ts';

const HOSTED_RECEIPT_UUID =
  '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

export const ContentSchemaRegistryHostedServerReceiptSchema = z
  .object({
    ref: z
      .string()
      .regex(
        new RegExp(`^ac265-receipt://server/${HOSTED_RECEIPT_UUID}$`, 'u'),
      ),
    sha256: ReleaseEvidenceDigestSchema,
  })
  .strict()
  .readonly();
