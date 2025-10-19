# MedReady AI - AI Copilot Instructions

## Project Overview
**MedReady AI** is a comprehensive healthcare workforce readiness platform designed for rural India. It combines AI-powered learning, emergency medical guidance, blockchain-verified certifications, and rural deployment matching to train and deploy healthcare workers in underserved areas.

**Tech Stack**: Next.js 15 (App Router), React 19, TypeScript (strict), Supabase (PostgreSQL + Auth), Anthropic Claude Sonnet 4.5, Vercel AI SDK, Tailwind CSS, shadcn/ui

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

### Environment Variables
```env
# Supabase (public - exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Providers (server-only - NEVER expose to client)
ANTHROPIC_API_KEY=sk-ant-xxx              # Required: Claude Sonnet 4.5
EXA_API_KEY=xxx                           # Required: Medical web search
AI_GATEWAY_API_KEY=xxx                    # Optional: Vercel AI Gateway

# Redis Cache (server-only - optional but recommended)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

**Important**: Store in `.env.local` (gitignored). Never commit API keys to version control.

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

## Debugging Common Issues

### "Unauthorized" API Errors
```typescript
// Always check user auth first in API routes
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### RLS Policy Not Working
- Verify table has RLS enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
- Check policy matches pattern: `auth.uid() = user_id`
- Test in Supabase SQL Editor with different users
- Use service role key (bypasses RLS) only for admin operations

### AI Streaming Issues
- Ensure `convertToModelMessages()` is used for Vercel AI SDK format
- Check `ANTHROPIC_API_KEY` is set and valid
- Verify `toUIMessageStreamResponse()` includes `originalMessages` parameter
- Monitor rate limits (Claude Sonnet 4.5: 50 req/min)

### Spaced Repetition Not Triggering
- Question hash must be consistent (use exact same question JSON)
- Check `next_review_date` is in the past for items due
- Verify PostgreSQL functions exist: `update_spaced_repetition`, `get_due_reviews`
- Quality score must be 0-5 (validate on client side)

### Cache Not Working
- Verify Upstash Redis credentials in `.env.local`
- Check Redis connection: `redis.ping()`
- Cache keys follow pattern: `medready:module:content:{moduleId}`
- TTL set to 28800 seconds (8 hours)

## Performance Optimization Tips

### Database Queries
```typescript
// ✅ Good: Select only needed columns
const { data } = await supabase
  .from("modules")
  .select("id, title, category")
  
// ❌ Bad: Select all columns when not needed
const { data } = await supabase.from("modules").select("*")
```

### AI Responses
```typescript
// ✅ Good: Use streaming for long responses
const result = streamText({ model, system, messages })
return result.toUIMessageStreamResponse()

// ❌ Bad: Wait for full response (slow UX)
const result = await generateText({ model, system, messages })
return NextResponse.json({ text: result.text })
```

### Component Rendering
- Use React Server Components for static content (faster initial load)
- Use Client Components only when needed (interactivity, hooks)
- Implement loading states with Suspense boundaries
- Lazy load heavy components with `dynamic()` from `next/dynamic`

## Security Best Practices

### Never Expose Server-Only Data
```typescript
// ✅ Good: API route checks auth
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // ... rest of logic
}

// ❌ Bad: Client component accesses sensitive data directly
// Don't do this - always go through authenticated API routes
```

### Input Validation
```typescript
// ✅ Good: Validate and sanitize user input
import { z } from "zod"

const schema = z.object({
  moduleId: z.string().uuid(),
  score: z.number().min(0).max(100),
})

const validated = schema.parse(requestData)
```

### Rate Limiting (Future Enhancement)
- Add rate limiting middleware for API routes
- Use Upstash Redis for distributed rate limiting
- Implement per-user quotas for AI features

## Deployment Checklist

### Pre-Deploy
- [ ] Run `pnpm build` - ensure no build errors
- [ ] Run `pnpm test` - all tests passing
- [ ] Check `.env.local` has all required variables
- [ ] Verify Supabase migrations are applied
- [ ] Test authentication flow end-to-end
- [ ] Verify AI chat works with real API keys

### Vercel Deployment
- [ ] Push code to GitHub main branch
- [ ] Import project to Vercel
- [ ] Add all environment variables (use Vercel dashboard)
- [ ] Enable "Automatically expose System Environment Variables"
- [ ] Set Node.js version to 18+ in project settings
- [ ] Configure custom domain (optional)
- [ ] Monitor initial deployment for errors

### Post-Deploy
- [ ] Test production URL in incognito mode
- [ ] Verify database connections work
- [ ] Check AI features respond correctly
- [ ] Test authentication (sign up, login, logout)
- [ ] Monitor Vercel Analytics for errors
- [ ] Set up Supabase database backups

## Useful Commands

```bash
# Development
pnpm dev                    # Start dev server on localhost:3000
pnpm build                  # Create production build
pnpm start                  # Start production server

# Testing
pnpm test                   # Run all tests (excludes slow API tests)
pnpm test:all               # Run ALL tests including slow ones
pnpm test:watch             # Watch mode for TDD
pnpm test:coverage          # Generate coverage report
pnpm test:components        # Test only UI components
pnpm test:lib               # Test only library functions

# Database (PowerShell)
.\scripts\seed_database.ps1 # Seed demo data
node scripts/seed_demo_data.js # Alternative seeding method

# Linting
pnpm lint                   # Run ESLint
pnpm lint --fix             # Auto-fix linting issues
```

## Quick Reference: File Locations

| Task | File Path |
|------|-----------|
| Add API route | `app/api/[name]/route.ts` |
| Add page | `app/[name]/page.tsx` |
| Add component | `components/[name].tsx` |
| Add UI component | `components/ui/[name].tsx` |
| Add type | `lib/types.ts` |
| Add AI prompt | `prompts/[category].ts` |
| Add database migration | `scripts/0XX_description.sql` |
| Add test | `__tests__/[category]/[name].test.ts` |
| Configure AI | `lib/ai-provider.ts` |
| Configure Supabase | `lib/supabase/server.ts` or `client.ts` |

## Documentation

- **README.md**: Comprehensive project documentation for users/contributors
- **AGENTS.md** (this file): AI Copilot instructions for development assistance
- See inline code comments for function-specific documentation
- Database schema documented in migration files (`scripts/*.sql`)

---

**Last Updated**: October 19, 2025
**Version**: 0.2.0
**Maintainer**: Devaansh Pathak
