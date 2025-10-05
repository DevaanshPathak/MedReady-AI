# Clerk Authentication Setup Guide

This guide will help you set up Clerk authentication for the MedReady AI application.

## Quick Start

### 1. Create a Clerk Account

1. Go to [https://clerk.com](https://clerk.com)
2. Sign up for a free account
3. Verify your email address

### 2. Create an Application

1. From the Clerk dashboard, click **"Add application"**
2. Enter application details:
   - **Name**: MedReady-AI (or your preferred name)
   - **Environment**: Development (for testing) or Production
3. Click **"Create application"**

### 3. Configure Authentication Settings

#### Email Authentication

1. In your application dashboard, go to **"User & Authentication"** → **"Email, Phone, Username"**
2. Ensure **Email address** is enabled
3. Set it as **Required**
4. Enable **"Verify at sign-up"**

#### Password Settings

1. Under **"Email, Phone, Username"**, scroll to **Password**
2. Ensure password authentication is enabled
3. Configure password requirements:
   - Minimum length: 8 characters (recommended)
   - You can enable additional requirements as needed

#### Optional: Social Login

If you want to add social login options:
1. Go to **"User & Authentication"** → **"Social Connections"**
2. Enable providers like Google, GitHub, etc.
3. Follow the setup instructions for each provider

### 4. Get Your API Keys

1. In the sidebar, click **"API Keys"**
2. You'll see two keys:
   - **Publishable Key**: Starts with `pk_test_` (development) or `pk_live_` (production)
   - **Secret Key**: Starts with `sk_test_` (development) or `sk_live_` (production)

**Important**: 
- The Publishable Key is safe to use in client-side code
- The Secret Key must NEVER be exposed in client-side code or committed to version control

### 5. Set Up Environment Variables

Create a `.env.local` file in the root of your project:

```env
# Clerk API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI (if you're using AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note**: Replace the `xxxxx` with your actual keys from the Clerk dashboard.

### 6. Configure Clerk Settings (Optional)

#### Customize Appearance

1. Go to **"Customization"** → **"Theme"**
2. Customize colors, fonts, and branding to match your application

#### Set Up Email Templates

1. Go to **"Customization"** → **"Emails"**
2. Customize the verification email template
3. Add your brand logo and colors

#### Configure Paths

1. Go to **"Paths"**
2. Set custom URLs for authentication flows:
   - **Home URL**: `http://localhost:3000` (development)
   - **Sign-in URL**: `/auth/login`
   - **Sign-up URL**: `/auth/signup`
   - **After sign-in URL**: `/dashboard`
   - **After sign-up URL**: `/dashboard`

For production, update these URLs to your deployed domain (e.g., `https://yourapp.com`).

## Testing Authentication

### Local Development

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click **"Sign Up"** and create a test account:
   - Enter a valid email address
   - Create a password (minimum 8 characters)
   - Enter your name
   - Click **"Create Account"**

4. Check your email for the verification code

5. Enter the verification code to verify your email

6. You should be redirected to the dashboard

7. Test logging out and logging back in

### Production Deployment

When deploying to production (e.g., Vercel):

1. **Update Environment Variables**:
   - Use production keys (starting with `pk_live_` and `sk_live_`)
   - Set these in your deployment platform's environment variables

2. **Update Clerk Paths**:
   - In Clerk dashboard → **Paths**
   - Update URLs to your production domain
   - Example: `https://medready-ai.vercel.app`

3. **Switch to Production Instance**:
   - In Clerk dashboard, switch from Development to Production
   - Or create a separate production application

## Troubleshooting

### "Missing publishableKey" Error

**Problem**: Application shows error about missing Clerk key

**Solution**: 
1. Verify `.env.local` exists in project root
2. Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
3. Restart your development server after adding environment variables

### Email Verification Not Working

**Problem**: Verification emails not arriving

**Solution**:
1. Check spam/junk folder
2. In Clerk dashboard → **Emails**, verify email delivery settings
3. Try using a different email address
4. Check Clerk's email logs in the dashboard

### Redirect Issues

**Problem**: After login, user is not redirected properly

**Solution**:
1. Check that paths are configured correctly in Clerk dashboard
2. Verify middleware is set up correctly in `src/middleware.ts`
3. Ensure public routes are properly configured

### Session Issues

**Problem**: User session not persisting

**Solution**:
1. Check that ClerkProvider wraps your application in `src/app/layout.tsx`
2. Clear browser cookies and try again
3. Verify API keys are correct

## Security Best Practices

1. **Never commit API keys** to version control
   - Add `.env.local` to `.gitignore`
   - Use environment variables in deployment platforms

2. **Use different keys** for development and production
   - Development: `pk_test_*` and `sk_test_*`
   - Production: `pk_live_*` and `sk_live_*`

3. **Keep secret keys secure**
   - Never expose in client-side code
   - Only use on the server side

4. **Enable email verification**
   - Prevents fake accounts
   - Ensures valid user contact information

5. **Monitor authentication logs**
   - Check Clerk dashboard regularly
   - Watch for suspicious activity

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Support](https://clerk.com/support)

## Need Help?

If you encounter issues not covered in this guide:

1. Check the [Clerk Documentation](https://clerk.com/docs)
2. Search [Clerk's Discord Community](https://clerk.com/discord)
3. Open an issue on the [GitHub repository](https://github.com/DevaanshPathak/MedReady-AI/issues)
