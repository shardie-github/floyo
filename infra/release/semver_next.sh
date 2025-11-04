#!/usr/bin/env bash
set -euo pipefail

# Compute next semver tag based on bump type
LAST="$(git describe --tags --abbrev=0 2>/dev/null || echo 'v0.0.0')"
base="${LAST#v}"
IFS='.' read -r MA MI PA <<<"$base"
MA="${MA:-0}"
MI="${MI:-0}"
PA="${PA:-0}"

TYPE="${1:-patch}"

case "$TYPE" in
  major)
    MA=$((MA+1))
    MI=0
    PA=0
    ;;
  minor)
    MI=$((MI+1))
    PA=0
    ;;
  patch|*)
    PA=$((PA+1))
    ;;
esac

echo "v${MA}.${MI}.${PA}"
