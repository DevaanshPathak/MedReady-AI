# MedReady AI – Copilot Guide

## Quick facts
- Next.js 15 App Router + TypeScript + Tailwind v4 with shadcn/ui primitives in `components/ui/**`.
- Supabase provides auth + Postgres; always create the client via `@/lib/supabase/{server,client}` helpers.
- Vercel AI SDK calls xAI Grok models; Exa.ai search lives in `lib/web-search-tool.ts`.
- Package manager is pnpm (`pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm test:ci`).

## Architecture patterns
- Server components live under `app/**`; client components declare `"use client"` and sit in `components/**`.
- Route handlers are `app/api/**/route.ts`; they must fetch the authenticated user before touching Supabase tables (RLS enforced).
- `middleware.ts` + `lib/supabase/middleware.ts` gate `/dashboard`, `/learn`, `/chat`, `/certifications`, `/deployments`; extend `protectedPaths` when adding secure routes.
- UI chrome (`components/dashboard-nav.tsx`, `components/theme-provider.tsx`) is shared across authenticated views to keep layout consistent.

## Data + migrations
- Canonical tables: `profiles`, `modules`, `progress`, `assessments`, `assessment_attempts`, `certifications`, `deployments`, `chat_sessions`, `chat_messages` (beware older names in legacy code).
- Advanced learning features (`spaced_repetition`, `bookmarked_questions`, `progress_shares`, `peer_connections`, `quiz_sessions`) come from `scripts/010_add_learning_features.sql` and drive enhanced quiz + social UI.
- Re-run migrations in numeric order (`scripts/001_*.sql` → `010_*.sql`) when schema drifts; Supabase trigger in `003_create_profile_trigger.sql` auto-creates `profiles` rows.
- Keep `lib/types.ts` aligned with schema, otherwise API responses and component props will drift.

## AI flows
- Primary chat endpoint: `app/api/completion/route.ts` (streams responses, stores in `chat_messages`, enriches with `medicalWebSearch`).
- Legacy `/api/chat` still exists for backward compatibility; prefer extending `/completion` pattern using `generateObject` + Zod schemas.
- Exa integration filters to trusted medical domains; handle missing `EXA_API_KEY` by returning empty arrays (see `lib/web-search-tool.ts`).

## Feature hotspots
- `components/assessment-quiz-enhanced.tsx` orchestrates practice/timed/spaced-repetition quizzes, calling Supabase RPCs for SM-2 updates.
- `components/progress-social.tsx` surfaces peer activity and progress sharing built on `progress_shares` + `peer_connections` tables.
- Theme + markdown rendering: `app/layout.tsx` wraps `ThemeProvider`; `components/chat-interface.tsx` uses `react-markdown`, `remark-gfm`, and syntax highlighting for AI responses.

## Debug + testing
- RLS issues usually mean `supabase.auth.getUser()` failed—log the user object before queries to confirm.
- Jest is configured via `jest.config.js` with setup mocks in `jest.setup.js` (Next navigation, Supabase client, window APIs).
- CI (`.github/workflows/ci.yml`) runs lint → type-check → `pnpm test:ci` → `pnpm build`; match that sequence locally when diagnosing pipeline failures.

## Environment + secrets
- Required env keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`, `EXA_API_KEY`, `POSTGRES_URL`.
- Commit-time lint/type errors are ignored by Next build (`ignoreDuringBuilds: true`), so always run `pnpm lint` + `pnpm test` before pushing.
