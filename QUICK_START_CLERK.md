# Quick Start Guide - Clerk Authentication

## 🚀 Get Started in 5 Minutes

This app now uses **Clerk** for authentication instead of Supabase. Follow these steps to get it running locally.

### Step 1: Clone & Install (2 min)

```bash
git clone https://github.com/DevaanshPathak/MedReady-AI.git
cd MedReady-AI
npm install
```

### Step 2: Set Up Clerk (2 min)

1. Go to [clerk.com](https://clerk.com) and sign up
2. Click **"Add application"**
3. Name it "MedReady-AI"
4. Click **"Create application"**
5. Copy your API keys from the dashboard

### Step 3: Configure Environment (1 min)

Create `.env.local` file:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
OPENAI_API_KEY=sk-your_openai_key_here
```

### Step 4: Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

## 🧪 Test Authentication

1. Click **"Sign Up"**
2. Enter your email and password
3. Check your email for verification code
4. Enter the code
5. You're logged in! 🎊

---

## 📚 Need More Help?

- **Detailed Setup**: See `CLERK_SETUP.md`
- **Migration Info**: See `MIGRATION_SUMMARY.md`
- **Deployment**: See `DEPLOYMENT.md`

---

## 🆘 Troubleshooting

**"Missing publishableKey" error?**
- Check your `.env.local` file exists
- Restart the dev server

**Email not arriving?**
- Check spam folder
- Try a different email address

**Still stuck?**
- Check [Clerk Docs](https://clerk.com/docs)
- Open an issue on GitHub

---

## ✨ What's Different from Supabase?

| Feature | Supabase | Clerk |
|---------|----------|-------|
| Email Verification | Email link | Email code |
| Setup | Database required | No database needed |
| Free Tier | 50K total users | 10K MAU |
| Integration | Custom hooks | Built-in React hooks |

Clerk is simpler and perfect for authentication! 🎯
