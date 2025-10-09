# Vercel Deployment Guide

## ✅ Fixed TypeScript Issues

The following issues have been resolved:
- ✅ Installed `@types/multer` package
- ✅ Fixed type definitions in `storage.ts`
- ✅ Extended `AuthRequest` interface to support multer files
- ✅ Build now compiles successfully

## 🚀 Deploy to Vercel

### Option 1: Deploy Backend Only (Recommended for API)

**Note**: Vercel is optimized for serverless functions. For a long-running Express server with WebSocket/file uploads, consider alternatives like Railway, Render, or Heroku.

If you still want to use Vercel:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Production ready - Fixed TypeScript issues"
   git push origin main
   ```

2. **Deploy Backend**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Other
     - **Root Directory**: `backend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables** in Vercel dashboard:
   ```
   DATABASE_URL=your_supabase_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

### Option 2: Better Alternatives for Express Backend

#### Railway (Recommended ⭐)
- Better for long-running Node.js servers
- Easy PostgreSQL integration
- Great for file uploads

**Deploy to Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

#### Render
- Free tier available
- Great for Node.js + PostgreSQL
- Persistent file storage available

**Deploy to Render:**
1. Connect GitHub repo
2. Create new Web Service
3. Set root directory to `backend`
4. Build: `npm install && npm run build`
5. Start: `npm start`

#### Heroku
- Reliable and well-documented
- Easy database management
- Good for production workloads

**Deploy to Heroku:**
```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel - Perfect for this!)

Frontend works great on Vercel:

1. **Create `frontend/.env.production`**:
   ```
   VITE_API_URL=https://your-backend-domain.com
   ```

2. **Deploy Frontend to Vercel**:
   - New Project → Import your repo
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Demo users removed or password changed
- [ ] JWT_SECRET is a strong random string
- [ ] CORS configured for your frontend domain
- [ ] Test API endpoints after deployment
- [ ] Verify file uploads work
- [ ] Test authentication flow
- [ ] Check ticket creation/resolution flow

## 🔧 Post-Deployment

### Test Your API
```bash
# Health check (add this endpoint if not present)
curl https://your-api-domain.com/health

# Test auth
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### Monitor Your App
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Check database connection pool
- Watch for failed uploads

## ⚠️ Important Notes

1. **File Uploads on Serverless**: Vercel has 50MB max payload. For large files, consider:
   - Direct upload to Supabase Storage from frontend
   - Use Railway/Render for backend

2. **WebSockets**: Not supported on Vercel. Use Railway/Render if you add real-time features.

3. **Execution Time**: Vercel functions timeout after 10s (Hobby) or 60s (Pro). For long-running operations, use a different platform.

4. **Database Connections**: Use connection pooling (Supabase handles this automatically).

## 🎯 Recommended Setup

**For Production:**
- **Backend**: Railway or Render
- **Frontend**: Vercel or Netlify
- **Database**: Supabase (already configured)
- **File Storage**: Supabase Storage (already configured)

This gives you:
- ✅ Fast, CDN-backed frontend
- ✅ Reliable backend with no timeout limits
- ✅ Managed database with backups
- ✅ Scalable file storage

## 📞 Need Help?

If deployment fails:
1. Check build logs in Vercel/Railway dashboard
2. Verify all environment variables are set
3. Ensure database is accessible from deployed server
4. Test database connection with migration command

---

**Status**: TypeScript issues fixed ✅  
**Build**: Compiles successfully ✅  
**Ready**: Deploy backend to Railway/Render, frontend to Vercel ✅
