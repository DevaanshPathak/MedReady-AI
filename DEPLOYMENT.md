# MedReady AI - Deployment Guide

This guide will help you deploy MedReady AI to production in minutes.

## Prerequisites

Before deploying, ensure you have:
- ✅ A Vercel account (free tier works perfectly)
- ✅ A Supabase account with a new project created
- ✅ An OpenAI API key OR Vercel AI Gateway access
- ✅ This repository forked/cloned to your GitHub account

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and click "New Project"
3. Choose an organization and fill in project details:
   - **Name**: MedReady-AI
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" (takes ~2 minutes)

### 1.2 Set Up the Database

1. Once your project is ready, go to the **SQL Editor** in the sidebar
2. Click "New query"
3. Copy the entire content from `database-schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the schema
6. Verify tables were created by going to **Table Editor**

### 1.3 Get Your API Keys

1. Go to **Settings** → **API**
2. Copy and save these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 1.4 Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. **Optional**: Enable **Google OAuth**:
   - Go to Google Cloud Console
   - Create OAuth credentials
   - Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
4. **Optional**: Enable **GitHub OAuth**:
   - Go to GitHub Settings → Developer Settings → OAuth Apps
   - Create new OAuth App
   - Add callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
5. Customize email templates in **Email Templates** (optional)

## Step 2: Get AI Provider Access

### Option A: OpenAI (Direct)

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Name it "MedReady-AI"
5. Copy the key (you won't see it again!)
6. Add credits to your OpenAI account ($5-10 is plenty to start)

### Option B: Vercel AI Gateway

1. Go to your Vercel dashboard
2. Navigate to Storage → AI
3. Set up AI Gateway following Vercel's documentation
4. Copy your gateway URL
5. This allows you to monitor, cache, and control your AI API usage

**Note**: Choose one option based on your needs. Vercel AI Gateway provides additional features like caching, rate limiting, and analytics.

## Step 3: Deploy to Vercel

### 3.1 Connect Your Repository

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import the `MedReady-AI` repository
5. Click "Import"

### 3.2 Configure Environment Variables

In the "Configure Project" screen, add these environment variables:

**For OpenAI (Direct):**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...your-openai-key
```

**For Vercel AI Gateway:**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
AI_PROVIDER=vercel
VERCEL_AI_GATEWAY_URL=your-gateway-url
OPENAI_API_KEY=sk-...your-openai-key
```

**Important**: 
- Replace the values with your actual keys from Steps 1 and 2
- Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` start with `NEXT_PUBLIC_`
- The `OPENAI_API_KEY` and `AI_PROVIDER` should NOT have the `NEXT_PUBLIC_` prefix
- Set `AI_PROVIDER` to either `openai` or `vercel` depending on your choice

### 3.3 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. You'll get a URL like `https://medready-ai.vercel.app`
4. Click the URL to visit your deployed app!

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Click "Sign Up" and create a test account
3. Check your email for the confirmation link
4. Confirm your email
5. Log in
6. Try starting a quiz:
   - Select a topic (e.g., "Cardiology")
   - Choose difficulty (e.g., "Medium")
   - Click "Start Quiz"
7. Verify questions are generated
8. Complete the quiz and check the dashboard

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Your Domain

1. In Vercel project settings, go to **Domains**
2. Click "Add"
3. Enter your domain (e.g., `medready.ai`)
4. Follow the DNS configuration instructions

### 5.2 Update Supabase Redirect URLs

1. Go to Supabase **Authentication** → **URL Configuration**
2. Add your custom domain to:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: `https://yourdomain.com/**`

## Troubleshooting

### Build Fails

**Error**: "OPENAI_API_KEY is missing"
- **Solution**: Make sure you added the environment variable in Vercel without the `NEXT_PUBLIC_` prefix

**Error**: "supabaseUrl is required"
- **Solution**: Check that `NEXT_PUBLIC_SUPABASE_URL` is set correctly

### Authentication Issues

**Problem**: Email confirmations not working
- **Solution**: Check Supabase **Authentication** → **Email Templates** are configured
- **Solution**: Verify SMTP settings in Supabase if using custom email

**Problem**: Can't log in after signup
- **Solution**: Check Supabase **Authentication** → **Users** to see if user was created
- **Solution**: Verify email confirmation if enabled

### Quiz Generation Fails

**Problem**: Questions not generating
- **Solution**: Check OpenAI API key is valid and has credits
- **Solution**: View Vercel function logs for detailed error messages
- **Solution**: Check browser console for error messages

### Database Issues

**Problem**: Progress not saving
- **Solution**: Verify database schema was applied correctly
- **Solution**: Check Supabase **Table Editor** to see if tables exist
- **Solution**: Review RLS policies in SQL Editor

## Environment Variables Reference

| Variable | Required | Public | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | ✅ Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | ✅ Yes | Your Supabase anonymous key |
| `AI_PROVIDER` | ✅ Yes | ❌ No | AI provider to use: `openai` or `vercel` |
| `OPENAI_API_KEY` | ✅ Yes | ❌ No | Your OpenAI API key |
| `VERCEL_AI_GATEWAY_URL` | ⚠️ Conditional | ❌ No | Required when `AI_PROVIDER=vercel` |

## Performance Optimization

### 1. Enable Vercel Analytics

1. Go to your project in Vercel
2. Navigate to **Analytics** tab
3. Click "Enable"
4. Monitor performance metrics

### 2. Configure Caching

The app is already optimized for:
- Static page generation
- API route caching
- Image optimization

### 3. Monitor Costs

- **Vercel**: Free tier supports hobby projects (~100GB bandwidth)
- **Supabase**: Free tier includes 500MB database, 2GB bandwidth
- **OpenAI**: ~$0.001-0.002 per question generated (GPT-3.5-turbo)

**Estimated costs for 1000 monthly users**:
- Vercel: Free (within limits)
- Supabase: Free (within limits)
- OpenAI: $10-30/month (depending on usage)

## Security Checklist

- ✅ Environment variables are set correctly
- ✅ Supabase Row Level Security (RLS) policies are enabled
- ✅ OpenAI API key is kept secret (not in client-side code)
- ✅ CORS is configured properly
- ✅ User authentication is required for protected routes

## Monitoring and Maintenance

### Vercel Dashboard

Monitor:
- Deployment status
- Function executions
- Error rates
- Performance metrics

### Supabase Dashboard

Monitor:
- Database size
- API requests
- Active users
- Authentication logs

### OpenAI Usage

Monitor:
- API calls
- Token usage
- Costs
- Rate limits

## Scaling Considerations

When you reach these limits, consider upgrading:

**Free Tier Limits**:
- Vercel: 100GB bandwidth, 100GB-hours compute
- Supabase: 500MB database, 2GB bandwidth
- OpenAI: Rate limits apply

**Recommended Upgrades**:
1. **Vercel Pro** ($20/month): More bandwidth and compute
2. **Supabase Pro** ($25/month): 8GB database, 50GB bandwidth
3. **OpenAI Pay-as-you-go**: No limits, pay for usage

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Vercel deployment logs
3. Check Supabase logs
4. Review OpenAI API status
5. Open an issue on GitHub

## Next Steps

After deployment:

1. ✅ Share the app with friends for testing
2. ✅ Gather user feedback
3. ✅ Monitor analytics and usage
4. ✅ Add more features based on feedback
5. ✅ Consider upgrading plans as you grow

---

**Congratulations! Your MedReady AI app is now live! 🎉**

Share it with medical students and help them ace their exams!
