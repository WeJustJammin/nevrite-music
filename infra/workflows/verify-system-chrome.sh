#!/usr/bin/env bash

# Every browser gate in this repository runs Google Chrome, the browser the
# operator and the release evidence actually exercise. The Playwright-bundled
# Chromium download is not an accepted substitute, so this check fails closed
# instead of silently degrading to a different browser build.
set -euo pipefail

chrome_candidates=(
  /usr/bin/google-chrome-stable
  /usr/bin/google-chrome
  /opt/google/chrome/chrome
)

if [[ $# -gt 0 ]]; then
  chrome_candidates=("$1")
fi

for candidate in "${chrome_candidates[@]}"; do
  if [[ -x "$candidate" ]]; then
    chrome_version="$("$candidate" --version)"
    if [[ "$chrome_version" != Google\ Chrome\ * ]]; then
      echo "The browser at $candidate is not Google Chrome: $chrome_version" >&2
      exit 1
    fi
    printf 'system_chrome=%s\nversion=%s\n' "$candidate" "$chrome_version"
    exit 0
  fi
done

echo "Google Chrome is required for every browser gate and was not found at: ${chrome_candidates[*]}." >&2
echo "Install the official Google Chrome package on the runner; bundled Chromium is not a supported fallback." >&2
exit 1

