import { z } from '../../packages/contracts/node_modules/zod/index.js';
import { supabaseRpcHeaders } from '../../apps/worker/src/supabase-rpc-headers.ts';
import { readBoundedProviderResponseText } from './bounded-provider-response.ts';

const SOURCE_REVISION = /^[0-9a-f]{40}$/u;
const PROVIDER_MESSAGE_ID = /^[\x21-\x7e]{1,512}$/u;
const MAX_RESPONSE_BYTES = 32 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;

export const Ac209ExerciseEligibilitySchema = z.discriminatedUnion('eligible', [
  z
    .object({
      schemaVersion: z.literal('ac209-exercise-eligibility-v1'),
      eligible: z.literal(true),
      checkedAt: z.iso.datetime({ offset: true }),
    })
    .strict(),
  z
    .object({
      schemaVersion: z.literal('ac209-exercise-eligibility-v1'),
      eligible: z.literal(false),
      checkedAt: z.iso.datetime({ offset: true }),
      blockedUntil: z.iso.datetime({ offset: true }),
    })
    .strict(),
]);

export const Ac209DeliveryVerificationSchema = z
  .object({
    schemaVersion: z.literal('ac209-delivery-verification-v1'),
    verified: z.literal(true),
    alertCode: z.literal('dlq_nonempty'),
    release: z.string().regex(SOURCE_REVISION),
    state: z.literal('delivered'),
    claimedAt: z.iso.datetime({ offset: true }),
    deliveredAt: z.iso.datetime({ offset: true }),
    providerMessageIdMatched: z.literal(true),
  })
  .strict();

export type Ac209ExerciseEligibility = z.infer<
  typeof Ac209ExerciseEligibilitySchema
>;
export type Ac209DeliveryVerification = z.infer<
  typeof Ac209DeliveryVerificationSchema
>;

type CommonInput = {
  supabaseUrl: string;
  serviceKey: string;
  fetchImpl?: typeof fetch;
};

type EligibilityInput = CommonInput & { checkedAt: string };
type DeliveryInput = CommonInput & {
  notBefore: string;
  providerMessageId: string;
  sourceRevision: string;
};

const fail = (): never => {
  throw new Error('AC209 delivery verification failed');
};

const validateCommon = (input: CommonInput): URL => {
  if (input.serviceKey.length === 0) fail();
  let origin: URL;
  try {
    origin = new URL(input.supabaseUrl);
  } catch {
    fail();
  }
  if (
    origin.protocol !== 'https:' ||
    !origin.hostname.endsWith('.supabase.co') ||
    origin.pathname !== '/' ||
    origin.search !== '' ||
    origin.hash !== ''
  )
    fail();
  return origin;
};

const invoke = async (
  input: CommonInput,
  rpc: string,
  request: Readonly<Record<string, unknown>>,
): Promise<unknown> => {
  const origin = validateCommon(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await (input.fetchImpl ?? fetch)(
        new URL(`/rest/v1/rpc/${rpc}`, origin).toString(),
        {
          method: 'POST',
          headers: {
            'Accept-Profile': 'platform_api',
            'Content-Profile': 'platform_api',
            ...supabaseRpcHeaders(input.serviceKey),
            'content-type': 'application/json',
          },
          body: JSON.stringify({ p_request: request }),
          signal: controller.signal,
        },
      );
    } catch {
      fail();
    }
    if (!response.ok) fail();
    let body: string;
    try {
      body = await readBoundedProviderResponseText(response, {
        maxBytes: MAX_RESPONSE_BYTES,
        onTimeout: () => controller.abort(),
        signal: controller.signal,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
    } catch {
      fail();
    }
    try {
      return JSON.parse(body) as unknown;
    } catch {
      fail();
    }
  } finally {
    clearTimeout(timeout);
  }
};

export const readAc209ExerciseEligibility = async (
  input: EligibilityInput,
): Promise<Ac209ExerciseEligibility> => {
  const checkedAt = z.iso.datetime({ offset: true }).safeParse(input.checkedAt);
  if (!checkedAt.success) fail();
  const value = await invoke(
    input,
    'cms_get_operational_alert_exercise_eligibility',
    { alertCode: 'dlq_nonempty', checkedAt: checkedAt.data },
  );
  const parsed = Ac209ExerciseEligibilitySchema.safeParse(value);
  if (
    !parsed.success ||
    Date.parse(parsed.data.checkedAt) !== Date.parse(checkedAt.data)
  )
    fail();
  if (
    parsed.data.eligible === false &&
    Date.parse(parsed.data.blockedUntil) <= Date.parse(parsed.data.checkedAt)
  )
    fail();
  return parsed.data;
};

export const verifyAc209AlertDelivery = async (
  input: DeliveryInput,
): Promise<Ac209DeliveryVerification> => {
  const notBefore = z.iso.datetime({ offset: true }).safeParse(input.notBefore);
  if (
    !notBefore.success ||
    !SOURCE_REVISION.test(input.sourceRevision) ||
    !PROVIDER_MESSAGE_ID.test(input.providerMessageId)
  )
    fail();
  const value = await invoke(input, 'cms_verify_operational_alert_delivery', {
    alertCode: 'dlq_nonempty',
    notBefore: notBefore.data,
    release: input.sourceRevision,
    providerMessageId: input.providerMessageId,
  });
  const parsed = Ac209DeliveryVerificationSchema.safeParse(value);
  if (!parsed.success || parsed.data.release !== input.sourceRevision) fail();
  const notBeforeMs = Date.parse(notBefore.data);
  if (
    Date.parse(parsed.data.claimedAt) < notBeforeMs ||
    Date.parse(parsed.data.deliveredAt) < notBeforeMs ||
    Date.parse(parsed.data.claimedAt) > Date.parse(parsed.data.deliveredAt)
  )
    fail();
  return parsed.data;
};
