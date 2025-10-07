# MedReady AI - Healthcare Workforce Readiness Platform

A comprehensive AI-powered platform for healthcare workforce training, deployment intelligence, and emergency response coordination, built for MumbaiHacks 2025.

## Features

### 1. Adaptive Learning System
- Interactive learning modules covering Emergency Response, Maternal Health, Pediatrics, and Infectious Diseases
- Progress tracking with automatic save functionality
- **🧠 Spaced Repetition Algorithm** - SM-2 based intelligent review scheduling
- **⏱️ Timed Quiz Mode** - Practice under pressure with countdown timer and pause/resume
- **📌 Bookmarking Questions** - Save difficult questions with personal notes
- **👥 Social Learning** - Share progress with peers and build learning community
- Timed assessments with instant scoring
- Section-by-section content navigation

### 2. AI-Powered Knowledge Sync
- Real-time medical chatbot powered by OpenAI GPT-4
- Context-aware responses based on user role and specialization
- Searchable knowledge base with latest medical protocols
- Drug interaction information and treatment guidelines
- Evidence-based medical information following Indian healthcare protocols

### 3. Rural Deployment Intelligence
- AI-powered deployment recommendations based on skills and regional needs
- Match scoring system for optimal healthcare worker placement
- Active deployment tracking and management
- Impact metrics and analytics

### 4. Emergency Response Orchestrator
- Real-time emergency alert system
- Severity-based alert categorization (critical, high, medium)
- Response coordination and tracking
- Emergency history and resolution metrics

### 5. Digital Certification System
- Blockchain-verified healthcare credentials
- Automatic certificate generation upon module completion
- Certificate expiry tracking and renewal reminders
- Verification system for credential authenticity

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4 via Vercel AI SDK
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed.
- Supabase account and project
- OpenAI API key (optional, uses Vercel AI Gateway by default)

### Installation

1. Clone the repository
2. Install dependencies (using pnpm):
   \`\`\`bash
   pnpm install
   \`\`\`

3. Set up environment variables (already configured in Vercel):
   - Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
   - Database connection strings (POSTGRES_URL, etc.)

4. Run the database migrations:
   - Execute scripts in order: 001 through 009
   - Scripts are located in the `/scripts` folder

5. Start the development server:
   \`\`\`bash
   pnpm dev
   \`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

## Testing

This project has comprehensive test coverage with Jest and React Testing Library.

### Running Tests

\`\`\`bash
# Run all tests
pnpm test

# Run tests in watch mode (development)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests in CI mode
pnpm test:ci
\`\`\`

### Test Coverage

- **40 unit tests** covering components, utilities, and pages
- **100% pass rate** - All tests passing
- **Coverage thresholds**: 50% for branches, functions, lines, and statements

See [TESTING.md](./TESTING.md) for detailed testing documentation.

### CI/CD Pipeline

All code changes are automatically tested via GitHub Actions:

- ✅ **Dependency Security Check** - `pnpm audit` for vulnerabilities
- ✅ **Lint Check** - ESLint code quality verification
- ✅ **Type Check** - TypeScript compilation validation
- ✅ **Unit Tests** - Jest test suite with coverage
- ✅ **Build Verification** - Next.js production build
- ✅ **CodeQL Analysis** - Security vulnerability scanning
- ✅ **Dependency Review** - Automated dependency updates via Dependabot

![CI Tests](https://github.com/your-username/medready-ai/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/your-username/medready-ai/actions/workflows/codeql.yml/badge.svg)

## Database Schema

The platform uses a comprehensive PostgreSQL schema with Row Level Security:

- **user_profiles**: Healthcare worker profiles with role, specialization, and location
- **learning_modules**: Training content organized by category and difficulty
- **module_progress**: User progress tracking with completion status
- **assessments**: Quiz results and scoring
- **certifications**: Digital certificates with verification hashes
- **rural_deployments**: Deployment opportunities and assignments
- **emergency_alerts**: Real-time emergency notifications
- **chat_sessions**: AI chat history and context
- **knowledge_base**: Medical protocols and guidelines

## Key Features Implementation

### Theme System
- Light/dark mode toggle synced with system preferences
- Custom color palette: Medical Blue (#0066CC), Healthcare Green (#00A86B), Alert Orange (#FF6B35)
- Consistent theming across all pages and components

### Mobile-First Design
- Optimized for mobile screens with responsive layouts
- Touch-friendly interface elements
- Mobile navigation with bottom tab bar
- Efficient data loading and caching

### Security
- Row Level Security (RLS) enabled on all tables
- Supabase Auth with email/password authentication
- Secure session management with middleware
- Protected routes and API endpoints

## Project Structure

\`\`\`
├── .github/
│   ├── workflows/         # GitHub Actions CI/CD pipelines
│   └── dependabot.yml     # Automated dependency updates
├── __tests__/             # Jest unit tests
│   ├── components/        # Component tests
│   ├── lib/               # Utility tests
│   └── app/               # Page tests
├── app/                   # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── learn/             # Learning modules
│   ├── chat/              # AI chat interface
│   ├── deployments/       # Deployment intelligence
│   ├── emergency/         # Emergency response
│   ├── certifications/    # Digital certificates
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility functions and Supabase clients
├── scripts/               # Database migration scripts
├── public/                # Static assets
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Test environment setup
└── TESTING.md             # Testing documentation
\`\`\`

## Team

- **Akshat**: AI/Backend Development
- **Devaansh**: Frontend/Data Engineering

## License

Built for MumbaiHacks 2025 - Healthcare Innovation Track
