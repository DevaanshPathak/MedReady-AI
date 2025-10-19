# 🏥 MedReady AI

> **AI-Powered Healthcare Workforce Readiness Platform for Rural India**

A comprehensive learning and deployment platform designed to train, certify, and deploy healthcare workers in underserved rural areas of India. Built with Next.js 15, Supabase, and Claude AI.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase)](https://supabase.com/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude%20Sonnet%204.5-purple)](https://www.anthropic.com/)

---

## 🌟 Features

### 🎓 AI-Powered Learning
- **Adaptive Learning Modules**: 8+ medical training modules with AI-generated content
- **Smart Assessments**: Practice and certification quizzes with instant feedback
- **Spaced Repetition**: Intelligent review system to reinforce weak areas
- **Study Streaks & Gamification**: Daily challenges, achievements, and leaderboards
- **Bookmarking**: Save important questions and concepts for later review

### 💬 AI Medical Assistant
- **Real-time Chat**: Claude Sonnet 4.5 with medical expertise
- **Extended Thinking**: See AI's reasoning process for complex questions
- **Live Web Search**: Real-time searches of WHO, CDC, ICMR, NIH, and trusted medical sources
- **Context-Aware**: Specialized prompts for emergency, maternal, pediatric care
- **Multi-turn Conversations**: Maintains context across chat sessions

### 🚑 Emergency Guidance
- **Instant AI Support**: Step-by-step protocols for medical emergencies
- **Evidence-Based**: Recommendations backed by WHO/CDC guidelines
- **Offline-Ready**: Critical protocols available without internet

### 📜 Digital Certifications
- **Blockchain-Verified**: Tamper-proof certificates on Ethereum
- **Instant Verification**: QR codes for credential checking
- **Career Advancement**: Track progress toward advanced certifications

### 🗺️ Rural Deployment Matching
- **AI Recommendations**: Match healthcare workers to rural opportunities
- **State-wide Coverage**: Deployments across all Indian states
- **Transparent Applications**: Track application status in real-time

### 📊 Social Learning
- **Peer Connections**: Connect with fellow healthcare workers
- **Progress Sharing**: Share achievements with friends or publicly
- **Collaborative Learning**: Learn from the community's experiences

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+ (tested with v24.5.0)
- **pnpm**: v10.18.0+ (recommended package manager)
- **Supabase Account**: [Sign up free](https://supabase.com/)
- **Anthropic API Key**: [Get from Anthropic](https://console.anthropic.com/)
- **Exa API Key**: [For medical web search](https://exa.ai/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DevaanshPathak/MedReady-AI.git
   cd MedReady-AI
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase (public - exposed to client)
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   
   # AI Providers (server-only)
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   EXA_API_KEY=your_exa_key_here
   
   # Optional: Redis Cache (Upstash)
   UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   
   # Optional: AI Gateway (Vercel)
   AI_GATEWAY_API_KEY=your_gateway_key
   ```

4. **Set up Supabase database**
   
   Run migrations in order via Supabase SQL Editor:
   ```bash
   # Required migrations
   scripts/001_create_schema.sql          # Core tables
   scripts/003_create_profile_trigger.sql # Auto profile creation
   
   # Optional feature migrations
   scripts/005_create_chat_tables.sql                # Enhanced chat
   scripts/008_add_ai_tables.sql                     # AI caching
   scripts/010_add_learning_features.sql             # Spaced repetition
   scripts/011_add_streaks_and_gamification.sql      # Gamification
   ```

5. **Seed demo data (optional)**
   ```powershell
   # Windows PowerShell
   .\scripts\seed_database.ps1
   
   # Or with Node.js
   node scripts/seed_demo_data.js
   ```

6. **Run development server**
   ```bash
   pnpm dev
   ```

7. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 📁 Project Structure

```
MedReady-AI/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API routes
│   │   ├── chat/                 # AI chat endpoint
│   │   ├── generate-certificate/ # Blockchain certificates
│   │   ├── recommendations/      # Deployment matching
│   │   └── ...                   # Other endpoints
│   ├── dashboard/                # Main dashboard
│   ├── learn/                    # Learning modules
│   ├── chat/                     # AI assistant
│   ├── emergency/                # Emergency protocols
│   ├── certifications/           # Certificates
│   └── deployments/              # Rural deployments
│
├── components/                   # React components
│   ├── chat-interface.tsx        # AI chat UI
│   ├── assessment-quiz-enhanced.tsx # Spaced repetition
│   ├── progress-social.tsx       # Social learning
│   └── ui/                       # shadcn/ui components
│
├── lib/                          # Core utilities
│   ├── ai-provider.ts            # Claude AI setup
│   ├── web-search-tool.ts        # Medical web search
│   ├── types.ts                  # TypeScript definitions
│   ├── redis.ts                  # Caching layer
│   └── supabase/                 # Auth & database
│
├── prompts/                      # AI system prompts
│   ├── chat/                     # Category-specific prompts
│   └── emergency-guidance.ts     # Emergency protocols
│
├── scripts/                      # Database setup
│   ├── 001_create_schema.sql     # Core tables
│   └── ...                       # Migration files
│
└── __tests__/                    # Comprehensive test suite
    ├── api/                      # API tests
    ├── components/               # Component tests
    ├── lib/                      # Utility tests
    └── integration/              # E2E tests
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pnpm test

# Watch mode (for development)
pnpm test:watch

# Coverage report
pnpm test:coverage

# Test specific category
pnpm test:components    # UI components
pnpm test:lib           # Library functions
```

### Test Coverage

- **API Routes**: Chat streaming, certificates, recommendations, gamification
- **Components**: Quiz enhanced, social progress, buttons, cards
- **Database**: RLS policies, triggers, PostgreSQL functions
- **Integration**: E2E workflows, learning features, authentication

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Server Components)
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + Supabase realtime
- **Markdown**: react-markdown + remark-gfm
- **Charts**: Recharts

### Backend
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth (email/password, OAuth)
- **API**: Next.js API routes (RESTful)
- **Caching**: Upstash Redis (optional)

### AI & ML
- **LLM**: Anthropic Claude Sonnet 4.5
- **Framework**: Vercel AI SDK (streaming, tool calling)
- **Web Search**: Exa.ai (medical domain-specific)
- **Embeddings**: Not used (live search instead)

### Blockchain
- **Network**: Ethereum (for certificate verification)
- **Libraries**: ethers.js (certificate hashing)

### DevOps
- **Package Manager**: pnpm
- **Testing**: Jest + React Testing Library
- **Type Checking**: TypeScript (strict mode)
- **Linting**: ESLint + Next.js config

---

## 🔐 Security & Privacy

### Row-Level Security (RLS)
- All database tables enforce RLS policies
- Users can only access their own data (`auth.uid() = user_id`)
- Public data (modules, assessments) is read-only
- Shared progress respects privacy settings (public/friends/specific)

### API Authentication
- Middleware protects all `/dashboard`, `/learn`, `/chat` routes
- Server components use `@/lib/supabase/server` for auth
- Client components use `@/lib/supabase/client` with automatic token refresh

### Data Protection
- Sensitive API keys stored in environment variables (server-only)
- No API keys exposed to client-side code
- Supabase handles password hashing and token management

---

## 🌐 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Vercel auto-detects Next.js

3. **Add environment variables**
   - Copy all variables from `.env.local`
   - Add to Vercel project settings
   - Mark sensitive keys as "Sensitive" (hidden in logs)

4. **Deploy**
   - Vercel automatically deploys on push
   - Production URL: `https://your-project.vercel.app`

### Other Platforms

- **Railway**: Supports Next.js + PostgreSQL
- **Netlify**: Use `next export` for static export
- **AWS Amplify**: Full-stack deployment
- **Self-hosted**: Docker + nginx

---

## 📚 Key Concepts

### AI Chat Features

**Extended Thinking**: Enable to see Claude's step-by-step reasoning
```typescript
// In chat header, toggle "Thinking" mode
// Purple blocks show internal reasoning process
```

**Live Web Search**: Automatically searches trusted medical sources
```typescript
// Blue blocks show search results from WHO, CDC, ICMR, etc.
// Click to expand and see sources
```

**Stop Generation**: Cancel long responses mid-stream
```typescript
// Red "Stop" button appears during streaming
// Preserves partial response
```

### Spaced Repetition Algorithm

Uses SuperMemo SM-2 for optimal review scheduling:
- **Quality 0-2**: Review again immediately
- **Quality 3-5**: Increase interval (1d → 6d → 14d → 30d...)
- **Ease Factor**: Adjusts based on recall difficulty
- **Implementation**: PostgreSQL functions for efficiency

### Gamification System

- **Daily Activities**: Track daily learning time, quizzes completed
- **Study Streaks**: Consecutive days of activity
- **Achievements**: Unlock badges for milestones
- **Leaderboards**: (Future) Compare with peers

---

## 🛠️ Development Tips

### Adding a New Feature

1. **Create migration** (if database changes needed)
   ```sql
   -- scripts/012_new_feature.sql
   CREATE TABLE new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can access own data"
     ON new_table FOR ALL
     USING (auth.uid() = user_id);
   ```

2. **Add TypeScript types** in `lib/types.ts`
   ```typescript
   export interface NewFeature {
     id: string
     user_id: string
     created_at: string
   }
   ```

3. **Create API route** in `app/api/new-feature/route.ts`
   ```typescript
   import { createClient } from "@/lib/supabase/server"
   
   export async function GET(request: Request) {
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     
     if (!user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
     }
     
     const { data } = await supabase.from("new_table").select("*")
     return NextResponse.json(data)
   }
   ```

4. **Write tests** in `__tests__/api/new-feature.test.ts`

### Debugging Tips

- **Check Supabase logs**: Dashboard → Logs → API/Database
- **Use React DevTools**: Inspect component state
- **Enable verbose logging**: Add `console.log` in API routes
- **Test RLS policies**: Use Supabase SQL Editor with different users

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Write/update tests**
5. **Commit** (`git commit -m 'Add amazing feature'`)
6. **Push** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style (TypeScript strict mode)
- Write tests for new features
- Update documentation (this README or AGENTS.md)
- Ensure all tests pass (`pnpm test`)
- Keep commits atomic and descriptive

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

- **Devaansh Pathak** - Creator & Lead Developer

---

## 🙏 Acknowledgments

- **Anthropic** - Claude AI models
- **Supabase** - Backend infrastructure
- **Vercel** - AI SDK and hosting
- **shadcn/ui** - Beautiful UI components
- **WHO, CDC, ICMR** - Medical guidelines and resources

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DevaanshPathak/MedReady-AI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DevaanshPathak/MedReady-AI/discussions)
- **Email**: devaanshpathak@example.com (update with real email)

---

## 🗺️ Roadmap

### Q4 2025
- [ ] Mobile app (React Native)
- [ ] Offline mode for emergency protocols
- [ ] Voice-based AI assistant (Hindi + regional languages)
- [ ] Video learning modules

### Q1 2026
- [ ] Telemedicine consultations
- [ ] Community forums
- [ ] Advanced analytics dashboard
- [ ] Integration with government health systems

### Q2 2026
- [ ] Multi-language support (10+ Indian languages)
- [ ] AR/VR training simulations
- [ ] Wearable device integration
- [ ] National certification program

---

## 📊 Project Status

- ✅ **Core Platform**: Complete
- ✅ **AI Chat**: Complete with extended thinking & web search
- ✅ **Learning System**: Complete with spaced repetition
- ✅ **Gamification**: Complete with streaks & achievements
- ✅ **Certifications**: Complete with blockchain verification
- ✅ **Deployments**: Complete with AI recommendations
- 🚧 **Mobile App**: In planning
- 🚧 **Offline Mode**: In planning

---

**Built with ❤️ for rural healthcare workers in India**

*Making healthcare accessible, one trained worker at a time.*
