import * as React from '../../apps/web/node_modules/react/index.js';
import { renderToStaticMarkup } from '../../apps/web/node_modules/react-dom/server.node.js';
import { describe, expect, it } from 'vitest';

import ContentSchemaRegistryWorkbench from '../../apps/web/src/components/content-schema-registry/ContentSchemaRegistryWorkbench';
import { CONTENT_SCHEMA_REGISTRY_CONTRACT_FIELDS } from '../../apps/web/src/components/content-schema-registry/content-schema-registry-types';
import type { ContentSchemaRegistryWorkbenchProps } from '../../apps/web/src/components/content-schema-registry/content-schema-registry-types';
import {
  detail,
  list,
  REQUEST_ID,
  TYPE_ID,
  VERSION_ID,
} from '../e2e/phase-02-slice-09-content-schema-registry.fixture';

const roleCases = [
  { role: 'Free', variant: 'forbiddenHidden', access: 'not-rendered' },
  { role: 'Paid', variant: 'entitledRead', access: 'read-only' },
  { role: 'Creator', variant: 'ownerFull', access: 'full' },
  { role: 'Guardian', variant: 'guardianMandate', access: 'read-only' },
  { role: 'Junior', variant: 'juniorRestricted', access: 'read-only' },
  { role: 'Business', variant: 'businessMandate', access: 'read-only' },
  { role: 'Staff', variant: 'staffCaseScoped', access: 'read-only' },
  { role: 'Admin', variant: 'adminStepUp', access: 'read-only' },
] as const;

const renderRole = (roleCase: (typeof roleCases)[number]): string => {
  const props: ContentSchemaRegistryWorkbenchProps = {
    initialList: { status: 'success', data: list, version: '4', stale: false },
    initialDetail:
      roleCase.role === 'Creator'
        ? null
        : { status: 'success', data: detail, version: '4', stale: false },
    variant: roleCase.variant,
    access: roleCase.access,
    actorId: REQUEST_ID,
    actingPartyId: REQUEST_ID,
    query: { limit: 25, sort: 'key', direction: 'asc' },
    contentTypeId: TYPE_ID,
    versionId: VERSION_ID,
    cursor: null,
    expectedVersion: '4',
    requestId: REQUEST_ID,
    canonicalUrl: '/app/cms-content-modeling',
    listUrl: '/app/cms-content-modeling?limit=25&sort=key&direction=asc',
    retryUrl: '/app/cms-content-modeling?limit=25&sort=key&direction=asc',
    csrfToken: 'csrf-token',
    onCanonicalRefetch: async () => undefined,
    contractFields: CONTENT_SCHEMA_REGISTRY_CONTRACT_FIELDS,
  };

  return renderToStaticMarkup(
    React.createElement(ContentSchemaRegistryWorkbench, props),
  );
};

describe('[P2-S09-AC-265] FE03 role presentations', () => {
  it('renders every role through the server-authoritative access matrix', () => {
    for (const roleCase of roleCases) {
      const markup = renderRole(roleCase);
      if (roleCase.access === 'not-rendered') {
        expect(markup, roleCase.role).not.toContain(
          'data-workbench="content-schema-registry"',
        );
        continue;
      }

      expect(markup, roleCase.role).toContain(
        `data-workbench="content-schema-registry"`,
      );
      expect(markup).toContain(`data-variant="${roleCase.variant}"`);
      expect(markup).toContain(`data-access="${roleCase.access}"`);
      expect(markup).toContain('data-role-policy="server-authoritative"');
      expect(markup).toContain('aria-live="polite"');
      expect(markup).toContain(
        'aria-labelledby="content-schema-registry-heading"',
      );

      if (roleCase.role === 'Creator') {
        expect(markup).toContain('content-schema-registry-create-form');
        expect(markup).toContain('data-operation-id="CMS-03A-01"');
      } else {
        expect(markup).not.toContain('content-schema-registry-command-stack');
        expect(markup).not.toContain('content-schema-registry-create-form');
      }
    }
  });
});
