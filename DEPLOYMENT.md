# MedReady AI - Deployment Guide

This guide will help you deploy MedReady AI to production in minutes.

## Prerequisites

Before deploying, ensure you have:
- ✅ A Vercel account (free tier works perfectly)
- ✅ A Clerk account for authentication
- ✅ An OpenAI API key
- ✅ This repository forked/cloned to your GitHub account

## Step 1: Set Up Clerk Authentication

### 1.1 Create a Clerk Application

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up or sign in to your account
3. Click "Add application"
4. Fill in application details:
   - **Name**: MedReady-AI
   - **Application type**: Choose "Development" for testing
5. Click "Create application"

### 1.2 Configure Authentication Settings

1. In your Clerk dashboard, go to **Email, Phone, Username**
2. Enable **Email address** (required)
3. Configure password requirements:
   - Minimum length: 8 characters (recommended)
   - Enable email verification
4. Optionally enable social login providers (Google, GitHub, etc.)

### 1.3 Get Your API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy and save these values:
   - **Publishable Key** (starts with `pk_test_...` or `pk_live_...`)
   - **Secret Key** (starts with `sk_test_...` or `sk_live_...`)

**Important**: Keep your Secret Key secure and never expose it in client-side code!

## Step 2: Get OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Name it "MedReady-AI"
5. Copy the key (you won't see it again!)
6. Add credits to your OpenAI account ($5-10 is plenty to start)

## Step 3: Deploy to Vercel

### 3.1 Connect Your Repository

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Import the `MedReady-AI` repository
5. Click "Import"

### 3.2 Configure Environment Variables

In the "Configure Project" screen, add these environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...your-publishable-key
CLERK_SECRET_KEY=sk_test_...your-secret-key
OPENAI_API_KEY=sk-...your-openai-key
```

**Important**: 
- Replace the values with your actual keys from Steps 1 and 2
- Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `NEXT_PUBLIC_`
- The `CLERK_SECRET_KEY` and `OPENAI_API_KEY` should NOT have the `NEXT_PUBLIC_` prefix

### 3.3 Deploy

1. Click "Deploy"
2. Wait 2-3 minutes for the build to complete
3. You'll get a URL like `https://medready-ai.vercel.app`
4. Click the URL to visit your deployed app!

## Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Click "Sign Up" and create a test account
3. Enter your name, email, and password
4. Check your email for the verification code
5. Enter the verification code to confirm your email
6. You'll be automatically logged in and redirected to the dashboard
7. Try starting a quiz:
   - Select a topic (e.g., "Cardiology")
   - Choose difficulty (e.g., "Medium")
   - Click "Start Quiz"
8. Verify questions are generated
9. Complete the quiz and check the dashboard

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Your Domain

1. In Vercel project settings, go to **Domains**
2. Click "Add"
3. Enter your domain (e.g., `medready.ai`)
4. Follow the DNS configuration instructions

### 5.2 Update Clerk Redirect URLs

1. Go to Clerk dashboard → **Paths**
2. Add your custom domain URLs:
   - **Home URL**: `https://yourdomain.com`
   - **Sign-in URL**: `https://yourdomain.com/auth/login`
   - **Sign-up URL**: `https://yourdomain.com/auth/signup`
   - **After sign-in URL**: `https://yourdomain.com/dashboard`
   - **After sign-up URL**: `https://yourdomain.com/dashboard`

## Troubleshooting

### Build Fails

**Error**: "OPENAI_API_KEY is missing"
- **Solution**: Make sure you added the environment variable in Vercel without the `NEXT_PUBLIC_` prefix

**Error**: "Missing publishableKey"
- **Solution**: Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly and starts with `NEXT_PUBLIC_`

### Authentication Issues

**Problem**: Email verifications not working
- **Solution**: Check Clerk **Email, Phone, Username** settings to ensure email verification is enabled
- **Solution**: Verify email delivery in Clerk's **Emails** section

**Problem**: Can't log in after signup
- **Solution**: Check Clerk **Users** dashboard to see if user was created
- **Solution**: Verify email verification code was entered correctly
- **Solution**: Check browser console for error messages

### Quiz Generation Fails

**Problem**: Questions not generating
- **Solution**: Check OpenAI API key is valid and has credits
- **Solution**: View Vercel function logs for detailed error messages
- **Solution**: Check browser console for error messages

## Environment Variables Reference

| Variable | Required | Public | Description |
|----------|----------|--------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ Yes | ✅ Yes | Your Clerk publishable key |
| `CLERK_SECRET_KEY` | ✅ Yes | ❌ No | Your Clerk secret key |
| `OPENAI_API_KEY` | ✅ Yes | ❌ No | Your OpenAI API key |

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
- **Clerk**: Free tier includes up to 10,000 monthly active users
- **OpenAI**: ~$0.001-0.002 per question generated (GPT-3.5-turbo)

**Estimated costs for 1000 monthly users**:
- Vercel: Free (within limits)
- Clerk: Free (within limits)
- OpenAI: $10-30/month (depending on usage)

## Security Checklist

- ✅ Environment variables are set correctly
- ✅ Clerk authentication is properly configured
- ✅ Secret keys are kept secure (not in client-side code)
- ✅ Email verification is enabled in Clerk
- ✅ User authentication is required for protected routes

## Monitoring and Maintenance

### Vercel Dashboard

Monitor:
- Deployment status
- Function executions
- Error rates
- Performance metrics

### Clerk Dashboard

Monitor:
- Active users
- Sign-up and sign-in metrics
- Authentication logs
- Email delivery status

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
- Clerk: 10,000 monthly active users
- OpenAI: Rate limits apply

**Recommended Upgrades**:
1. **Vercel Pro** ($20/month): More bandwidth and compute
2. **Clerk Pro** ($25/month): 100,000 monthly active users, advanced features
3. **OpenAI Pay-as-you-go**: No limits, pay for usage

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Vercel deployment logs
3. Check Clerk dashboard for authentication errors
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
