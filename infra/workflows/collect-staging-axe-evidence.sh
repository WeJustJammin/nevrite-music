#!/usr/bin/env bash

set -euo pipefail

: "${DEPLOY_SHA:?DEPLOY_SHA is required}"
: "${STAGING_WEB_ORIGIN:?STAGING_WEB_ORIGIN is required}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is required}"
: "${GITHUB_RUN_ID:?GITHUB_RUN_ID is required}"
: "${GITHUB_ENV:?GITHUB_ENV is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
[[ "$DEPLOY_SHA" =~ ^[0-9a-f]{40}$ ]]

export GH_TOKEN="$GITHUB_TOKEN"
staging_deployment_record="$(
  gh api \
    --paginate \
    --slurp \
    --header 'Accept: application/vnd.github+json' \
    "repos/${GITHUB_REPOSITORY}/deployments?environment=staging&sha=${DEPLOY_SHA}&per_page=100" |
    DEPLOY_SHA="$DEPLOY_SHA" \
    GITHUB_REPOSITORY="$GITHUB_REPOSITORY" \
    GITHUB_RUN_ID="$GITHUB_RUN_ID" \
    node --input-type=module -e '
      import { execFileSync } from "node:child_process";
      import { readFileSync } from "node:fs";

      const pages = JSON.parse(readFileSync(0, "utf8"));
      const deployments = pages.flat();
      const sourceRevision = process.env.DEPLOY_SHA;
      const repository = process.env.GITHUB_REPOSITORY;
      const runId = process.env.GITHUB_RUN_ID;
      const githubApiHeaders = [
        "--header",
        "Accept: application/vnd.github+json",
      ];
      const currentRun = JSON.parse(
        execFileSync(
          "gh",
          [
            "api",
            ...githubApiHeaders,
            `repos/${repository}/actions/runs/${runId}`,
          ],
          { encoding: "utf8" },
        ),
      );
      if (
        String(currentRun.id) !== runId ||
        currentRun.status !== "in_progress" ||
        currentRun.conclusion !== null ||
        currentRun.head_sha !== sourceRevision ||
        currentRun.event !== "workflow_run" ||
        currentRun.path !== ".github/workflows/deploy-staging.yml"
      ) {
        throw new Error(
          "The protected current staging run is not the expected in-progress run.",
        );
      }
      const runStartedAt = Date.parse(
        currentRun.run_started_at ?? currentRun.created_at,
      );
      const runCreator = currentRun.actor?.login;
      if (!runCreator || !Number.isFinite(runStartedAt) || !/^\d+$/.test(runId)) {
        throw new Error("The protected current staging run lacks identity metadata.");
      }
      const now = Date.now();
      const escapeRegex = (value) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const currentRunJobUrlPattern = new RegExp(
        `^https://github\\.com/${escapeRegex(repository)}/actions/runs/${escapeRegex(runId)}/job/[0-9]+$`,
      );
      const statusUrlsMatchCurrentRun = (status) =>
        typeof status?.target_url === "string" &&
        typeof status?.log_url === "string" &&
        currentRunJobUrlPattern.test(status.target_url) &&
        currentRunJobUrlPattern.test(status.log_url);
      const deploymentStatuses = (deploymentId) => {
        const statusPages = JSON.parse(
          execFileSync(
            "gh",
            [
              "api",
              "--paginate",
              "--slurp",
              ...githubApiHeaders,
              `repos/${repository}/deployments/${deploymentId}/statuses?per_page=100`,
            ],
            { encoding: "utf8" },
          ),
        );
        return statusPages.flat();
      };
      const candidates = deployments
        .filter(
          (deployment) =>
            deployment?.environment === "staging" &&
            deployment?.sha === sourceRevision &&
            deployment?.ref === currentRun.head_branch &&
            deployment?.task === "deploy" &&
            deployment?.creator?.login === runCreator &&
            Number.isSafeInteger(deployment?.id) &&
            Number.isFinite(Date.parse(deployment.created_at)) &&
            Date.parse(deployment.created_at) >= runStartedAt &&
            Date.parse(deployment.created_at) <= now,
        )
        .map((deployment) => {
          const statusTimestamp = (status) => {
            const timestamp = Date.parse(status?.created_at);
            return Number.isFinite(timestamp) ? timestamp : -Infinity;
          };
          const statuses = deploymentStatuses(deployment.id).sort(
            (left, right) => statusTimestamp(right) - statusTimestamp(left),
          );
          return { deployment, latestStatus: statuses[0] };
        })
        .filter(({ deployment, latestStatus }) => {
          const statusCreatedAt = Date.parse(latestStatus?.created_at);
          return (
            latestStatus?.environment === "staging" &&
            latestStatus?.creator?.login === runCreator &&
            latestStatus?.state === "in_progress" &&
            statusUrlsMatchCurrentRun(latestStatus) &&
            Number.isFinite(statusCreatedAt) &&
            statusCreatedAt >= Date.parse(deployment.created_at) &&
            statusCreatedAt <= now
          );
        })
        .sort(
          (left, right) =>
            Date.parse(right.deployment.created_at) -
            Date.parse(left.deployment.created_at),
        );
      if (candidates.length === 0) {
        throw new Error(
          "No current in-progress staging deployment matches the protected run metadata.",
        );
      }
      process.stdout.write(
        `${candidates[0].deployment.id}\t${candidates[0].deployment.created_at}`,
      );
    '
)"
IFS=$'\t' read -r staging_deployment_id hosted_deployed_at <<< "$staging_deployment_record"
test "$staging_deployment_id" != ""
test "$hosted_deployed_at" != ""
[[ "$staging_deployment_id" =~ ^[0-9]+$ ]]

report_root=promotion-candidate
axe_report_path="${report_root}/accessibility/axe.json"
axe_digest_path="${report_root}/accessibility/axe.sha256"

SOURCE_REVISION="$DEPLOY_SHA" \
STAGING_DEPLOYMENT_ID="$staging_deployment_id" \
STAGING_WEB_ORIGIN="$STAGING_WEB_ORIGIN" \
node --experimental-strip-types \
  infra/workflows/collect-content-schema-registry-axe-evidence.ts

(
  cd "$report_root"
  sha256sum accessibility/axe.json > accessibility/axe.sha256
)
read -r axe_digest axe_digest_target < "$axe_digest_path"
[[ "$axe_digest" =~ ^[0-9a-f]{64}$ ]]
test "$axe_digest_target" = "accessibility/axe.json"
test "$(sha256sum "$axe_report_path" | awk '{print $1}')" = "$axe_digest"
collection_cutoff="$(node -p 'new Date().toISOString()')"

node --experimental-strip-types \
  infra/workflows/content-schema-registry-axe-report-verifier.ts \
  "$axe_report_path" \
  "$DEPLOY_SHA" \
  "$staging_deployment_id" \
  "$STAGING_WEB_ORIGIN" \
  "$axe_digest" \
  "$hosted_deployed_at" \
  "$collection_cutoff"

printf 'AC266_AXE_DIGEST=%s\nAC266_AXE_HOSTED_DEPLOYMENT_ID=%s\nAC266_AXE_HOSTED_DEPLOYED_AT=%s\nAC266_AXE_TRUSTED_CUTOFF_AT=%s\n' \
  "$axe_digest" \
  "$staging_deployment_id" \
  "$hosted_deployed_at" \
  "$collection_cutoff" \
  >> "$GITHUB_ENV"
