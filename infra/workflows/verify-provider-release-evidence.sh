#!/usr/bin/env bash

set -euo pipefail

: "${GITHUB_WORKSPACE:?GITHUB_WORKSPACE is required}"
: "${DEPLOY_SHA:?DEPLOY_SHA is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"

provider_report="$(realpath -- "${1:?Provider evidence path is required}")"

node --experimental-strip-types --input-type=module - \
  "$provider_report" "$DEPLOY_SHA" "$GITHUB_RUN_ID" "$GITHUB_WORKSPACE" <<'NODE'
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [reportPath, sourceRevision, githubRunId, workspace] = process.argv.slice(2);
const contractUrl = pathToFileURL(resolve(
  workspace,
  'packages/contracts/src/content-schema-registry/operational-release-evidence-provider.ts',
)).href;
const { CloudflareProviderReleaseEvidenceSchema } = await import(contractUrl);
const report = CloudflareProviderReleaseEvidenceSchema.safeParse(
  JSON.parse(readFileSync(reportPath, 'utf8')),
);
if (
  !report.success ||
  report.data.sourceRevision !== sourceRevision ||
  report.data.githubRunId !== githubRunId
) throw new Error('Cloudflare provider release evidence is invalid or mismatched.');
NODE
