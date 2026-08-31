import { z } from 'zod';

export const ResponsiveLayoutSchema = z.discriminatedUnion('breakpoint', [
  z
    .object({
      breakpoint: z.literal('mobile'),
      columns: z.literal(4),
      composition: z.literal('stacked'),
      backActionFirst: z.literal(true),
      minimumTargetPx: z.literal(44),
    })
    .strict()
    .readonly(),
  z
    .object({
      breakpoint: z.literal('tablet'),
      columns: z.literal(8),
      composition: z.literal('collapsible_sidebar'),
      preservesRowDetails: z.literal(true),
    })
    .strict()
    .readonly(),
  z
    .object({
      breakpoint: z.literal('desktop'),
      columns: z.literal(12),
      composition: z.literal('list_detail_action_rail'),
      virtualizeAboveRows: z.literal(100),
    })
    .strict()
    .readonly(),
]);

export type ResponsiveLayout = z.infer<typeof ResponsiveLayoutSchema>;
