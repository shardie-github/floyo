#!/usr/bin/env bash
set -euo pipefail

# Bundle release artifacts: investor pack, SBOMs, checksums
echo "Creating release bundle..."

mkdir -p dist dist/SBOM

# Generate Node.js SBOM if package.json exists
if [ -f "frontend/package.json" ] || [ -f "package.json" ]; then
  echo "Generating Node.js SBOM..."
  npx --yes @cyclonedx/cyclonedx-npm@1 --output-format json --output-file dist/SBOM/sbom-node.json 2>/dev/null || \
    echo "⚠ Node.js SBOM generation skipped (missing tool or dependencies)"
fi

# Generate Python SBOM if requirements.txt or pyproject.toml exists
if [ -f "requirements.txt" ] || [ -f "backend/requirements.txt" ] || [ -f "pyproject.toml" ]; then
  echo "Generating Python SBOM..."
  python3 -m pip install --quiet cyclonedx-bom==4.1.6 >/dev/null 2>&1 || true
  cyclonedx-py --format json --outfile dist/SBOM/sbom-py.json 2>/dev/null || \
    echo "⚠ Python SBOM generation skipped (missing tool or dependencies)"
fi

# Create investor pack ZIP
if [ -d "docs/audit_investor_suite" ]; then
  echo "Bundling investor pack..."
  zip -qr dist/investor_pack.zip docs/audit_investor_suite || echo "⚠ Investor pack creation failed"
fi

# Generate checksums
echo "Generating checksums..."
(cd dist && find . -type f -not -name SHA256SUMS.txt -exec sha256sum {} \; | tee SHA256SUMS.txt || echo "⚠ Checksum generation failed")

echo "Release bundle created in dist/"
