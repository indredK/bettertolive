# bettertolive

A local-first Tauri desktop app built with React, TypeScript, Tailwind CSS, and Bun.

## Stack

- Tauri 2
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Bun

## Requirements

- Bun 1.3+
- Rust stable toolchain
- Tauri system prerequisites for your OS

## Scripts

- `bun run dev` - start the Vite dev server
- `bun run start` - start the Tauri desktop app in development
- `bun run build` - run TypeScript checks and build the frontend
- `bun run lint` - run ESLint
- `bun run format` - format the project with Prettier
- `bun run fix:precommit` - auto-fix staged files before the strict commit gate
- `bun run check:precommit` - run the full strict pre-commit gate
- `bun run analyze:bundle` - build with a bundle report in analyze mode
- `bun run generate:bindings` - refresh TypeScript bindings generated from Rust commands
- `bun run check:rust` - run rustfmt, clippy, and cargo check

## Quality Gates

- ESLint with TypeScript, React Hooks, and TanStack rules
- Prettier with Tailwind class sorting
- Vitest with Testing Library and happy-dom
- Tauri Specta bindings generated into `src/bindings.ts`
- Husky, strict pre-commit scripts, and commitlint
- GitHub Actions CI for frontend and Rust checks
- Cross-platform Tauri verify on pull requests
- Release Please, Dependabot, and bench-style release pipeline
