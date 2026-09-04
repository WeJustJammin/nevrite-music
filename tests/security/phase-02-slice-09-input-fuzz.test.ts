import { describe, expect, it } from 'vitest';

import {
  BlockLifecycleAdvanceRequestSchema,
  BlockRegistrationRequestSchema,
  ContentSchemaRegistryListQuerySchema,
  ContentTypeDraftRequestSchema,
  FieldSchemaChangeRequestSchema,
  RelationBindingRequestSchema,
  ReleaseEnvelopeHeadersSchema,
  SchemaActivationRequestSchema,
} from '../../packages/contracts/src/content-schema-registry';
import { JsonValueSchema } from '../../packages/contracts/src/api-error';
import {
  HASH,
  NONCE,
  SIGNATURE,
  TYPE_ID,
  VERSION_ID,
  validActivation,
  validBlock,
  validDraft,
  validField,
  validLifecycle,
  validRelation,
} from '../../apps/worker/src/content-schema-registry/phase-02-slice-09-test-values';

const hostileAlphabet = [
  'javascript:alert(1)',
  '<script>document.cookie</script>',
  '${process.env.SECRET}',
  "'; DROP TABLE cms_private; --",
  '(a+)+$',
  '𝓼𝓬𝓱𝓮𝓶𝓪\u202Eevil',
  'select\u0000from',
] as const;

const generatedHostile = (seed: number): string => {
  const prefix = hostileAlphabet[seed % hostileAlphabet.length];
  return `${prefix}-${String.fromCharCode(0x3042 + (seed % 80))}-${seed}`;
};

const nested = (levels: number): unknown => {
  let value: unknown = 'safe';
  for (let index = 0; index < levels; index += 1) value = { child: value };
  return value;
};

describe('P2-S09 hostile input fuzz boundary', () => {
  it('[P2-S09-AC-216] rejects generated executable, SQL-like, regex, Unicode-control, and projection inputs', () => {
    for (let seed = 0; seed < 64; seed += 1) {
      const hostile = generatedHostile(seed);
      expect(
        ContentTypeDraftRequestSchema.safeParse({
          ...validDraft,
          typeKey: hostile,
        }).success,
      ).toBe(false);
      expect(
        ContentTypeDraftRequestSchema.safeParse({
          ...validDraft,
          ownerCapability: hostile,
        }).success,
      ).toBe(false);
      expect(
        RelationBindingRequestSchema.safeParse({
          ...validRelation,
          projectionKey: hostile,
        }).success,
      ).toBe(false);
      expect(
        RelationBindingRequestSchema.safeParse({
          ...validRelation,
          targetType: hostile,
        }).success,
      ).toBe(false);
      expect(
        ContentSchemaRegistryListQuerySchema.safeParse({
          keyPrefix: hostile,
          limit: 25,
        }).success,
      ).toBe(false);
    }
  });

  it('[P2-S09-AC-216] bounds depth, keys, arrays, and serialized payloads', () => {
    expect(JsonValueSchema.safeParse(nested(9)).success).toBe(false);
    expect(
      JsonValueSchema.safeParse(
        Object.fromEntries(
          Array.from({ length: 129 }, (_, index) => [`key-${index}`, index]),
        ),
      ).success,
    ).toBe(false);
    expect(
      JsonValueSchema.safeParse(Array.from({ length: 129 }, () => null))
        .success,
    ).toBe(false);
    expect(JsonValueSchema.safeParse('界'.repeat(100_000)).success).toBe(false);
    expect(
      FieldSchemaChangeRequestSchema.safeParse({
        ...validField,
        stableFieldId: VERSION_ID,
        defaultMode: 'literal',
        defaultValue: nested(9),
        migrationPlanId: null,
      }).success,
    ).toBe(false);
    expect(
      ContentTypeDraftRequestSchema.safeParse({
        ...validDraft,
        fields: Array.from({ length: 129 }, () => validField),
      }).success,
    ).toBe(false);
    expect(
      ContentTypeDraftRequestSchema.safeParse({
        ...validDraft,
        relations: Array.from({ length: 129 }, () => validRelation),
      }).success,
    ).toBe(false);
  });

  it('[P2-S09-AC-216] rejects unknown keys and arbitrary projection or executable release data', () => {
    expect(
      ContentTypeDraftRequestSchema.safeParse({
        ...validDraft,
        __proto__: { isAdmin: true },
      }).success,
    ).toBe(false);
    expect(
      ContentSchemaRegistryListQuerySchema.safeParse({
        limit: 25,
        projection: 'ownerId,secret',
      }).success,
    ).toBe(false);
    expect(
      RelationBindingRequestSchema.safeParse({
        ...validRelation,
        projectionKey: 'users;select * from private.users',
      }).success,
    ).toBe(false);
    expect(
      BlockRegistrationRequestSchema.safeParse({
        ...validBlock,
        rendererRef: 'javascript:eval(document.cookie)',
      }).success,
    ).toBe(false);
    expect(
      BlockLifecycleAdvanceRequestSchema.safeParse({
        ...validLifecycle,
        unexpected: '<template>{{secret}}</template>',
      }).success,
    ).toBe(false);
    expect(
      SchemaActivationRequestSchema.safeParse({
        ...validActivation,
        approvalIds: [TYPE_ID, TYPE_ID],
      }).success,
    ).toBe(false);
  });

  it('[P2-S09-AC-216] rejects signature-byte fuzz and header aliases before trust', () => {
    const valid = {
      keyId: 'release-key-1',
      issuedAt: '2026-09-02T12:00:00.000Z',
      nonce: NONCE,
      signature: SIGNATURE,
    };
    expect(ReleaseEnvelopeHeadersSchema.safeParse(valid).success).toBe(true);
    for (let seed = 0; seed < 32; seed += 1) {
      const malformed = Buffer.from(
        `${generatedHostile(seed)}-${HASH}`,
      ).toString('base64');
      expect(
        ReleaseEnvelopeHeadersSchema.safeParse({
          ...valid,
          signature: malformed,
        }).success,
      ).toBe(false);
      expect(
        ReleaseEnvelopeHeadersSchema.safeParse({
          ...valid,
          'x-release-signature': malformed,
        }).success,
      ).toBe(false);
    }
  });
});
