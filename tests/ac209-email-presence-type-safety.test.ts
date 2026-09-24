import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { Ac209EmailPresenceProbeReportSchema } from '../infra/workflows/ac209-email-presence-contract.ts';

const WORKFLOW_DIRECTORY = resolve(import.meta.dirname, '../infra/workflows');

/** The union is declared by the contract module; the probe returns the literals. */
const MODULE_PATHS = [
  resolve(WORKFLOW_DIRECTORY, 'ac209-email-presence-contract.ts'),
  resolve(WORKFLOW_DIRECTORY, 'ac209-email-presence.ts'),
] as const;

const sourceFiles = MODULE_PATHS.map((path) =>
  ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  ),
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
  for (const sourceFile of sourceFiles) {
    const visit = (node: ts.Node): void => {
      if (
        ts.isTypeAliasDeclaration(node) &&
        node.name.text === 'Ac209EmailPresenceClassification'
      )
        found = stringLiterals(node.type);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return found;
};

/**
 * Collects the string literals actually returned by any function whose
 * signature declares `Ac209EmailPresenceClassification` (the producer side).
 * This is a pure AST walk, so it stays cheap under the parallel suite where a
 * full `ts.createProgram` over the Zod graph would blow the test timeout budget.
 */
const returnedClassificationLiterals = (): readonly string[] => {
  const literals: string[] = [];
  const collectReturns = (body: ts.Node): void => {
    const walk = (node: ts.Node): void => {
      if (ts.isFunctionLike(node)) return;
      if (ts.isReturnStatement(node) && node.expression !== undefined) {
        const expression = node.expression;
        if (ts.isStringLiteral(expression)) literals.push(expression.text);
      }
      ts.forEachChild(node, walk);
    };
    walk(body);
  };
  for (const sourceFile of sourceFiles) {
    const visit = (node: ts.Node): void => {
      if (
        ts.isFunctionLike(node) &&
        node.type !== undefined &&
        node.type
          .getText(sourceFile)
          .includes('Ac209EmailPresenceClassification') &&
        node.body !== undefined
      )
        collectReturns(node.body);
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return literals;
};

/** Reads the classification enum from the live Zod schema, not from source text. */
const schemaEnumLiterals = (): readonly string[] => {
  const json = Ac209EmailPresenceProbeReportSchema.toJSONSchema() as {
    readonly properties?: {
      readonly classification?: { readonly enum?: readonly string[] };
    };
  };
  return json.properties?.classification?.enum ?? [];
};

/**
 * `infra/` is outside every tsconfig in this repository, so `pnpm type-check`
 * never compiles this module and vitest only transpiles it with esbuild. These
 * probes restore a type-level guard for the presence classification vocabulary,
 * which would otherwise be free to drift between the exported union, the
 * response schema enum, and the values `classifyPresence` actually returns.
 */
describe('AC209 email presence classification type safety', () => {
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

  it('returns only literals declared by the exported union', () => {
    const declared = unionLiterals();
    const returned = returnedClassificationLiterals();

    expect(declared.length).toBeGreaterThan(0);
    expect(returned.length).toBeGreaterThan(0);
    for (const literal of returned) expect(declared).toContain(literal);
  });
});
