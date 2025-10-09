# Production Deployment Checklist

## ✅ Completed

- [x] Removed demo credentials from login page
- [x] Removed debug console.log statements
- [x] Implemented bidirectional workflow (Growth ↔ Ops)
- [x] Added proper role-based access control

## 🔒 Security Review

### Environment Variables
Before deploying to production, ensure all sensitive credentials are in environment variables:

#### Backend (`backend/.env`)
```bash
# Database
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT Secret (CHANGE THIS!)
JWT_SECRET=generate_a_strong_random_secret_here

# Storage (AWS S3 or Supabase)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name

# OR for Supabase Storage:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STORAGE_BUCKET=attachments

# Server Config
PORT=5000
NODE_ENV=production
```

#### Frontend (`frontend/.env.production`)
```bash
VITE_API_URL=https://your-production-api-domain.com
```

### 1. Change Default User Passwords

**CRITICAL**: Change or remove the demo users from your database:

```sql
-- Option 1: Delete demo users
DELETE FROM users WHERE email IN ('admin@example.com', 'growth@example.com', 'ops@example.com');

-- Option 2: Change their passwords
-- Use the backend to hash passwords properly, don't set them directly
```

Create real users via the admin interface after deploying.

### 2. JWT Secret

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add it to your `.env` file.

### 3. Database Security

- [ ] Ensure Row Level Security (RLS) is enabled in Supabase
- [ ] Review and tighten database policies
- [ ] Enable connection pooling
- [ ] Set up database backups

### 4. API Security

- [ ] Enable CORS only for your production frontend domain
- [ ] Set rate limiting (already implemented)
- [ ] Enable HTTPS only
- [ ] Review all API endpoints for authentication

### 5. File Storage

- [ ] Verify file upload size limits (currently 20MB)
- [ ] Ensure S3 bucket is private (not public)
- [ ] Set up signed URLs with expiration
- [ ] Configure proper CORS for S3

## 🚀 Deployment Steps

### Backend Deployment

1. **Build the backend:**
   ```bash
   cd backend
   npm run build
   ```

2. **Set environment variables** on your hosting platform (Heroku, Railway, Render, etc.)

3. **Run database migrations:**
   ```bash
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Update API URL** in `frontend/.env.production`

2. **Build the frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy the `dist` folder** to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Your own server with nginx

## 📊 Monitoring

### Add Logging Service
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor API response times
- [ ] Track failed login attempts
- [ ] Monitor file storage usage

### Health Checks
- [ ] Add `/health` endpoint to backend
- [ ] Set up uptime monitoring
- [ ] Configure alerts for downtime

## 🔐 Additional Security Hardening

### Headers
Add security headers to your backend:
```typescript
// In backend/src/index.ts
app.use(helmet()); // Already added if using helmet package
```

### HTTPS
- [ ] Enforce HTTPS in production
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Add HSTS header

### Data Protection
- [ ] Implement data retention policies
- [ ] Set up audit logging for sensitive operations
- [ ] Ensure GDPR compliance if needed

## 📝 Documentation

- [ ] Update README with production setup instructions
- [ ] Document API endpoints
- [ ] Create user guides for Growth/Ops teams
- [ ] Document backup and recovery procedures

## 🧪 Pre-Production Testing

- [ ] Test all user roles (Admin, Growth, Ops)
- [ ] Verify bidirectional ticket flow
- [ ] Test file upload/download
- [ ] Test file deletion with OTP approval
- [ ] Verify email notifications work (if implemented)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

## 🗑️ Cleanup

- [ ] Remove any test/demo data from database
- [ ] Remove debugging files
- [ ] Clean up unused npm packages
- [ ] Remove console.log statements (✅ Done)

## 📞 Support

Document how users can get help:
- IT support contact
- Bug reporting process
- Feature request process

---

**Last Updated:** After removing demo credentials
**Status:** Ready for production deployment after completing the security checklist above

