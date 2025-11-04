#!/usr/bin/env bash
set -euo pipefail

# Generate CHANGELOG.md from git log since last tag
LAST_TAG="$(git describe --tags --abbrev=0 2>/dev/null || echo '')"

if [ -z "$LAST_TAG" ]; then
  echo "# Changelog" > CHANGELOG.md
  echo "" >> CHANGELOG.md
  echo "## All Changes" >> CHANGELOG.md
  echo "" >> CHANGELOG.md
  git log --pretty=format:'* %s (%h)' >> CHANGELOG.md
else
  echo "# Changelog" > CHANGELOG.md
  echo "" >> CHANGELOG.md
  echo "## Changes since $LAST_TAG" >> CHANGELOG.md
  echo "" >> CHANGELOG.md
  git log "$LAST_TAG"..HEAD --pretty=format:'* %s (%h)' >> CHANGELOG.md
fi

# Also create RELEASE_NOTES.md
cp CHANGELOG.md RELEASE_NOTES.md

echo "Generated CHANGELOG.md and RELEASE_NOTES.md"
