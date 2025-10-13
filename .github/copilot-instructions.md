# MedReady AI – Copilot Guide

## Stack & tooling
- Next.js 15 App Router + TypeScript + Tailwind v4. Client components live in `components/**` and must declare `"use client"`; server components and routes stay under `app/**`.
- UI primitives come from `components/ui/**` (shadcn/Radix) with `class-variance-authority`; reuse existing variants instead of restyling from scratch.
- Package manager is pnpm. Core commands: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm test:ci`, `pnpm build`.

## Supabase & auth
- Instantiate Supabase via `lib/supabase/{server,client}.ts`; server handlers must `await createClient()` and call `supabase.auth.getUser()` before any query because RLS is enforced everywhere.
- `middleware.ts` and `lib/supabase/middleware.ts` gate `/dashboard`, `/learn`, `/chat`, `/certifications`, `/deployments`; extend `protectedPaths` when introducing new secure routes.
- Shared chrome lives in `components/dashboard-nav.tsx` and `components/theme-provider.tsx` (hooked from `app/layout.tsx`)—keep layouts consistent across gated routes.

## AI flows
- `app/api/completion/route.ts` is the main chat pipeline: build the context prompt, call `generateText` with `getModel("xai/grok-4-fast-reasoning")`, and rely on the `medicalWebSearch` tool first (`stepCountIs(5)` stops the loop). It stores messages in `chat_sessions`/`chat_messages` before and after generation.
- `lib/web-search-tool.ts` wraps Exa; on missing `EXA_API_KEY` it must return an empty array, not throw. Preserve the trusted domain filter and 1,000-character content clipping when extending search.

## Data & migrations
- Canonical tables span learning + engagement: `profiles`, `modules`, `progress`, `assessments`, `assessment_attempts`, `quiz_sessions`, `spaced_repetition`, `bookmarked_questions`, `progress_shares`, `peer_connections`, `user_gamification`, `weak_areas`, `recommendations`.
- SQL migrations live in `scripts/*.sql`; run them numerically (`001_…` → `011_…`) and keep `lib/types.ts` synchronized with schema updates to avoid drift between APIs and UI types.
- Supabase trigger in `003_create_profile_trigger.sql` auto-creates `profiles` rows—do not duplicate that logic in app code.

## Feature hotspots
- `components/assessment-quiz-enhanced.tsx` coordinates practice/timed/spaced repetition, persists state to Supabase, invokes RPC `update_spaced_repetition`, and chains `/api/gamification`, `/api/streaks`, `/api/generate-certificate` after submission.
- Dashboard cards (`study-streak-card.tsx`, `gamification-card.tsx`, `weak-areas-card.tsx`, `recommendations-card.tsx`) depend on the SQL functions and tables introduced in `011_add_streaks_and_gamification.sql`; any data shape changes must keep those endpoints in sync.
- API routes follow `auth check → Supabase RPC/query → JSON response` (see `app/api/gamification/route.ts`, `app/api/weak-areas/route.ts`). Mirror that pattern for new handlers to keep auth + RLS behavior predictable.

## Testing & debugging
- Jest config lives at `jest.config.js`; `jest.setup.js` mocks Supabase clients, Next navigation, fetch, and timers. Run `pnpm lint && pnpm test:ci` before PRs to match CI (`.github/workflows/ci.yml` runs lint → type-check → tests → build).
- For auth/RLS issues, log `supabase.auth.getUser()` and confirm cookies flow through `lib/supabase/middleware.ts`. Frontend Supabase calls should reuse the singleton from `lib/supabase/client.ts` to keep session cookies intact.

## Environment
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL`, `EXA_API_KEY`, `AI_GATEWAY_API_KEY`, `POSTGRES_URL`.
- Next.js build (`next.config.mjs`) ignores lint/type errors, so keep local lint + tests green before shipping.
