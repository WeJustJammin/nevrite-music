import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  truncateSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { publishAc265RetainedReportV3Bytes } from '../../infra/workflows/ac265-retained-report-publication.ts';
import { serializeAc265RetainedReportV3 } from '../../infra/workflows/ac265-retained-report-producer.ts';
import { verifyContentSchemaRegistryRetainedReports } from '../../infra/workflows/content-schema-registry-retained-report-verifier.ts';
import {
  CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
  CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
} from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-common.ts';
import {
  AC265_DECLARED_REPORT_PATH,
  assembleProductionReport,
  cleanupProductionSandboxes,
  createProducedRetainedFixture,
  createProductionFixture,
  createProductionRoot,
  mutateProductionReport,
  productionInputFor,
  retainedVerificationFor,
} from './ac265-retained-report-production.test-support.ts';

const FAILURE = /retained report redaction failed/iu;

afterEach(cleanupProductionSandboxes);

const sha256Hex = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');

const treeEntries = (root: string): readonly string[] => {
  const entries: string[] = [];
  const walk = (directory: string, prefix: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const relative = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(join(directory, entry.name), relative);
      else entries.push(relative);
    }
  };
  walk(root, '');
  return entries.sort();
};

describe('AC265 retained hosted E2E report producer', () => {
  it('writes the exact report bytes to the declared path and passes the existing retained verifier', () => {
    const production = createProductionFixture();
    const input = productionInputFor(production);

    const produced = publishAc265RetainedReportV3Bytes(input);

    const written = readFileSync(produced.absolutePath);
    expect(produced.path).toBe(AC265_DECLARED_REPORT_PATH);
    expect(produced.absolutePath).toBe(
      join(input.reportRoot, AC265_DECLARED_REPORT_PATH),
    );
    expect(produced.sha256).toBe(sha256Hex(written));
    expect(Buffer.from(written).equals(Buffer.from(input.reportBytes))).toBe(
      true,
    );
    expect(statSync(produced.absolutePath).mode & 0o777).toBe(0o600);
  });

  it('produces a report the retained release verifier accepts end to end', () => {
    const built = createProducedRetainedFixture();
    const verification = retainedVerificationFor(built.production);

    expect(
      readFileSync(join(built.retained.reportRoot, built.produced.path))
        .byteLength,
    ).toBeGreaterThan(0);
    expect(() =>
      verifyContentSchemaRegistryRetainedReports(
        built.evidence as never,
        verification.expectedIdentity as never,
        built.retained.reportRoot,
        verification.hostedV3Verification as never,
      ),
    ).not.toThrow();
  });

  it('binds its digest to the exact written bytes rather than a canonical re-serialization', () => {
    const input = productionInputFor();

    const produced = publishAc265RetainedReportV3Bytes(input);

    expect(produced.sha256).toBe(sha256Hex(input.reportBytes));
    expect(produced.sha256).toBe(
      sha256Hex(readFileSync(produced.absolutePath)),
    );
    expect(input.reportBytes.byteLength).toBeGreaterThan(
      Buffer.byteLength(
        JSON.stringify(
          JSON.parse(Buffer.from(input.reportBytes).toString('utf8')),
        ),
      ),
    );
  });

  it('publishes at the sidecar-declared path instead of a hardcoded report path', () => {
    const declaredReportPath = 'hosted/reports/ac265-e2e.json';
    const input = { ...productionInputFor(), declaredReportPath };

    const produced = publishAc265RetainedReportV3Bytes(input);

    expect(produced.path).toBe(declaredReportPath);
    expect(existsSync(join(input.reportRoot, declaredReportPath))).toBe(true);
    expect(existsSync(join(input.reportRoot, 'hosted/e2e.json'))).toBe(false);
  });

  it('creates only the declared report inside the root', () => {
    const input = productionInputFor();

    publishAc265RetainedReportV3Bytes(input);

    expect(treeEntries(input.reportRoot)).toEqual([AC265_DECLARED_REPORT_PATH]);
  });

  it('is idempotent for identical bytes and fails closed when different bytes already exist', () => {
    const input = productionInputFor();

    const first = publishAc265RetainedReportV3Bytes(input);
    const second = publishAc265RetainedReportV3Bytes(input);
    expect(second.sha256).toBe(first.sha256);
    expect(treeEntries(input.reportRoot)).toEqual([AC265_DECLARED_REPORT_PATH]);

    writeFileSync(join(input.reportRoot, AC265_DECLARED_REPORT_PATH), '{}');
    expect(() => publishAc265RetainedReportV3Bytes(input)).toThrow(FAILURE);
    expect(
      readFileSync(join(input.reportRoot, AC265_DECLARED_REPORT_PATH), 'utf8'),
    ).toBe('{}');
  });

  it('never overwrites a report created after its preflight', () => {
    const input = productionInputFor();
    const target = join(input.reportRoot, AC265_DECLARED_REPORT_PATH);
    mkdirSync(join(input.reportRoot, 'hosted'), { recursive: true });
    // Simulates the racing writer: the destination appears after the producer
    // would have inspected it. Exclusive publication must fail closed and leave
    // the raced bytes untouched.
    writeFileSync(target, '{"raced":true}\n');

    expect(() => publishAc265RetainedReportV3Bytes(input)).toThrow(FAILURE);
    expect(readFileSync(target, 'utf8')).toBe('{"raced":true}\n');
    expect(treeEntries(input.reportRoot)).toEqual([AC265_DECLARED_REPORT_PATH]);
  });

  it('rejects an oversized existing report instead of reading it whole', () => {
    const input = productionInputFor();
    const target = join(input.reportRoot, AC265_DECLARED_REPORT_PATH);
    mkdirSync(join(input.reportRoot, 'hosted'), { recursive: true });
    writeFileSync(target, '');
    truncateSync(target, 32 * 1024 * 1024);

    expect(() => publishAc265RetainedReportV3Bytes(input)).toThrow(FAILURE);
    expect(statSync(target).size).toBe(32 * 1024 * 1024);
  });

  it('rejects a symlinked report root and a symlinked destination', () => {
    const realRoot = createProductionRoot();
    const linkRoot = join(createProductionRoot(), 'linked-root');
    symlinkSync(realRoot, linkRoot);

    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...productionInputFor(),
        reportRoot: linkRoot,
      }),
    ).toThrow(FAILURE);
    expect(readdirSync(realRoot)).toEqual([]);

    const input = productionInputFor();
    const outside = createProductionRoot();
    writeFileSync(join(outside, 'target.json'), '{}');
    symlinkSync(
      join(outside, 'target.json'),
      join(input.reportRoot, 'link.json'),
    );
    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...input,
        declaredReportPath: 'link.json',
      }),
    ).toThrow(FAILURE);
    expect(readFileSync(join(outside, 'target.json'), 'utf8')).toBe('{}');
  });

  it('rejects a symlinked intermediate directory inside the root', () => {
    const input = productionInputFor();
    const outside = createProductionRoot();
    symlinkSync(outside, join(input.reportRoot, 'hosted'));

    expect(() => publishAc265RetainedReportV3Bytes(input)).toThrow(FAILURE);
    expect(readdirSync(outside)).toEqual([]);
  });

  it('rejects prohibited material without writing any report or directory', () => {
    const production = createProductionFixture();
    const input = productionInputFor(production);
    const leaked = mutateProductionReport(
      assembleProductionReport(production),
      (copy) => {
        (copy['roles'] as Record<string, unknown>[])[0]!['afterStateSha256'] =
          'jane.doe@example.com';
      },
    );

    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...input,
        reportBytes: serializeAc265RetainedReportV3(leaked),
      }),
    ).toThrow(FAILURE);
    expect(treeEntries(input.reportRoot)).toEqual([]);
  });

  it('rejects a report that does not belong to the trusted run and identity', () => {
    const other = createProductionFixture({ stagingRunId: '34751910126' });
    const input = productionInputFor();

    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...input,
        reportBytes: serializeAc265RetainedReportV3(
          assembleProductionReport(other),
        ),
      }),
    ).toThrow(FAILURE);
    expect(treeEntries(input.reportRoot)).toEqual([]);
  });

  it('rejects duplicate JSON members on the raw-byte boundary before publishing', () => {
    const input = productionInputFor();
    const text = Buffer.from(input.reportBytes).toString('utf8');
    const duplicated = Buffer.from(
      text.replace('"redacted": true', '"redacted": true,\n  "redacted": true'),
      'utf8',
    );
    expect(JSON.parse(duplicated.toString('utf8'))).toBeDefined();

    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...input,
        reportBytes: duplicated,
      }),
    ).toThrow(FAILURE);
    expect(treeEntries(input.reportRoot)).toEqual([]);
  });

  it('rejects escaping, absolute, duplicated-separator, and empty declared paths', () => {
    const input = productionInputFor();

    for (const declaredReportPath of [
      '/absolute/hosted-e2e.json',
      '../escape.json',
      'hosted/../../escape.json',
      'hosted//e2e.json',
      'hosted\\e2e.json',
      'hosted/./e2e.json',
      'hosted/e2e.json\u0000',
      '',
    ]) {
      expect(() =>
        publishAc265RetainedReportV3Bytes({
          ...input,
          declaredReportPath,
        }),
      ).toThrow(FAILURE);
      expect(treeEntries(input.reportRoot)).toEqual([]);
    }
  });

  it('rejects unknown input fields, non-byte input, and empty bytes', () => {
    const input = productionInputFor();
    const asInput = input as unknown as Parameters<
      typeof publishAc265RetainedReportV3Bytes
    >[0];

    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...(asInput as Record<string, unknown>),
        acceptedReport: {},
      } as unknown as typeof asInput),
    ).toThrow(FAILURE);
    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...(asInput as Record<string, unknown>),
        reportBytes: '{"criterion":"P2-S09-AC-265"}',
      } as unknown as typeof asInput),
    ).toThrow(FAILURE);
    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...input,
        reportBytes: new Uint8Array(0),
      }),
    ).toThrow(FAILURE);
  });

  it('does not modify trusted contract, receipt, or identity inputs', () => {
    const production = createProductionFixture();
    const input = productionInputFor(production);
    const contractHex = Buffer.from(production.fixture.contractBytes).toString(
      'hex',
    );
    const receiptDigests = [...production.fixture.receiptBytes.entries()]
      .map(([ref, bytes]) => `${ref}:${sha256Hex(bytes)}`)
      .sort();

    publishAc265RetainedReportV3Bytes(input);

    expect(Buffer.from(production.fixture.contractBytes).toString('hex')).toBe(
      contractHex,
    );
    expect(
      [...production.fixture.receiptBytes.entries()]
        .map(([ref, bytes]) => `${ref}:${sha256Hex(bytes)}`)
        .sort(),
    ).toEqual(receiptDigests);
  });

  it('publishes every locked role and scenario exactly once', () => {
    const input = productionInputFor();

    const produced = publishAc265RetainedReportV3Bytes(input);
    const written = JSON.parse(readFileSync(produced.absolutePath, 'utf8')) as {
      roles: { role: string }[];
      scenarios: { scenario: string }[];
    };

    expect(written.roles.map(({ role }) => role)).toEqual([
      ...CONTENT_SCHEMA_REGISTRY_HOSTED_ROLES,
    ]);
    expect(written.scenarios.map(({ scenario }) => scenario)).toEqual([
      ...CONTENT_SCHEMA_REGISTRY_HOSTED_SCENARIOS,
    ]);
  });

  it('publishes an owner-only report with no writable group or other bits', () => {
    const input = productionInputFor();
    chmodSync(input.reportRoot, 0o755);

    const produced = publishAc265RetainedReportV3Bytes(input);

    const mode = statSync(produced.absolutePath).mode & 0o777;
    expect(mode).toBe(0o600);
    expect(lstatSync(produced.absolutePath).isSymbolicLink()).toBe(false);
  });

  it('rejects a report root that is a file or a filesystem root', () => {
    const input = productionInputFor();
    const fileRoot = join(input.reportRoot, 'not-a-directory');
    writeFileSync(fileRoot, 'x');

    for (const reportRoot of ['/', fileRoot, '']) {
      expect(() =>
        publishAc265RetainedReportV3Bytes({ ...input, reportRoot }),
      ).toThrow(FAILURE);
    }
    expect(readFileSync(fileRoot, 'utf8')).toBe('x');
  });

  it('rejects a non-file destination and an oversized byte payload', () => {
    const input = productionInputFor();
    mkdirSync(join(input.reportRoot, AC265_DECLARED_REPORT_PATH), {
      recursive: true,
    });

    expect(() => publishAc265RetainedReportV3Bytes(input)).toThrow(FAILURE);
    expect(() =>
      publishAc265RetainedReportV3Bytes({
        ...input,
        reportBytes: Buffer.alloc(10 * 1024 * 1024 + 1, 0x20),
      }),
    ).toThrow(FAILURE);
  });
});
