# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router entry; `page.tsx` renders the chat surface and `layout.tsx` sets shared wrappers. Route handlers live under `app/api/*` and forward to the Dify API.
- UI is split in `app/components` (chat, sidebar, welcome, workflow, base primitives) with CSS modules or Tailwind classes; shared styles in `app/styles`. Conversation logic sits in `hooks/use-conversation.ts`; responsive helpers in `hooks/use-breakpoints.ts`.
- `config/index.ts` centralizes app metadata and env-driven settings; `service/` wraps REST/SSE calls; `utils/` and `types/` provide helpers and shared models; `i18n/` stores language packs; static assets are in `public/`.

## Build, Test, and Development Commands
- Use `pnpm` (see `packageManager` field). Install with `pnpm install`.
- `pnpm dev` runs the Next dev server on :3000. `pnpm build` creates the production bundle; `pnpm start` serves it. `pnpm lint` runs Next/ESLint; `pnpm fix` autofixes style issues. Husky is prepared via `pnpm prepare` and runs `lint-staged` on staged JS/TS files.
- Docker: `docker build . -t <repo>/webapp-conversation:latest` then `docker run -p 3000:3000 ...`.

## Coding Style & Naming Conventions
- TypeScript-first; import via the `@/*` path alias. Prefer function components with hooks.
- ESLint (`eslint.config.mjs`) enforces 2-space indent, single quotes, and no semicolons; React Hooks rules are enabled. Keep directories kebab-case and export components in PascalCase.
- Use Tailwind utilities plus local CSS modules when needed; keep shared theme edits in `tailwind.config.js` and `app/styles/globals.css`.

## Testing Guidelines
- No automated tests are present yet; add them alongside new work. Prefer `*.test.ts`/`*.test.tsx` colocated with the module or under `__tests__/`.
- Cover conversation flows (message streaming, conversation naming) and API wrappers in `service/`; mock external requests to avoid hitting real Dify endpoints.
- When you add a test runner (e.g., Vitest/Jest), wire it into `package.json` as `pnpm test` and document any setup.

## Commit & Pull Request Guidelines
- Follow the existing short, imperative commit style (`bump up @mixtint/streamdown`, `pnpm upgrade`); keep subject lines concise.
- For PRs, include: purpose/context, linked issue, how to validate (commands run such as `pnpm lint`), and screenshots or clips for UI changes. Note any env/config updates (`.env.local`, `config/index.ts`) and migration steps.
- Keep diffs focused; favor smaller, reviewable PRs and ensure new text is localized via `i18n/lang/*` when relevant.

## Environment & Security Notes
- Copy `.env.example` to `.env.local` and fill `NEXT_PUBLIC_APP_ID`, `NEXT_PUBLIC_APP_KEY`, and `NEXT_PUBLIC_API_URL`; avoid committing secrets.
- Default app metadata and language are in `config/index.ts`; adjust there rather than scattering constants.
- Do not log API keys or conversation payloads; redact sensitive data before adding telemetry or debugging output.
