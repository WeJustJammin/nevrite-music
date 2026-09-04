import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AdminWorkspaceOperationsWorkbench, {
  ADMIN_WORKSPACE_ERROR_CODES,
} from './AdminWorkspaceOperationsWorkbench';
import PortabilityQualityLifecycleWorkbench, {
  PORTABILITY_QUALITY_ERROR_CODES,
} from './PortabilityQualityLifecycleWorkbench';
import SettingsFlagsRuntimeWorkbench, {
  SETTINGS_FLAGS_RUNTIME_BOUNDARY,
  SETTINGS_FLAGS_RUNTIME_INTERACTION_CONTRACT,
} from './SettingsFlagsRuntimeWorkbench';
import { SETTINGS_FLAGS_RUNTIME_ERROR_CODES } from './settings-flags-runtime-workbench-transport';

const ID = '018f0c45-73fe-7dc2-9c09-68f7ecf132d8';
const initial = {
  status: 'success' as const,
  version: '7',
  data: [
    {
      id: ID,
      version: '7',
      state: 'effective',
      provenance: [
        {
          source: 'settings-flags-runtime',
          evidence: 'definition default',
          at: '2026-09-02T00:00:00.000Z',
          visibility: 'authorized',
        },
      ],
      projection: {
        key: 'web.theme',
        typedValue: 'jam',
        evaluatorVersion: '7',
      },
    },
  ],
};

const contractFields = {
  source: '05a-settings-flags-runtime.md',
  fields: {
    'CFG-05A-02': ['key', 'typedValue', 'evaluatorVersion'],
    'CFG-05A-03': ['scopeType', 'typedValue', 'expectedDefinitionVersion'],
    'CFG-05A-04': ['action', 'candidateHash', 'expectedReviewVersion'],
  },
};

describe('Phase 2 Slice 07 workbench boundaries', () => {
  it('[P2-S07-AC-142, P2-S07-AC-145, P2-S07-AC-161, P2-S07-AC-164, P2-S07-AC-170] composes the active 05a workbench from semantic global primitives', () => {
    const markup = renderToStaticMarkup(
      <SettingsFlagsRuntimeWorkbench
        contractFields={contractFields}
        variant="adminStepUp"
        initial={initial}
        actorId={ID}
        actingPartyId={ID}
        access="full"
        query={{ query: 'theme' }}
        selectedId={ID}
        expectedVersion="7"
        csrfToken="csrf-bound"
        requestId={ID}
        canonicalUrl="/app/platform-configuration-admin"
      />,
    );

    expect(SETTINGS_FLAGS_RUNTIME_BOUNDARY).toEqual({
      operationPrefix: 'CFG-05A',
      operationIds: ['CFG-05A-02', 'CFG-05A-03', 'CFG-05A-04'],
      serviceOnlyOperation: 'CFG-05A-01',
      state: 'active',
      security: 'security-only fields never serialize to browser props',
    });
    expect(SETTINGS_FLAGS_RUNTIME_INTERACTION_CONTRACT).toMatchObject({
      openKey: 'Enter',
      closeKey: 'Escape',
      focus: 'return-to-trigger',
      views: ['list', 'detail'],
    });
    expect(markup).toContain('data-workbench="settings-flags-runtime"');
    expect(markup).toContain(
      'data-contract-source="05a-settings-flags-runtime.md"',
    );
    expect(markup).toContain('<table');
    expect(markup).toContain('Settings and flags runtime records');
    expect(markup).toContain('RecordHeader');
    expect(markup).toContain('ProvenanceFact');
    expect(markup).toContain('StateLabel');
    expect(markup).toContain('<dt>typedValue</dt><dd><code>jam</code>');
    expect(markup).toContain('aria-label="Configuration actions"');
    expect(markup).toContain('id="platform-configuration-propose-change-form"');
    expect(markup).toContain('name="expectedDefinitionVersion"');
    expect(markup).toContain('name="csrf" value="csrf-bound"');
  });

  it('[P2-S07-AC-143, P2-S07-AC-159, P2-S07-AC-162, P2-S07-AC-165, P2-S07-AC-168] keeps the 05b boundary truthful and command-free until Slice 08 activates it', () => {
    const markup = renderToStaticMarkup(
      <AdminWorkspaceOperationsWorkbench
        taskClasses={['capability-grant', 'audit-diagnostic']}
        states={['queued', 'stale']}
        staleAfter="2026-09-02T00:05:00.000Z"
      />,
    );

    expect(markup).toContain('data-workbench="admin-workspace-operations"');
    expect(markup).toContain('data-state="deferred"');
    expect(markup).toContain('Task classes');
    expect(markup).toContain('>2<');
    expect(markup).toContain('queued, stale');
    expect(markup).toContain('2026-09-02T00:05:00.000Z');
    expect(markup).not.toContain('<form');
    expect(markup).not.toContain('<button');
    for (const code of ADMIN_WORKSPACE_ERROR_CODES) {
      expect(markup).toContain(code);
    }
    expect(ADMIN_WORKSPACE_ERROR_CODES).toHaveLength(20);
  });

  it('[P2-S07-AC-144, P2-S07-AC-160, P2-S07-AC-163, P2-S07-AC-166, P2-S07-AC-169] keeps the 05c boundary concealed and command-free until its contract activates', () => {
    const concealed = renderToStaticMarkup(
      <PortabilityQualityLifecycleWorkbench authorized={false} />,
    );
    const authorized = renderToStaticMarkup(
      <PortabilityQualityLifecycleWorkbench authorized />,
    );

    expect(concealed).toContain(
      'data-workbench="portability-quality-lifecycle"',
    );
    expect(concealed).toContain('data-state="deferred"');
    expect(concealed).toContain('deferred until its contract is active');
    expect(authorized).toContain(
      'server will select an active lifecycle projection',
    );
    expect(concealed).not.toContain('<form');
    expect(authorized).not.toContain('<button');
    for (const code of PORTABILITY_QUALITY_ERROR_CODES) {
      expect(concealed).toContain(code);
    }
    expect(PORTABILITY_QUALITY_ERROR_CODES).toHaveLength(14);
  });

  it('[P2-S07-AC-161..P2-S07-AC-163, P2-S07-AC-167..P2-S07-AC-169] publishes exhaustive typed error registries without hidden provider claims', () => {
    expect(SETTINGS_FLAGS_RUNTIME_ERROR_CODES).toHaveLength(24);
    expect(SETTINGS_FLAGS_RUNTIME_ERROR_CODES).toContain('VALUE_INVALID');
    expect(ADMIN_WORKSPACE_ERROR_CODES).toContain(
      'DIAGNOSTIC_VERSION_CONFLICT',
    );
    expect(PORTABILITY_QUALITY_ERROR_CODES).toContain(
      'LIFECYCLE_TARGET_NOT_FOUND',
    );
    expect([
      ...SETTINGS_FLAGS_RUNTIME_ERROR_CODES,
      ...ADMIN_WORKSPACE_ERROR_CODES,
      ...PORTABILITY_QUALITY_ERROR_CODES,
    ]).not.toContain('PROVIDER_ADMIN');
  });
});
