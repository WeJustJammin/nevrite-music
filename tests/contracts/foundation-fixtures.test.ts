import {
  ApiErrorSchema,
  HealthResponseSchema,
  ReadinessResponseSchema,
  RegistrySetSchema,
  RequestContextSchema,
} from '@wejammin/contracts';
import {
  createContractFixture,
  createDeterministicIds,
} from '@wejammin/test-support';
import { describe, expect, it } from 'vitest';

describe('contract test project', () => {
  it('uses a fresh, deterministic fixture bundle for every run', () => {
    const first = createContractFixture();
    const second = createContractFixture();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.ids).not.toBe(second.ids);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.requestContext.capabilities)).toBe(true);
    expect(createDeterministicIds()).toEqual(first.ids);
  });

  it('parses every foundation wire fixture through its runtime authority', () => {
    const fixture = createContractFixture();

    expect(ApiErrorSchema.parse(fixture.apiError)).toEqual(fixture.apiError);
    expect(RequestContextSchema.parse(fixture.requestContext)).toEqual(
      fixture.requestContext,
    );
    expect(HealthResponseSchema.parse(fixture.health)).toEqual(fixture.health);
    expect(ReadinessResponseSchema.parse(fixture.readiness)).toEqual(
      fixture.readiness,
    );
    expect(RegistrySetSchema.parse(fixture.registries)).toEqual(
      fixture.registries,
    );
  });
});
