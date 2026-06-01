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
- `bun run test:run` - run the Vitest suite once
- `bun run analyze:bundle` - build with a bundle report in analyze mode
- `bun run changeset` - create a versioning note for the next release
- `bun run version:packages` - apply pending changesets and update versions
- `bun run generate:bindings` - refresh TypeScript bindings generated from Rust commands
- `bun run check:rust` - run rustfmt, clippy, and cargo check

## Quality Gates

- ESLint with TypeScript, React Hooks, and TanStack rules
- Prettier with Tailwind class sorting
- Vitest with Testing Library and happy-dom
- Tauri Specta bindings generated into `src/bindings.ts`
- Husky, lint-staged, and commitlint
- GitHub Actions CI for frontend and Rust checks
- Changesets, Dependabot, and release workflow scaffolding
