# Quick Setup Guide

Follow these steps to get the Escalation Portal running locally.

## Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 15+**
- **Git**

## Step 1: Install Dependencies

```bash
cd "/Users/abcom/Downloads/KNOT/Escalation Portal"
npm install
```

This installs dependencies for both backend and frontend (monorepo).

## Step 2: Database Setup

### Create Database

```bash
# Using psql
createdb escalation_portal

# Or using SQL
psql -U postgres -c "CREATE DATABASE escalation_portal;"
```

### Configure Database Connection

Create `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set your database URL:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/escalation_portal
```

### Run Migrations

```bash
cd backend
npm run migrate
```

This creates all tables, indexes, and functions.

### Seed Sample Data (Optional)

```bash
npm run seed
```

This creates demo users and sample tickets:
- **Growth**: `growth@example.com` / `password123`
- **Ops**: `ops@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`

## Step 3: Configure Environment Variables

### Backend Environment

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/escalation_portal
JWT_SECRET=your-secret-key-change-me

# Optional: Authentication (use without Clerk for demo)
# CLERK_SECRET_KEY=your-clerk-secret-key

# Optional: S3 Storage (not required for demo)
# S3_BUCKET=your-bucket-name
# S3_REGION=us-east-1
# S3_ACCESS_KEY_ID=your-access-key
# S3_SECRET_ACCESS_KEY=your-secret-key

# Optional: Notifications
# POSTMARK_API_KEY=your-postmark-key
# SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### Frontend Environment

Create `frontend/.env`:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001

# Optional: Clerk
# VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
```

## Step 4: Run Development Servers

### Option A: Run Both (Recommended)

```bash
# From root directory
npm run dev
```

This starts:
- Backend API on http://localhost:3001
- Frontend on http://localhost:5173

### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 5: Access the Application

Open http://localhost:5173 in your browser.

**Demo Login:**
- Email: `growth@example.com`
- Password: `password123`

## Project Structure

```
escalation-portal/
├── backend/                 # Express API
│   ├── src/
│   │   ├── config/         # Database, environment
│   │   ├── middleware/     # Auth, validation, errors
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   └── index.ts        # Server entry point
│   ├── migrations/         # SQL migrations
│   └── package.json
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── stores/         # State management
│   │   └── App.tsx
│   └── package.json
├── docs/                   # Documentation
└── package.json            # Root workspace
```

## Common Commands

### Development
```bash
npm run dev              # Run both backend and frontend
npm run dev:backend      # Run backend only
npm run dev:frontend     # Run frontend only
```

### Database
```bash
cd backend
npm run migrate          # Run migrations
npm run seed             # Seed demo data
```

### Build for Production
```bash
npm run build            # Build both
```

### Testing
```bash
npm test                 # Run all tests
```

## Troubleshooting

### Database Connection Error

**Problem:** `ECONNREFUSED` or connection timeout

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in `backend/.env`
3. Ensure database exists: `psql -l | grep escalation_portal`

### Port Already in Use

**Problem:** `EADDRINUSE` error

**Solution:**
```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill
```

### Frontend Can't Connect to Backend

**Problem:** API requests fail with network errors

**Solution:**
1. Verify backend is running on http://localhost:3001
2. Check `VITE_API_URL` in `frontend/.env`
3. Test backend directly: `curl http://localhost:3001/health`

### Login Fails

**Problem:** Invalid credentials or 401 error

**Solution:**
1. Verify you ran `npm run seed` in backend
2. Check backend logs for errors
3. Ensure JWT_SECRET is set in `backend/.env`
4. Try the demo credentials exactly as shown

### CORS Errors

**Problem:** Browser console shows CORS policy errors

**Solution:**
1. Check frontend URL is allowed in `backend/src/index.ts` CORS config
2. Restart backend server
3. Clear browser cache

## Next Steps

1. **Read the Documentation:**
   - [README.md](README.md) - Full project overview
   - [docs/deployment.md](docs/deployment.md) - Production deployment
   - [docs/api-spec.md](docs/api-spec.md) - API reference

2. **Customize:**
   - Update `.cursorrules` for your conventions
   - Modify issue types and expected outputs in the schema
   - Add your branding and colors in Tailwind config

3. **Add Features:**
   - File upload integration with S3
   - Email notifications with Postmark
   - Slack integration for urgent tickets
   - Metrics dashboard
   - Advanced search and filters

4. **Deploy to Production:**
   - Follow [deployment.md](docs/deployment.md)
   - Set up monitoring and logging
   - Configure backups

## Getting Help

- Check the [README.md](README.md) for detailed documentation
- Review API endpoints in [docs/api-spec.md](docs/api-spec.md)
- Use Cursor AI to generate new features or fix issues
- The `.cursorrules` file helps Cursor understand the project conventions

## Development Tips with Cursor

This project is optimized for Cursor AI development:

1. **Generate Endpoints:**
   ```
   "Add a new API endpoint to bulk update ticket priorities"
   ```

2. **Create Components:**
   ```
   "Create a metrics dashboard component showing ticket statistics"
   ```

3. **Write Tests:**
   ```
   "Generate unit tests for the ticketService"
   ```

4. **Database Changes:**
   ```
   "Add a migration to include SLA deadline fields"
   ```

The `.cursorrules` file ensures Cursor follows project conventions for database naming, security, and code style.
