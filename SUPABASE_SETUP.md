# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up/Login (free tier is perfect for this)
4. Click "New Project"
5. Fill in:
   - **Name:** Escalation Portal
   - **Database Password:** (choose a strong password, save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free
6. Click "Create new project"
7. Wait 1-2 minutes for project to initialize

## Step 2: Get Connection String

1. In your Supabase project dashboard:
2. Go to **Settings** (gear icon) → **Database**
3. Scroll down to **Connection string**
4. Select **Connection pooling** → **Transaction mode**
5. Copy the connection string (looks like):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set

ij9zWlF4yaMpV80S

## Step 3: Update Backend .env

Replace the DATABASE_URL in your backend/.env with your Supabase connection string.

## Step 4: Run Migrations

```bash
cd backend
npx tsx migrations/runner.ts
```

## Step 5: Seed Demo Users

```bash
npx tsx src/scripts/seed.ts
```

Done! Your app will now use Supabase.
