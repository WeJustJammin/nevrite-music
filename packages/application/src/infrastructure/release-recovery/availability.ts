import {
  AvailabilityObjectiveInputSchema,
  MaintenanceNoticeSchema,
  type AvailabilityObjectiveInput,
  type MaintenanceNotice,
} from '../../../../contracts/src/release-recovery.ts';

const OBJECTIVE_BASIS_POINTS = 9_990;
const BASIS_POINT_SCALE = 10_000;

export type MaintenanceNoticeDecision =
  | Readonly<{
      status: MaintenanceNotice['status'];
      notice: MaintenanceNotice;
      announcedAtLeast48HoursAhead: true;
    }>
  | Readonly<{
      status: 'invalid';
      announcedAtLeast48HoursAhead: false;
    }>;

export type AvailabilityObjectiveDecision =
  | Readonly<{
      status: 'measured';
      objectiveBasisPoints: typeof OBJECTIVE_BASIS_POINTS;
      availabilityBasisPoints: number;
      countedDowntimeSeconds: number;
      scheduledMaintenanceExcluded: boolean;
      unplannedDowntimeCounted: true;
      meetsObjective: boolean;
    }>
  | Readonly<{
      status: 'invalid';
      objectiveBasisPoints: typeof OBJECTIVE_BASIS_POINTS;
      availabilityBasisPoints: null;
      countedDowntimeSeconds: null;
      scheduledMaintenanceExcluded: false;
      unplannedDowntimeCounted: true;
      meetsObjective: false;
    }>;

export const evaluateMaintenanceNotice = (
  input: unknown,
): MaintenanceNoticeDecision => {
  const result = MaintenanceNoticeSchema.safeParse(input);
  if (!result.success) {
    return {
      status: 'invalid',
      announcedAtLeast48HoursAhead: false,
    };
  }

  return {
    status: result.data.status,
    notice: result.data,
    announcedAtLeast48HoursAhead: true,
  };
};

const invalidObjective = (): AvailabilityObjectiveDecision => ({
  status: 'invalid',
  objectiveBasisPoints: OBJECTIVE_BASIS_POINTS,
  availabilityBasisPoints: null,
  countedDowntimeSeconds: null,
  scheduledMaintenanceExcluded: false,
  unplannedDowntimeCounted: true,
  meetsObjective: false,
});

const calculateAvailability = (input: AvailabilityObjectiveInput) => {
  const scheduledMaintenanceExcluded = input.maintenanceNotice !== null;
  const denominator = scheduledMaintenanceExcluded
    ? input.windowSeconds - input.scheduledMaintenanceSeconds
    : input.windowSeconds;
  const countedDowntimeSeconds = scheduledMaintenanceExcluded
    ? input.unplannedDowntimeSeconds
    : input.scheduledMaintenanceSeconds + input.unplannedDowntimeSeconds;

  if (denominator <= 0) {
    return undefined;
  }

  const availabilityBasisPoints = Math.max(
    0,
    Math.min(
      BASIS_POINT_SCALE,
      Math.floor(
        ((denominator - countedDowntimeSeconds) / denominator) *
          BASIS_POINT_SCALE,
      ),
    ),
  );

  return {
    availabilityBasisPoints,
    countedDowntimeSeconds,
    scheduledMaintenanceExcluded,
    meetsObjective: availabilityBasisPoints >= OBJECTIVE_BASIS_POINTS,
  };
};

export const evaluateAvailabilityObjective = (
  input: unknown,
): AvailabilityObjectiveDecision => {
  const result = AvailabilityObjectiveInputSchema.safeParse(input);
  if (!result.success) {
    return invalidObjective();
  }

  const measurement = calculateAvailability(result.data);
  if (!measurement) {
    return invalidObjective();
  }

  return {
    status: 'measured',
    objectiveBasisPoints: OBJECTIVE_BASIS_POINTS,
    ...measurement,
    unplannedDowntimeCounted: true,
  };
};
