import { supabaseRpcHeaders } from '../supabase-rpc-headers';
import { buildContentSchemaRegistryOperationalSnapshot } from './operational-alert-metrics';
import type {
  OperationalAlertDependencies,
  OperationalAlertRunInput,
} from './operational-alert-runtime';

type EmailBinding = Readonly<{
  send: (message: Readonly<Record<string, unknown>>) => Promise<unknown>;
}>;

export type OperationalAlertProductionBindings = Readonly<{
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_OBSERVABILITY_API_TOKEN: string;
  CLOUDFLARE_PLATFORM_DLQ_ID: string;
  PLATFORM_ALERT_EMAIL: EmailBinding;
  SUPABASE_SECRET_KEY: string;
  SUPABASE_URL: string;
}>;

type ProductionOptions = Readonly<{
  randomUuid?: () => string;
}>;

const ALERT_FROM = 'platform.on-call@alerts.wejamm.in' as const;
const ALERT_TO = 'admin.wejammin@gmail.com' as const;
const MAX_PROVIDER_BYTES = 2_000_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const boundedJson = async (response: Response): Promise<unknown> => {
  if (!response.ok)
    throw new Error(
      `Operational provider request failed (HTTP ${response.status})`,
    );
  const declared = response.headers.get('content-length');
  if (declared !== null && Number(declared) > MAX_PROVIDER_BYTES)
    throw new Error('Operational provider response too large');
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_PROVIDER_BYTES)
    throw new Error('Operational provider response too large');
  return JSON.parse(text) as unknown;
};

const postJson = async (
  fetchImpl: typeof fetch,
  url: string,
  headers: Readonly<Record<string, string>>,
  body: unknown,
): Promise<unknown> =>
  boundedJson(
    await fetchImpl(url, {
      body: JSON.stringify(body),
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        ...headers,
      },
      method: 'POST',
    }),
  );

const supabaseRpc = (
  bindings: OperationalAlertProductionBindings,
  fetchImpl: typeof fetch,
  operation: string,
  request: unknown,
): Promise<unknown> =>
  postJson(
    fetchImpl,
    `${bindings.SUPABASE_URL}/rest/v1/rpc/${operation}`,
    {
      'Accept-Profile': 'platform_api',
      'Content-Profile': 'platform_api',
      ...supabaseRpcHeaders(bindings.SUPABASE_SECRET_KEY),
    },
    { p_request: request },
  );

const cloudflareEvents = async (
  bindings: OperationalAlertProductionBindings,
  fetchImpl: typeof fetch,
  input: OperationalAlertRunInput,
): Promise<readonly Readonly<{ source?: unknown }>[]> => {
  const to = Date.parse(input.scheduledAt);
  const payload = await postJson(
    fetchImpl,
    `https://api.cloudflare.com/client/v4/accounts/${bindings.CLOUDFLARE_ACCOUNT_ID}/workers/observability/telemetry/query`,
    { Authorization: `Bearer ${bindings.CLOUDFLARE_OBSERVABILITY_API_TOKEN}` },
    {
      parameters: {
        datasets: ['cloudflare-workers'],
        limit: 2_000,
        needle: { isRegex: false, value: 'cms.registry.' },
        view: 'events',
      },
      queryId: `wejammin-cms-alerts-${input.release}`,
      timeframe: { from: to - 86_400_000, to },
    },
  );
  if (
    !isRecord(payload) ||
    (Object.hasOwn(payload, 'success') && payload.success !== true) ||
    !isRecord(payload.result)
  )
    throw new Error('Invalid Workers Logs response');
  const eventsContainer = payload.result.events;
  if (!isRecord(eventsContainer) || !Array.isArray(eventsContainer.events))
    throw new Error('Invalid Workers Logs response');
  return eventsContainer.events.filter(isRecord);
};

