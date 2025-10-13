# MedReady AI - Copilot Instructions

## Project Overview
Healthcare workforce readiness platform for rural India with AI-powered learning, emergency guidance, and deployment orchestration. Built with Next.js 15 (App Router), Supabase, and Vercel AI SDK with Claude Sonnet 4.5.

## Architecture Patterns

### Authentication & Data Access
- **All protected routes** use middleware authentication (`/dashboard`, `/learn`, `/chat`, `/certifications`, `/deployments`)
- **Server components**: Use `await createClient()` from `@/lib/supabase/server`
- **Client components**: Use `createClient()` from `@/lib/supabase/client`
- **RLS is enforced** on all tables - every query automatically filters by `auth.uid() = user_id`
- Auth pattern: Always verify `user.id` matches requested `userId` in API routes before processing

### AI Integration
- **Primary model**: `getClaude('claude-sonnet-4-5-20250929')` from `@/lib/ai-provider`
- **Streaming chat**: Use `streamText()` with `convertToModelMessages()` for multi-turn conversations (see `/api/chat/route.ts`)
- **Non-streaming**: Use `generateText()` or `generateObject()` for structured responses
- **Tools**: Medical web search via `medicalWebSearch` tool (Exa.ai with trusted domains: WHO, CDC, MOHFW, ICMR, NIH)
- **Context-aware prompts**: Chat API uses category-specific system prompts (general, emergency, maternal, pediatric, infectious, drugs)

### Database Patterns
- **TypeScript types**: All table schemas in `lib/types.ts` - use these interfaces for type safety
- **Supabase RPC**: Complex operations use PostgreSQL functions (e.g., `analyze_weak_areas`, `update_study_streak`, `check_achievements`)
- **Data flow**: Client → API Route → Supabase (server) → RLS filters by user → Return data
- **Migrations**: SQL scripts in `/scripts/` numbered 001-011 (run in order)

### Component Architecture
- **Enhanced features**: See `components/assessment-quiz-enhanced.tsx` for spaced repetition, bookmarks, timed quizzes
- **Social learning**: Progress sharing via `progress_shares` table with RLS for privacy (public/friends/specific)
- **Gamification**: Study streaks, achievements, points tracked in dedicated tables

## Development Workflow

### Running the Project
```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm test             # Run all tests
pnpm test:watch       # Watch mode for TDD
pnpm test:coverage    # Coverage report
```

### Testing Conventions
- **Comprehensive test suite** in `__tests__/` covering API, components, database, and integration
- **Mock setup**: `jest.setup.js` mocks Next.js router, Supabase client, and environment variables
- **Database tests**: Mock RLS policies and RPC functions (see `__tests__/database/functions.test.ts`)
- **Run specific test**: `pnpm test -- --testPathPattern=spaced-repetition`

### Environment Variables (Required)
```env
# Supabase (public - exposed to client)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

# AI Providers (server-only)
ANTHROPIC_API_KEY              # Claude models
AI_GATEWAY_API_KEY            # Vercel AI Gateway (optional)
EXA_API_KEY                   # Medical web search

# Redis Cache (server-only)
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Code Conventions

### API Route Structure
```typescript
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // RLS automatically filters by user.id
  const { data } = await supabase.from("table_name").select("*")
  return NextResponse.json(data)
}
```

### AI Streaming Response
```typescript
import { streamText, convertToModelMessages } from "ai"
import { getClaude } from "@/lib/ai-provider"

const result = streamText({
  model: getClaude('claude-sonnet-4-5-20250929'),
  system: contextPrompt,
  messages: convertToModelMessages(messages), // Convert UIMessage[] format
  tools: { medicalWebSearch },
  temperature: 0.2,
})

return result.toUIMessageStreamResponse({ originalMessages: messages })
```

### Spaced Repetition Pattern
- Hash questions with `crypto.createHash('sha256').update(JSON.stringify(question)).digest('hex')`
- Store in `spaced_repetition` table with ease_factor, interval_days, next_review_date
- Quality scores: 0-5 (0=complete blackout, 5=perfect recall)
- Algorithm: SuperMemo SM-2 implemented in PostgreSQL functions

### Progress Sharing
- Create shares in `progress_shares` with `share_type`: 'public', 'friends', 'specific'
- RLS allows: `auth.uid() = user_id OR auth.uid() = shared_with_user_id OR share_type = 'public'`
- Peer connections in `peer_connections` with status: 'pending', 'accepted', 'blocked'

## Key Files Reference
- **AI Configuration**: `lib/ai-provider.ts` (Claude setup with extended thinking option)
- **Type Definitions**: `lib/types.ts` (all table schemas and enums)
- **Authentication Middleware**: `middleware.ts` + `lib/supabase/middleware.ts`
- **Chat API**: `app/api/chat/route.ts` (multi-turn streaming with tools)
- **Database Schema**: `scripts/001_create_schema.sql` (base tables + RLS policies)
- **Learning Features**: `scripts/010_add_learning_features.sql` (spaced repetition, bookmarks, social)

## Common Tasks

**Add a new API endpoint with auth**:
1. Create route in `app/api/[name]/route.ts`
2. Import `createClient` from `@/lib/supabase/server`
3. Verify user with `await supabase.auth.getUser()`
4. RLS handles data isolation automatically

**Add a new database table**:
1. Create migration in `scripts/0XX_description.sql`
2. Add type definition to `lib/types.ts`
3. Enable RLS: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
4. Add policies for user isolation (see existing tables as examples)

**Implement AI feature**:
1. Use `getClaude()` for consistency
2. Add category-specific system prompt if needed (see chat API)
3. Include `medicalWebSearch` tool for evidence-based responses
4. Stream responses for chat interfaces with `toUIMessageStreamResponse()`

## Project-Specific Notes
- **Medical focus**: Target rural Indian healthcare workers - consider resource limitations in prompts
- **Trusted sources**: Web search only queries WHO, CDC, MOHFW, ICMR, medical journals
- **Redis caching**: Module content cached 8 hours, shorter due to web search freshness requirements
- **No vector DB**: Uses Exa.ai's live web search for up-to-date medical knowledge
- **TypeScript strict mode**: Enabled with `"strict": true` - handle all nullable types
- **Next.js config**: Build errors ignored (`ignoreBuildErrors: true`) for rapid iteration
