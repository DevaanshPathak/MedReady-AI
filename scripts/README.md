# MedReady AI - Database Setup Guide

This directory contains all database migration scripts and seeding utilities for the MedReady AI platform.

## 📋 Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set up your `.env` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. **Node.js**: Version 18+ (tested with v24.5.0)

## 🗂️ Migration Scripts (Run in Order)

| Script | Description | Status |
|--------|-------------|--------|
| `001_create_schema.sql` | Core tables (profiles, modules, progress, assessments, certifications, deployments, emergency_alerts, chat) | **Required** |
| `003_create_profile_trigger.sql` | Auto-create profile on user signup | **Required** |
| `005_create_chat_tables.sql` | Additional chat structures and knowledge_updates table | Optional |
| `008_add_ai_tables.sql` | AI-specific tables (module_content_cache, emergency_consultations) | Optional |
| `010_add_learning_features.sql` | Spaced repetition, bookmarks, social learning, quiz sessions | Optional |
| `011_add_streaks_and_gamification.sql` | Study streaks, achievements, gamification | Optional |

## 🚀 Quick Start

### Option 1: Supabase Dashboard (Recommended for Beginners)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Copy and paste each migration script **in order**
4. Click **Run** for each script
5. Run the seeding script: `.\scripts\seed_database.ps1`

### Option 2: Supabase CLI (Recommended for Development)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push

# Or run individual migrations
psql -h db.YOUR_PROJECT_ID.supabase.co -p 5432 -d postgres -U postgres -f scripts/001_create_schema.sql
```

### Option 3: PowerShell Script (Windows)

```powershell
# Note: This validates the files but recommends using Supabase Dashboard or CLI
.\scripts\run_all_migrations.ps1
```

## 🌱 Seeding Demo Data

After running migrations, populate the database with realistic demo data:

```powershell
# Windows PowerShell
.\scripts\seed_database.ps1

# Or directly with Node.js
node scripts/seed_demo_data.js
```

### What Gets Seeded

- **8 Learning Modules**: Emergency Medicine, Maternal Health, Pediatric Nutrition, Infectious Disease Management, Mental Health First Aid, Diabetes Management, Hypertension Control, Tuberculosis Detection
- **16 Assessments**: Practice quizzes and final assessments for each module
- **25 Rural Deployments**: Healthcare opportunities across Indian states
- **4 Emergency Alerts**: Disease outbreaks, seasonal advisories, supply shortages, vaccination drives
- **6 Knowledge Updates**: Latest medical guidelines from WHO, ICMR, MOHFW (requires `005_create_chat_tables.sql`)

### Warning

**The seeding script will DELETE ALL existing data** except:
- User accounts (auth.users)
- User profiles (profiles table)

## 🔍 Troubleshooting

### Tables Not Found Errors

If you see errors like:
```
⚠️ Could not find the table 'public.quiz_sessions' in the schema cache
```

**Solutions:**
1. Run the missing migration script (e.g., `010_add_learning_features.sql`)
2. Refresh Supabase schema cache:
   - Dashboard → SQL Editor → Run: `NOTIFY pgrst, 'reload schema';`
3. Restart your Supabase project (Dashboard → Settings → General → Restart)

### RLS Policy Errors

If seeding fails with permission errors:
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not the anon key)
- Service role key bypasses RLS and has full access

### Connection Timeouts

- Check your network connection
- Verify Supabase project is running (not paused)
- Ensure firewall allows connections to Supabase

## 📊 Table Dependencies

```
auth.users (Supabase managed)
  ↓
profiles
  ↓
modules → assessments
  ↓         ↓
progress  assessment_attempts → certifications
  ↓
deployments → deployment_applications
  ↓
emergency_alerts

chat_sessions → chat_messages
knowledge_updates (standalone)

Gamification tables:
study_streaks, daily_activities, weak_areas, recommendations
achievements → user_achievements

Social learning:
peer_connections, progress_shares

Learning features:
spaced_repetition, bookmarked_questions, quiz_sessions
```

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with policies that:
- **User data**: Accessible only by the owning user (`auth.uid() = user_id`)
- **Public data**: Modules, assessments, deployments, emergency alerts (read-only for authenticated users)
- **Shared data**: Progress shares with configurable privacy (public/friends/specific users)

## 🛠️ Development Tips

### Reset Database

To start fresh (⚠️ **destroys all data**):
1. Supabase Dashboard → Database → Tables
2. Delete all tables except `auth.*` and `storage.*`
3. Re-run all migration scripts
4. Re-run seeding script

### Add New Tables

1. Create new migration file: `scripts/0XX_description.sql`
2. Include table definition with RLS policies
3. Add indexes for performance
4. Update `lib/types.ts` with TypeScript types
5. Document in this README

### Test Migrations Locally

```bash
# Start local Supabase (requires Docker)
supabase start

# Apply migrations
supabase db reset

# Test your application
pnpm dev
```

## 📚 Related Documentation

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Project AGENTS.md](../AGENTS.md) - AI Copilot instructions
- [QUICK_START.md](../QUICK_START.md) - Application setup guide

## 🤝 Contributing

When adding new migrations:
1. Number them sequentially (e.g., `012_new_feature.sql`)
2. Include rollback instructions in comments
3. Test with `supabase db reset` before committing
4. Update this README with table descriptions
5. Add TypeScript types to `lib/types.ts`

## 📝 Notes

- **UUID Generation**: Uses `uuid_generate_v4()` or `gen_random_uuid()`
- **Timestamps**: All tables have `created_at` and `updated_at` (where applicable)
- **Soft Deletes**: Not implemented - uses `ON DELETE CASCADE` for referential integrity
- **Schema**: All tables in `public` schema (except auth tables)
- **Enum Constraints**: Check constraints for fixed value lists (difficulty, status, priority, etc.)
