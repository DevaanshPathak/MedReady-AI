# MedReady AI – Copilot Instructions

## Project snapshot
- Next.js App Router with TypeScript; styling via Tailwind and shadcn/ui primitives under `components/ui`.
- Core layouts live in `app/**` server components; client-only widgets (chat, emergency assistant, module player) sit in `components/` and are marked with `"use client"`.
- Supabase handles auth + data; shared helpers for browser/server clients are in `lib/supabase/`.

## Build & run
- Use pnpm (lockfile present): `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`.
- `next.config.mjs` skips lint/type failures during build—run `pnpm lint` locally before committing to catch regressions.

## Auth & Supabase usage
- Server components/pages create an authenticated client with `createClient` from `lib/supabase/server` and redirect unauthenticated users using `redirect("/auth/login")`.
- Client components call `lib/supabase/client`; never import `@supabase/supabase-js` directly.
- Middleware (`middleware.ts` + `lib/supabase/middleware.ts`) refreshes sessions and blocks access to `/dashboard`, `/learn`, `/chat`, `/certifications`, `/deployments`; keep new protected routes inside that matcher list.

## Data model quirks
- SQL migrations (`scripts/001_create_schema.sql` etc.) define canonical tables: `profiles`, `modules`, `progress`, `assessments`, `deployments`, `certifications`, `chat_messages`, etc.
- Several pages/API routes still reference legacy names (`user_profiles`, `module_progress`, `learning_modules`, `assessment_results`, `emergency_alerts.status`). Confirm actual table names/columns before writing queries and align with the migrations when possible.
- RLS is enabled everywhere—API routes must authenticate via Supabase before accessing tables or inserts will fail silently.

## AI workflows
- `/app/api/completion` is the live chat endpoint: validates the Supabase user, stores both sides of the conversation in `chat_messages`, and streams `gpt-4o` responses. Requests expect `prompt`, `userId`, `category`, plus optional role/specialization/location.
- `/app/api/chat` still exists for the older `useChat` flow; keep payload handling consistent if you revive it.
- Structured generators (`generate-module-content`, `generate-assessment`, `deployment-recommendations`, `emergency-guidance`) wrap Grok models with zod schemas; follow that pattern for new AI endpoints and persist results to the related tables (`module_content_cache`, `assessments`, `emergency_consultations`, etc.).

## UI conventions
- Reuse shadcn components from `components/ui`; compose utility classes with the `cn` helper in `lib/utils`.
- Global theming comes from `ThemeProvider` in `app/layout.tsx`; new layouts should remain inside this provider to inherit dark/light switching.
- `DashboardNav` provides the shared chrome for authenticated views—import it on any new dashboard-style route for consistency.

## Environment & integrations
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` (local signup), Vercel AI keys for GPT‑4o and xAI Grok models, and `EXA_API_KEY` for `lib/exa-client`.
- Exa integration targets trusted medical domains (see `lib/exa-client.ts`); handle missing keys by surfacing actionable errors instead of crashing.

## Database workflow
- Apply SQL files in `scripts/` sequentially via Supabase SQL editor (001 → 009). `003_create_profile_trigger.sql` auto-creates `profiles` rows on signup; `009_create_test_users.sql` seeds demo accounts (ensure the `pgcrypto` extension for `crypt`).
- Keep schema changes mirrored in both migrations and TypeScript types under `lib/types.ts` to prevent drift.

## Debugging tips
- Console logging is already heavy in API routes—trim or gate logs when shipping to production.
- When RLS blocks a query, check the Supabase logs and ensure `auth.getUser()` returned the same `userId` you’re using in the request body.
- No automated tests exist; smoke-test critical flows (signup/login, chat, module progression, emergency assistant) whenever touching their APIs.
