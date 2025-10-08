# 🚀 Quick Fix Guide - Get TestSprite Working

TestSprite found a critical issue: **Backend can't connect to database**.

Here's the fastest way to fix it:

---

## ⚡ 5-Minute Fix

### 1. Start PostgreSQL
```bash
brew services start postgresql@15
# Wait 3 seconds for it to start
sleep 3
```

### 2. Create Backend .env File
```bash
cat > "/Users/abcom/Downloads/KNOT/Escalation Portal/backend/.env" << 'EOF'
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:@localhost:5432/escalation_portal
JWT_SECRET=dev-secret-key-12345678
EOF
```

**Note:** If your PostgreSQL has a password, change `postgres:` to `postgres:yourpassword`

### 3. Setup Database
```bash
cd "/Users/abcom/Downloads/KNOT/Escalation Portal/backend"

# Create database
createdb escalation_portal

# Run migrations
npx tsx migrations/runner.ts

# Seed demo users
npx tsx src/scripts/seed.ts
```

Expected output:
```
✓ 001_initial_schema.sql (executed successfully)
✓ 002_seed_data.sql (executed successfully)
✅ All migrations completed successfully!

User created/updated: growth@example.com
User created/updated: ops@example.com
User created/updated: admin@example.com
✅ Database seeded successfully!
```

### 4. Restart Servers
```bash
cd "/Users/abcom/Downloads/KNOT/Escalation Portal"

# Kill existing servers
lsof -ti:3001 | xargs kill 2>/dev/null
lsof -ti:5173 | xargs kill 2>/dev/null

# Start fresh
npm run dev
```

### 5. Verify It Works
```bash
# Test backend health
curl http://localhost:3001/health

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"growth@example.com","password":"password123"}'
```

If you get a JWT token back, **you're ready!**

### 6. Re-run TestSprite
Your application is now ready for testing. TestSprite will automatically test:
- ✅ Authentication (login, RBAC)
- ✅ Ticket creation & lifecycle
- ✅ Search & filtering
- ✅ Activity timeline
- ✅ Form validation
- ✅ Security (SQL injection, XSS, JWT)
- ✅ UI responsiveness

---

## 🆘 Troubleshooting

### PostgreSQL Won't Start
```bash
# Check status
brew services list | grep postgresql

# Try different version
brew services start postgresql

# Or start manually
pg_ctl -D /usr/local/var/postgres start
```

### Migration Fails
```bash
# Check PostgreSQL is accepting connections
pg_isready

# Check database exists
psql -l | grep escalation_portal

# If database doesn't exist
createdb escalation_portal
```

### Backend Still Returns 500
```bash
# Check .env file exists
cat backend/.env

# Check database connection
psql postgresql://postgres:@localhost:5432/escalation_portal -c "SELECT COUNT(*) FROM users;"

# Should show 3 users
```

### Frontend Can't Connect
```bash
# Verify backend is running
curl http://localhost:3001/health

# Check frontend .env (optional)
# frontend/.env should have:
# VITE_API_URL=http://localhost:3001
```

---

## 📖 Demo Credentials

After seeding, use these to test:

| Role | Email | Password |
|------|-------|----------|
| **Growth** | growth@example.com | password123 |
| **Ops** | ops@example.com | password123 |
| **Admin** | admin@example.com | password123 |

---

## ✅ Success Checklist

Before running TestSprite again, verify:

- [ ] PostgreSQL is running (`pg_isready` shows success)
- [ ] Database exists (`psql -l | grep escalation_portal`)
- [ ] Backend .env file exists and has correct DATABASE_URL
- [ ] Migrations ran successfully (no errors)
- [ ] Seed script completed (3 users created)
- [ ] Backend responds to `/health` endpoint
- [ ] Login endpoint returns JWT token
- [ ] Frontend loads at http://localhost:5173
- [ ] You can manually login with demo credentials

---

## 🎯 What TestSprite Will Do Next

Once setup is complete, TestSprite will:

1. **Login as Growth user** and test ticket creation
2. **Login as Ops user** and test ticket resolution
3. **Test ticket lifecycle** (open → processed → resolved/reopened)
4. **Test search & filtering** across all fields
5. **Verify RBAC** (Growth can't resolve, Ops can't create)
6. **Test security** (SQL injection, XSS, invalid JWT)
7. **Test UI** (forms, validation, responsiveness)
8. **Generate detailed report** with screenshots and recordings

---

## 📊 Full Test Report

See the complete test report here:
`/Users/abcom/Downloads/KNOT/Escalation Portal/testsprite_tests/testsprite-mcp-test-report.md`

This includes:
- Detailed analysis of the issue
- All 15 test cases explained
- Expected vs actual results
- Recommendations for improvements
- Production readiness checklist

---

**Need Help?** Use Cursor AI to debug any errors - the `.cursorrules` file helps Cursor understand your project conventions.
