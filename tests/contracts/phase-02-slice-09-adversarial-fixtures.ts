export const uuid = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const hash = 'a'.repeat(64);
export const signature = 'A'.repeat(86) + '==';

export const validField = (n = 1) => ({
  stableFieldId: uuid(n),
  key: `field_${n}`,
  kind: 'short_text' as const,
  constraints: { minLength: 0, maxLength: 120 },
  required: false,
  validatorKey: null,
  validatorVersion: null,
  defaultMode: 'none' as const,
  localizationMode: 'none' as const,
  editorConfig: { label: `Field ${n}`, order: n },
  lifecycle: 'active' as const,
});

export const validRelation = {
  fieldId: uuid(1),
  targetKind: 'content' as const,
  targetType: 'artist',
  projectionKey: 'public.summary',
  cardinality: 'many' as const,
  min: 0,
  max: 8,
  ordered: false,
  onUnavailable: 'placeholder' as const,
};

export const validDraft = {
  typeKey: 'article',
  label: 'Article',
  ownerCapability: 'cms.content.article',
  sourceLocale: 'en-US',
  defaultLocale: 'en-US',
  workflowKey: 'editorial.default',
  workflowVersion: '1',
  defaultTemplateVersionId: null,
  fields: [],
  relations: [],
  templateBindings: [],
  capabilityBindings: [],
};

export const validFieldChange = {
  key: 'title',
  kind: 'short_text' as const,
  constraints: {},
  required: true,
  validatorKey: null,
  validatorVersion: null,
  defaultMode: 'none' as const,
  localizationMode: 'none' as const,
  editorConfig: { label: 'Title', order: 0 },
  lifecycle: 'active' as const,
  migrationPlanId: null,
};

export const validBlock = {
  blockKey: 'hero.banner',
  blockVersion: 1,
  propsSchemaRef: 'schemas/hero-banner.json',
  propsSchemaHash: hash,
  propsSchemaSnapshot: {
    schemaVersion: '1',
    fields: [],
    additionalProperties: false as const,
  },
  propsSnapshotHash: hash,
  propsSnapshotAttestation: {
    algorithm: 'Ed25519' as const,
    keyId: 'release-key-1',
    signature,
  },
  rendererRef: 'renderer/hero-banner',
  allowedChildren: [],
  slotRules: { maxDepth: 1, maxNodes: 32 },
  dataSourcePermissions: [],
  accessibility: {
    nameRequired: true,
    keyboard: true as const,
    focusOrder: 'document' as const,
    statusAnnouncement: true,
  },
  compatibility: { minSchemaCompiler: '1', maxSchemaCompiler: '2' },
  lifecycle: 'supported' as const,
  releaseDigest: hash,
};

export const validLifecycle = {
  fromLifecycle: 'supported' as const,
  toLifecycle: 'deprecated' as const,
  expectedVersion: '1',
  releaseDigest: hash,
};
