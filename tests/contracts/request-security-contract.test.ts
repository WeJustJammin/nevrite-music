import {
  IdempotencyKeySchema,
  CreateCommandHeadersSchema,
  BrowserMutationSecurityHeadersSchema,
  HighRiskServerAuthoritySchema,
  InfrastructureCommandSchema,
  QuotedVersionSchema,
  SafeReturnPathSchema,
  ServerAuthoritySchema,
} from '@wejammin/contracts';
import { describe, expect, it } from 'vitest';

import { PARTY_ID, TARGET_ID } from './request-security-test-support.ts';

describe('Slice 02 request security contract', () => {
  it('locks strong versions to the positive bigint wire range', () => {
    expect([
      QuotedVersionSchema.safeParse('"1"').success,
      QuotedVersionSchema.safeParse('"abc"').success,
      QuotedVersionSchema.safeParse('"0"').success,
      QuotedVersionSchema.safeParse('"9223372036854775808"').success,
    ]).toEqual([true, false, false, false]);
  });

  it('supports server-verified actor-only authority', () => {
    expect(
      ServerAuthoritySchema.parse({
        actingPartyId: null,
        capabilities: ['infrastructure.read'],
      }),
    ).toMatchObject({ actingPartyId: null });
  });

  it('requires explicit server-owned high-risk authority facts', () => {
    expect([
      HighRiskServerAuthoritySchema.safeParse({
        actingPartyId: PARTY_ID,
        capabilities: ['infrastructure.destroy:any'],
        stepUpVerified: true,
        auditReasonPresent: true,
      }).success,
      HighRiskServerAuthoritySchema.safeParse({
        actingPartyId: PARTY_ID,
        capabilities: ['infrastructure.destroy:any'],
      }).success,
    ]).toEqual([true, false]);
  });

  it('allowlists only local application return paths', () => {
    expect([
      SafeReturnPathSchema.safeParse('/app').success,
      SafeReturnPathSchema.safeParse('/auth/sign-in').success,
      SafeReturnPathSchema.safeParse('/system/degraded').success,
      SafeReturnPathSchema.safeParse('//evil.example/app').success,
      SafeReturnPathSchema.safeParse('/app\\escape').success,
      SafeReturnPathSchema.safeParse('/public').success,
      SafeReturnPathSchema.safeParse('/app/%0Ainject').success,
      SafeReturnPathSchema.safeParse('/app/%ZZ').success,
      SafeReturnPathSchema.safeParse('/app/../auth/sign-in').success,
      SafeReturnPathSchema.safeParse('/app/\u0080').success,
    ]).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it('locks idempotency keys to bounded printable ASCII', () => {
    expect([
      IdempotencyKeySchema.safeParse('12345678').success,
      IdempotencyKeySchema.safeParse('short').success,
      IdempotencyKeySchema.safeParse(`prefix-${'x'.repeat(122)}`).success,
      IdempotencyKeySchema.safeParse('line\nbreak').success,
      IdempotencyKeySchema.safeParse('        ').success,
      IdempotencyKeySchema.safeParse(' operation-key ').success,
    ]).toEqual([true, false, false, false, false, false]);
  });

  it('permits create commands without an If-Match precondition', () => {
    expect(
      CreateCommandHeadersSchema.safeParse({
        contentType: 'application/json',
        idempotencyKey: 'create-key-0001',
      }).success,
    ).toBe(true);
  });

  it('locks browser mutations to canonical origins and CSRF token grammar', () => {
    const csrfToken = 'a'.repeat(32);
    const parse = (origin: string) =>
      BrowserMutationSecurityHeadersSchema.safeParse({
        origin,
        csrfToken,
      }).success;
    expect([
      parse('https://wejamm.in'),
      parse('http://localhost:4321'),
      parse('http://wejamm.in'),
      parse('null'),
      parse('https://wejamm.in/path'),
      parse('https://user:password@wejamm.in'),
    ]).toEqual([true, true, false, false, false, false]);
  });

  it('rejects command payloads beyond field and UTF-8 byte ceilings', () => {
    const base = {
      targetId: TARGET_ID,
      operation: 'update' as const,
    };
    expect([
      InfrastructureCommandSchema.safeParse({
        ...base,
        payload: Object.fromEntries(
          Array.from({ length: 33 }, (_, index) => [`field${index}`, index]),
        ),
      }).success,
      InfrastructureCommandSchema.safeParse({
        ...base,
        payload: { content: 'x'.repeat(32_769) },
      }).success,
    ]).toEqual([false, false]);
  });

  it('enforces global JSON nesting, nested-key, and array ceilings', () => {
    let nested: unknown = 'leaf';
    for (let depth = 0; depth < 17; depth += 1) {
      nested = { child: nested };
    }
    const nestedKeys = Object.fromEntries(
      Array.from({ length: 257 }, (_, index) => [`key${index}`, index]),
    );
    const base = {
      targetId: TARGET_ID,
      operation: 'update' as const,
    };
    expect([
      InfrastructureCommandSchema.safeParse({
        ...base,
        payload: { nested },
      }).success,
      InfrastructureCommandSchema.safeParse({
        ...base,
        payload: { nestedKeys },
      }).success,
      InfrastructureCommandSchema.safeParse({
        ...base,
        payload: { values: Array.from({ length: 1_001 }, (_, index) => index) },
      }).success,
      InfrastructureCommandSchema.safeParse({
        ...base,
        payload: { values: [1] },
      }).success,
    ]).toEqual([false, false, false, true]);
  });
});
