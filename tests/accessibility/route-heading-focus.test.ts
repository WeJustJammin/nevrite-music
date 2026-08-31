import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import {
  installRouteHeadingFocus,
  ROUTE_PAGE_LOAD_EVENT,
} from '../../apps/web/src/lib/route-heading-focus';

describe('Phase 1 route heading focus contract', () => {
  it('focuses normal route headings only after a non-fragment client navigation', () => {
    const focus = vi.fn();
    const listeners = new Map<string, () => void>();
    const documentRef = {
      addEventListener: (name: string, listener: () => void) => {
        listeners.set(name, listener);
      },
      getElementById: (id: string) => (id === 'page-title' ? { focus } : null),
    } as unknown as Document;
    const locationRef = { hash: '' };
    installRouteHeadingFocus(documentRef, locationRef);
    const pageLoad = listeners.get(ROUTE_PAGE_LOAD_EVENT);
    expect(pageLoad).toBeDefined();

    pageLoad?.();
    expect(focus).not.toHaveBeenCalled();

    locationRef.hash = '#details';
    pageLoad?.();
    expect(focus).not.toHaveBeenCalled();

    locationRef.hash = '';
    pageLoad?.();
    expect(focus).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });

    for (const route of [
      'apps/web/src/pages/index.astro',
      'apps/web/src/pages/auth/sign-in.astro',
      'apps/web/src/pages/app/infrastructure/index.astro',
      'apps/web/src/pages/app/infrastructure/[recordId].astro',
      'apps/web/src/pages/system/degraded.astro',
      'apps/web/src/pages/offline.astro',
    ]) {
      const source = readFileSync(route, 'utf8');
      expect(source).toContain('route-heading-focus.ts');
      expect(source).toContain('id="page-title" tabindex="-1"');
    }
  });
});
