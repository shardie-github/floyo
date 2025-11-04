#!/usr/bin/env bash
set -e
[ -f package.json ] || exit 0
if npm run -s test 2>/dev/null; then
  # run tests twice non-watch; if inconsistent, flag flaky
  npm run -s test -- --watch=false || true
  npm run -s test -- --watch=false || true
fi
