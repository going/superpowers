#!/usr/bin/env bash
# Run the DeepSeek Harness (dsh) plugin wire-up tests.
#
# These are dependency-free Node tests: they import .dsh-plugin/index.js with a
# fake Cordis context, so no dsh installation, profile, or model access is
# needed. Live acceptance is documented in docs/README.dsh.md.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "error: node is required to run the DSH plugin tests" >&2
  exit 1
fi

cd "$REPO_ROOT"
echo "Running DeepSeek Harness plugin tests..."
node --test tests/dsh/
