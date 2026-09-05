import {
  evaluateContentSchemaRegistryAlerts,
  type ContentSchemaRegistryAlert,
  type ContentSchemaRegistryOperationalSnapshot,
} from '@wejammin/observability/content-schema-registry-alerts';

export type OperationalAlertRunInput = Readonly<{
  environment: 'production';
  release: string;
  scheduledAt: string;
}>;

export type OperationalAlertClaim =
  | Readonly<{ claimed: false }>
  | Readonly<{
      claimed: true;
      claimId: string;
      claimToken: string;
    }>;

export type OperationalAlertDelivery = Readonly<{
  alert: ContentSchemaRegistryAlert;
  claimId: string;
  environment: 'production';
  redacted: true;
  release: string;
  scheduledAt: string;
}>;

export type OperationalAlertDependencies = Readonly<{
  loadSnapshot: (
    input: OperationalAlertRunInput,
  ) => Promise<ContentSchemaRegistryOperationalSnapshot>;
  claim: (
    alert: ContentSchemaRegistryAlert,
    input: OperationalAlertRunInput,
  ) => Promise<OperationalAlertClaim>;
  deliver: (
    delivery: OperationalAlertDelivery,
  ) => Promise<Readonly<{ receiptId: string }>>;
  complete: (input: {
    alert: ContentSchemaRegistryAlert;
    claimId: string;
    claimToken: string;
    receiptId: string;
    deliveredAt: string;
  }) => Promise<void>;
}>;

export type OperationalAlertRunResult = Readonly<{
  evaluated: number;
  claimed: number;
  delivered: number;
}>;

export const runContentSchemaRegistryOperationalAlerts = async (
  input: OperationalAlertRunInput,
  dependencies: OperationalAlertDependencies,
): Promise<OperationalAlertRunResult> => {
  const alerts = evaluateContentSchemaRegistryAlerts(
    await dependencies.loadSnapshot(input),
  );
  let claimed = 0;
  let delivered = 0;

  for (const alert of alerts) {
    const claim = await dependencies.claim(alert, input);
    if (!claim.claimed) continue;
    claimed += 1;
    const receipt = await dependencies.deliver({
      alert,
      claimId: claim.claimId,
      environment: input.environment,
      redacted: true,
      release: input.release,
      scheduledAt: input.scheduledAt,
    });
    const deliveredAt = new Date().toISOString();
    await dependencies.complete({
      alert,
      claimId: claim.claimId,
      claimToken: claim.claimToken,
      receiptId: receipt.receiptId,
      deliveredAt,
    });
    delivered += 1;
  }

  return { evaluated: alerts.length, claimed, delivered };
};
