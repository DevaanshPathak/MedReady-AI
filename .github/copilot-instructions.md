# MedReady AI – Copilot Instructions

## Project Snapshot
- **Stack**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase (PostgreSQL + Auth), shadcn/ui components
- **AI**: Vercel AI SDK with xAI Grok models (`xai/grok-4-fast-reasoning`), Exa.ai for medical knowledge search
- **Testing**: Jest + React Testing Library (40 tests, 100% pass rate)
- **CI/CD**: GitHub Actions (lint, type-check, test, build, security scanning)
- **Package Manager**: pnpm 10.18.0 (enforced via `packageManager` in package.json)
- **Architecture**: Server components in `app/**/`, client components in `components/` (marked `"use client"`), API routes in `app/api/**/route.ts`

## Build & Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # Run ESLint
pnpm test             # Run Jest tests (40 tests)
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
```
- **Note**: `next.config.mjs` sets `ignoreDuringBuilds: true` for ESLint/TypeScript—always run `pnpm lint` locally before committing
- **Testing**: Comprehensive test suite with Jest + React Testing Library covering components, utilities, and pages
- **CI/CD**: GitHub Actions automatically run tests on every push/PR

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

**Advanced Learning Features** (from `scripts/010_add_learning_features.sql`):
- `spaced_repetition` – SM-2 algorithm for review scheduling (ease_factor, interval_days, next_review_date)
- `bookmarked_questions` – User-saved questions with notes
- `progress_shares` – Shared achievements (public/friends/specific)
- `peer_connections` – User network connections (pending/accepted/blocked status)
- `quiz_sessions` – Session state for timed/practice/spaced_repetition modes

**Legacy Name References**: Some API routes/pages still use old names (`user_profiles`, `learning_modules`, `assessment_results`, `emergency_alerts.status`). Always verify actual table names against migration files before writing queries.

**RLS Enforcement**: Row-level security is enabled on all tables. API routes MUST authenticate with `supabase.auth.getUser()` before queries or writes will silently fail.

**Profile Auto-Creation**: `scripts/003_create_profile_trigger.sql` automatically creates `profiles` rows on signup via trigger—no manual insertion needed.

**PostgreSQL Functions**:
- `calculate_next_review(quality, ease_factor, interval, repetitions)` – SM-2 algorithm for spaced repetition
- `update_spaced_repetition(user_id, question_id, module_id, quality)` – Update review schedule after answering

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
   - `001_create_schema.sql` – core tables (profiles, modules, progress, assessments, certifications, deployments)
   - `003_create_profile_trigger.sql` – auto-create profiles on signup
   - `005_create_chat_tables.sql` – chat sessions/messages
   - `008_add_ai_tables.sql` – AI cache tables (module_content_cache, emergency_consultations)
   - `009_create_test_users.sql` – seed demo accounts (requires `pgcrypto` extension for `crypt()`)
   - `010_add_learning_features.sql` – advanced learning features (spaced_repetition, bookmarks, social)

2. **Test users** (from 009):
   - `admin@medready.test` / `admin123`
   - `worker@medready.test` / `worker123`
   - `institution@medready.test` / `institution123`

3. **Keep TypeScript types in sync**: Update `lib/types.ts` when schema changes

## Advanced Learning Features

### Components
- `components/assessment-quiz-enhanced.tsx` – Enhanced quiz with 3 modes:
  - **Practice Mode**: Untimed learning with bookmarks
  - **Timed Mode**: Countdown timer, pause/resume, auto-submit
  - **Spaced Repetition Mode**: Focus on due reviews using SM-2 algorithm
- `components/progress-social.tsx` – Social features:
  - Activity feed showing peer achievements
  - Peer connection management (send/accept requests)
  - Share progress (public/friends/specific visibility)

### Key Features
1. **🧠 Spaced Repetition** – SM-2 algorithm schedules reviews at optimal intervals (1d → 6d → exponential)
2. **⏱️ Timed Quiz** – Practice under pressure with countdown timer and auto-submit
3. **📌 Bookmarks** – Save difficult questions with personal notes
4. **👥 Social Learning** – Connect with peers, share achievements, view activity feed

### Usage Pattern
```tsx
import { AssessmentQuizEnhanced } from "@/components/assessment-quiz-enhanced"
import { ProgressSocial } from "@/components/progress-social"

// Enhanced quiz with all features
<AssessmentQuizEnhanced
  assessment={assessment}
  userId={userId}
  moduleId={moduleId}
/>

// Social features
<ProgressSocial userId={userId} moduleId={moduleId} />
```

### Spaced Repetition Flow
1. User answers question with quality score (0-5)
2. Call `update_spaced_repetition()` PostgreSQL function
3. Function calculates new ease_factor, interval_days using SM-2
4. Sets next_review_date = NOW() + interval
5. "Review" mode shows only questions due for review

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
| `components/assessment-quiz-enhanced.tsx` | Enhanced quiz with spaced repetition, timed mode, bookmarks |
| `components/progress-social.tsx` | Social learning features (peers, sharing, activity feed) |
| `components/dashboard-nav.tsx` | Shared authenticated layout chrome |
| `scripts/001_create_schema.sql` | Canonical table definitions |
| `scripts/010_add_learning_features.sql` | Advanced learning features schema |

## Documentation Reference

| Document | Purpose |
|----------|---------|
| `README.md` | Main project documentation, features overview, setup instructions |
| `ARCHITECTURE.md` | System architecture diagrams, data flows, component hierarchy |
| `LEARNING_FEATURES.md` | Complete technical documentation for spaced repetition, bookmarks, social features |
| `TESTING.md` | Testing guide, examples, troubleshooting, best practices |

## Testing Guidelines

### Running Tests
```bash
pnpm test              # Run all 40 tests
pnpm test:watch        # Watch mode for development
pnpm test:coverage     # Generate coverage report (50% threshold)
```

### Test Coverage
- **Components**: Button, Card, Input, UI primitives
- **Utilities**: cn() function, Supabase client
- **Pages**: Login, Sign up authentication flows
- **Libraries**: Supabase mocks, Next.js navigation mocks

### Writing New Tests
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  
  it('handles user interaction', async () => {
    const user = userEvent.setup()
    render(<Component />)
    await user.click(screen.getByRole('button'))
    expect(mockFn).toHaveBeenCalled()
  })
})
```

### Mocks Available
- `next/navigation`: useRouter, usePathname, redirect
- `@/lib/supabase/client`: Full Supabase client with auth and database methods
- See `jest.setup.js` for all global mocks

## CI/CD Pipeline

### GitHub Actions Workflows
1. **ci.yml** – Main pipeline (runs on push/PR):
   - Dependency security check (`pnpm audit`)
   - Lint (`pnpm lint`)
   - Type check (`pnpm tsc --noEmit`)
   - Unit tests (`pnpm test:ci`)
   - Build verification (`pnpm build`)
   - Coverage upload (Codecov)

2. **dependency-review.yml** – PR dependency checks:
   - Reviews new dependencies for vulnerabilities
   - Checks license compliance
   - Auto-comments on PRs

3. **codeql.yml** – Security analysis:
   - Weekly scans for vulnerabilities
   - JavaScript/TypeScript security checks
   - Generates GitHub Security alerts

4. **dependabot.yml** – Automated updates:
   - Weekly dependency update PRs
   - Groups related packages (testing, Supabase, UI)
   - Security patches

### Required GitHub Secrets
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
CODECOV_TOKEN (optional)
```
