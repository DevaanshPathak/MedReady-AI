# MedReady AI – Copilot Instructions

## Project Snapshot
- **Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Auth), shadcn/ui components
- **AI**: Vercel AI SDK with xAI Grok models (`xai/grok-4-fast-reasoning`), Exa.ai for medical knowledge search
- **Package Manager**: pnpm (enforced via `packageManager` in package.json)
- **Architecture**: Server components in `app/**/`, client components in `components/` (marked `"use client"`), API routes in `app/api/**/route.ts`

## Build & Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
```
- **Note**: `next.config.mjs` sets `ignoreDuringBuilds: true` for ESLint/TypeScript—always run `pnpm lint` locally before committing
- No automated tests exist; manually verify auth, chat, module progression, emergency assistant flows

## Authentication & Supabase Patterns

### Server Components (app/**/page.tsx)
```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect("/auth/login")
```

### Client Components (components/**)
```typescript
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
// Never import @supabase/supabase-js directly
```

### Middleware Protection
- `middleware.ts` + `lib/supabase/middleware.ts` protect: `/dashboard`, `/learn`, `/chat`, `/certifications`, `/deployments`
- Add new protected routes to `protectedPaths` array in `lib/supabase/middleware.ts`

## Database Schema & Table Name Gotchas

**Canonical Tables** (from `scripts/001_create_schema.sql`):
- `profiles` (NOT `user_profiles`) – user info
- `modules` (NOT `learning_modules`) – training content  
- `progress` (NOT `module_progress`) – user completion tracking
- `assessments`, `assessment_attempts` – quizzes
- `certifications` – digital certificates
- `deployments` – rural job postings
- `chat_sessions`, `chat_messages` – AI chat history

**Legacy Name References**: Some API routes/pages still use old names (`user_profiles`, `learning_modules`, `assessment_results`, `emergency_alerts.status`). Always verify actual table names against migration files before writing queries.

**RLS Enforcement**: Row-level security is enabled on all tables. API routes MUST authenticate with `supabase.auth.getUser()` before queries or writes will silently fail.

**Profile Auto-Creation**: `scripts/003_create_profile_trigger.sql` automatically creates `profiles` rows on signup via trigger—no manual insertion needed.

## AI Workflows

### Chat Endpoint (`app/api/completion/route.ts`)
- **Primary**: `/api/completion` – active chat system, stores messages in `chat_messages`, returns streaming responses
- **Legacy**: `/api/chat` – older flow using `useChat`, kept for compatibility
- **Request payload**: `{ prompt, userId, category, role?, specialization?, location? }`
- **Model**: `xai/grok-4-fast-reasoning` via Vercel AI SDK
- **Tools**: `medicalWebSearch` from `lib/web-search-tool.ts` integrates Exa.ai for real-time medical knowledge
- **System prompts**: Category-specific prompts in route file (general, emergency, maternal, pediatric, infectious, drugs)

### Structured Generators (Vercel AI SDK + Zod)
All use `generateObject()` with xAI Grok models:
- `generate-module-content` → `module_content_cache`
- `generate-assessment` → `assessments`
- `deployment-recommendations` → returns structured JSON
- `emergency-guidance` → `emergency_consultations`

**Pattern for new endpoints**:
```typescript
import { generateObject } from "ai"
import { z } from "zod"

const schema = z.object({ /* ... */ })
const { object } = await generateObject({
  model: "xai/grok-4-fast-reasoning",
  schema,
  prompt: "...",
  temperature: 0.8,
})
```

### Exa.ai Medical Search
- Client: `lib/exa-client.ts` (`getExaClient()`)
- Tool: `lib/web-search-tool.ts` (`medicalWebSearch`, `emergencyWebSearch`)
- Trusted domains: WHO, CDC, NIH, ICMR (India), MOHFW (India), medical journals
- Handle missing `EXA_API_KEY` gracefully—return empty results or actionable error

## UI & Styling Conventions

### Component Reuse
- Import shadcn primitives from `components/ui/` (Button, Card, Dialog, etc.)
- Compose classes with `cn()` helper from `lib/utils`
- `DashboardNav` component provides consistent chrome for authenticated views

### Theming
- `ThemeProvider` in `app/layout.tsx` enables light/dark mode
- System preference sync enabled
- Custom palette: Medical Blue `#0066CC`, Healthcare Green `#00A86B`, Alert Orange `#FF6B35`

### Markdown Rendering in Chat
`components/chat-interface.tsx` uses `react-markdown` + `remark-gfm` + `react-syntax-highlighter`:
```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {content}
</ReactMarkdown>
```

## Environment Variables

**Required**:
```env
NEXT_PUBLIC_SUPABASE_URL=           # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase anon key
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=  # Local signup redirect
EXA_API_KEY=                        # Exa.ai for medical search
POSTGRES_URL=                       # Direct DB connection (Vercel)
```

**Vercel AI SDK** (auto-configured via Vercel AI Gateway or direct keys)

## Database Setup Workflow

1. **Apply migrations sequentially** in Supabase SQL editor:
   - `001_create_schema.sql` – core tables
   - `003_create_profile_trigger.sql` – auto-create profiles on signup
   - `005_create_chat_tables.sql` – chat sessions/messages
   - `008_add_ai_tables.sql` – AI cache tables
   - `009_create_test_users.sql` – seed demo accounts (requires `pgcrypto` extension for `crypt()`)

2. **Test users** (from 009):
   - `admin@medready.test` / `admin123`
   - `worker@medready.test` / `worker123`
   - `institution@medready.test` / `institution123`

3. **Keep TypeScript types in sync**: Update `lib/types.ts` when schema changes

## Common Debugging Patterns

### RLS Failures
- Check Supabase logs → "permission denied for table X"
- Verify `auth.getUser()` returns user with matching `userId` in request body
- Confirm user session is valid (middleware refreshes on each request)

### API Route Logs
- Heavy console logging already present in all API routes
- Trim or gate logs before production deployment
- Look for: "AI generated response:", "Executing medical web search", auth errors

### Chat Not Loading
- Verify `chat_sessions` and `chat_messages` tables exist
- Check `currentSessionId` prop passed to `ChatInterface`
- Inspect browser console for Supabase errors

## Key Files Reference

| File | Purpose |
|------|---------|
| `lib/supabase/{server,client,middleware}.ts` | Supabase client factories |
| `lib/web-search-tool.ts` | Exa.ai tool integration for AI |
| `lib/exa-client.ts` | Exa client singleton |
| `lib/types.ts` | TypeScript types mirroring DB schema |
| `app/api/completion/route.ts` | Primary chat endpoint |
| `components/chat-interface.tsx` | Main chat UI (client component) |
| `components/dashboard-nav.tsx` | Shared authenticated layout chrome |
| `scripts/001_create_schema.sql` | Canonical table definitions |
