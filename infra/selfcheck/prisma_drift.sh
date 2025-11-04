#!/usr/bin/env bash
set -euo pipefail
[ -f prisma/schema.prisma ] || exit 0
AUDIT_DIR="${AUDIT_DIR:-docs/audit}"; mkdir -p "$AUDIT_DIR"
npx prisma generate || true
npx prisma validate || true
if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" \
    --script > "$AUDIT_DIR/prisma_diff.sql" || true
  echo "Generated prisma diff (non-destructive) → $AUDIT_DIR/prisma_diff.sql"
fi
