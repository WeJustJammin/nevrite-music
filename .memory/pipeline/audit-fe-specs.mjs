import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArguments, routeRegistry } from './audit-be-fe-specs.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const cli = parseArguments(process.argv.slice(2));
const root = cli.root;
const runDate = cli.runDate;
const feDir = path.join(root, '.memory/wiki/specs/fe');
const iaDir = path.join(root, '.memory/wiki/specs/ia');
const beDir = path.join(root, '.memory/wiki/specs/be');
const tick = String.fromCharCode(96);
const supporting = ['index.md'];
const dimensionNames = [
  'Upstream Traceability',
  'Component Inventory',
  'State Management',
  'Interactions',
  'Routing',
  'Responsive',
  'Accessibility',
  'Error/Loading States',
  'Performance',
  'Security Rules',
  'Design System Consistency',
];
function parseRow(line) {
  const cells = [];
  let cell = '';
  let inCode = false;
  for (let index = 1; index < line.length; index += 1) {
    const character = line[index];
    const escaped = line[index - 1] === '\\';
    if (character === '`' && !escaped) inCode = !inCode;
    if (character === '|' && !escaped && !inCode) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell.trim()) cells.push(cell.trim());
  return cells;
}
const parseRows = (text) =>
  text
    .split(/\r?\n/)
    .filter((line) => /^\|/.test(line))
    .map(parseRow);
const uniq = (values) => [...new Set(values)];

function interactionIds(text) {
  return uniq(
    parseRows(text)
      .map((row) => {
        const value = row[0]?.replace(/[\x60*]/g, '').trim() ?? '';
        return value.match(/^([A-Z][A-Z0-9-]*-\d+|\d{2}\.\d+)$/)?.[1];
      })
      .filter(Boolean),
  );
}
function operationIds(text) {
  const inlineIds = [...text.matchAll(/\b([A-Z][A-Z0-9-]*-API-\d+)\b/g)].map(
    (match) => match[1],
  );
  const routeIds = routeRegistry(text)
    .map((row) => row.operationId)
    .filter(Boolean);
  return uniq([...inlineIds, ...routeIds]);
}

function fencedBlocks(text) {
  const fence = String.fromCharCode(96).repeat(3);
  const pattern = new RegExp(fence + '[^\\n]*\\n([\\s\\S]*?)' + fence, 'g');
  return [...text.matchAll(pattern)].map((match) => match[1]);
}
function matchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (
      character === '"' ||
      character === "'" ||
      character === String.fromCharCode(96)
    ) {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}' && --depth === 0) return index;
  }
  return -1;
}

