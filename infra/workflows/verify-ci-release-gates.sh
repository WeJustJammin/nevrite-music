#!/usr/bin/env bash

set -euo pipefail

evidence_dir=.ci-release-gates
rm -rf "$evidence_dir"
mkdir -p "$evidence_dir"

pnpm contracts:check
printf 'success\n' > "$evidence_dir/contracts.passed"

pnpm vitest run \
  apps/worker/src/provider-effects/provider-effect-configuration.test.ts \
  apps/worker/src/storage/upload-storage.test.ts \
  apps/worker/src/webhooks/webhook-processor.test.ts
printf 'success\n' > "$evidence_dir/registry.passed"

test -f docs/runbooks/platform/slo.md
test -f docs/runbooks/platform/release-recovery-gates.md
rg -q '99\.90% availability' docs/runbooks/platform/slo.md
rg -q 'forward-only' docs/runbooks/platform/release-recovery-gates.md
rg -q 'protected production approval' docs/runbooks/platform/release-recovery-gates.md
printf 'success\n' > "$evidence_dir/slo-runbook.passed"
