#!/usr/bin/env bash

set -euo pipefail

lock_file="${TMPDIR:-/tmp}/wejammin-supabase-ci.lock"

exec 9>"${lock_file}"
flock --wait 600 9

cleanup() {
  pnpm db:stop >/dev/null 2>&1 || true
}

trap cleanup EXIT

pnpm db:stop >/dev/null 2>&1 || true
pnpm db:start
pnpm db:verify
