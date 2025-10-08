# Deployment Guide

This guide covers deploying the Escalation Portal to production.

## Architecture Overview

- **Frontend**: Static React app (Vercel/Netlify)
- **Backend**: Node.js API server (Render/AWS ECS/Railway)
- **Database**: PostgreSQL (AWS RDS/Render/Supabase)
- **Storage**: S3-compatible (AWS S3/DigitalOcean Spaces)

## Prerequisites

1. Domain name (optional but recommended)
2. AWS account or alternative hosting accounts
3. PostgreSQL database instance
4. S3-compatible storage bucket

## Option 1: Vercel (Frontend) + Render (Backend) + Render (Database)

This is the quickest option for production deployment.

### 1. Deploy Database (Render PostgreSQL)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **PostgreSQL**
3. Configure:
   - Name: `escalation-portal-db`
   - Database: `escalation_portal`
   - User: (auto-generated)
   - Region: Choose closest to users
   - Plan: Starter ($7/month) or higher
4. Click **Create Database**
5. Copy the **External Database URL** (you'll need this)

### 2. Run Migrations

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="your-render-database-url"

# Run migrations
cd backend
npm run migrate
npm run seed  # Optional: seed with demo data
```

### 3. Deploy Backend (Render Web Service)

1. Push code to GitHub
2. Go to Render Dashboard → **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - Name: `escalation-portal-api`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Starter ($7/month) or higher
5. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=(use Render PostgreSQL URL)
   JWT_SECRET=(generate a secure random string)
   CLERK_SECRET_KEY=(from Clerk dashboard)
   S3_BUCKET=your-bucket-name
   S3_REGION=us-east-1
   S3_ACCESS_KEY_ID=(from AWS)
   S3_SECRET_ACCESS_KEY=(from AWS)
   POSTMARK_API_KEY=(optional)
   SLACK_WEBHOOK_URL=(optional)
   ```
6. Click **Create Web Service**
7. Copy the deployed URL (e.g., `https://escalation-portal-api.onrender.com`)

### 4. Deploy Frontend (Vercel)

1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/)
3. Click **Import Project** → Connect GitHub
4. Select your repository
5. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   ```
   VITE_API_URL=https://escalation-portal-api.onrender.com
   VITE_CLERK_PUBLISHABLE_KEY=(from Clerk dashboard)
   ```
7. Click **Deploy**
8. Your app will be live at `https://your-project.vercel.app`

### 5. Configure Custom Domain (Optional)

**For Vercel (Frontend):**
1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS as instructed

**For Render (Backend):**
1. Go to Service Settings → Custom Domain
2. Add `api.yourdomain.com`
3. Update frontend `VITE_API_URL` environment variable

### 6. Configure Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Add your production URLs:
   - Frontend URL: `https://your-project.vercel.app`
   - Backend URL: `https://escalation-portal-api.onrender.com`
3. Update allowed redirect URLs
4. Copy production keys to environment variables

## Option 2: AWS (Full Stack)

### 1. Database (AWS RDS PostgreSQL)

```bash
# Create RDS instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier escalation-portal-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20
```

### 2. Backend (AWS ECS with Fargate)

1. Build Docker image:
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

2. Push to ECR and deploy via ECS (see AWS docs)

### 3. Frontend (S3 + CloudFront)

```bash
cd frontend
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Create CloudFront distribution pointing to S3 bucket
```

## Option 3: Railway (Easiest All-in-One)

1. Go to [Railway](https://railway.app/)
2. Create new project from GitHub
3. Railway auto-detects monorepo and creates services
4. Add PostgreSQL plugin
5. Configure environment variables
6. Deploy!

## Post-Deployment Checklist

- [ ] Database migrations ran successfully
- [ ] Backend health check returns 200 (`/health`)
- [ ] Frontend can connect to backend API
- [ ] Authentication works (Clerk login/logout)
- [ ] Test creating a ticket
- [ ] Test ticket workflow (create → resolve → reopen → close)
- [ ] File uploads work (if S3 configured)
- [ ] Email notifications work (if configured)
- [ ] Slack notifications work (if configured)
- [ ] SSL/TLS certificates are valid
- [ ] CORS is configured correctly
- [ ] Rate limiting is active
- [ ] Error monitoring configured (Sentry recommended)
- [ ] Backup strategy configured for database

## Monitoring & Logging

### Recommended Tools

1. **Error Tracking**: [Sentry](https://sentry.io/)
2. **Logs**: Render/Vercel built-in logs or [Logtail](https://logtail.com/)
3. **Uptime**: [UptimeRobot](https://uptimerobot.com/)
4. **Performance**: [Vercel Analytics](https://vercel.com/analytics)

### Add Sentry (Optional)

```bash
# Backend
npm install @sentry/node

# In backend/src/index.ts
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

```bash
# Frontend
npm install @sentry/react

# In frontend/src/main.tsx
import * as Sentry from '@sentry/react';
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

## Scaling Considerations

### Database
- Enable connection pooling (use `pgBouncer`)
- Add read replicas for high read traffic
- Regular backups and point-in-time recovery

### Backend
- Horizontal scaling (multiple instances)
- Add Redis for session storage and caching
- Use queue (Bull/BullMQ) for background jobs

### Frontend
- CDN already handled by Vercel/CloudFront
- Optimize images with next-gen formats
- Implement code splitting if bundle size grows

## Security Hardening

1. **Environment Variables**: Never commit secrets
2. **HTTPS**: Enforce SSL/TLS everywhere
3. **CORS**: Whitelist only production domains
4. **Rate Limiting**: Configure per environment
5. **Database**: Use strong passwords, limit access by IP
6. **Secrets Rotation**: Rotate JWT secret, API keys periodically
7. **Audit Logs**: Enable database query logging
8. **WAF**: Consider AWS WAF or Cloudflare for DDoS protection

## Backup & Recovery

### Database Backups

**Render PostgreSQL**: Automatic daily backups (included)

**AWS RDS**: 
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier escalation-portal-db \
  --backup-retention-period 7 \
  --apply-immediately
```

### Restore from Backup

```bash
# Render: Use dashboard to restore to point in time
# AWS: Use RDS snapshot restore
```

## Cost Estimates

### Small Scale (< 1000 tickets/month)
- **Render**: ~$21/month (Postgres + Web Service)
- **Vercel**: Free tier (Pro at $20/month for team features)
- **S3**: ~$1-5/month
- **Total**: ~$22-46/month

### Medium Scale (1000-10000 tickets/month)
- **Render**: ~$32/month (larger instances)
- **Vercel**: $20/month
- **S3**: ~$5-15/month
- **Total**: ~$57-67/month

## Support & Troubleshooting

Common issues:

1. **CORS errors**: Check `VITE_API_URL` and backend CORS config
2. **Database connection fails**: Verify `DATABASE_URL` and network access
3. **Authentication fails**: Check Clerk keys and allowed origins
4. **File uploads fail**: Verify S3 credentials and bucket permissions

For help, check:
- Application logs (Render/Vercel dashboards)
- Database logs
- Browser console errors
- Network tab in DevTools
