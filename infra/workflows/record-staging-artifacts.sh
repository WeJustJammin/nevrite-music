#!/usr/bin/env bash

set -euo pipefail

(
  cd .artifacts
  find . -type f -print0 | sort -z | xargs -0 sha256sum
) > deployment-manifest.sha256
