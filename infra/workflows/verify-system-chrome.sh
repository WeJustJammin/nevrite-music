#!/usr/bin/env bash

# Every browser gate in this repository runs Google Chrome, the browser the
# operator and the release evidence actually exercise. Playwright's chrome
# channel launches a fixed installer path per platform, so these guards target
# that exact binary and fail closed instead of silently degrading to a
# distribution wrapper launcher or a bundled Chromium download.
set -euo pipefail

case "$(uname -s)" in
  Linux)
    chrome_executable=/opt/google/chrome/chrome
    ;;
  Darwin)
    chrome_executable='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    ;;
  *)
    echo "Google Chrome resolution is not pinned for this platform." >&2
    exit 1
    ;;
esac

if [[ $# -gt 0 ]]; then
  chrome_executable="$1"
fi

if [[ ! -x "$chrome_executable" ]]; then
  echo "Google Chrome is required for every browser gate and was not found at $chrome_executable." >&2
  echo "Install the official Google Chrome package on the runner; bundled Chromium is not a supported fallback." >&2
  exit 1
fi

# Chrome logs a channel banner to stderr on some installs; only stdout carries
# the version line this guard parses, so keep the guard's own stderr clean.
chrome_version="$("$chrome_executable" --version 2>/dev/null)"
if [[ "$chrome_version" != Google\ Chrome\ * ]]; then
  echo "The browser at $chrome_executable is not Google Chrome: $chrome_version" >&2
  exit 1
fi

printf 'system_chrome=%s\nversion=%s\n' "$chrome_executable" "$chrome_version"
