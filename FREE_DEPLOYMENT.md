# 🆓 100% FREE Deployment Guide

## Stack Overview
- ✅ **Database**: Supabase (FREE - already configured)
- 🚀 **Backend**: Render Free Tier (750 hours/month)
- 🌐 **Frontend**: Vercel (FREE - unlimited)

**Total Cost: $0/month** 🎉

---

## 📋 Pre-Deployment Checklist

- [x] Supabase database configured
- [x] Code pushed to GitHub
- [ ] Migrations run on Supabase
- [ ] Backend deployed on Render
- [ ] Frontend deployed on Vercel

---

## Step 1: Ensure Migrations Are Run (Already Done?)

If you haven't run migrations on Supabase yet:

```bash
cd backend
export DATABASE_URL="your-supabase-connection-string"
npm run migrate
npm run seed  # Creates demo users
```

---

## Step 2: Deploy Backend to Render (FREE)

### A. Create Render Account
1. Go to https://render.com/
2. Sign up with GitHub (it's free!)

### B. Create Web Service
1. Click **New** → **Web Service**
2. Connect your GitHub repository: `DhavalFatnani/escalation-portal`
3. Configure:
   - **Name**: `escalation-portal-api` (or any name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** ⭐

### C. Add Environment Variables (Critical!)

Click **Advanced** → **Add Environment Variable**:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<your-supabase-connection-string>
JWT_SECRET=<generate-using-command-below>
FRONTEND_URL=<will-add-after-vercel-deployment>
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as JWT_SECRET value.

### D. Deploy!
1. Click **Create Web Service**
2. Wait 3-5 minutes for first deployment
3. Copy your backend URL (e.g., `https://escalation-portal-api.onrender.com`)
4. Test it: Open `https://your-backend-url.onrender.com/health` - should show `{"status":"ok"}`

⚠️ **Important**: Free tier sleeps after 15 min of inactivity. First request takes ~30 seconds to wake up.

---

## Step 3: Deploy Frontend to Vercel (FREE)

### A. Create Vercel Account
1. Go to https://vercel.com/
2. Sign up with GitHub (free!)

### B. Import Project
1. Click **Add New** → **Project**
2. Import your GitHub repo: `DhavalFatnani/escalation-portal`
3. Configure:
   - **Framework Preset**: Vite (auto-detected)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### C. Add Environment Variables

Click **Environment Variables**:

```env
VITE_API_URL=https://your-render-backend-url.onrender.com
```

Replace with your actual Render backend URL from Step 2.

### D. Deploy!
1. Click **Deploy**
2. Wait 2-3 minutes
3. Your app will be live at: `https://your-project.vercel.app`

---

## Step 4: Update Backend CORS

Now that you have your Vercel URL, go back to Render:

1. Go to your Render service dashboard
2. Click **Environment** tab
3. Edit `FRONTEND_URL` environment variable
4. Set it to your Vercel URL: `https://your-project.vercel.app`
5. Click **Save Changes** (this will redeploy)

---

## Step 5: Test Your Deployment! 🎉

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Login with demo credentials:
   - Email: `growth@example.com`
   - Password: `password123`
3. Try creating a ticket
4. Test the workflow!

---

## 🔧 Optional: Custom Domain (Still FREE!)

### For Frontend (Vercel):
1. Go to Project Settings → Domains
2. Add your domain (e.g., `escalation.yourdomain.com`)
3. Update DNS as instructed by Vercel
4. FREE SSL certificate auto-configured!

### For Backend (Render):
1. Not available on free tier
2. Stick with Render's subdomain (it's fine!)

---

## 📊 Free Tier Limits

| Service | Limit | Enough For |
|---------|-------|------------|
| **Supabase** | 500MB storage, 2GB bandwidth | ~50,000 tickets |
| **Render** | 750 hours/month, sleeps after 15min | Unlimited requests |
| **Vercel** | 100GB bandwidth | ~1M page views |

**Verdict**: Perfect for personal use, small teams, or MVP! 🎯

---

## 🚨 Troubleshooting

### Backend Returns 503/504
- **Cause**: Service is sleeping (free tier limitation)
- **Solution**: Wait 30 seconds, refresh. First request wakes it up.

### CORS Errors
- **Check**: `FRONTEND_URL` in Render matches your Vercel URL exactly
- **Fix**: Update in Render → Environment → Save (triggers redeploy)

### Cannot Login
- **Check**: Database migrations ran successfully
- **Fix**: Run `npm run seed` in backend with Supabase DATABASE_URL

### Frontend Shows "Network Error"
- **Check**: `VITE_API_URL` in Vercel matches your Render backend URL
- **Fix**: Update in Vercel → Settings → Environment Variables → Redeploy

---

## 🎯 Quick Reference

### Your Deployment URLs

```
Frontend: https://____________.vercel.app
Backend:  https://____________.onrender.com
Database: Supabase (managed)
```

### Demo Login Credentials

```
Growth User:
- Email: growth@example.com
- Password: password123

Ops User:
- Email: ops@example.com
- Password: password123

Admin:
- Email: admin@example.com
- Password: password123
```

---

## 🔄 Continuous Deployment (Already Setup!)

Both Vercel and Render auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Automatic deployments trigger:
# - Render rebuilds backend (~3 min)
# - Vercel rebuilds frontend (~2 min)
```

---

## 📈 When to Upgrade

Consider paid tiers when:
- **Backend** needs to be always-on (no sleep) → Render Starter $7/mo
- **Database** grows beyond 500MB → Supabase Pro $25/mo
- **Traffic** exceeds free limits → Unlikely for escalation portal

---

## 🎓 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

**Estimated Setup Time**: 15-20 minutes
**Total Cost**: $0 💰
**Your app is production-ready!** 🚀

