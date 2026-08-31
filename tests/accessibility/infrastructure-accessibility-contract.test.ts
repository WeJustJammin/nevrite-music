import { describe, expect, it } from 'vitest';

describe('Slice 02 accessibility contract', () => {
  it('P1-S02-AC-060', async () => {
    const { routeShellAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(routeShellAccessibility()).toEqual({
      skipLink: '#main-content',
      logicalDom: true,
      mainLandmarks: 1,
      uniqueTitle: true,
      initialFocus: 'h1',
    });
  });

  it('P1-S02-AC-061', async () => {
    const { workbenchSelectionAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(workbenchSelectionAccessibility()).toEqual({
      nativeControls: true,
      namedRegions: ['Infrastructure records', 'Infrastructure record details'],
      urlAddressable: true,
      escapeCloses: true,
      returnsFocus: true,
    });
  });

  it('P1-S02-AC-062', async () => {
    const { validationAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(validationAccessibility()).toEqual({
      persistentLabels: true,
      linkedSummary: true,
      ariaInvalid: true,
      describedErrors: true,
      keyboardTrap: false,
    });
  });

  it('P1-S02-AC-063', async () => {
    const { asyncUpdateAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(
      asyncUpdateAccessibility(
        'failed',
        '11111111-1111-4111-8111-111111111111',
      ),
    ).toEqual({
      preserveFocus: true,
      live: 'polite',
      atomic: true,
      includesRequestId: true,
      state: 'failed',
    });
  });

  it('P1-S02-AC-064', async () => {
    const { tableAndFilterAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(tableAndFilterAccessibility()).toEqual({
      caption: true,
      headerRelationships: true,
      ariaSort: true,
      resultCount: true,
      activeFilters: true,
      keyboardActions: true,
    });
  });

  it('P1-S02-AC-065', async () => {
    const { highRiskConfirmationAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(
      highRiskConfirmationAccessibility({
        consequence: 'Archive record',
        scope: 'One record',
        version: '"2"',
        actingContext: 'Creator',
        stepUpVerified: true,
        irreversible: false,
      }),
    ).toMatchObject({
      consequenceNamed: true,
      scopeNamed: true,
      versionNamed: true,
      actingContextNamed: true,
      stepUpStateNamed: true,
      irreversibleEffectsNamed: true,
    });
  });

  it('P1-S02-AC-066', async () => {
    const { mediaAccessibility } =
      await import('../../apps/web/src/lib/infrastructure-accessibility.ts');
    expect(mediaAccessibility()).toEqual({
      reducedMotionHonored: true,
      keyboardControl: true,
      captionsOrTranscript: true,
      motionIsSoleContent: false,
      waveformIsSoleContent: false,
    });
  });
});
