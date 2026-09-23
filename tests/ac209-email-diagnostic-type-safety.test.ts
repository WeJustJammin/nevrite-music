import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { Ac209EmailDiagnosticWindowSchema } from '../infra/workflows/ac209-email-diagnostics.ts';

const MODULE_PATH = resolve(
  import.meta.dirname,
  '../infra/workflows/ac209-email-diagnostics.ts',
);

const source = readFileSync(MODULE_PATH, 'utf8');
const sourceFile = ts.createSourceFile(
  MODULE_PATH,
  source,
  ts.ScriptTarget.Latest,
  true,
);

const stringLiterals = (node: ts.Node): readonly string[] => {
  const literals: string[] = [];
  const visit = (current: ts.Node): void => {
    if (ts.isStringLiteral(current)) literals.push(current.text);
    ts.forEachChild(current, visit);
  };
  visit(node);
  return literals;
};

const unionLiterals = (): readonly string[] => {
  let found: readonly string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isTypeAliasDeclaration(node) &&
      node.name.text === 'Ac209EmailDiagnosticWindowClassification'
    )
      found = stringLiterals(node.type);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
};

/** Reads the classification enum from the live Zod schema, not from source text. */
const schemaEnumLiterals = (): readonly string[] => {
  const json = Ac209EmailDiagnosticWindowSchema.toJSONSchema() as {
    readonly oneOf?: readonly {
      readonly properties?: {
        readonly classification?: { readonly enum?: readonly string[] };
      };
    }[];
  };
  for (const variant of json.oneOf ?? []) {
    const values = variant.properties?.classification?.enum;
    if (values !== undefined) return values;
  }
  return [];
};

/**
 * `infra/` is outside every tsconfig in this repository, so `pnpm type-check`
 * never compiles this module and vitest only transpiles it with esbuild. These
 * probes restore a type-level guard for the classification vocabulary, which
 * previously drifted: `classifyWindow` returned `duplicate_matches` and the Zod
 * enum accepted it while the exported union omitted it.
 */
describe('AC209 email diagnostic classification type safety', () => {
  it('declares union literals that match the response schema enum exactly', () => {
    const union = [...unionLiterals()].sort();
    const schema = [...schemaEnumLiterals()].sort();

    expect(schema.length).toBeGreaterThan(0);
    expect(union).toEqual(schema);
  });

  it('exposes every runtime classification through the exported union', () => {
    const union = unionLiterals();
    const schema = schemaEnumLiterals();

    expect(schema.length).toBeGreaterThan(0);
    for (const classification of schema)
      expect(union).toContain(classification);
  });

  it('compiles without a classification assignability error', () => {
    const program = ts.createProgram([MODULE_PATH], {
      allowImportingTsExtensions: true,
      exactOptionalPropertyTypes: true,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    });
    const classificationDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      )
      .filter((message) =>
        message.includes('Ac209EmailDiagnosticWindowClassification'),
      );

    expect(classificationDiagnostics).toEqual([]);
  });
});
