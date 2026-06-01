#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

STAGED_FILES=()
while IFS= read -r file; do
  [ -n "$file" ] && STAGED_FILES+=("$file")
done < <(git diff --cached --name-only --diff-filter=ACMR)

if [ "${#STAGED_FILES[@]}" -eq 0 ]; then
  printf 'No staged files to auto-fix.\n'
  exit 0
fi

UNSTAGED_FILES=()
while IFS= read -r file; do
  [ -n "$file" ] && UNSTAGED_FILES+=("$file")
done < <(git diff --name-only --diff-filter=ACMR)

PARTIAL_FILES=()
if [ "${#UNSTAGED_FILES[@]}" -gt 0 ]; then
  for staged_file in "${STAGED_FILES[@]}"; do
    for unstaged_file in "${UNSTAGED_FILES[@]}"; do
      if [ "$staged_file" = "$unstaged_file" ]; then
        PARTIAL_FILES+=("$staged_file")
        break
      fi
    done
  done
fi

if [ "${#PARTIAL_FILES[@]}" -gt 0 ]; then
  printf 'Pre-commit auto-fix stopped because these files are partially staged:\n'
  printf ' - %s\n' "${PARTIAL_FILES[@]}"
  printf 'Please fully stage or stash those files, then commit again.\n'
  exit 1
fi

ESLINT_FILES=()
PRETTIER_FILES=()
RUST_FILES=()
NEEDS_BINDINGS=0

for file in "${STAGED_FILES[@]}"; do
  case "$file" in
    *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs)
      ESLINT_FILES+=("$file")
      PRETTIER_FILES+=("$file")
      ;;
    *.css|*.html|*.json|*.md|*.yml|*.yaml)
      PRETTIER_FILES+=("$file")
      ;;
  esac

  case "$file" in
    src-tauri/*.rs|src-tauri/*/*.rs|src-tauri/*/*/*.rs)
      RUST_FILES+=("$file")
      NEEDS_BINDINGS=1
      ;;
    src-tauri/Cargo.toml|src-tauri/src/*|src-tauri/src/*/*)
      NEEDS_BINDINGS=1
      ;;
  esac
done

if [ "${#PRETTIER_FILES[@]}" -gt 0 ]; then
  printf '\n==> Auto-fixing formatting\n'
  bunx prettier --write "${PRETTIER_FILES[@]}"
fi

if [ "${#ESLINT_FILES[@]}" -gt 0 ]; then
  printf '\n==> Auto-fixing lint issues\n'
  bunx eslint --fix --max-warnings=0 --no-warn-ignored "${ESLINT_FILES[@]}"
fi

if [ "${#RUST_FILES[@]}" -gt 0 ]; then
  printf '\n==> Auto-formatting Rust\n'
  cargo fmt --manifest-path src-tauri/Cargo.toml --all
fi

if [ "$NEEDS_BINDINGS" -eq 1 ]; then
  printf '\n==> Refreshing generated bindings\n'
  bun run generate:bindings
fi

CHECK_FILES=("${STAGED_FILES[@]}")
if [ "$NEEDS_BINDINGS" -eq 1 ]; then
  CHECK_FILES+=("src/bindings.ts")
fi

CHANGED_FILES=()
while IFS= read -r file; do
  [ -n "$file" ] && CHANGED_FILES+=("$file")
done < <(git diff --name-only -- "${CHECK_FILES[@]}")

if [ "${#CHANGED_FILES[@]}" -gt 0 ]; then
  printf '\nAuto-fix updated these files:\n'
  printf ' - %s\n' "${CHANGED_FILES[@]}"
  printf 'Please review them, stage them, and run commit again.\n'
  exit 1
fi

printf '\nAuto-fix stage completed.\n'