const queueBacklog = async (
  bindings: OperationalAlertProductionBindings,
  fetchImpl: typeof fetch,
  input: OperationalAlertRunInput,
): Promise<number | undefined> => {
  const payload = await postJson(
    fetchImpl,
    'https://api.cloudflare.com/client/v4/graphql',
    { Authorization: `Bearer ${bindings.CLOUDFLARE_OBSERVABILITY_API_TOKEN}` },
    {
      query: `query QueueBacklog($accountTag: string!, $queueId: string!, $datetimeStart: Time!, $datetimeEnd: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { queueBacklogAdaptiveGroups(limit: 1, filter: { queueId: $queueId, datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd }, orderBy: [datetime_DESC]) { avg { messages } } } } }`,
      variables: {
        accountTag: bindings.CLOUDFLARE_ACCOUNT_ID,
        datetimeEnd: input.scheduledAt,
        datetimeStart: new Date(
          Date.parse(input.scheduledAt) - 300_000,
        ).toISOString(),
        queueId: bindings.CLOUDFLARE_PLATFORM_DLQ_ID,
      },
    },
  );
  const data = isRecord(payload) ? payload.data : undefined;
  const viewer = isRecord(data) ? data.viewer : undefined;
  const accounts = isRecord(viewer) ? viewer.accounts : undefined;
  const account = Array.isArray(accounts) ? accounts[0] : undefined;
  const groups = isRecord(account)
    ? account.queueBacklogAdaptiveGroups
    : undefined;
  const group = Array.isArray(groups) ? groups[0] : undefined;
  const avg = isRecord(group) ? group.avg : undefined;
  const messages = isRecord(avg) ? avg.messages : undefined;
  return typeof messages === 'number' && Number.isFinite(messages)
    ? Math.max(0, Math.ceil(messages))
    : undefined;
};

const databaseSnapshot = async (
  bindings: OperationalAlertProductionBindings,
  fetchImpl: typeof fetch,
  input: OperationalAlertRunInput,
): Promise<
  Readonly<{ activationBlockedMs?: number; outboxAgeMs?: number }>
> => {
  const value = await supabaseRpc(
    bindings,
    fetchImpl,
    'cms_get_operational_state_snapshot',
    { observedAt: input.scheduledAt },
  );
  if (!isRecord(value)) throw new Error('Invalid operational snapshot');
  return {
    ...(typeof value.activationBlockedMs === 'number'
      ? { activationBlockedMs: value.activationBlockedMs }
      : {}),
    ...(typeof value.outboxAgeMs === 'number'
      ? { outboxAgeMs: value.outboxAgeMs }
      : {}),
  };
};

export const createProductionOperationalAlertDependencies = (
  bindings: OperationalAlertProductionBindings,
  fetchImpl: typeof fetch = globalThis.fetch,
  options: ProductionOptions = {},
): OperationalAlertDependencies => {
  const randomUuid = options.randomUuid ?? crypto.randomUUID.bind(crypto);
  return {
    loadSnapshot: async (input) => {
      const database = await databaseSnapshot(bindings, fetchImpl, input);
      const dlqDepth = await queueBacklog(bindings, fetchImpl, input);
      const events = await cloudflareEvents(bindings, fetchImpl, input);
      return buildContentSchemaRegistryOperationalSnapshot({
        database,
        ...(dlqDepth === undefined ? {} : { dlqDepth }),
        events,
        now: Date.parse(input.scheduledAt),
      });
    },
    claim: async (alert, input) => {
      const claimToken = randomUuid();
      const value = await supabaseRpc(
        bindings,
        fetchImpl,
        'cms_claim_operational_alert',
        {
          alertCode: alert.code,
          claimToken,
          release: input.release,
          scheduledAt: input.scheduledAt,
        },
      );
      if (!isRecord(value) || value.claimed !== true) return { claimed: false };
      if (typeof value.claimId !== 'string')
        throw new Error('Invalid operational alert claim');
      return { claimed: true, claimId: value.claimId, claimToken };
    },
    deliver: async (delivery) => {
      const receiptId = randomUuid();
      await bindings.PLATFORM_ALERT_EMAIL.send({
        from: ALERT_FROM,
        headers: { 'Message-ID': `<${receiptId}@alerts.wejamm.in>` },
        subject: `[WeJammin] ${delivery.alert.code}`,
        text: [
          'route=platform.on_call',
          'runbook=content-schema-registry',
          `alert=${delivery.alert.code}`,
          `observed=${delivery.alert.observed}`,
          `threshold=${delivery.alert.threshold}`,
          `release=${delivery.release}`,
          `scheduled_at=${delivery.scheduledAt}`,
          'redacted=true',
        ].join('\n'),
        to: ALERT_TO,
      });
      return { receiptId };
    },
    complete: async ({
      alert,
      claimId,
      claimToken,
      deliveredAt,
      receiptId,
    }) => {
      const value = await supabaseRpc(
        bindings,
        fetchImpl,
        'cms_complete_operational_alert',
        { alertCode: alert.code, claimId, claimToken, deliveredAt, receiptId },
      );
      if (value !== true)
        throw new Error('Operational alert completion failed');
    },
  };
};
