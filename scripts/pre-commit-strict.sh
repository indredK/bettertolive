#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Collect staged files for formatting check.
STAGED_FILES=()
while IFS= read -r file; do
  [ -n "$file" ] && STAGED_FILES+=("$file")
done < <(git diff --cached --name-only --diff-filter=ACMR)

PRETTIER_FILES=()
if [ "${#STAGED_FILES[@]}" -gt 0 ]; then
  for file in "${STAGED_FILES[@]}"; do
    case "$file" in
      *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.css|*.html|*.json|*.md|*.yml|*.yaml)
        PRETTIER_FILES+=("$file")
        ;;
    esac
  done
fi

run_step() {
  local label="$1"
  shift

  printf '\n==> %s\n' "$label"
  "$@"
}

if [ "${#PRETTIER_FILES[@]}" -gt 0 ]; then
  run_step "Checking formatting" bunx prettier --check "${PRETTIER_FILES[@]}"
else
  printf '\nNo staged files need formatting check.\n'
fi
run_step "Linting code" bun run lint
run_step "Type-checking TypeScript" bun run typecheck
run_step "Building frontend" bun run build:bundle
run_step "Running Rust checks" bun run check:rust
run_step "Refreshing generated bindings" bun run generate:bindings

if ! git diff --quiet -- src/bindings.ts; then
  printf '\nBindings changed during pre-commit.\n'
  printf 'Please review and stage %s before committing.\n' "src/bindings.ts"
  exit 1
fi

printf '\nStrict pre-commit checks passed.\n'
