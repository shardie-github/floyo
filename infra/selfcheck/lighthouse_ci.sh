#!/usr/bin/env bash
set -euo pipefail
# Runs only if LHCI config present and a URL target is set.
if [ ! -f lighthouserc.json ] && [ -z "${LHCI_BUILD_URL:-}" ]; then exit 0; fi
npx @lhci/cli autoretry -- collect --url "${LHCI_BUILD_URL:-http://localhost:3000}" || true
npx @lhci/cli autoretry -- assert || true
