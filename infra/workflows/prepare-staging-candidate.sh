#!/usr/bin/env bash

set -euo pipefail

test ! -e promotion-candidate
mkdir -p promotion-candidate/artifacts
cp -R .artifacts/. promotion-candidate/artifacts/
cp deployment-manifest.sha256 promotion-candidate/deployment-manifest.sha256
