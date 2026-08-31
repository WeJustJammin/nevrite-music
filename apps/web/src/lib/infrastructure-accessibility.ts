import { RequestIdSchema } from '@wejammin/contracts';

export type AsyncAnnouncementState =
  'idle' | 'loading' | 'stale' | 'pending' | 'failed' | 'conflict' | 'degraded';

export function routeShellAccessibility() {
  return {
    skipLink: '#main-content',
    logicalDom: true,
    mainLandmarks: 1,
    uniqueTitle: true,
    initialFocus: 'h1' as const,
  };
}

export function workbenchSelectionAccessibility() {
  return {
    nativeControls: true,
    namedRegions: [
      'Infrastructure records',
      'Infrastructure record details',
    ] as const,
    urlAddressable: true,
    escapeCloses: true,
    returnsFocus: true,
  };
}

export function validationAccessibility() {
  return {
    persistentLabels: true,
    linkedSummary: true,
    ariaInvalid: true,
    describedErrors: true,
    keyboardTrap: false,
  };
}

export function asyncUpdateAccessibility(
  state: AsyncAnnouncementState | string,
  requestId: string,
) {
  return {
    preserveFocus: true,
    live: 'polite' as const,
    atomic: true,
    includesRequestId: RequestIdSchema.safeParse(requestId).success,
    state,
  };
}

export function tableAndFilterAccessibility() {
  return {
    caption: true,
    headerRelationships: true,
    ariaSort: true,
    resultCount: true,
    activeFilters: true,
    keyboardActions: true,
  };
}

export interface HighRiskConfirmationAccessibilityInput {
  readonly consequence: string;
  readonly scope: string;
  readonly version: string;
  readonly actingContext: string;
  readonly stepUpVerified: boolean;
  readonly irreversible: boolean;
}

export function highRiskConfirmationAccessibility(
  input: HighRiskConfirmationAccessibilityInput,
) {
  return {
    consequenceNamed: input.consequence.trim().length > 0,
    scopeNamed: input.scope.trim().length > 0,
    versionNamed: input.version.trim().length > 0,
    actingContextNamed: input.actingContext.trim().length > 0,
    stepUpStateNamed: true,
    irreversibleEffectsNamed: true,
    stepUpVerified: input.stepUpVerified,
    irreversible: input.irreversible,
  };
}

export function mediaAccessibility() {
  return {
    reducedMotionHonored: true,
    keyboardControl: true,
    captionsOrTranscript: true,
    motionIsSoleContent: false,
    waveformIsSoleContent: false,
  };
}

export function liveRegionAttributes() {
  return {
    role: 'status' as const,
    ariaLive: 'polite' as const,
    ariaAtomic: true,
  };
}
