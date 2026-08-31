import { ResponsiveLayoutSchema } from '@wejammin/contracts';
import type { ResponsiveLayout } from '@wejammin/contracts';

export function responsiveLayoutForWidth(width: number): ResponsiveLayout {
  if (!Number.isFinite(width) || width < 0) {
    throw new RangeError('Viewport width must be a finite non-negative number');
  }

  if (width <= 768) {
    return ResponsiveLayoutSchema.parse({
      breakpoint: 'mobile',
      columns: 4,
      composition: 'stacked',
      backActionFirst: true,
      minimumTargetPx: 44,
    });
  }

  if (width <= 1024) {
    return ResponsiveLayoutSchema.parse({
      breakpoint: 'tablet',
      columns: 8,
      composition: 'collapsible_sidebar',
      preservesRowDetails: true,
    });
  }

  return ResponsiveLayoutSchema.parse({
    breakpoint: 'desktop',
    columns: 12,
    composition: 'list_detail_action_rail',
    virtualizeAboveRows: 100,
  });
}
