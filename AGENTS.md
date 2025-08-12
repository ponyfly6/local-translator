# Repository Guidelines

## Project Structure & Module Organization
- `entrypoints/`: WXT entrypoints — `background.ts`, `content.ts`, and `popup/` (React UI: `main.tsx`, `App.tsx`, styles).
- `lib/`: Reusable modules (e.g., `lib/dom-translator.ts`). Avoid placing helpers in `entrypoints/`.
- `assets/`, `public/`: Static assets and icons; build output in `.output/`.
- Config: `wxt.config.ts`, `tsconfig.json`, `bun.lock`.

## Build, Test, and Development Commands
- `bun install`: Install dependencies (Bun is the package manager).
- `bun run dev`: Start WXT dev server (Chrome MV3) with hot reload.
- `bun run build`: Production build to `.output/chrome-mv3/`.
- `bun run zip`: Package the built extension as a distributable zip.
- `bun run compile`: Type-check TypeScript (no emit).

## Coding Style & Naming Conventions
- TypeScript + React 19; prefer functional components and hooks.
- Indentation: 2 spaces; avoid `any`; enable strict typing per `tsconfig.json`.
- Files: React components `PascalCase.tsx`; utilities `camelCase.ts` under `lib/`.
- Entry files must default-export WXT wrappers: `defineBackground`, `defineContentScript`.
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`); keep component styles co-located in `popup/`.

## Testing Guidelines
- No test runner is configured yet. Keep units small and pure to ease adding Vitest later (`*.test.ts` / `*.test.tsx`).
- Run `bun run compile` before PRs and validate the extension manually in Chrome.

## Commit & Pull Request Guidelines
- Commits: follow Conventional Commits (e.g., `feat: ...`, `fix: ...`).
- PRs: include a clear description, linked issues, screenshots of the popup (when UI changes), reproduction steps, and risk notes.
- CI not configured; ensure `bun run build` passes locally and attach zips if relevant.

## Security & Configuration Tips
- Chrome Translator API requires Chrome ≥ 138 desktop; code guards against absence via feature checks.
- Don’t place secrets in repo; extension runs client-side. Review content script selectors before expanding scope.
