#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_step() {
  local label="$1"
  shift

  printf '\n==> %s\n' "$label"
  "$@"
}

run_step "Checking formatting" bun run format:check
run_step "Linting code" bun run lint
run_step "Type-checking TypeScript" bun run typecheck
run_step "Running frontend tests" bun run test:run
run_step "Building frontend" bun run build
run_step "Running Rust checks" bun run check:rust
run_step "Refreshing generated bindings" bun run generate:bindings

if ! git diff --quiet -- src/bindings.ts; then
  printf '\nBindings changed during pre-commit.\n'
  printf 'Please review and stage %s before committing.\n' "src/bindings.ts"
  exit 1
fi

printf '\nStrict pre-commit checks passed.\n'
