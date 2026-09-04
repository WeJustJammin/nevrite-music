import type { ProfilePortfolioProjection } from './profile-portfolio-projection.ts';

export const PROFILE_PORTFOLIO_LAYER_ORDER = [
  'header',
  'now',
  'record',
  'detail',
] as const;

export type ProfilePortfolioLayerCode =
  (typeof PROFILE_PORTFOLIO_LAYER_ORDER)[number];
export type ProfilePortfolioLayerState =
  'ready' | 'empty' | 'denied' | 'unavailable';

export type ProfilePortfolioLayerView = Readonly<{
  code: ProfilePortfolioLayerCode;
  state: ProfilePortfolioLayerState;
  values: readonly string[];
}>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

const safeText = (value: string): string =>
  /^(?:javascript:|data:|https?:\/\/)/iu.test(value) ? 'Unavailable' : value;

const normalizeState = (value: unknown): ProfilePortfolioLayerState => {
  if (value === 'empty') return 'empty';
  if (value === 'denied') return 'denied';
  if (value === 'unavailable') return 'unavailable';
  return 'ready';
};

const valuesFrom = (value: unknown): string[] => {
  if (typeof value === 'string') return [safeText(value)];
  if (Array.isArray(value)) {
    return value.flatMap((item) => valuesFrom(item)).slice(0, 50);
  }
  if (!isRecord(value)) return [];
  const preferred = [
    value.label,
    value.title,
    value.name,
    value.text,
    value.creditRef,
    value.roleCode,
    value.roleCodes,
    value.sourceType,
    value.provenanceState,
  ];
  return preferred.flatMap((item) => valuesFrom(item)).slice(0, 50);
};

const directLayer = (
  projection: ProfilePortfolioProjection,
  code: ProfilePortfolioLayerCode,
): unknown => {
  const layers = projection.layers;
  if (!isRecord(layers)) return undefined;
  return layers[code];
};

/** Normalize contract and fixture layer forms into one canonical display order. */
export const profilePortfolioLayers = (
  projection: ProfilePortfolioProjection | null,
): readonly ProfilePortfolioLayerView[] => {
  const source = projection?.layers;
  const ordered = Array.isArray(source)
    ? source.filter(isRecord).map((layer) => ({
        code: layer.code,
        state: layer.state,
        values: layer.facts,
      }))
    : PROFILE_PORTFOLIO_LAYER_ORDER.map((code) => {
        const layer = directLayer(projection ?? {}, code);
        return {
          code,
          state: isRecord(layer) ? layer.state : undefined,
          values: isRecord(layer)
            ? (layer.items ?? layer.facts ?? layer)
            : layer,
        };
      });
  const byCode = new Map<string, { state: unknown; values: unknown }>();
  for (const layer of ordered) {
    if (typeof layer.code === 'string' && !byCode.has(layer.code))
      byCode.set(layer.code, { state: layer.state, values: layer.values });
  }
  return PROFILE_PORTFOLIO_LAYER_ORDER.map((code) => {
    const layer = byCode.get(code);
    const state = normalizeState(layer?.state);
    return {
      code,
      state: layer === undefined && projection !== null ? 'unavailable' : state,
      values: layer === undefined ? [] : valuesFrom(layer.values),
    };
  });
};

export const profilePortfolioDisplayName = (
  projection: ProfilePortfolioProjection,
  fallback = 'Public profile',
): string => asText(projection.displayName) ?? fallback;

export const profilePortfolioHeadline = (
  projection: ProfilePortfolioProjection,
): string | null => asText(projection.headline);