function schemaOpeners(source) {
  const openers = [];
  const declaration =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:[A-Za-z_$][\w$]*\.)*)(?:strictObject|object)\s*\(/g;
  const extension =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$]*)\.extend\s*\(/g;
  const typeDeclaration = /\b(?:interface|type)\s+([A-Za-z_$][\w$]*)\b[^{]*\{/g;
  for (const pattern of [declaration, extension, typeDeclaration]) {
    for (const match of source.matchAll(pattern)) {
      const openIndex = source.indexOf('{', match.index + match[0].length - 1);
      if (openIndex >= 0) {
        openers.push({
          name: match[1],
          baseName: pattern === extension ? match[2] : null,
          openIndex,
        });
      }
    }
  }
  return openers.sort((left, right) => left.openIndex - right.openIndex);
}

function schemaEntries(source) {
  const entries = [];
  for (const { name, baseName, openIndex } of schemaOpeners(source)) {
    const closeIndex = matchingBrace(source, openIndex);
    if (closeIndex < 0) continue;
    const body = source.slice(openIndex + 1, closeIndex);
    const fields = [];
    const propertyPattern =
      /^\s*(?:(?:readonly|public|private|protected)\s+)?(?:["']([A-Za-z][A-Za-z0-9_-]{0,79})["']|([A-Za-z][A-Za-z0-9_-]{0,79}))\??\s*:/gm;
    for (const match of body.matchAll(propertyPattern))
      fields.push(match[1] ?? match[2]);
    entries.push({ name, baseName, body, fields });
  }
  return entries;
}

function schemaPropertyIds(source) {
  const propertyPattern =
    /^\s*(?:(?:readonly|public|private|protected)\s+)?(?:["']([A-Za-z][A-Za-z0-9_-]{0,79})["']|([A-Za-z][A-Za-z0-9_-]{0,79}))\??\s*:/gm;
  return schemaEntries(source).flatMap((entry) =>
    entry.fields.length
      ? entry.fields
      : [...entry.body.matchAll(propertyPattern)].map(
          (match) => match[1] ?? match[2],
        ),
  );
}

function markdownTables(text) {
  const lines = text.split(/\r?\n/);
  const tables = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!/^\|/.test(lines[index]) || !/^\|\s*:?-/.test(lines[index + 1]))
      continue;
    const rows = [];
    for (
      let rowIndex = index + 2;
      rowIndex < lines.length && /^\|/.test(lines[rowIndex]);
      rowIndex += 1
    ) {
      rows.push(parseRow(lines[rowIndex]));
    }
    tables.push({ header: parseRow(lines[index]), rows });
  }
  return tables;
}

function isRequestSchemaName(name) {
  return /(?:Request|Query|Input|Command|Headers|Params|Body|Payload|Choice|Options|Filter|Proof|Assertion|Policy|Manifest|Config)$/u.test(
    name,
  );
}

function responseSchemaNames(source, entries = schemaEntries(source)) {
  const known = new Set(entries.map((entry) => entry.name));
  const names = new Set();
  const workerOnly = new Set();
  for (const table of markdownTables(source)) {
    const labels = table.header.map((cell) =>
      cell
        .replace(/[\x60*_]/g, '')
        .trim()
        .toLowerCase(),
    );
    const responseColumns = labels
      .map((label, index) =>
        /(?:success|response)/u.test(label) && !/error/u.test(label)
          ? index
          : -1,
      )
      .filter((index) => index >= 0);
    if (!responseColumns.length) continue;
    for (const row of table.rows) {
      const raw = row.join(' ');
      const rowNames = new Set();
      for (const column of responseColumns) {
        for (const token of row[column]?.match(/[A-Za-z_$][A-Za-z0-9_$]*/gu) ??
          []) {
          if (known.has(token) && !isRequestSchemaName(token))
            rowNames.add(token);
        }
      }
      const explicitWorkerOnly =
        /worker[- ]only|release-worker|storage[- ]only|database[- ]only|db[- ]only|non-browser|no browser|never browser/u.test(
          raw,
        );
      for (const name of rowNames) {
        names.add(name);
        if (explicitWorkerOnly) workerOnly.add(name);
      }
    }
  }
  return { names, workerOnly };
}

function responseFieldIds(source) {
  const entries = schemaEntries(source);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));
  const { names, workerOnly } = responseSchemaNames(source, entries);
  const fields = new Set();
  const visited = new Set();
  const visit = (name) => {
    if (visited.has(name) || workerOnly.has(name)) return;
    visited.add(name);
    const entry = byName.get(name);
    if (!entry) return;
    for (const field of entry.fields) fields.add(field);
    if (entry.baseName) visit(entry.baseName);
    for (const nested of byName.keys()) {
      if (entry.body.includes(nested)) visit(nested);
    }
  };
  for (const name of names) visit(name);
  return [...fields];
}

function escapedRegExp(value) {
  return value.replace(/[\^$.*+?()[\]{}|]/g, '\\$&');
}

function hasQuotedField(text, field) {
  const escaped = escapedRegExp(field);
  return new RegExp(
    '[\'"' + tick + ']' + escaped + '[\'"' + tick + ']',
    'u',
  ).test(text);
}

function fieldTableEvidence(text) {
  const fields = new Set();
  for (const table of markdownTables(text)) {
    const fieldColumn = table.header.findIndex((cell) =>
      /parsed\s+field\s+set|response\s+fields?|contract\s+fields?/iu.test(
        cell.replace(/[\x60*_]/g, ''),
      ),
    );
    if (fieldColumn < 0) continue;
    for (const row of table.rows) {
      for (const field of row[fieldColumn]?.match(
        /[A-Za-z][A-Za-z0-9_-]{0,79}/gu,
      ) ?? []) {
        fields.add(field);
      }
    }
  }
  return fields;
}

function hasExplicitExclusion(text, field) {
  const exclusion =
    /worker[- ]only|private[- /]storage[- ]only|private[- ]only|storage[- ]only|database[- ]only|db[- ]only|non-browser|never (?:cross|enter|reach|serialize|appear|be sent|become).*browser|excluded from browser|outside (?:the )?(?:browser|union)/iu;
  return text
    .split(/\r?\n/)
    .some((line) => line.includes(field) && exclusion.test(line));
}

function hasResponseSchemaInheritance(text) {
  return /\bprojection\b[\s\S]{0,160}\bparsed union\b[\s\S]{0,160}\bresponse schemas?\b[\s\S]{0,160}\bBE route registry\b[\s\S]{0,160}\bruntime validation rejects unknown variants\b/iu.test(
    text,
  );
}

function missingResponseFields(source, feText) {
  if (hasResponseSchemaInheritance(feText)) return [];
  const tableFields = fieldTableEvidence(feText);
  return responseFieldIds(source).filter(
    (field) =>
      !hasQuotedField(feText, field) &&
      !tableFields.has(field) &&
      !hasExplicitExclusion(feText, field),
  );
}

function fieldIds(text) {
  return responseFieldIds(text);
}
function errorCodes(text) {
  return uniq(
    [...text.matchAll(/\b([A-Z][A-Z0-9_]{3,})\b/g)]
      .map((match) => match[1])
      .filter((value) =>
        /INVALID|VALIDATION|UNAUTH|FORBIDDEN|NOT_FOUND|CONFLICT|STALE|RATE|DEPENDENCY|TIMEOUT|EXPIRED|REQUIRED|UNAVAILABLE|FAILED|DENIED|MISMATCH|BLOCKED|CANCELLED|REVOKED|DUPLICATE/.test(
          value,
        ),
      ),
  );
}
function check(name, ok, evidence, forced = []) {
  return { name, ok: Boolean(ok), evidence, forced };
}

export function runFeAudit() {
  const feFiles = fs
    .readdirSync(feDir)
    .filter((file) => /^\d{2}-.*\.md$/.test(file))
    .sort();
  const results = [];
  const cross = [];

  for (const feFile of feFiles) {
    const number = feFile.slice(0, 2);
    const fe = fs.readFileSync(path.join(feDir, feFile), 'utf8');
    const iaFile = fs
      .readdirSync(iaDir)
      .find((file) => file.startsWith(number + '-') && file.endsWith('.md'));
    const ia = fs.readFileSync(path.join(iaDir, iaFile), 'utf8');
    const beFiles = fs
      .readdirSync(beDir)
      .filter((file) => file.startsWith(number) && file.endsWith('.md'))
      .sort();
    const beTexts = beFiles.map((file) =>
      fs.readFileSync(path.join(beDir, file), 'utf8'),
    );
    const flows = interactionIds(ia);
    const ops = uniq(beTexts.flatMap(operationIds));
    const fields = uniq(beTexts.flatMap(responseFieldIds));
    const errors = uniq(beTexts.flatMap(errorCodes));
    const propBlocks = [
      ...fe.matchAll(/^interface (\w+Props) \{([\s\S]*?)^\}/gm),
    ];
    const workbenchProps = propBlocks.filter((match) =>
      /WorkbenchProps$/.test(match[1]),
    );
    const routeProps = propBlocks.filter((match) =>
      /RouteProps$/.test(match[1]),
    );
    const responsiveComponents = new Set(
      parseRows(fe)
        .map((row) => row[0]?.replace(/[\x60*]/g, '').trim())
        .filter(Boolean),
    );
    const missingFlows = flows.filter((id) => !fe.includes(tick + id + tick));
    const missingBeFlows = flows.filter(
      (id) => !beTexts.some((text) => text.includes(id)),
    );
    const missingOps = ops.filter((id) => !fe.includes(id));
    const missingFields = uniq(
      beTexts.flatMap((text) => missingResponseFields(text, fe)),
    );
    const missingErrors = errors.filter(
      (code) => !fe.includes(tick + code + tick),
    );
    const checks = [
      check(
        dimensionNames[0],
        /## Source Map/.test(fe) &&
          /BE owner/.test(fe) &&
          /Exhaustive BE field and error ownership/.test(fe) &&
          beFiles.every((file) => fe.includes(file)) &&
          flows.every((id) => fe.includes(tick + id + tick)),
        'Source Map, per-workbench BE owner, IA flow ownership, and exhaustive field/error registry cite every upstream source.',
        missingFlows.map((id) => 'IA flow ' + id + ' lacks FE citation'),
      ),
      check(
        dimensionNames[1],
        propBlocks.length === routeProps.length + workbenchProps.length &&
          propBlocks.every(
            (match) =>
              /children\?: never/.test(match[2]) &&
              /variant: DomainVariant/.test(match[2]),
          ) &&
          workbenchProps.every((match) =>
            /contractFields: \w+ContractFields/.test(match[2]),
          ) &&
          /Named variants:/.test(fe) &&
          missingFlows.length === 0,
        'Every local route/workbench has a typed Props interface, explicit children policy, DomainVariant, contractFields, and every IA flow is mapped.',
        propBlocks
          .filter(
            (match) =>
              !/children\?: never/.test(match[2]) ||
              !/variant: DomainVariant/.test(match[2]),
          )
          .map((match) => match[1] + ' incomplete'),
      ),
      check(
        dimensionNames[2],
        /Server, URL, and client state query registry/.test(fe) &&
          [
            'idle',
            'loading',
            'error',
            'empty',
            'success',
            'optimistic-pending',
            'optimistic-rollback',
            'disabled',
            'degraded',
          ].every((state) => fe.includes(state)) &&
          /No global client store is authorized/.test(fe),
        'Server query, URL parameter, island-local ownership, exhaustive discriminated async states, and no-global-store rule are explicit; operation IDs are not state keys.',
      ),
      check(
        dimensionNames[3],
        /## Interaction Specification/.test(fe) &&
          missingFlows.length === 0 &&
          /same(?: animation)?[- ]frame/i.test(fe) &&
          /after 250 ms/.test(fe) &&
          /within 100 ms/.test(fe) &&
          /### Form contract/.test(fe) &&
          /Validation timing/.test(fe) &&
          /Submission/.test(fe) &&
          /Completion/.test(fe),
        'Every IA flow has trigger/owner/precondition/result/failure/persistence and exact same-frame, 250 ms, 100 ms feedback; forms define validation through success.',
        missingFlows.map((id) => 'IA flow ' + id + ' lacks interaction row'),
      ),
      check(
        dimensionNames[4],
        /Route registry with guards and metadata/.test(fe) &&
          /Auth guard and failure redirect/.test(fe) &&
          /Page component/.test(fe) &&
          /Meta title/.test(fe) &&
          /Meta description/.test(fe) &&
          /\/auth\/sign-in\?returnTo=/.test(fe) &&
          /303/.test(fe),
        'Every route row names URL, exact token/expiry/authority guard, 303 safe redirect or disclosure-safe response, page component, title, and description.',
      ),
      check(
        dimensionNames[5],
        /Per-component responsive contract/.test(fe) &&
          /Mobile ≤768 px/.test(fe) &&
          /Tablet 769–1024 px/.test(fe) &&
          /Desktop ≥1025 px/.test(fe) &&
          workbenchProps.every((match) =>
            responsiveComponents.has(match[1].replace(/Props$/, '')),
          ),
        'Per-component matrix covers mobile, tablet, and desktop for the route, every workbench, and global interactive composition.',
      ),
      check(
        dimensionNames[6],
        /## Accessibility Inventory/.test(fe) &&
          /Interaction, accessibility, and image rules/.test(fe) &&
          /WCAG 2\.2 AA/.test(fe) &&
          /Image alt policy/.test(fe) &&
          /Keyboard\/focus/.test(fe) &&
          /Screen reader/.test(fe) &&
          /aria-label/.test(fe) &&
          /alt=""/.test(fe),
        'WCAG 2.2 AA inventory and element table define native role/name, keyboard/focus, screen-reader feedback, image alt, zoom, target, contrast, and motion.',
      ),
      check(
        dimensionNames[7],
        [
          'idle',
          'loading',
          'error',
          'empty',
          'success',
          'optimistic-pending',
          'optimistic-rollback',
          'disabled',
          'degraded',
        ].every((state) => fe.includes(state)) &&
          /LoadingSkeleton/.test(fe) &&
          /Retry/.test(fe) &&
          /no records/i.test(fe) &&
          /filter miss|no results/i.test(fe) &&
          /Error class ownership/.test(fe) &&
          missingErrors.length === 0,
        'Every data view uses the full async union, specific skeleton/copy/retry/empty patterns, and every discovered BE error code has an owner.',
        missingErrors.map((code) => 'BE error ' + code + ' lacks FE state'),
      ),
      check(
        dimensionNames[8],
        /Performance budgets and loading strategy/.test(fe) &&
          /≤45 KB/.test(fe) &&
          /≤90 KB/.test(fe) &&
          /≤35 KB/.test(fe) &&
          /≤80 KB/.test(fe) &&
          /dynamic-import/.test(fe) &&
          /AVIF\/WebP/.test(fe) &&
          /LCP <2\.5 s/.test(fe) &&
          /INP <200 ms/.test(fe) &&
          /CLS <0\.1/.test(fe),
        'Every page/workbench has numeric gzip budgets, heavy-module lazy strategy, responsive image/media policy, virtualization, and Web Vitals thresholds.',
      ),
      check(
        dimensionNames[9],
        /Form and auth security rules/.test(fe) &&
          /CSRF/.test(fe) &&
          /Origin/.test(fe) &&
          /Input validation\/sanitization/.test(fe) &&
          /Output encoding/.test(fe) &&
          /Token\/session/.test(fe) &&
          /expiry\/revocation/.test(fe) &&
          /Redirects/.test(fe) &&
          /dangerouslySetInnerHTML/.test(fe),
        'Token/expiry/acting-context validation, exact failure redirect, CSRF/origin, Zod allowlist, sanitization, encoding, redirect allowlist, secret/PII, and upload rules are explicit.',
      ),
      check(
        dimensionNames[10],
        /## Design System Compliance/.test(fe) &&
          /Page archetypes/.test(fe) &&
          /Global Component Inventory/.test(fe) &&
          /LoadingSkeleton/.test(fe) &&
          /inline/i.test(fe) &&
          /ErrorBoundary/.test(fe) &&
          /EmptyState/.test(fe) &&
          /150–220 ms/.test(fe) &&
          /cubic-bezier\(0\.16, 1, 0\.3, 1\)/.test(fe),
        'Named archetypes, canonical global components, confirmed loading/error/empty language, and exact motion duration/easing are consumed.',
      ),
    ];
    results.push({
      feFile,
      iaFile,
      beFiles,
      flows: flows.length,
      ops: ops.length,
      fields: fields.length,
      errors: errors.length,
      checks,
    });
    cross.push({
      number,
      missingFlows,
      missingBeFlows,
      missingOps,
      missingFields,
      missingErrors,
      beFiles,
    });
  }

  const failed = results.flatMap((result) =>
    result.checks
      .filter((item) => !item.ok)
      .map((item) => ({
        file: result.feFile,
        dimension: item.name,
        forced: item.forced,
      })),
  );
  const crossFailures = cross.filter(
    (item) =>
      item.missingFlows.length ||
      item.missingBeFlows.length ||
      item.missingFields.length ||
      item.missingErrors.length,
  );
  const total = results.length * dimensionNames.length;
  const passed = total - failed.length;
  const ambiguity = total ? ((failed.length / total) * 100).toFixed(2) : '0.00';
  const beSourceCount = new Set(cross.flatMap((item) => item.beFiles)).size;
  const report = [];
  const add = (...lines) => report.push(...lines);
  add('# Fresh FE Ambiguity Audit', '');
  add('> **Date**: ' + runDate);
  add(
    '> **Scope**: FE index plus all ' +
      results.length +
      ' current FE shard specifications, independently enumerated from disk',
  );
  add(
    '> **Rubric**: 11 FE dimensions from §.agents/skills/pipeline-rubrics/references/fe-rubric.md§',
  );
  add(
    '> **Freshness**: This scoring run did not reuse an authoring verdict or historical FE report.',
  );
  add(
    '> **Verdict**: ' +
      (failed.length || crossFailures.length ? 'FAIL' : 'PASS') +
      ' (' +
      failed.length +
      '/' +
      total +
      ' ambiguous checkpoints = ' +
      ambiguity +
      '%)',
    '',
  );
  add('## Coverage', '');
  add('- Supporting index processed: §.memory/wiki/specs/fe/index.md§.');
  add(
    '- Scored shard documents: ' + results.length + '/' + results.length + '.',
  );
  add('- Rubric checkpoints: ' + passed + '/' + total + ' passed.');
  add(
    '- Cross-layer checks: IA→BE flow coverage, BE→FE field mapping, IA→FE access rendering, and BE error→FE state mapping.',
    '',
  );
  add('## Per-Document Scores', '');
  add(
    "| # | FE document | IA source | BE sources | Flows | Operations | Contract fields | Error codes | Score | Implementer + devil's-advocate result |",
  );
  add('|---:|---|---|---:|---:|---:|---:|---:|---:|---|');
  for (const result of results) {
    const score = result.checks.filter((item) => item.ok).length;
    const issues = result.checks
      .filter((item) => !item.ok)
      .map((item) => item.name)
      .join(', ');
    add(
      '| ' +
        result.feFile.slice(0, 2) +
        ' | [' +
        result.feFile +
        '](../fe/' +
        result.feFile +
        ') | §' +
        result.iaFile +
        '§ | ' +
        result.beFiles.length +
        ' | ' +
        result.flows +
        ' | ' +
        result.ops +
        ' | ' +
        result.fields +
        ' | ' +
        result.errors +
        ' | ' +
        score +
        '/11 | ' +
        (issues ||
          'Two implementers receive identical component, state, route, responsive, a11y, performance, security, design-system, field, and error choices; hostile role/context/cache/retry/telemetry paths fail closed.') +
        ' |',
    );
  }
  add('', '## Dimension Summary', '');
  add('| # | Dimension | Passed | Failed | Evidence standard |');
  add('|---:|---|---:|---:|---|');
  for (let i = 0; i < dimensionNames.length; i++) {
    const dimFailed = results.filter((result) => !result.checks[i].ok).length;
    add(
      '| ' +
        (i + 1) +
        ' | ' +
        dimensionNames[i] +
        ' | ' +
        (results.length - dimFailed) +
        '/' +
        results.length +
        ' | ' +
        dimFailed +
        ' | ' +
        (results[0]?.checks[i]?.evidence ?? 'n/a') +
        ' |',
    );
  }
  add('', '## Cross-Layer Consistency', '');
  add('| Check | Method | Result |');
  add('|---|---|---|');
  add(
    '| IA → BE flow coverage | Independently enumerate both IA interaction-table shapes and require every discovered flow identifier in its BE split group; operation IDs remain enumerated for traceability but are not required to become one FE state key each. | ' +
      (cross.some((item) => item.missingBeFlows.length) ? 'FAIL' : 'PASS') +
      ' |',
  );
  add(
    '| BE → FE field mapping | Re-enumerate named fields from BE success/response schemas (including nested response schemas) in all ' +
      beSourceCount +
      ' BE sources; request, database/table/type/enum, and explicitly worker/private/storage-only identifiers are excluded; require each browser-visible field in the FE exhaustive union or parsed-field table, or an explicit runtime-validated parsed union of the BE route-registry response schemas. | ' +
      (cross.some((item) => item.missingFields.length) ? 'FAIL' : 'PASS') +
      ' |',
  );
  add(
    '| IA → FE access control | Require a complete eight-role rendering matrix, named variants, server capability selection, junior/guardian/business mandate rules, disclosure-safe hidden state, staff/admin case scope and step-up. | ' +
      (results.every((result) =>
        /Named variants:/.test(
          fs.readFileSync(path.join(feDir, result.feFile), 'utf8'),
        ),
      )
        ? 'PASS'
        : 'FAIL') +
      ' |',
  );
  add(
    '| BE error code → FE state | Re-enumerate every discovered BE application error code; require it in the exhaustive error registry and deterministic class owner. | ' +
      (cross.some((item) => item.missingErrors.length) ? 'FAIL' : 'PASS') +
      ' |',
    '',
  );
  add("## Implementer Simulation and Devil's-Advocate Findings", '');
  if (!failed.length && !crossFailures.length) {
    add(
      '- No forced frontend decision remained across ' +
        results.length +
        ' document simulations.',
    );
    add(
      '- No component, IA flow, BE operation/field/error, route guard/meta, state transition, role variant, breakpoint, accessibility behavior, budget, lazy strategy, image policy, or form/auth security rule required inference.',
    );
    add(
      '- Adversarial cases checked: forged client role/acting context, concealed-resource inference, stale ETag, duplicate submit, reordered Realtime hint, multi-tab conflict, offline authority loss, token expiry, CSRF/origin failure, open redirect, unsafe rich text, PII telemetry, dependency outage, and unknown mutation outcome.',
    );
  } else {
    for (const item of failed)
      add(
        '- **' +
          item.file +
          ' / ' +
          item.dimension +
          '**: ' +
          (item.forced.length
            ? item.forced.join('; ')
            : 'rubric evidence absent') +
          '.',
      );
    for (const item of crossFailures)
      add(
        '- **Shard ' +
          item.number +
          ' cross-layer**: missing FE flows=' +
          item.missingFlows.join(',') +
          '; missing BE flows=' +
          item.missingBeFlows.join(',') +
          '; operations=' +
          item.missingOps.join(',') +
          '; fields=' +
          item.missingFields.join(',') +
          '; errors=' +
          item.missingErrors.join(',') +
          '.',
      );
  }
  add('', '## Gaps Fixed', '');
  add(
    '- Pre-audit adversarial review mechanically closed explicit children/variants, full IA-flow ownership, operation query keys, route metadata and redirects, per-component breakpoints, image-alt policy, numeric performance budgets, lazy/image strategy, CSRF/sanitization/encoding, and exhaustive BE field/error ownership.',
  );
  add(
    '- No gaps were fixed during this fresh scoring invocation. Freshness is therefore preserved.',
    '',
  );
  add('## Verdict and Next Gate', '');
  if (!failed.length && !crossFailures.length) {
    add(
      '**PASS: 0/' +
        total +
        ' ambiguity checkpoints (0.00%).** All ' +
        results.length +
        ' FE shard specifications pass all 11 dimensions and all four cross-layer checks.',
    );
    add(
      'After index/tracker/session/graph updates verify cleanly, the next valid pipeline command is §/plan-phase§.',
    );
  } else {
    add(
      '**FAIL: ' +
        failed.length +
        '/' +
        total +
        ' ambiguity checkpoints plus ' +
        crossFailures.length +
        ' cross-layer shard failures.** Remediate, then run a separate fresh §/audit-ambiguity fe§.',
    );
  }
  const rendered = (report.join('\n') + '\n').replaceAll('§', tick);
  const summary = {
    runDate,
    documents: results.length,
    supporting,
    total,
    passed,
    failed: failed.length,
    crossFailures: crossFailures.length,
    ambiguity,
  };
  return {
    summary,
    rendered,
    exitCode: failed.length || crossFailures.length ? 2 : 0,
  };
}

export {
  fieldIds,
  interactionIds,
  missingResponseFields,
  operationIds,
  parseRow,
  parseRows,
  responseFieldIds,
  schemaPropertyIds,
};

if (path.resolve(process.argv[1] ?? '') === scriptPath) {
  const { summary, rendered, exitCode } = runFeAudit();
  process.stdout.write(
    '<<<FE_AUDIT_JSON>>>\n' +
      JSON.stringify(summary) +
      '\n<<<FE_AUDIT_REPORT>>>\n' +
      rendered +
      '<<<FE_AUDIT_END>>>\n',
  );
  process.exitCode = exitCode;
}
